"""Twelfth-wave regressions for temporal evidence and cancellation gates."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Mapping

from test_team_harness_contract import report_event, request, sha256_digest
from test_team_harness_eleventh_regressions import _rewrite_manifests_and_anchor
from test_team_harness_ninth_regressions import (
    _write_json,
    committed_snapshot,
    generation_snapshots,
)
from test_team_harness_stop_contract import StopContractTestCase, rejection_codes
from test_team_harness_tenth_regressions import rehash_generation_chain
from team_harness.state import canonical_metrics, canonical_reserved_evidence


def _report_digest(report: Mapping[str, Any]) -> str:
    payload = {
        key: value
        for key, value in report.items()
        if key not in {"schema_version", "report", "source_revision", "report_digest"}
    }
    if payload.get("cause") is None:
        payload.pop("cause", None)
    if report.get("phase") != "final":
        payload.pop("staging_artifact_digest", None)
        payload.pop("source_manifest_digest", None)
    return sha256_digest(payload)


def _bind_reserved_entry(
    state: dict[str, Any], entry: dict[str, Any], revision: int
) -> None:
    entry["reserved_evidence"] = canonical_reserved_evidence(
        state, entry, revision
    )
    entry["evidence_digest"] = sha256_digest(
        {key: value for key, value in entry.items() if key != "evidence_digest"}
    )


class TwelfthHarnessRegressionTest(StopContractTestCase):
    def _assert_integrity_code(self, run: Mapping[str, Any], code: str) -> None:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
        except Exception as error:  # integrity failures are data, never exceptions
            self.fail(f"integrity load raised {type(error).__name__}: {error}")
        self.assertIsNotNone(loaded)
        assert loaded is not None
        errors = json.dumps(loaded.get("integrity_errors", []), ensure_ascii=False).lower()
        self.assertEqual("blocked", loaded.get("state"), errors)
        self.assertEqual("failed", loaded.get("integrity_status"), errors)
        self.assertIn(code, errors, errors)

    def _completed_run(self, key: str, *, paths: list[str] | None = None) -> dict[str, Any]:
        started = self.run_request(request(idempotency_key=key, paths=paths))
        staged = self.stage(started)
        verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
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

    def test_one_generation_cannot_introduce_two_reserved_transitions_with_final_state_evidence(self) -> None:
        started = self.run_request(request(idempotency_key="twelfth-reserved-suffix"))
        staged = self.stage(started)
        snapshots = generation_snapshots(self.runs_dir, staged)
        approval_manifest = next(
            manifest
            for manifest, state, _ in snapshots
            if state.get("state") == "implementation_approved"
        )
        source_manifest = next(
            manifest
            for manifest, state, _ in snapshots
            if state.get("state") == "source_sync"
        )

        def remove_prior_reserved_transition(candidate: dict[str, Any]) -> None:
            removed = candidate["state_trace"].pop()
            self.assertEqual("implementation_approved", removed["state"])
            candidate["state"] = "reviewing"
            candidate["metrics"] = canonical_metrics(candidate)

        rehash_generation_chain(
            self.runs_dir,
            staged,
            approval_manifest["generation_ref"],
            remove_prior_reserved_transition,
        )

        def bind_both_to_final_source_state(candidate: dict[str, Any]) -> None:
            previous_length = len(
                generation_snapshots(self.runs_dir, staged)[-2][1]["state_trace"]
            )
            suffix = candidate["state_trace"][previous_length:]
            self.assertEqual(
                ["implementation_approved", "source_sync"],
                [entry["state"] for entry in suffix],
            )
            for entry in suffix:
                _bind_reserved_entry(candidate, entry, source_manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            staged,
            source_manifest["generation_ref"],
            bind_both_to_final_source_state,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, staged)
        self._assert_integrity_code(
            staged, "reserved_trace_generation_evidence_invalid"
        )

    def test_reserved_transition_cannot_borrow_an_unrelated_prior_rejection(self) -> None:
        rejected = self.run_request(
            request(
                idempotency_key="twelfth-old-rejection",
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
            rejected, events=[{"type": "plan_revised", "change": "later evidence epoch"}]
        )
        self.assertEqual(rejected["rejections"], advanced["rejections"])
        manifest, _, _ = committed_snapshot(self.runs_dir, advanced)

        def append_blocked_with_old_rejection(candidate: dict[str, Any]) -> None:
            entry = {
                "sequence": len(candidate["state_trace"]) + 1,
                "from": candidate["state"],
                "state": "blocked",
                "actor": "orchestrator",
                "reason": "borrowed unrelated prior rejection",
            }
            candidate["state_trace"].append(entry)
            candidate["state"] = "blocked"
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_reserved_entry(candidate, entry, manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            advanced,
            manifest["generation_ref"],
            append_blocked_with_old_rejection,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, advanced)
        self._assert_integrity_code(
            advanced, "reserved_trace_generation_evidence_invalid"
        )

    def test_staging_first_generation_and_completed_source_are_temporally_bound(self) -> None:
        run = self._completed_run("twelfth-source-introduction")
        snapshots = generation_snapshots(self.runs_dir, run)
        introduced_index = next(
            index
            for index, (_, state, _) in enumerate(snapshots)
            if state.get("source_sync", {}).get("accepted") is True
        )
        manifest, state, _ = snapshots[introduced_index]
        self.assertGreater(introduced_index, 0)
        self.assertFalse(
            snapshots[introduced_index - 1][1].get("source_sync", {}).get("accepted")
        )
        source = state["source_sync"]
        staging = source["staging_artifact"]
        self.assertEqual(manifest["revision"], source["committed_revision"])
        self.assertEqual(state["current_artifact_digest"], source["source_artifact_digest"])
        self.assertEqual(state["run_id"], staging["provenance"]["run_id"])
        self.assertEqual(state["contract_digest"], staging["provenance"]["contract_digest"])
        self.assertEqual(state["artifact_revision"], staging["provenance"]["artifact_revision"])
        self.assertEqual(state["current_artifact_digest"], staging["provenance"]["artifact_digest"])
        self.assertEqual({"system", "catalog"}, set(staging["target_identity"]))
        self.assertTrue(all(staging["target_identity"].values()))

        latest_manifest, _, _ = committed_snapshot(self.runs_dir, run)
        past_revision = int(manifest["revision"]) - 1

        def rebind_completion_to_pre_staging_revision(candidate: dict[str, Any]) -> None:
            sync = candidate["source_sync"]
            sync["committed_revision"] = past_revision
            sync["manifest_digest"] = sha256_digest(
                {key: value for key, value in sync.items() if key != "manifest_digest"}
            )
            for key in ("final_verification_report", "final_review_report"):
                report = candidate[key]
                report["source_revision"] = past_revision
                report["source_manifest_digest"] = sync["manifest_digest"]
                report["report_digest"] = _report_digest(report)
            candidate["verification_report"]["report_digest"] = candidate[
                "final_verification_report"
            ]["report_digest"]
            candidate["review_report"]["report_digest"] = candidate[
                "final_review_report"
            ]["report_digest"]
            completion = candidate["completion_report"]
            completion["source_manifest_digest"] = sync["manifest_digest"]
            completion["final_verification_report_digest"] = candidate[
                "final_verification_report"
            ]["report_digest"]
            completion["final_review_report_digest"] = candidate[
                "final_review_report"
            ]["report_digest"]
            candidate["metrics"] = canonical_metrics(candidate)
            completed_entry = next(
                entry
                for entry in reversed(candidate["state_trace"])
                if entry["state"] == "completed"
            )
            _bind_reserved_entry(
                candidate, completed_entry, latest_manifest["revision"]
            )

        rehash_generation_chain(
            self.runs_dir,
            run,
            latest_manifest["generation_ref"],
            rebind_completion_to_pre_staging_revision,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, run)
        self._assert_integrity_code(run, "completion_source_binding_invalid")

    def test_receipt_requires_prior_generation_to_be_write_enabled(self) -> None:
        path = "app/twelfth-temporal-receipt.diff"
        started = self.run_request(
            request(
                idempotency_key="twelfth-receipt-temporal-scope",
                paths=["app/Http/Controllers/ExampleController.php", path],
            )
        )
        staged = self.stage(started)
        verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        snapshots = generation_snapshots(self.runs_dir, verified)
        manifest, state, _ = snapshots[-1]
        prior = snapshots[-2][1]
        write_states = set(prior["execution_policy"]["write_authorization"]["allowed_states"])
        self.assertNotIn(prior["state"], write_states)
        writer = self.roles(verified)["writer"]
        grant = prior["authority_grants"]["write"][writer]
        self.assertIn(path, grant["paths"])
        content = {
            "issue_ids": ["TEMPORAL-RECEIPT-12"],
            "check_ids": [],
            "deliverable_ids": [],
            "patch": "receipt introduced after source staging",
        }
        sequence = len(state["implementation_log"]) + 1
        receipt_id = "receipt-" + sha256_digest(
            {
                "run_id": state["run_id"],
                "actor": writer,
                "path": path,
                "content": content,
                "artifact_revision": prior["artifact_revision"],
                "sequence": sequence,
            }
        )[-20:]
        receipt_ref = f"{manifest['generation_ref']}/receipts/{receipt_id}.json"

        def append_temporally_invalid_receipt(candidate: dict[str, Any]) -> None:
            candidate["implementation_log"].append(
                {
                    "receipt_id": receipt_id,
                    "kind": "artifact_receipt",
                    "path": path,
                    "ref": receipt_ref,
                    "digest": sha256_digest(content),
                    "raw_content_persisted": True,
                    "authority_grant_digest": grant["grant_digest"],
                    "issued_by": "team_harness",
                    "issue_ids": content["issue_ids"],
                    "check_ids": content["check_ids"],
                    "deliverable_ids": content["deliverable_ids"],
                    "provenance": {
                        "producer": writer,
                        "run_id": candidate["run_id"],
                        "contract_digest": candidate["contract_digest"],
                        "plan_revision": prior["shared_plan"]["revision"],
                    },
                }
            )
            candidate["metrics"] = canonical_metrics(candidate)
            final_entry = next(
                entry
                for entry in reversed(candidate["state_trace"])
                if entry["state"] == "final_verification"
            )
            _bind_reserved_entry(candidate, final_entry, manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            verified,
            manifest["generation_ref"],
            append_temporally_invalid_receipt,
        )
        receipt_path = self.runs_dir / verified["run_id"] / receipt_ref
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        _write_json(receipt_path, content)
        _rewrite_manifests_and_anchor(self.runs_dir, verified)
        self._assert_integrity_code(verified, "receipt_path_scope_invalid")

    def test_completion_binds_all_four_canonical_report_digests(self) -> None:
        run = self._completed_run("twelfth-completion-four-reports")
        completion = run["completion_report"]
        expected = {
            "initial_verification_report_digest": run["initial_verification_report"][
                "report_digest"
            ],
            "initial_review_report_digest": run["initial_review_report"]["report_digest"],
            "final_verification_report_digest": run["final_verification_report"][
                "report_digest"
            ],
            "final_review_report_digest": run["final_review_report"]["report_digest"],
        }
        for field, report_digest in expected.items():
            with self.subTest(field=field):
                self.assertEqual(report_digest, completion.get(field))

    def test_stale_initial_report_cannot_reuse_completed_evidence_after_rehash(self) -> None:
        run = self._completed_run("twelfth-stale-initial-completion")
        manifest, _, _ = committed_snapshot(self.runs_dir, run)

        def replace_initial_report(candidate: dict[str, Any]) -> None:
            report = candidate["initial_verification_report"]
            report["cause"] = "replacement initial report"
            report["report_digest"] = _report_digest(report)
            candidate["implementation_approval"]["verification_report_digest"] = report[
                "report_digest"
            ]
            completed_entry = next(
                entry
                for entry in reversed(candidate["state_trace"])
                if entry["state"] == "completed"
            )
            _bind_reserved_entry(candidate, completed_entry, manifest["revision"])

        rehash_generation_chain(
            self.runs_dir,
            run,
            manifest["generation_ref"],
            replace_initial_report,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, run)
        self._assert_integrity_code(run, "completion_source_binding_invalid")

    def test_cancel_uses_a_dedicated_event_and_is_terminal_and_non_resumable(self) -> None:
        started = self.run_request(request(idempotency_key="twelfth-cancel-event"))
        generic = self.resume_run(
            started,
            events=[
                {
                    "type": "transition",
                    "from": started["state"],
                    "to": "cancelled",
                    "actor": "orchestrator",
                }
            ],
        )
        self.assertIn("reserved_state_transition", rejection_codes(generic))
        self.assertNotEqual("cancelled", generic["state"])

        cancelled = self.resume_run(
            started,
            events=[
                {
                    "type": "cancel",
                    "actor": "orchestrator",
                    "reason": "explicit task cancellation",
                }
            ],
        )
        self.assertEqual("cancelled", cancelled["state"])
        trace = cancelled["state_trace"][-1]
        self.assertEqual("explicit task cancellation", trace["reason"])
        evidence = trace.get("reserved_evidence")
        self.assertIsInstance(evidence, Mapping)
        assert isinstance(evidence, Mapping)
        self.assertEqual(cancelled["revision"], evidence.get("generation_revision"))
        self.assertEqual("cancelled", evidence.get("transition_state"))

        before = {
            "revision": cancelled["revision"],
            "state_trace": copy.deepcopy(cancelled["state_trace"]),
            "artifacts": copy.deepcopy(cancelled["artifacts"]),
        }
        late = self.resume_run(
            cancelled, events=[{"type": "plan_revised", "change": "must not run"}]
        )
        resumed = self.resume_run(
            cancelled, events=[{"type": "resume", "actor": "orchestrator"}]
        )
        for result in (late, resumed):
            self.assertIn("terminal_immutable", rejection_codes(result))
            self.assertEqual("cancelled", result["state"])
            self.assertEqual(before["revision"], result["revision"])
            self.assertEqual(before["state_trace"], result["state_trace"])
            self.assertEqual(before["artifacts"], result["artifacts"])

    def test_spec_and_skill_keep_partial_resolution_semantics_explicit(self) -> None:
        root = Path(__file__).resolve().parents[2]
        spec = (root / "docs/ai/rules/team-execution-spec.md").read_text(
            encoding="utf-8"
        )
        skill = (root / "skills/team-task-contract/SKILL.md").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "各entryは、そのreportを記録したhistorical generationに存在したFinding identityのexact集合",
            spec,
        )
        self.assertIn(
            "後続のverified fixは個々のissueへresolution receiptを追記するだけ",
            spec,
        )
        self.assertIn("残るopen issueは保持され", spec)
        self.assertIn(
            "Preserve each failure history entry as the exact historical Finding identity set",
            skill,
        )
        self.assertIn("Resolve only the named issues", skill)
        self.assertIn("never erase unresolved siblings", skill)
