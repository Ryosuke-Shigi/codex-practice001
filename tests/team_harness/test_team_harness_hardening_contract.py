"""High/Critical safety contracts required before the harness can leave shadow mode."""

from __future__ import annotations

import copy
import importlib.util
import io
import json
import multiprocessing
import os
import sys
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

from test_team_harness_contract import (
    CONFIG_ROOT,
    ROOT,
    HarnessAdapter,
    TeamHarnessContractTestCase,
    evidence_from,
    minimal_policy,
    minimal_registry,
    parent_lease,
    report_event,
    request,
    sha256_digest,
)


FIXTURES = Path(__file__).with_name("fixtures")
DEFAULT_PARENT_LEASE = object()


def rejection_codes(result: dict[str, object]) -> set[str]:
    return {str(item.get("code")) for item in result.get("rejections", []) if isinstance(item, dict)}


def load_cli_module():
    path = ROOT / "scripts" / "team_harness.py"
    spec = importlib.util.spec_from_file_location("team_harness_cli_under_test", path)
    if spec is None or spec.loader is None:
        raise AssertionError("CLI module could not be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def probe_interprocess_lock(runs_dir: str, run_id: str, queue: object) -> None:
    from team_harness.storage import RunStore

    store = RunStore(Path(runs_dir))
    try:
        with store.interprocess_lock(run_id, timeout=0.2):
            queue.put("acquired")
    except TimeoutError:
        queue.put("blocked")


class WriteAuthorizationHardeningTest(TeamHarnessContractTestCase):
    def _start(self, key: str = "authorization") -> dict[str, object]:
        return self.run_request(request(idempotency_key=key))

    def _decision(
        self,
        run: dict[str, object],
        *,
        agent: str = "backend",
        paths: list[str] | None = None,
        lease: object = DEFAULT_PARENT_LEASE,
    ) -> dict[str, object]:
        owned = paths or ["app/Http/Controllers/ExampleController.php"]
        lease_value = parent_lease(run, agent, owned) if lease is DEFAULT_PARENT_LEASE else lease
        write_request = {
            "schema_version": "1.0",
            "run_id": run["run_id"],
            "agent": agent,
            "paths": owned,
            "lease": lease_value,
            "expected_revision": run.get("revision", 0),
        }
        try:
            return self.harness.facade.authorize_write(run["run_id"], write_request)
        except TypeError as error:
            self.fail(f"authorize_write must accept run_id and a run-scoped request: {error}")

    def test_run_scoped_primary_writer_with_exact_parent_lease_is_authorized(self) -> None:
        run = self._start("auth-valid")
        decision = self._decision(run)
        self.assertTrue(decision["authorized"])
        self.assertEqual(run["run_id"], decision["run_id"])
        self.assertEqual("backend", decision["agent"])
        self.assertEqual(run["ownership_revision"], decision["ownership_revision"])

    def test_write_rejects_missing_or_unverifiable_parent_lease(self) -> None:
        run = self._start("auth-bad-lease")
        valid = parent_lease(run, "backend", ["app/Http/Controllers/ExampleController.php"])
        mutations = {
            "missing": None,
            "wrong_run": {**valid, "run_id": "run-wrong"},
            "expired": {**valid, "expires_at": "2000-01-01T00:00:00Z"},
            "wrong_agent": {**valid, "agent": "frontend"},
            "stale_epoch": {**valid, "epoch": run.get("lease_epoch", 0) - 1},
            "stale_ownership": {**valid, "ownership_revision": run.get("ownership_revision", 0) - 1},
        }
        for label, candidate in mutations.items():
            with self.subTest(label=label):
                decision = self._decision(run, lease=candidate)
                self.assertFalse(decision["authorized"])
                self.assertIn("lease", json.dumps(decision).lower())

    def test_write_rejects_empty_contract_scope_and_non_exact_ownership(self) -> None:
        empty = self.run_request(request(idempotency_key="auth-empty", paths=[]))
        self.assertEqual("blocked", empty["state"])
        self.assertIn("empty", json.dumps(empty["blockers"]).lower())

        paths = ["app/Http/Controllers/ExampleController.php", "app/Services/ExampleService.php"]
        run = self.run_request(request(idempotency_key="auth-exact", paths=paths))
        lease = parent_lease(run, "backend", [paths[0]])
        decision = self._decision(run, paths=[paths[1]], lease=lease)
        self.assertFalse(decision["authorized"])
        self.assertIn("ownership", json.dumps(decision).lower())

    def test_write_rejects_reviewer_verifier_and_non_implementing_state(self) -> None:
        run = self._start("auth-role-state")
        for agent in ("reviewer", "verifier"):
            with self.subTest(agent=agent):
                self.assertNotIn(agent, run["authority_grants"]["write"])
                decision = self._decision(run, agent=agent, lease={})
                self.assertFalse(decision["authorized"])
                self.assertIn("role", json.dumps(decision).lower())

        approved = self.initially_approve(run)
        decision = self._decision(approved)
        self.assertFalse(decision["authorized"])
        self.assertIn("state", json.dumps(decision).lower())

    def test_write_rejects_env_git_traversal_and_symlink_escape(self) -> None:
        run = self._start("auth-paths")
        for unsafe in (".env.local", ".env.example", ".git", ".git/config", "app/../.env"):
            with self.subTest(path=unsafe):
                decision = self._decision(run, paths=[unsafe], lease=parent_lease(run, "backend", [unsafe]))
                self.assertFalse(decision["authorized"])
                self.assertRegex(json.dumps(decision).lower(), r"forbidden|traversal|scope")

        project_root = Path(self.temporary_directory.name) / "project"
        project_root.mkdir()
        outside = Path(self.temporary_directory.name) / "outside"
        outside.mkdir()
        (project_root / "app").mkdir()
        os.symlink(outside, project_root / "app" / "escape")
        facade_type = type(self.harness.facade)
        try:
            hardened = facade_type(
                minimal_registry(),
                minimal_policy(),
                Path(self.temporary_directory.name) / "symlink-runs",
                project_root=project_root,
            )
        except TypeError as error:
            self.fail(f"project_root injection is required for symlink-safe authorization: {error}")
        symlink_run = hardened.run(request(idempotency_key="auth-symlink", paths=["app/escape/secret.php"]))
        lease = parent_lease(symlink_run, "backend", ["app/escape/secret.php"])
        decision = hardened.authorize_write(
            symlink_run["run_id"],
            {
                "run_id": symlink_run["run_id"],
                "agent": "backend",
                "paths": ["app/escape/secret.php"],
                "lease": lease,
                "expected_revision": symlink_run.get("revision", 0),
            },
        )
        self.assertFalse(decision["authorized"])
        self.assertIn("symlink_escape", json.dumps(decision).lower())

    def test_parallel_write_requires_every_lease_and_reverification_evidence(self) -> None:
        paths = ["app/Services/A.php", "app/Services/B.php"]
        started = self.run_request(
            request(
                "Parallel candidates",
                domains=["backend"],
                capabilities=["php"],
                paths=paths,
                idempotency_key="parallel-negative",
            )
        )
        self.assertEqual("implementing", started["state"])
        self.assertEqual("backend", started["selection"]["writer"])
        stale_lease = parent_lease(started, "backend", paths)
        stale_lease["epoch"] += 1
        incomplete = {
            "writers": [
                {
                    "agent": "backend",
                    "paths": [paths[0]],
                    "worktree": "one",
                },
                {
                    "agent": "backend", "paths": [paths[1]],
                    "worktree": "two", "lease": stale_lease,
                },
            ],
            "integration_owner": "backend",
        }
        result = self.resume_run(started, worktree_request=incomplete)
        self.assertEqual("implementing", result["state"])
        self.assertFalse(self.value(result, "parallel_write_candidate"))
        codes = rejection_codes(result)
        self.assertIn("lease_required", codes)
        self.assertIn("authority_grant_mismatch", codes)
        self.assertIn("post_integration_reverification_required", codes)
        self.assertNotIn("terminal_immutable", codes)
        self.assertNotIn("overlapping_ownership", codes)


class QualityEvidenceAndGateTest(TeamHarnessContractTestCase):
    def test_quality_report_requires_actor_attempt_revision_fingerprints_digest_and_provenance(self) -> None:
        required = {
            "actor",
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
        for missing in sorted(required):
            with self.subTest(missing=missing):
                run = self.run_request(request(idempotency_key=f"report-missing-{missing}"))
                event = report_event(run, "verification", "passed")
                event.pop(missing)
                result = self.resume_run(run, events=[event])
                self.assertIn("report_evidence_missing", rejection_codes(result))
                self.assertNotEqual("reviewing", result["state"])

    def test_quality_report_rejects_wrong_role_actor_stale_attempt_and_stale_plan(self) -> None:
        run = self.run_request(request(idempotency_key="report-binding"))
        cases = {
            "wrong_actor": {"actor": "reviewer"},
            "stale_attempt": {"attempt": run["attempt_count"] - 1},
            "stale_plan": {"plan_revision": run["shared_plan"]["revision"] - 1},
            "wrong_artifact": {"artifact_digest": sha256_digest("other artifact")},
        }
        for label, updates in cases.items():
            with self.subTest(label=label):
                event = report_event(run, "verification", "passed")
                event.update(updates)
                event["report_digest"] = sha256_digest({key: value for key, value in event.items() if key != "report_digest"})
                result = self.resume_run(run, events=[event])
                self.assertRegex(json.dumps(result["rejections"]).lower(), r"actor|attempt|plan|artifact")
                self.assertNotEqual("reviewing", result["state"])

    def test_direct_implementation_approved_event_is_rejected(self) -> None:
        run = self.run_request(request(idempotency_key="direct-approval"))
        result = self.resume_run(run, events=[{"type": "implementation_approved", "actor": "orchestrator"}])
        self.assertIn("direct_approval_forbidden", rejection_codes(result))
        self.assertNotEqual("implementation_approved", result["state"])

    def test_approval_is_derived_only_from_current_initial_reports_and_no_unresolved_items(self) -> None:
        run = self.run_request(request(idempotency_key="derived-approval"))
        verified = self.resume_run(run, events=[report_event(run, "verification", "passed")])
        self.assertNotEqual("implementation_approved", verified["state"])
        approved = self.resume_run(verified, events=[report_event(verified, "review", "passed")])
        self.assertEqual("implementation_approved", approved["state"])
        self.assertEqual("derived", approved["implementation_approval"]["source"])

        unresolved = self.run_request(
            request(
                idempotency_key="approval-unresolved",
                events=[
                    {
                        "type": "finding",
                        "actor": "reviewer",
                        "source": "reviewer",
                        "issue_id": "ISSUE-1",
                        "clause": "quality.no-open-findings",
                        "location": "app/A.php:1",
                        "kind": "quality",
                        "message": "open issue",
                        "status": "open",
                    }
                ],
            )
        )
        verified = self.resume_run(unresolved, events=[report_event(unresolved, "verification", "passed")])
        reviewed = self.resume_run(verified, events=[report_event(verified, "review", "passed")])
        self.assertNotEqual("implementation_approved", reviewed["state"])
        self.assertIn("unresolved", json.dumps(reviewed["rejections"]).lower())

    def test_pass_after_failure_without_changed_fix_evidence_is_rejected(self) -> None:
        run = self.run_request(request(idempotency_key="unchanged-retry"))
        failed = self.resume_run(run, events=[report_event(run, "verification", "failed", cause="same")])
        unchanged = self.resume_run(failed, events=[report_event(failed, "verification", "passed")])
        self.assertIn("fix_evidence_required", rejection_codes(unchanged))
        self.assertNotEqual("reviewing", unchanged["state"])

    def test_source_sync_requires_current_strict_approval_and_current_evidence(self) -> None:
        run = self.run_request(request(idempotency_key="source-strict"))
        approved = self.initially_approve(run)
        self.assertEqual("implementation_approved", approved["state"])
        base = {
            "schema_version": "1.0",
            "artifact_revision": approved["artifact_revision"],
            "artifact_digest": approved["current_artifact_digest"],
            "payload": {"change": "v1"},
            "source_baseline_digest": sha256_digest("baseline"),
            "target_identity": {"system": "external", "catalog": "team-harness"},
            "activate": False,
        }
        for missing in ("payload", "source_baseline_digest", "target_identity", "artifact_digest"):
            with self.subTest(missing=missing):
                candidate = dict(base)
                candidate.pop(missing)
                result = self.resume_run(approved, source_sync_request=candidate)
                self.assertFalse(result["source_sync"]["accepted"])
                self.assertIn("schema_validation", rejection_codes(result))
        stale = {**base, "artifact_digest": sha256_digest("stale")}
        result = self.resume_run(approved, source_sync_request=stale)
        self.assertFalse(result["source_sync"]["accepted"])
        self.assertIn("stale_artifact", rejection_codes(result))

    def test_completion_gate_does_not_synthesize_final_states_or_reports(self) -> None:
        run = self.run_request(request(idempotency_key="completion-no-synthesis"))
        approved = self.initially_approve(run)
        try:
            report = self.harness.facade.completion_gate(
                approved["run_id"], expected_revision=approved.get("revision", 0)
            )
        except TypeError as error:
            self.fail(f"completion_gate must require expected_revision: {error}")
        persisted = self.harness.facade.store.load(approved["run_id"])
        self.assertFalse(report["complete"])
        self.assertEqual("implementation_approved", persisted["state"])
        self.assertEqual("not_run", persisted["final_verification_report"]["status"])
        self.assertEqual("not_run", persisted["final_review_report"]["status"])

    def test_completion_requires_distinct_final_reports_for_staged_artifact(self) -> None:
        run = self.run_request(request(idempotency_key="completion-positive"))
        approved = self.initially_approve(run)
        self.assertEqual("implementation_approved", approved["state"])
        staged = self.resume_run(
            approved,
            source_sync_request={
                "schema_version": "1.0",
                "artifact_revision": approved["artifact_revision"],
                "artifact_digest": approved["current_artifact_digest"],
                "payload": {"change": "v1"},
                "source_baseline_digest": sha256_digest("baseline"),
                "target_identity": {"system": "external", "catalog": "team-harness"},
                "activate": False,
            },
        )
        final_verified = self.resume_run(staged, events=[report_event(staged, "verification", "passed", phase="final")])
        final_reviewed = self.resume_run(
            final_verified,
            events=[report_event(final_verified, "review", "passed", phase="final")],
        )
        self.assertEqual("final_review", final_reviewed["state"])
        self.assertNotEqual(
            final_reviewed["initial_verification_report"]["report_digest"],
            final_reviewed["final_verification_report"]["report_digest"],
        )
        report = self.harness.facade.completion_gate(
            final_reviewed["run_id"], expected_revision=final_reviewed.get("revision", 0)
        )
        self.assertTrue(report["complete"])
        completed = self.harness.facade.store.load(final_reviewed["run_id"])
        before = copy.deepcopy(completed["artifacts"])
        late = self.resume_run(
            completed,
            events=[
                {
                    "type": "finding", "actor": "reviewer", "source": "reviewer",
                    "issue_id": "LATE-COMPLETED", "clause": "terminal.immutable",
                    "location": "run", "kind": "quality", "message": "late",
                    "status": "open",
                }
            ],
        )
        self.assertIn("terminal_immutable", rejection_codes(late))
        self.assertEqual(before, late["artifacts"])

    def test_terminal_run_rejects_late_finding_and_preserves_artifact_generation(self) -> None:
        run = self.run_request(request(idempotency_key="terminal-immutable"))
        before = copy.deepcopy(
            {
                "revision": run["revision"],
                "state": run["state"],
                "shared_plan": run["shared_plan"],
                "artifact_revision": run["artifact_revision"],
                "current_artifact_digest": run["current_artifact_digest"],
                "implementation_log": run["implementation_log"],
                "findings": run["findings"],
                "attempt_count": run["attempt_count"],
                "artifacts": run["artifacts"],
            }
        )
        result = self.resume_run(
            run,
            events=[
                {
                    "type": "transition", "from": run["state"], "to": "cancelled",
                    "actor": "orchestrator",
                },
                {
                    "type": "finding",
                    "actor": "reviewer",
                    "source": "reviewer",
                    "issue_id": "LATE-1",
                    "clause": "terminal.immutable",
                    "location": "run",
                    "kind": "quality",
                    "message": "late",
                    "status": "open",
                }
            ],
        )
        after = {
            "revision": result["revision"],
            "state": result["state"],
            "shared_plan": result["shared_plan"],
            "artifact_revision": result["artifact_revision"],
            "current_artifact_digest": result["current_artifact_digest"],
            "implementation_log": result["implementation_log"],
            "findings": result["findings"],
            "attempt_count": result["attempt_count"],
            "artifacts": result["artifacts"],
        }
        self.assertIn("reserved_state_transition", rejection_codes(result))
        self.assertEqual(before, after)


class SchemaAndPolicyContractTest(TeamHarnessContractTestCase):
    REQUIRED_TASK_FIELDS = {
        "task_id", "title", "goal", "background", "current_state", "desired_state", "scope",
        "non_goals", "acceptance_criteria", "constraints", "source_of_truth", "allowed_paths",
        "forbidden_paths", "affected_domains", "risk_level", "required_capabilities",
        "team_assignment", "primary_writer", "consulting_specialists", "reviewer", "verifier",
        "write_ownership", "required_checks", "stop_conditions", "retry_conditions",
        "approval_boundaries", "required_deliverables", "information_source_sync",
        "completion_conditions",
    }

    def _schema(self) -> dict[str, object]:
        return json.loads((CONFIG_ROOT / "team-harness.schema.json").read_text(encoding="utf-8"))

    def _validator(self):
        validator = getattr(self.harness.module, "validate_document", None)
        self.assertIsNotNone(validator, "team_harness must export its stdlib schema validator")
        return validator

    def test_schema_defines_every_canonical_document_as_closed_required_objects(self) -> None:
        schema = self._schema()
        definitions = schema["$defs"]
        normalized = {name.replace("_", "").lower(): value for name, value in definitions.items()}
        required_kinds = {
            "canonicalinputenvelope", "agentregistry", "executionpolicy", "acceptancemanifest",
            "taskcontract", "runstate", "finding", "findingcollection", "sharedplan",
            "teamassignment", "implementationlog", "statetransition", "initialverificationreport",
            "finalverificationreport", "initialreviewreport", "finalreviewreport", "sourcemanifest",
            "completion", "improvements", "artifactmanifest", "commitmanifest",
        }
        self.assertTrue(required_kinds.issubset(normalized), required_kinds - normalized.keys())
        for name, definition in definitions.items():
            if definition.get("type") == "object":
                with self.subTest(definition=name):
                    self.assertIs(definition.get("additionalProperties"), False)
                    self.assertTrue(definition.get("required"))

    def test_task_contract_schema_requires_every_user_field_and_rejects_unknowns(self) -> None:
        schema = self._schema()
        definitions = schema["$defs"]
        contract = next(value for name, value in definitions.items() if name.replace("_", "").lower() == "taskcontract")
        self.assertTrue(self.REQUIRED_TASK_FIELDS.issubset(set(contract["required"])))
        self.assertTrue(self.REQUIRED_TASK_FIELDS.issubset(set(contract["properties"])))
        self.assertIs(contract["additionalProperties"], False)

    def test_stdlib_validator_accepts_canonical_configs_example_build_and_twelve_artifacts(self) -> None:
        validate = self._validator()
        documents = {
            "agent_registry": json.loads((CONFIG_ROOT / "agent-capability-registry.json").read_text(encoding="utf-8")),
            "execution_policy": json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8")),
            "acceptance_manifest": json.loads((CONFIG_ROOT / "acceptance-scenarios.json").read_text(encoding="utf-8")),
            "canonical_input_envelope": json.loads((CONFIG_ROOT / "task-contract.example.json").read_text(encoding="utf-8")),
        }
        for kind, document in documents.items():
            with self.subTest(kind=kind):
                self.assertEqual([], validate(kind, document))

        run = self.run_request(request(idempotency_key="schema-generated"))
        self.assertEqual(12, len(run["artifacts"]))
        for reference in run["artifacts"]:
            path = self.runs_dir / run["run_id"] / reference["path"]
            document = json.loads(path.read_text(encoding="utf-8"))
            with self.subTest(artifact=reference["name"]):
                self.assertEqual([], validate(reference["name"], document))
        self.assertEqual([], validate("task_contract", run["task_contract"]))

    def test_stdlib_validator_rejects_required_field_removal_type_change_and_unknown_property(self) -> None:
        validate = self._validator()
        canonical = request()["task_contract"]
        mutations = []
        missing = copy.deepcopy(canonical)
        missing.pop("goal")
        mutations.append(missing)
        wrong_type = copy.deepcopy(canonical)
        wrong_type["allowed_paths"] = "app/A.php"
        mutations.append(wrong_type)
        extra = copy.deepcopy(canonical)
        extra["surprise"] = True
        mutations.append(extra)
        empty = copy.deepcopy(canonical)
        empty["acceptance_criteria"] = []
        mutations.append(empty)
        for index, mutation in enumerate(mutations):
            with self.subTest(index=index):
                self.assertTrue(validate("task_contract_input", mutation))

    def test_execution_policy_is_only_transition_owner(self) -> None:
        policy = json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8"))
        policy["allowed_transitions"]["implementing"] = [
            state for state in policy["allowed_transitions"]["implementing"] if state != "verifying"
        ]
        self.assertEqual([], self._validator()("execution_policy", policy))
        with self.assertRaisesRegex(ValueError, r"digest|pinned"):
            type(self.harness.facade)(
                minimal_registry(),
                policy,
                Path(self.temporary_directory.name) / "policy-owner",
            )

    def test_contradictory_execution_policy_fails_at_startup(self) -> None:
        policy = json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8"))
        policy["allowed_transitions"]["received"].append("ghost_state")
        with self.assertRaises(ValueError):
            type(self.harness.facade)(minimal_registry(), policy, Path(self.temporary_directory.name) / "bad-policy")


class PersistenceIntegrityContractTest(TeamHarnessContractTestCase):
    def test_run_store_lock_excludes_a_second_process(self) -> None:
        run = self.run_request(request(idempotency_key="interprocess-lock"))
        lock = getattr(self.harness.facade.store, "interprocess_lock", None)
        self.assertIsNotNone(lock, "RunStore must expose a per-run interprocess lock")
        context = multiprocessing.get_context("fork")
        queue = context.Queue()
        with lock(run["run_id"], timeout=1.0):
            process = context.Process(
                target=probe_interprocess_lock,
                args=(str(self.runs_dir), run["run_id"], queue),
            )
            process.start()
            process.join(timeout=3)
            self.assertFalse(process.is_alive())
            self.assertEqual("blocked", queue.get(timeout=1))
        process = context.Process(
            target=probe_interprocess_lock,
            args=(str(self.runs_dir), run["run_id"], queue),
        )
        process.start()
        process.join(timeout=3)
        self.assertEqual("acquired", queue.get(timeout=1))

    def test_state_is_revisioned_and_store_rejects_stale_compare_and_swap(self) -> None:
        run = self.run_request(request(idempotency_key="cas"))
        self.assertIn("revision", run)
        self.assertGreaterEqual(run["revision"], 1)
        stale = copy.deepcopy(run)
        stale["human_summary"] = "stale writer"
        with self.assertRaises(Exception) as caught:
            self.harness.facade.store.save(stale, expected_revision=run["revision"] - 1)
        self.assertIn("stale", str(caught.exception).lower())

    def test_commit_manifest_points_to_immutable_generation_with_provenance_and_trace_digest(self) -> None:
        run = self.run_request(request(idempotency_key="commit-manifest"))
        run_dir = self.runs_dir / run["run_id"]
        manifest_path = run_dir / "commit-manifest.json"
        self.assertTrue(manifest_path.is_file(), "atomic commit manifest pointer is required")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(run["revision"], manifest["revision"])
        self.assertTrue(manifest["generation_ref"])
        self.assertTrue(manifest["state_digest"].startswith("sha256:"))
        self.assertTrue(manifest["trace_digest"].startswith("sha256:"))
        self.assertEqual(run["run_id"], manifest["provenance"]["run_id"])
        generation = run_dir / manifest["generation_ref"]
        self.assertTrue(generation.is_dir())
        self.assertTrue((generation / "run-state.json").is_file())

    def test_crash_before_commit_pointer_keeps_previous_generation_readable(self) -> None:
        run = self.run_request(request(idempotency_key="crash-recovery"))
        self.assertIn("revision", run)
        changed = copy.deepcopy(run)
        changed["human_summary"] = "uncommitted generation"
        with self.assertRaises(Exception):
            self.harness.facade.store.save(
                changed,
                expected_revision=run["revision"],
                crash_at="before_commit_manifest_swap",
            )
        loaded = self.harness.facade.store.load(run["run_id"])
        self.assertEqual(run["revision"], loaded["revision"])
        self.assertNotEqual("uncommitted generation", loaded["human_summary"])

    def test_concurrent_findings_do_not_lose_updates_and_use_stable_issue_identity(self) -> None:
        run = self.run_request(request(idempotency_key="concurrent-findings"))
        barrier = threading.Barrier(8)

        def submit(index: int) -> None:
            facade = type(self.harness.facade)(minimal_registry(), minimal_policy(), self.runs_dir)
            barrier.wait()
            for _ in range(16):
                current = facade.store.load(run["run_id"])
                result = facade.run(
                    {
                        "schema_version": "1.0",
                        "resume_run_id": run["run_id"],
                        "expected_revision": current["revision"],
                        "contract_digest": run["contract_digest"],
                        "events": [
                            {
                                "type": "finding",
                                "actor": "reviewer",
                                "source": "reviewer",
                                "issue_id": f"CONCURRENT-{index}",
                                "clause": "finding.append-only",
                                "location": f"artifact:{index}",
                                "kind": "quality",
                                "message": f"finding {index}",
                                "status": "open",
                            }
                        ],
                    }
                )
                if any(item.get("issue_id") == f"CONCURRENT-{index}" for item in result.get("findings", [])):
                    return
                if "stale_revision" not in rejection_codes(result):
                    raise AssertionError(f"concurrent finding rejected: {result.get('rejections')}")
            raise AssertionError("concurrent finding exhausted stale-revision retries")

        with ThreadPoolExecutor(max_workers=8) as executor:
            list(executor.map(submit, range(8)))
        loaded = self.harness.facade.store.load(run["run_id"])
        self.assertTrue(all("issue_id" in finding for finding in loaded["findings"]))
        ids = {finding["issue_id"] for finding in loaded["findings"]}
        self.assertTrue({f"CONCURRENT-{index}" for index in range(8)}.issubset(ids))
        sequences = [finding["sequence"] for finding in loaded["findings"]]
        self.assertEqual(sorted(sequences), list(range(1, len(sequences) + 1)))

    def _tamper_path(self, run: dict[str, object], relative: str) -> Path:
        run_dir = self.runs_dir / str(run["run_id"])
        direct = run_dir / relative
        if direct.is_file():
            return direct
        candidates = list(run_dir.rglob(Path(relative).name))
        self.assertTrue(candidates, f"committed {relative} must exist")
        return max(candidates, key=lambda item: item.stat().st_mtime_ns)

    def test_resume_blocks_artifact_digest_provenance_and_trace_tampering(self) -> None:
        mutations = ("artifact", "provenance", "trace")
        for mutation in mutations:
            with self.subTest(mutation=mutation):
                run = self.run_request(request(idempotency_key=f"tamper-{mutation}"))
                if mutation == "artifact":
                    path = self._tamper_path(run, "artifacts/task-contract.json")
                    document = json.loads(path.read_text(encoding="utf-8"))
                    document["title"] = "tampered"
                else:
                    path = self._tamper_path(run, "run-state.json")
                    document = json.loads(path.read_text(encoding="utf-8"))
                    if mutation == "provenance":
                        document["artifacts"][0]["provenance"]["producer"] = "attacker"
                    else:
                        document["state_trace"][0]["sequence"] = 999
                path.write_text(json.dumps(document), encoding="utf-8")
                result = self.run_request(
                    {
                        "schema_version": "1.0",
                        "resume_run_id": run["run_id"],
                        "contract_digest": run["contract_digest"],
                        "expected_revision": run.get("revision", 0),
                    }
                )
                self.assertEqual("blocked", result["state"])
                self.assertIn("integrity", json.dumps(result["blockers"] + result["rejections"]).lower())

    def test_resume_rejects_contract_digest_mismatch(self) -> None:
        run = self.run_request(request(idempotency_key="resume-contract-mismatch"))
        result = self.run_request(
            {
                "schema_version": "1.0",
                "resume_run_id": run["run_id"],
                "contract_digest": sha256_digest("different contract"),
                "expected_revision": run.get("revision", 0),
            }
        )
        self.assertEqual("blocked", result["state"])
        self.assertIn("contract_mismatch", rejection_codes(result))


class SelectionLegacyCliAndSecretTest(TeamHarnessContractTestCase):
    def test_writer_must_cover_domain_capability_and_every_path_or_record_fallback(self) -> None:
        result = self.run_request(
            request(
                "Backend work in uncovered path",
                domains=["backend"],
                capabilities=["php"],
                paths=["infrastructure/private/config.yml"],
                idempotency_key="no-qualified-writer",
            )
        )
        writers = [member for member in result["team"] if member["role"] == "writer"]
        self.assertFalse(writers)
        self.assertEqual("blocked", result["state"])
        self.assertEqual("sequential_fallback", result["selection"]["fallback"])
        self.assertIn("no_qualified_writer", rejection_codes(result))

    def test_path_and_risk_triggers_contribute_to_specialist_selection(self) -> None:
        registry = minimal_registry()
        registry["agents"].append(
            {
                "id": "risk_path",
                "roles": ["specialist"],
                "domains": ["resilience"],
                "capabilities": ["blast-radius"],
                "path_scopes": ["app/Sensitive/**"],
                "risk_triggers": ["critical"],
                "model_profile": "risk_path_profile",
            }
        )
        result = self.run_request(
            request(
                "Critical backend change",
                domains=["backend"],
                capabilities=["php"],
                paths=["app/Sensitive/A.php"],
                risk="critical",
                idempotency_key="risk-path-selection",
            ),
            registry=registry,
        )
        self.assertIn("risk_path", self.ids(result))
        selected = next(member for member in result["team"] if member["id"] == "risk_path")
        self.assertTrue({"path", "risk"}.issubset(set(selected["selection_reasons"])))

    def test_every_member_appears_once_across_at_most_three_ordered_waves(self) -> None:
        registry = minimal_registry()
        registry["agents"].append(
            {
                "id": "full_writer",
                "roles": ["specialist", "writer"],
                "domains": ["backend", "architecture", "security", "operations"],
                "capabilities": ["php", "adr", "authorization", "migration"],
                "path_scopes": ["app/**"],
                "risk_triggers": ["critical"],
                "model_profile": "full_writer_profile",
            }
        )
        payload = request(
            "Cross-risk change",
            domains=["backend", "architecture", "security", "operations"],
            capabilities=["php", "adr", "authorization", "migration"],
            paths=["app/Sensitive/A.php"],
            risk="critical",
            idempotency_key="waves",
        )
        contract = payload["task_contract"]
        contract.update(
            {
                "team_assignment": {"mode": "fixed"},
                "primary_writer": "full_writer",
                "consulting_specialists": ["architecture", "security", "operations"],
                "reviewer": "reviewer",
                "verifier": "verifier",
                "write_ownership": [
                    {"owner": "full_writer", "paths": list(contract["allowed_paths"])}
                ],
            }
        )
        result = self.run_request(payload, registry=registry)
        waves = result["shared_plan"]["waves"]
        self.assertLessEqual(len(waves), 3)
        flattened = [agent for wave in waves for agent in wave["agents"]]
        self.assertEqual(set(self.ids(result)), set(flattened))
        self.assertEqual(len(flattened), len(set(flattened)))
        implementation = {
            member["id"] for member in result["team"]
            if member["role"] in {"writer", "specialist"}
        }
        self.assertLessEqual(len(implementation), 3)
        self.assertEqual(implementation, set(waves[0]["agents"]))
        by_agent = {agent: wave["wave"] for wave in waves for agent in wave["agents"]}
        self.assertLess(by_agent[self.roles(result)["verifier"]], by_agent[self.roles(result)["reviewer"]])
        self.assertTrue(result["state"] == "blocked" or len(implementation) <= 3)
        if result["state"] == "blocked":
            self.assertIn("wave_capacity", rejection_codes(result))

    def test_legacy_adapter_honors_policy_and_rejects_dual_or_unknown_input(self) -> None:
        legacy = json.loads((FIXTURES / "legacy-single-agent-input.json").read_text(encoding="utf-8"))
        canonical_registry = json.loads(
            (FIXTURES / "canonical-agent-registry.json").read_text(encoding="utf-8")
        )
        self.assertNotIn("legacy_single_agent", canonical_registry)
        accepted = self.run_request(legacy, registry=canonical_registry)
        self.assertTrue(accepted["legacy_converted"])

        dual = copy.deepcopy(legacy)
        dual["task_contract"] = request()["task_contract"]
        result = self.run_request(dual)
        self.assertIn("ambiguous_input_envelope", rejection_codes(result))

        unknown = copy.deepcopy(legacy)
        unknown["idempotency_key"] = "legacy-unknown"
        unknown["legacy_single_agent"]["agent"] = "ghost"
        result = self.run_request(unknown)
        self.assertIn("unknown_agent", rejection_codes(result))
        policy = minimal_policy()
        self.assertTrue(policy["legacy_adapter"]["enabled"])
        self.assertEqual(policy, accepted["execution_policy"])

    def test_cli_returns_nonzero_for_blocked_rejected_unauthorized_not_accepted_and_incomplete(self) -> None:
        cli = load_cli_module()

        class FakeStore:
            @staticmethod
            def load(run_id):
                return {"run_id": run_id, "state": "implementing"}

        class FakeHarness:
            store = FakeStore()

            @staticmethod
            def run(task):
                return {
                    "state": "blocked",
                    "blockers": [],
                    "rejections": [{"code": "rejected"}],
                    "source_sync": {"accepted": False},
                    "team": [],
                    "shared_plan": {},
                }

            @staticmethod
            def authorize_write(run_id, write_request):
                return {"authorized": False, "rejections": [{"code": "unauthorized"}]}

            @staticmethod
            def completion_gate(run_id, expected_revision=None):
                return {"complete": False, "gate": "blocked"}

        cases = {
            "team-select": ["team-select", "input.json"],
            "init-run": ["init-run", "input.json"],
            "resume-run": ["resume-run", "run-1", "input.json"],
            "record": ["record", "finding", "run-1", "input.json"],
            "authorize-write": ["authorize-write", "input.json"],
            "source-sync": ["source-sync", "run-1", "input.json"],
            "completion-gate": ["completion-gate", "run-1"],
        }
        input_document = {
            "task_contract": request()["task_contract"],
            "write_request": {"run_id": "run-1", "agent": "backend", "paths": []},
            "source_sync_request": {},
            "source": "reviewer",
            "issue_id": "CLI-1",
            "clause": "cli.exit",
            "location": "cli",
            "kind": "quality",
            "message": "rejected",
        }
        for label, argv in cases.items():
            with self.subTest(command=label), mock.patch.object(sys, "argv", ["team-harness", *argv]), mock.patch.object(
                cli, "load_harness", return_value=FakeHarness()
            ), mock.patch.object(cli, "read_json", return_value=copy.deepcopy(input_document)):
                output = io.StringIO()
                with redirect_stdout(output):
                    exit_code = cli.main()
                self.assertNotEqual(0, exit_code)
                self.assertIsNotNone(json.loads(output.getvalue()))

    def test_structured_secret_keys_and_common_forbidden_policy_fail_closed_without_echo(self) -> None:
        secrets = {
            "APP_KEY": "base64:app-secret-value",
            "AWS_ACCESS_KEY_ID": "AKIA_TEST_VALUE",
            "AWS_SECRET_ACCESS_KEY": "aws-secret-value",
            "PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----value",
            "token": "token-value",
            "password": "password-value",
        }
        for key, secret in secrets.items():
            with self.subTest(key=key):
                run = self.run_request(
                    request(
                        idempotency_key=f"secret-{key}",
                        events=[{"type": "artifact", "path": "app/A.json", "content": {key: secret}}],
                    )
                )
                rendered = json.dumps(run)
                self.assertIn("redaction_required", rejection_codes(run))
                self.assertNotIn(secret, rendered)

    def test_finding_conflicts_correlate_by_stable_issue_id_clause_and_location(self) -> None:
        run = self.run_request(
            request(
                idempotency_key="finding-identity",
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "ARCH-42", "clause": "architecture.boundary",
                        "location": "app/Service.php:10", "kind": "design", "message": "violation",
                        "position": "reject", "status": "open",
                    },
                    {
                        "type": "finding", "actor": "verifier", "source": "verifier",
                        "issue_id": "ARCH-42", "clause": "architecture.boundary",
                        "location": "app/Service.php:10", "kind": "quality", "message": "acceptable",
                        "position": "approve", "status": "open",
                    },
                ],
            )
        )
        self.assertEqual("needs_human_approval", run["state"])
        self.assertEqual("ARCH-42", run["conflicts"][0]["issue_id"])
        self.assertTrue(all(finding["clause"] and finding["location"] for finding in run["findings"]))


if __name__ == "__main__":
    unittest.main()
