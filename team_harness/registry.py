"""Capability selection, path coverage, and lease evidence helpers."""

from __future__ import annotations

import fnmatch
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Mapping

from .contracts import digest, forbidden_path, normalize_path, valid_digest


def validate_registry(registry: Mapping[str, Any]) -> list[dict[str, str]]:
    rejections: list[dict[str, str]] = []
    agents = registry.get("agents", [])
    if not isinstance(agents, list) or not agents:
        return [_problem("empty_registry", "agent registry must contain agents")]
    seen: set[str] = set()
    for agent in agents:
        if not isinstance(agent, Mapping):
            rejections.append(_problem("invalid_agent", "registry agent must be an object"))
            continue
        agent_id = str(agent.get("id", ""))
        if not agent_id:
            rejections.append(_problem("unknown_agent", "registry agent id is required"))
        elif agent_id in seen:
            rejections.append(_problem("duplicate_agent", f"duplicate registry agent: {agent_id}"))
        seen.add(agent_id)
    return rejections


def validate_contract_assignment(
    contract: Mapping[str, Any], registry: Mapping[str, Any]
) -> list[dict[str, str]]:
    assignment = contract.get("team_assignment", {})
    if not isinstance(assignment, Mapping) or assignment.get("mode") != "fixed":
        return []
    by_id = {str(agent.get("id")): agent for agent in registry.get("agents", [])}
    roles = {
        "writer": str(contract.get("primary_writer", "")),
        "reviewer": str(contract.get("reviewer", "")),
        "verifier": str(contract.get("verifier", "")),
    }
    rejections: list[dict[str, str]] = []
    if len(set(roles.values())) != len(roles):
        rejections.append(_problem("role_collision", "fixed writer, reviewer, and verifier must be distinct"))
    for role, agent_id in roles.items():
        agent = by_id.get(agent_id)
        if agent is None:
            rejections.append(_problem("unknown_assignment", f"fixed {role} agent is unknown"))
        elif role not in agent.get("roles", []):
            rejections.append(_problem("assignment_role", f"fixed {role} agent lacks the role"))
    for agent_id in contract.get("consulting_specialists", []):
        agent = by_id.get(str(agent_id))
        if agent is None:
            rejections.append(_problem("unknown_assignment", "fixed consulting specialist is unknown"))
        elif "specialist" not in agent.get("roles", []):
            rejections.append(_problem("assignment_role", "fixed consultant lacks specialist role"))
    writer = by_id.get(roles["writer"])
    if writer is not None:
        domains = set(str(item) for item in contract.get("affected_domains", []))
        capabilities = set(str(item) for item in contract.get("required_capabilities", []))
        patterns = [str(item) for item in writer.get("path_scopes", [])]
        if not domains.issubset(set(writer.get("domains", []))) or not capabilities.issubset(
            set(writer.get("capabilities", []))
        ) or not all(path_matches_scope(str(path), patterns) for path in contract.get("allowed_paths", [])):
            rejections.append(_problem("assignment_scope", "fixed writer does not cover contract scope"))
    ownership = contract.get("write_ownership", [])
    if not isinstance(ownership, list) or not ownership:
        rejections.append(_problem("assignment_ownership", "fixed assignment requires write ownership"))
    else:
        owners = {str(item.get("owner")) for item in ownership if isinstance(item, Mapping)}
        if owners != {roles["writer"]}:
            rejections.append(_problem("assignment_ownership", "fixed ownership must belong to primary writer"))
    return rejections


def validate_role_assignments(
    assignments: Mapping[str, Any],
    registry: Mapping[str, Any],
    contract: Mapping[str, Any] | None = None,
) -> list[dict[str, str]]:
    if not isinstance(assignments, Mapping):
        return [
            _problem(
                "role_assignment_invalid",
                "role assignments must be a closed object",
            )
        ]
    if not assignments:
        return []
    by_id = {str(agent.get("id")): agent for agent in registry.get("agents", [])}
    rejections: list[dict[str, str]] = []
    required_roles = {"writer", "reviewer", "verifier"}
    if set(assignments) != required_roles:
        rejections.append(
            _problem(
                "role_assignment_incomplete",
                "role assignments must name exactly one writer, reviewer, and verifier",
            )
        )
    values: list[str] = []
    for role, raw_agent_id in assignments.items():
        agent_id = str(raw_agent_id)
        values.append(agent_id)
        if role not in {"writer", "reviewer", "verifier"}:
            rejections.append(_problem("unknown_role", f"unknown role assignment: {role}"))
        elif agent_id not in by_id:
            rejections.append(_problem("unknown_agent", f"unknown {role} agent"))
        elif role not in by_id[agent_id].get("roles", []):
            rejections.append(_problem("role_capability_violation", f"agent cannot act as {role}"))
    if len(values) != len(set(values)):
        rejections.append(_problem("role_collision", "writer, reviewer, and verifier must be distinct"))
    if contract is not None:
        assignment = contract.get("team_assignment", {})
        if isinstance(assignment, Mapping) and assignment.get("mode") == "fixed":
            fixed_roles = {
                "writer": str(contract.get("primary_writer", "")),
                "reviewer": str(contract.get("reviewer", "")),
                "verifier": str(contract.get("verifier", "")),
            }
            requested_roles = {
                role: str(assignments.get(role, "")) for role in required_roles
            }
            if requested_roles != fixed_roles:
                rejections.append(
                    _problem(
                        "role_assignment_mismatch",
                        "top-level role assignments must exactly match fixed Task Contract assignments",
                    )
                )
    writer = by_id.get(str(assignments.get("writer", "")))
    if writer is not None and contract is not None:
        domains = {str(item) for item in contract.get("affected_domains", [])}
        capabilities = {str(item) for item in contract.get("required_capabilities", [])}
        patterns = [str(item) for item in writer.get("path_scopes", [])]
        paths = [str(item) for item in contract.get("allowed_paths", [])]
        if (
            not domains.issubset({str(item) for item in writer.get("domains", [])})
            or not capabilities.issubset(
                {str(item) for item in writer.get("capabilities", [])}
            )
            or not paths
            or not all(path_matches_scope(path, patterns) for path in paths)
        ):
            rejections.append(
                _problem(
                    "role_assignment_scope",
                    "requested writer does not cover the Task Contract scope",
                )
            )
    return rejections


def validate_contract_capabilities(
    contract: Mapping[str, Any], registry: Mapping[str, Any]
) -> list[dict[str, str]]:
    known = {
        str(capability)
        for agent in registry.get("agents", [])
        for capability in agent.get("capabilities", [])
    }
    return [
        _problem("unknown_capability", f"unknown capability: {capability}")
        for capability in contract.get("required_capabilities", [])
        if str(capability) not in known
    ]


def select_team(
    registry: Mapping[str, Any],
    contract: Mapping[str, Any],
    role_assignments: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    domains = set(str(item) for item in contract.get("affected_domains", []))
    capabilities = set(str(item) for item in contract.get("required_capabilities", []))
    paths = [str(item) for item in contract.get("allowed_paths", [])]
    risk = str(contract.get("risk_level", "low"))
    agents = [dict(agent) for agent in registry.get("agents", [])]
    quality_roles = {"reviewer", "verifier"}
    scored: list[tuple[int, str, dict[str, Any], list[str], set[str], set[str], set[str]]] = []
    eligible_writers: list[tuple[int, str, dict[str, Any], list[str]]] = []

    for agent in agents:
        roles = set(agent.get("roles", []))
        if roles & quality_roles:
            continue
        agent_domains = set(str(item) for item in agent.get("domains", []))
        agent_capabilities = set(str(item) for item in agent.get("capabilities", []))
        patterns = [str(item) for item in agent.get("path_scopes", [])]
        reasons: list[str] = []
        domain_matches = domains & agent_domains
        capability_matches = capabilities & agent_capabilities
        path_matches = [path for path in paths if path_matches_scope(path, patterns)]
        if domain_matches:
            reasons.append("domain")
        if capability_matches:
            reasons.append("capability")
        if path_matches:
            reasons.append("path")
        if risk in set(agent.get("risk_triggers", [])):
            reasons.append("risk")
        score = 4 * len(domain_matches) + 3 * len(capability_matches) + len(path_matches) + (2 if "risk" in reasons else 0)
        if domain_matches or capability_matches or {"path", "risk"}.issubset(reasons):
            scored.append(
                (score, str(agent.get("id")), agent, reasons, set(domain_matches), set(capability_matches), set(path_matches))
            )
        writer_covers = (
            "writer" in roles
            and bool(paths)
            and domains.issubset(agent_domains)
            and capabilities.issubset(agent_capabilities)
            and all(path_matches_scope(path, patterns) for path in paths)
        )
        if writer_covers:
            eligible_writers.append((score, str(agent.get("id")), agent, reasons))

    scored.sort(key=lambda item: (-item[0], item[1]))
    eligible_writers.sort(key=lambda item: (-item[0], item[1]))
    writer = eligible_writers[0][2] if eligible_writers else None
    team: list[dict[str, Any]] = []
    assignment = contract.get("team_assignment", {})
    fixed = isinstance(assignment, Mapping) and assignment.get("mode") == "fixed"
    requested_roles = dict(role_assignments or {})
    chosen: list[tuple[dict[str, Any], list[str]]] = []
    if fixed:
        by_id = {str(agent.get("id")): agent for agent in agents}
        writer = by_id.get(str(contract.get("primary_writer")))
        if writer is not None:
            reasons = next((item[3] for item in scored if item[1] == writer.get("id")), ["fixed"])
            chosen.append((writer, list(reasons) + ["fixed"]))
        for agent_id in contract.get("consulting_specialists", []):
            agent = by_id.get(str(agent_id))
            if agent is not None and all(item[0].get("id") != agent.get("id") for item in chosen):
                chosen.append((agent, ["fixed", "consulting_specialist"]))
        quality_ids = {
            "verifier": str(contract.get("verifier")),
            "reviewer": str(contract.get("reviewer")),
        }
    else:
        if requested_roles:
            by_id = {str(agent.get("id")): agent for agent in agents}
            writer = by_id.get(str(requested_roles.get("writer")))
        if writer is not None:
            writer_scored = next((item for item in scored if item[1] == writer.get("id")), None)
            chosen.append((writer, writer_scored[3] if writer_scored else ["writer"]))
        covered_domains = set(writer.get("domains", [])) & domains if writer else set()
        covered_capabilities = set(writer.get("capabilities", [])) & capabilities if writer else set()
        covered_paths = {
            path for path in paths
            if writer and path_matches_scope(path, [str(item) for item in writer.get("path_scopes", [])])
        }
        for item in scored:
            agent = item[2]
            if writer is not None and agent.get("id") == writer.get("id"):
                continue
            adds_required = bool(
                (item[4] - covered_domains) or (item[5] - covered_capabilities) or (item[6] - covered_paths)
            )
            adds_risk_path = {"path", "risk"}.issubset(item[3]) and not any(
                {"path", "risk"}.issubset(existing[1]) for existing in chosen
            )
            if adds_required or adds_risk_path:
                chosen.append((agent, item[3]))
                covered_domains.update(item[4])
                covered_capabilities.update(item[5])
                covered_paths.update(item[6])
        quality_ids = {
            "verifier": requested_roles.get("verifier"),
            "reviewer": requested_roles.get("reviewer"),
        }

    for index, (agent, reasons) in enumerate(chosen):
        team.append(_assignment(agent, "writer" if index == 0 and writer is not None else "specialist", reasons))
    for role in ("verifier", "reviewer"):
        requested = quality_ids.get(role)
        agent = next(
            (candidate for candidate in agents if (requested is None or candidate.get("id") == requested) and role in candidate.get("roles", [])),
            None,
        )
        if agent is not None:
            team.append(_assignment(agent, role, [role]))

    fallback = None if writer is not None else "sequential_fallback"
    ownership: list[dict[str, Any]] = []
    if fixed:
        ownership = [dict(item) for item in contract.get("write_ownership", []) if isinstance(item, Mapping)]
    elif writer is not None:
        writer_capable = [agent for agent, _ in chosen if "writer" in agent.get("roles", [])]
        if len(writer_capable) == 1 and eligible_writers:
            ownership = [{"owner": str(writer.get("id")), "paths": list(paths)}]
        else:
            for agent in writer_capable:
                owned = [path for path in paths if path_matches_scope(path, [str(item) for item in agent.get("path_scopes", [])])]
                if owned:
                    ownership.append({"owner": str(agent.get("id")), "paths": owned})
    return {
        "team": team,
        "writer": str(writer.get("id")) if writer else None,
        "fallback": fallback,
        "eligible_writers": [item[1] for item in eligible_writers],
        "write_ownership": ownership,
    }


def plan_waves(team: list[dict[str, Any]], max_threads: int) -> list[dict[str, Any]]:
    implementation = [item["id"] for item in team if item["role"] in {"writer", "specialist"}]
    verifier = next((item["id"] for item in team if item["role"] == "verifier"), None)
    reviewer = next((item["id"] for item in team if item["role"] == "reviewer"), None)
    waves: list[list[str]] = [implementation[:max_threads], [], []]
    if verifier:
        waves[1] = [verifier]
    if reviewer:
        waves[2] = [reviewer]
    return [
        {"wave": index + 1, "agents": agents}
        for index, agents in enumerate(waves)
        if agents
    ]


def path_matches_scope(path: str, patterns: list[str]) -> bool:
    return any(pattern == "**" or fnmatch.fnmatch(path, pattern) for pattern in patterns)


def validate_project_path(path: str, project_root: Path) -> list[dict[str, str]]:
    try:
        normalized = normalize_path(path)
    except ValueError:
        return [_problem("path_traversal", "write path contains traversal or is absolute")]
    if forbidden_path(normalized):
        return [_problem("forbidden_path", "write path is forbidden")]
    root = project_root.resolve()
    candidate = project_root.joinpath(*PurePosixPath(normalized).parts)
    resolved = candidate.resolve(strict=False)
    try:
        resolved.relative_to(root)
    except ValueError:
        return [_problem("symlink_escape", "write path resolves outside project root")]
    return []


def validate_lease(
    lease: Any,
    *,
    run: Mapping[str, Any],
    agent: str,
    paths: list[str],
) -> list[dict[str, str]]:
    if not isinstance(lease, Mapping):
        return [_problem("lease_required", "verifiable parent lease is required")]
    rejections: list[dict[str, str]] = []
    expected = {
        "run_id": run.get("run_id"),
        "agent": agent,
        "epoch": run.get("lease_epoch"),
        "ownership_revision": run.get("ownership_revision"),
        "paths": paths,
        "issuer": "parent_orchestrator",
    }
    for key, value in expected.items():
        if lease.get(key) != value:
            rejections.append(_problem("lease_mismatch", f"parent lease {key} does not match current run"))
    if not lease.get("lease_id"):
        rejections.append(_problem("lease_missing_id", "parent lease id is required"))
    try:
        expiry = datetime.fromisoformat(str(lease.get("expires_at", "")).replace("Z", "+00:00"))
        if expiry <= datetime.now(timezone.utc):
            rejections.append(_problem("lease_expired", "parent lease has expired"))
    except ValueError:
        rejections.append(_problem("lease_expiry_invalid", "parent lease expiry is invalid"))
    supplied_digest = lease.get("digest")
    unsigned = {key: value for key, value in lease.items() if key != "digest"}
    if not valid_digest(supplied_digest) or supplied_digest != digest(unsigned):
        rejections.append(_problem("lease_digest_invalid", "parent lease digest is invalid"))
    return rejections


def validate_stored_grant(supplied: Any, stored: Any) -> list[dict[str, str]]:
    if not isinstance(supplied, Mapping):
        return [_problem("lease_required", "issued authority grant is required")]
    if not isinstance(stored, Mapping) or dict(supplied) != dict(stored):
        return [_problem("authority_grant_mismatch", "lease authority grant must exactly match persisted Run State")]
    supplied_digest = supplied.get("grant_digest")
    unsigned = {key: value for key, value in supplied.items() if key != "grant_digest"}
    if not valid_digest(supplied_digest) or supplied_digest != digest(unsigned):
        return [_problem("authority_grant_mismatch", "persisted authority grant digest is invalid")]
    try:
        expiry = datetime.fromisoformat(str(supplied.get("expires_at", "")).replace("Z", "+00:00"))
        if expiry <= datetime.now(timezone.utc):
            return [_problem("lease_expired", "issued authority grant has expired")]
    except ValueError:
        return [_problem("lease_expiry_invalid", "issued authority grant expiry is invalid")]
    return []


def overlapping(left: str, right: str) -> bool:
    left_parts = PurePosixPath(left).parts
    right_parts = PurePosixPath(right).parts
    shorter = min(len(left_parts), len(right_parts))
    return left_parts[:shorter] == right_parts[:shorter]


def _assignment(agent: Mapping[str, Any], role: str, reasons: list[str]) -> dict[str, Any]:
    return {
        "id": str(agent.get("id")),
        "role": role,
        "registry_roles": list(agent.get("roles", [])),
        "domains": list(agent.get("domains", [])),
        "capabilities": list(agent.get("capabilities", [])),
        "model_profile": str(agent.get("model_profile", agent.get("runtime_profile", "default_profile"))),
        "path_scopes": list(agent.get("path_scopes", [])),
        "risk_triggers": list(agent.get("risk_triggers", [])),
        "registry_agent_digest": digest(agent),
        "selection_reasons": sorted(set(reasons)),
    }


def _problem(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}
