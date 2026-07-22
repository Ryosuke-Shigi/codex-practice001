"""Thirteenth-wave regressions for atomic retry and causal generation deltas."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any, Mapping
from unittest import mock

from test_team_harness_contract import report_event, request, sha256_digest
from test_team_harness_eleventh_regressions import _rewrite_manifests_and_anchor
from test_team_harness_ninth_regressions import generation_snapshots
from test_team_harness_stop_contract import StopContractTestCase
from test_team_harness_tenth_regressions import rehash_generation_chain
from test_team_harness_twelfth_regressions import _report_digest
from team_harness.state import (
    canonical_completion_projection,
    canonical_metrics,
    canonical_reserved_evidence,
)


def _bind_generation_reserved_evidence(
    state: dict[str, Any],
    prior: Mapping[str, Any],
    revision: int,
) -> None:
    """Rebind only the reserved transition introduced by this generation."""

    previous_length = len(prior.get("state_trace", []))
    reserved = set(state["execution_policy"]["reserved_states"])
    for entry in state["state_trace"][previous_length:]:
        if entry.get("state") not in reserved:
            continue
        entry["reserved_evidence"] = canonical_reserved_evidence(
            state,
            entry,
            revision,
            prior_run=prior,
        )
        entry["evidence_digest"] = sha256_digest(
            {key: value for key, value in entry.items() if key != "evidence_digest"}
        )


class ThirteenthHarnessRegressionTest(StopContractTestCase):
    def _assert_integrity_code(self, run: Mapping[str, Any], code: str) -> None:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
        except Exception as error:  # corruption must be returned, never raised
            self.fail(f"integrity load raised {type(error).__name__}: {error}")
        self.assertIsNotNone(loaded)
        assert loaded is not None
        rendered = json.dumps(
            loaded.get("integrity_errors", []), ensure_ascii=False
        ).lower()
        self.assertEqual("blocked", loaded.get("state"), rendered)
        self.assertEqual("failed", loaded.get("integrity_status"), rendered)
        self.assertIn(code.lower(), rendered, rendered)

    def _final_verified(self, key: str) -> dict[str, Any]:
        started = self.run_request(
            request(
                idempotency_key=key,
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    f"app/{key}.diff",
                ],
            )
        )
        staged = self.stage(started)
        verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        self.assertEqual("final_verification", verified["state"])
        return verified

    def _completed_run(self, key: str) -> dict[str, Any]:
        verified = self._final_verified(key)
        reviewed = self.resume_run(
            verified,
            events=[report_event(verified, "review", "passed", phase="final")],
        )
        completion = self.harness.facade.completion_gate(
            reviewed["run_id"], expected_revision=reviewed["revision"]
        )
        self.assertTrue(completion["complete"])
        loaded = self.harness.facade.store.load(reviewed["run_id"])
        self.assertIsNotNone(loaded)
        assert loaded is not None
        return loaded

    def test_under_limit_final_review_failure_is_one_atomic_retry_generation(self) -> None:
        verified = self._final_verified("thirteenth-final-review-atomic")
        before = generation_snapshots(self.runs_dir, verified)
        cause = "thirteenth final source drift"
        result = self.resume_run(
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
        after = generation_snapshots(self.runs_dir, result)
        suffix = result["state_trace"][len(verified["state_trace"]):]
        cause_key = sha256_digest(cause)
        history = result["failure_history"][-1]
        prior_state = before[-1][1]
        latest_manifest, latest_state, _ = after[-1]

        self.assertEqual("retrying", result["state"])
        self.assertEqual(verified["revision"] + 1, result["revision"])
        self.assertEqual(len(before) + 1, len(after))
        self.assertEqual(["retrying"], [entry["state"] for entry in suffix])
        self.assertEqual("final_verification", suffix[0]["from"])
        self.assertEqual(f"final_review failed: {cause}", suffix[0]["reason"])
        self.assertEqual(1, result["retry_causes"][cause_key])
        self.assertEqual("failed", result["final_review_report"]["status"])
        self.assertEqual("final", history["phase"])
        self.assertEqual("review", history["report"])
        self.assertEqual(cause, history["cause"])
        self.assertIn("FINAL-DRIFT", history["issue_ids"])
        self.assertEqual(latest_manifest["generation_ref"], history["report_generation_ref"])
        self.assertEqual(latest_manifest["revision"], history["report_generation_revision"])
        self.assertTrue(
            any(
                finding["issue_id"] == "FINAL-DRIFT"
                and finding["message"] == cause
                and finding["status"] == "open"
                for finding in result["findings"]
            )
        )
        self.assertEqual(result["state"], latest_state["state"])
        self.assertEqual(result["failure_history"], latest_state["failure_history"])
        self.assertEqual(
            prior_state["failure_history"],
            latest_state["failure_history"][:-1],
        )
        self.assertEqual(
            ["FINAL-DRIFT"],
            [
                finding["issue_id"]
                for finding in latest_state["findings"][len(prior_state["findings"]):]
            ],
        )
        self.assertNotEqual(
            prior_state["final_review_report"], latest_state["final_review_report"]
        )
        self.assertEqual(
            prior_state["state_trace"],
            latest_state["state_trace"][: len(prior_state["state_trace"])],
        )
        self.assertNotIn("_post_reserved_transition", latest_state)

    def test_final_review_retry_has_no_second_save_failure_or_crash_window(self) -> None:
        problems: list[str] = []
        modes = (
            ("first-save-failure", 1, False),
            ("first-save-crash", 1, True),
            ("second-save-failure", 2, False),
            ("second-save-crash", 2, True),
        )
        for mode, trigger_call, crash in modes:
            verified = self._final_verified(f"thirteenth-{mode}")
            store = self.harness.facade.store
            original_save = store.save
            calls = 0
            unexpected: str | None = None

            def injected_save(
                candidate: dict[str, Any],
                *,
                expected_revision: int | None = None,
                crash_at: str | None = None,
            ) -> None:
                nonlocal calls
                calls += 1
                if calls == trigger_call:
                    if crash:
                        original_save(
                            candidate,
                            expected_revision=expected_revision,
                            crash_at="before_commit_manifest_swap",
                        )
                    raise RuntimeError(f"simulated {mode}")
                original_save(
                    candidate,
                    expected_revision=expected_revision,
                    crash_at=crash_at,
                )

            try:
                with mock.patch.object(store, "save", side_effect=injected_save):
                    self.resume_run(
                        verified,
                        events=[
                            report_event(
                                verified,
                                "review",
                                "failed",
                                phase="final",
                                cause=f"{mode} drift",
                            )
                        ],
                    )
            except RuntimeError:
                pass
            except Exception as error:  # keep fixture failures as assertions, not Error
                unexpected = f"{type(error).__name__}: {error}"

            loaded = store.load(verified["run_id"])
            if unexpected is not None:
                problems.append(f"{mode} raised unexpected {unexpected}")
            if calls != 1:
                problems.append(f"{mode} used {calls} saves instead of one")
            if not isinstance(loaded, Mapping):
                problems.append(f"{mode} left no readable committed generation")
                continue
            if loaded.get("state") == "final_review":
                problems.append(f"{mode} persisted a final_review checkpoint dead-end")
            if loaded.get("state") not in {"final_verification", "retrying"}:
                problems.append(f"{mode} persisted unexpected state {loaded.get('state')}")
            if "_post_reserved_transition" in loaded:
                problems.append(f"{mode} persisted a private pending transition")
        self.assertEqual([], problems)

    def test_blocked_transition_rejects_past_rejection_plus_new_unrelated_finding(self) -> None:
        rejected = self.run_request(
            request(
                idempotency_key="thirteenth-blocked-cause",
                events=[
                    {
                        "type": "transition",
                        "from": "implementing",
                        "to": "completed",
                        "actor": "orchestrator",
                    }
                ],
            )
        )
        self.assertTrue(rejected["rejections"])
        advanced = self.resume_run(
            rejected,
            events=[
                {
                    "type": "finding",
                    "actor": "reviewer",
                    "source": "reviewer",
                    "issue_id": "UNRELATED-BLOCK-13",
                    "clause": "unrelated.block",
                    "location": "app/unrelated-block.php",
                    "kind": "quality",
                    "message": "unrelated current-generation finding",
                    "status": "open",
                }
            ],
        )
        snapshots = generation_snapshots(self.runs_dir, advanced)
        manifest, _, _ = snapshots[-1]
        prior = copy.deepcopy(snapshots[-2][1])

        def forge_blocked(candidate: dict[str, Any]) -> None:
            entry = {
                "sequence": len(candidate["state_trace"]) + 1,
                "from": candidate["state"],
                "state": "blocked",
                "actor": "orchestrator",
                "reason": "borrowed prior rejection",
            }
            candidate["state_trace"].append(entry)
            candidate["state"] = "blocked"
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_generation_reserved_evidence(candidate, prior, manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            advanced,
            manifest["generation_ref"],
            forge_blocked,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, advanced)
        self._assert_integrity_code(
            advanced, "reserved_trace_generation_evidence_invalid"
        )

    def test_human_approval_rejects_relocated_failure_plus_unrelated_new_finding(self) -> None:
        verified = self._final_verified("thirteenth-relocated-human")
        cause = "relocated final failure"
        failed = self.resume_run(
            verified,
            events=[
                report_event(
                    verified, "review", "failed", phase="final", cause=cause
                )
            ],
        )
        fixed = self.apply_persisted_fix(
            failed,
            cause=cause,
            issue_ids=["FINAL-DRIFT"],
            path="app/thirteenth-relocated-human.diff",
        )
        self.assertEqual("implementing", fixed["state"])
        advanced = self.resume_run(
            fixed,
            events=[
                {
                    "type": "finding",
                    "actor": "verifier",
                    "source": "verifier",
                    "issue_id": "UNRELATED-HUMAN-13",
                    "clause": "unrelated.human",
                    "location": "app/unrelated-human.php",
                    "kind": "quality",
                    "message": "unrelated current-generation finding",
                    "status": "open",
                }
            ],
        )
        self.assertEqual(fixed["failure_history"], advanced["failure_history"])
        self.assertTrue(
            any(item["phase"] == "final" for item in fixed["failure_history"])
        )
        snapshots = generation_snapshots(self.runs_dir, advanced)
        manifest, _, _ = snapshots[-1]
        prior = copy.deepcopy(snapshots[-2][1])

        def forge_human(candidate: dict[str, Any]) -> None:
            entry = {
                "sequence": len(candidate["state_trace"]) + 1,
                "from": candidate["state"],
                "state": "needs_human_approval",
                "actor": "orchestrator",
                "reason": "borrowed relocated final failure",
            }
            candidate["state_trace"].append(entry)
            candidate["state"] = "needs_human_approval"
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_generation_reserved_evidence(candidate, prior, manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            advanced,
            manifest["generation_ref"],
            forge_human,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, advanced)
        self._assert_integrity_code(
            advanced, "reserved_trace_generation_evidence_invalid"
        )

    def test_failed_transition_rejects_an_under_limit_wrong_report_delta(self) -> None:
        started = self.run_request(
            request(idempotency_key="thirteenth-wrong-failed-report")
        )
        verified = self.resume_run(
            started,
            events=[report_event(started, "verification", "passed")],
        )
        cause = "under-limit initial review failure"
        retrying = self.resume_run(
            verified,
            events=[report_event(verified, "review", "failed", cause=cause)],
        )
        self.assertEqual("retrying", retrying["state"])
        snapshots = generation_snapshots(self.runs_dir, retrying)
        manifest, _, _ = snapshots[-1]
        prior = copy.deepcopy(snapshots[-2][1])

        def forge_failed(candidate: dict[str, Any]) -> None:
            entry = candidate["state_trace"][-1]
            self.assertEqual("retrying", entry["state"])
            self.assertEqual("review", candidate["failure_history"][-1]["report"])
            self.assertNotIn(
                "retry_limit",
                {item.get("code") for item in candidate["rejections"]},
            )
            entry["state"] = "failed"
            entry["reason"] = "same-cause retry limit exceeded"
            entry.pop("reserved_evidence", None)
            candidate["state"] = "failed"
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_generation_reserved_evidence(candidate, prior, manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            retrying,
            manifest["generation_ref"],
            forge_failed,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, retrying)
        self._assert_integrity_code(
            retrying, "reserved_trace_generation_evidence_invalid"
        )

    def test_rejections_blockers_and_conflicts_are_generation_append_only_prefixes(self) -> None:
        records: dict[str, dict[str, Any]] = {
            "rejections": {"code": "PREFIX-REJECTION-13", "message": "persist me"},
            "blockers": {"code": "PREFIX-BLOCKER-13", "message": "persist me"},
            "conflicts": {
                "issue_id": "PREFIX-CONFLICT-13",
                "clause": "prefix.conflict",
                "location": "app/prefix.php",
                "positions": ["approve", "reject"],
            },
        }
        for field, record in records.items():
            run = self.run_request(
                request(idempotency_key=f"thirteenth-prefix-{field}")
            )
            advanced = self.resume_run(
                run, events=[{"type": "plan_revised", "change": "later generation"}]
            )
            first_manifest, _, _ = generation_snapshots(self.runs_dir, advanced)[0]

            def add_prior_record(candidate: dict[str, Any]) -> None:
                candidate[field].append(copy.deepcopy(record))
                candidate["metrics"] = canonical_metrics(candidate)

            rehash_generation_chain(
                self.runs_dir,
                advanced,
                first_manifest["generation_ref"],
                add_prior_record,
            )
            _rewrite_manifests_and_anchor(self.runs_dir, advanced)
            with self.subTest(field=field):
                self._assert_integrity_code(
                    advanced, f"rewrites append-only {field}"
                )

    def test_source_and_all_later_generations_exactly_carry_initial_report_identity(self) -> None:
        run = self._completed_run("thirteenth-source-report-carry")
        snapshots = generation_snapshots(self.runs_dir, run)
        source_index = next(
            index
            for index, (_, state, _) in enumerate(snapshots)
            if state.get("state") == "source_sync"
        )
        approved = snapshots[source_index - 1][1]
        initial_keys = ("initial_verification_report", "initial_review_report")
        baseline_initial = {key: copy.deepcopy(approved[key]) for key in initial_keys}
        baseline_approval = copy.deepcopy(approved["implementation_approval"])

        for index in range(source_index, len(snapshots)):
            manifest, state, _ = snapshots[index]
            previous = snapshots[index - 1][1]
            with self.subTest(revision=manifest["revision"], state=state["state"]):
                for key in initial_keys:
                    self.assertEqual(baseline_initial[key], state[key])
                self.assertEqual(baseline_approval, state["implementation_approval"])
                if state["state"] == "source_sync":
                    self.assertEqual(previous["final_verification_report"], state["final_verification_report"])
                    self.assertEqual(previous["final_review_report"], state["final_review_report"])
                elif state["state"] == "final_verification":
                    self.assertNotEqual(previous["final_verification_report"], state["final_verification_report"])
                    self.assertEqual(previous["final_review_report"], state["final_review_report"])
                elif state["state"] == "final_review":
                    self.assertEqual(previous["final_verification_report"], state["final_verification_report"])
                    self.assertNotEqual(previous["final_review_report"], state["final_review_report"])
                elif state["state"] == "completed":
                    for key in (*initial_keys, "final_verification_report", "final_review_report"):
                        self.assertEqual(previous[key], state[key])
                if index > source_index:
                    self.assertEqual(previous["source_sync"], state["source_sync"])

        alternate_initial = copy.deepcopy(baseline_initial)
        for key, label in (
            ("initial_verification_report", "verification"),
            ("initial_review_report", "review"),
        ):
            alternate_initial[key]["cause"] = f"alternate canonical {label} identity"
            alternate_initial[key]["report_digest"] = _report_digest(
                alternate_initial[key]
            )

        generation_refs = [
            manifest["generation_ref"]
            for manifest, _, _ in snapshots[source_index:]
        ]
        for generation_ref in generation_refs:
            current = generation_snapshots(self.runs_dir, run)
            index = next(
                offset
                for offset, (manifest, _, _) in enumerate(current)
                if manifest["generation_ref"] == generation_ref
            )
            manifest = current[index][0]
            prior = copy.deepcopy(current[index - 1][1])

            def rebind_suffix(candidate: dict[str, Any]) -> None:
                prior_trace = copy.deepcopy(prior["state_trace"])
                candidate["state_trace"][: len(prior_trace)] = prior_trace
                candidate.update(copy.deepcopy(alternate_initial))
                approval = candidate["implementation_approval"]
                approval["verification_report_digest"] = alternate_initial[
                    "initial_verification_report"
                ]["report_digest"]
                approval["review_report_digest"] = alternate_initial[
                    "initial_review_report"
                ]["report_digest"]
                if candidate["final_verification_report"]["status"] == "not_run":
                    report = alternate_initial["initial_verification_report"]
                    candidate["verification_report"] = {
                        field: report[field]
                        for field in ("status", "phase", "checks", "cause", "report_digest")
                    }
                if candidate["final_review_report"]["status"] == "not_run":
                    report = alternate_initial["initial_review_report"]
                    candidate["review_report"] = {
                        **{
                            field: report[field]
                            for field in ("status", "phase", "checks", "cause", "report_digest")
                        },
                        "findings": [],
                    }
                complete = candidate["completion_report"].get("complete") is True
                candidate["completion_report"] = canonical_completion_projection(
                    candidate,
                    generation_revision=manifest["revision"] if complete else None,
                    complete=complete,
                    gate="passed" if complete else "not_evaluated",
                    reasons=[],
                )
                candidate["metrics"] = canonical_metrics(candidate)
                _bind_generation_reserved_evidence(
                    candidate, prior, manifest["revision"]
                )

            rehash_generation_chain(
                self.runs_dir,
                run,
                generation_ref,
                rebind_suffix,
            )
        _rewrite_manifests_and_anchor(self.runs_dir, run)
        self._assert_integrity_code(run, "completion_source_binding_invalid")

    def test_spec_and_skill_require_conditional_resolution_and_forbid_old_unconditional_rule(self) -> None:
        root = Path(__file__).resolve().parents[2]
        spec = (root / "docs/ai/rules/team-execution-spec.md").read_text(
            encoding="utf-8"
        )
        skill = (root / "skills/team-task-contract/SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "fix artifactとresolution receiptへ結合できるのは、そのresolution receiptが実在するidentityだけ",
            spec,
        )
        self.assertIn("残るopen issueは保持され", spec)
        self.assertIn(
            "Bind a fix artifact and resolution receipt only to identities that have that resolution receipt",
            skill,
        )
        self.assertIn("never erase unresolved siblings", skill)

        unconditional_patterns = {
            "spec": (
                spec,
                r"各issue identityは[^。]{0,600}(?:resolution|fix artifact)[^。]{0,300}(?:存在しなければ|必須|要求)",
            ),
            "skill": (
                skill,
                r"(?:bind\s+)?(?:every|each|all)\s+failure[^.]{0,600}resolution[^.]{0,300}fix receipt[^.]{0,120}(?:agree|required|must)",
            ),
        }
        for label, (document, pattern) in unconditional_patterns.items():
            with self.subTest(document=label):
                self.assertIsNone(
                    re.search(pattern, document, flags=re.IGNORECASE),
                    f"obsolete unconditional resolution rule remains in {label}",
                )
