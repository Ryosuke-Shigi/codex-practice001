"""Canonical Task Contract construction and safe deterministic projections."""

from __future__ import annotations

import copy
import fnmatch
import hashlib
import json
import re
from pathlib import PurePosixPath
from typing import Any, Mapping, Sequence


SCHEMA_VERSION = "1.0"
CANONICAL_TASK_FIELDS = (
    "task_id",
    "title",
    "goal",
    "background",
    "current_state",
    "desired_state",
    "scope",
    "non_goals",
    "acceptance_criteria",
    "constraints",
    "source_of_truth",
    "allowed_paths",
    "forbidden_paths",
    "affected_domains",
    "risk_level",
    "required_capabilities",
    "team_assignment",
    "primary_writer",
    "consulting_specialists",
    "reviewer",
    "verifier",
    "write_ownership",
    "required_checks",
    "stop_conditions",
    "retry_conditions",
    "approval_boundaries",
    "required_deliverables",
    "information_source_sync",
    "completion_conditions",
)
_REQUIRED_NON_EMPTY_LISTS = {
    "non_goals",
    "acceptance_criteria",
    "constraints",
    "source_of_truth",
    "allowed_paths",
    "forbidden_paths",
    "affected_domains",
    "required_checks",
    "stop_conditions",
    "retry_conditions",
    "approval_boundaries",
    "required_deliverables",
    "completion_conditions",
    "write_ownership",
}
_STRING_FIELDS = {
    "task_id",
    "title",
    "goal",
    "background",
    "current_state",
    "desired_state",
    "risk_level",
    "primary_writer",
    "reviewer",
    "verifier",
}
_OBJECT_FIELDS = {"scope", "team_assignment", "information_source_sync"}
_LIST_FIELDS = set(CANONICAL_TASK_FIELDS) - _STRING_FIELDS - _OBJECT_FIELDS
_SESSION_ID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I)
_PERSONAL_PATH = re.compile(
    r"(?<![-A-Za-z0-9._/\\~])"
    r"(?:/home/[^/\s]+(?:/|$)|/Users/[^/\s]+(?:/|$)|/mnt/[a-z]/Users/|[A-Za-z]:[\\/]Users[\\/])",
    re.I,
)
_SECRET_KEYS = {
    "app_key",
    "api_key",
    "apikey",
    "aws_access_key_id",
    "aws_secret_access_key",
    "access_token",
    "authorization",
    "client_secret",
    "password",
    "private_key",
    "secret",
    "token",
}
_COMPACT_SECRET_KEYS = {key.replace("_", "") for key in _SECRET_KEYS} | {
    "passwordhash",
    "privatekey",
    "secretkey",
    "sessionid",
}
_COMPACT_SECRET_SUFFIXES = ("password", "secret", "token")
_SECRET_TEXT = re.compile(
    r"(?:app[_-]?key|api[_-]?key|aws[_-]?(?:access|secret)[_-]?key|access[_-]?token|"
    r"authorization|client[_-]?secret|password|private[_-]?key|secret|token)"
    r"[\"']?\s*[:=]\s*[\"']?\S+",
    re.I,
)
_PRIVATE_KEY_MARKERS = {"password", "secret", "session", "token", "private"}
_MACHINE_ID = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
_BUILTIN_DELIVERABLES = {"implementation", "verification report", "review report"}
_BUILTIN_COMPLETION = {"initial and final verification/review pass"}
_BUILTIN_RETRY = {"changed input, diff, or environment evidence"}


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def digest(value: Any) -> str:
    return "sha256:" + hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def valid_digest(value: Any) -> bool:
    return isinstance(value, str) and re.fullmatch(r"sha256:[0-9a-f]{64}", value) is not None


def stable_run_id(idempotency_key: str) -> str:
    return "run-" + hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest()[:20]


def normalize_path(path: str) -> str:
    candidate = str(path).replace("\\", "/")
    pure = PurePosixPath(candidate)
    if not candidate or pure.is_absolute() or re.match(r"^[A-Za-z]:/", candidate) or ".." in pure.parts:
        raise ValueError("path traversal or absolute path is forbidden")
    normalized = pure.as_posix()
    if normalized in {"", "."}:
        raise ValueError("empty project path is forbidden")
    return normalized


def forbidden_path(path: str) -> bool:
    lowered = path.lower()
    return (
        lowered == ".git"
        or lowered.startswith(".git/")
        or lowered == ".env"
        or lowered.startswith(".env.")
        or lowered in {"auth.json", "credentials.json"}
    )


def _canonical_mapping_key_tokens(key: Any) -> tuple[str, ...]:
    """Split separators, camel case, Pascal case, and acronym boundaries."""

    raw = str(key)
    acronym_split = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1_\2", raw)
    camel_split = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", acronym_split)
    return tuple(
        part
        for part in re.sub(r"[^A-Za-z0-9]+", "_", camel_split)
        .lower()
        .strip("_")
        .split("_")
        if part
    )


def sensitive_reason(value: Any) -> str | None:
    """Classify private data without returning or retaining its value."""

    if isinstance(value, Mapping):
        for key, item in value.items():
            raw_key = str(key)
            key_parts = _canonical_mapping_key_tokens(raw_key)
            normalized_key = "_".join(key_parts)
            compact_key = "".join(key_parts)
            if (
                normalized_key in _SECRET_KEYS
                or normalized_key.endswith(("_password", "_secret", "_token"))
                or compact_key in _COMPACT_SECRET_KEYS
                or compact_key.endswith(_COMPACT_SECRET_SUFFIXES)
            ):
                return "structured_secret"
            if any(part in _PRIVATE_KEY_MARKERS for part in key_parts):
                return "structured_private_key"
            if _SESSION_ID.search(raw_key):
                return "raw_session_id_key"
            if _PERSONAL_PATH.search(raw_key):
                return "personal_absolute_path_key"
            if _SECRET_TEXT.search(raw_key) or "-----begin private key-----" in raw_key.lower():
                return "secret_key_name"
            reason = sensitive_reason(item)
            if reason:
                return reason
        return None
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        for item in value:
            reason = sensitive_reason(item)
            if reason:
                return reason
        return None
    if not isinstance(value, str):
        return None
    if _SESSION_ID.search(value):
        return "raw_session_id"
    if _PERSONAL_PATH.search(value):
        return "personal_absolute_path"
    if _SECRET_TEXT.search(value) or "-----begin private key-----" in value.lower():
        return "secret_value"
    return None


def build_task_contract(task: Mapping[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]]]:
    raw = copy.deepcopy(task.get("task_contract", {}))
    blockers: list[dict[str, str]] = []
    if not isinstance(raw, Mapping):
        return {}, [_problem("missing_spec", "task contract must be an object")]
    from .schema import validate_document

    if validate_document("task_contract_input", raw):
        blockers.append(
            _problem("contract_schema_invalid", "task contract does not match the canonical closed schema")
        )
    unknown = sorted(set(raw) - set(CANONICAL_TASK_FIELDS))
    if unknown:
        blockers.append(_problem("unknown_contract_field", "task contract contains unknown fields"))
    for field in CANONICAL_TASK_FIELDS:
        if field not in raw:
            blockers.append(_problem("missing_spec", f"task contract requires {field}"))

    contract: dict[str, Any] = {"schema_version": SCHEMA_VERSION}
    for field in CANONICAL_TASK_FIELDS:
        value = copy.deepcopy(raw.get(field))
        if field in _STRING_FIELDS:
            if not isinstance(value, str) or not value.strip():
                blockers.append(_problem("missing_spec", f"task contract requires non-empty {field}"))
                value = "" if value is None else str(value)
            else:
                value = value.strip()
        elif field in _OBJECT_FIELDS:
            if not isinstance(value, Mapping):
                blockers.append(_problem("invalid_contract_type", f"task contract {field} must be an object"))
                value = {}
            else:
                value = dict(value)
        else:
            if not isinstance(value, list):
                blockers.append(_problem("invalid_contract_type", f"task contract {field} must be an array"))
                value = []
            elif field in _REQUIRED_NON_EMPTY_LISTS and not value:
                code = "empty_scope" if field == "allowed_paths" else "missing_spec"
                blockers.append(_problem(code, f"task contract {field} must not be empty"))
        contract[field] = value

    normalized_paths: list[str] = []
    for raw_path in contract.get("allowed_paths", []):
        try:
            path = normalize_path(str(raw_path))
        except ValueError:
            blockers.append(_problem("path_traversal", "task scope contains an unsafe path"))
            continue
        normalized_paths.append(path)
        if forbidden_path(path):
            blockers.append(_problem("forbidden_path", "task scope contains a forbidden path"))
    contract["allowed_paths"] = normalized_paths
    normalized_forbidden: list[str] = []
    for raw_path in contract.get("forbidden_paths", []):
        try:
            normalized_forbidden.append(normalize_path(str(raw_path)))
        except ValueError:
            blockers.append(_problem("path_traversal", "forbidden scope contains an unsafe path"))
    contract["forbidden_paths"] = normalized_forbidden
    scope = contract.get("scope", {})
    if isinstance(scope, dict):
        included = scope.get("include")
        if included != contract["allowed_paths"]:
            blockers.append(_problem("scope_mismatch", "scope.include must equal allowed_paths"))
        raw_excluded = scope.get("exclude", [])
        normalized_excluded: list[str] = []
        if isinstance(raw_excluded, list):
            for raw_path in raw_excluded:
                try:
                    normalized_excluded.append(normalize_path(str(raw_path)))
                except ValueError:
                    blockers.append(
                        _problem("path_traversal", "scope.exclude contains an unsafe path")
                    )
            if "exclude" in scope:
                scope["exclude"] = normalized_excluded
        if any(
            fnmatch.fnmatch(path, pattern) or path == pattern
            for path in contract["allowed_paths"]
            for pattern in normalized_excluded
        ):
            blockers.append(
                _problem("scope_contradiction", "scope include and exclude contradict")
            )
    if contract.get("risk_level") not in {"low", "medium", "high", "critical"}:
        blockers.append(_problem("invalid_risk", "task contract risk_level is unsupported"))
    if any(
        fnmatch.fnmatch(path, pattern) or path == pattern
        for path in contract.get("allowed_paths", [])
        for pattern in contract.get("forbidden_paths", [])
    ):
        blockers.append(_problem("scope_contradiction", "allowed and forbidden paths contradict"))
    assignment = contract.get("team_assignment", {})
    if assignment.get("mode") not in {"dynamic", "fixed"}:
        blockers.append(_problem("assignment_invalid", "team assignment mode must be dynamic or fixed"))
    information_sync = contract.get("information_source_sync", {})
    if set(information_sync) != {"required", "manual_activation"} or not all(
        isinstance(information_sync.get(key), bool) for key in ("required", "manual_activation")
    ):
        blockers.append(_problem("invalid_contract_type", "information source sync contract is invalid"))
    if any(not isinstance(item, str) or _MACHINE_ID.fullmatch(item) is None for item in contract.get("required_checks", [])):
        blockers.append(_problem("condition_not_machine_checkable", "required checks must use machine-checkable ids"))
    if any(
        not isinstance(item, str)
        or (item not in _BUILTIN_DELIVERABLES and _MACHINE_ID.fullmatch(item) is None)
        for item in contract.get("required_deliverables", [])
    ):
        blockers.append(
            _problem("condition_not_machine_checkable", "required deliverables must use canonical names or ids")
        )
    if any(
        not isinstance(item, str)
        or (
            item not in _BUILTIN_COMPLETION
            and re.fullmatch(r"[a-z0-9][a-z0-9._-]* artifact exists", item) is None
        )
        for item in contract.get("completion_conditions", [])
    ):
        blockers.append(
            _problem("condition_not_machine_checkable", "completion conditions must use canonical receipt predicates")
        )
    if any(
        not isinstance(item, str)
        or (item not in _BUILTIN_RETRY and re.fullmatch(r"receipt:[a-z0-9][a-z0-9._-]*", item) is None)
        for item in contract.get("retry_conditions", [])
    ):
        blockers.append(
            _problem("condition_not_machine_checkable", "retry conditions must use the strict receipt predicate")
        )
    ownership = contract.get("write_ownership", [])
    if isinstance(ownership, list):
        for item in ownership:
            if not isinstance(item, Mapping) or not isinstance(item.get("owner"), str) or not item.get("owner"):
                blockers.append(_problem("ownership_invalid", "write ownership owner is required"))
                continue
            item_paths = item.get("paths")
            if not isinstance(item_paths, list) or not item_paths:
                blockers.append(_problem("ownership_invalid", "write ownership paths must not be empty"))
                continue
            normalized_owned: list[str] = []
            for raw_owned in item_paths:
                try:
                    normalized_owned.append(normalize_path(str(raw_owned)))
                except ValueError:
                    blockers.append(_problem("path_traversal", "write ownership contains an unsafe path"))
            item["paths"] = normalized_owned
            if any(path not in contract.get("allowed_paths", []) for path in normalized_owned):
                blockers.append(_problem("ownership_scope", "write ownership exceeds allowed paths"))
    if sensitive_reason(contract):
        blockers.append(_problem("redaction_required", "task contract contains private runtime data"))

    contract["digest"] = digest(contract)
    return contract, _dedupe_problems(blockers)


def legacy_contract(agent: str, title: str, paths: list[str]) -> dict[str, Any]:
    return {
        "task_id": "legacy-converted-task",
        "title": title,
        "goal": f"Deliver legacy request: {title}",
        "background": "Converted from the versioned legacy single-agent envelope",
        "current_state": "Legacy request has not entered the common team core",
        "desired_state": "Legacy request is handled through the common team core",
        "scope": {"include": paths},
        "non_goals": ["Do not bypass team selection, verification, or review"],
        "acceptance_criteria": ["Common team gates complete without bypass"],
        "constraints": ["Preserve project scope", "Fail closed on unknown agent"],
        "source_of_truth": ["legacy_single_agent", "execution_policy"],
        "allowed_paths": paths,
        "forbidden_paths": [".env*", ".git/**"],
        "affected_domains": [agent],
        "risk_level": "low",
        "required_capabilities": [],
        "team_assignment": {"mode": "dynamic", "legacy_requested_agent": agent},
        "primary_writer": "dynamic",
        "consulting_specialists": [],
        "reviewer": "dynamic",
        "verifier": "dynamic",
        "write_ownership": [{"owner": "dynamic", "paths": paths}],
        "required_checks": ["contract", "verification", "review"],
        "stop_conditions": ["unknown agent", "scope conflict"],
        "retry_conditions": ["changed input, diff, or environment evidence"],
        "approval_boundaries": ["privilege expansion", "source activation"],
        "required_deliverables": ["implementation", "verification report", "review report"],
        "information_source_sync": {"required": False, "manual_activation": True},
        "completion_conditions": ["initial and final verification/review pass"],
    }


def canonical_rejected_task_contract() -> dict[str, Any]:
    """Return the value-independent canonical contract for rejected input."""

    path = "rejected/input"
    contract = {
        "schema_version": SCHEMA_VERSION,
        "task_id": "rejected-input",
        "title": "Rejected input",
        "goal": "Reject invalid input before team selection",
        "background": "The original invalid input is not retained as a Task Contract",
        "current_state": "Invalid input is rejected",
        "desired_state": "A sanitized replacement input is supplied",
        "scope": {"include": [path]},
        "non_goals": ["Do not retain or process rejected raw values"],
        "acceptance_criteria": ["The rejection remains fail closed"],
        "constraints": ["Persist no raw rejected input values"],
        "source_of_truth": ["input_problem_projection", "execution_policy"],
        "allowed_paths": [path],
        "forbidden_paths": [".env*", ".git/**"],
        "affected_domains": ["input"],
        "risk_level": "low",
        "required_capabilities": [],
        "team_assignment": {"mode": "dynamic"},
        "primary_writer": "dynamic",
        "consulting_specialists": [],
        "reviewer": "dynamic",
        "verifier": "dynamic",
        "write_ownership": [{"owner": "dynamic", "paths": [path]}],
        "required_checks": ["input_validation"],
        "stop_conditions": ["invalid input"],
        "retry_conditions": ["changed input, diff, or environment evidence"],
        "approval_boundaries": ["privilege expansion", "source activation"],
        "required_deliverables": [
            "implementation",
            "verification report",
            "review report",
        ],
        "information_source_sync": {"required": False, "manual_activation": True},
        "completion_conditions": ["initial and final verification/review pass"],
    }
    contract["digest"] = digest(contract)
    return contract


def human_summary(contract: Mapping[str, Any]) -> str:
    """Create a deterministic brief from the complete canonical contract."""

    return (
        f"{contract.get('task_id', '')}: {contract.get('title', '')}\n"
        f"Goal: {contract.get('goal', '')}\n"
        f"State: {contract.get('current_state', '')} -> {contract.get('desired_state', '')}\n"
        f"Scope: {', '.join(contract.get('allowed_paths', []))}\n"
        f"Domains: {', '.join(contract.get('affected_domains', []))}; "
        f"risk={contract.get('risk_level', '')}; checks={', '.join(contract.get('required_checks', []))}\n"
        f"Acceptance: {'; '.join(contract.get('acceptance_criteria', []))}\n"
        f"Contract: {contract.get('digest', '')}"
    )


def catalog_projection(registry: Mapping[str, Any]) -> list[dict[str, Any]]:
    projection: list[dict[str, Any]] = []
    for agent in registry.get("agents", []):
        projection.append(
            {
                "id": str(agent.get("id", "")),
                "roles": sorted(str(item) for item in agent.get("roles", [])),
                "domains": sorted(str(item) for item in agent.get("domains", [])),
                "capabilities": sorted(str(item) for item in agent.get("capabilities", [])),
                "model_profile": str(agent.get("model_profile", agent.get("runtime_profile", "default_profile"))),
            }
        )
    return sorted(projection, key=lambda item: item["id"])


def _problem(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _dedupe_problems(problems: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, str]] = set()
    result: list[dict[str, str]] = []
    for problem in problems:
        key = (problem["code"], problem["message"])
        if key not in seen:
            seen.add(key)
            result.append(problem)
    return result
