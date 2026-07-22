"""Negative contracts from the sixth architecture and reviewer audit."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Mapping

from test_team_harness_contract import (
    CONFIG_ROOT,
    TeamHarnessContractTestCase,
    minimal_policy,
    minimal_registry,
    parent_lease,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_fifth_regressions import semantic_snapshot
from test_team_harness_hardening_contract import rejection_codes
from test_team_harness_review_regressions import fixed_request
from test_team_harness_stop_contract import StopContractTestCase


def artifact_event(
    run: Mapping[str, Any],
    *,
    authority_grant: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    event: dict[str, Any] = {
        "type": "artifact",
        "actor": next(
            member["id"] for member in run["team"] if member["role"] == "writer"
        ),
        "path": run["task_contract"]["allowed_paths"][0],
        "content": {
            "issue_ids": [],
            "check_ids": [],
            "deliverable_ids": [],
            "patch": "authority-bound artifact",
        },
    }
    if authority_grant is not None:
        event["authority_grant"] = copy.deepcopy(dict(authority_grant))
    return event


class ArtifactAndRoleAuthorityRegressionTest(TeamHarnessContractTestCase):
    def test_artifact_schema_and_runtime_require_the_exact_persisted_write_grant(self) -> None:
        from team_harness import validate_document

        missing_run = self.run_request(request(idempotency_key="artifact-grant-missing"))
        missing_event = artifact_event(missing_run)
        with self.subTest(case="schema_requires_grant"):
            self.assertTrue(validate_document("runtime_event", missing_event))
        with self.subTest(case="missing_grant_is_atomic"):
            before = semantic_snapshot(missing_run)
            result = self.resume_run(missing_run, events=[missing_event])
            self.assertEqual(before, semantic_snapshot(result))
            self.assertRegex(
                json.dumps(result["rejections"]).lower(),
                r"authority.*grant|lease.*required",
            )

        mismatch_run = self.run_request(request(idempotency_key="artifact-grant-mismatch"))
        writer = next(
            member["id"] for member in mismatch_run["team"] if member["role"] == "writer"
        )
        paths = list(mismatch_run["task_contract"]["allowed_paths"])
        mismatch = parent_lease(mismatch_run, writer, paths)
        mismatch["grant_id"] = str(mismatch["grant_id"]) + "-caller-mutated"
        mismatch["grant_digest"] = sha256_digest(
            {key: value for key, value in mismatch.items() if key != "grant_digest"}
        )
        with self.subTest(case="mismatched_grant_is_atomic"):
            before = semantic_snapshot(mismatch_run)
            result = self.resume_run(
                mismatch_run,
                events=[artifact_event(mismatch_run, authority_grant=mismatch)],
            )
            self.assertEqual(before, semantic_snapshot(result))
            self.assertIn("authority_grant_mismatch", rejection_codes(result))

        exact_run = self.run_request(request(idempotency_key="artifact-grant-exact"))
        writer = next(
            member["id"] for member in exact_run["team"] if member["role"] == "writer"
        )
        exact = parent_lease(
            exact_run, writer, list(exact_run["task_contract"]["allowed_paths"])
        )
        exact_event = artifact_event(exact_run, authority_grant=exact)
        with self.subTest(case="schema_accepts_exact_write_grant"):
            self.assertEqual([], validate_document("runtime_event", exact_event))
        with self.subTest(case="exact_grant_mints_receipt"):
            result = self.resume_run(exact_run, events=[exact_event])
            self.assertEqual(
                len(exact_run["implementation_log"]) + 1,
                len(result["implementation_log"]),
            )
            receipt = result["implementation_log"][-1]
            self.assertEqual("artifact_receipt", receipt["kind"])
            self.assertEqual(exact["grant_digest"], receipt["authority_grant_digest"])

    def test_top_level_and_fixed_contract_role_assignments_must_match_exactly(self) -> None:
        exact = fixed_request("fixed-and-top-level-exact")
        exact["role_assignments"] = {
            "writer": "backend", "reviewer": "reviewer", "verifier": "verifier",
        }
        with self.subTest(case="exact"):
            accepted = self.run_request(exact)
            self.assertEqual("implementing", accepted["state"])
            self.assertEqual("backend", accepted["selection"]["writer"])

        registry = minimal_registry()
        by_id = {agent["id"]: agent for agent in registry["agents"]}
        by_id["security"]["roles"].append("reviewer")
        by_id["architecture"]["roles"].append("verifier")
        mismatched = fixed_request("fixed-and-top-level-mismatch")
        mismatched["role_assignments"] = {
            "writer": "backend", "reviewer": "security", "verifier": "architecture",
        }
        with self.subTest(case="mismatch"):
            result = self.run_request(mismatched, registry=registry)
            self.assertEqual("blocked", result["state"])
            self.assertRegex(
                json.dumps(result["rejections"]).lower(),
                r"role.*assignment.*mismatch|fixed.*assignment.*mismatch",
            )
            self.assertFalse(result["team"], "mismatch must not silently choose either source")


class RetryAndQualityAuthorityRegressionTest(TeamHarnessContractTestCase):
    def test_generic_transition_cannot_exit_retrying_without_verified_fix_gate(self) -> None:
        for target in ("implementing", "verifying", "reviewing"):
            with self.subTest(target=target):
                run = self.run_request(request(idempotency_key=f"retry-exit-{target}"))
                failed = self.resume_run(
                    run,
                    events=[
                        report_event(
                            run, "verification", "failed", cause="strict retry gate"
                        )
                    ],
                )
                self.assertEqual("retrying", failed["state"])
                before = semantic_snapshot(failed)
                result = self.resume_run(
                    failed,
                    events=[
                        {
                            "type": "transition", "from": "retrying", "to": target,
                            "actor": "orchestrator",
                        }
                    ],
                )
                self.assertEqual(before, semantic_snapshot(result))
                self.assertRegex(
                    json.dumps(result["rejections"]).lower(),
                    r"retry.*gate|fix.*evidence|reserved.*transition",
                )

    def test_quality_report_can_only_use_a_grant_from_a_prior_committed_generation(self) -> None:
        committed = self.run_request(request(idempotency_key="quality-prior-committed"))
        with self.subTest(case="prior_committed_grant"):
            accepted = self.resume_run(
                committed,
                events=[report_event(committed, "verification", "passed")],
            )
            self.assertEqual("reviewing", accepted["state"])

        run = self.run_request(request(idempotency_key="quality-same-batch-grant"))
        prospective = copy.deepcopy(run)
        prospective["shared_plan"]["revision"] += 1
        prospective["shared_plan"]["steps"].append("same-batch revision")
        prospective["artifact_revision"] += 1
        self.harness.facade._invalidate_evidence(prospective, reason="plan revised")
        prospective_report = report_event(
            prospective, "verification", "passed"
        )
        before = semantic_snapshot(run)
        result = self.resume_run(
            run,
            events=[
                {"type": "plan_revised", "change": "same-batch revision"},
                prospective_report,
            ],
        )
        with self.subTest(case="same_batch_grant"):
            self.assertEqual(before, semantic_snapshot(result))
            self.assertRegex(
                json.dumps(result["rejections"]).lower(),
                r"grant.*(?:commit|durable)|(?:commit|durable).*grant|authority.*generation",
            )


class FindingAndFinalReviewRegressionTest(StopContractTestCase):
    def test_public_finding_event_requires_open_canonical_identity_and_actor(self) -> None:
        canonical = {
            "type": "finding", "actor": "reviewer", "source": "reviewer",
            "issue_id": "FINDING-6", "clause": "finding.canonical",
            "location": "app/Http/Controllers/ExampleController.php",
            "kind": "quality", "message": "canonical finding", "status": "open",
        }
        cases: dict[str, dict[str, Any]] = {
            "actorless": {key: value for key, value in canonical.items() if key != "actor"},
            "resolved": {**canonical, "status": "resolved"},
            "missing_status": {key: value for key, value in canonical.items() if key != "status"},
            "missing_issue_id": {key: value for key, value in canonical.items() if key != "issue_id"},
            "missing_clause": {key: value for key, value in canonical.items() if key != "clause"},
            "missing_location": {key: value for key, value in canonical.items() if key != "location"},
        }
        for label, event in cases.items():
            with self.subTest(case=label):
                run = self.run_request(request(idempotency_key=f"finding-{label}"))
                before = semantic_snapshot(run)
                result = self.resume_run(run, events=[event])
                self.assertEqual(before, semantic_snapshot(result))
                self.assertRegex(
                    json.dumps(result["rejections"]).lower(),
                    r"finding.*(?:identity|actor|status|open|required)|schema.*finding",
                )

    def test_final_review_failure_enters_bounded_retry_and_records_causal_history(self) -> None:
        run = self.run_request(request(idempotency_key="final-review-bounded-retry"))
        staged = self.stage(run)
        final_verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        cause = "final source drift"
        result = self.resume_run(
            final_verified,
            events=[
                report_event(
                    final_verified, "review", "failed", phase="final", cause=cause
                )
            ],
        )
        cause_fingerprint = sha256_digest(cause)
        self.assertIn(result["state"], {"retrying", "needs_human_approval", "blocked"})
        self.assertEqual(1, result["retry_causes"][cause_fingerprint])
        self.assertEqual("final", result["failure_history"][-1]["phase"])
        self.assertEqual("review", result["failure_history"][-1]["report"])
        self.assertIn("FINAL-DRIFT", result["failure_history"][-1]["issue_ids"])
        self.assertTrue(
            any(
                finding["issue_id"] == "FINAL-DRIFT" and finding["status"] == "open"
                for finding in result["findings"]
            )
        )


class OwnershipAndPersistenceRegressionTest(TeamHarnessContractTestCase):
    def test_ownership_revision_cannot_grant_write_authority_to_read_only_specialist(self) -> None:
        run = self.run_request(
            fixed_request(
                "read-only-specialist-ownership",
                consulting=["architecture"],
                extra_contract={
                    "scope": {"include": ["app/A.php", "app/B.php"]},
                    "allowed_paths": ["app/A.php", "app/B.php"],
                    "write_ownership": [
                        {"owner": "backend", "paths": ["app/A.php", "app/B.php"]}
                    ],
                },
            )
        )
        before = semantic_snapshot(run)
        result = self.resume_run(
            run,
            events=[
                {
                    "type": "ownership_revised", "actor": "orchestrator",
                    "write_ownership": [
                        {"owner": "backend", "paths": ["app/A.php"]},
                        {"owner": "architecture", "paths": ["app/B.php"]},
                    ],
                }
            ],
        )
        self.assertEqual(before, semantic_snapshot(result))
        self.assertRegex(
            json.dumps(result["rejections"]).lower(),
            r"primary.*writer|single.*writer|ownership.*writer",
        )
        self.assertEqual({"backend"}, set(result["authority_grants"]["write"]))

    def test_run_state_schema_is_complete_and_load_blocks_missing_canonical_field(self) -> None:
        schema = json.loads(
            (CONFIG_ROOT / "team-harness.schema.json").read_text(encoding="utf-8")
        )
        run = self.run_request(request(idempotency_key="run-state-complete-schema"))
        required = set(schema["$defs"]["runState"]["required"])
        with self.subTest(case="all_persisted_fields_are_required"):
            self.assertEqual(set(run), required)

        run_dir = self.runs_dir / run["run_id"]
        manifest_path = run_dir / "commit-manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        state_path = run_dir / manifest["state_ref"]
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state.pop("execution_policy")
        state_path.write_text(
            json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        manifest["state_digest"] = sha256_digest(state)
        unsigned_manifest = {
            key: value for key, value in manifest.items() if key != "manifest_digest"
        }
        manifest["manifest_digest"] = sha256_digest(unsigned_manifest)
        manifest_path.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        with self.subTest(case="load_validates_run_state_schema"):
            loaded = self.harness.facade.store.load(run["run_id"])
            self.assertEqual("blocked", loaded["state"])
            self.assertEqual("failed", loaded["integrity_status"])
            self.assertRegex(
                json.dumps(loaded.get("integrity_errors", [])).lower(),
                r"schema|execution_policy|required",
            )

    def test_unknown_write_authorization_is_read_only_structured_not_found(self) -> None:
        facade_type = type(self.harness.facade)
        read_only_root = Path(self.temporary_directory.name) / "authorize-read-only-runs"
        read_only_root.mkdir()
        facade = facade_type(minimal_registry(), minimal_policy(), read_only_root)
        unknown_run_id = "run-unknown-write-authorization"
        request_document = {
            "schema_version": "1.0",
            "run_id": unknown_run_id,
            "agent": "backend",
            "paths": ["app/Http/Controllers/ExampleController.php"],
            "lease": {},
            "expected_revision": 0,
        }
        read_only_root.chmod(0o555)
        try:
            try:
                result = facade.authorize_write(unknown_run_id, request_document)
            except Exception as error:
                self.fail(
                    "unknown write authorization must not lock or write before not-found: "
                    f"{error}"
                )
            self.assertFalse(result["authorized"])
            self.assertIn("run_not_found", rejection_codes(result))
            self.assertEqual([], list(read_only_root.iterdir()))
        finally:
            read_only_root.chmod(0o755)


if __name__ == "__main__":
    import unittest

    unittest.main()
