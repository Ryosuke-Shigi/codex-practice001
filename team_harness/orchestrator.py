"""Evidence-bound orchestration for the project-neutral Specialist team harness."""

from __future__ import annotations

import copy
import re
from pathlib import Path
from typing import Any, Mapping

from .contracts import (
    build_task_contract,
    canonical_rejected_task_contract,
    catalog_projection,
    digest,
    human_summary,
    legacy_contract,
    normalize_path,
    sensitive_reason,
    valid_digest,
)
from .registry import (
    overlapping,
    path_matches_scope,
    plan_waves,
    select_team,
    validate_contract_assignment,
    validate_contract_capabilities,
    validate_project_path,
    validate_registry,
    validate_role_assignments,
    validate_stored_grant,
)
from .schema import validate_document
from .state import (
    canonical_accepted_shadow_source_projection,
    canonical_artifact_documents,
    canonical_completion_projection,
    canonical_finding_conflict_projection,
    canonical_inactive_source_projection,
    canonical_input_problem_projection,
    canonical_metrics,
    canonical_quality_blocker_projection,
    canonical_reserved_evidence,
    canonical_run_id,
    canonical_start_request,
    canonical_team_assignment_rejections,
    dedicated_state_gate_errors,
    initialize_trace,
    is_terminal,
    prepare_policy,
    reserved_generation_evidence_errors,
    transition,
)
from .storage import RunStore


ARTIFACT_NAMES = (
    "task-contract",
    "baseline-inventory",
    "team-assignment",
    "specialist-findings",
    "shared-plan",
    "implementation-log",
    "state-transition-log",
    "verification-report",
    "review-report",
    "source-update-manifest",
    "completion-report",
    "improvement-proposals",
)

NEW_INPUT_FIELDS = {
    "schema_version", "idempotency_key", "task_contract", "events", "role_assignments",
    "worktree_request", "write_request", "source_sync_request", "policy_binding",
}
RESUME_INPUT_FIELDS = {
    "schema_version", "resume_run_id", "expected_revision", "contract_digest", "events",
    "worktree_request", "write_request", "source_sync_request",
}
LEGACY_INPUT_FIELDS = {"schema_version", "idempotency_key", "legacy_single_agent"}
EVENT_FIELDS = {
    "finding": {"type", "actor", "source", "issue_id", "clause", "location", "kind", "message", "severity", "position", "status"},
    "verification_report": {"type", "phase", "status", "actor", "authority_grant", "checks", "attempt", "plan_revision", "artifact_revision", "artifact_digest", "diff_digest", "input_fingerprint", "environment_fingerprint", "staging_artifact_digest", "source_manifest_digest", "provenance", "cause", "report_digest"},
    "review_report": {"type", "phase", "status", "actor", "authority_grant", "checks", "attempt", "plan_revision", "artifact_revision", "artifact_digest", "diff_digest", "input_fingerprint", "environment_fingerprint", "staging_artifact_digest", "source_manifest_digest", "provenance", "cause", "report_digest"},
    "fix_applied": {"type", "actor", "cause", "attempt", "plan_revision", "issue_ids", "failed_report_digest", "cause_fingerprint", "changed_input_fingerprint", "changed_diff_digest", "environment_fingerprint", "fix_artifact"},
    "plan_revised": {"type", "change"},
    "ownership_revised": {"type", "actor", "write_ownership"},
    "work_submission": {"type", "plan_revision"},
    "interrupt": {"type"},
    "resume": {"type", "actor"},
    "cancel": {"type", "actor", "reason"},
    "implementation_approved": {"type", "actor"},
    "failure_observed": {"type", "cause", "actor"},
    "improvement_proposed": {"type", "kind", "requested_scope"},
    "artifact": {"type", "actor", "path", "content", "authority_grant"},
    "transition": {"type", "from", "to", "actor"},
}
SOURCE_REQUEST_FIELDS = {
    "schema_version", "artifact_revision", "artifact_digest", "payload", "source_baseline_digest",
    "target_identity", "activate", "external_connected", "external_connection_evidence",
    "existing_target", "target",
}
WRITE_REQUEST_FIELDS = {"schema_version", "run_id", "agent", "paths", "lease", "expected_revision"}


class TeamHarness:
    def __init__(
        self,
        registry: Mapping[str, Any],
        policy: Mapping[str, Any],
        runs_dir: Path | str,
        *,
        project_root: Path | str | None = None,
    ) -> None:
        registry_document = copy.deepcopy(dict(registry))
        registry_errors = validate_document("agent_registry", registry_document)
        if registry_errors:
            raise ValueError("agent registry schema invalid: " + "; ".join(registry_errors))
        self.registry = registry_document
        policy_document = copy.deepcopy(dict(policy))
        policy_errors = validate_document("execution_policy", policy_document)
        if policy_errors:
            raise ValueError("execution policy schema invalid: " + "; ".join(policy_errors))
        self.policy = prepare_policy(policy_document)
        self.store = RunStore(Path(runs_dir), registry=self.registry, policy=self.policy)
        self.project_root = Path(project_root) if project_root is not None else Path(__file__).resolve().parents[1]

    def _policy_for(self, run: Mapping[str, Any] | None = None) -> Mapping[str, Any]:
        if run is not None and isinstance(run.get("execution_policy"), Mapping):
            return run["execution_policy"]
        return self.policy

    def _reserved_states(self, run: Mapping[str, Any] | None = None) -> set[str]:
        return {str(state) for state in self._policy_for(run).get("reserved_states", [])}

    @staticmethod
    def _schema_rejections(kind: str, document: Any) -> list[dict[str, str]]:
        errors = validate_document(kind, document)
        if not errors:
            return []
        invalid_event_types: set[str] = set()
        invalid_quality_grant = False
        if isinstance(document, Mapping):
            if isinstance(document.get("type"), str):
                invalid_event_types.add(str(document["type"]))
            raw_events = document.get("events", [document])
            if isinstance(raw_events, list):
                for event in raw_events:
                    if not isinstance(event, Mapping) or not event.get("type"):
                        continue
                    if validate_document("runtime_event", event):
                        event_type = str(event.get("type"))
                        invalid_event_types.add(event_type)
                        if event_type in {"verification_report", "review_report"}:
                            invalid_quality_grant = invalid_quality_grant or bool(
                                validate_document(
                                    "qualityAuthorityGrant", event.get("authority_grant")
                                )
                            )
        if "artifact" in invalid_event_types:
            code = "authority_grant_mismatch"
        elif "finding" in invalid_event_types:
            code = "finding_identity_required"
        elif invalid_event_types.intersection(
            {"verification_report", "review_report"}
        ):
            code = (
                "authority_grant_mismatch"
                if invalid_quality_grant
                else "report_evidence_missing"
            )
        elif any("schema_version" in error for error in errors):
            code = "schema_version"
        elif not invalid_event_types and any("authority_grant" in error for error in errors):
            code = "authority_grant_mismatch"
        elif any("plan_revision" in error and "minimum" in error for error in errors):
            code = "stale_plan_revision"
        else:
            code = "schema_validation"
        details = "; ".join(errors)
        return [
            _problem(
                code,
                f"{kind} does not match the canonical closed schema: {details}",
            )
        ]

    @classmethod
    def from_config(
        cls,
        registry: Mapping[str, Any],
        policy: Mapping[str, Any],
        *,
        runs_dir: Path | str,
        project_root: Path | str | None = None,
    ) -> "TeamHarness":
        return cls(registry, policy, runs_dir, project_root=project_root)

    def run(self, input_task: Mapping[str, Any]) -> dict[str, Any]:
        task, envelope_rejections, legacy_converted = self._prepare_envelope(input_task)
        resume_run_id = task.get("resume_run_id")
        if resume_run_id:
            return self._resume(str(resume_run_id), task, envelope_rejections=envelope_rejections)

        idempotency_key = str(task.get("idempotency_key", "")).strip() or digest(task.get("task_contract", {}))
        contract, blockers = build_task_contract(task)
        input_rejections = [
            copy.deepcopy(item)
            for item in blockers
            if item.get("code")
            in {
                "forbidden_path",
                "path_traversal",
                "redaction_required",
                "scope_mismatch",
            }
        ]
        input_rejections.extend(copy.deepcopy(envelope_rejections))
        input_rejections.extend(validate_registry(self.registry))
        input_rejections.extend(validate_contract_capabilities(contract, self.registry))
        input_rejections.extend(validate_contract_assignment(contract, self.registry))
        input_rejections.extend(
            validate_role_assignments(
                task.get("role_assignments", {}), self.registry, contract
            )
        )
        input_problem_projection = canonical_input_problem_projection(
            task,
            legacy_converted=legacy_converted,
            blockers=blockers,
            rejections=input_rejections,
        )
        persisted_contract = (
            canonical_rejected_task_contract() if blockers else contract
        )
        run_identity = {
            "idempotency_key": idempotency_key,
            "task_contract": persisted_contract,
            "legacy_converted": legacy_converted,
            "role_assignments": task.get("role_assignments", {}),
            "registry_binding": {"registry_digest": digest(self.registry)},
            "execution_policy": self.policy,
            "start_request": {
                "input_problem_projection": input_problem_projection,
            },
        }
        run_id = canonical_run_id(run_identity)
        with self.store.interprocess_lock(run_id):
            existing = self.store.load(run_id)
            if existing is not None:
                return copy.deepcopy(existing)
            run = self._new_run(
                run_id,
                idempotency_key,
                persisted_contract,
                legacy_converted,
                role_assignments=task.get("role_assignments", {}),
                input_problem_projection=input_problem_projection,
            )
            run["blockers"].extend(copy.deepcopy(blockers))
            run["rejections"].extend(copy.deepcopy(input_rejections))
            if blockers or run["rejections"]:
                self._transition(
                    run, "blocked", reason="input contract rejected", gate_internal=True
                )
                self._finalize(run, expected_revision=0)
                return copy.deepcopy(run)

            self._form_team(run, task.get("role_assignments", {}))
            if run["rejections"]:
                self._transition(
                    run, "blocked", reason="team assignment rejected", gate_internal=True
                )
                self._finalize(run, expected_revision=0)
                return copy.deepcopy(run)
            self._advance_initial(run)
            event_base = copy.deepcopy(run)
            self._process_events(run, list(task.get("events", [])))
            self._resolve_finding_conflicts(run)
            self._handle_requests(run, task)
            if run["selection"]["fallback"] and run["state"] == "implementing":
                self._transition(
                    run,
                    "blocked",
                    reason="no qualified primary writer",
                    gate_internal=True,
                )
            if not self._reserved_event_batch_is_exact(run, prior_run=None):
                event_base["rejections"].append(
                    _problem(
                        "event_batch_after_reserved",
                        "event batch cannot mix a reserved transition cause with unrelated evidence",
                    )
                )
                return event_base
            self._finalize(run, expected_revision=0)
            return copy.deepcopy(run)

    def authorize_write(self, run_id: str, write_request: Mapping[str, Any]) -> dict[str, Any]:
        if sensitive_reason(write_request):
            return self._write_decision(
                run_id, "", False, [_problem("redaction_required", "write request contains private data")]
            )
        if not self.store.has_run(run_id):
            return self._write_decision(
                run_id,
                str(write_request.get("agent", "")),
                False,
                [_problem("run_not_found", "write authorization run does not exist")],
            )
        with self.store.interprocess_lock(run_id):
            run = self.store.load(run_id)
            if run is None:
                return self._write_decision(run_id, str(write_request.get("agent", "")), False, [
                    _problem("run_not_found", "write authorization run does not exist")
                ])
            rejections: list[dict[str, str]] = []
            rejections.extend(self._schema_rejections("write_authorization_request", write_request))
            unknown = sorted(set(write_request) - WRITE_REQUEST_FIELDS)
            if unknown:
                rejections.append(_problem("unknown_input_field", "write request contains unknown properties"))
            if write_request.get("schema_version") != "1.0":
                rejections.append(_problem("schema_version", "write request schema version is unsupported"))
            agent = str(write_request.get("agent", ""))
            raw_paths = write_request.get("paths", [])
            paths = [str(path) for path in raw_paths] if isinstance(raw_paths, list) else []
            if run.get("integrity_status") != "verified":
                rejections.append(_problem("integrity_failure", "run integrity is not verified"))
            if write_request.get("run_id") != run_id:
                rejections.append(_problem("run_scope_mismatch", "write request run_id does not match"))
            if write_request.get("expected_revision") != run.get("revision"):
                rejections.append(_problem("stale_revision", "write request revision is stale"))
            allowed_states = set(self._policy_for(run).get("write_authorization", {}).get("allowed_states", []))
            if run.get("state") not in allowed_states:
                rejections.append(_problem("write_state_forbidden", "run state does not permit writing"))
            assigned = next((item for item in self.registry.get("agents", []) if item.get("id") == agent), None)
            stored = run.get("authority_grants", {}).get("write", {}).get(agent)
            team_writer = next(
                (member.get("id") for member in run.get("team", []) if member.get("role") == "writer"), None
            )
            if (
                assigned is None
                or "writer" not in assigned.get("roles", [])
                or agent != run.get("selection", {}).get("writer")
                or agent != team_writer
                or not isinstance(stored, Mapping)
                or stored.get("kind") != "write"
            ):
                rejections.append(_problem("role_write_forbidden", "agent is not the assigned primary writer"))
            if isinstance(stored, Mapping) and (
                stored.get("issued_revision") is None
                or int(stored.get("issued_revision", 0)) > int(run.get("revision", 0))
            ):
                rejections.append(
                    _problem(
                        "authority_generation_uncommitted",
                        "write authority grant must come from a committed generation",
                    )
                )
            ownership = next(
                (entry for entry in run.get("write_ownership", []) if entry.get("owner") == agent),
                None,
            )
            if not paths:
                rejections.append(_problem("empty_ownership", "write request paths must not be empty"))
            if ownership is None or paths != ownership.get("paths"):
                rejections.append(_problem("ownership_mismatch", "write request must exactly match current ownership"))
            for path in paths:
                rejections.extend(validate_project_path(path, self.project_root))
                try:
                    normalized = normalize_path(path)
                except ValueError:
                    continue
                if normalized not in run.get("task_contract", {}).get("allowed_paths", []):
                    rejections.append(_problem("scope_violation", "write path is outside Task Contract scope"))
                if assigned and not path_matches_scope(normalized, list(assigned.get("path_scopes", []))):
                    rejections.append(_problem("registry_scope_violation", "write path exceeds Registry scope"))
            rejections.extend(validate_stored_grant(write_request.get("lease"), stored))
            return self._write_decision(run_id, agent, not rejections, _dedupe(rejections), run)

    def completion_gate(self, run_id: str, expected_revision: int | None = None) -> dict[str, Any]:
        if not self.store.has_run(run_id):
            return {"complete": False, "gate": "blocked", "reasons": ["run not found"]}
        with self.store.interprocess_lock(run_id):
            run = self.store.load(run_id)
            if run is None:
                return {"complete": False, "gate": "blocked", "reasons": ["run not found"]}
            reasons = self._completion_reasons(run, expected_revision)
            if reasons:
                return {"complete": False, "gate": "blocked", "reasons": reasons}
            run["completion_report"] = canonical_completion_projection(
                run,
                generation_revision=int(expected_revision) + 1,
                complete=True,
                gate="passed",
                reasons=[],
            )
            self._transition(run, "completed", reason="completion evidence accepted", gate_internal=True)
            self._finalize(run, expected_revision=int(expected_revision))
            return copy.deepcopy(run["completion_report"])

    def catalog_projection(self) -> list[dict[str, Any]]:
        return catalog_projection(self.registry)

    def _prepare_envelope(
        self, input_task: Mapping[str, Any]
    ) -> tuple[dict[str, Any], list[dict[str, str]], bool]:
        task = copy.deepcopy(dict(input_task))
        has_legacy = "legacy_single_agent" in task
        has_contract = "task_contract" in task
        rejections: list[dict[str, str]] = []
        converted = False
        if sensitive_reason(task):
            redaction_rejections = [
                _problem("redaction_required", "input contains private data")
            ]
            allowed_envelope = (
                LEGACY_INPUT_FIELDS
                if has_legacy and not has_contract
                else (
                    RESUME_INPUT_FIELDS
                    if "resume_run_id" in task
                    else NEW_INPUT_FIELDS
                )
            )
            if set(task) - allowed_envelope:
                redaction_rejections.append(
                    _problem(
                        "unknown_input_field",
                        "input envelope contains unknown properties",
                    )
                )
            raw_contract = task.get("task_contract")
            if isinstance(raw_contract, Mapping) and (
                set(raw_contract) - set(canonical_rejected_task_contract())
            ):
                redaction_rejections.append(
                    _problem(
                        "unknown_contract_field",
                        "task contract contains unknown fields",
                    )
                )
            if has_legacy and not has_contract:
                legacy = task.get("legacy_single_agent")
                if isinstance(legacy, Mapping) and set(legacy) - {
                    "agent",
                    "task",
                    "paths",
                }:
                    redaction_rejections.append(
                        _problem(
                            "unknown_input_field",
                            "legacy input contains unknown properties",
                        )
                    )

            # Keep resume routing to an already-persisted run, but make every
            # redacted *new* input independent of all caller-provided values.
            if "resume_run_id" in task:
                safe_resume = {
                    "schema_version": task.get("schema_version", "1.0"),
                    "resume_run_id": task.get("resume_run_id"),
                    "expected_revision": task.get("expected_revision"),
                    "contract_digest": task.get("contract_digest"),
                }
                return safe_resume, _dedupe(redaction_rejections), False

            safe_contract = {
                key: copy.deepcopy(value)
                for key, value in canonical_rejected_task_contract().items()
                if key not in {"schema_version", "digest"}
            }
            if has_legacy and not has_contract:
                return (
                    {
                        "schema_version": "1.0",
                        "idempotency_key": "redacted-input",
                        "task_contract": safe_contract,
                        "legacy_converted": True,
                    },
                    _dedupe(redaction_rejections),
                    True,
                )
            safe = {
                "schema_version": "1.0",
                "idempotency_key": "redacted-input",
                "task_contract": safe_contract,
            }
            return safe, _dedupe(redaction_rejections), False
        if task.get("schema_version") != "1.0":
            rejections.append(_problem("schema_version", "input schema version is unsupported"))
        allowed = LEGACY_INPUT_FIELDS if has_legacy and not has_contract else (
            RESUME_INPUT_FIELDS if "resume_run_id" in task else NEW_INPUT_FIELDS
        )
        if set(task) - allowed:
            rejections.append(_problem("unknown_input_field", "input envelope contains unknown properties"))
        if has_legacy and has_contract:
            rejections.append(_problem("ambiguous_input_envelope", "legacy and canonical inputs cannot be combined"))
            return task, rejections, False
        if not has_legacy:
            kind = "resume_input_envelope" if "resume_run_id" in task else "canonical_input_envelope"
            rejections.extend(self._schema_rejections(kind, task))
            return task, rejections, False
        legacy = task.get("legacy_single_agent")
        enabled = bool(self.policy.get("legacy_adapter", {}).get("enabled", False))
        if not enabled:
            rejections.append(_problem("legacy_adapter_disabled", "legacy adapter is disabled by policy"))
        if not isinstance(legacy, Mapping):
            rejections.append(_problem("invalid_legacy_input", "legacy input must be an object"))
            legacy = {}
        elif set(legacy) - {"agent", "task", "paths"}:
            rejections.append(_problem("unknown_input_field", "legacy input contains unknown properties"))
        agent = str(legacy.get("agent", ""))
        known = {str(item.get("id")) for item in self.registry.get("agents", [])}
        if agent not in known:
            rejections.append(_problem("unknown_agent", "legacy requested agent is unknown"))
        title = str(legacy.get("task", ""))
        paths = [str(path) for path in legacy.get("paths", [])]
        task.pop("legacy_single_agent", None)
        task["task_contract"] = legacy_contract(agent, title, paths)
        task["legacy_converted"] = True
        converted = True
        return task, rejections, converted

    def _resume(
        self,
        run_id: str,
        task: Mapping[str, Any],
        *,
        envelope_rejections: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        with self.store.interprocess_lock(run_id):
            run = self.store.load(run_id)
            if run is None:
                return {
                    "run_id": run_id,
                    "state": "blocked",
                    "blockers": [_problem("resume_not_found", "requested run does not exist")],
                    "rejections": [],
                    "artifacts": [],
                }
            if run.get("integrity_status") != "verified":
                result = copy.deepcopy(run)
                result["state"] = "blocked"
                result.setdefault("blockers", []).append(
                    _problem("integrity_failure", "persisted run failed integrity verification")
                )
                return result
            if is_terminal(run, self._policy_for(run)):
                result = copy.deepcopy(run)
                result.setdefault("rejections", []).append(
                    _problem("terminal_immutable", "terminal run cannot accept new events or requests")
                )
                return result
            envelope_errors: list[dict[str, str]] = []
            envelope_errors.extend(copy.deepcopy(envelope_rejections or []))
            envelope_errors.extend(self._schema_rejections("resume_input_envelope", task))
            if task.get("schema_version") != "1.0":
                envelope_errors.append(_problem("schema_version", "resume schema version is unsupported"))
            if set(task) - RESUME_INPUT_FIELDS:
                envelope_errors.append(_problem("unknown_input_field", "resume envelope contains unknown properties"))
            if sensitive_reason(task):
                envelope_errors = [_problem("redaction_required", "resume input contains private data")]
            supplied_contract = task.get("contract_digest")
            if supplied_contract is not None and supplied_contract != run.get("contract_digest"):
                result = copy.deepcopy(run)
                result["state"] = "blocked"
                result.setdefault("rejections", []).extend(envelope_errors)
                result.setdefault("rejections", []).append(
                    _problem("contract_mismatch", "resume contract digest does not match")
                )
                return result
            supplied_revision = task.get("expected_revision")
            if supplied_revision is not None and supplied_revision != run.get("revision"):
                result = copy.deepcopy(run)
                result["state"] = "blocked"
                result.setdefault("rejections", []).append(_problem("stale_revision", "resume revision is stale"))
                return result
            if envelope_errors:
                result = copy.deepcopy(run)
                result.setdefault("rejections", []).extend(_dedupe(envelope_errors))
                return result
            current_revision = int(run["revision"])
            before = copy.deepcopy(run)
            self._process_events(run, list(task.get("events", [])))
            self._resolve_finding_conflicts(run)
            self._handle_requests(run, task)
            if not self._reserved_event_batch_is_exact(run, prior_run=before):
                result = copy.deepcopy(before)
                result["rejections"].append(
                    _problem(
                        "event_batch_after_reserved",
                        "event batch cannot mix a reserved transition cause with unrelated evidence",
                    )
                )
                return result
            if self._persistable_change(before, run):
                self._finalize(run, expected_revision=current_revision)
            return copy.deepcopy(run)

    def _new_run(
        self,
        run_id: str,
        idempotency_key: str,
        contract: dict[str, Any],
        legacy_converted: bool,
        *,
        role_assignments: Mapping[str, Any],
        input_problem_projection: Mapping[str, Any],
    ) -> dict[str, Any]:
        contract_digest = contract.get("digest", digest(contract))
        role_snapshot = (
            copy.deepcopy(dict(role_assignments))
            if isinstance(role_assignments, Mapping)
            else {}
        )
        run: dict[str, Any] = {
            "schema_version": "1.0",
            "run_id": run_id,
            "revision": 0,
            "idempotency_key": idempotency_key,
            "contract_digest": contract_digest,
            "task_contract": contract,
            "role_assignments": role_snapshot,
            "role_assignments_digest": digest(role_snapshot),
            "legacy_converted": legacy_converted,
            "orchestrator": {"id": "team_harness", "role": "orchestrator"},
            "execution_policy": copy.deepcopy(self.policy),
            "registry_binding": {
                "schema_version": self.registry.get("schema_version"),
                "registry_kind": self.registry.get("registry_kind"),
                "registry_digest": digest(self.registry),
            },
            "team": [],
            "selection": {"writer": None, "fallback": None, "eligible_writers": []},
            "thread_count": 0,
            "max_depth_used": min(1, int(self.policy.get("max_depth", 1))),
            "runtime": {"profiles": {}, "runtime_verified": False},
            "blockers": [],
            "rejections": [],
            "findings": [],
            "finding_catalog": [],
            "conflicts": [],
            "interface_contracts": [],
            "boundaries": {},
            "architecture_decisions": [],
            "security_checks": [],
            "write_ownership": [],
            "ownership_revision": 1,
            "lease_epoch": 1,
            "authority_grants": {"write": {}, "quality": {"initial": {}, "final": {}}},
            "write_authorized": False,
            "parallel_write_candidate": False,
            "parallel_write_approved": False,
            "integration_owner": None,
            "post_integration_reverification": {"required": False},
            "shared_plan": {"schema_version": "1.0", "revision": 1, "steps": [], "waves": [], "fallback": None},
            "attempt_count": 1,
            "retry_causes": {},
            "failure_history": [],
            "fix_evidence_attempt": 0,
            "implementation_log": [],
            "input_fingerprint": digest(contract),
            "environment_fingerprint": digest({"runtime": "unverified", "policy": digest(self.policy)}),
            "diff_digest": digest("initial-no-diff"),
            "artifact_revision": 1,
            "current_artifact_digest": "",
            "initial_verification_report": self._empty_report("verification", "initial"),
            "final_verification_report": self._empty_report("verification", "final"),
            "initial_review_report": self._empty_report("review", "initial"),
            "final_review_report": self._empty_report("review", "final"),
            "verification_report": self._empty_verification_summary(),
            "review_report": self._empty_review_summary(),
            "implementation_approval": {"source": "none", "approved": False},
            "source_sync": {},
            "improvement_proposals": [],
            "completion_report": {},
            "artifacts": [],
            "human_summary": human_summary(contract),
            "catalog_projection": catalog_projection(self.registry),
            "metrics": {},
            "integrity_status": "verified",
        }
        run["start_request"] = canonical_start_request(
            run, input_problem_projection=input_problem_projection
        )
        run["start_request_digest"] = digest(run["start_request"])
        initialize_trace(run)
        self._refresh_artifact_digest(run)
        run["source_sync"] = canonical_inactive_source_projection(run)
        run["completion_report"] = canonical_completion_projection(
            run,
            generation_revision=None,
            complete=False,
            gate="not_evaluated",
            reasons=[],
        )
        return run

    @staticmethod
    def _empty_report(report: str, phase: str) -> dict[str, Any]:
        return {
            "schema_version": "1.0",
            "report": report,
            "phase": phase,
            "status": "not_run",
            "actor": None,
            "attempt": None,
            "plan_revision": None,
            "artifact_revision": None,
            "artifact_digest": None,
            "diff_digest": None,
            "input_fingerprint": None,
            "environment_fingerprint": None,
            "report_digest": None,
            "provenance": None,
            "cause": None,
            "checks": [],
            "authority_grant": None,
            "staging_artifact_digest": None,
            "source_manifest_digest": None,
            "source_revision": None,
        }

    @staticmethod
    def _empty_verification_summary() -> dict[str, Any]:
        return {
            "status": "not_run", "phase": None, "checks": [], "cause": None,
            "report_digest": None,
        }

    @staticmethod
    def _empty_review_summary() -> dict[str, Any]:
        return {
            "status": "not_run", "phase": None, "checks": [], "findings": [],
            "cause": None, "report_digest": None,
        }

    def _form_team(
        self, run: dict[str, Any], role_assignments: Mapping[str, Any] | None = None
    ) -> None:
        selected = select_team(
            self.registry, run["task_contract"], role_assignments=role_assignments
        )
        run["team"] = selected["team"]
        run["selection"] = {
            "writer": selected["writer"],
            "fallback": selected["fallback"],
            "eligible_writers": selected["eligible_writers"],
        }
        max_threads = int(self._policy_for(run).get("max_threads", 3))
        implementation = [
            member for member in run["team"] if member["role"] in {"writer", "specialist"}
        ]
        if len(implementation) > max_threads:
            retained_ids = {member["id"] for member in implementation[:max_threads]}
            run["team"] = [
                member for member in run["team"]
                if member["role"] in {"reviewer", "verifier"} or member["id"] in retained_ids
            ]
        waves = plan_waves(run["team"], max_threads)
        run["shared_plan"]["waves"] = waves
        run["shared_plan"]["fallback"] = selected["fallback"]
        run["thread_count"] = max((len(wave["agents"]) for wave in waves), default=0)
        run["runtime"]["profiles"] = {member["id"]: member["model_profile"] for member in run["team"]}
        if selected["writer"]:
            run["write_ownership"] = copy.deepcopy(selected.get("write_ownership", []))

        domains = set(run["task_contract"].get("affected_domains", []))
        capabilities = set(run["task_contract"].get("required_capabilities", []))
        if {"frontend", "backend"}.issubset(domains):
            run["interface_contracts"].append(
                {"kind": "frontend_backend", "contract": "typed props and API payload are fixed before implementation"}
            )
        names = capabilities & {"dto", "repository", "service", "strategy"}
        run["boundaries"] = {name: f"{name} responsibility remains isolated" for name in sorted(names)}
        if "architecture" in domains or "adr" in capabilities:
            run["architecture_decisions"].append(
                {"status": "accepted", "kind": "design_decision", "owner": "human_or_parent"}
            )
        if "security" in domains:
            run["security_checks"] = [
                {"check": "authorization", "status": "required"},
                {"check": "input validation", "status": "required"},
            ]
        steps = [f"check {capability}" for capability in sorted(capabilities)] or ["execute contracted change"]
        run["shared_plan"]["steps"] = steps
        self._refresh_artifact_digest(run)
        run["rejections"].extend(
            canonical_team_assignment_rejections(run, self.registry)
        )
        self._issue_authority_grants(run)

    def _advance_initial(self, run: dict[str, Any]) -> None:
        policy = self._policy_for(run)
        states = list(policy.get("states", []))
        write_states = list(
            policy.get("write_authorization", {}).get("allowed_states", [])
        )
        initial_write_state = write_states[0] if write_states else None
        try:
            stop = states.index(initial_write_state) + 1
        except ValueError:
            stop = 1
        for state in states[1:stop]:
            if not self._transition(run, state, reason="orchestrator workflow"):
                break

    def _issue_authority_grants(self, run: dict[str, Any]) -> None:
        current_grants = run.get("authority_grants", {})
        current_write = current_grants.get("write", {})
        current_quality = current_grants.get("quality", {})
        write: dict[str, Any] = {}
        for ownership in run.get("write_ownership", []):
            if not isinstance(ownership, Mapping):
                continue
            agent = str(ownership.get("owner", ""))
            paths = [str(path) for path in ownership.get("paths", [])]
            if not agent or not paths:
                continue
            existing = current_write.get(agent) if isinstance(current_write, Mapping) else None
            if (
                isinstance(existing, Mapping)
                and not validate_stored_grant(existing, existing)
                and existing.get("run_id") == run.get("run_id")
                and existing.get("agent") == agent
                and existing.get("epoch") == run.get("lease_epoch")
                and existing.get("ownership_revision") == run.get("ownership_revision")
                and list(existing.get("paths", [])) == paths
                and existing.get("issued_revision") is not None
                and int(existing.get("issued_revision", 0)) <= int(run.get("revision", 0))
            ):
                write[agent] = copy.deepcopy(dict(existing))
                continue
            grant = {
                "grant_id": "grant-write-" + digest(
                    {"run": run["run_id"], "agent": agent, "epoch": run["lease_epoch"], "paths": paths}
                )[-16:],
                "kind": "write",
                "run_id": run["run_id"],
                "agent": agent,
                "epoch": run["lease_epoch"],
                "expires_at": "2099-01-01T00:00:00Z",
                "ownership_revision": run["ownership_revision"],
                "paths": paths,
                "issued_revision": int(run.get("revision", 0)) + 1,
                "issued_by": "team_harness",
                "runtime_authenticity_verified": False,
                "runtime_authenticity_status": "unverified",
            }
            grant["grant_digest"] = digest(grant)
            write[agent] = grant
        quality: dict[str, dict[str, Any]] = {"initial": {}, "final": {}}
        by_role = {member["role"]: member["id"] for member in run.get("team", [])}
        for phase in ("initial", "final"):
            if phase == "final" and not run.get("source_sync", {}).get("accepted"):
                continue
            for role in ("verifier", "reviewer"):
                actor = by_role.get(role)
                if not actor:
                    continue
                existing = (
                    current_quality.get(phase, {}).get(role)
                    if isinstance(current_quality, Mapping)
                    and isinstance(current_quality.get(phase), Mapping)
                    else None
                )
                if (
                    isinstance(existing, Mapping)
                    and not validate_stored_grant(existing, existing)
                    and existing.get("run_id") == run.get("run_id")
                    and existing.get("actor") == actor
                    and existing.get("role") == role
                    and existing.get("phase") == phase
                    and existing.get("attempt") == run.get("attempt_count")
                    and existing.get("plan_revision")
                    == run.get("shared_plan", {}).get("revision")
                    and existing.get("artifact_revision")
                    == run.get("artifact_revision")
                    and existing.get("artifact_digest")
                    == run.get("current_artifact_digest")
                    and existing.get("issued_revision") is not None
                    and int(existing.get("issued_revision", 0))
                    <= int(run.get("revision", 0))
                ):
                    quality[phase][role] = copy.deepcopy(dict(existing))
                    continue
                grant = {
                    "grant_id": "grant-quality-" + digest(
                        {
                            "run": run["run_id"], "actor": actor, "role": role, "phase": phase,
                            "attempt": run["attempt_count"], "artifact": run["current_artifact_digest"],
                        }
                    )[-16:],
                    "kind": "quality",
                    "run_id": run["run_id"],
                    "actor": actor,
                    "role": role,
                    "phase": phase,
                    "attempt": run["attempt_count"],
                    "plan_revision": run["shared_plan"]["revision"],
                    "artifact_revision": run["artifact_revision"],
                    "artifact_digest": run["current_artifact_digest"],
                    "issued_revision": int(run.get("revision", 0)) + 1,
                    "expires_at": "2099-01-01T00:00:00Z",
                    "issued_by": "team_harness",
                    "runtime_authenticity_verified": False,
                    "runtime_authenticity_status": "unverified",
                }
                grant["grant_digest"] = digest(grant)
                quality[phase][role] = grant
        run["authority_grants"] = {"write": write, "quality": quality}

    def _handle_requests(self, run: dict[str, Any], task: Mapping[str, Any]) -> None:
        if isinstance(task.get("worktree_request"), Mapping):
            self._parallel_write(run, task["worktree_request"])
        if isinstance(task.get("write_request"), Mapping):
            run["write_authorized"] = False
            run["rejections"].append(
                _problem("run_scoped_authorization_required", "use authorize_write with run id and parent lease")
            )
        if isinstance(task.get("source_sync_request"), Mapping):
            self._source_sync(run, task["source_sync_request"])

    def _process_events(self, run: dict[str, Any], events: list[Any]) -> None:
        normalized: list[dict[str, Any]] = []
        validation_rejections: list[dict[str, str]] = []
        for raw in events:
            if not isinstance(raw, Mapping):
                validation_rejections.append(
                    _problem("invalid_event", "event must be an object")
                )
                continue
            event = copy.deepcopy(dict(raw))
            if sensitive_reason(event):
                validation_rejections.append(
                    _problem("redaction_required", "event contains private data")
                )
                continue
            event_type = str(event.get("type", ""))
            schema_errors = self._schema_rejections("runtime_event", event)
            if schema_errors:
                validation_rejections.extend(schema_errors)
                continue
            allowed = EVENT_FIELDS.get(event_type)
            if allowed is None:
                validation_rejections.append(
                    _problem("unknown_event", "event type is unsupported")
                )
                continue
            if set(event) - allowed:
                validation_rejections.append(
                    _problem("unknown_event_field", "event contains unknown properties")
                )
                continue
            normalized.append(event)
        if validation_rejections:
            run["rejections"].extend(_dedupe(validation_rejections))
            return

        candidate = copy.deepcopy(run)
        for index, event in enumerate(normalized):
            rejection_count = len(candidate.get("rejections", []))
            state_before = candidate.get("state")
            self._process_validated_event(candidate, event)
            new_rejections = candidate.get("rejections", [])[rejection_count:]
            accepted_internal_gate = (
                candidate.get("state") != state_before
                and candidate.get("state") in self._reserved_states(candidate)
            )
            if new_rejections and not accepted_internal_gate:
                run["rejections"].extend(
                    copy.deepcopy(new_rejections)
                )
                return
            if (
                index < len(normalized) - 1
                and candidate.get("state") in self._reserved_states(candidate)
            ):
                run["rejections"].append(
                    _problem(
                        "event_batch_after_reserved",
                        "event batch cannot mutate after reaching a reserved or terminal state",
                    )
                )
                return
        run.clear()
        run.update(candidate)

    def _process_validated_event(
        self, run: dict[str, Any], event: Mapping[str, Any]
    ) -> None:
            event_type = str(event.get("type", ""))
            if event_type == "finding":
                self._record_finding(run, event)
            elif event_type in {"verification_report", "review_report"}:
                self._quality_report(run, event)
            elif event_type == "fix_applied":
                self._fix_applied(run, event)
            elif event_type == "plan_revised":
                run["shared_plan"]["revision"] += 1
                run["shared_plan"]["steps"].append(str(event.get("change", "plan revised")))
                run["artifact_revision"] += 1
                self._invalidate_evidence(run, reason="plan revised")
            elif event_type == "ownership_revised":
                self._revise_ownership(run, event)
            elif event_type == "work_submission":
                if event.get("plan_revision") != run["shared_plan"]["revision"]:
                    run["rejections"].append(_problem("stale_plan_revision", "work used a stale Shared Plan"))
            elif event_type == "interrupt":
                self._transition(
                    run, "blocked", reason="run interrupted", gate_internal=True
                )
            elif event_type == "resume":
                if self._transition(
                    run, "received", reason="run resumed", gate_internal=True
                ):
                    pass
            elif event_type == "cancel":
                self._cancel_run(run, event)
            elif event_type == "implementation_approved":
                run["rejections"].append(
                    _problem("direct_approval_forbidden", "implementation approval must be derived from reports")
                )
            elif event_type == "failure_observed":
                cause = str(event.get("cause", "")).strip().lower()
                stops = {str(item).strip().lower() for item in run["task_contract"].get("stop_conditions", [])}
                if cause in stops:
                    run["rejections"].append(_problem("stop_condition", "Task Contract stop condition matched"))
                    self._transition(
                        run,
                        "blocked",
                        reason="Task Contract stop condition",
                        gate_internal=True,
                    )
                else:
                    run["rejections"].append(_problem("failure_unclassified", "failure does not match a stop condition"))
            elif event_type == "improvement_proposed":
                self._record_improvement(run, event)
            elif event_type == "artifact":
                self._record_external_artifact(run, event)
            elif event_type == "transition":
                self._requested_transition(run, event)

    def _quality_report(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        required = {
            "actor",
            "authority_grant",
            "checks",
            "attempt",
            "plan_revision",
            "artifact_revision",
            "artifact_digest",
            "diff_digest",
            "input_fingerprint",
            "environment_fingerprint",
            "report_digest",
            "provenance",
        }
        missing = sorted(required - set(event))
        if missing:
            run["rejections"].append(_problem("report_evidence_missing", "quality report evidence is incomplete"))
            return
        report = "verification" if event.get("type") == "verification_report" else "review"
        phase = str(event.get("phase", "initial"))
        if phase not in {"initial", "final"}:
            run["rejections"].append(_problem("report_phase_invalid", "quality report phase is invalid"))
            return
        expected_role = "verifier" if report == "verification" else "reviewer"
        actor = next((member["id"] for member in run["team"] if member["role"] == expected_role), None)
        evidence_errors: list[dict[str, str]] = []
        stored_grant = run.get("authority_grants", {}).get("quality", {}).get(phase, {}).get(expected_role)
        evidence_errors.extend(validate_stored_grant(event.get("authority_grant"), stored_grant))
        if not isinstance(stored_grant, Mapping) or (
            stored_grant.get("issued_revision") is None
            or int(stored_grant.get("issued_revision", 0)) > int(run.get("revision", 0))
        ):
            evidence_errors.append(
                _problem(
                    "authority_generation_uncommitted",
                    "quality authority grant must come from a prior committed generation",
                )
            )
        if event.get("actor") != actor:
            evidence_errors.append(_problem("report_actor_mismatch", "quality report actor does not own this role"))
        bindings = {
            "attempt": run["attempt_count"],
            "plan_revision": run["shared_plan"]["revision"],
            "artifact_revision": run["artifact_revision"],
            "artifact_digest": run["current_artifact_digest"],
            "diff_digest": run["diff_digest"],
            "input_fingerprint": run["input_fingerprint"],
            "environment_fingerprint": run["environment_fingerprint"],
        }
        for key, expected in bindings.items():
            if event.get(key) != expected:
                evidence_errors.append(_problem(f"report_{key}_mismatch", f"quality report {key} is stale"))
        provenance = event.get("provenance")
        if not isinstance(provenance, Mapping) or (
            provenance.get("producer") != event.get("actor")
            or provenance.get("run_id") != run["run_id"]
            or provenance.get("contract_digest") != run["contract_digest"]
        ):
            evidence_errors.append(_problem("report_provenance_mismatch", "quality report provenance is invalid"))
        checks = event.get("checks")
        required_checks = [
            str(item) for item in run["task_contract"].get("required_checks", [])
        ]
        if not isinstance(checks, list) or [str(item) for item in checks] != required_checks:
            evidence_errors.append(
                _problem(
                    "required_checks_missing",
                    "quality report checks must exactly match Task Contract checks",
                )
            )
        if phase == "final":
            sync = run.get("source_sync", {})
            staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
            if not isinstance(staging, Mapping) or (
                event.get("staging_artifact_digest") != staging.get("digest")
                or event.get("source_manifest_digest") != sync.get("manifest_digest")
            ):
                evidence_errors.append(
                    _problem("staging_binding_required", "final report must bind current staging and source manifest")
                )
        unsigned = {key: value for key, value in event.items() if key != "report_digest"}
        if not valid_digest(event.get("report_digest")) or event.get("report_digest") != digest(unsigned):
            evidence_errors.append(_problem("report_digest_mismatch", "quality report digest is invalid"))
        if evidence_errors:
            run["rejections"].extend(evidence_errors)
            return
        if run["state"] == "retrying" and run.get("fix_evidence_attempt", 0) < run["attempt_count"]:
            run["rejections"].append(_problem("fix_evidence_required", "retry requires changed fix evidence"))
            return

        normalized = {
            "schema_version": "1.0", "report": report, **copy.deepcopy(dict(event)),
            "source_revision": run.get("source_sync", {}).get("committed_revision") if phase == "final" else None,
        }
        normalized.setdefault("cause", None)
        normalized.setdefault("staging_artifact_digest", None)
        normalized.setdefault("source_manifest_digest", None)
        key = f"{phase}_{report}_report"
        run[key] = normalized
        status = str(event.get("status", ""))
        cause = str(event.get("cause", f"{report}_failed"))
        summary = {
            "status": status,
            "phase": phase,
            "checks": copy.deepcopy(list(event.get("checks", []))),
            "cause": event.get("cause"),
            "report_digest": event.get("report_digest"),
        }
        if phase == "initial":
            if report == "verification":
                if run["state"] in set(
                    self._policy_for(run)
                    .get("write_authorization", {})
                    .get("allowed_states", [])
                ):
                    self._transition(run, "verifying", reason="initial verification report received")
                run["verification_report"] = summary
                if status == "passed":
                    self._transition(run, "reviewing", reason="initial verification passed")
                elif status == "failed":
                    self._remember_failure(run, normalized, cause)
                    self._retry_failure(run, cause, "verification")
                else:
                    self._remember_failure(run, normalized, cause)
                    blocked_reason, blocked_rejection = canonical_quality_blocker_projection(
                        "initial", "verification", cause
                    )
                    run["rejections"].append(blocked_rejection)
                    self._transition(
                        run, "blocked", reason=blocked_reason,
                        gate_internal=True,
                    )
            else:
                run["review_report"] = {
                    **summary,
                    "findings": [] if status == "passed" else [cause],
                }
                if status == "failed":
                    self._record_finding(
                        run,
                        {
                            "source": str(event.get("actor")),
                            "actor": str(event.get("actor")),
                            "issue_id": "REPORT-" + str(event.get("report_digest", ""))[-12:].upper(),
                            "clause": "initial.review",
                            "location": "run",
                            "kind": "design",
                            "message": cause,
                            "status": "open",
                        },
                    )
                    self._remember_failure(run, normalized, cause)
                    self._retry_failure(run, cause, "review")
                elif status == "passed":
                    self._derive_approval(run)
                else:
                    self._remember_failure(run, normalized, cause)
                    blocked_reason, blocked_rejection = canonical_quality_blocker_projection(
                        "initial", "review", cause
                    )
                    run["rejections"].append(blocked_rejection)
                    self._transition(
                        run, "blocked", reason=blocked_reason,
                        gate_internal=True,
                    )
        else:
            if report == "verification":
                if run["state"] != "source_sync":
                    run["rejections"].append(_problem("final_verification_state", "final verification requires staged source"))
                    return
                run["verification_report"] = summary
                if status == "passed":
                    self._transition(
                        run,
                        "final_verification",
                        reason="final verification passed",
                        gate_internal=True,
                    )
                elif status == "failed":
                    self._remember_failure(run, normalized, cause)
                    self._retry_failure(run, cause, "final_verification")
                elif status == "blocked":
                    self._remember_failure(run, normalized, cause)
                    blocked_reason, blocked_rejection = canonical_quality_blocker_projection(
                        "final", "verification", cause
                    )
                    run["rejections"].append(blocked_rejection)
                    self._transition(
                        run, "blocked", reason=blocked_reason,
                        gate_internal=True,
                    )
            else:
                if run["state"] != "final_verification":
                    run["rejections"].append(_problem("final_review_state", "final review requires final verification"))
                    return
                run["review_report"] = {
                    **summary,
                    "findings": [] if status == "passed" else [cause],
                }
                if status == "passed":
                    self._transition(
                        run,
                        "final_review",
                        reason="final review passed",
                        gate_internal=True,
                    )
                elif status == "failed":
                    self._record_finding(
                        run,
                        {
                            "source": str(event.get("actor")),
                            "actor": str(event.get("actor")),
                            "issue_id": "FINAL-DRIFT",
                            "clause": "final-review.artifact-drift",
                            "location": "source-update-manifest",
                            "kind": "drift",
                            "message": cause,
                            "status": "open",
                            "position": "reject",
                        },
                    )
                    self._remember_failure(run, normalized, cause)
                    self._retry_failure(
                        run,
                        cause,
                        "final_review",
                        limit_target=str(
                            self._policy_for(run)
                            .get("evidence_gates", {})
                            .get("final_review_retry_limit_state")
                        ),
                    )
                elif status == "blocked":
                    self._remember_failure(run, normalized, cause)
                    blocked_reason, blocked_rejection = canonical_quality_blocker_projection(
                        "final", "review", cause
                    )
                    run["rejections"].append(blocked_rejection)
                    self._transition(
                        run, "blocked", reason=blocked_reason,
                        gate_internal=True,
                    )

    def _cancel_run(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        """Enter cancelled only through the closed orchestrator cancellation event."""

        actor = str(event.get("actor", ""))
        reason = str(event.get("reason", "")).strip()
        if actor != "orchestrator" or not reason:
            run["rejections"].append(
                _problem(
                    "cancellation_evidence_invalid",
                    "cancellation requires the orchestrator and a non-empty reason",
                )
            )
            return
        current = str(run.get("state", ""))
        allowed = self._policy_for(run).get("allowed_transitions", {}).get(current, [])
        if "cancelled" not in allowed:
            run["rejections"].append(
                _problem(
                    "policy_transition_forbidden",
                    "Execution Policy does not permit cancellation from the current state",
                )
            )
            return
        self._transition(
            run,
            "cancelled",
            actor=actor,
            reason=reason,
            gate_internal=True,
        )

    def _derive_approval(self, run: dict[str, Any]) -> None:
        verification = run["initial_verification_report"]
        review = run["initial_review_report"]
        unresolved = self._unresolved(run)
        current = self._report_is_current(run, verification) and self._report_is_current(run, review)
        builtin_checks = {"unit", "contract", "verification", "review"}
        required_checks = {str(item) for item in run["task_contract"].get("required_checks", [])}
        receipt_checks = {
            str(check_id)
            for item in self._verified_artifact_receipts(run)
            for check_id in item.get("check_ids", [])
        }
        missing_check_receipts = required_checks - builtin_checks - receipt_checks
        if missing_check_receipts:
            run["rejections"].append(
                _problem("check_receipt_missing", "required check receipt is missing")
            )
        if (
            verification.get("status") == "passed"
            and review.get("status") == "passed"
            and current
            and not unresolved
            and not missing_check_receipts
        ):
            run["implementation_approval"] = {
                "source": "derived",
                "approved": True,
                "artifact_revision": run["artifact_revision"],
                "artifact_digest": run["current_artifact_digest"],
                "verification_report_digest": verification["report_digest"],
                "review_report_digest": review["report_digest"],
                "required_deliverables": copy.deepcopy(run["task_contract"].get("required_deliverables", [])),
                "approval_boundaries": copy.deepcopy(run["task_contract"].get("approval_boundaries", [])),
            }
            self._transition(run, "implementation_approved", reason="current initial reports passed", gate_internal=True)
        else:
            run["rejections"].append(
                _problem("unresolved_approval_evidence", "approval has unresolved or stale evidence")
            )

    def _retry_failure(
        self,
        run: dict[str, Any],
        cause: str,
        source: str,
        *,
        limit_target: str = "failed",
    ) -> None:
        cause_key = digest(str(cause).strip().lower())
        run["retry_causes"][cause_key] = int(run["retry_causes"].get(cause_key, 0)) + 1
        if run["retry_causes"][cause_key] > int(self._policy_for(run).get("same_cause_retry_limit", 2)):
            run["rejections"].append(_problem("retry_limit", "same-cause retry limit exceeded"))
            self._transition(
                run,
                limit_target,
                reason="same-cause retry limit exceeded",
                gate_internal=True,
            )
        else:
            retry_reason = f"{source} failed: {cause}"
            self._transition(run, "retrying", reason=retry_reason)

    @staticmethod
    def _remember_failure(run: dict[str, Any], report: Mapping[str, Any], cause: str) -> None:
        normalized_cause = str(cause).strip().lower()
        resolved_finding_digests = {
            str(item.get("finding_digest"))
            for item in run.get("implementation_log", [])
            if isinstance(item, Mapping)
            and item.get("kind") == "finding_resolution_receipt"
            and item.get("status") == "resolved"
        }
        matching_findings = [
            item
            for item in run.get("findings", [])
            if str(item.get("digest")) not in resolved_finding_digests
            and (
                str(item.get("message", "")).strip().lower() == normalized_cause
                or str(item.get("issue_id", "")).strip().lower() == normalized_cause
            )
        ]
        issue_ids = [str(item.get("issue_id")) for item in matching_findings]
        finding_identities = [
            {
                "issue_id": item.get("issue_id"),
                "clause": item.get("clause"),
                "location": item.get("location"),
                "source": item.get("source"),
                "finding_digest": item.get("digest"),
            }
            for item in matching_findings
        ]
        run.setdefault("failure_history", []).append(
            {
                "report_digest": report.get("report_digest"),
                "attempt": run.get("attempt_count"),
                "cause": str(cause),
                "cause_fingerprint": digest(normalized_cause),
                "issue_ids": sorted(set(issue_ids)),
                "finding_identities": finding_identities,
                "report_generation_ref": None,
                "report_generation_revision": None,
                "report": report.get("report"),
                "phase": report.get("phase"),
                "report_snapshot": copy.deepcopy(dict(report)),
            }
        )

    def _fix_applied(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        required = {
            "actor", "cause", "attempt", "plan_revision", "issue_ids", "failed_report_digest",
            "cause_fingerprint", "changed_input_fingerprint", "changed_diff_digest",
            "environment_fingerprint", "fix_artifact",
        }
        if required - set(event):
            run["rejections"].append(
                _problem("fix_evidence_required", "strict fix evidence fields are required")
            )
            return
        writer = run.get("selection", {}).get("writer")
        cause_fingerprint = digest(str(event.get("cause", "")).strip().lower())
        issue_ids = event.get("issue_ids")
        if not isinstance(issue_ids, list) or len(issue_ids) != len(set(str(item) for item in issue_ids)):
            run["rejections"].append(_problem("fix_evidence_required", "fix issue ids must be a unique array"))
            return
        explicit_issues = {str(item) for item in issue_ids}
        history = next(
            (
                item for item in reversed(run.get("failure_history", []))
                if item.get("report_digest") == event.get("failed_report_digest")
                and item.get("cause_fingerprint") == cause_fingerprint
                and item.get("attempt") == run.get("attempt_count")
            ),
            None,
        )
        if history is None:
            run["rejections"].append(
                _problem("fix_evidence_required", "fix must bind the current failed report and cause")
            )
            return
        if not explicit_issues.issubset(set(str(item) for item in history.get("issue_ids", []))):
            run["rejections"].append(
                _problem("fix_issue_causality", "fix issue ids are not caused by the bound failed report")
            )
            return
        receipt = event.get("fix_artifact")
        persisted_receipts = self._verified_artifact_receipts(run)
        valid_receipt = isinstance(receipt, Mapping) and any(
            dict(receipt) == item for item in persisted_receipts
        )
        provenance = receipt.get("provenance", {}) if isinstance(receipt, Mapping) else {}
        receipt_issues = set(str(item) for item in receipt.get("issue_ids", [])) if isinstance(receipt, Mapping) else set()
        if not valid_receipt or not (
            receipt.get("digest") == event.get("changed_diff_digest")
            and provenance.get("run_id") == run["run_id"]
            and provenance.get("producer") == writer
            and provenance.get("contract_digest") == run["contract_digest"]
            and provenance.get("plan_revision") == run["shared_plan"]["revision"]
            and explicit_issues.issubset(receipt_issues)
        ):
            run["rejections"].append(
                _problem("fix_artifact_unverified", "fix artifact must match a persisted causal receipt")
            )
            return
        required_receipt_ids = {
            str(condition).removeprefix("receipt:")
            for condition in run.get("task_contract", {}).get("retry_conditions", [])
            if str(condition).startswith("receipt:")
        }
        causal_receipt_ids = {
            str(receipt.get("receipt_id", "")),
            *(str(item) for item in receipt.get("check_ids", [])),
            *(str(item) for item in receipt.get("deliverable_ids", [])),
        }
        missing_retry_receipts = required_receipt_ids - causal_receipt_ids
        if missing_retry_receipts:
            run["rejections"].append(
                _problem(
                    "retry_condition_receipt_missing",
                    "retry condition receipt is missing: "
                    + ", ".join(
                        f"receipt:{item}" for item in sorted(missing_retry_receipts)
                    ),
                )
            )
            return
        valid = (
            run["state"] == "retrying"
            and event.get("actor") == writer
            and event.get("attempt") == run["attempt_count"] + 1
            and event.get("plan_revision") == run["shared_plan"]["revision"]
            and event.get("cause_fingerprint") == cause_fingerprint
            and event.get("changed_input_fingerprint") == run["input_fingerprint"]
            and event.get("environment_fingerprint") == run["environment_fingerprint"]
            and valid_digest(event.get("changed_diff_digest"))
        )
        if not valid:
            run["rejections"].append(_problem("fix_evidence_required", "fix evidence is stale or incomplete"))
            return
        run["attempt_count"] = int(event["attempt"])
        run["diff_digest"] = str(event["changed_diff_digest"])
        run["artifact_revision"] += 1
        run["fix_evidence_attempt"] = run["attempt_count"]
        cause = str(event.get("cause", ""))
        causal_finding_digests = {
            str(identity.get("finding_digest"))
            for identity in history.get("finding_identities", [])
            if isinstance(identity, Mapping)
            and str(identity.get("issue_id")) in explicit_issues
        }
        for finding in run["findings"]:
            if str(finding.get("digest")) not in causal_finding_digests:
                continue
            resolution = {
                "receipt_id": "resolution-"
                + digest(
                    {
                        "run_id": run["run_id"],
                        "finding_digest": finding.get("digest"),
                        "fix_receipt_id": receipt.get("receipt_id"),
                        "attempt": run["attempt_count"],
                    }
                )[-20:],
                "kind": "finding_resolution_receipt",
                "sequence": len(run["implementation_log"]) + 1,
                "status": "resolved",
                "issue_id": finding.get("issue_id"),
                "clause": finding.get("clause"),
                "location": finding.get("location"),
                "source": finding.get("source"),
                "finding_identity": {
                    "issue_id": finding.get("issue_id"),
                    "clause": finding.get("clause"),
                    "location": finding.get("location"),
                    "source": finding.get("source"),
                    "finding_digest": finding.get("digest"),
                },
                "finding_digest": finding.get("digest"),
                "fix_receipt_id": receipt.get("receipt_id"),
                "fix_artifact_digest": receipt.get("digest"),
                "failed_report_digest": event.get("failed_report_digest"),
                "attempt": run["attempt_count"],
                "cause": cause,
                "cause_fingerprint": cause_fingerprint,
                "provenance": {
                    "producer": writer,
                    "run_id": run["run_id"],
                    "contract_digest": run["contract_digest"],
                    "plan_revision": receipt.get("provenance", {}).get(
                        "plan_revision"
                    ),
                },
            }
            resolution["digest"] = digest(resolution)
            run["implementation_log"].append(resolution)
        run["implementation_log"].append(
            {
                "kind": "fix_applied",
                "attempt": run["attempt_count"],
                "cause": cause,
                "failed_report_digest": event.get("failed_report_digest"),
                "cause_fingerprint": cause_fingerprint,
                "fix_receipt_id": receipt.get("receipt_id"),
                "fix_artifact_digest": receipt.get("digest"),
                "input_fingerprint": run["input_fingerprint"],
                "diff_digest": run["diff_digest"],
            }
        )
        run["finding_catalog"] = self._derived_finding_catalog(run)
        self._transition(run, "implementing", reason=f"fix applied: {cause}")
        self._invalidate_evidence(run, reason=f"fix applied: {cause}")

    def _parallel_write(self, run: dict[str, Any], request: Mapping[str, Any]) -> None:
        writers = request.get("writers", [])
        rejections: list[dict[str, str]] = []
        allowed_request = {"writers", "integration_owner", "post_integration_reverification"}
        if set(request) - allowed_request:
            rejections.append(_problem("unknown_field", "parallel write request contains unknown fields"))
        if not isinstance(writers, list) or len(writers) < 2:
            writers = []
            rejections.append(_problem("parallel_writers_missing", "parallel candidate requires multiple writers"))
        participant_ids = [str(writer.get("agent", "")) for writer in writers if isinstance(writer, Mapping)]
        integration_owner = str(request.get("integration_owner", ""))
        if not integration_owner or integration_owner not in participant_ids:
            rejections.append(_problem("integration_owner_missing", "integration owner must be a participating writer"))
        worktrees = [str(writer.get("worktree", "")) for writer in writers if isinstance(writer, Mapping)]
        if any(not item for item in worktrees) or len(worktrees) != len(set(worktrees)):
            rejections.append(_problem("worktree_isolation_required", "parallel writers need distinct worktrees"))
        owned: list[tuple[str, str]] = []
        by_id = {str(agent.get("id")): agent for agent in self.registry.get("agents", [])}
        contract_paths = set(run["task_contract"].get("allowed_paths", []))
        for writer in writers:
            if not isinstance(writer, Mapping):
                rejections.append(_problem("parallel_writer_invalid", "parallel writer must be an object"))
                continue
            if set(writer) - {"agent", "paths", "worktree", "lease"}:
                rejections.append(_problem("unknown_field", "parallel writer contains unknown fields"))
            agent_id = str(writer.get("agent", ""))
            agent = by_id.get(agent_id)
            paths = [str(path) for path in writer.get("paths", [])]
            if agent is None or "writer" not in agent.get("roles", []):
                rejections.append(_problem("parallel_writer_role", "parallel agent is not writer-capable"))
            for path in paths:
                rejections.extend(validate_project_path(path, self.project_root))
                if path not in contract_paths:
                    rejections.append(_problem("parallel_scope", "parallel path is outside Task Contract"))
                if agent and not path_matches_scope(path, list(agent.get("path_scopes", []))):
                    rejections.append(_problem("parallel_registry_scope", "parallel path exceeds Registry scope"))
                for other_agent, other_path in owned:
                    if overlapping(path, other_path):
                        rejections.append(
                            _problem("overlapping_ownership", f"parallel ownership overlaps with {other_agent}")
                        )
                owned.append((agent_id, path))
            stored = run.get("authority_grants", {}).get("write", {}).get(agent_id)
            if not isinstance(stored, Mapping):
                rejections.append(_problem("lease_missing", "orchestrator-issued writer grant is missing"))
            else:
                rejections.extend(validate_stored_grant(writer.get("lease"), stored))
        reverification = request.get("post_integration_reverification")
        if not isinstance(reverification, Mapping) or (
            reverification.get("plan_revision") != run["shared_plan"]["revision"]
            or "final_verification" not in set(reverification.get("required_reports", []))
            or "final_review" not in set(reverification.get("required_reports", []))
            or not valid_digest(reverification.get("evidence_digest"))
        ):
            rejections.append(
                _problem("post_integration_reverification_required", "parallel candidate requires reverification evidence")
            )
        run["parallel_write_candidate"] = not rejections
        run["parallel_write_approved"] = False
        run["integration_owner"] = integration_owner if not rejections else None
        run["post_integration_reverification"] = {
            "required": not rejections,
            "evidence": copy.deepcopy(reverification) if not rejections else None,
        }
        run["rejections"].extend(_dedupe(rejections))

    def _source_sync(self, run: dict[str, Any], request: Mapping[str, Any]) -> None:
        required = {"artifact_revision", "artifact_digest", "payload", "source_baseline_digest", "target_identity"}
        if sensitive_reason(request):
            run["rejections"].append(_problem("redaction_required", "source sync request contains private data"))
            return
        schema_errors = self._schema_rejections("source_sync_request", request)
        if schema_errors:
            run["rejections"].extend(schema_errors)
            return
        if set(request) - SOURCE_REQUEST_FIELDS:
            run["rejections"].append(_problem("unknown_field", "source sync request contains unknown fields"))
            return
        if request.get("schema_version") != "1.0":
            run["rejections"].append(_problem("schema_version", "source sync schema version is unsupported"))
            return
        source_policy = self._policy_for(run).get("source_sync", {})
        minimum_state = str(source_policy.get("minimum_state", "implementation_approved"))
        if run["state"] != minimum_state or not run["implementation_approval"].get("approved"):
            run["rejections"].append(
                _problem(
                    "source_sync_gate",
                    f"source sync requires current derived approval at {minimum_state}; evidence is stale",
                )
            )
            return
        if set(required) - set(request):
            run["rejections"].append(_problem("source_sync_evidence", "source sync evidence is incomplete"))
            return
        if (
            run["initial_verification_report"].get("status") != "passed"
            or run["initial_review_report"].get("status") != "passed"
            or self._unresolved(run)
        ):
            run["rejections"].append(_problem("source_sync_unresolved", "source sync requires current reports and zero unresolved items"))
            return
        if request.get("artifact_revision") != run["artifact_revision"] or request.get("artifact_digest") != run["current_artifact_digest"]:
            run["rejections"].extend(
                [
                    _problem("stale_artifact", "source sync artifact evidence is stale"),
                    _problem(
                        "source_sync_evidence",
                        "source sync evidence does not bind the current artifact basis",
                    ),
                ]
            )
            return
        if not valid_digest(request.get("source_baseline_digest")) or not isinstance(request.get("target_identity"), Mapping):
            run["rejections"].append(_problem("source_sync_evidence", "source baseline or target identity is invalid"))
            return
        if bool(request.get("activate")) and bool(source_policy.get("manual_activation", True)):
            run["rejections"].append(_problem("manual_activation_required", "source activation is manual"))
            return
        if bool(request.get("existing_target")) and bool(source_policy.get("no_overwrite", True)):
            run["rejections"].append(_problem("source_no_overwrite", "source target already exists"))
            return
        shadow_controls = canonical_accepted_shadow_source_projection(run)
        staging = {
            "payload": copy.deepcopy(request["payload"]),
            "ref": "__generation_staging__",
            "source_baseline_digest": request["source_baseline_digest"],
            "target_identity": copy.deepcopy(request["target_identity"]),
            "provenance": {
                "producer": "team_harness.orchestrator",
                "run_id": run["run_id"],
                "contract_digest": run["contract_digest"],
                "artifact_revision": run["artifact_revision"],
                "artifact_digest": run["current_artifact_digest"],
            },
            "manual_handoff": shadow_controls["staging_artifact"][
                "manual_handoff"
            ],
        }
        staging["digest"] = digest(staging)
        # Caller-provided hashes are evidence claims, never runtime-issued authority.
        # Shadow mode has no connector capable of producing a persisted verified receipt.
        source_sync = {
            "schema_version": "1.0",
            "run_id": run["run_id"],
            "contract_digest": run["contract_digest"],
            "artifact_revision": run["artifact_revision"],
            "accepted": shadow_controls["accepted"],
            "status": shadow_controls["status"],
            "staged": shadow_controls["staged"],
            "overwrote": shadow_controls["overwrote"],
            "source_artifact_digest": run["current_artifact_digest"],
            "staging_artifact": staging,
            "manifest_digest": None,
            "connection_status": shadow_controls["connection_status"],
            "external_connection_verified": shadow_controls[
                "external_connection_verified"
            ],
            "committed_revision": None,
        }
        unsigned_manifest = {key: value for key, value in source_sync.items() if key != "manifest_digest"}
        source_sync["manifest_digest"] = digest(unsigned_manifest)
        run["source_sync"] = source_sync
        run["completion_report"] = canonical_completion_projection(
            run,
            generation_revision=None,
            complete=False,
            gate="not_evaluated",
            reasons=[],
        )
        self._transition(run, "source_sync", reason="versioned source update staged", gate_internal=True)
        self._issue_authority_grants(run)

    def _completion_reasons(self, run: Mapping[str, Any], expected_revision: int | None) -> list[str]:
        reasons: list[str] = []
        if expected_revision is None or expected_revision != run.get("revision"):
            reasons.append("stale completion revision")
        if run.get("integrity_status") != "verified":
            reasons.append("integrity is not verified")
        if run.get("state") != "final_review":
            reasons.append("current state is not final_review")
        reports = [
            run.get("initial_verification_report", {}),
            run.get("initial_review_report", {}),
            run.get("final_verification_report", {}),
            run.get("final_review_report", {}),
        ]
        if any(report.get("status") != "passed" or not self._report_is_current(run, report) for report in reports):
            reasons.append("initial and final reports must pass current evidence")
        if reports[0].get("report_digest") == reports[2].get("report_digest") or reports[1].get("report_digest") == reports[3].get("report_digest"):
            reasons.append("final reports must be distinct")
        sync = run.get("source_sync", {})
        staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
        if not sync.get("accepted") or not isinstance(staging, Mapping):
            reasons.append("source update is not staged")
        else:
            unsigned = {key: value for key, value in staging.items() if key != "digest"}
            if staging.get("digest") != digest(unsigned):
                reasons.append("staged source digest drift")
            if sync.get("source_artifact_digest") != run.get("current_artifact_digest"):
                reasons.append("staged source artifact is stale")
            unsigned_manifest = {key: value for key, value in sync.items() if key != "manifest_digest"}
            if sync.get("manifest_digest") != digest(unsigned_manifest):
                reasons.append("source manifest digest drift")
            for report in reports[2:]:
                if report.get("staging_artifact_digest") != staging.get("digest"):
                    reasons.append("final report staging binding is stale")
                if report.get("source_manifest_digest") != sync.get("manifest_digest"):
                    reasons.append("final report source manifest binding is stale")
                if report.get("source_revision") != sync.get("committed_revision"):
                    reasons.append("final report source revision is stale")
        conditions = run.get("task_contract", {}).get("completion_conditions", [])
        if not isinstance(conditions, list) or not conditions:
            reasons.append("completion conditions are absent")
        receipts = self._verified_artifact_receipts(run)
        receipt_deliverables = {
            str(deliverable)
            for item in receipts
            for deliverable in item.get("deliverable_ids", [])
        }
        receipt_deliverables.update(
            Path(str(item.get("path", ""))).stem for item in receipts if item.get("path")
        )
        builtin_deliverables = {"implementation", "verification report", "review report"}
        required_deliverables = {
            str(item) for item in run.get("task_contract", {}).get("required_deliverables", [])
        }
        missing_deliverables = required_deliverables - builtin_deliverables - receipt_deliverables
        if missing_deliverables:
            reasons.append(
                "required deliverable artifact is missing: " + ", ".join(sorted(missing_deliverables))
            )
        for condition in conditions if isinstance(conditions, list) else []:
            match = re.fullmatch(r"([a-z0-9][a-z0-9._-]*) artifact exists", str(condition))
            if match and match.group(1) not in receipt_deliverables:
                reasons.append(f"completion condition is unsatisfied: {condition}")
        information_sync = run.get("task_contract", {}).get("information_source_sync", {})
        if isinstance(information_sync, Mapping) and information_sync.get("required") and not sync.get("accepted"):
            reasons.append("required information source sync is not staged")
        if run.get("blockers") or run.get("rejections") or self._unresolved(run):
            reasons.append("run has blockers, rejections, unresolved findings, or drift")
        return reasons

    @staticmethod
    def _report_is_current(run: Mapping[str, Any], report: Mapping[str, Any]) -> bool:
        return all(
            report.get(key) == expected
            for key, expected in {
                "attempt": run.get("attempt_count"),
                "plan_revision": run.get("shared_plan", {}).get("revision"),
                "artifact_revision": run.get("artifact_revision"),
                "artifact_digest": run.get("current_artifact_digest"),
                "diff_digest": run.get("diff_digest"),
                "input_fingerprint": run.get("input_fingerprint"),
                "environment_fingerprint": run.get("environment_fingerprint"),
            }.items()
        )

    @staticmethod
    def _unresolved(run: Mapping[str, Any]) -> list[Any]:
        resolved = {
            str(item.get("finding_digest"))
            for item in run.get("implementation_log", [])
            if isinstance(item, Mapping)
            and item.get("kind") == "finding_resolution_receipt"
            and item.get("status") == "resolved"
        }
        return [
            finding
            for finding in run.get("findings", [])
            if str(finding.get("digest")) not in resolved
        ] + list(run.get("conflicts", [])) + list(run.get("blockers", []))

    @staticmethod
    def _derived_finding_catalog(run: Mapping[str, Any]) -> list[dict[str, Any]]:
        resolutions = {
            str(item.get("finding_digest")): item
            for item in run.get("implementation_log", [])
            if isinstance(item, Mapping)
            and item.get("kind") == "finding_resolution_receipt"
            and item.get("status") == "resolved"
        }
        grouped: dict[tuple[str, str, str], list[Mapping[str, Any]]] = {}
        for finding in run.get("findings", []):
            if not isinstance(finding, Mapping):
                continue
            identity = (
                str(finding.get("issue_id", "")),
                str(finding.get("clause", "")),
                str(finding.get("location", "")),
            )
            grouped.setdefault(identity, []).append(finding)
        catalog: list[dict[str, Any]] = []
        for identity, findings in grouped.items():
            first = findings[0]
            resolved = all(str(item.get("digest")) in resolutions for item in findings)
            resolution = resolutions.get(str(first.get("digest")))
            catalog.append(
                {
                    "issue_id": identity[0],
                    "clause": identity[1],
                    "location": identity[2],
                    "first_finding_digest": first.get("digest"),
                    "status": "resolved" if resolved else "open",
                    "resolution_receipt_digest": (
                        resolution.get("digest")
                        if isinstance(resolution, Mapping)
                        else None
                    ),
                }
            )
        return catalog

    def _record_finding(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        explicit_identity = all(str(event.get(key, "")).strip() for key in ("issue_id", "clause", "location"))
        actor = str(event.get("actor", ""))
        source = str(event.get("source", ""))
        assigned_quality = {
            str(member.get("id"))
            for member in run.get("team", [])
            if member.get("role") in {"reviewer", "verifier"}
        }
        if (
            not explicit_identity
            or not actor
            or actor not in assigned_quality
            or source != actor
            or event.get("status") != "open"
        ):
            run["rejections"].append(
                _problem(
                    "finding_identity_required",
                    "public finding requires an assigned quality actor, matching source, canonical identity, and open status",
                )
            )
            return
        clause = str(event.get("clause", event.get("kind", "general")))
        location = str(event.get("location", "unspecified"))
        message = str(event.get("message", ""))
        issue_id = str(event.get("issue_id") or "ISSUE-" + digest({"clause": clause, "location": location, "message": message})[-12:].upper())
        finding = {
            "sequence": len(run["findings"]) + 1,
            "source": source,
            "actor": actor,
            "issue_id": issue_id,
            "clause": clause,
            "location": location,
            "kind": str(event.get("kind", "general")),
            "message": message,
            "severity": str(event.get("severity", "medium")),
            "position": event.get("position"),
            "status": "open",
        }
        finding["digest"] = digest(finding)
        run["findings"].append(finding)
        run["finding_catalog"] = self._derived_finding_catalog(run)

    def _resolve_finding_conflicts(self, run: dict[str, Any]) -> None:
        candidate = copy.deepcopy(run)
        existing = {
            (item["issue_id"], item["clause"], item["location"])
            for item in candidate["conflicts"]
        }
        for conflict in canonical_finding_conflict_projection(candidate["findings"]):
            identity = (
                conflict["issue_id"],
                conflict["clause"],
                conflict["location"],
            )
            if identity not in existing:
                candidate["conflicts"].append(copy.deepcopy(conflict))
        if (
            candidate["conflicts"]
            and candidate["state"] != "needs_human_approval"
            and not is_terminal(candidate, self._policy_for(candidate))
        ):
            self._transition(
                candidate,
                "needs_human_approval",
                reason="finding positions conflict",
                gate_internal=True,
            )
        run.clear()
        run.update(candidate)

    def _reserved_event_batch_is_exact(
        self,
        run: Mapping[str, Any],
        *,
        prior_run: Mapping[str, Any] | None,
    ) -> bool:
        """Preflight every event-produced reserved transition before save."""

        trace = run.get("state_trace", [])
        prior_trace = (
            prior_run.get("state_trace", [])
            if isinstance(prior_run, Mapping)
            else []
        )
        if not isinstance(trace, list) or not isinstance(prior_trace, list):
            return False
        if len(prior_trace) > len(trace):
            return False
        prior_rejections = (
            prior_run.get("rejections", [])
            if isinstance(prior_run, Mapping)
            else []
        )
        rejections = run.get("rejections", [])
        if not isinstance(prior_rejections, list) or not isinstance(
            rejections, list
        ):
            return False
        if any(
            isinstance(item, Mapping)
            and item.get("code") == "event_batch_after_reserved"
            for item in rejections[len(prior_rejections):]
        ):
            return False
        suffix = trace[len(prior_trace):]
        reserved_states = self._reserved_states(run)
        reserved_entries = [
            entry
            for entry in suffix
            if isinstance(entry, Mapping) and entry.get("state") in reserved_states
        ]
        if not reserved_entries:
            return True
        if (
            len(reserved_entries) != 1
            or not suffix
            or suffix[-1] is not reserved_entries[0]
            or run.get("state") != reserved_entries[0].get("state")
        ):
            return False
        generation_revision = (
            int(prior_run.get("revision", 0)) + 1
            if isinstance(prior_run, Mapping)
            else 1
        )
        entry = reserved_entries[0]
        evidence = canonical_reserved_evidence(
            run,
            entry,
            generation_revision,
            prior_run=prior_run,
            registry=self.registry,
        )
        return not reserved_generation_evidence_errors(
            run,
            prior_run,
            entry,
            evidence,
            registry=self.registry,
        )

    def _record_improvement(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        self._update_metrics(run)
        kind = str(event.get("kind", "quality"))
        manual = kind in {"privilege_expansion", "schema_change", "security_policy", "external_publish"}
        run["improvement_proposals"].append(
            {
                "id": f"proposal-{len(run['improvement_proposals']) + 1:03d}",
                "kind": kind,
                "approval_class": "human_required" if manual else "review_required",
                "manual_approval_required": manual,
                "requested_scope": event.get("requested_scope"),
                "metrics_digest": run["metrics"]["digest"],
                "artifact_refs": [
                    {"name": item.get("name"), "digest": item.get("digest")}
                    for item in run.get("artifacts", [])
                ] or [{"name": "current-artifact", "digest": run["current_artifact_digest"]}],
                "applied": False,
            }
        )

    def _record_external_artifact(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        rejections: list[dict[str, str]] = []
        try:
            path = normalize_path(str(event.get("path", "")))
        except ValueError:
            run["rejections"].append(
                _problem("artifact_scope", "artifact target is unsafe")
            )
            return
        content = event.get("content")
        if sensitive_reason(content):
            run["rejections"].append(_problem("redaction_required", "artifact content contains private data"))
            return
        if not isinstance(content, Mapping):
            run["rejections"].append(
                _problem("artifact_content_invalid", "artifact content must be an object")
            )
            return
        for field in ("issue_ids", "check_ids", "deliverable_ids"):
            value = content.get(field, [])
            if (
                not isinstance(value, list)
                or any(not isinstance(item, str) or not item for item in value)
                or len(value) != len(set(value))
            ):
                rejections.append(
                    _problem(
                        "artifact_content_invalid",
                        f"artifact {field} must be a unique string array",
                    )
                )
        actor = str(event.get("actor", ""))
        writer = str(run.get("selection", {}).get("writer") or "")
        assigned_writer = next(
            (
                str(member.get("id"))
                for member in run.get("team", [])
                if member.get("role") == "writer"
            ),
            "",
        )
        if not writer or actor != writer or assigned_writer != writer:
            rejections.append(
                _problem(
                    "artifact_authority",
                    "only the active assigned primary writer may submit an artifact receipt",
                )
            )
        allowed_states = set(
            self._policy_for(run).get("write_authorization", {}).get("allowed_states", [])
        )
        if run.get("state") not in allowed_states:
            rejections.append(
                _problem(
                    "artifact_write_state",
                    "artifact receipt is forbidden outside an active write state",
                )
            )
        rejections.extend(validate_project_path(path, self.project_root))
        contract_paths = [
            str(item) for item in run.get("task_contract", {}).get("allowed_paths", [])
        ]
        if path not in contract_paths:
            rejections.append(
                _problem(
                    "artifact_scope",
                    "artifact path is outside the exact Task Contract scope",
                )
            )
        registry_writer = next(
            (
                item
                for item in self.registry.get("agents", [])
                if str(item.get("id")) == writer and "writer" in item.get("roles", [])
            ),
            None,
        )
        if registry_writer is None or not path_matches_scope(
            path, [str(item) for item in registry_writer.get("path_scopes", [])]
        ):
            rejections.append(
                _problem("artifact_registry_scope", "artifact path exceeds Registry scope")
            )
        ownership = next(
            (
                item
                for item in run.get("write_ownership", [])
                if str(item.get("owner")) == writer
            ),
            None,
        )
        stored_grant = (
            run.get("authority_grants", {}).get("write", {}).get(writer)
        )
        if not isinstance(ownership, Mapping) or path not in ownership.get("paths", []):
            rejections.append(
                _problem("artifact_ownership", "artifact path is outside active ownership")
            )
        if not isinstance(stored_grant, Mapping):
            rejections.append(
                _problem("artifact_authority", "active writer authority grant is missing")
            )
        else:
            rejections.extend(
                validate_stored_grant(event.get("authority_grant"), stored_grant)
            )
            if (
                stored_grant.get("run_id") != run.get("run_id")
                or stored_grant.get("agent") != writer
                or stored_grant.get("epoch") != run.get("lease_epoch")
                or stored_grant.get("ownership_revision")
                != run.get("ownership_revision")
                or list(stored_grant.get("paths", []))
                != list(ownership.get("paths", []) if isinstance(ownership, Mapping) else [])
                or path not in stored_grant.get("paths", [])
                or stored_grant.get("issued_revision") is None
                or int(stored_grant.get("issued_revision", 0))
                > int(run.get("revision", 0))
            ):
                rejections.append(
                    _problem(
                        "artifact_authority",
                        "artifact does not match an exact committed active writer grant",
                    )
                )
        if rejections:
            run["rejections"].extend(_dedupe(rejections))
            return

        receipt_id = "receipt-" + digest(
            {
                "run_id": run["run_id"],
                "actor": actor,
                "path": path,
                "content": content,
                "artifact_revision": run["artifact_revision"],
                "sequence": len(run.get("implementation_log", [])) + 1,
            }
        )[-20:]
        receipt = {
            "receipt_id": receipt_id,
            "kind": "artifact_receipt",
            "path": path,
            "ref": "__generation_receipt__",
            "digest": digest(content),
            "raw_content_persisted": False,
            "authority_grant_digest": stored_grant["grant_digest"],
            "issued_by": "team_harness",
            "issue_ids": [str(item) for item in content.get("issue_ids", [])],
            "check_ids": [str(item) for item in content.get("check_ids", [])],
            "deliverable_ids": [
                str(item) for item in content.get("deliverable_ids", [])
            ],
            "provenance": {
                "producer": actor,
                "run_id": run["run_id"],
                "contract_digest": run["contract_digest"],
                "plan_revision": run["shared_plan"]["revision"],
            },
        }
        run["implementation_log"].append(receipt)
        run.setdefault("_pending_artifact_receipts", []).append(
            {"receipt_id": receipt_id, "content": copy.deepcopy(dict(content))}
        )
        run["diff_digest"] = receipt["digest"]
        run["artifact_revision"] += 1
        self._invalidate_evidence(run, reason="artifact changed")

    def _verified_artifact_receipts(
        self, run: Mapping[str, Any]
    ) -> list[dict[str, Any]]:
        writer = str(run.get("selection", {}).get("writer") or "")
        stored_grant = run.get("authority_grants", {}).get("write", {}).get(writer)
        if not writer or not isinstance(stored_grant, Mapping):
            return []
        if (
            validate_stored_grant(stored_grant, stored_grant)
            or stored_grant.get("issued_revision") is None
            or int(stored_grant.get("issued_revision", 0))
            > int(run.get("revision", 0))
        ):
            return []
        ownership = next(
            (
                item
                for item in run.get("write_ownership", [])
                if str(item.get("owner")) == writer
            ),
            None,
        )
        if not isinstance(ownership, Mapping):
            return []
        contract_paths = {
            str(item) for item in run.get("task_contract", {}).get("allowed_paths", [])
        }
        allowed_paths = set(str(item) for item in ownership.get("paths", []))
        grant_paths = set(str(item) for item in stored_grant.get("paths", []))
        verified: list[dict[str, Any]] = []
        for item in run.get("implementation_log", []):
            if not isinstance(item, Mapping) or item.get("kind") != "artifact_receipt":
                continue
            provenance = item.get("provenance", {})
            path = str(item.get("path", ""))
            if (
                item.get("issued_by") == "team_harness"
                and item.get("raw_content_persisted") is True
                and str(item.get("ref", "")).startswith("generations/")
                and valid_digest(item.get("digest"))
                and item.get("authority_grant_digest")
                == stored_grant.get("grant_digest")
                and path in contract_paths
                and path in allowed_paths
                and path in grant_paths
                and isinstance(provenance, Mapping)
                and provenance.get("producer") == writer
                and provenance.get("run_id") == run.get("run_id")
                and provenance.get("contract_digest") == run.get("contract_digest")
                and provenance.get("plan_revision")
                == run.get("shared_plan", {}).get("revision")
            ):
                verified.append(copy.deepcopy(dict(item)))
        return verified

    def _revise_ownership(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        if str(event.get("actor", "")) != "orchestrator":
            run["rejections"].append(_problem("ownership_authority", "ownership revision is orchestrator-only"))
            return
        ownership = event.get("write_ownership")
        if not isinstance(ownership, list) or not ownership:
            run["rejections"].append(_problem("ownership_invalid", "ownership revision is incomplete"))
            return
        writer = str(run.get("selection", {}).get("writer") or "")
        if (
            not writer
            or len(ownership) != 1
            or not isinstance(ownership[0], Mapping)
            or str(ownership[0].get("owner", "")) != writer
        ):
            run["rejections"].append(
                _problem(
                    "ownership_primary_writer",
                    "write ownership must remain exclusively assigned to the single primary writer",
                )
            )
            return
        contract_paths = set(run["task_contract"].get("allowed_paths", []))
        seen: set[str] = set()
        normalized: list[dict[str, Any]] = []
        for item in ownership:
            if not isinstance(item, Mapping):
                run["rejections"].append(_problem("ownership_invalid", "ownership entries must be objects"))
                return
            owner = str(item.get("owner", ""))
            paths = [str(path) for path in item.get("paths", [])]
            if owner != writer or not paths or not set(paths).issubset(contract_paths) or seen.intersection(paths):
                run["rejections"].append(_problem("ownership_scope", "ownership revision exceeds selected scope"))
                return
            seen.update(paths)
            normalized.append({"owner": owner, "paths": paths})
        if seen != contract_paths:
            run["rejections"].append(_problem("ownership_scope", "ownership revision must cover every allowed path"))
            return
        run["write_ownership"] = normalized
        run["ownership_revision"] += 1
        run["lease_epoch"] += 1
        run["artifact_revision"] += 1
        self._invalidate_evidence(run, reason="ownership changed")

    def _invalidate_evidence(self, run: dict[str, Any], *, reason: str) -> None:
        self._refresh_artifact_digest(run)
        run["implementation_approval"] = {"source": "none", "approved": False}
        run["initial_verification_report"] = self._empty_report("verification", "initial")
        run["initial_review_report"] = self._empty_report("review", "initial")
        run["final_verification_report"] = self._empty_report("verification", "final")
        run["final_review_report"] = self._empty_report("review", "final")
        run["verification_report"] = self._empty_verification_summary()
        run["review_report"] = self._empty_review_summary()
        run["source_sync"] = canonical_inactive_source_projection(run)
        run["completion_report"] = canonical_completion_projection(
            run,
            generation_revision=None,
            complete=False,
            gate="not_evaluated",
            reasons=[],
        )
        if run.get("state") in self._reserved_states(run):
            self._transition(run, "retrying", reason=reason, gate_internal=True)
        self._issue_authority_grants(run)

    def _requested_transition(self, run: dict[str, Any], event: Mapping[str, Any]) -> None:
        if event.get("from") != run["state"]:
            run["rejections"].append(_problem("illegal_transition", "transition source does not match current state"))
            return
        target = str(event.get("to", ""))
        actor = str(event.get("actor", ""))
        if target == "retrying":
            run["rejections"].append(
                _problem(
                    "retry_evidence_gate_required",
                    "retrying is entered only by dedicated failed or blocked quality report processing",
                )
            )
            return
        if run.get("state") == "retrying" and target != "retrying":
            run["rejections"].append(
                _problem(
                    "retry_gate_required",
                    "retrying can only exit through the verified fix evidence gate",
                )
            )
            return
        if run.get("state") in self._reserved_states(run) or target in self._reserved_states(run):
            run["rejections"].append(
                _problem("reserved_state_transition", "reserved state requires its dedicated evidence gate")
            )
            return
        self._transition(run, target, actor=actor, reason="requested transition")

    def _transition(
        self,
        run: dict[str, Any],
        target: str,
        *,
        actor: str = "orchestrator",
        reason: str = "",
        gate_internal: bool = False,
    ) -> bool:
        if target in self._reserved_states(run) and not gate_internal:
            run["rejections"].append(
                _problem("reserved_state_transition", "reserved state requires its dedicated evidence gate")
            )
            return False
        if gate_internal:
            gate_errors = dedicated_state_gate_errors(
                run,
                self._policy_for(run),
                target,
                reason=reason,
                actor=actor,
            )
            if gate_errors:
                run["rejections"].append(
                    _problem("dedicated_gate_evidence", gate_errors[0])
                )
                return False
        accepted, code = transition(run, target, self._policy_for(run), actor=actor, reason=reason)
        if not accepted:
            run["rejections"].append(_problem(code or "illegal_transition", "transition is forbidden by Execution Policy"))
        return accepted

    @staticmethod
    def _refresh_artifact_digest(run: dict[str, Any]) -> None:
        run["current_artifact_digest"] = digest(
            {
                "contract_digest": run["contract_digest"],
                "attempt": run["attempt_count"],
                "plan_revision": run["shared_plan"]["revision"],
                "artifact_revision": run["artifact_revision"],
                "input_fingerprint": run["input_fingerprint"],
                "diff_digest": run["diff_digest"],
                "environment_fingerprint": run["environment_fingerprint"],
            }
        )

    def _finalize(self, run: dict[str, Any], *, expected_revision: int) -> None:
        self._update_metrics(run)
        run["_artifact_documents"] = self._artifact_documents(run)
        self.store.save(run, expected_revision=expected_revision)

    def _update_metrics(self, run: dict[str, Any]) -> None:
        run["metrics"] = canonical_metrics(run)

    @staticmethod
    def _persistable_change(before: Mapping[str, Any], after: Mapping[str, Any]) -> bool:
        ignored = {"rejections", "revision", "artifacts", "integrity_status", "integrity_errors"}
        before_value = {key: value for key, value in before.items() if key not in ignored}
        after_value = {key: value for key, value in after.items() if key not in ignored}
        return before_value != after_value

    def _artifact_documents(self, run: Mapping[str, Any]) -> dict[str, Any]:
        return canonical_artifact_documents(run)

    @staticmethod
    def _write_decision(
        run_id: str,
        agent: str,
        authorized: bool,
        rejections: list[dict[str, str]],
        run: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "authorized": authorized,
            "run_id": run_id,
            "agent": agent,
            "ownership_revision": run.get("ownership_revision") if run else None,
            "revision": run.get("revision") if run else None,
            "rejections": rejections,
        }


def _problem(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _dedupe(items: list[dict[str, str]]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for item in items:
        key = (item["code"], item["message"])
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result
