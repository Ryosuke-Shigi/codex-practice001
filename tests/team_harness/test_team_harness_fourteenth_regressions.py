"""Fourteenth-wave regressions for long-suite, recurrence, and causal reset."""

from __future__ import annotations

import ast
import copy
import json
from pathlib import Path
from typing import Any, Mapping

from test_team_harness_contract import (
    report_event,
    request,
    sha256_digest,
    source_request_for,
)
from test_team_harness_eleventh_regressions import _rewrite_manifests_and_anchor
from test_team_harness_hardening_contract import rejection_codes
from test_team_harness_ninth_regressions import generation_snapshots
from test_team_harness_stop_contract import StopContractTestCase
from test_team_harness_tenth_regressions import rehash_generation_chain
from test_team_harness_thirteenth_regressions import (
    _bind_generation_reserved_evidence,
)
from team_harness.state import canonical_completion_projection, canonical_metrics


class FourteenthHarnessRegressionTest(StopContractTestCase):
    @staticmethod
    def _inactive_source(run: Mapping[str, Any]) -> dict[str, Any]:
        return {
            "schema_version": "1.0",
            "run_id": run["run_id"],
            "contract_digest": run["contract_digest"],
            "artifact_revision": run["artifact_revision"],
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

    def _final_verified(self, run: Mapping[str, Any]) -> dict[str, Any]:
        staged = self.stage(run)
        verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        self.assertEqual("final_verification", verified["state"])
        return verified

    def _fail_final_review(
        self, verified: Mapping[str, Any], cause: str
    ) -> dict[str, Any]:
        return self.resume_run(
            verified,
            events=[
                report_event(
                    verified,
                    "review",
                    "failed",
                    phase="final",
                    cause=cause,
                )
            ],
        )

    def _normalize_fixed_source_for_recurrence(
        self, fixed: Mapping[str, Any]
    ) -> dict[str, Any]:
        """Keep the recurrence test independent from the source-reset Red."""

        snapshots = generation_snapshots(self.runs_dir, fixed)
        manifest = snapshots[-1][0]

        def reset(candidate: dict[str, Any]) -> None:
            candidate["source_sync"] = self._inactive_source(candidate)
            candidate["completion_report"] = canonical_completion_projection(
                candidate,
                generation_revision=None,
                complete=False,
                gate="not_evaluated",
                reasons=[],
            )
            candidate["metrics"] = canonical_metrics(candidate)

        rehash_generation_chain(
            self.runs_dir,
            fixed,
            manifest["generation_ref"],
            reset,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, fixed)
        loaded = self.harness.facade.store.load(fixed["run_id"])
        self.assertIsNotNone(loaded)
        assert loaded is not None
        self.assertEqual("verified", loaded["integrity_status"])
        return loaded

    def _assert_integrity_code(self, run: Mapping[str, Any], code: str) -> None:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
        except Exception as error:  # integrity corruption must be structured
            self.fail(f"integrity load raised {type(error).__name__}: {error}")
        self.assertIsNotNone(loaded)
        assert loaded is not None
        rendered = json.dumps(
            loaded.get("integrity_errors", []), ensure_ascii=False
        ).lower()
        self.assertEqual("blocked", loaded.get("state"), rendered)
        self.assertEqual("failed", loaded.get("integrity_status"), rendered)
        self.assertIn(code.lower(), rendered, rendered)

    def test_checker_full_suite_timeout_has_one_realistic_contract_value(self) -> None:
        checker = Path(__file__).resolve().parents[2] / "scripts/verify_project_ai_harness.py"
        tree = ast.parse(checker.read_text(encoding="utf-8"), filename=str(checker))
        assignments: dict[str, list[ast.AST]] = {}
        for node in tree.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        assignments.setdefault(target.id, []).append(node.value)
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                assignments.setdefault(node.target.id, []).append(node.value)

        full_suite_calls: list[ast.Call] = []
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call):
                continue
            function = node.func
            if not (
                isinstance(function, ast.Attribute)
                and function.attr == "run"
                and isinstance(function.value, ast.Name)
                and function.value.id == "subprocess"
            ):
                continue
            rendered = ast.dump(node)
            if "unittest" in rendered and "test_team_harness_thirteenth_regressions" in rendered:
                full_suite_calls.append(node)

        self.assertEqual(1, len(full_suite_calls))
        timeout_keywords = [
            keyword
            for keyword in full_suite_calls[0].keywords
            if keyword.arg == "timeout"
        ]
        self.assertEqual(1, len(timeout_keywords))
        timeout_node = timeout_keywords[0].value
        if isinstance(timeout_node, ast.Name):
            bindings = assignments.get(timeout_node.id, [])
            self.assertEqual(
                1,
                len(bindings),
                "the full-suite timeout must have one authoritative definition",
            )
            timeout_node = bindings[0]
        self.assertIsInstance(
            timeout_node,
            ast.Constant,
            "the checker timeout must resolve to one static integer contract",
        )
        timeout_value = getattr(timeout_node, "value", None)
        self.assertIsInstance(timeout_value, int)
        self.assertGreaterEqual(
            timeout_value,
            240,
            "the full team-harness suite can exceed two minutes; 120 seconds is unsafe",
        )

    def test_recurring_final_drift_reopens_catalog_and_reaches_bounded_limit(self) -> None:
        cause = "recurring final source drift"
        cause_key = sha256_digest(cause)
        started = self.run_request(
            request(
                idempotency_key="fourteenth-recurring-final-drift",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/fourteenth-recurring-fix-1.diff",
                    "app/fourteenth-recurring-fix-2.diff",
                ],
            )
        )

        first_failed = self._fail_final_review(self._final_verified(started), cause)
        self.assertEqual("retrying", first_failed["state"])
        first_finding = first_failed["findings"][-1]
        self.assertEqual("FINAL-DRIFT", first_finding["issue_id"])
        self.assertEqual(1, first_failed["retry_causes"][cause_key])
        first_fixed = self.apply_persisted_fix(
            first_failed,
            cause=cause,
            issue_ids=["FINAL-DRIFT"],
            path="app/fourteenth-recurring-fix-1.diff",
        )
        first_fixed = self._normalize_fixed_source_for_recurrence(first_fixed)
        first_catalog = next(
            item
            for item in first_fixed["finding_catalog"]
            if item["issue_id"] == "FINAL-DRIFT"
        )
        self.assertEqual("resolved", first_catalog["status"])

        second_failed = self._fail_final_review(
            self._final_verified(first_fixed), cause
        )
        second_finding = second_failed["findings"][-1]
        self.assertEqual(
            (
                first_finding["issue_id"],
                first_finding["clause"],
                first_finding["location"],
            ),
            (
                second_finding["issue_id"],
                second_finding["clause"],
                second_finding["location"],
            ),
        )
        self.assertNotEqual(first_finding["digest"], second_finding["digest"])
        second_catalog = next(
            item
            for item in second_failed["finding_catalog"]
            if item["issue_id"] == "FINAL-DRIFT"
        )
        self.assertEqual("open", second_catalog["status"])
        self.assertEqual(
            first_catalog["first_finding_digest"],
            second_catalog["first_finding_digest"],
        )
        self.assertEqual(2, second_failed["retry_causes"][cause_key])
        self.assertEqual(
            second_finding["digest"],
            second_failed["failure_history"][-1]["finding_identities"][0][
                "finding_digest"
            ],
        )
        reloaded = self.harness.facade.store.load(second_failed["run_id"])
        self.assertIsNotNone(reloaded)
        assert reloaded is not None
        self.assertEqual("verified", reloaded["integrity_status"])

        second_fixed = self.apply_persisted_fix(
            reloaded,
            cause=cause,
            issue_ids=["FINAL-DRIFT"],
            path="app/fourteenth-recurring-fix-2.diff",
        )
        second_fixed = self._normalize_fixed_source_for_recurrence(second_fixed)
        third_failed = self._fail_final_review(
            self._final_verified(second_fixed), cause
        )
        self.assertEqual("needs_human_approval", third_failed["state"])
        self.assertEqual(3, third_failed["retry_causes"][cause_key])
        self.assertIn("retry_limit", rejection_codes(third_failed))
        self.assertEqual("open", next(
            item["status"]
            for item in third_failed["finding_catalog"]
            if item["issue_id"] == "FINAL-DRIFT"
        ))
        terminal_reload = self.harness.facade.store.load(third_failed["run_id"])
        self.assertIsNotNone(terminal_reload)
        assert terminal_reload is not None
        self.assertEqual("verified", terminal_reload["integrity_status"])

    def test_verified_fix_resets_current_source_then_allows_new_source_completion(self) -> None:
        cause = "source must reset after fix"
        started = self.run_request(
            request(
                idempotency_key="fourteenth-source-reset",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/fourteenth-source-reset.diff",
                ],
            )
        )
        staged = self.stage(started)
        old_source = copy.deepcopy(staged["source_sync"])
        old_source_request = source_request_for(
            staged,
            payload={"changes": ["stale source reuse"]},
            source_baseline_digest=sha256_digest("old source baseline"),
        )
        verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        failed = self._fail_final_review(verified, cause)
        fixed = self.apply_persisted_fix(
            failed,
            cause=cause,
            issue_ids=["FINAL-DRIFT"],
            path="app/fourteenth-source-reset.diff",
        )

        self.assertEqual("implementing", fixed["state"])
        self.assertEqual(self._inactive_source(fixed), fixed["source_sync"])
        self.assertFalse(fixed["implementation_approval"]["approved"])
        for key in (
            "initial_verification_report",
            "initial_review_report",
            "final_verification_report",
            "final_review_report",
        ):
            self.assertEqual("not_run", fixed[key]["status"])
        self.assertEqual(
            canonical_completion_projection(
                fixed,
                generation_revision=None,
                complete=False,
                gate="not_evaluated",
                reasons=[],
            ),
            fixed["completion_report"],
        )
        fixed_reload = self.harness.facade.store.load(fixed["run_id"])
        self.assertIsNotNone(fixed_reload)
        assert fixed_reload is not None
        self.assertEqual("verified", fixed_reload["integrity_status"])
        self.assertEqual("implementing", fixed_reload["state"])
        self.assertEqual(
            "resolved",
            next(
                item["status"]
                for item in fixed_reload["finding_catalog"]
                if item["issue_id"] == "FINAL-DRIFT"
            ),
        )

        snapshots = generation_snapshots(self.runs_dir, fixed_reload)
        historical_source = next(
            state["source_sync"]
            for _, state, _ in snapshots[:-1]
            if state.get("source_sync", {}).get("accepted") is True
        )
        self.assertEqual(old_source, historical_source)
        historical_staging = (
            self.runs_dir
            / fixed["run_id"]
            / historical_source["staging_artifact"]["ref"]
        )
        self.assertTrue(historical_staging.is_file())

        incomplete = self.harness.facade.completion_gate(
            fixed["run_id"], expected_revision=fixed["revision"]
        )
        self.assertFalse(incomplete["complete"])
        approved = self.initially_approve(fixed_reload)
        stale = self.resume_run(approved, source_sync_request=old_source_request)
        self.assertFalse(stale["source_sync"]["accepted"])
        self.assertEqual("implementation_approved", stale["state"])
        self.assertIn("source_sync_evidence", rejection_codes(stale))

        restaged = self.resume_run(
            approved,
            source_sync_request=source_request_for(
                approved,
                payload={"changes": ["fresh source after fix"]},
                source_baseline_digest=sha256_digest("fresh source baseline"),
            ),
        )
        self.assertTrue(restaged["source_sync"]["accepted"])
        self.assertNotEqual(
            old_source["staging_artifact"]["ref"],
            restaged["source_sync"]["staging_artifact"]["ref"],
        )
        final_verified = self.resume_run(
            restaged,
            events=[
                report_event(restaged, "verification", "passed", phase="final")
            ],
        )
        final_reviewed = self.resume_run(
            final_verified,
            events=[
                report_event(
                    final_verified, "review", "passed", phase="final"
                )
            ],
        )
        completion = self.harness.facade.completion_gate(
            final_reviewed["run_id"],
            expected_revision=final_reviewed["revision"],
        )
        self.assertTrue(completion["complete"])
        completed = self.harness.facade.store.load(final_reviewed["run_id"])
        self.assertIsNotNone(completed)
        assert completed is not None
        self.assertEqual("verified", completed["integrity_status"])
        self.assertEqual("completed", completed["state"])

    def test_blocked_causality_rejects_unrelated_same_generation_deltas(self) -> None:
        started = self.run_request(
            request(idempotency_key="fourteenth-blocked-causal-subset")
        )
        staged = self.stage(started)
        cause = "final verification is blocked"
        blocked = self.resume_run(
            staged,
            events=[
                report_event(
                    staged,
                    "verification",
                    "blocked",
                    phase="final",
                    cause=cause,
                )
            ],
        )
        self.assertEqual("blocked", blocked["state"])
        positive = self.harness.facade.store.load(blocked["run_id"])
        self.assertIsNotNone(positive)
        assert positive is not None
        self.assertEqual("verified", positive["integrity_status"])
        evidence = positive["state_trace"][-1]["reserved_evidence"]
        self.assertEqual(
            "quality_blocker",
            evidence["transition_evidence"]["target_causality"]["kind"],
        )

        snapshots = generation_snapshots(self.runs_dir, blocked)
        manifest = snapshots[-1][0]
        prior = copy.deepcopy(snapshots[-2][1])

        def add_unrelated_deltas(candidate: dict[str, Any]) -> None:
            finding = {
                "sequence": len(candidate["findings"]) + 1,
                "source": self.roles(candidate)["reviewer"],
                "actor": self.roles(candidate)["reviewer"],
                "issue_id": "UNRELATED-BLOCKED-14",
                "clause": "unrelated.blocked",
                "location": "app/unrelated-blocked.php",
                "kind": "quality",
                "message": "unrelated finding in blocked generation",
                "severity": "medium",
                "position": None,
                "status": "open",
            }
            finding["digest"] = sha256_digest(finding)
            candidate["findings"].append(finding)
            candidate["finding_catalog"].append(
                {
                    "issue_id": finding["issue_id"],
                    "clause": finding["clause"],
                    "location": finding["location"],
                    "first_finding_digest": finding["digest"],
                    "status": "open",
                    "resolution_receipt_digest": None,
                }
            )
            candidate["implementation_log"].append(
                {
                    "kind": "fix_applied",
                    "attempt": 2,
                    "cause": "unrelated receipt-linked fix",
                    "failed_report_digest": sha256_digest("unrelated failed report"),
                    "cause_fingerprint": sha256_digest("unrelated receipt-linked fix"),
                    "fix_receipt_id": "receipt-unrelated-blocked-14",
                    "fix_artifact_digest": sha256_digest("unrelated fix artifact"),
                    "input_fingerprint": candidate["input_fingerprint"],
                    "diff_digest": candidate["diff_digest"],
                }
            )
            candidate["rejections"].append(
                {
                    "code": "unrelated_blocked_rejection",
                    "message": "unrelated rejection in blocked generation",
                }
            )
            candidate["conflicts"].append(
                {
                    "issue_id": "UNRELATED-CONFLICT-14",
                    "clause": "unrelated.conflict",
                    "location": "app/unrelated-conflict.php",
                    "positions": ["approve", "reject"],
                }
            )
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_generation_reserved_evidence(
                candidate, prior, manifest["revision"]
            )

        rehash_generation_chain(
            self.runs_dir,
            blocked,
            manifest["generation_ref"],
            add_unrelated_deltas,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, blocked)
        self._assert_integrity_code(
            blocked, "reserved_trace_generation_evidence_invalid"
        )
