"""Execution Policy validation and policy-owned state transitions."""

from __future__ import annotations

import copy
from typing import Any, Mapping

from .contracts import (
    canonical_rejected_task_contract,
    catalog_projection,
    digest,
    stable_run_id,
    valid_digest,
)
from .registry import (
    plan_waves,
    select_team,
    validate_contract_assignment,
    validate_contract_capabilities,
    validate_registry,
    validate_role_assignments,
)


SUPPORTED_POLICY_VERSION = "2026-07-22.2"
PINNED_POLICY_DIGEST = (
    "sha256:7f4ef1d056f121e9c7ff67f2360fbf394bb60e5baa81d21d3e4190b10093157b"
)


def prepare_policy(policy: Mapping[str, Any]) -> dict[str, Any]:
    """Copy an already-canonical policy without supplying missing authority."""

    supplied = copy.deepcopy(dict(policy))
    validate_policy(supplied)
    return supplied


def validate_policy(policy: Mapping[str, Any]) -> None:
    policy_version = policy.get("policy_version")
    policy_digest = policy.get("policy_digest")
    unsigned_policy = {key: value for key, value in policy.items() if key != "policy_digest"}
    if policy_version != SUPPORTED_POLICY_VERSION or policy_digest != PINNED_POLICY_DIGEST:
        raise ValueError("execution policy artifact version or digest is not pinned")
    if policy_digest != digest(unsigned_policy):
        raise ValueError("execution policy artifact digest is invalid")

    states = policy.get("states")
    if (
        not isinstance(states, list)
        or not states
        or any(not isinstance(state, str) or not state for state in states)
        or len(states) != len(set(states))
    ):
        raise ValueError("execution policy states must be a unique non-empty array")
    known = set(states)

    transitions = policy.get("allowed_transitions")
    if not isinstance(transitions, Mapping) or set(transitions) != set(states):
        raise ValueError("execution policy transitions must define every state exactly once")
    for source, targets in transitions.items():
        if (
            not isinstance(targets, list)
            or len(targets) != len(set(targets))
            or any(target not in known for target in targets)
        ):
            raise ValueError(f"execution policy has contradictory transition from {source}")

    terminal = policy.get("terminal_states")
    if (
        not isinstance(terminal, list)
        or not terminal
        or len(terminal) != len(set(terminal))
        or any(state not in known for state in terminal)
    ):
        raise ValueError("execution policy terminal_states are contradictory")
    if any(transitions[state] for state in terminal):
        raise ValueError("execution policy terminal states must not permit outgoing transitions")

    reserved = policy.get("reserved_states")
    if not isinstance(reserved, list) or not reserved or len(reserved) != len(set(reserved)):
        raise ValueError("execution policy reserved_states must be a unique non-empty array")
    if any(state not in known for state in reserved):
        raise ValueError("execution policy reserved_states reference an unknown state")
    if any(state not in set(reserved) for state in terminal):
        raise ValueError("execution policy terminal states must be reserved")

    write_states = policy.get("write_authorization", {}).get("allowed_states", [])
    if (
        not isinstance(write_states, list)
        or not write_states
        or len(write_states) != len(set(write_states))
        or any(state not in known for state in write_states)
        or any(state in set(terminal) for state in write_states)
    ):
        raise ValueError("execution policy write authorization states are contradictory")
    write_policy = policy.get("write_authorization", {})
    if policy.get("single_writer") is not True or any(
        write_policy.get(key) is not expected
        for key, expected in {
            "fail_closed": True,
            "requires_parent_lease": True,
            "reviewer_write": False,
            "verifier_write": False,
        }.items()
    ):
        raise ValueError("execution policy single-writer authorization is invalid")

    source_state = policy.get("source_sync", {}).get("minimum_state")
    if source_state not in known:
        raise ValueError("execution policy source sync references an unknown state")
    evidence_gates = policy.get("evidence_gates")
    if not isinstance(evidence_gates, Mapping):
        raise ValueError("execution policy evidence_gates are required")
    final_review_limit = evidence_gates.get("final_review_retry_limit_state")
    if final_review_limit not in known or final_review_limit not in set(reserved):
        raise ValueError("execution policy final review retry limit state is contradictory")
    if any(
        evidence_gates.get(key) is not True
        for key in (
            "artifact_requires_exact_committed_write_grant",
            "quality_requires_prior_committed_grant",
            "retry_exit_requires_verified_fix",
        )
    ):
        raise ValueError("execution policy evidence gate booleans must remain enabled")


def canonical_input_problem_projection(
    input_task: Mapping[str, Any],
    *,
    legacy_converted: bool,
    blockers: list[Mapping[str, Any]],
    rejections: list[Mapping[str, Any]],
) -> dict[str, Any]:
    """Sanitize input shape and canonical problems without retaining raw values."""

    contract = input_task.get("task_contract", {})
    projection = {
        "schema_version": "1.0",
        "input_kind": "legacy" if legacy_converted else "canonical",
        "top_level_fields": sorted(str(key) for key in input_task),
        "task_contract_fields": sorted(
            str(key) for key in contract
        ) if isinstance(contract, Mapping) else [],
        "redacted": any(
            item.get("code") == "redaction_required"
            for item in rejections
            if isinstance(item, Mapping)
        ),
        "blockers": [copy.deepcopy(dict(item)) for item in blockers],
        "rejections": [copy.deepcopy(dict(item)) for item in rejections],
    }
    projection["digest"] = digest(projection)
    return projection


def canonical_start_request(
    run: Mapping[str, Any],
    *,
    input_problem_projection: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Rebuild the immutable inputs that selected the persisted run."""

    policy = run.get("execution_policy", {})
    stored_start = run.get("start_request", {})
    projection = (
        input_problem_projection
        if isinstance(input_problem_projection, Mapping)
        else (
            stored_start.get("input_problem_projection", {})
            if isinstance(stored_start, Mapping)
            else {}
        )
    )
    return {
        "schema_version": "1.0",
        "idempotency_key": run.get("idempotency_key"),
        "task_contract": copy.deepcopy(run.get("task_contract")),
        "role_assignments": copy.deepcopy(run.get("role_assignments", {})),
        "legacy_converted": run.get("legacy_converted"),
        "registry_binding": copy.deepcopy(run.get("registry_binding")),
        "policy_binding": {
            "version": policy.get("policy_version") if isinstance(policy, Mapping) else None,
            "digest": policy.get("policy_digest") if isinstance(policy, Mapping) else None,
        },
        "input_problem_projection": copy.deepcopy(dict(projection)),
    }


def canonical_run_id(run: Mapping[str, Any]) -> str:
    """Bind the durable run identity to every immutable start authority."""

    start = run.get("start_request", {})
    registry_binding = run.get("registry_binding", {})
    policy = run.get("execution_policy", {})
    projection = (
        start.get("input_problem_projection", {})
        if isinstance(start, Mapping)
        else {}
    )
    identity = {
        "idempotency_key": run.get("idempotency_key"),
        "task_contract": copy.deepcopy(run.get("task_contract")),
        "legacy_converted": run.get("legacy_converted"),
        "role_assignments": copy.deepcopy(run.get("role_assignments", {})),
        "registry_digest": (
            registry_binding.get("registry_digest")
            if isinstance(registry_binding, Mapping)
            else None
        ),
        "policy_digest": digest(policy) if isinstance(policy, Mapping) else None,
        "input_problem_projection_digest": (
            projection.get("digest") if isinstance(projection, Mapping) else None
        ),
    }
    return stable_run_id(digest(identity))


def canonical_inactive_source_projection(run: Mapping[str, Any]) -> dict[str, Any]:
    """Project the only valid source state before a staging introduction."""

    return {
        "schema_version": "1.0",
        "run_id": run.get("run_id"),
        "contract_digest": run.get("contract_digest"),
        "artifact_revision": run.get("artifact_revision"),
        "accepted": False,
        "status": "not_requested",
        "staged": False,
        "overwrote": False,
        "source_artifact_digest": None,
        "staging_artifact": None,
        "manifest_digest": None,
        "connection_status": "unverified",
        "external_connection_verified": False,
        "committed_revision": None,
    }


def canonical_accepted_shadow_source_projection(
    run: Mapping[str, Any],
) -> dict[str, Any]:
    """Project Policy-owned controls for an accepted shadow source update."""

    policy = run.get("execution_policy", {})
    source_policy = policy.get("source_sync", {}) if isinstance(policy, Mapping) else {}
    return {
        "accepted": True,
        "status": source_policy.get("external_disconnected_status"),
        "staged": True,
        "overwrote": False,
        "connection_status": "unverified",
        "external_connection_verified": False,
        "staging_artifact": {
            "manual_handoff": bool(source_policy.get("manual_activation")),
        },
    }


def accepted_shadow_source_projection_errors(
    run: Mapping[str, Any],
) -> list[str]:
    """Reject accepted source controls that do not equal their Policy projection."""

    source_sync = run.get("source_sync")
    if not isinstance(source_sync, Mapping) or source_sync.get("accepted") is not True:
        return []
    staging = source_sync.get("staging_artifact")
    actual = {
        "accepted": source_sync.get("accepted"),
        "status": source_sync.get("status"),
        "staged": source_sync.get("staged"),
        "overwrote": source_sync.get("overwrote"),
        "connection_status": source_sync.get("connection_status"),
        "external_connection_verified": source_sync.get(
            "external_connection_verified"
        ),
        "staging_artifact": {
            "manual_handoff": (
                staging.get("manual_handoff")
                if isinstance(staging, Mapping)
                else None
            ),
        },
    }
    if actual != canonical_accepted_shadow_source_projection(run):
        return [
            "completion_source_binding_invalid: accepted shadow source controls do not match the execution Policy"
        ]
    return []


def canonical_team_projection(
    registry: Mapping[str, Any],
    policy: Mapping[str, Any],
    contract: Mapping[str, Any],
    role_assignments: Mapping[str, Any],
) -> dict[str, Any]:
    """Replay selection and scheduling from their canonical authorities."""

    selected = select_team(
        registry,
        contract,
        role_assignments=role_assignments,
    )
    team = copy.deepcopy(selected["team"])
    max_threads = int(policy.get("max_threads", 0))
    implementation = [
        member for member in team if member.get("role") in {"writer", "specialist"}
    ]
    capacity_exceeded = len(implementation) > max_threads
    if capacity_exceeded:
        retained_ids = {
            str(member.get("id")) for member in implementation[:max_threads]
        }
        team = [
            member
            for member in team
            if member.get("role") in {"reviewer", "verifier"}
            or str(member.get("id")) in retained_ids
        ]
    waves = plan_waves(team, max_threads)
    return {
        "team": team,
        "selection": {
            "writer": selected["writer"],
            "fallback": selected["fallback"],
            "eligible_writers": copy.deepcopy(selected["eligible_writers"]),
        },
        "write_ownership": copy.deepcopy(selected["write_ownership"]),
        "profiles": {
            str(member.get("id")): member.get("model_profile") for member in team
        },
        "waves": waves,
        "thread_count": max(
            (len(wave.get("agents", [])) for wave in waves), default=0
        ),
        "capacity_exceeded": capacity_exceeded,
    }


def canonical_metrics(run: Mapping[str, Any]) -> dict[str, Any]:
    """Derive the closed metrics projection without trusting stored counters."""

    failures = [
        item for item in run.get("failure_history", []) if isinstance(item, Mapping)
    ]
    findings = [item for item in run.get("findings", []) if isinstance(item, Mapping)]
    team = [item for item in run.get("team", []) if isinstance(item, Mapping)]
    waves = run.get("shared_plan", {}).get("waves", [])
    changed_files = sorted(
        {
            str(item.get("path"))
            for item in run.get("implementation_log", [])
            if isinstance(item, Mapping)
            and item.get("kind") == "artifact_receipt"
            and item.get("path")
        }
    )
    state = run.get("state")
    metrics = {
        "task_id": run.get("task_contract", {}).get("task_id"),
        "task_type": run.get("task_contract", {}).get("title"),
        "affected_domains": copy.deepcopy(
            run.get("task_contract", {}).get("affected_domains", [])
        ),
        "risk_level": run.get("task_contract", {}).get("risk_level"),
        "selected_agents": [member.get("id") for member in team],
        "selection_reasons": {
            member.get("id"): copy.deepcopy(member.get("selection_reasons", []))
            for member in team
        },
        "team_size": len(team),
        "wave_count": len(waves) if isinstance(waves, list) else 0,
        "primary_writer": run.get("selection", {}).get("writer"),
        "model_profiles": copy.deepcopy(run.get("runtime", {}).get("profiles", {})),
        "state_transitions": len(run.get("state_trace", [])),
        "changed_files": changed_files,
        "commands_executed": [],
        "test_results": copy.deepcopy(run.get("verification_report", {})),
        "static_analysis_results": "unavailable",
        "retry_count": max(0, int(run.get("attempt_count", 1)) - 1),
        "failure_categories": sorted(
            {
                item.get("cause_fingerprint")
                for item in failures
                if item.get("cause_fingerprint")
            }
        ),
        "review_findings": len(findings),
        "verification_failures": sum(
            1 for item in failures if item.get("report") == "verification"
        ),
        "review_failures": sum(
            1 for item in failures if item.get("report") == "review"
        ),
        "architecture_violations": sum(
            1 for item in findings if item.get("kind") in {"architecture", "design"}
        ),
        "human_interventions": sum(
            1
            for item in run.get("state_trace", [])
            if isinstance(item, Mapping) and item.get("state") == "needs_human_approval"
        ),
        "approval_requests": len(
            run.get("task_contract", {}).get("approval_boundaries", [])
        ),
        "source_updates": int(bool(run.get("source_sync", {}).get("accepted"))),
        "final_status": state,
        "completed": state == "completed",
        "blocked": state == "blocked",
        "elapsed_time": "unavailable",
        "token_usage": "unavailable",
        "cost": "unavailable",
    }
    metrics["digest"] = digest(metrics)
    return metrics


def canonical_completion_projection(
    run: Mapping[str, Any],
    *,
    generation_revision: int | None,
    complete: bool,
    gate: str,
    reasons: list[str] | None = None,
) -> dict[str, Any]:
    """Bind completion to one exact contract, source, artifact, and generation."""

    source = run.get("source_sync", {})
    source_active = (
        isinstance(source, Mapping)
        and source.get("accepted") is True
        and source.get("staged") is True
    )
    staging = (
        source.get("staging_artifact")
        if source_active and isinstance(source, Mapping)
        else None
    )
    initial_verification = run.get("initial_verification_report", {})
    initial_review = run.get("initial_review_report", {})
    final_verification = run.get("final_verification_report", {})
    final_review = run.get("final_review_report", {})
    return {
        "schema_version": "1.0",
        "run_id": run.get("run_id"),
        "contract_digest": run.get("contract_digest"),
        "generation_revision": generation_revision,
        "artifact_revision": run.get("artifact_revision"),
        "artifact_digest": run.get("current_artifact_digest"),
        "source_artifact_digest": (
            source.get("source_artifact_digest") if source_active else None
        ),
        "source_manifest_digest": (
            source.get("manifest_digest") if source_active else None
        ),
        "staging_artifact_digest": (
            staging.get("digest") if isinstance(staging, Mapping) else None
        ),
        "initial_verification_report_digest": (
            initial_verification.get("report_digest")
            if isinstance(initial_verification, Mapping)
            else None
        ),
        "initial_review_report_digest": (
            initial_review.get("report_digest")
            if isinstance(initial_review, Mapping)
            else None
        ),
        "final_verification_report_digest": (
            final_verification.get("report_digest")
            if isinstance(final_verification, Mapping)
            else None
        ),
        "final_review_report_digest": (
            final_review.get("report_digest")
            if isinstance(final_review, Mapping)
            else None
        ),
        "reasons": list(reasons or []),
        "gate": gate,
        "complete": complete,
    }


def canonical_gate_state_projection(run: Mapping[str, Any]) -> dict[str, Any]:
    """Project gate state without cyclic artifact refs or reserved evidence."""

    projection = copy.deepcopy(dict(run))
    projection.pop("artifacts", None)
    projection.pop("integrity_errors", None)
    trace = projection.get("state_trace", [])
    if isinstance(trace, list):
        for entry in trace:
            if not isinstance(entry, dict):
                continue
            entry.pop("reserved_evidence", None)
            if entry.get("sequence") == 1:
                entry["evidence_digest"] = digest(
                    {"state": entry.get("state"), "sequence": entry.get("sequence")}
                )
            else:
                entry["evidence_digest"] = digest(
                    {key: value for key, value in entry.items() if key != "evidence_digest"}
                )
    return projection


_GENERATION_REPORTS = (
    ("initial_verification_report", "initial", "verification"),
    ("initial_review_report", "initial", "review"),
    ("final_verification_report", "final", "verification"),
    ("final_review_report", "final", "review"),
)


def canonical_generation_delta(
    run: Mapping[str, Any],
    prior_run: Mapping[str, Any] | None,
) -> dict[str, Any]:
    """Purely derive the evidence introduced by one committed generation."""

    prior = prior_run if isinstance(prior_run, Mapping) else {}

    def introduced_items(field: str) -> list[Mapping[str, Any]]:
        current = run.get(field, [])
        previous = prior.get(field, [])
        if not isinstance(current, list):
            return []
        previous_length = len(previous) if isinstance(previous, list) else 0
        return [
            item
            for item in current[previous_length:]
            if isinstance(item, Mapping)
        ]

    reports: list[dict[str, Any]] = []
    for key, phase, report_kind in _GENERATION_REPORTS:
        current = run.get(key)
        if not isinstance(current, Mapping) or current == prior.get(key):
            continue
        report_digest = current.get("report_digest")
        if not valid_digest(report_digest):
            continue
        cause = str(current.get("cause", "") or "")
        reports.append(
            {
                "phase": phase,
                "report": report_kind,
                "status": str(current.get("status", "")),
                "report_digest": str(report_digest),
                "cause_digest": digest(cause) if cause else None,
            }
        )

    return {
        "reports": reports,
        "findings": introduced_items("findings"),
        "receipts": introduced_items("implementation_log"),
        "failures": introduced_items("failure_history"),
        "rejections": introduced_items("rejections"),
        "blockers": introduced_items("blockers"),
        "conflicts": introduced_items("conflicts"),
    }


def _retry_limit_failure(
    run: Mapping[str, Any],
    failures: list[Mapping[str, Any]],
    *,
    final_review_only: bool = False,
) -> bool:
    limit = int(run.get("execution_policy", {}).get("same_cause_retry_limit", 0))
    retry_causes = run.get("retry_causes", {})
    if not isinstance(retry_causes, Mapping):
        return False
    for failure in failures:
        snapshot = failure.get("report_snapshot")
        if not isinstance(snapshot, Mapping) or snapshot.get("status") != "failed":
            continue
        if final_review_only and not (
            failure.get("phase") == "final" and failure.get("report") == "review"
        ):
            continue
        fingerprint = failure.get("cause_fingerprint")
        if isinstance(fingerprint, str) and int(retry_causes.get(fingerprint, 0)) > limit:
            return True
    return False


_GENERATION_DELTA_FIELDS = (
    "reports",
    "findings",
    "receipts",
    "failures",
    "rejections",
    "blockers",
    "conflicts",
)


def _canonical_report_delta(
    run: Mapping[str, Any], phase: str, report: str
) -> dict[str, Any] | None:
    current = run.get(f"{phase}_{report}_report")
    if not isinstance(current, Mapping) or not valid_digest(current.get("report_digest")):
        return None
    cause = str(current.get("cause", "") or "")
    return {
        "phase": phase,
        "report": report,
        "status": str(current.get("status", "")),
        "report_digest": str(current.get("report_digest")),
        "cause_digest": digest(cause) if cause else None,
    }


def _exact_generation_delta(
    delta: Mapping[str, Any],
    **expected: list[Mapping[str, Any]],
) -> bool:
    """Compare every generation evidence column to one typed projection."""

    return all(
        list(delta.get(field, [])) == list(expected.get(field, []))
        for field in _GENERATION_DELTA_FIELDS
    )


def canonical_team_assignment_rejections(
    run: Mapping[str, Any], registry: Mapping[str, Any]
) -> list[dict[str, str]]:
    start = run.get("start_request", {})
    contract = run.get("task_contract", {})
    policy = run.get("execution_policy", {})
    if not all(isinstance(item, Mapping) for item in (start, contract, policy)):
        return []
    projection = canonical_team_projection(
        registry,
        policy,
        contract,
        start.get("role_assignments", {}),
    )
    rejections: list[dict[str, str]] = []
    if projection["capacity_exceeded"]:
        rejections.append(
            {
                "code": "wave_capacity",
                "message": "implementation members exceed the three-thread implementation wave",
            }
        )
    if projection["selection"]["writer"] is None:
        rejections.append(
            {
                "code": "no_qualified_writer",
                "message": "no writer covers every required domain, capability, and path",
            }
        )
    roles = {
        str(member.get("role")): str(member.get("id"))
        for member in projection["team"]
        if member.get("role") in {"writer", "reviewer", "verifier"}
    }
    if "reviewer" not in roles or "verifier" not in roles:
        rejections.append(
            {
                "code": "unavailable_required_role",
                "message": "reviewer and verifier are required",
            }
        )
    elif (
        roles.get("writer") in {roles["reviewer"], roles["verifier"]}
        or roles["reviewer"] == roles["verifier"]
    ):
        rejections.append(
            {
                "code": "role_collision",
                "message": "writer, reviewer, and verifier must be distinct",
            }
        )
    scheduled = [
        agent
        for wave in projection["waves"]
        for agent in wave.get("agents", [])
    ]
    if (
        len(scheduled) != len(projection["team"])
        or set(scheduled) != {str(member.get("id")) for member in projection["team"]}
    ):
        rejections.append(
            {
                "code": "wave_capacity",
                "message": "selected team exceeds three-wave capacity",
            }
        )
    return rejections


def canonical_finding_conflict_projection(
    findings: list[Mapping[str, Any]],
) -> list[dict[str, Any]]:
    """Derive every conflict solely from Finding identity and positions."""

    grouped: dict[tuple[str, str, str], set[str]] = {}
    for finding in findings:
        if not isinstance(finding, Mapping) or not finding.get("position"):
            continue
        identity = (
            str(finding.get("issue_id", "")),
            str(finding.get("clause", "")),
            str(finding.get("location", "")),
        )
        grouped.setdefault(identity, set()).add(str(finding.get("position")))
    return [
        {
            "issue_id": identity[0],
            "clause": identity[1],
            "location": identity[2],
            "positions": sorted(positions),
        }
        for identity, positions in grouped.items()
        if len(positions) > 1
    ]


def canonical_quality_blocker_projection(
    phase: str, report: str, cause: str
) -> tuple[str, dict[str, str]]:
    """Return the shared runtime/replay transition and rejection cause."""

    return (
        f"{phase} {report} blocked: {cause}",
        {
            "code": "report_blocked",
            "message": f"{phase} {report} reported a blocking condition",
        },
    )


def _canonical_input_problems(
    run: Mapping[str, Any], registry: Mapping[str, Any]
) -> tuple[list[dict[str, str]], list[dict[str, str]]] | None:
    start = run.get("start_request", {})
    if not isinstance(start, Mapping):
        return None
    projection = start.get("input_problem_projection", {})
    if not isinstance(projection, Mapping):
        return None
    unsigned = {key: value for key, value in projection.items() if key != "digest"}
    if projection.get("digest") != digest(unsigned):
        return None
    blockers = [
        copy.deepcopy(dict(item))
        for item in projection.get("blockers", [])
        if isinstance(item, Mapping)
    ]
    rejections = [
        copy.deepcopy(dict(item))
        for item in projection.get("rejections", [])
        if isinstance(item, Mapping)
    ]
    return blockers, rejections


def _canonical_conflict_delta(
    run: Mapping[str, Any],
    prior_run: Mapping[str, Any],
    delta: Mapping[str, Any],
) -> tuple[list[Mapping[str, Any]], list[dict[str, Any]]] | None:
    def positions_by_identity(source: Mapping[str, Any]) -> dict[tuple[str, str, str], set[str]]:
        grouped: dict[tuple[str, str, str], set[str]] = {}
        for finding in source.get("findings", []):
            if not isinstance(finding, Mapping) or not finding.get("position"):
                continue
            identity = (
                str(finding.get("issue_id", "")),
                str(finding.get("clause", "")),
                str(finding.get("location", "")),
            )
            grouped.setdefault(identity, set()).add(str(finding.get("position")))
        return grouped

    prior_positions = positions_by_identity(prior_run)
    current_positions = positions_by_identity(run)
    prior_conflicts = {
        (
            str(item.get("issue_id", "")),
            str(item.get("clause", "")),
            str(item.get("location", "")),
        )
        for item in prior_run.get("conflicts", [])
        if isinstance(item, Mapping)
    }
    ordered_identities: list[tuple[str, str, str]] = []
    for finding in run.get("findings", []):
        if not isinstance(finding, Mapping):
            continue
        identity = (
            str(finding.get("issue_id", "")),
            str(finding.get("clause", "")),
            str(finding.get("location", "")),
        )
        if identity not in ordered_identities:
            ordered_identities.append(identity)
    expected_conflicts = [
        conflict
        for conflict in canonical_finding_conflict_projection(
            [
                item
                for item in run.get("findings", [])
                if isinstance(item, Mapping)
            ]
        )
        if (
            str(conflict.get("issue_id", "")),
            str(conflict.get("clause", "")),
            str(conflict.get("location", "")),
        )
        not in prior_conflicts
    ]
    expected_new_positions = {
        (identity, position)
        for identity in ordered_identities
        if any(
            conflict["issue_id"] == identity[0]
            and conflict["clause"] == identity[1]
            and conflict["location"] == identity[2]
            for conflict in expected_conflicts
        )
        for position in current_positions.get(identity, set())
        - prior_positions.get(identity, set())
    }
    causal_findings = [
        finding
        for finding in delta.get("findings", [])
        if isinstance(finding, Mapping)
        and (
            (
                str(finding.get("issue_id", "")),
                str(finding.get("clause", "")),
                str(finding.get("location", "")),
            ),
            str(finding.get("position", "")),
        )
        in expected_new_positions
    ]
    causal_positions = {
        (
            (
                str(finding.get("issue_id", "")),
                str(finding.get("clause", "")),
                str(finding.get("location", "")),
            ),
            str(finding.get("position", "")),
        )
        for finding in causal_findings
    }
    if (
        not expected_conflicts
        or len(causal_findings) != len(expected_new_positions)
        or causal_positions != expected_new_positions
    ):
        return None
    return causal_findings, expected_conflicts


def _target_delta_is_exact(
    kind: str,
    run: Mapping[str, Any],
    prior_run: Mapping[str, Any] | None,
    trace: Mapping[str, Any],
    delta: Mapping[str, Any],
    *,
    registry: Mapping[str, Any] | None = None,
) -> bool:
    """Compare a reserved target with its complete typed generation cause."""

    prior = prior_run if isinstance(prior_run, Mapping) else {}
    reason = str(trace.get("reason", ""))
    actor = str(trace.get("actor", ""))
    empty: dict[str, list[Mapping[str, Any]]] = {}

    if kind == "implementation_approval":
        report = _canonical_report_delta(run, "initial", "review")
        return bool(
            actor == "orchestrator"
            and reason == "current initial reports passed"
            and report is not None
            and report.get("status") == "passed"
            and prior.get("initial_verification_report")
            == run.get("initial_verification_report")
            and run.get("initial_verification_report", {}).get("status") == "passed"
            and _exact_generation_delta(delta, reports=[report])
        )
    if kind == "source_introduction":
        return bool(
            actor == "orchestrator"
            and reason == "versioned source update staged"
            and _exact_generation_delta(delta, **empty)
        )
    if kind == "final_verification_pass":
        report = _canonical_report_delta(run, "final", "verification")
        return bool(
            actor == "orchestrator"
            and reason == "final verification passed"
            and report is not None
            and report.get("status") == "passed"
            and _exact_generation_delta(delta, reports=[report])
        )
    if kind == "final_review_pass":
        report = _canonical_report_delta(run, "final", "review")
        return bool(
            actor == "orchestrator"
            and reason == "final review passed"
            and report is not None
            and report.get("status") == "passed"
            and _exact_generation_delta(delta, reports=[report])
        )
    if kind == "completion":
        return bool(
            actor == "orchestrator"
            and reason == "completion evidence accepted"
            and _exact_generation_delta(delta, **empty)
        )
    if kind == "interrupt":
        return bool(
            actor == "orchestrator"
            and reason == "run interrupted"
            and _exact_generation_delta(delta, **empty)
        )
    if kind == "cancellation":
        return bool(
            actor == "orchestrator"
            and reason.strip()
            and _exact_generation_delta(delta, **empty)
        )
    if kind == "stop_condition":
        return bool(
            actor == "orchestrator"
            and reason == "Task Contract stop condition"
            and _exact_generation_delta(
                delta,
                rejections=[
                    {
                        "code": "stop_condition",
                        "message": "Task Contract stop condition matched",
                    }
                ],
            )
        )
    if kind == "initial_blocker":
        if actor != "orchestrator" or prior or registry is None:
            return False
        if reason == "input contract rejected":
            projection = _canonical_input_problems(run, registry)
            if projection is None:
                return False
            blockers, rejections = projection
            return bool(
                (blockers or rejections)
                and _exact_generation_delta(
                    delta, blockers=blockers, rejections=rejections
                )
            )
        if reason == "team assignment rejected":
            rejections = canonical_team_assignment_rejections(run, registry)
            return bool(
                rejections
                and _exact_generation_delta(delta, rejections=rejections)
            )
        if reason == "no qualified primary writer":
            projection = canonical_team_projection(
                registry,
                run.get("execution_policy", {}),
                run.get("task_contract", {}),
                run.get("start_request", {}).get("role_assignments", {}),
            )
            return bool(
                projection["selection"]["writer"] is None
                and projection["selection"]["fallback"] is not None
                and _exact_generation_delta(delta, **empty)
            )
        return False
    if kind == "quality_blocker":
        reports = [item for item in delta.get("reports", []) if isinstance(item, Mapping)]
        failures = [item for item in delta.get("failures", []) if isinstance(item, Mapping)]
        if len(reports) != 1 or len(failures) != 1:
            return False
        report_delta = reports[0]
        phase = str(report_delta.get("phase", ""))
        report_kind = str(report_delta.get("report", ""))
        report = run.get(f"{phase}_{report_kind}_report", {})
        failure = failures[0]
        cause = str(failure.get("cause", ""))
        expected_report = _canonical_report_delta(run, phase, report_kind)
        expected_failure = canonical_failure_history_entry(
            failure,
            [item for item in run.get("findings", []) if isinstance(item, Mapping)],
            [item for item in run.get("implementation_log", []) if isinstance(item, Mapping)],
        )
        expected_reason, expected_rejection = canonical_quality_blocker_projection(
            phase, report_kind, cause
        )
        return bool(
            actor == "orchestrator"
            and expected_report is not None
            and report_delta == expected_report
            and report_delta.get("status") == "blocked"
            and isinstance(report, Mapping)
            and failure == expected_failure
            and failure.get("report_snapshot") == report
            and failure.get("report_digest") == report_delta.get("report_digest")
            and failure.get("phase") == phase
            and failure.get("report") == report_kind
            and reason == expected_reason
            and _exact_generation_delta(
                delta,
                reports=[expected_report],
                failures=[failure],
                rejections=[expected_rejection],
            )
        )
    if kind in {"retry_limit", "final_review_retry_limit"}:
        reports = [item for item in delta.get("reports", []) if isinstance(item, Mapping)]
        failures = [item for item in delta.get("failures", []) if isinstance(item, Mapping)]
        if len(reports) != 1 or len(failures) != 1:
            return False
        report_delta = reports[0]
        phase = str(report_delta.get("phase", ""))
        report_kind = str(report_delta.get("report", ""))
        report = run.get(f"{phase}_{report_kind}_report", {})
        failure = failures[0]
        expected_report = _canonical_report_delta(run, phase, report_kind)
        expected_failure = canonical_failure_history_entry(
            failure,
            [item for item in run.get("findings", []) if isinstance(item, Mapping)],
            [item for item in run.get("implementation_log", []) if isinstance(item, Mapping)],
        )
        failure_finding_digests = {
            str(identity.get("finding_digest"))
            for identity in failure.get("finding_identities", [])
            if isinstance(identity, Mapping)
        }
        causal_findings = [
            finding
            for finding in delta.get("findings", [])
            if isinstance(finding, Mapping)
            and str(finding.get("digest")) in failure_finding_digests
        ]
        final_review_kind = phase == "final" and report_kind == "review"
        return bool(
            actor == "orchestrator"
            and reason == "same-cause retry limit exceeded"
            and expected_report is not None
            and report_delta == expected_report
            and report_delta.get("status") == "failed"
            and failure == expected_failure
            and failure.get("report_snapshot") == report
            and failure.get("report_digest") == report_delta.get("report_digest")
            and final_review_kind == (kind == "final_review_retry_limit")
            and _retry_limit_failure(
                run,
                [failure],
                final_review_only=kind == "final_review_retry_limit",
            )
            and _exact_generation_delta(
                delta,
                reports=[expected_report],
                findings=causal_findings,
                failures=[failure],
                rejections=[
                    {
                        "code": "retry_limit",
                        "message": "same-cause retry limit exceeded",
                    }
                ],
            )
        )
    if kind == "finding_conflict":
        projection = _canonical_conflict_delta(run, prior, delta)
        if projection is None:
            return False
        findings, conflicts = projection
        return bool(
            actor == "orchestrator"
            and reason == "finding positions conflict"
            and _exact_generation_delta(
                delta, findings=findings, conflicts=conflicts
            )
        )
    return False


def _reserved_target_kind(
    run: Mapping[str, Any],
    prior_run: Mapping[str, Any] | None,
    trace: Mapping[str, Any],
    delta: Mapping[str, Any],
    *,
    registry: Mapping[str, Any] | None = None,
) -> str:
    """Classify only a target-authorized same-generation cause."""

    target = str(trace.get("state", ""))
    reason = str(trace.get("reason", ""))
    reports = [item for item in delta.get("reports", []) if isinstance(item, Mapping)]
    failures = [item for item in delta.get("failures", []) if isinstance(item, Mapping)]
    rejection_codes = {
        str(item.get("code"))
        for item in delta.get("rejections", [])
        if isinstance(item, Mapping) and item.get("code")
    }
    blockers = [item for item in delta.get("blockers", []) if isinstance(item, Mapping)]
    conflicts = [item for item in delta.get("conflicts", []) if isinstance(item, Mapping)]
    prior = prior_run if isinstance(prior_run, Mapping) else {}

    def exact(kind: str) -> str:
        return (
            kind
            if _target_delta_is_exact(
                kind,
                run,
                prior_run,
                trace,
                delta,
                registry=registry,
            )
            else "invalid"
        )

    if target == "implementation_approved" and any(
        item.get("phase") == "initial" and item.get("status") == "passed"
        for item in reports
    ):
        return exact("implementation_approval")
    source = run.get("source_sync", {})
    if target == "source_sync" and (
        isinstance(source, Mapping)
        and source.get("accepted") is True
        and source != prior.get("source_sync", {})
    ):
        return exact("source_introduction")
    if target == "final_verification" and any(
        item.get("phase") == "final"
        and item.get("report") == "verification"
        and item.get("status") == "passed"
        for item in reports
    ):
        return exact("final_verification_pass")
    if target == "final_review" and any(
        item.get("phase") == "final"
        and item.get("report") == "review"
        and item.get("status") == "passed"
        for item in reports
    ):
        return exact("final_review_pass")
    if target == "completed" and run.get("completion_report") != prior.get(
        "completion_report", {}
    ):
        return exact("completion")
    if target == "blocked":
        if trace.get("actor") == "orchestrator" and reason == "run interrupted":
            return exact("interrupt")
        if reason == "Task Contract stop condition" and "stop_condition" in rejection_codes:
            return exact("stop_condition")
        if not prior and reason in {
            "input contract rejected",
            "team assignment rejected",
            "no qualified primary writer",
        } and (blockers or rejection_codes or run.get("selection", {}).get("fallback")):
            return exact("initial_blocker")
        for item in reports:
            if item.get("status") != "blocked":
                continue
            label = f"{item.get('phase')} {item.get('report')} blocked:"
            if reason.startswith(label) and "report_blocked" in rejection_codes:
                report_digest = item.get("report_digest")
                if any(
                    failure.get("report_digest") == report_digest
                    and failure.get("report_snapshot", {}).get("status") == "blocked"
                    for failure in failures
                ):
                    return exact("quality_blocker")
        return "invalid"
    if target == "failed":
        if (
            reason == "same-cause retry limit exceeded"
            and "retry_limit" in rejection_codes
            and _retry_limit_failure(run, failures)
        ):
            return exact("retry_limit")
        return "invalid"
    if target == "needs_human_approval":
        if reason == "finding positions conflict" and conflicts:
            return exact("finding_conflict")
        if (
            reason == "same-cause retry limit exceeded"
            and "retry_limit" in rejection_codes
            and _retry_limit_failure(run, failures, final_review_only=True)
        ):
            return exact("final_review_retry_limit")
        return "invalid"
    if target == "cancelled" and (
        trace.get("actor") == "orchestrator" and bool(reason.strip())
    ):
        return exact("cancellation")
    return "invalid"


def canonical_reserved_target_causality(
    run: Mapping[str, Any],
    prior_run: Mapping[str, Any] | None,
    trace: Mapping[str, Any],
    *,
    registry: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Bind a reserved target to its typed same-generation cause projection."""

    delta = canonical_generation_delta(run, prior_run)
    cause_values = [str(trace.get("reason", ""))]
    for report in delta["reports"]:
        current = next(
            (
                run.get(key)
                for key, phase, report_kind in _GENERATION_REPORTS
                if phase == report.get("phase") and report_kind == report.get("report")
            ),
            None,
        )
        if isinstance(current, Mapping) and current.get("cause"):
            cause_values.append(str(current.get("cause")))
    for field in ("failures", "rejections", "blockers", "findings"):
        for item in delta[field]:
            cause = item.get("cause") or item.get("message")
            if cause:
                cause_values.append(str(cause))

    identities: dict[str, dict[str, Any]] = {}
    for finding in delta["findings"]:
        identity = canonical_finding_identity(finding)
        if valid_digest(identity.get("finding_digest")):
            identities[digest(identity)] = identity
    for failure in delta["failures"]:
        for candidate in failure.get("finding_identities", []):
            if isinstance(candidate, Mapping) and valid_digest(candidate.get("finding_digest")):
                identity = copy.deepcopy(dict(candidate))
                identities[digest(identity)] = identity

    return {
        "kind": _reserved_target_kind(
            run, prior_run, trace, delta, registry=registry
        ),
        "transition_reason_digest": digest(str(trace.get("reason", ""))),
        "cause_digests": sorted({digest(value) for value in cause_values if value}),
        "report_bindings": copy.deepcopy(delta["reports"]),
        "finding_identities": [identities[key] for key in sorted(identities)],
        "receipt_digests": sorted({digest(item) for item in delta["receipts"]}),
        "failure_digests": sorted({digest(item) for item in delta["failures"]}),
        "rejection_codes": sorted(
            {
                str(item.get("code"))
                for item in delta["rejections"]
                if item.get("code")
            }
        ),
        "blocker_codes": sorted(
            {
                str(item.get("code"))
                for item in delta["blockers"]
                if item.get("code")
            }
        ),
        "conflict_digests": sorted({digest(item) for item in delta["conflicts"]}),
    }


def canonical_reserved_evidence(
    run: Mapping[str, Any],
    trace: Mapping[str, Any],
    generation_revision: int,
    prior_run: Mapping[str, Any] | None = None,
    *,
    registry: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build closed generation evidence for one reserved transition."""

    source = run.get("source_sync", {})
    staging = source.get("staging_artifact") if isinstance(source, Mapping) else None
    completion = run.get("completion_report", {})
    report_digests = {
        key: (
            run.get(f"{key}_report", {}).get("report_digest")
            if isinstance(run.get(f"{key}_report"), Mapping)
            else None
        )
        for key in (
            "initial_verification",
            "initial_review",
            "final_verification",
            "final_review",
        )
    }
    delta = canonical_generation_delta(run, prior_run)
    target_causality = canonical_reserved_target_causality(
        run, prior_run, trace, registry=registry
    )
    transition_state = str(trace.get("state", ""))
    transition_actor = str(trace.get("actor", ""))
    transition_reason = str(trace.get("reason", ""))
    transition_evidence = {
        "transition_actor": transition_actor,
        "transition_reason": transition_reason,
        "cause_digests": copy.deepcopy(target_causality["cause_digests"]),
        "introduced_report_digests": sorted(
            {str(item["report_digest"]) for item in delta["reports"]}
        ),
        "introduced_finding_digests": sorted(
            {
                str(item.get("digest"))
                if valid_digest(item.get("digest"))
                else digest(item)
                for item in delta["findings"]
            }
        ),
        "introduced_receipt_digests": sorted(
            {digest(item) for item in delta["receipts"]}
        ),
        "introduced_failure_digests": sorted(
            {digest(item) for item in delta["failures"]}
        ),
        "introduced_rejection_digests": sorted(
            {digest(item) for item in delta["rejections"]}
        ),
        "introduced_blocker_digests": sorted(
            {digest(item) for item in delta["blockers"]}
        ),
        "introduced_conflict_digests": sorted(
            {digest(item) for item in delta["conflicts"]}
        ),
        "target_causality": target_causality,
        "cancellation_digest": (
            digest(
                {
                    "actor": transition_actor,
                    "reason": transition_reason,
                    "state": transition_state,
                }
            )
            if transition_state == "cancelled"
            else None
        ),
    }
    return {
        "schema_version": "1.0",
        "run_id": run.get("run_id"),
        "generation_revision": generation_revision,
        "transition_sequence": trace.get("sequence"),
        "transition_from": trace.get("from"),
        "transition_state": trace.get("state"),
        "contract_digest": run.get("contract_digest"),
        "artifact_revision": run.get("artifact_revision"),
        "artifact_digest": run.get("current_artifact_digest"),
        "report_digests": report_digests,
        "staging_artifact_digest": (
            staging.get("digest") if isinstance(staging, Mapping) else None
        ),
        "source_manifest_digest": (
            source.get("manifest_digest") if isinstance(source, Mapping) else None
        ),
        "completion_report_digest": (
            digest(completion) if isinstance(completion, Mapping) else None
        ),
        "transition_evidence": transition_evidence,
        "state_digest": digest(canonical_gate_state_projection(run)),
    }


def reserved_generation_evidence_errors(
    run: Mapping[str, Any],
    prior_run: Mapping[str, Any] | None,
    trace: Mapping[str, Any],
    evidence: Mapping[str, Any],
    *,
    registry: Mapping[str, Any] | None = None,
) -> list[str]:
    """Require evidence introduced by the same generation as the transition."""

    expected = canonical_reserved_evidence(
        run,
        trace,
        int(evidence.get("generation_revision", 0)),
        prior_run=prior_run,
        registry=registry,
    )
    if dict(evidence) != expected:
        return ["reserved evidence is not the canonical generation delta"]
    details = evidence.get("transition_evidence", {})
    if not isinstance(details, Mapping):
        return ["reserved transition generation evidence is missing"]
    target_causality = details.get("target_causality")
    expected_causality = canonical_reserved_target_causality(
        run, prior_run, trace, registry=registry
    )
    if not isinstance(target_causality, Mapping) or dict(
        target_causality
    ) != expected_causality:
        return ["reserved target causality is not the canonical generation delta"]
    if target_causality.get("kind") == "invalid":
        return ["reserved target lacks a Policy-authorized same-generation cause"]
    target = str(trace.get("state", ""))
    introduced_reports = details.get("introduced_report_digests", [])
    introduced_findings = details.get("introduced_finding_digests", [])
    introduced_receipts = details.get("introduced_receipt_digests", [])
    introduced_failures = details.get("introduced_failure_digests", [])
    introduced_rejections = details.get("introduced_rejection_digests", [])
    introduced_blockers = details.get("introduced_blocker_digests", [])
    introduced_conflicts = details.get("introduced_conflict_digests", [])
    introduced_any = any(
        bool(items)
        for items in (
            introduced_reports,
            introduced_findings,
            introduced_receipts,
            introduced_failures,
            introduced_rejections,
            introduced_blockers,
            introduced_conflicts,
        )
    )
    prior_source = (
        prior_run.get("source_sync", {})
        if isinstance(prior_run, Mapping)
        else {}
    )
    current_source = run.get("source_sync", {})
    source_introduced = (
        isinstance(current_source, Mapping)
        and current_source.get("accepted") is True
        and current_source != prior_source
    )
    prior_completion = (
        prior_run.get("completion_report", {})
        if isinstance(prior_run, Mapping)
        else {}
    )
    completion_introduced = run.get("completion_report") != prior_completion
    if target == "implementation_approved" and not introduced_reports:
        return ["implementation approval lacks a generation-new report"]
    if target == "source_sync" and not source_introduced:
        return ["source sync lacks generation-new staging evidence"]
    if (
        target == "final_verification" or target == "final_review"
    ) and not introduced_reports:
        return [f"{target} lacks a generation-new report"]
    if target == "completed" and not completion_introduced:
        return ["completion lacks generation-new completion evidence"]
    if target == "blocked" and not (
        introduced_any
        or (
            trace.get("actor") == "orchestrator"
            and trace.get("reason") == "run interrupted"
        )
    ):
        return ["blocked transition borrows unrelated historical evidence"]
    if target == "failed" and not (introduced_reports and introduced_failures):
        return ["failed transition lacks generation-new failure evidence"]
    if target == "needs_human_approval" and not introduced_any:
        return ["human-approval transition lacks generation-new evidence"]
    if target == "cancelled" and not (
        trace.get("actor") == "orchestrator"
        and bool(str(trace.get("reason", "")).strip())
        and valid_digest(details.get("cancellation_digest"))
    ):
        return ["cancelled transition lacks dedicated cancellation evidence"]
    return []


def canonical_artifact_documents(run: Mapping[str, Any]) -> dict[str, Any]:
    """Project every canonical artifact solely from committed Run State."""

    policy = run.get("execution_policy", {})
    registry_binding = run.get("registry_binding", {})
    return {
        "task-contract": copy.deepcopy(run.get("task_contract")),
        "baseline-inventory": {
            "schema_version": "1.0",
            "registry_digest": registry_binding.get("registry_digest"),
            "policy_digest": digest(policy),
            "input_fingerprint": run.get("input_fingerprint"),
            "environment_fingerprint": run.get("environment_fingerprint"),
            "runtime_verified": False,
        },
        "team-assignment": {
            "schema_version": "1.0",
            "orchestrator": copy.deepcopy(run.get("orchestrator")),
            "team": copy.deepcopy(run.get("team")),
            "selection": copy.deepcopy(run.get("selection")),
            "write_ownership": copy.deepcopy(run.get("write_ownership")),
        },
        "specialist-findings": {
            "schema_version": "1.0",
            "receipts": copy.deepcopy(run.get("findings", [])),
            "catalog": copy.deepcopy(run.get("finding_catalog", [])),
            "conflicts": copy.deepcopy(run.get("conflicts", [])),
        },
        "shared-plan": copy.deepcopy(run.get("shared_plan")),
        "implementation-log": {
            "schema_version": "1.0",
            "entries": copy.deepcopy(run.get("implementation_log", [])),
            "metrics": copy.deepcopy(run.get("metrics")),
        },
        "state-transition-log": copy.deepcopy(run.get("state_trace", [])),
        "verification-report": {
            "schema_version": "1.0",
            "initial": copy.deepcopy(run.get("initial_verification_report")),
            "final": copy.deepcopy(run.get("final_verification_report")),
        },
        "review-report": {
            "schema_version": "1.0",
            "initial": copy.deepcopy(run.get("initial_review_report")),
            "final": copy.deepcopy(run.get("final_review_report")),
        },
        "source-update-manifest": copy.deepcopy(run.get("source_sync")),
        "completion-report": copy.deepcopy(run.get("completion_report")),
        "improvement-proposals": copy.deepcopy(run.get("improvement_proposals")),
    }


def canonical_finding_identity(finding: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "issue_id": finding.get("issue_id"),
        "clause": finding.get("clause"),
        "location": finding.get("location"),
        "source": finding.get("source"),
        "finding_digest": finding.get("digest"),
    }


def canonical_failure_history_entry(
    history: Mapping[str, Any],
    findings: list[Mapping[str, Any]],
    implementation_log: list[Mapping[str, Any]],
) -> dict[str, Any]:
    """Reproject one failure receipt from its report, cause, and Findings."""

    snapshot = history.get("report_snapshot")
    report = snapshot.get("report") if isinstance(snapshot, Mapping) else None
    snapshot_cause = snapshot.get("cause") if isinstance(snapshot, Mapping) else None
    cause = (
        snapshot_cause
        if isinstance(snapshot_cause, str) and snapshot_cause
        else f"{report}_failed"
    )
    normalized_cause = str(cause).strip().lower()
    report_digest = history.get("report_digest")
    resolved_for_report = {
        str(item.get("finding_digest"))
        for item in implementation_log
        if item.get("kind") == "finding_resolution_receipt"
        and item.get("failed_report_digest") == report_digest
    }
    all_resolved = {
        str(item.get("finding_digest"))
        for item in implementation_log
        if item.get("kind") == "finding_resolution_receipt"
    }
    cause_matches = [
        finding
        for finding in findings
        if str(finding.get("message", "")).strip().lower() == normalized_cause
        or str(finding.get("issue_id", "")).strip().lower() == normalized_cause
    ]
    matching = (
        [
            finding
            for finding in cause_matches
            if str(finding.get("digest")) in resolved_for_report
        ]
        if resolved_for_report
        else [
            finding
            for finding in cause_matches
            if str(finding.get("digest")) not in all_resolved
        ]
    )
    return {
        "report_digest": snapshot.get("report_digest")
        if isinstance(snapshot, Mapping)
        else None,
        "attempt": snapshot.get("attempt") if isinstance(snapshot, Mapping) else None,
        "cause": cause,
        "cause_fingerprint": digest(normalized_cause),
        "issue_ids": sorted({str(item.get("issue_id")) for item in matching}),
        "finding_identities": [canonical_finding_identity(item) for item in matching],
        "report_generation_ref": history.get("report_generation_ref"),
        "report_generation_revision": history.get("report_generation_revision"),
        "report": report,
        "phase": snapshot.get("phase") if isinstance(snapshot, Mapping) else None,
        "report_snapshot": copy.deepcopy(snapshot),
    }


def dedicated_state_gate_errors(
    run: Mapping[str, Any],
    policy: Mapping[str, Any],
    target: str,
    *,
    reason: str = "",
    actor: str = "orchestrator",
) -> list[str]:
    """Apply the same pure evidence predicates to runtime and persisted gates."""

    if target not in policy.get("reserved_states", []):
        return []
    initial_verification = run.get("initial_verification_report", {})
    initial_review = run.get("initial_review_report", {})
    final_verification = run.get("final_verification_report", {})
    final_review = run.get("final_review_report", {})
    approval = run.get("implementation_approval", {})
    source = run.get("source_sync", {})
    staging = source.get("staging_artifact") if isinstance(source, Mapping) else None
    completion = run.get("completion_report", {})
    failures = [
        item for item in run.get("failure_history", []) if isinstance(item, Mapping)
    ]
    rejections = [
        item for item in run.get("rejections", []) if isinstance(item, Mapping)
    ]

    approval_ready = (
        isinstance(approval, Mapping)
        and approval.get("approved") is True
        and initial_verification.get("status") == "passed"
        and initial_review.get("status") == "passed"
        and not any(
            item.get("status") == "open" for item in run.get("finding_catalog", [])
            if isinstance(item, Mapping)
        )
    )
    source_bound = (
        isinstance(approval, Mapping)
        and approval.get("approved") is True
        and isinstance(source, Mapping)
        and source.get("accepted") is True
        and source.get("staged") is True
        and isinstance(staging, Mapping)
        and valid_digest(staging.get("digest"))
        and valid_digest(source.get("manifest_digest"))
    )
    source_ready = approval_ready and source_bound
    if target == "implementation_approved" and not approval_ready:
        return ["dedicated implementation approval evidence is missing"]
    if target == "source_sync" and not source_ready:
        return ["dedicated source staging evidence is missing"]
    if target == "final_verification" and not (
        source_ready
        and final_verification.get("status") == "passed"
    ):
        return ["dedicated final verification evidence is missing"]
    if target == "final_review" and not (
        source_bound
        and final_verification.get("status") == "passed"
        and final_review.get("status") == "passed"
    ):
        return ["dedicated final review evidence is missing"]
    if target == "completed" and not (
        source_ready
        and final_verification.get("status") == "passed"
        and final_review.get("status") == "passed"
        and isinstance(completion, Mapping)
        and completion
        == canonical_completion_projection(
            run,
            generation_revision=(
                int(run.get("revision", 0))
                if run.get("state") == "completed"
                else int(run.get("revision", 0)) + 1
            ),
            complete=True,
            gate="passed",
            reasons=[],
        )
    ):
        return ["dedicated completion evidence is missing"]
    if target == "blocked" and not (
        bool(run.get("blockers"))
        or bool(rejections)
        or str(reason) == "run interrupted"
        or run.get("selection", {}).get("fallback") is not None
        or bool(run.get("conflicts"))
        or initial_verification.get("status") == "blocked"
        or initial_review.get("status") == "blocked"
        or final_verification.get("status") == "blocked"
        or final_review.get("status") == "blocked"
    ):
        return ["dedicated blocked-state evidence is missing"]
    if target == "failed" and not any(
        item.get("report_snapshot", {}).get("status") == "failed"
        for item in failures
    ):
        return ["dedicated failed-state evidence is missing"]
    if target == "needs_human_approval" and not (
        bool(run.get("conflicts"))
        or any(item.get("phase") == "final" for item in failures)
        or any(item.get("code") == "retry_limit" for item in rejections)
    ):
        return ["dedicated human-approval evidence is missing"]
    if target == "cancelled" and not (
        actor == "orchestrator" and bool(str(reason).strip())
    ):
        return ["dedicated cancellation evidence is missing"]
    return []


def validate_run_state_semantics(
    run: Mapping[str, Any],
    *,
    registry: Mapping[str, Any] | None = None,
    current_policy: Mapping[str, Any] | None = None,
) -> list[str]:
    """Validate relationships that a closed JSON shape cannot express."""

    errors: list[str] = []
    policy = run.get("execution_policy")
    if not isinstance(policy, Mapping):
        return ["run state semantic policy is missing"]
    try:
        validate_policy(policy)
    except ValueError as error:
        errors.append(f"run state semantic policy invalid: {error}")
        return errors
    if current_policy is not None:
        try:
            validate_policy(current_policy)
        except ValueError as error:
            errors.append(f"run state semantic current policy invalid: {error}")
        else:
            if dict(policy) != dict(current_policy):
                errors.append("run state semantic policy artifact does not match the current pin")

    states = set(policy.get("states", []))
    state = run.get("state")
    if state not in states:
        errors.append("run state semantic current state is unknown")

    trace = run.get("state_trace")
    if not isinstance(trace, list) or not trace:
        errors.append("run state semantic transition trace is empty")
    else:
        previous: str | None = None
        for index, raw_entry in enumerate(trace, start=1):
            if not isinstance(raw_entry, Mapping):
                errors.append("run state semantic transition entry is invalid")
                continue
            source = raw_entry.get("from")
            target = raw_entry.get("state")
            if raw_entry.get("sequence") != index:
                errors.append("run state semantic transition sequence is not monotonic")
            if index == 1:
                if source is not None or target != "received":
                    errors.append("run state semantic initial transition is invalid")
                expected_digest = digest({"state": target, "sequence": index})
            else:
                if source != previous:
                    errors.append("run state semantic transition trace is not contiguous")
                if target not in policy.get("allowed_transitions", {}).get(source, []):
                    errors.append("run state semantic transition is forbidden by policy")
                expected_digest = digest(
                    {key: value for key, value in raw_entry.items() if key != "evidence_digest"}
                )
            if raw_entry.get("evidence_digest") != expected_digest:
                errors.append("run state semantic transition evidence digest is invalid")
            reserved = set(policy.get("reserved_states", []))
            reserved_evidence = raw_entry.get("reserved_evidence")
            if target in reserved:
                if not isinstance(reserved_evidence, Mapping) or (
                    reserved_evidence.get("run_id") != run.get("run_id")
                    or reserved_evidence.get("transition_sequence") != index
                    or reserved_evidence.get("transition_from") != source
                    or reserved_evidence.get("transition_state") != target
                    or reserved_evidence.get("contract_digest")
                    != run.get("contract_digest")
                    or not isinstance(
                        reserved_evidence.get("generation_revision"), int
                    )
                    or int(reserved_evidence.get("generation_revision", 0))
                    > int(run.get("revision", 0))
                ):
                    errors.append(
                        "reserved_trace_generation_evidence_invalid: reserved transition evidence is missing or unbound"
                    )
            elif reserved_evidence is not None:
                errors.append(
                    "reserved_trace_generation_evidence_invalid: non-reserved transition carries reserved evidence"
                )
            previous = str(target) if isinstance(target, str) else None
        if trace[-1].get("state") != state:
            errors.append("run state semantic last transition does not match current state")
        if isinstance(state, str):
            errors.extend(
                f"run state semantic dedicated gate invalid: {message}"
                for message in dedicated_state_gate_errors(
                    run,
                    policy,
                    state,
                    reason=str(trace[-1].get("reason", "")),
                    actor=str(trace[-1].get("actor", "")),
                )
            )

    revision = run.get("revision")
    if not isinstance(revision, int) or isinstance(revision, bool) or revision < 1:
        errors.append("run state semantic revision is invalid")
        revision_value = 0
    else:
        revision_value = revision

    role_assignments = run.get("role_assignments")
    if not isinstance(role_assignments, Mapping):
        errors.append("run state semantic role assignments snapshot is invalid")
        role_assignments = {}
    elif run.get("role_assignments_digest") != digest(role_assignments):
        errors.append("run state semantic role assignments digest is invalid")
    expected_start_request = canonical_start_request(run)
    if run.get("start_request") != expected_start_request:
        errors.append("run state semantic canonical start request snapshot is invalid")
    if run.get("start_request_digest") != digest(expected_start_request):
        errors.append("run state semantic canonical start request digest is invalid")
    input_projection = expected_start_request.get("input_problem_projection", {})
    expected_projection_fields = {
        "schema_version",
        "input_kind",
        "top_level_fields",
        "task_contract_fields",
        "redacted",
        "blockers",
        "rejections",
        "digest",
    }
    input_projection_is_valid = False
    if not isinstance(input_projection, Mapping):
        errors.append("run state semantic input problem projection is invalid")
    else:
        unsigned_projection = {
            key: value for key, value in input_projection.items() if key != "digest"
        }
        top_level_fields = input_projection.get("top_level_fields")
        contract_fields = input_projection.get("task_contract_fields")
        projection_rejections = input_projection.get("rejections")
        redaction_bound = isinstance(projection_rejections, list) and any(
            isinstance(item, Mapping) and item.get("code") == "redaction_required"
            for item in projection_rejections
        )
        top_fields_are_canonical = (
            isinstance(top_level_fields, list)
            and all(isinstance(item, str) for item in top_level_fields)
            and top_level_fields == sorted(set(top_level_fields))
        )
        contract_fields_are_canonical = (
            isinstance(contract_fields, list)
            and all(isinstance(item, str) for item in contract_fields)
            and contract_fields == sorted(set(contract_fields))
        )
        if (
            set(input_projection) != expected_projection_fields
            or input_projection.get("schema_version") != "1.0"
            or input_projection.get("input_kind")
            != ("legacy" if run.get("legacy_converted") else "canonical")
            or not top_fields_are_canonical
            or not contract_fields_are_canonical
            or input_projection.get("redacted") is not redaction_bound
            or input_projection.get("digest") != digest(unsigned_projection)
        ):
            errors.append("run state semantic input problem projection is invalid")
        else:
            input_projection_is_valid = True
    if run.get("run_id") != canonical_run_id(run):
        errors.append("run state semantic immutable start authority does not match run id")
    input_rejected = input_projection_is_valid and bool(
        input_projection.get("blockers") or input_projection.get("rejections")
    )
    if (
        input_projection_is_valid
        and input_projection.get("blockers")
        and run.get("task_contract") != canonical_rejected_task_contract()
    ):
        errors.append(
            "run state semantic rejected input Task Contract is not canonical"
        )

    team = run.get("team")
    members = [item for item in team if isinstance(item, Mapping)] if isinstance(team, list) else []
    member_ids = [str(item.get("id", "")) for item in members]
    if len(member_ids) != len(set(member_ids)):
        errors.append("run state semantic team contains duplicate assignments")
    by_role = {
        str(item.get("role")): str(item.get("id"))
        for item in members
        if item.get("role") in {"writer", "reviewer", "verifier"}
    }
    selection_projection: dict[str, Any] | None = None
    if registry is not None:
        expected_registry_binding = {
            "schema_version": registry.get("schema_version"),
            "registry_kind": registry.get("registry_kind"),
            "registry_digest": digest(registry),
        }
        if run.get("registry_binding") != expected_registry_binding:
            errors.append("run state semantic registry snapshot binding is invalid")
        registry_agents = {
            str(item.get("id")): item
            for item in registry.get("agents", [])
            if isinstance(item, Mapping)
        }
        registry_fields = (
            "roles",
            "domains",
            "capabilities",
            "path_scopes",
            "risk_triggers",
            "model_profile",
        )
        for member in members:
            agent_id = str(member.get("id", ""))
            canonical = registry_agents.get(agent_id)
            if canonical is None:
                errors.append("run state semantic team member is unknown to the current registry")
                continue
            assigned_role = str(member.get("role", ""))
            if assigned_role not in set(canonical.get("roles", [])):
                errors.append("run state semantic team role is not authorized by the registry")
            for field in registry_fields:
                member_field = "registry_roles" if field == "roles" else field
                if member.get(member_field) != canonical.get(field):
                    errors.append(
                        "run state semantic team capability snapshot differs from the registry"
                    )
                    break
            if member.get("registry_agent_digest") != digest(canonical):
                errors.append("run state semantic team registry agent digest is invalid")
        contract_for_selection = run.get("task_contract")
        if isinstance(contract_for_selection, Mapping):
            if input_rejected:
                shared_plan = run.get("shared_plan", {})
                if (
                    run.get("team") != []
                    or run.get("selection")
                    != {"writer": None, "fallback": None, "eligible_writers": []}
                    or run.get("write_ownership") != []
                    or run.get("runtime", {}).get("profiles") != {}
                    or not isinstance(shared_plan, Mapping)
                    or shared_plan.get("waves") != []
                    or shared_plan.get("fallback") is not None
                    or run.get("thread_count") != 0
                ):
                    errors.append(
                        "run state semantic rejected input selection is not canonical"
                    )
            else:
                selection_projection = canonical_team_projection(
                    registry,
                    policy,
                    contract_for_selection,
                    role_assignments,
                )
                if run.get("team") != selection_projection["team"]:
                    errors.append(
                        "run state semantic team differs from canonical selection replay"
                    )
                if run.get("selection") != selection_projection["selection"]:
                    errors.append(
                        "run state semantic selection differs from canonical selection replay"
                    )
                if run.get("write_ownership") != selection_projection["write_ownership"]:
                    errors.append(
                        "run state semantic write ownership differs from canonical selection replay"
                    )
                if run.get("runtime", {}).get("profiles") != selection_projection["profiles"]:
                    errors.append(
                        "run state semantic runtime profiles differ from canonical selection replay"
                    )
                shared_plan = run.get("shared_plan", {})
                if (
                    not isinstance(shared_plan, Mapping)
                    or shared_plan.get("waves") != selection_projection["waves"]
                    or shared_plan.get("fallback")
                    != selection_projection["selection"]["fallback"]
                ):
                    errors.append(
                        "run state semantic shared plan waves differ from canonical scheduling replay"
                    )
                if run.get("thread_count") != selection_projection["thread_count"]:
                    errors.append(
                        "run state semantic thread count differs from canonical scheduling replay"
                    )
        if run.get("catalog_projection") != catalog_projection(registry):
            errors.append("run state semantic catalog projection differs from the registry")
        expected_profiles = {
            str(member.get("id")): member.get("model_profile") for member in members
        }
        if run.get("runtime", {}).get("profiles") != expected_profiles:
            errors.append("run state semantic runtime profiles differ from team assignments")
    for role in ("writer", "reviewer", "verifier"):
        assigned = [item for item in members if item.get("role") == role]
        if members and state != "blocked" and len(assigned) != 1:
            errors.append(f"run state semantic team must assign exactly one {role}")
    selection = run.get("selection")
    writer = selection.get("writer") if isinstance(selection, Mapping) else None
    team_writers = [
        str(item.get("id")) for item in members if item.get("role") == "writer"
    ]
    if writer is None:
        if team_writers:
            errors.append("run state semantic writer selection is missing")
    elif team_writers != [writer]:
        errors.append("run state semantic selected writer does not match the team assignment")
    contract = run.get("task_contract")
    assignment = contract.get("team_assignment") if isinstance(contract, Mapping) else None
    if isinstance(assignment, Mapping) and assignment.get("mode") == "fixed" and writer is not None:
        if (
            contract.get("primary_writer") != writer
            or contract.get("reviewer") != by_role.get("reviewer")
            or contract.get("verifier") != by_role.get("verifier")
        ):
            errors.append("run state semantic fixed assignment does not match the selected team")

    ownership = run.get("write_ownership")
    ownership_entries = (
        [item for item in ownership if isinstance(item, Mapping)]
        if isinstance(ownership, list)
        else []
    )
    allowed_paths = set(run.get("task_contract", {}).get("allowed_paths", []))
    if writer is not None:
        if (
            len(ownership_entries) != 1
            or ownership_entries[0].get("owner") != writer
            or set(ownership_entries[0].get("paths", [])) != allowed_paths
        ):
            errors.append("run state semantic write ownership does not match the primary writer")
    elif ownership_entries:
        errors.append("run state semantic write ownership exists without a primary writer")

    grants = run.get("authority_grants")
    write_grants = grants.get("write") if isinstance(grants, Mapping) else None
    if not isinstance(write_grants, Mapping):
        errors.append("run state semantic write authority grants are invalid")
        write_grants = {}
    canonical_writer = (
        selection_projection.get("selection", {}).get("writer")
        if isinstance(selection_projection, Mapping)
        else writer
    )
    expected_write_agents = (
        {str(canonical_writer)} if canonical_writer is not None else set()
    )
    if set(write_grants) != expected_write_agents:
        errors.append("run state semantic write authority does not match the primary writer")
    for agent, raw_grant in write_grants.items():
        if not isinstance(raw_grant, Mapping):
            errors.append("run state semantic write grant is invalid")
            continue
        unsigned = {key: value for key, value in raw_grant.items() if key != "grant_digest"}
        if (
            raw_grant.get("agent") != agent
            or raw_grant.get("run_id") != run.get("run_id")
            or raw_grant.get("epoch") != run.get("lease_epoch")
            or raw_grant.get("ownership_revision") != run.get("ownership_revision")
            or not ownership_entries
            or list(raw_grant.get("paths", [])) != list(ownership_entries[0].get("paths", []))
            or not isinstance(raw_grant.get("issued_revision"), int)
            or raw_grant.get("issued_revision", 0) > revision_value
            or not valid_digest(raw_grant.get("grant_digest"))
            or raw_grant.get("grant_digest") != digest(unsigned)
        ):
            errors.append("run state semantic write grant binding is invalid")

    quality = grants.get("quality") if isinstance(grants, Mapping) else None
    if not isinstance(quality, Mapping):
        errors.append("run state semantic quality authority grants are invalid")
    else:
        canonical_team = (
            selection_projection.get("team", [])
            if isinstance(selection_projection, Mapping)
            else members
        )
        canonical_by_role = {
            str(item.get("role")): str(item.get("id"))
            for item in canonical_team
            if isinstance(item, Mapping)
            and item.get("role") in {"reviewer", "verifier"}
        }
        assigned_quality_roles = set(canonical_by_role)
        for phase in ("initial", "final"):
            phase_grants = quality.get(phase)
            if not isinstance(phase_grants, Mapping):
                errors.append("run state semantic quality grant phase is invalid")
                continue
            expected_roles = (
                assigned_quality_roles
                if phase == "initial" or run.get("source_sync", {}).get("accepted")
                else set()
            )
            if set(phase_grants) != expected_roles:
                errors.append("run state semantic quality grant assignments are incomplete")
            for role, raw_grant in phase_grants.items():
                if not isinstance(raw_grant, Mapping):
                    errors.append("run state semantic quality grant is invalid")
                    continue
                unsigned = {
                    key: value for key, value in raw_grant.items() if key != "grant_digest"
                }
                if (
                    role not in {"reviewer", "verifier"}
                    or raw_grant.get("role") != role
                    or raw_grant.get("actor") != canonical_by_role.get(role)
                    or raw_grant.get("phase") != phase
                    or raw_grant.get("run_id") != run.get("run_id")
                    or raw_grant.get("attempt") != run.get("attempt_count")
                    or raw_grant.get("plan_revision") != run.get("shared_plan", {}).get("revision")
                    or raw_grant.get("artifact_revision") != run.get("artifact_revision")
                    or raw_grant.get("artifact_digest") != run.get("current_artifact_digest")
                    or not isinstance(raw_grant.get("issued_revision"), int)
                    or raw_grant.get("issued_revision", 0) > revision_value
                    or raw_grant.get("grant_digest") != digest(unsigned)
                ):
                    errors.append("run state semantic quality grant binding is invalid")

    findings = run.get("findings", [])
    finding_by_digest: dict[str, Mapping[str, Any]] = {}
    finding_groups: dict[tuple[str, str, str], list[Mapping[str, Any]]] = {}
    quality_actors = {by_role.get("reviewer"), by_role.get("verifier")}
    for index, finding in enumerate(findings, start=1):
        if not isinstance(finding, Mapping):
            continue
        unsigned_finding = {
            key: value for key, value in finding.items() if key != "digest"
        }
        finding_digest = finding.get("digest")
        identity = (
            str(finding.get("issue_id", "")),
            str(finding.get("clause", "")),
            str(finding.get("location", "")),
        )
        if (
            finding.get("sequence") != index
            or finding.get("status") != "open"
            or finding.get("actor") != finding.get("source")
            or finding.get("actor") not in quality_actors
            or not all(identity)
            or finding_digest != digest(unsigned_finding)
            or finding_digest in finding_by_digest
        ):
            errors.append("run state semantic finding receipt identity or digest is invalid")
        if isinstance(finding_digest, str):
            finding_by_digest[finding_digest] = finding
        finding_groups.setdefault(identity, []).append(finding)

    implementation_log = run.get("implementation_log", [])
    artifact_receipts = {
        str(item.get("receipt_id")): item
        for item in implementation_log
        if isinstance(item, Mapping) and item.get("kind") == "artifact_receipt"
    }
    resolutions_by_finding: dict[str, Mapping[str, Any]] = {}
    for log_index, receipt in enumerate(implementation_log, start=1):
        if not isinstance(receipt, Mapping) or receipt.get("kind") != "finding_resolution_receipt":
            continue
        unsigned_receipt = {
            key: value for key, value in receipt.items() if key != "digest"
        }
        finding_digest = str(receipt.get("finding_digest", ""))
        finding = finding_by_digest.get(finding_digest)
        artifact_receipt = artifact_receipts.get(str(receipt.get("fix_receipt_id", "")))
        provenance = receipt.get("provenance")
        artifact_provenance = (
            artifact_receipt.get("provenance")
            if isinstance(artifact_receipt, Mapping)
            else None
        )
        matching_history = next(
            (
                item
                for item in run.get("failure_history", [])
                if isinstance(item, Mapping)
                and item.get("report_digest") == receipt.get("failed_report_digest")
                and item.get("cause_fingerprint") == receipt.get("cause_fingerprint")
            ),
            None,
        )
        expected_identity = (
            {
                "issue_id": finding.get("issue_id"),
                "clause": finding.get("clause"),
                "location": finding.get("location"),
                "source": finding.get("source"),
                "finding_digest": finding.get("digest"),
            }
            if isinstance(finding, Mapping)
            else None
        )
        if (
            receipt.get("sequence") != log_index
            or receipt.get("status") != "resolved"
            or receipt.get("digest") != digest(unsigned_receipt)
            or finding is None
            or finding_digest in resolutions_by_finding
            or receipt.get("issue_id") != finding.get("issue_id")
            or receipt.get("clause") != finding.get("clause")
            or receipt.get("location") != finding.get("location")
            or receipt.get("source") != finding.get("source")
            or receipt.get("finding_identity") != expected_identity
            or not isinstance(artifact_receipt, Mapping)
            or receipt.get("fix_artifact_digest") != artifact_receipt.get("digest")
            or receipt.get("issue_id")
            not in set(str(item) for item in artifact_receipt.get("issue_ids", []))
            or matching_history is None
            or receipt.get("issue_id")
            not in set(str(item) for item in matching_history.get("issue_ids", []))
            or expected_identity not in matching_history.get("finding_identities", [])
            or receipt.get("attempt") != int(matching_history.get("attempt", 0)) + 1
            or receipt.get("cause_fingerprint")
            != digest(str(receipt.get("cause", "")).strip().lower())
            or not isinstance(provenance, Mapping)
            or not isinstance(artifact_provenance, Mapping)
            or provenance.get("producer") != artifact_provenance.get("producer")
            or provenance.get("run_id") != run.get("run_id")
            or provenance.get("contract_digest") != run.get("contract_digest")
            or provenance.get("plan_revision")
            != artifact_provenance.get("plan_revision")
        ):
            errors.append(
                "run state semantic finding resolution receipt binding or digest is invalid"
            )
        if finding is not None:
            resolutions_by_finding[finding_digest] = receipt

    expected_catalog: list[dict[str, Any]] = []
    for identity, identity_findings in finding_groups.items():
        first = identity_findings[0]
        resolved = all(
            str(item.get("digest")) in resolutions_by_finding
            for item in identity_findings
        )
        first_resolution = resolutions_by_finding.get(str(first.get("digest")))
        expected_catalog.append(
            {
                "issue_id": identity[0],
                "clause": identity[1],
                "location": identity[2],
                "first_finding_digest": first.get("digest"),
                "status": "resolved" if resolved else "open",
                "resolution_receipt_digest": (
                    first_resolution.get("digest")
                    if isinstance(first_resolution, Mapping)
                    else None
                ),
            }
        )
    if run.get("finding_catalog") != expected_catalog:
        errors.append("run state semantic finding catalog is not derived from receipts")

    report_bindings = (
        ("initial_verification_report", "verification", "initial", "verifier"),
        ("initial_review_report", "review", "initial", "reviewer"),
        ("final_verification_report", "verification", "final", "verifier"),
        ("final_review_report", "review", "final", "reviewer"),
    )
    for key, report_kind, phase, role in report_bindings:
        report = run.get(key)
        if not isinstance(report, Mapping) or report.get("status") == "not_run":
            continue
        authority = report.get("authority_grant")
        stored_authority = (
            quality.get(phase, {}).get(role) if isinstance(quality, Mapping) else None
        )
        expected_evidence = {
            "attempt": run.get("attempt_count"),
            "plan_revision": run.get("shared_plan", {}).get("revision"),
            "artifact_revision": run.get("artifact_revision"),
            "artifact_digest": run.get("current_artifact_digest"),
            "diff_digest": run.get("diff_digest"),
            "input_fingerprint": run.get("input_fingerprint"),
            "environment_fingerprint": run.get("environment_fingerprint"),
        }
        provenance = report.get("provenance")
        report_payload = {
            item_key: value
            for item_key, value in report.items()
            if item_key
            not in {"schema_version", "report", "source_revision", "report_digest"}
        }
        if report_payload.get("cause") is None:
            report_payload.pop("cause", None)
        if phase != "final":
            report_payload.pop("staging_artifact_digest", None)
            report_payload.pop("source_manifest_digest", None)
        report_invalid = (
            report.get("report") != report_kind
            or report.get("type") != f"{report_kind}_report"
            or report.get("phase") != phase
            or report.get("status") not in {"passed", "failed", "blocked"}
            or report.get("actor") != by_role.get(role)
            or not isinstance(authority, Mapping)
            or not isinstance(stored_authority, Mapping)
            or dict(authority) != dict(stored_authority)
            or authority.get("run_id") != run.get("run_id")
            or authority.get("actor") != by_role.get(role)
            or authority.get("role") != role
            or authority.get("phase") != phase
            or not isinstance(authority.get("issued_revision"), int)
            or authority.get("issued_revision", 0) > revision_value
            or authority.get("grant_digest")
            != digest(
                {item_key: value for item_key, value in authority.items() if item_key != "grant_digest"}
            )
            or any(report.get(field) != expected for field, expected in expected_evidence.items())
            or report.get("checks")
            != run.get("task_contract", {}).get("required_checks", [])
            or not isinstance(provenance, Mapping)
            or provenance.get("producer") != report.get("actor")
            or provenance.get("run_id") != run.get("run_id")
            or provenance.get("contract_digest") != run.get("contract_digest")
            or report.get("report_digest") != digest(report_payload)
        )
        source_sync = run.get("source_sync", {})
        if phase == "final":
            staging = (
                source_sync.get("staging_artifact")
                if isinstance(source_sync, Mapping)
                else None
            )
            report_invalid = report_invalid or (
                not isinstance(staging, Mapping)
                or report.get("staging_artifact_digest") != staging.get("digest")
                or report.get("source_manifest_digest")
                != source_sync.get("manifest_digest")
                or report.get("source_revision")
                != source_sync.get("committed_revision")
            )
        else:
            report_invalid = report_invalid or any(
                report.get(field) is not None
                for field in (
                    "staging_artifact_digest",
                    "source_manifest_digest",
                    "source_revision",
                )
            )
        if report_invalid:
            errors.append(
                "run state semantic quality report digest, authority, or evidence binding is invalid"
            )

    history_keys: set[tuple[Any, Any, Any]] = set()
    for history in run.get("failure_history", []):
        if not isinstance(history, Mapping):
            continue
        history_key = (
            history.get("report_digest"),
            history.get("phase"),
            history.get("attempt"),
        )
        if history_key in history_keys:
            errors.append(
                "failure_history_report_identity_invalid: report digest, phase, and attempt must be unique"
            )
        history_keys.add(history_key)
        snapshot = history.get("report_snapshot")
        authority = snapshot.get("authority_grant") if isinstance(snapshot, Mapping) else None
        payload = (
            {
                key: value
                for key, value in snapshot.items()
                if key not in {"schema_version", "report", "source_revision", "report_digest"}
            }
            if isinstance(snapshot, Mapping)
            else {}
        )
        if payload.get("cause") is None:
            payload.pop("cause", None)
        if isinstance(snapshot, Mapping) and snapshot.get("phase") != "final":
            payload.pop("staging_artifact_digest", None)
            payload.pop("source_manifest_digest", None)
        history_report_kind = snapshot.get("report") if isinstance(snapshot, Mapping) else None
        history_role = (
            "verifier"
            if history_report_kind == "verification"
            else "reviewer" if history_report_kind == "review" else None
        )
        history_provenance = (
            snapshot.get("provenance") if isinstance(snapshot, Mapping) else None
        )
        history_identities = history.get("finding_identities")
        identities_valid = isinstance(history_identities, list)
        if identities_valid:
            for identity in history_identities:
                finding = (
                    finding_by_digest.get(str(identity.get("finding_digest", "")))
                    if isinstance(identity, Mapping)
                    else None
                )
                expected_identity = (
                    {
                        "issue_id": finding.get("issue_id"),
                        "clause": finding.get("clause"),
                        "location": finding.get("location"),
                        "source": finding.get("source"),
                        "finding_digest": finding.get("digest"),
                    }
                    if isinstance(finding, Mapping)
                    else None
                )
                if identity != expected_identity:
                    identities_valid = False
                    break
        identity_issue_ids = (
            sorted({str(item.get("issue_id")) for item in history_identities})
            if isinstance(history_identities, list)
            else []
        )
        historical_evidence_fields = (
            "artifact_digest",
            "diff_digest",
            "input_fingerprint",
            "environment_fingerprint",
        )
        if (
            not isinstance(snapshot, Mapping)
            or history.get("report_digest") != snapshot.get("report_digest")
            or history.get("report") != snapshot.get("report")
            or history.get("phase") != snapshot.get("phase")
            or history.get("attempt") != snapshot.get("attempt")
            or history.get("cause_fingerprint")
            != digest(str(history.get("cause", "")).strip().lower())
            or not isinstance(history.get("report_generation_ref"), str)
            or not isinstance(history.get("report_generation_revision"), int)
            or not identities_valid
            or sorted(set(str(item) for item in history.get("issue_ids", [])))
            != identity_issue_ids
            or (
                snapshot.get("status") != "failed"
                and snapshot.get("status") != "blocked"
            )
            or snapshot.get("report_digest") != digest(payload)
            or snapshot.get("checks")
            != run.get("task_contract", {}).get("required_checks", [])
            or snapshot.get("type") != f"{history_report_kind}_report"
            or snapshot.get("actor") != by_role.get(history_role)
            or any(not valid_digest(snapshot.get(field)) for field in historical_evidence_fields)
            or not isinstance(snapshot.get("plan_revision"), int)
            or not isinstance(snapshot.get("artifact_revision"), int)
            or not isinstance(authority, Mapping)
            or authority.get("run_id") != run.get("run_id")
            or authority.get("actor") != snapshot.get("actor")
            or authority.get("role") != history_role
            or authority.get("phase") != snapshot.get("phase")
            or authority.get("attempt") != snapshot.get("attempt")
            or authority.get("plan_revision") != snapshot.get("plan_revision")
            or authority.get("artifact_revision") != snapshot.get("artifact_revision")
            or authority.get("artifact_digest") != snapshot.get("artifact_digest")
            or not isinstance(authority.get("issued_revision"), int)
            or authority.get("issued_revision", 0) > revision_value
            or authority.get("grant_digest")
            != digest(
                {key: value for key, value in authority.items() if key != "grant_digest"}
            )
            or not isinstance(history_provenance, Mapping)
            or history_provenance.get("producer") != snapshot.get("actor")
            or history_provenance.get("run_id") != run.get("run_id")
            or history_provenance.get("contract_digest") != run.get("contract_digest")
            or (
                snapshot.get("phase") == "final"
                and (
                    not valid_digest(snapshot.get("staging_artifact_digest"))
                    or not valid_digest(snapshot.get("source_manifest_digest"))
                    or not isinstance(snapshot.get("source_revision"), int)
                )
            )
            or (
                snapshot.get("phase") == "initial"
                and any(
                    snapshot.get(field) is not None
                    for field in (
                        "staging_artifact_digest",
                        "source_manifest_digest",
                        "source_revision",
                    )
                )
            )
        ):
            errors.append(
                "run state semantic historical quality report binding is invalid"
            )

    for summary_key, initial_key, final_key in (
        ("verification_report", "initial_verification_report", "final_verification_report"),
        ("review_report", "initial_review_report", "final_review_report"),
    ):
        summary = run.get(summary_key)
        final_report = run.get(final_key)
        initial_report = run.get(initial_key)
        expected_report = (
            final_report
            if isinstance(final_report, Mapping) and final_report.get("status") != "not_run"
            else (
                initial_report
                if isinstance(initial_report, Mapping) and initial_report.get("status") != "not_run"
                else None
            )
        )
        if isinstance(summary, Mapping) and expected_report is None:
            if not (
                summary.get("status") == "not_run"
                and summary.get("phase") is None
                and summary.get("checks") == []
                and summary.get("cause") is None
                and summary.get("report_digest") is None
            ):
                errors.append("run state semantic report summary is not canonical")
        elif isinstance(summary, Mapping) and isinstance(expected_report, Mapping):
            for field in ("status", "phase", "checks", "cause", "report_digest"):
                if summary.get(field) != expected_report.get(field):
                    errors.append("run state semantic report summary is not canonical")
                    break

    approval = run.get("implementation_approval")
    if isinstance(approval, Mapping):
        if approval.get("approved") is True:
            if (
                approval.get("source") != "derived"
                or approval.get("artifact_revision") != run.get("artifact_revision")
                or approval.get("artifact_digest") != run.get("current_artifact_digest")
                or approval.get("verification_report_digest")
                != run.get("initial_verification_report", {}).get("report_digest")
                or approval.get("review_report_digest")
                != run.get("initial_review_report", {}).get("report_digest")
            ):
                errors.append("run state semantic implementation approval binding is invalid")
        elif approval != {"source": "none", "approved": False}:
            errors.append("run state semantic inactive implementation approval is invalid")

    source_sync = run.get("source_sync")
    if isinstance(source_sync, Mapping):
        accepted = source_sync.get("accepted") is True
        staged = source_sync.get("staged") is True
        staging_artifact = source_sync.get("staging_artifact")
        if accepted != staged or accepted != isinstance(staging_artifact, Mapping):
            errors.append("run state semantic source staging flags are inconsistent")
        if accepted and source_sync.get("source_artifact_digest") is None:
            errors.append("run state semantic source artifact binding is missing")
        if (
            source_sync.get("connection_status") != "unverified"
            or source_sync.get("external_connection_verified") is not False
            or source_sync.get("overwrote") is not False
        ):
            errors.append(
                "completion_source_binding_invalid: shadow source connection state is not canonical"
            )
        if not accepted and dict(source_sync) != canonical_inactive_source_projection(run):
            errors.append(
                "completion_source_binding_invalid: inactive source projection is not canonical"
            )
        if accepted:
            errors.extend(accepted_shadow_source_projection_errors(run))
            staging_provenance = (
                staging_artifact.get("provenance")
                if isinstance(staging_artifact, Mapping)
                else None
            )
            if (
                source_sync.get("run_id") != run.get("run_id")
                or source_sync.get("contract_digest") != run.get("contract_digest")
                or source_sync.get("artifact_revision") != run.get("artifact_revision")
                or source_sync.get("source_artifact_digest")
                != run.get("current_artifact_digest")
                or not isinstance(source_sync.get("committed_revision"), int)
                or int(source_sync.get("committed_revision", 0)) > revision_value
                or not isinstance(staging_provenance, Mapping)
                or staging_provenance.get("run_id") != run.get("run_id")
                or staging_provenance.get("contract_digest")
                != run.get("contract_digest")
                or staging_provenance.get("artifact_revision")
                != run.get("artifact_revision")
                or staging_provenance.get("artifact_digest")
                != run.get("current_artifact_digest")
            ):
                errors.append(
                    "completion_source_binding_invalid: source provenance is stale or incomplete"
                )

    completion = run.get("completion_report")
    if isinstance(completion, Mapping):
        expected_completion = canonical_completion_projection(
            run,
            generation_revision=(
                revision_value if completion.get("complete") is True else None
            ),
            complete=completion.get("complete") is True,
            gate="passed" if completion.get("complete") is True else "not_evaluated",
            reasons=[],
        )
        if dict(completion) != expected_completion:
            errors.append(
                "completion_source_binding_invalid: completion does not bind the current source, reports, artifact, contract, and generation"
            )

    artifacts = run.get("artifacts")
    if isinstance(artifacts, list):
        for artifact in artifacts:
            provenance = artifact.get("provenance") if isinstance(artifact, Mapping) else None
            if not isinstance(provenance, Mapping) or (
                provenance.get("run_id") != run.get("run_id")
                or provenance.get("contract_digest") != run.get("contract_digest")
                or provenance.get("revision") != revision_value
            ):
                errors.append("run state semantic artifact provenance is invalid")

    metrics = run.get("metrics")
    if isinstance(metrics, Mapping):
        if dict(metrics) != canonical_metrics(run):
            errors.append("run state semantic metrics are not the canonical closed projection")
        if isinstance(selection_projection, Mapping):
            expected_team = selection_projection.get("team", [])
            expected_metric_selection = {
                "selected_agents": [item.get("id") for item in expected_team],
                "selection_reasons": {
                    item.get("id"): copy.deepcopy(item.get("selection_reasons", []))
                    for item in expected_team
                },
                "team_size": len(expected_team),
                "wave_count": len(selection_projection.get("waves", [])),
                "primary_writer": selection_projection.get("selection", {}).get(
                    "writer"
                ),
                "model_profiles": selection_projection.get("profiles"),
            }
            if any(
                metrics.get(key) != expected
                for key, expected in expected_metric_selection.items()
            ):
                errors.append(
                    "run state semantic metrics differ from canonical start selection"
                )

    return errors


def initialize_trace(run: dict[str, Any]) -> None:
    run["state"] = "received"
    run["state_trace"] = [
        {
            "sequence": 1,
            "from": None,
            "state": "received",
            "actor": "orchestrator",
            "reason": "run initialized",
            "evidence_digest": digest({"state": "received", "sequence": 1}),
        }
    ]


def transition(
    run: dict[str, Any],
    target: str,
    policy: Mapping[str, Any],
    *,
    actor: str = "orchestrator",
    reason: str = "",
) -> tuple[bool, str | None]:
    current = str(run["state"])
    if target == current:
        return True, None
    states = set(policy["states"])
    if target not in states:
        return False, "unknown_state"
    if target not in policy["allowed_transitions"].get(current, []):
        return False, "policy_transition_forbidden"
    if (target == "completed" or target == "cancelled") and actor != "orchestrator":
        return False, f"{target}_actor_forbidden"
    sequence = len(run.get("state_trace", [])) + 1
    entry = {
        "sequence": sequence,
        "from": current,
        "state": target,
        "actor": actor,
        "reason": reason,
    }
    entry["evidence_digest"] = digest(entry)
    run["state"] = target
    run.setdefault("state_trace", []).append(entry)
    return True, None


def is_terminal(run: Mapping[str, Any], policy: Mapping[str, Any]) -> bool:
    return run.get("state") in set(policy["terminal_states"])
