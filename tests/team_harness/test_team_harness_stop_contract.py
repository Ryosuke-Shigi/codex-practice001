"""STOP-level contracts from the third architecture and reviewer audit."""

from __future__ import annotations

import copy
import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from typing import Any, Mapping
from unittest import mock

from test_team_harness_contract import (
    CONFIG_ROOT,
    HarnessAdapter,
    TeamHarnessContractTestCase,
    evidence_from,
    issued_quality_grant,
    issued_write_grant,
    minimal_policy,
    minimal_registry,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_hardening_contract import load_cli_module, rejection_codes


def forged_writer_lease(run: Mapping[str, Any], agent: str, paths: list[str]) -> dict[str, Any]:
    """A caller-computable lease which must never establish authority."""

    forged: dict[str, Any] = {
        "run_id": run["run_id"],
        "agent": agent,
        "lease_id": f"caller-forged-{agent}",
        "epoch": run["lease_epoch"],
        "expires_at": "2099-01-01T00:00:00Z",
        "ownership_revision": run["ownership_revision"],
        "paths": paths,
        "issuer": "parent_orchestrator",
    }
    forged["digest"] = sha256_digest(forged)
    return forged


def caller_attested_report(
    run: Mapping[str, Any],
    report: str,
    status: str,
    *,
    phase: str = "initial",
    cause: str | None = None,
) -> dict[str, Any]:
    role = "verifier" if report == "verification" else "reviewer"
    actor = next(member["id"] for member in run["team"] if member["role"] == role)
    event: dict[str, Any] = {
        "type": f"{report}_report",
        "phase": phase,
        "status": status,
        "actor": actor,
        "checks": list(run["task_contract"]["required_checks"]),
        **evidence_from(run),
        "authority_grant": {
            "grant_id": f"caller-forged-{phase}-{role}",
            "actor": actor,
            "role": role,
            "phase": phase,
            "run_id": run["run_id"],
            "issued_by": "team_harness",
        },
        "provenance": {
            "producer": actor,
            "run_id": run["run_id"],
            "contract_digest": run["contract_digest"],
        },
    }
    if phase == "final":
        sync = run.get("source_sync", {})
        staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
        event["staging_artifact_digest"] = staging.get("digest") if isinstance(staging, Mapping) else None
        event["source_manifest_digest"] = sync.get("manifest_digest") if isinstance(sync, Mapping) else None
    if cause:
        event["cause"] = cause
    event["authority_grant"]["grant_digest"] = sha256_digest(event["authority_grant"])
    event["report_digest"] = sha256_digest(event)
    return event


class StopContractTestCase(TeamHarnessContractTestCase):
    def source_request(self, run: Mapping[str, Any], **overrides: Any) -> dict[str, Any]:
        result = {
            "schema_version": "1.0",
            "artifact_revision": run["artifact_revision"],
            "artifact_digest": run["current_artifact_digest"],
            "payload": {"changes": ["source update"]},
            "source_baseline_digest": sha256_digest("source baseline"),
            "target_identity": {"system": "external", "catalog": "team-harness"},
            "activate": False,
        }
        result.update(overrides)
        return result

    def stage(self, run: Mapping[str, Any], **overrides: Any) -> Any:
        approved = self.initially_approve(run)
        self.assertEqual("implementation_approved", approved["state"])
        return self.resume_run(approved, source_sync_request=self.source_request(approved, **overrides))

    def assert_blocked_or_rejected(self, result: Mapping[str, Any], expected: str) -> None:
        rendered = json.dumps(result).lower()
        self.assertIn(expected.lower(), rendered)
        self.assertTrue(result.get("state") == "blocked" or result.get("rejections") or result.get("blockers"))


class AuthorityGrantContractTest(StopContractTestCase):
    def test_run_issues_and_atomically_persists_writer_and_initial_quality_grants(self) -> None:
        run = self.run_request(request(idempotency_key="issued-grants"))
        grants = self.value(run, "authority_grants")
        self.assertIn("backend", grants["write"])
        self.assertTrue({"verifier", "reviewer"}.issubset(grants["quality"]["initial"]))
        persisted = self.harness.facade.store.load(run["run_id"])
        self.assertEqual(grants, persisted["authority_grants"])
        for grant in [grants["write"]["backend"], *grants["quality"]["initial"].values()]:
            self.assertFalse(grant["runtime_authenticity_verified"])
            self.assertEqual("unverified", grant["runtime_authenticity_status"])

    def test_caller_forged_writer_lease_is_rejected_even_with_matching_digest_and_issuer_text(self) -> None:
        run = self.run_request(request(idempotency_key="forged-writer-grant"))
        paths = list(run["task_contract"]["allowed_paths"])
        decision = self.harness.facade.authorize_write(
            run["run_id"],
            {
                "schema_version": "1.0",
                "run_id": run["run_id"],
                "agent": "backend",
                "paths": paths,
                "lease": forged_writer_lease(run, "backend", paths),
                "expected_revision": run["revision"],
            },
        )
        self.assertFalse(decision["authorized"])
        self.assertIn("authority_grant_mismatch", rejection_codes(decision))

    def test_caller_forged_quality_grant_is_rejected(self) -> None:
        run = self.run_request(request(idempotency_key="forged-quality-grant"))
        result = self.resume_run(run, events=[caller_attested_report(run, "verification", "passed")])
        self.assertIn("authority_grant_mismatch", rejection_codes(result))
        self.assertEqual("not_run", result["initial_verification_report"]["status"])

    def test_issued_grant_must_match_stored_grant_exactly(self) -> None:
        run = self.run_request(request(idempotency_key="mutated-issued-grant"))
        grant = issued_quality_grant(run, "initial", "verifier")
        grant["expires_at"] = "2099-12-31T00:00:00Z"
        event = report_event(run, "verification", "passed")
        event["authority_grant"] = grant
        event["report_digest"] = sha256_digest({key: value for key, value in event.items() if key != "report_digest"})
        result = self.resume_run(run, events=[event])
        self.assertIn("authority_grant_mismatch", rejection_codes(result))


class ReservedStateAndEvidenceBindingTest(StopContractTestCase):
    def test_generic_transition_cannot_reach_any_reserved_state(self) -> None:
        for target in ("implementation_approved", "source_sync", "final_verification", "final_review", "completed"):
            with self.subTest(target=target):
                run = self.run_request(request(idempotency_key=f"reserved-{target}"))
                result = self.resume_run(
                    run,
                    events=[{"type": "transition", "from": run["state"], "to": target, "actor": "backend"}],
                )
                self.assertIn("reserved_state_transition", rejection_codes(result))
                self.assertNotEqual(target, result["state"])

    def test_state_at_or_after_approval_always_has_current_derived_approval(self) -> None:
        run = self.run_request(request(idempotency_key="approval-invariant"))
        verified = self.resume_run(run, events=[caller_attested_report(run, "verification", "passed")])
        result = self.resume_run(
            verified,
            events=[
                {
                    "type": "transition", "from": verified["state"],
                    "to": "implementation_approved", "actor": "backend",
                }
            ],
        )
        self.assertFalse(result["implementation_approval"]["approved"])
        self.assertNotEqual("implementation_approved", result["state"])

    def test_final_reports_bind_staging_and_source_manifest_digests(self) -> None:
        run = self.run_request(request(idempotency_key="final-binding"))
        staged = self.stage(run)
        self.assertNotEqual(
            staged["initial_verification_report"]["artifact_digest"],
            staged["source_sync"]["staging_artifact"]["digest"],
        )
        event = report_event(staged, "verification", "passed", phase="final")
        self.assertEqual(staged["source_sync"]["staging_artifact"]["digest"], event["staging_artifact_digest"])
        self.assertEqual(staged["source_sync"]["manifest_digest"], event["source_manifest_digest"])
        verified = self.resume_run(staged, events=[event])
        self.assertEqual("passed", verified["final_verification_report"]["status"])

    def test_final_report_with_initial_only_binding_is_rejected(self) -> None:
        run = self.run_request(request(idempotency_key="final-initial-only"))
        staged = self.stage(run)
        event = report_event(staged, "verification", "passed", phase="final")
        event.pop("staging_artifact_digest")
        event.pop("source_manifest_digest")
        event["report_digest"] = sha256_digest({key: value for key, value in event.items() if key != "report_digest"})
        result = self.resume_run(staged, events=[event])
        self.assertIn("staging_binding_required", rejection_codes(result))


class RuntimeSchemaContractTest(StopContractTestCase):
    def test_startup_validates_closed_registry_and_policy(self) -> None:
        bad_registry = minimal_registry()
        bad_registry["unexpected"] = True
        with self.assertRaises(ValueError):
            type(self.harness.facade)(bad_registry, minimal_policy(), self.runs_dir / "bad-registry")
        bad_policy = minimal_policy()
        bad_policy["unexpected"] = True
        with self.assertRaises(ValueError):
            type(self.harness.facade)(minimal_registry(), bad_policy, self.runs_dir / "bad-policy")

    def test_run_rejects_bad_version_unknown_top_level_and_top_level_secret_without_echo(self) -> None:
        mutations = {
            "version": {**request(idempotency_key="bad-version"), "schema_version": "0.9"},
            "unknown": {**request(idempotency_key="bad-extra"), "unexpected": True},
            "secret": {**request(idempotency_key="bad-secret"), "password": "never-echo-this-value"},
        }
        for name, payload in mutations.items():
            with self.subTest(name=name):
                result = self.run_request(payload)
                self.assertEqual("blocked", result["state"])
                self.assertRegex(json.dumps(result).lower(), r"schema|unknown|redaction")
                self.assertNotIn("never-echo-this-value", json.dumps(result))

    def test_contract_rejects_empty_and_contradictory_semantic_fields(self) -> None:
        mutations = {
            "non_goals": [],
            "forbidden_paths": [],
            "write_ownership": [],
        }
        for field, value in mutations.items():
            with self.subTest(field=field):
                payload = request(idempotency_key=f"empty-{field}")
                payload["task_contract"][field] = value
                result = self.run_request(payload)
                self.assertEqual("blocked", result["state"])
        contradiction = request(idempotency_key="scope-contradiction")
        contradiction["task_contract"]["forbidden_paths"].append(
            contradiction["task_contract"]["allowed_paths"][0]
        )
        result = self.run_request(contradiction)
        self.assertEqual("blocked", result["state"])
        self.assertIn("scope_contradiction", rejection_codes(result) | {item["code"] for item in result["blockers"]})

    def test_runtime_validator_applies_minimum_keyword(self) -> None:
        validate = self.harness.module.validate_document
        policy = json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8"))
        policy["retention"]["days"] = 0
        errors = validate("execution_policy", policy)
        self.assertTrue(errors)
        self.assertIn("minimum", json.dumps(errors).lower())

    def test_resume_event_authorize_and_source_envelopes_are_closed(self) -> None:
        run = self.run_request(request(idempotency_key="closed-runtime-inputs"))
        resumed = self.run_request(
            {
                "schema_version": "1.0", "resume_run_id": run["run_id"],
                "expected_revision": run["revision"], "contract_digest": run["contract_digest"],
                "unexpected": True,
            }
        )
        self.assertIn("unknown", json.dumps(resumed["rejections"]).lower())
        event_result = self.resume_run(
            run,
            events=[
                {
                    "type": "finding", "actor": "reviewer", "source": "reviewer",
                    "issue_id": "CLOSED-1", "clause": "input.closed", "location": "run",
                    "kind": "quality", "message": "closed", "status": "open", "unexpected": True,
                }
            ],
        )
        self.assertIn("unknown", json.dumps(event_result["rejections"]).lower())
        decision = self.harness.facade.authorize_write(
            run["run_id"],
            {
                "schema_version": "1.0", "run_id": run["run_id"], "agent": "backend",
                "paths": run["task_contract"]["allowed_paths"], "lease": forged_writer_lease(
                    run, "backend", run["task_contract"]["allowed_paths"]
                ), "expected_revision": run["revision"], "unexpected": True,
            },
        )
        self.assertIn("unknown", json.dumps(decision["rejections"]).lower())


class TaskContractSemanticsTest(StopContractTestCase):
    def test_fixed_team_assignment_and_write_ownership_drive_selection_and_grants(self) -> None:
        payload = request(idempotency_key="fixed-team", domains=["backend"], capabilities=["php"])
        contract = payload["task_contract"]
        contract["team_assignment"] = {"mode": "fixed"}
        contract["primary_writer"] = "backend"
        contract["consulting_specialists"] = ["architecture"]
        contract["reviewer"] = "reviewer"
        contract["verifier"] = "verifier"
        contract["write_ownership"] = [{"owner": "backend", "paths": contract["allowed_paths"]}]
        run = self.run_request(payload)
        self.assertEqual("backend", run["selection"]["writer"])
        self.assertIn("architecture", {member["id"] for member in run["team"]})
        self.assertEqual(contract["write_ownership"], run["write_ownership"])
        self.assertEqual(contract["allowed_paths"], run["authority_grants"]["write"]["backend"]["paths"])

    def test_fixed_unknown_collision_and_scope_incompatible_assignments_fail_closed(self) -> None:
        cases = {
            "unknown": {"primary_writer": "ghost"},
            "collision": {"primary_writer": "backend", "reviewer": "backend"},
            "scope": {
                "primary_writer": "frontend",
                "write_ownership": [{"owner": "frontend", "paths": ["app/Http/Controllers/ExampleController.php"]}],
            },
        }
        for name, changes in cases.items():
            with self.subTest(name=name):
                payload = request(idempotency_key=f"fixed-{name}")
                payload["task_contract"]["team_assignment"] = {"mode": "fixed"}
                payload["task_contract"].update(changes)
                result = self.run_request(payload)
                self.assertEqual("blocked", result["state"])
                self.assertRegex(json.dumps(result).lower(), r"unknown|collision|scope|assignment")

    def test_required_checks_are_enforced_by_reports_and_completion(self) -> None:
        run = self.run_request(request(idempotency_key="required-checks"))
        event = report_event(run, "verification", "passed")
        event["checks"] = ["unit"]
        event["report_digest"] = sha256_digest({key: value for key, value in event.items() if key != "report_digest"})
        result = self.resume_run(run, events=[event])
        self.assertIn("required_checks_missing", rejection_codes(result))

    def test_stop_retry_approval_deliverable_and_completion_contract_fields_are_applied(self) -> None:
        payload = request(idempotency_key="semantic-gates")
        contract = payload["task_contract"]
        contract["required_checks"] = ["unit", "contract", "security-check"]
        contract["stop_conditions"] = ["security-boundary-violation"]
        contract["retry_conditions"] = ["receipt:security-check"]
        contract["approval_boundaries"] = ["source-activation", "privilege-expansion"]
        contract["required_deliverables"] = [
            "implementation", "verification report", "review report", "audit-bundle",
        ]
        contract["completion_conditions"] = ["audit-bundle artifact exists"]
        run = self.run_request(payload)
        self.assertEqual("implementing", run["state"])
        self.assertNotIn("condition_not_machine_checkable", rejection_codes(run))
        stopped = self.resume_run(
            run,
            events=[
                {
                    "type": "failure_observed",
                    "cause": "security-boundary-violation",
                    "actor": "reviewer",
                }
            ],
        )
        self.assertEqual("blocked", stopped["state"])
        self.assertIn("stop_condition", rejection_codes(stopped))


class InvalidationSchedulerAndMetricsTest(StopContractTestCase):
    def test_plan_artifact_and_ownership_changes_invalidate_derived_approval(self) -> None:
        for event in (
            {"type": "plan_revised", "change": "revision two"},
            {
                "type": "ownership_revised", "actor": "orchestrator",
                "write_ownership": [{"owner": "backend", "paths": ["app/Http/Controllers/ExampleController.php"]}],
            },
        ):
            with self.subTest(event=event["type"]):
                run = self.run_request(request(idempotency_key=f"invalidate-{event['type']}"))
                approved = self.initially_approve(run)
                before = (approved["artifact_revision"], approved["current_artifact_digest"])
                changed = self.resume_run(approved, events=[event])
                self.assertFalse(changed["implementation_approval"]["approved"])
                self.assertNotEqual("implementation_approved", changed["state"])
                self.assertNotEqual(before, (changed["artifact_revision"], changed["current_artifact_digest"]))

        approved = self.initially_approve(
            self.run_request(request(idempotency_key="reject-post-approval-artifact"))
        )
        before = copy.deepcopy(
            {
                "revision": approved["revision"],
                "state": approved["state"],
                "shared_plan": approved["shared_plan"],
                "artifact_revision": approved["artifact_revision"],
                "current_artifact_digest": approved["current_artifact_digest"],
                "implementation_log": approved["implementation_log"],
                "findings": approved["findings"],
                "attempt_count": approved["attempt_count"],
            }
        )
        rejected = self.resume_run(
            approved,
            events=[
                {
                    "type": "artifact", "actor": self.roles(approved)["writer"],
                    "authority_grant": issued_write_grant(approved),
                    "path": approved["task_contract"]["allowed_paths"][0],
                    "content": {"changed": True},
                }
            ],
        )
        after = {
            "revision": rejected["revision"],
            "state": rejected["state"],
            "shared_plan": rejected["shared_plan"],
            "artifact_revision": rejected["artifact_revision"],
            "current_artifact_digest": rejected["current_artifact_digest"],
            "implementation_log": rejected["implementation_log"],
            "findings": rejected["findings"],
            "attempt_count": rejected["attempt_count"],
        }
        self.assertEqual(before, after)
        self.assertIn("artifact_write_state", rejection_codes(rejected))

    def test_old_initial_reports_cannot_sync_after_plan_revision(self) -> None:
        run = self.run_request(request(idempotency_key="stale-plan-sync"))
        approved = self.initially_approve(run)
        revised = self.resume_run(approved, events=[{"type": "plan_revised", "change": "revision two"}])
        result = self.resume_run(revised, source_sync_request=self.source_request(revised))
        self.assertFalse(result["source_sync"]["accepted"])
        self.assertRegex(json.dumps(result["rejections"]).lower(), r"approval|stale")

    def test_oversized_team_is_minimized_or_blocked_never_overfills_three_waves(self) -> None:
        registry = minimal_registry()
        for index in range(8):
            registry["agents"].append(
                {
                    "id": f"extra-{index}", "roles": ["specialist"], "domains": ["backend"],
                    "capabilities": ["php"], "path_scopes": ["app/**"],
                    "risk_triggers": ["critical"], "model_profile": f"extra-{index}-profile",
                }
            )
        run = self.run_request(
            request(idempotency_key="oversized-team", domains=["backend"], capabilities=["php"], risk="critical"),
            registry=registry,
        )
        waves = run["shared_plan"]["waves"]
        self.assertLessEqual(len(waves), 3)
        self.assertTrue(all(len(wave["agents"]) <= 3 for wave in waves))
        scheduled = [agent for wave in waves for agent in wave["agents"]]
        self.assertEqual(len(scheduled), len(set(scheduled)))
        self.assertTrue(run["state"] == "blocked" or len(run["team"]) <= 9)

    def test_run_metrics_are_complete_non_invented_and_artifact_backed(self) -> None:
        run = self.run_request(request(idempotency_key="metrics"))
        metrics = self.value(run, "metrics")
        required = {
            "task_id", "task_type", "affected_domains", "risk_level", "selected_agents",
            "selection_reasons", "primary_writer", "model_profiles", "state_transitions", "changed_files",
            "commands_executed", "test_results", "static_analysis_results", "retry_count",
            "failure_categories", "review_findings", "verification_failures", "architecture_violations",
            "human_interventions", "approval_requests", "source_updates", "final_status",
        }
        self.assertTrue(required.issubset(metrics))
        for unavailable in ("elapsed_time", "token_usage", "cost"):
            self.assertIn(metrics.get(unavailable), {None, "unavailable"})
        reference = next(item for item in run["artifacts"] if item["name"] == "implementation-log")
        document = json.loads((self.runs_dir / run["run_id"] / reference["path"]).read_text(encoding="utf-8"))
        self.assertEqual(metrics, document["metrics"])

    def test_improvement_proposal_references_metrics_and_artifact_evidence(self) -> None:
        run = self.run_request(
            request(idempotency_key="improvement-evidence", events=[{"type": "improvement_proposed", "kind": "quality"}])
        )
        self.assertIn("metrics", run)
        proposal = run["improvement_proposals"][0]
        self.assertEqual(run["metrics"]["digest"], proposal["metrics_digest"])
        self.assertTrue(proposal["artifact_refs"])


class SourcePolicyCliStorageFindingContractTest(StopContractTestCase):
    def test_source_ref_is_a_real_immutable_generation_artifact(self) -> None:
        run = self.run_request(request(idempotency_key="real-staging-ref"))
        staged = self.stage(run)
        staging = staged["source_sync"]["staging_artifact"]
        ref_path = self.runs_dir / staged["run_id"] / staging["ref"]
        self.assertTrue(ref_path.is_file())
        document = json.loads(ref_path.read_text(encoding="utf-8"))
        self.assertEqual(staging["digest"], sha256_digest({k: v for k, v in document.items() if k != "digest"}))
        self.assertEqual(staged["run_id"], document["provenance"]["run_id"])

    def test_unverified_external_connection_defaults_to_human_application(self) -> None:
        run = self.run_request(request(idempotency_key="unverified-external"))
        staged = self.stage(run)
        self.assertEqual("prepared_for_human_application", staged["source_sync"]["status"])
        self.assertEqual("unverified", staged["source_sync"]["connection_status"])
        self.assertFalse(staged["source_sync"]["external_connection_verified"])

    def test_source_minimum_state_and_duplicate_policy_drift_are_policy_owned(self) -> None:
        policy = minimal_policy()
        self.assertEqual(
            "implementation_approved", policy["source_sync"]["minimum_state"]
        )
        self.assertNotIn("source_sync_minimum_state", policy)
        premature = self.run_request(request(idempotency_key="minimum-policy-premature"))
        rejected = self.resume_run(
            premature, source_sync_request=self.source_request(premature)
        )
        self.assertFalse(rejected["source_sync"]["accepted"])
        self.assertIn("source_sync_gate", rejection_codes(rejected))

        run = self.run_request(request(idempotency_key="minimum-policy-approved"))
        approved = self.initially_approve(run)
        result = self.resume_run(
            approved, source_sync_request=self.source_request(approved)
        )
        self.assertTrue(result["source_sync"]["accepted"])
        self.assertEqual("source_sync", result["state"])

    def test_source_manual_activation_setting_is_policy_owned(self) -> None:
        policy = minimal_policy()
        self.assertTrue(policy["source_sync"]["manual_activation"])
        run = self.run_request(request(idempotency_key="manual-policy"))
        approved = self.initially_approve(run)
        source = self.source_request(approved, activate=True)
        rejected = self.resume_run(approved, source_sync_request=source)
        self.assertFalse(rejected["source_sync"]["accepted"])
        self.assertIn("manual_activation_required", rejection_codes(rejected))
        result = self.resume_run(
            rejected, source_sync_request=self.source_request(rejected, activate=False)
        )
        self.assertTrue(result["source_sync"]["accepted"])

    def test_real_cli_completion_accepts_expected_revision_and_mutating_failures_are_nonzero(self) -> None:
        cli = load_cli_module()
        run = self.run_request(request(idempotency_key="real-cli"))
        staged = self.stage(run)
        verified = self.resume_run(staged, events=[report_event(staged, "verification", "passed", phase="final")])
        reviewed = self.resume_run(verified, events=[report_event(verified, "review", "passed", phase="final")])
        with mock.patch.object(cli, "load_harness", return_value=self.harness.facade), mock.patch.object(
            sys, "argv", ["team-harness", "completion-gate", reviewed["run_id"], "--expected-revision", str(reviewed["revision"])]
        ):
            output = io.StringIO()
            try:
                with redirect_stdout(output):
                    code = cli.main()
            except SystemExit as error:
                self.fail(f"completion-gate parser must accept expected revision: {error}")
        self.assertEqual(0, code)
        self.assertTrue(json.loads(output.getvalue())["complete"])

        cancelled = self.run_request(request(idempotency_key="real-cli-terminal", events=[{"type": "transition", "from": "implementing", "to": "cancelled", "actor": "orchestrator"}]))
        with mock.patch.object(cli, "load_harness", return_value=self.harness.facade), mock.patch.object(
            cli, "read_json", return_value={"kind": "quality"}
        ), mock.patch.object(sys, "argv", ["team-harness", "improvement", cancelled["run_id"], "input.json"]):
            with redirect_stdout(io.StringIO()):
                self.assertNotEqual(0, cli.main())

    def test_unknown_and_policy_forbidden_transition_cli_are_nonzero(self) -> None:
        cli = load_cli_module()
        run = self.run_request(request(idempotency_key="cli-transition"))
        for target in ("ghost", "completed"):
            with self.subTest(target=target), mock.patch.object(
                cli, "load_harness", return_value=self.harness.facade
            ), mock.patch.object(sys, "argv", ["team-harness", "transition", run["run_id"], target]):
                with redirect_stdout(io.StringIO()):
                    self.assertNotEqual(0, cli.main())

    def test_legacy_adapt_cli_uses_registry_and_policy_or_is_removed(self) -> None:
        cli = load_cli_module()
        self.assertTrue(minimal_policy()["legacy_adapter"]["enabled"])
        documents = (
            (
                {"schema_version": "1.0", "legacy_single_agent": {"agent": "backend", "task": "task", "paths": ["app/A.php"]}},
                0,
            ),
            (
                {"schema_version": "1.0", "legacy_single_agent": {"agent": "ghost", "task": "task", "paths": ["app/A.php"]}},
                1,
            ),
        )
        for index, (document, expected) in enumerate(documents):
            with self.subTest(index=index), mock.patch.object(cli, "load_harness", return_value=self.harness.facade), mock.patch.object(
                cli, "read_json", return_value=document
            ), mock.patch.object(sys, "argv", ["team-harness", "legacy-adapt", "input.json"]):
                with redirect_stdout(io.StringIO()):
                    code = cli.main()
                if expected == 0:
                    self.assertEqual(0, code)
                else:
                    self.assertNotEqual(0, code)

    def test_store_blocks_malformed_manifest_and_escaping_refs_without_exception(self) -> None:
        for mutation in ("malformed", "traversal", "absolute"):
            with self.subTest(mutation=mutation):
                run = self.run_request(request(idempotency_key=f"manifest-{mutation}"))
                root = self.runs_dir / run["run_id"]
                manifest_path = root / "commit-manifest.json"
                if mutation == "malformed":
                    manifest_path.write_text("{", encoding="utf-8")
                else:
                    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                    state = self.harness.facade.store.load(run["run_id"])
                    escaped = self.runs_dir / f"escaped-{mutation}.json"
                    escaped.write_text(json.dumps(state), encoding="utf-8")
                    manifest["state_ref"] = "../" + escaped.name if mutation == "traversal" else str(escaped.resolve())
                    manifest["state_digest"] = sha256_digest(state)
                    unsigned = {key: value for key, value in manifest.items() if key != "manifest_digest"}
                    manifest["manifest_digest"] = sha256_digest(unsigned)
                    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
                try:
                    loaded = self.harness.facade.store.load(run["run_id"])
                except Exception as error:
                    self.fail(f"manifest integrity failure must not escape as exception: {error}")
                self.assertEqual("blocked", loaded["state"])
                self.assertEqual("failed", loaded["integrity_status"])

    def test_public_finding_requires_stable_identity_and_fix_resolves_only_explicit_issue_ids(self) -> None:
        run = self.run_request(
            request(
                idempotency_key="finding-required",
                events=[{"type": "finding", "actor": "reviewer", "source": "reviewer", "kind": "quality", "message": "same"}],
            )
        )
        self.assertIn("finding_identity_required", rejection_codes(run))

        identified = self.run_request(
            request(
                idempotency_key="finding-resolution",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/finding-I-1.diff",
                ],
                events=[
                    {"type": "finding", "actor": "reviewer", "source": "reviewer", "issue_id": "I-1", "clause": "c", "location": "a", "kind": "quality", "message": "same", "status": "open"},
                    {"type": "finding", "actor": "reviewer", "source": "reviewer", "issue_id": "I-2", "clause": "c", "location": "b", "kind": "quality", "message": "same", "status": "open"},
                ],
            )
        )
        failed = self.resume_run(identified, events=[report_event(identified, "verification", "failed", cause="same")])
        fixed = self.apply_persisted_fix(
            failed,
            cause="same",
            issue_ids=["I-1"],
            path="app/finding-I-1.diff",
        )
        before = {item["issue_id"]: item for item in failed["findings"]}
        after = {item["issue_id"]: item for item in fixed["findings"]}
        self.assertEqual(before, after)
        self.assertTrue(all(item["status"] == "open" for item in fixed["findings"]))
        resolutions = [
            item
            for item in fixed["implementation_log"]
            if item.get("kind") == "finding_resolution_receipt"
        ]
        self.assertEqual(1, len(resolutions))
        resolution = resolutions[0]
        self.assertEqual("I-1", resolution["issue_id"])
        self.assertEqual(before["I-1"]["digest"], resolution["finding_digest"])
        self.assertEqual(
            resolution["digest"],
            sha256_digest({key: value for key, value in resolution.items() if key != "digest"}),
        )
        catalog = {item["issue_id"]: item for item in fixed["finding_catalog"]}
        self.assertEqual("resolved", catalog["I-1"]["status"])
        self.assertEqual(resolution["digest"], catalog["I-1"]["resolution_receipt_digest"])
        self.assertEqual("open", catalog["I-2"]["status"])
        self.assertIsNone(catalog["I-2"]["resolution_receipt_digest"])

    def test_fix_rejects_arbitrary_hashes_and_accepts_immutable_input_with_real_diff_receipt(self) -> None:
        run = self.run_request(
            request(
                idempotency_key="fix-causality",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/fix.diff",
                ],
                events=[
                    {
                        "type": "finding", "actor": "verifier", "source": "verifier",
                        "issue_id": "ISSUE-7", "clause": "retry.evidence", "location": "app/fix.diff",
                        "kind": "quality", "message": "ISSUE-7", "status": "open",
                    }
                ],
            )
        )
        failed = self.resume_run(run, events=[report_event(run, "verification", "failed", cause="ISSUE-7")])
        arbitrary = {
            "type": "fix_applied", "actor": self.roles(failed)["writer"],
            "attempt": failed["attempt_count"] + 1, "plan_revision": failed["shared_plan"]["revision"],
            "cause": "ISSUE-7", "issue_ids": ["ISSUE-7"],
            "failed_report_digest": failed["initial_verification_report"]["report_digest"],
            "cause_fingerprint": sha256_digest("issue-7"),
            "changed_input_fingerprint": failed["input_fingerprint"],
            "changed_diff_digest": sha256_digest("caller invented diff"),
            "environment_fingerprint": failed["environment_fingerprint"],
            "fix_artifact": {
                "digest": sha256_digest("unpersisted artifact"),
                "provenance": {"producer": self.roles(failed)["writer"], "run_id": failed["run_id"]},
            },
        }
        rejected = self.resume_run(failed, events=[arbitrary])
        self.assertIn("fix_artifact_unverified", rejection_codes(rejected))

        receipt_run = self.resume_run(
            rejected,
            events=[
                {
                    "type": "artifact", "actor": self.roles(rejected)["writer"],
                    "authority_grant": issued_write_grant(rejected),
                    "path": "app/fix.diff",
                    "content": {"issue_ids": ["ISSUE-7"], "patch": "real"},
                }
            ],
        )
        receipt = receipt_run["implementation_log"][-1]
        valid = copy.deepcopy(arbitrary)
        valid["changed_diff_digest"] = receipt["digest"]
        valid["fix_artifact"] = receipt
        fixed = self.resume_run(receipt_run, events=[valid])
        self.assertEqual(failed["input_fingerprint"], fixed["input_fingerprint"])
        self.assertEqual("implementing", fixed["state"])

    def test_retry_limit_uses_normalized_cause_fingerprint(self) -> None:
        run = self.run_request(
            request(
                idempotency_key="normalized-retry",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/fix-0.diff",
                    "app/fix-1.diff",
                    "app/fix-2.diff",
                ],
            )
        )
        current = run
        for index, cause in enumerate(("Timeout", " timeout ", "TIMEOUT")):
            failed = self.resume_run(current, events=[report_event(current, "verification", "failed", cause=cause)])
            if failed["state"] == "failed":
                current = failed
                break
            receipt_run = self.resume_run(
                failed,
                events=[
                    {
                        "type": "artifact", "actor": self.roles(failed)["writer"],
                        "authority_grant": issued_write_grant(failed),
                        "path": f"app/fix-{index}.diff", "content": {"patch": index},
                    }
                ],
            )
            receipt = receipt_run["implementation_log"][-1]
            current = self.resume_run(
                receipt_run,
                events=[
                    {
                        "type": "fix_applied", "actor": self.roles(receipt_run)["writer"],
                        "attempt": receipt_run["attempt_count"] + 1,
                        "plan_revision": receipt_run["shared_plan"]["revision"], "cause": cause,
                        "issue_ids": [], "failed_report_digest": failed["initial_verification_report"]["report_digest"],
                        "cause_fingerprint": sha256_digest(cause.strip().lower()),
                        "changed_input_fingerprint": receipt_run["input_fingerprint"],
                        "changed_diff_digest": receipt["digest"],
                        "environment_fingerprint": receipt_run["environment_fingerprint"],
                        "fix_artifact": receipt,
                    }
                ],
            )
        self.assertEqual("failed", current["state"])
        self.assertIn("retry_limit", rejection_codes(current))

    def test_recursive_sensitive_values_are_rejected_without_echo_at_every_entry(self) -> None:
        secret = "do-not-echo-secret-value"
        run_payload = request(idempotency_key="secret-run")
        run_payload["nested"] = {"APP_KEY": secret}
        run = self.run_request(run_payload)
        self.assertEqual("blocked", run["state"])
        self.assertNotIn(secret, json.dumps(run))

        clean = self.run_request(request(idempotency_key="secret-entries"))
        entry_payloads = (
            {"nested": {"AWS_SECRET_ACCESS_KEY": secret}},
            {"events": [{"type": "artifact", "path": "app/A.json", "content": {"nested": {"token": secret}}}]},
            {"source_sync_request": {"payload": {"password": secret}}},
        )
        for entry in entry_payloads:
            with self.subTest(entry=next(iter(entry))):
                result = self.resume_run(clean, **entry)
                self.assertIn("redaction", json.dumps(result["rejections"]).lower())
                self.assertNotIn(secret, json.dumps(result))

        decision = self.harness.facade.authorize_write(
            clean["run_id"],
            {
                "schema_version": "1.0", "run_id": clean["run_id"], "agent": "backend",
                "paths": clean["task_contract"]["allowed_paths"], "expected_revision": clean["revision"],
                "lease": {"nested": {"PRIVATE_KEY": secret}},
            },
        )
        self.assertIn("redaction", json.dumps(decision["rejections"]).lower())
        self.assertNotIn(secret, json.dumps(decision))
        legacy = self.run_request(
            {
                "schema_version": "1.0", "idempotency_key": "secret-legacy",
                "legacy_single_agent": {
                    "agent": "backend", "task": "task", "paths": ["app/A.php"],
                    "nested": {"token": secret},
                },
            }
        )
        self.assertEqual("blocked", legacy["state"])
        self.assertNotIn(secret, json.dumps(legacy))


if __name__ == "__main__":
    unittest.main()
