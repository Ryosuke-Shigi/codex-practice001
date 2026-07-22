"""Negative contracts from the seventh architecture and reviewer audit."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Callable, Mapping

from test_team_harness_contract import (
    CONFIG_ROOT,
    TeamHarnessContractTestCase,
    minimal_policy,
    minimal_registry,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_fifth_regressions import semantic_snapshot
from test_team_harness_hardening_contract import rejection_codes
from test_team_harness_stop_contract import StopContractTestCase


REQUIRED_TERMINAL_STATES = {"completed", "failed", "blocked", "cancelled"}
EXACT_WRITE_STATES = {"implementing", "retrying"}


def resume_with(
    facade: Any, run: Mapping[str, Any], *, events: list[Mapping[str, Any]]
) -> dict[str, Any]:
    return facade.run(
        {
            "schema_version": "1.0",
            "resume_run_id": run["run_id"],
            "expected_revision": run["revision"],
            "contract_digest": run["contract_digest"],
            "events": [copy.deepcopy(dict(event)) for event in events],
        }
    )


def rewrite_committed_state(
    runs_dir: Path,
    run: Mapping[str, Any],
    mutate: Callable[[dict[str, Any]], None],
) -> None:
    run_dir = runs_dir / str(run["run_id"])
    manifest_path = run_dir / "commit-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    state_path = run_dir / manifest["state_ref"]
    state = json.loads(state_path.read_text(encoding="utf-8"))
    mutate(state)
    state_path.write_text(
        json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    manifest["state_digest"] = sha256_digest(state)
    manifest["trace_digest"] = sha256_digest(state.get("state_trace", []))
    manifest["manifest_digest"] = sha256_digest(
        {key: value for key, value in manifest.items() if key != "manifest_digest"}
    )
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


class PolicyAndFailureGateRegressionTest(StopContractTestCase):
    def test_execution_policy_enforces_canonical_state_invariants_and_completed_is_terminal(self) -> None:
        policy = minimal_policy()
        with self.subTest(invariant="write_states"):
            self.assertEqual(
                EXACT_WRITE_STATES,
                set(policy["write_authorization"]["allowed_states"]),
            )
        with self.subTest(invariant="terminal_states"):
            self.assertTrue(
                REQUIRED_TERMINAL_STATES.issubset(set(policy["terminal_states"]))
            )
        with self.subTest(invariant="referenced_transition"):
            limit_target = policy["evidence_gates"]["final_review_retry_limit_state"]
            self.assertIn(limit_target, policy["allowed_transitions"]["final_review"])

        facade_type = type(self.harness.facade)
        mutations: tuple[
            tuple[str, Callable[[dict[str, Any]], None]], ...
        ] = (
            (
                "known_write_state_expansion",
                lambda candidate: candidate["write_authorization"]["allowed_states"].append(
                    "reviewing"
                ),
            ),
            (
                "missing_referenced_transition",
                lambda candidate: candidate["allowed_transitions"]["final_review"].remove(
                    candidate["evidence_gates"]["final_review_retry_limit_state"]
                ),
            ),
            (
                "unreachable_retry_limit_target",
                lambda candidate: candidate["evidence_gates"].update(
                    {"final_review_retry_limit_state": "failed"}
                ),
            ),
        )
        for label, mutate in mutations:
            with self.subTest(invariant=label):
                candidate = minimal_policy()
                mutate(candidate)
                with self.assertRaises(ValueError):
                    facade_type(
                        minimal_registry(), candidate, self.runs_dir / f"policy-{label}"
                    )

        run = self.run_request(request(idempotency_key="completed-terminal-invariant"))
        staged = self.stage(run)
        final_verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        final_reviewed = self.resume_run(
            final_verified,
            events=[report_event(final_verified, "review", "passed", phase="final")],
        )
        self.assertTrue(
            self.harness.facade.completion_gate(
                final_reviewed["run_id"], expected_revision=final_reviewed["revision"]
            )["complete"]
        )
        completed = self.harness.facade.store.load(final_reviewed["run_id"])
        before = semantic_snapshot(completed)
        late = self.resume_run(
            completed,
            events=[
                {
                    "type": "finding", "actor": "reviewer", "source": "reviewer",
                    "issue_id": "LATE-POLICY-7", "clause": "terminal.completed",
                    "location": "run", "kind": "quality", "message": "too late",
                    "status": "open",
                }
            ],
        )
        with self.subTest(invariant="completed_immutable"):
            self.assertEqual(before, semantic_snapshot(late))
            self.assertIn("terminal_immutable", rejection_codes(late))

    def test_initial_review_retry_limit_commits_failure_and_cannot_be_approved_after_limit(self) -> None:
        policy = minimal_policy()
        retry_limit = policy["same_cause_retry_limit"]
        run = self.run_request(
            request(
                idempotency_key="initial-review-retry-limit",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    *[
                        f"app/initial-review-limit-{index}.diff"
                        for index in range(retry_limit)
                    ],
                ],
            )
        )
        cause = "same initial review failure"
        current = run
        limited = run
        for index in range(retry_limit + 1):
            verified = self.resume_run(
                current, events=[report_event(current, "verification", "passed")]
            )
            limited = self.resume_run(
                verified,
                events=[report_event(verified, "review", "failed", cause=cause)],
            )
            if index < retry_limit:
                self.assertEqual("retrying", limited["state"])
                current = self.apply_persisted_fix(
                    limited,
                    cause=cause,
                    path=f"app/initial-review-limit-{index}.diff",
                )
        cause_key = sha256_digest(cause)
        with self.subTest(assertion="failure_is_committed"):
            self.assertIn(limited["state"], {"failed", "needs_human_approval"})
            self.assertEqual(retry_limit + 1, limited["retry_causes"].get(cause_key))
            self.assertEqual("failed", limited["initial_review_report"]["status"])
            self.assertTrue(limited["failure_history"])
            if limited["failure_history"]:
                self.assertEqual("review", limited["failure_history"][-1]["report"])
            self.assertIn("retry_limit", rejection_codes(limited))
            persisted = self.harness.facade.store.load(limited["run_id"])
            self.assertEqual(limited["state"], persisted["state"])
            self.assertEqual(retry_limit + 1, persisted["retry_causes"].get(cause_key))
            self.assertIn("retry_limit", rejection_codes(persisted))

        pass_after_limit = self.resume_run(
            limited, events=[report_event(limited, "review", "passed")]
        )
        with self.subTest(assertion="pass_cannot_approve_after_limit"):
            self.assertEqual(limited["state"], pass_after_limit["state"])
            self.assertFalse(pass_after_limit["implementation_approval"]["approved"])
            self.assertIn("terminal_immutable", rejection_codes(pass_after_limit))

    def test_final_verification_blocked_report_enters_dedicated_stop_state(self) -> None:
        run = self.run_request(request(idempotency_key="final-verification-blocked"))
        staged = self.stage(run)
        blocked = self.resume_run(
            staged,
            events=[
                report_event(
                    staged,
                    "verification",
                    "blocked",
                    phase="final",
                    cause="environment unavailable",
                )
            ],
        )
        with self.subTest(assertion="dedicated_stop_state"):
            self.assertIn(blocked["state"], {"blocked", "needs_human_approval"})
            self.assertEqual("blocked", blocked["final_verification_report"]["status"])
            self.assertNotEqual("final_verification", blocked["state"])
            persisted = self.harness.facade.store.load(blocked["run_id"])
            self.assertEqual(blocked["state"], persisted["state"])

        interrupted_again = self.resume_run(blocked, events=[{"type": "interrupt"}])
        with self.subTest(assertion="stop_gate_is_consistent"):
            self.assertEqual(blocked["state"], interrupted_again["state"])
            self.assertRegex(
                json.dumps(interrupted_again["rejections"]).lower(),
                r"terminal|interrupt|blocked",
            )

    def test_public_review_failed_is_rejected_or_adapted_to_canonical_quality_evidence(self) -> None:
        from team_harness import validate_document

        payload = request(
            idempotency_key="legacy-review-failed-public",
            paths=[
                "app/Http/Controllers/ExampleController.php",
                "app/legacy-review.diff",
            ],
        )
        run = self.run_request(payload)
        legacy_event = {
            "type": "review_failed", "cause": "legacy review failure", "category": "design",
        }
        schema_errors = validate_document("runtime_event", legacy_event)
        before = semantic_snapshot(run)
        result = self.resume_run(run, events=[legacy_event])
        if schema_errors:
            with self.subTest(mode="removed_from_public_schema"):
                self.assertEqual(before, semantic_snapshot(result))
                self.assertRegex(
                    json.dumps(result["rejections"]).lower(),
                    r"schema|unknown.*event|review_failed",
                )
            return

        with self.subTest(mode="canonical_adapter_evidence"):
            self.assertEqual("retrying", result["state"])
            report = result["initial_review_report"]
            self.assertEqual("failed", report["status"])
            self.assertEqual(self.roles(result)["reviewer"], report["actor"])
            self.assertTrue(report["authority_grant"])
            self.assertTrue(report["report_digest"])
            self.assertTrue(result["failure_history"])
            cause_key = sha256_digest("legacy review failure")
            self.assertEqual(1, result["retry_causes"].get(cause_key))
            self.assertEqual(1, result["metrics"]["review_failures"])

        if result.get("failure_history") and result["initial_review_report"]["status"] == "failed":
            with self.subTest(mode="canonical_adapter_strict_fix"):
                fixed = self.apply_persisted_fix(
                    result,
                    cause="legacy review failure",
                    path="app/legacy-review.diff",
                )
                self.assertEqual("implementing", fixed["state"])


class PersistenceAndReportRegressionTest(StopContractTestCase):
    def test_run_state_nested_schema_and_semantics_reject_rehashed_corruption(self) -> None:
        from team_harness import validate_document

        canonical = self.run_request(request(idempotency_key="run-state-nested-schema"))
        for field in canonical:
            with self.subTest(schema="required", field=field):
                candidate = copy.deepcopy(canonical)
                candidate.pop(field)
                self.assertTrue(validate_document("run_state", candidate))

        nested_mutations: tuple[
            tuple[str, Callable[[dict[str, Any]], None]], ...
        ] = (
            ("team", lambda state: state["team"][0].update({"unexpected": True})),
            ("selection", lambda state: state["selection"].update({"writer": 7})),
            (
                "authority_grants",
                lambda state: state["authority_grants"].update({"unexpected": True}),
            ),
            ("trace", lambda state: state["state_trace"][-1].pop("actor")),
            ("finding", lambda state: state["findings"].append({"issue_id": "partial"})),
            (
                "report",
                lambda state: state["initial_verification_report"].update(
                    {"checks": [7]}
                ),
            ),
            ("metrics", lambda state: state["metrics"].update({"unexpected": True})),
            ("source", lambda state: state["source_sync"].update({"accepted": "yes"})),
            ("artifacts", lambda state: state["artifacts"][0].update({"unexpected": True})),
        )
        for label, mutate in nested_mutations:
            with self.subTest(schema="nested", field=label):
                candidate = copy.deepcopy(canonical)
                mutate(candidate)
                self.assertTrue(validate_document("run_state", candidate))

        def ghost_state(state: dict[str, Any]) -> None:
            state["state"] = "ghost"
            transition = state["state_trace"][-1]
            transition["state"] = "ghost"
            transition["evidence_digest"] = sha256_digest(
                {key: value for key, value in transition.items() if key != "evidence_digest"}
            )

        def mismatched_trace(state: dict[str, Any]) -> None:
            transition = state["state_trace"][-1]
            transition["state"] = "reviewing"
            transition["evidence_digest"] = sha256_digest(
                {key: value for key, value in transition.items() if key != "evidence_digest"}
            )

        def mismatched_writer_grant(state: dict[str, Any]) -> None:
            state["selection"]["writer"] = "reviewer"
            grant = state["authority_grants"]["write"]["backend"]
            grant["agent"] = "reviewer"
            grant["grant_digest"] = sha256_digest(
                {key: value for key, value in grant.items() if key != "grant_digest"}
            )

        semantic_mutations: tuple[
            tuple[str, Callable[[dict[str, Any]], None]], ...
        ] = (
            ("ghost_state", ghost_state),
            ("last_trace_mismatch", mismatched_trace),
            ("writer_grant_role_mismatch", mismatched_writer_grant),
            (
                "metrics_shape",
                lambda state: state["metrics"].update(
                    {"test_results": ["not-a-canonical-report"]}
                ),
            ),
        )
        for label, mutate in semantic_mutations:
            with self.subTest(load=label):
                run = self.run_request(
                    request(idempotency_key=f"run-state-semantic-{label}")
                )
                rewrite_committed_state(self.runs_dir, run, mutate)
                try:
                    loaded = self.harness.facade.store.load(run["run_id"])
                    resumed = self.resume_run(run, events=[])
                except Exception as error:
                    self.fail(f"semantic integrity failure must not escape the API: {error}")
                self.assertEqual("blocked", loaded["state"])
                self.assertEqual("failed", loaded["integrity_status"])
                self.assertRegex(
                    json.dumps(loaded.get("integrity_errors", [])).lower(),
                    r"schema|semantic|state|trace|team|grant|metrics",
                )
                self.assertEqual("blocked", resumed["state"])

    def test_canonical_report_checks_persist_into_reports_and_metrics(self) -> None:
        run = self.run_request(request(idempotency_key="canonical-report-checks"))
        staged = self.stage(run)
        expected_checks = list(staged["task_contract"]["required_checks"])
        with self.subTest(report="initial"):
            self.assertEqual(
                expected_checks, staged["initial_verification_report"]["checks"]
            )
            self.assertEqual(expected_checks, staged["verification_report"]["checks"])
            rendered = json.dumps(staged["metrics"]["test_results"])
            self.assertTrue(all(check in rendered for check in expected_checks))

        final_verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        with self.subTest(report="final"):
            self.assertEqual(
                expected_checks, final_verified["final_verification_report"]["checks"]
            )
            self.assertEqual(
                expected_checks, final_verified["verification_report"]["checks"]
            )
            rendered = json.dumps(final_verified["metrics"]["test_results"])
            self.assertTrue(all(check in rendered for check in expected_checks))
            persisted = self.harness.facade.store.load(final_verified["run_id"])
            self.assertEqual(
                expected_checks, persisted["final_verification_report"]["checks"]
            )


if __name__ == "__main__":
    import unittest

    unittest.main()
