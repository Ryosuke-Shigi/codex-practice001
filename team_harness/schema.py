"""Small standard-library validator for the checked-in harness schema subset."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Mapping


SCHEMA_PATH = Path(__file__).resolve().parents[1] / ".codex" / "team-harness" / "team-harness.schema.json"
KIND_TO_DEFINITION = {
    "canonical_input_envelope": "canonicalInputEnvelope",
    "resume_input_envelope": "resumeInputEnvelope",
    "write_authorization_request": "writeAuthorizationRequest",
    "source_sync_request": "sourceSyncRequest",
    "runtime_event": "runtimeEvent",
    "agent_registry": "agentRegistry",
    "execution_policy": "executionPolicy",
    "acceptance_manifest": "acceptanceManifest",
    "task_contract_input": "taskContractInput",
    "task_contract": "taskContract",
    "run_state": "runState",
    "finding": "finding",
    "specialist-findings": "findingCollection",
    "shared-plan": "sharedPlan",
    "team-assignment": "teamAssignment",
    "implementation-log": "implementationLog",
    "state_transition": "stateTransition",
    "state-transition-log": "stateTransitionLog",
    "initial_verification_report": "initialVerificationReport",
    "final_verification_report": "finalVerificationReport",
    "initial_review_report": "initialReviewReport",
    "final_review_report": "finalReviewReport",
    "verification-report": "verificationReportArtifact",
    "review-report": "reviewReportArtifact",
    "source-update-manifest": "sourceManifest",
    "completion-report": "completion",
    "improvement-proposals": "improvements",
    "artifact_manifest": "artifactManifest",
    "commit_manifest": "commitManifest",
    "commit_anchor": "commitAnchor",
    "baseline-inventory": "baselineInventory",
    "task-contract": "taskContract",
}


def validate_document(kind: str, document: Any) -> list[str]:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    definition_name = KIND_TO_DEFINITION.get(kind, kind)
    definition = schema.get("$defs", {}).get(definition_name)
    if not isinstance(definition, Mapping):
        return [f"$: unknown document kind: {kind}"]
    return _validate(document, definition, schema, "$")


def _validate(value: Any, rule: Mapping[str, Any], root: Mapping[str, Any], path: str) -> list[str]:
    if "$ref" in rule:
        prefix = "#/$defs/"
        reference = str(rule["$ref"])
        if not reference.startswith(prefix):
            return [f"{path}: unsupported schema reference"]
        target = root.get("$defs", {}).get(reference[len(prefix):])
        if not isinstance(target, Mapping):
            return [f"{path}: missing schema reference"]
        return _validate(value, target, root, path)
    if "anyOf" in rule:
        candidates = [_validate(value, candidate, root, path) for candidate in rule["anyOf"]]
        return [] if any(not errors for errors in candidates) else [f"{path}: no anyOf schema matched"]
    if "oneOf" in rule:
        candidates = [_validate(value, candidate, root, path) for candidate in rule["oneOf"]]
        matches = sum(not errors for errors in candidates)
        if matches == 1:
            return []
        if matches == 0:
            details = [error for errors in candidates for error in errors]
            return [f"{path}: no oneOf schema matched", *details]
        return [f"{path}: oneOf match count was {matches}"]
    errors: list[str] = []
    expected_type = rule.get("type")
    if expected_type is not None and not _matches_type(value, expected_type):
        return [f"{path}: expected {expected_type}, got {type(value).__name__}"]
    if "const" in rule and value != rule["const"]:
        errors.append(f"{path}: value does not match const")
    if "enum" in rule and value not in rule["enum"]:
        errors.append(f"{path}: value is not in enum")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in rule and value < rule["minimum"]:
            errors.append(f"{path}: value is below minimum {rule['minimum']}")
        if "maximum" in rule and value > rule["maximum"]:
            errors.append(f"{path}: value is above maximum {rule['maximum']}")
    if isinstance(value, str):
        if len(value) < int(rule.get("minLength", 0)):
            errors.append(f"{path}: string is too short")
        if "pattern" in rule and re.search(str(rule["pattern"]), value) is None:
            errors.append(f"{path}: string does not match pattern")
    if isinstance(value, list):
        if len(value) < int(rule.get("minItems", 0)):
            errors.append(f"{path}: array has too few items")
        if "maxItems" in rule and len(value) > int(rule["maxItems"]):
            errors.append(f"{path}: array has too many items")
        if rule.get("uniqueItems") and len({json.dumps(item, sort_keys=True) for item in value}) != len(value):
            errors.append(f"{path}: array items must be unique")
        item_rule = rule.get("items")
        if isinstance(item_rule, Mapping):
            for index, item in enumerate(value):
                errors.extend(_validate(item, item_rule, root, f"{path}[{index}]"))
    if isinstance(value, Mapping):
        if len(value) < int(rule.get("minProperties", 0)):
            errors.append(f"{path}: object has too few properties")
        required = rule.get("required", [])
        for key in required:
            if key not in value:
                errors.append(f"{path}: missing required property {key}")
        properties = rule.get("properties", {})
        additional = rule.get("additionalProperties")
        for key in value:
            if key not in properties:
                if additional is False:
                    errors.append(f"{path}: unknown property {key}")
                elif isinstance(additional, Mapping):
                    errors.extend(_validate(value[key], additional, root, f"{path}.{key}"))
        for key, child_rule in properties.items():
            if key in value and isinstance(child_rule, Mapping):
                errors.extend(_validate(value[key], child_rule, root, f"{path}.{key}"))
    return errors


def _matches_type(value: Any, expected: Any) -> bool:
    if isinstance(expected, list):
        return any(_matches_type(value, item) for item in expected)
    return {
        "object": lambda: isinstance(value, Mapping),
        "array": lambda: isinstance(value, list),
        "string": lambda: isinstance(value, str),
        "integer": lambda: isinstance(value, int) and not isinstance(value, bool),
        "number": lambda: isinstance(value, (int, float)) and not isinstance(value, bool),
        "boolean": lambda: isinstance(value, bool),
        "null": lambda: value is None,
    }.get(str(expected), lambda: True)()
