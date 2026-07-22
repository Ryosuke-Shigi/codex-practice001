"""Negative contracts from the fourth architecture and reviewer audit."""

from __future__ import annotations

import copy
import io
import json
import os
import sys
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any, Mapping
from unittest import mock

from test_team_harness_contract import (
    CONFIG_ROOT,
    HarnessAdapter,
    TeamHarnessContractTestCase,
    issued_quality_grant,
    issued_write_grant,
    minimal_policy,
    minimal_registry,
    parent_lease,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_hardening_contract import load_cli_module, rejection_codes
from test_team_harness_stop_contract import StopContractTestCase


def fixed_request(
    key: str,
    *,
    consulting: list[str] | None = None,
    extra_contract: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    payload = request(idempotency_key=key)
    contract = payload["task_contract"]
    contract.update(
        {
            "team_assignment": {"mode": "fixed"},
            "primary_writer": "backend",
            "consulting_specialists": list(consulting or []),
            "reviewer": "reviewer",
            "verifier": "verifier",
            "write_ownership": [
                {"owner": "backend", "paths": list(contract["allowed_paths"])}
            ],
        }
    )
    if extra_contract:
        contract.update(copy.deepcopy(dict(extra_contract)))
    return payload


def resume_envelope(run: Mapping[str, Any], **payload: Any) -> dict[str, Any]:
    return {
        "schema_version": "1.0",
        "resume_run_id": run["run_id"],
        "expected_revision": run["revision"],
        "contract_digest": run["contract_digest"],
        **payload,
    }


class SingleWriterAndWaveRegressionTest(TeamHarnessContractTestCase):
    def test_single_writer_blocks_aggregate_coverage_without_one_full_coverage_writer(self) -> None:
        run = self.run_request(
            request(
                "Cross-stack change without a full-coverage writer",
                idempotency_key="single-writer-aggregate",
                domains=["backend", "frontend"],
                capabilities=["php", "react"],
                paths=["app/A.php", "resources/js/A.tsx"],
                risk="high",
            )
        )
        self.assertTrue(run["execution_policy"]["single_writer"])
        self.assertEqual("blocked", run["state"])
        self.assertIsNone(run["selection"]["writer"])
        self.assertFalse(
            [grant for grant in run["authority_grants"]["write"].values() if grant.get("kind") == "write"]
        )

    def test_only_primary_writer_can_authorize_and_read_only_specialist_is_denied(self) -> None:
        run = self.run_request(fixed_request("primary-writer-only", consulting=["architecture"]))
        writable = {
            agent for agent, grant in run["authority_grants"]["write"].items()
            if grant.get("kind") == "write"
        }
        self.assertEqual({"backend"}, writable)
        decision = self.harness.facade.authorize_write(
            run["run_id"],
            {
                "schema_version": "1.0",
                "run_id": run["run_id"],
                "agent": "architecture",
                "paths": list(run["task_contract"]["allowed_paths"]),
                "lease": {},
                "expected_revision": run["revision"],
            },
        )
        self.assertFalse(decision["authorized"])
        self.assertIn("role_write_forbidden", rejection_codes(decision))

    def test_waves_are_strictly_implementation_then_verification_then_review(self) -> None:
        normal = self.run_request(fixed_request("strict-waves", consulting=["architecture"]))
        waves = normal["shared_plan"]["waves"]
        by_role = {member["role"]: member["id"] for member in normal["team"]}
        implementation = {
            member["id"] for member in normal["team"] if member["role"] in {"writer", "specialist"}
        }
        self.assertEqual(3, len(waves))
        self.assertEqual(implementation, set(waves[0]["agents"]))
        self.assertEqual([by_role["verifier"]], waves[1]["agents"])
        self.assertEqual([by_role["reviewer"]], waves[2]["agents"])

        overflow = self.run_request(
            fixed_request(
                "strict-waves-overflow",
                consulting=["architecture", "security", "operations"],
            )
        )
        overflow_waves = overflow["shared_plan"]["waves"]
        implementation_ids = {
            member["id"] for member in overflow["team"] if member["role"] in {"writer", "specialist"}
        }
        self.assertLessEqual(len(overflow_waves), 3)
        self.assertEqual("blocked", overflow["state"])
        self.assertTrue(implementation_ids.issubset(set(overflow_waves[0]["agents"])))
        self.assertTrue(
            all(not implementation_ids.intersection(wave["agents"]) for wave in overflow_waves[1:])
        )


class StrictRetryRegressionTest(TeamHarnessContractTestCase):
    def failed_verification(self, key: str, *, finding: Mapping[str, Any] | None = None) -> Any:
        payload = request(idempotency_key=key, events=[dict(finding)] if finding else [])
        run = self.run_request(payload)
        return self.resume_run(
            run,
            events=[report_event(run, "verification", "failed", cause="retry cause")],
        )

    def test_legacy_changed_hashes_cannot_bypass_strict_retry_receipt(self) -> None:
        failed = self.failed_verification("legacy-retry-bypass")
        before = copy.deepcopy(failed)
        legacy = {
            "type": "fix_applied",
            "actor": self.roles(failed)["writer"],
            "cause": "retry cause",
            "attempt": failed["attempt_count"] + 1,
            "plan_revision": failed["shared_plan"]["revision"],
            "changed_input_fingerprint": sha256_digest("caller-changed-input"),
            "changed_diff_digest": sha256_digest("caller-changed-diff"),
            "environment_fingerprint": failed["environment_fingerprint"],
        }
        result = self.resume_run(failed, events=[legacy])
        self.assertIn("fix_evidence_required", rejection_codes(result))
        self.assertEqual(before["attempt_count"], result["attempt_count"])
        self.assertEqual(before["revision"], result["revision"])
        self.assertEqual(before["state"], result["state"])

    def test_invalid_retry_receipt_is_atomic_for_findings_revision_and_attempt(self) -> None:
        finding = {
            "type": "finding", "actor": "verifier", "source": "verifier",
            "issue_id": "F-ATOMIC", "clause": "retry.atomic", "location": "app/A.php",
            "kind": "quality", "message": "retry cause", "status": "open",
        }
        failed = self.failed_verification("atomic-invalid-receipt", finding=finding)
        before_findings = copy.deepcopy(failed["findings"])
        invalid = {
            "type": "fix_applied",
            "actor": self.roles(failed)["writer"],
            "cause": "retry cause",
            "attempt": failed["attempt_count"] + 1,
            "plan_revision": failed["shared_plan"]["revision"],
            "issue_ids": ["F-ATOMIC"],
            "failed_report_digest": failed["initial_verification_report"]["report_digest"],
            "cause_fingerprint": sha256_digest("retry cause"),
            "changed_input_fingerprint": failed["input_fingerprint"],
            "changed_diff_digest": sha256_digest("unpersisted diff"),
            "environment_fingerprint": failed["environment_fingerprint"],
            "fix_artifact": {
                "kind": "artifact_receipt", "digest": sha256_digest("unpersisted diff"),
                "provenance": {"run_id": failed["run_id"], "producer": self.roles(failed)["writer"]},
            },
        }
        result = self.resume_run(failed, events=[invalid])
        self.assertIn("fix_artifact_unverified", rejection_codes(result))
        self.assertEqual(failed["revision"], result["revision"])
        self.assertEqual(failed["attempt_count"], result["attempt_count"])
        self.assertEqual(before_findings, result["findings"])
        persisted = self.harness.facade.store.load(failed["run_id"])
        self.assertEqual(before_findings, persisted["findings"])
        self.assertEqual(failed["revision"], persisted["revision"])

    def test_issue_ids_must_be_causally_bound_to_the_failed_report(self) -> None:
        run = self.run_request(
            request(
                idempotency_key="retry-issue-causality",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/layering.diff",
                ],
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "F-UNRELATED", "clause": "other.clause", "location": "docs/other.md",
                        "kind": "quality", "message": "unrelated issue", "status": "open",
                    }
                ],
            )
        )
        verified = self.resume_run(run, events=[report_event(run, "verification", "passed")])
        failed = self.resume_run(
            verified,
            events=[report_event(verified, "review", "failed", cause="layering broken")],
        )
        receipt_run = self.resume_run(
            failed,
            events=[
                {
                    "type": "artifact", "actor": self.roles(failed)["writer"],
                    "authority_grant": issued_write_grant(failed),
                    "path": "app/layering.diff",
                    "content": {"issue_ids": ["F-UNRELATED"], "patch": "real but unrelated"},
                }
            ],
        )
        receipt = receipt_run["implementation_log"][-1]
        before = copy.deepcopy(receipt_run)
        result = self.resume_run(
            receipt_run,
            events=[
                {
                    "type": "fix_applied", "actor": self.roles(receipt_run)["writer"],
                    "cause": "layering broken", "attempt": receipt_run["attempt_count"] + 1,
                    "plan_revision": receipt_run["shared_plan"]["revision"],
                    "issue_ids": ["F-UNRELATED"],
                    "failed_report_digest": failed["initial_review_report"]["report_digest"],
                    "cause_fingerprint": sha256_digest("layering broken"),
                    "changed_input_fingerprint": receipt_run["input_fingerprint"],
                    "changed_diff_digest": receipt["digest"],
                    "environment_fingerprint": receipt_run["environment_fingerprint"],
                    "fix_artifact": receipt,
                }
            ],
        )
        self.assertIn("fix_issue_causality", rejection_codes(result))
        self.assertEqual(before["revision"], result["revision"])
        self.assertEqual(before["attempt_count"], result["attempt_count"])
        self.assertEqual(before["findings"], result["findings"])


class CanonicalRuntimeSchemaRegressionTest(StopContractTestCase):
    def test_every_runtime_entry_has_a_positive_canonical_schema_definition(self) -> None:
        from team_harness import validate_document

        run = self.run_request(request(idempotency_key="canonical-runtime-entry-kinds"))
        paths = list(run["task_contract"]["allowed_paths"])
        documents = {
            "canonical_input_envelope": request(idempotency_key="canonical-entry-new"),
            "resume_input_envelope": resume_envelope(run, events=[]),
            "write_authorization_request": {
                "schema_version": "1.0", "run_id": run["run_id"], "agent": "backend",
                "paths": paths, "lease": parent_lease(run, "backend", paths),
                "expected_revision": run["revision"],
            },
            "source_sync_request": self.source_request(run),
            "runtime_event": report_event(run, "verification", "passed"),
        }
        for kind, document in documents.items():
            with self.subTest(kind=kind):
                self.assertEqual([], validate_document(kind, document))

    def test_schema_version_is_required_at_every_runtime_entry(self) -> None:
        new_payload = request(idempotency_key="version-required-new")
        new_payload.pop("schema_version")
        new_result = self.run_request(new_payload)
        self.assertEqual("blocked", new_result["state"])
        self.assertIn("schema_version", rejection_codes(new_result))

        run = self.run_request(request(idempotency_key="version-required-entries"))
        resume = self.harness.facade.run(
            {
                "resume_run_id": run["run_id"], "expected_revision": run["revision"],
                "contract_digest": run["contract_digest"], "events": [],
            }
        )
        self.assertIn("schema_version", rejection_codes(resume))

        write = {
            "run_id": run["run_id"], "agent": "backend",
            "paths": list(run["task_contract"]["allowed_paths"]),
            "lease": parent_lease(run, "backend", list(run["task_contract"]["allowed_paths"])),
            "expected_revision": run["revision"],
        }
        decision = self.harness.facade.authorize_write(run["run_id"], write)
        self.assertFalse(decision["authorized"])
        self.assertIn("schema_version", rejection_codes(decision))

        approved = self.initially_approve(run)
        source = self.source_request(approved)
        source.pop("schema_version")
        staged = self.resume_run(approved, source_sync_request=source)
        self.assertFalse(staged["source_sync"]["accepted"])
        self.assertIn("schema_version", rejection_codes(staged))

    def test_builder_and_run_reject_nested_unknown_wrong_item_type_and_duplicates(self) -> None:
        from team_harness import validate_document
        from team_harness.contracts import build_task_contract

        cases: dict[str, Any] = {
            "nested_scope_unknown": lambda contract: contract["scope"].update({"unexpected": True}),
            "duplicate_required_check": lambda contract: contract.update({"required_checks": ["unit", "unit"]}),
            "wrong_non_goal_item_type": lambda contract: contract.update({"non_goals": [7]}),
            "nested_ownership_unknown": lambda contract: contract["write_ownership"][0].update({"extra": "x"}),
            "nested_assignment_unknown": lambda contract: contract["team_assignment"].update({"extra": "x"}),
        }
        for index, (label, mutate) in enumerate(cases.items()):
            with self.subTest(case=label):
                payload = request(idempotency_key=f"closed-nested-{index}")
                mutate(payload["task_contract"])
                self.assertTrue(validate_document("canonical_input_envelope", payload))
                _, blockers = build_task_contract(payload)
                self.assertTrue(blockers, f"builder accepted {label}")
                result = self.run_request(payload)
                self.assertEqual("blocked", result["state"])

    def test_registry_schema_requires_every_canonical_root_and_agent_field(self) -> None:
        from team_harness import TeamHarness, validate_document

        registry_path = CONFIG_ROOT / "agent-capability-registry.json"
        canonical = json.loads(registry_path.read_text(encoding="utf-8"))
        root_fields = ("schema_version", "registry_kind", "agents")
        agent_fields = (
            "id", "roles", "domains", "capabilities", "path_scopes", "risk_triggers", "model_profile",
        )
        for field in root_fields:
            with self.subTest(scope="root", field=field):
                candidate = copy.deepcopy(canonical)
                candidate.pop(field)
                self.assertTrue(validate_document("agent_registry", candidate))
                with self.assertRaises(ValueError):
                    TeamHarness(candidate, minimal_policy(), self.runs_dir / f"registry-root-{field}")
        for field in agent_fields:
            with self.subTest(scope="agent", field=field):
                candidate = copy.deepcopy(canonical)
                candidate["agents"][0].pop(field)
                self.assertTrue(validate_document("agent_registry", candidate))
                with self.assertRaises(ValueError):
                    TeamHarness(candidate, minimal_policy(), self.runs_dir / f"registry-agent-{field}")


class TaskEvidenceGateRegressionTest(StopContractTestCase):
    def test_required_check_name_cannot_self_attest_without_a_persisted_check_receipt(self) -> None:
        payload = request(idempotency_key="required-check-receipt")
        payload["task_contract"]["required_checks"] = ["unit", "contract", "signed-integration-receipt"]
        run = self.run_request(payload)
        verified = self.resume_run(run, events=[report_event(run, "verification", "passed")])
        reviewed = self.resume_run(verified, events=[report_event(verified, "review", "passed")])
        self.assertNotEqual("implementation_approved", reviewed["state"])
        self.assertFalse(reviewed["implementation_approval"]["approved"])
        self.assertRegex(json.dumps(reviewed).lower(), r"check.*receipt|deliverable.*missing")

    def test_custom_deliverable_and_completion_condition_need_real_artifacts(self) -> None:
        payload = request(idempotency_key="deliverable-artifact-gate")
        payload["task_contract"]["required_deliverables"].append("audit-bundle")
        payload["task_contract"]["completion_conditions"] = ["audit-bundle artifact exists"]
        payload["task_contract"]["information_source_sync"] = {
            "required": True, "manual_activation": True,
        }
        run = self.run_request(payload)
        staged = self.stage(run)
        final_verified = self.resume_run(
            staged, events=[report_event(staged, "verification", "passed", phase="final")]
        )
        final_reviewed = self.resume_run(
            final_verified, events=[report_event(final_verified, "review", "passed", phase="final")]
        )
        completion = self.harness.facade.completion_gate(
            final_reviewed["run_id"], expected_revision=final_reviewed["revision"]
        )
        self.assertFalse(completion["complete"])
        self.assertRegex(json.dumps(completion).lower(), r"audit-bundle|deliverable|completion condition")


class PolicyIsolationRegressionTest(TeamHarnessContractTestCase):
    def test_resuming_old_run_does_not_leak_its_policy_into_fresh_run(self) -> None:
        facade_type = type(self.harness.facade)
        canonical_policy = minimal_policy()
        old = facade_type(minimal_registry(), canonical_policy, self.runs_dir)
        old_run = old.run(request(idempotency_key="old-policy-run"))
        drifted = copy.deepcopy(old_run)
        drifted["execution_policy"]["policy_version"] = "drifted-policy-version"
        drifted["execution_policy"]["policy_digest"] = sha256_digest(
            {
                key: value
                for key, value in drifted["execution_policy"].items()
                if key != "policy_digest"
            }
        )
        old.store.save(drifted, expected_revision=old_run["revision"])

        current = facade_type(minimal_registry(), canonical_policy, self.runs_dir)
        loaded = current.store.load(old_run["run_id"])
        self.assertEqual("blocked", loaded["state"])
        self.assertEqual("failed", loaded["integrity_status"])
        self.assertRegex(
            json.dumps(loaded["integrity_errors"]).lower(), r"policy.*(?:pin|version|digest)"
        )
        fresh = current.run(request(idempotency_key="fresh-policy-run"))
        self.assertEqual(canonical_policy, fresh["execution_policy"])
        self.assertEqual(old_run["environment_fingerprint"], fresh["environment_fingerprint"])

    def test_policy_rejects_unknown_state_references(self) -> None:
        facade_type = type(self.harness.facade)
        for label, mutate in (
            (
                "write_authorization",
                lambda policy: policy["write_authorization"].update({"allowed_states": ["implementing", "ghost"]}),
            ),
            (
                "source_minimum",
                lambda policy: policy["source_sync"].update({"minimum_state": "ghost"}),
            ),
        ):
            with self.subTest(reference=label):
                policy = minimal_policy()
                mutate(policy)
                with self.assertRaises(ValueError):
                    facade_type(minimal_registry(), policy, self.runs_dir / label)

    def test_reserved_states_are_declared_by_policy_and_required_by_schema(self) -> None:
        policy = json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8"))
        schema = json.loads((CONFIG_ROOT / "team-harness.schema.json").read_text(encoding="utf-8"))
        expected = {
            "implementation_approved", "source_sync", "final_verification", "final_review", "completed",
            "blocked", "failed", "needs_human_approval", "cancelled",
        }
        self.assertIn("reserved_states", policy)
        self.assertEqual(expected, set(policy["reserved_states"]))
        execution = schema["$defs"]["executionPolicy"]
        self.assertIn("reserved_states", execution["required"])
        self.assertIn("reserved_states", execution["properties"])


class StagingIntegrityAndConnectionRegressionTest(StopContractTestCase):
    def _final_reviewed(self, key: str) -> Any:
        run = self.run_request(request(idempotency_key=key))
        staged = self.stage(run)
        verified = self.resume_run(
            staged, events=[report_event(staged, "verification", "passed", phase="final")]
        )
        return self.resume_run(
            verified, events=[report_event(verified, "review", "passed", phase="final")]
        )

    def test_load_validates_staging_ref_containment_existence_and_content_digest(self) -> None:
        for mutation in ("missing", "content_digest", "escaping_ref"):
            with self.subTest(mutation=mutation):
                run = self.run_request(request(idempotency_key=f"staging-load-{mutation}"))
                staged = self.stage(run)
                root = self.runs_dir / staged["run_id"]
                staging_path = root / staged["source_sync"]["staging_artifact"]["ref"]
                if mutation == "missing":
                    staging_path.unlink()
                elif mutation == "content_digest":
                    document = json.loads(staging_path.read_text(encoding="utf-8"))
                    document["payload"] = {"tampered": True}
                    staging_path.write_text(json.dumps(document), encoding="utf-8")
                else:
                    mutable = self.harness.facade.store.load(staged["run_id"])
                    mutable_sync = mutable["source_sync"]
                    mutable_staging = mutable_sync["staging_artifact"]
                    mutable_staging["ref"] = "../outside-source-update.json"
                    mutable_staging["digest"] = sha256_digest(
                        {key: value for key, value in mutable_staging.items() if key != "digest"}
                    )
                    mutable_sync["manifest_digest"] = sha256_digest(
                        {key: value for key, value in mutable_sync.items() if key != "manifest_digest"}
                    )
                    self.harness.facade.store.save(mutable, expected_revision=mutable["revision"])
                loaded = self.harness.facade.store.load(staged["run_id"])
                self.assertEqual("failed", loaded["integrity_status"])
                self.assertEqual("blocked", loaded["state"])
                self.assertRegex(json.dumps(loaded).lower(), r"staging|source.*integrity|contain")

    def test_completion_revalidates_staging_file_after_final_reports(self) -> None:
        reviewed = self._final_reviewed("completion-staging-recheck")
        staging_path = (
            self.runs_dir / reviewed["run_id"] / reviewed["source_sync"]["staging_artifact"]["ref"]
        )
        staging_path.unlink()
        completion = self.harness.facade.completion_gate(
            reviewed["run_id"], expected_revision=reviewed["revision"]
        )
        self.assertFalse(completion["complete"])
        self.assertRegex(json.dumps(completion).lower(), r"staging|integrity|missing")

    def test_shadow_mode_never_trusts_caller_external_connection_hashes(self) -> None:
        run = self.run_request(request(idempotency_key="shadow-external-receipt"))
        staged = self.stage(
            run,
            external_connected=True,
            external_connection_evidence=sha256_digest("caller-forged-connection"),
        )
        self.assertEqual("shadow", staged["execution_policy"]["mode"])
        self.assertFalse(staged["source_sync"]["external_connection_verified"])
        self.assertEqual("unverified", staged["source_sync"]["connection_status"])
        self.assertEqual("prepared_for_human_application", staged["source_sync"]["status"])


class DurabilityMetricsAndCliRegressionTest(TeamHarnessContractTestCase):
    def test_generation_directory_is_fsynced_before_commit_pointer_swap(self) -> None:
        from team_harness.storage import RunStore

        order: list[tuple[str, str]] = []
        real_replace = os.replace

        def replace(source: Any, target: Any) -> None:
            order.append(("replace", str(target)))
            real_replace(source, target)

        def fsync_directory(path: Any) -> None:
            order.append(("fsync", str(path)))

        with mock.patch("team_harness.storage.os.replace", side_effect=replace), mock.patch.object(
            RunStore, "_fsync_directory", side_effect=fsync_directory
        ):
            self.run_request(request(idempotency_key="fsync-order"))
        replace_index = next(index for index, item in enumerate(order) if item[0] == "replace")
        generation_indexes = [
            index for index, item in enumerate(order)
            if item[0] == "fsync" and "/generations/generation-" in item[1]
        ]
        self.assertTrue(generation_indexes)
        self.assertLess(max(generation_indexes), replace_index)

    def test_pre_swap_generation_fsync_failure_keeps_previous_pointer(self) -> None:
        from team_harness.storage import RunStore

        run = self.run_request(request(idempotency_key="fsync-fault"))
        pointer = self.runs_dir / run["run_id"] / "commit-manifest.json"
        before = pointer.read_bytes()

        real_fsync_directory = RunStore._fsync_directory

        def fail_generation(path: Path) -> None:
            if "/generations/generation-" in str(path):
                raise OSError("simulated generation directory fsync failure")
            real_fsync_directory(path)

        with mock.patch.object(RunStore, "_fsync_directory", side_effect=fail_generation):
            with self.assertRaises(OSError):
                self.harness.facade.run(
                    resume_envelope(run, events=[{"type": "plan_revised", "change": "durability fault"}])
                )
        self.assertEqual(before, pointer.read_bytes())

    def test_metrics_preserve_selection_reasons_and_separate_quality_failures(self) -> None:
        selected = self.run_request(request(idempotency_key="metrics-selection-reasons", risk="high"))
        expected_reasons = {
            member["id"]: member["selection_reasons"] for member in selected["team"]
        }
        self.assertEqual(expected_reasons, selected["metrics"]["selection_reasons"])

        verification_run = self.run_request(request(idempotency_key="metrics-verification-failure"))
        verification_failed = self.resume_run(
            verification_run,
            events=[report_event(verification_run, "verification", "failed", cause="unit failed")],
        )
        self.assertEqual(1, verification_failed["metrics"]["verification_failures"])
        self.assertEqual(0, verification_failed["metrics"]["review_failures"])

        review_run = self.run_request(request(idempotency_key="metrics-review-failure"))
        verified = self.resume_run(
            review_run, events=[report_event(review_run, "verification", "passed")]
        )
        review_failed = self.resume_run(
            verified, events=[report_event(verified, "review", "failed", cause="layering failed")]
        )
        self.assertEqual(0, review_failed["metrics"]["verification_failures"])
        self.assertEqual(1, review_failed["metrics"]["review_failures"])

    def test_unknown_run_on_read_only_root_is_structured_cli_failure(self) -> None:
        cli = load_cli_module()
        read_only_root = Path(self.temporary_directory.name) / "read-only-runs"
        read_only_root.mkdir()
        facade = type(self.harness.facade)(minimal_registry(), minimal_policy(), read_only_root)
        read_only_root.chmod(0o555)
        output = io.StringIO()
        errors = io.StringIO()
        try:
            with mock.patch.object(cli, "load_harness", return_value=facade), mock.patch.object(
                sys,
                "argv",
                ["team-harness", "completion-gate", "run-unknown-read-only", "--expected-revision", "0"],
            ), redirect_stdout(output), redirect_stderr(errors):
                try:
                    code = cli.main()
                except Exception as error:
                    self.fail(f"CLI must convert read-only unknown-run failure to structured output: {error}")
        finally:
            read_only_root.chmod(0o755)
        self.assertNotEqual(0, code)
        document = json.loads(output.getvalue())
        self.assertFalse(document.get("complete", False))
        self.assertNotIn("traceback", errors.getvalue().lower())


if __name__ == "__main__":
    unittest.main()
