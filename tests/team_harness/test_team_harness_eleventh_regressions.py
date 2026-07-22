"""Eleventh-wave regressions for the narrowed rollback trust boundary.

These contracts intentionally rebuild the local anchor when testing an inner
integrity predicate.  That keeps each assertion focused on the mutated
receipt, source, trace, or history binding rather than accidentally passing
only because the anchor is stale.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Mapping

from test_team_harness_contract import report_event, request, sha256_digest
from test_team_harness_ninth_regressions import (
    _read_json,
    _write_json,
    committed_snapshot,
    generation_snapshots,
)
from test_team_harness_tenth_regressions import rehash_generation_chain
from test_team_harness_stop_contract import StopContractTestCase
from team_harness.state import canonical_metrics


def _manifest_digest(manifest: Mapping[str, Any]) -> str:
    return sha256_digest(
        {key: value for key, value in manifest.items() if key != "manifest_digest"}
    )


def _receipt_records(state: Mapping[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "receipt_id": item.get("receipt_id"),
            "ref": item.get("ref"),
            "digest": item.get("digest"),
            "authority_grant_digest": item.get("authority_grant_digest"),
        }
        for item in state.get("implementation_log", [])
        if isinstance(item, Mapping) and item.get("kind") == "artifact_receipt"
    ]


def _rewrite_manifests_and_anchor(runs_dir: Path, run: Mapping[str, Any]) -> None:
    """Rebuild local pointers after a deliberate inner-integrity mutation."""

    run_dir = runs_dir / str(run["run_id"])
    snapshots = generation_snapshots(runs_dir, run)
    previous_manifest: dict[str, Any] | None = None
    previous_state: dict[str, Any] | None = None
    entries: list[dict[str, Any]] = []
    for manifest, state, _ in snapshots:
        manifest = copy.deepcopy(manifest)
        if previous_manifest is not None and previous_state is not None:
            manifest["parent_generation_ref"] = previous_manifest["generation_ref"]
            manifest["parent_manifest_digest"] = previous_manifest["manifest_digest"]
            manifest["parent_state_ref"] = previous_manifest["state_ref"]
            manifest["parent_state_digest"] = previous_manifest["state_digest"]
            manifest["parent_artifact_refs"] = copy.deepcopy(previous_state["artifacts"])
        manifest["receipt_artifacts"] = _receipt_records(state)
        manifest["manifest_digest"] = _manifest_digest(manifest)
        _write_json(run_dir / str(manifest["generation_ref"]) / "commit-manifest.json", manifest)
        entries.append(
            {
                "revision": manifest["revision"],
                "generation_ref": manifest["generation_ref"],
                "manifest_digest": manifest["manifest_digest"],
                "parent_manifest_digest": manifest["parent_manifest_digest"],
            }
        )
        previous_manifest, previous_state = manifest, state
    assert previous_manifest is not None
    _write_json(run_dir / "commit-manifest.json", previous_manifest)
    anchor = {
        "schema_version": "1.0",
        "run_id": run["run_id"],
        "entries": entries,
        "high_revision": previous_manifest["revision"],
        "high_generation_ref": previous_manifest["generation_ref"],
        "high_manifest_digest": previous_manifest["manifest_digest"],
    }
    anchor["anchor_digest"] = sha256_digest(anchor)
    _write_json(run_dir / "commit-anchor.json", anchor)


class EleventhHarnessRegressionTest(StopContractTestCase):
    def _load_without_exception(self, run: Mapping[str, Any]) -> tuple[dict[str, Any] | None, str]:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
        except Exception as error:  # integrity failures must always be structured
            return None, f"raised {type(error).__name__}: {error}"
        return loaded, json.dumps(loaded, ensure_ascii=False).lower()

    def _assert_integrity_code(self, run: Mapping[str, Any], code: str) -> None:
        loaded, rendered = self._load_without_exception(run)
        self.assertIsNotNone(loaded, rendered)
        assert loaded is not None
        detail = json.dumps(loaded.get("integrity_errors", loaded), ensure_ascii=False).lower()
        self.assertEqual("blocked", loaded.get("state"), detail)
        self.assertEqual("failed", loaded.get("integrity_status"), detail)
        self.assertIn(code, detail, detail)

    def _completed_run(self, key: str) -> dict[str, Any]:
        started = self.run_request(request(idempotency_key=key))
        staged = self.stage(started)
        verified = self.resume_run(
            staged, events=[report_event(staged, "verification", "passed", phase="final")]
        )
        reviewed = self.resume_run(
            verified, events=[report_event(verified, "review", "passed", phase="final")]
        )
        completion = self.harness.facade.completion_gate(
            reviewed["run_id"], expected_revision=reviewed["revision"]
        )
        self.assertTrue(completion["complete"])
        loaded = self.harness.facade.store.load(reviewed["run_id"])
        self.assertIsNotNone(loaded)
        return loaded

    def test_rollback_trust_boundary_excludes_coordinated_root_and_anchor_rewind(self) -> None:
        """A coherent rewind by an equally privileged actor is explicitly out of scope."""

        run = self.run_request(request(idempotency_key="eleventh-coordinated-rewind"))
        current = self.resume_run(run, events=[{"type": "plan_revised", "change": "r2"}])
        current = self.resume_run(current, events=[{"type": "plan_revised", "change": "r3"}])
        snapshots = generation_snapshots(self.runs_dir, current)
        old_manifest = copy.deepcopy(snapshots[-2][0])
        run_dir = self.runs_dir / current["run_id"]
        old_entries = [
            {
                "revision": manifest["revision"],
                "generation_ref": manifest["generation_ref"],
                "manifest_digest": manifest["manifest_digest"],
                "parent_manifest_digest": manifest["parent_manifest_digest"],
            }
            for manifest, _, _ in snapshots[:-1]
        ]
        old_anchor = {
            "schema_version": "1.0",
            "run_id": current["run_id"],
            "entries": old_entries,
            "high_revision": old_manifest["revision"],
            "high_generation_ref": old_manifest["generation_ref"],
            "high_manifest_digest": old_manifest["manifest_digest"],
        }
        old_anchor["anchor_digest"] = sha256_digest(old_anchor)
        _write_json(run_dir / "commit-manifest.json", old_manifest)
        _write_json(run_dir / "commit-anchor.json", old_anchor)

        loaded, rendered = self._load_without_exception(current)
        self.assertIsNotNone(loaded, rendered)
        assert loaded is not None
        self.assertEqual("verified", loaded.get("integrity_status"), rendered)
        self.assertEqual(old_manifest["revision"], loaded.get("revision"), rendered)

    def test_anchor_only_rewind_remains_detectable_when_the_root_is_not_its_next_child(self) -> None:
        run = self.run_request(request(idempotency_key="eleventh-anchor-only-rewind"))
        current = self.resume_run(run, events=[{"type": "plan_revised", "change": "r2"}])
        current = self.resume_run(current, events=[{"type": "plan_revised", "change": "r3"}])
        snapshots = generation_snapshots(self.runs_dir, current)
        first_manifest = snapshots[0][0]
        run_dir = self.runs_dir / current["run_id"]
        anchor = {
            "schema_version": "1.0",
            "run_id": current["run_id"],
            "entries": [
                {
                    "revision": first_manifest["revision"],
                    "generation_ref": first_manifest["generation_ref"],
                    "manifest_digest": first_manifest["manifest_digest"],
                    "parent_manifest_digest": first_manifest["parent_manifest_digest"],
                }
            ],
            "high_revision": first_manifest["revision"],
            "high_generation_ref": first_manifest["generation_ref"],
            "high_manifest_digest": first_manifest["manifest_digest"],
        }
        anchor["anchor_digest"] = sha256_digest(anchor)
        _write_json(run_dir / "commit-anchor.json", anchor)
        self._assert_integrity_code(current, "commit_anchor_rollback_detected")

    def test_reserved_trace_evidence_is_generation_specific_and_replayed(self) -> None:
        run = self._completed_run("eleventh-reserved-generation-evidence")
        snapshots = generation_snapshots(self.runs_dir, run)
        reserved = set(run["execution_policy"]["reserved_states"])
        observed: list[tuple[int, Mapping[str, Any]]] = []
        for manifest, state, _ in snapshots:
            prior = snapshots[int(manifest["revision"]) - 2][1] if manifest["revision"] > 1 else {"state_trace": []}
            prior_count = len(prior["state_trace"])
            for trace in state["state_trace"][prior_count:]:
                if trace["state"] in reserved:
                    observed.append((int(manifest["revision"]), trace))
        self.assertTrue(observed)
        for revision, trace in observed:
            with self.subTest(revision=revision, state=trace["state"]):
                evidence = trace.get("reserved_evidence")
                self.assertIsInstance(evidence, Mapping)
                assert isinstance(evidence, Mapping)
                self.assertEqual(run["run_id"], evidence.get("run_id"))
                self.assertEqual(revision, evidence.get("generation_revision"))
                self.assertEqual(trace["state"], evidence.get("transition_state"))
                self.assertIn("state_digest", evidence)
                self.assertIn("artifact_digest", evidence)
                self.assertIn("report_digests", evidence)
                self.assertIn("staging_artifact_digest", evidence)
                self.assertIn("completion_report_digest", evidence)

        source_generation = next(
            manifest for manifest, state, _ in snapshots
            if state.get("state") == "source_sync"
        )

        def reuse_later_evidence(candidate: dict[str, Any]) -> None:
            entry = next(item for item in candidate["state_trace"] if item["state"] == "source_sync")
            entry["reserved_evidence"] = copy.deepcopy(run["state_trace"][-1].get("reserved_evidence"))

        rehash_generation_chain(
            self.runs_dir, run, source_generation["generation_ref"], reuse_later_evidence
        )
        _rewrite_manifests_and_anchor(self.runs_dir, run)
        self._assert_integrity_code(run, "reserved_trace_generation_evidence_invalid")

    def test_failure_history_preserves_historical_exact_set_after_partial_resolution(self) -> None:
        cause = "eleventh partial failure"
        started = self.run_request(
            request(
                idempotency_key="eleventh-partial-resolution",
                paths=["app/Http/Controllers/ExampleController.php", "app/eleventh-partial.diff"],
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "PARTIAL-A", "clause": "partial.history",
                        "location": "app/a.php", "kind": "quality", "message": cause,
                        "status": "open",
                    },
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "PARTIAL-B", "clause": "partial.history",
                        "location": "app/b.php", "kind": "quality", "message": cause,
                        "status": "open",
                    },
                ],
            )
        )
        failed = self.resume_run(
            started, events=[report_event(started, "verification", "failed", cause=cause)]
        )
        history = failed["failure_history"][-1]
        expected = copy.deepcopy(history["finding_identities"])
        fixed = self.apply_persisted_fix(
            failed, cause=cause, issue_ids=["PARTIAL-A"], path="app/eleventh-partial.diff"
        )
        reloaded = self.harness.facade.store.load(fixed["run_id"])
        self.assertIsNotNone(reloaded)
        assert reloaded is not None
        self.assertEqual("verified", reloaded["integrity_status"])
        history_after = next(
            item for item in reloaded["failure_history"]
            if item["report_digest"] == history["report_digest"]
        )
        self.assertEqual(expected, history_after["finding_identities"])
        statuses = {item["issue_id"]: item["status"] for item in reloaded["finding_catalog"]}
        self.assertEqual("resolved", statuses["PARTIAL-A"])
        self.assertEqual("open", statuses["PARTIAL-B"])
        self.assertNotEqual("implementation_approved", reloaded["state"])
        self.assertTrue(
            any(item["issue_id"] == "PARTIAL-B" for item in self.harness.facade._unresolved(reloaded))
        )

    def test_failure_history_rejects_a_duplicate_report_identity_in_a_later_generation(self) -> None:
        cause = "eleventh report identity"
        started = self.run_request(
            request(
                idempotency_key="eleventh-duplicate-history",
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "HISTORY-11", "clause": "history.identity",
                        "location": "app/history.php", "kind": "quality", "message": cause,
                        "status": "open",
                    }
                ],
            )
        )
        failed = self.resume_run(
            started, events=[report_event(started, "verification", "failed", cause=cause)]
        )
        later = self.resume_run(
            failed, events=[{"type": "plan_revised", "change": "later generation"}]
        )
        manifest, _, _ = committed_snapshot(self.runs_dir, later)
        original = copy.deepcopy(later["failure_history"][-1])

        def duplicate_history(candidate: dict[str, Any]) -> None:
            duplicate = copy.deepcopy(candidate["failure_history"][-1])
            duplicate["report_generation_ref"] = manifest["generation_ref"]
            duplicate["report_generation_revision"] = manifest["revision"]
            candidate["failure_history"].append(duplicate)
            candidate["metrics"] = canonical_metrics(candidate)

        rehash_generation_chain(self.runs_dir, later, manifest["generation_ref"], duplicate_history)
        _rewrite_manifests_and_anchor(self.runs_dir, later)
        rewritten = generation_snapshots(self.runs_dir, later)[-1][1]["failure_history"][-1]
        self.assertNotEqual(original["report_generation_ref"], rewritten["report_generation_ref"])
        self.assertNotEqual(
            original["report_generation_revision"], rewritten["report_generation_revision"]
        )
        self._assert_integrity_code(later, "failure_history_report_identity_invalid")

    def test_persisted_receipt_path_must_match_grant_contract_scope_and_ownership(self) -> None:
        started = self.run_request(
            request(
                idempotency_key="eleventh-receipt-path-scope",
                paths=["app/Http/Controllers/ExampleController.php", "app/eleventh-receipt.diff"],
            )
        )
        persisted = self.resume_run(
            started,
            events=[
                {
                    "type": "artifact",
                    "actor": self.roles(started)["writer"],
                    "authority_grant": copy.deepcopy(started["authority_grants"]["write"]["backend"]),
                    "path": "app/eleventh-receipt.diff",
                    "content": {"issue_ids": ["PATH-11"], "patch": "scoped receipt"},
                }
            ],
        )
        manifest, state, _ = committed_snapshot(self.runs_dir, persisted)
        snapshots = generation_snapshots(self.runs_dir, persisted)
        previous_state = snapshots[-2][1]
        receipt = next(item for item in state["implementation_log"] if item.get("kind") == "artifact_receipt")
        receipt_path = self.runs_dir / persisted["run_id"] / receipt["ref"]
        content = _read_json(receipt_path)
        escaped_path = "docs/eleventh-unowned-receipt.diff"
        escaped_id = "receipt-" + sha256_digest(
            {
                "run_id": persisted["run_id"],
                "actor": self.roles(started)["writer"],
                "path": escaped_path,
                "content": content,
                "artifact_revision": previous_state["artifact_revision"],
                "sequence": 1,
            }
        )[-20:]
        escaped_ref = f"{manifest['generation_ref']}/receipts/{escaped_id}.json"

        def escape_receipt(candidate: dict[str, Any]) -> None:
            target = next(item for item in candidate["implementation_log"] if item.get("kind") == "artifact_receipt")
            target.update(
                {
                    "receipt_id": escaped_id,
                    "path": escaped_path,
                    "ref": escaped_ref,
                    "digest": sha256_digest(content),
                    "authority_grant_digest": previous_state["authority_grants"]["write"]["backend"]["grant_digest"],
                    "provenance": {
                        "producer": self.roles(started)["writer"],
                        "run_id": persisted["run_id"],
                        "contract_digest": persisted["contract_digest"],
                        "plan_revision": previous_state["shared_plan"]["revision"],
                    },
                }
            )
            candidate["metrics"] = canonical_metrics(candidate)

        rehash_generation_chain(self.runs_dir, persisted, manifest["generation_ref"], escape_receipt)
        _write_json(self.runs_dir / persisted["run_id"] / escaped_ref, content)
        _rewrite_manifests_and_anchor(self.runs_dir, persisted)
        self._assert_integrity_code(persisted, "receipt_path_scope_invalid")

    def test_completion_report_is_canonical_and_binds_source_artifact_and_generation(self) -> None:
        run = self._completed_run("eleventh-completion-source-binding")
        report = run["completion_report"]
        required = {
            "schema_version", "run_id", "contract_digest", "generation_revision",
            "artifact_revision", "artifact_digest", "source_artifact_digest",
            "source_manifest_digest", "staging_artifact_digest",
            "final_verification_report_digest", "final_review_report_digest", "reasons",
            "gate", "complete",
        }
        self.assertTrue(required.issubset(report), sorted(required - set(report)))
        self.assertEqual(run["run_id"], report["run_id"])
        self.assertEqual(run["contract_digest"], report["contract_digest"])
        self.assertEqual(run["revision"], report["generation_revision"])
        self.assertEqual(run["current_artifact_digest"], report["artifact_digest"])
        self.assertEqual(run["source_sync"]["source_artifact_digest"], report["source_artifact_digest"])
        self.assertEqual(run["source_sync"]["manifest_digest"], report["source_manifest_digest"])
        self.assertEqual(run["source_sync"]["staging_artifact"]["digest"], report["staging_artifact_digest"])

        manifest, _, _ = committed_snapshot(self.runs_dir, run)

        def mutate_source_only(candidate: dict[str, Any]) -> None:
            sync = candidate["source_sync"]
            sync["source_artifact_digest"] = sha256_digest("new source artifact")
            sync["manifest_digest"] = sha256_digest(
                {key: value for key, value in sync.items() if key != "manifest_digest"}
            )

        rehash_generation_chain(self.runs_dir, run, manifest["generation_ref"], mutate_source_only)
        _rewrite_manifests_and_anchor(self.runs_dir, run)
        self._assert_integrity_code(run, "completion_source_binding_invalid")

    def test_invalid_root_manifest_schema_returns_structured_integrity_error(self) -> None:
        run = self.run_request(request(idempotency_key="eleventh-root-manifest-schema"))
        run_dir = self.runs_dir / run["run_id"]
        manifest = _read_json(run_dir / "commit-manifest.json")
        manifest["revision"] = "not-an-integer"
        manifest["manifest_digest"] = _manifest_digest(manifest)
        _write_json(run_dir / "commit-manifest.json", manifest)
        self._assert_integrity_code(run, "commit_manifest_schema_invalid")
