"""Tenth-wave regressions for authoritative replay and durable history."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Callable, Mapping
from unittest import mock

from test_team_harness_contract import (
    issued_write_grant,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_ninth_regressions import (
    _read_json,
    _write_json,
    committed_snapshot,
    generation_snapshots,
    rebuild_commit_anchor,
    write_committed_variant,
)
from test_team_harness_stop_contract import StopContractTestCase

from team_harness.state import canonical_artifact_documents, canonical_metrics


StateMutation = Callable[[dict[str, Any]], None]


def sync_canonical_artifacts(
    state: dict[str, Any], documents: dict[str, Any]
) -> None:
    documents.clear()
    documents.update(canonical_artifact_documents(state))


def rewrite_visible_manifest(
    runs_dir: Path,
    run: Mapping[str, Any],
    mutate: Callable[[dict[str, Any], Path], None],
) -> None:
    run_dir = runs_dir / str(run["run_id"])
    manifest = _read_json(run_dir / "commit-manifest.json")
    mutate(manifest, run_dir)
    manifest["manifest_digest"] = sha256_digest(
        {key: value for key, value in manifest.items() if key != "manifest_digest"}
    )
    _write_json(
        run_dir / str(manifest["generation_ref"]) / "commit-manifest.json",
        manifest,
    )
    _write_json(run_dir / "commit-manifest.json", manifest)
    rebuild_commit_anchor(runs_dir, run)


def finding_identity(finding: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "issue_id": finding.get("issue_id"),
        "clause": finding.get("clause"),
        "location": finding.get("location"),
        "source": finding.get("source"),
        "finding_digest": finding.get("digest"),
    }


def rehash_generation_chain(
    runs_dir: Path,
    run: Mapping[str, Any],
    generation_ref: str,
    mutate_state: StateMutation,
) -> None:
    """Rewrite one historical state and every forward parent binding."""

    run_dir = runs_dir / str(run["run_id"])
    snapshots = [
        (
            copy.deepcopy(manifest),
            copy.deepcopy(state),
            copy.deepcopy(artifacts),
        )
        for manifest, state, artifacts in generation_snapshots(runs_dir, run)
    ]
    target_index = next(
        index
        for index, (manifest, _, _) in enumerate(snapshots)
        if manifest["generation_ref"] == generation_ref
    )
    mutate_state(snapshots[target_index][1])
    snapshots[target_index] = (
        snapshots[target_index][0],
        snapshots[target_index][1],
        canonical_artifact_documents(snapshots[target_index][1]),
    )

    rewritten: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]] = []
    for index, (manifest, state, artifacts) in enumerate(snapshots):
        if index >= target_index:
            references = {
                str(reference["name"]): reference
                for reference in state["artifacts"]
            }
            for name, document in artifacts.items():
                reference = references[name]
                _write_json(run_dir / str(reference["path"]), document)
                artifact_digest = sha256_digest(document)
                reference["digest"] = artifact_digest
                manifest["artifact_digests"][name] = artifact_digest
            _write_json(run_dir / str(manifest["state_ref"]), state)
            manifest["state_digest"] = sha256_digest(state)
            manifest["trace_digest"] = sha256_digest(state["state_trace"])
            staging = state.get("source_sync", {}).get("staging_artifact")
            manifest["staging_artifact"] = (
                {"ref": staging["ref"], "digest": staging["digest"]}
                if isinstance(staging, Mapping)
                else None
            )
            if index > 0:
                parent_manifest, parent_state, _ = rewritten[index - 1]
                manifest["parent_generation_ref"] = parent_manifest["generation_ref"]
                manifest["parent_manifest_digest"] = parent_manifest["manifest_digest"]
                manifest["parent_state_ref"] = parent_manifest["state_ref"]
                manifest["parent_state_digest"] = parent_manifest["state_digest"]
                manifest["parent_artifact_refs"] = copy.deepcopy(
                    parent_state["artifacts"]
                )
            manifest["manifest_digest"] = sha256_digest(
                {
                    key: value
                    for key, value in manifest.items()
                    if key != "manifest_digest"
                }
            )
            _write_json(
                run_dir / str(manifest["generation_ref"]) / "commit-manifest.json",
                manifest,
            )
        rewritten.append((manifest, state, artifacts))
    _write_json(run_dir / "commit-manifest.json", rewritten[-1][0])
    rebuild_commit_anchor(runs_dir, run)


class TenthHarnessRegressionTest(StopContractTestCase):
    def _integrity_is_blocked(
        self, run: Mapping[str, Any]
    ) -> tuple[bool, str]:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
            resumed = self.resume_run(run, events=[])
        except Exception as error:  # report fixture/runtime leaks as a failure, never Error
            return False, f"raised {type(error).__name__}: {error}"
        blocked = bool(
            isinstance(loaded, Mapping)
            and loaded.get("state") == "blocked"
            and loaded.get("integrity_status") == "failed"
            and isinstance(resumed, Mapping)
            and resumed.get("state") == "blocked"
        )
        return blocked, json.dumps(loaded, ensure_ascii=False).lower()

    def _artifact_run(
        self, key: str
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
        path = "app/tenth-receipt.diff"
        started = self.run_request(
            request(
                idempotency_key=key,
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    path,
                    "app/tenth-forged-receipt.diff",
                ],
            )
        )
        content = {
            "issue_ids": ["ISSUE-10"],
            "check_ids": ["unit-10"],
            "deliverable_ids": ["deliverable-10"],
            "patch": "canonical tenth receipt",
        }
        persisted = self.resume_run(
            started,
            events=[
                {
                    "type": "artifact",
                    "actor": self.roles(started)["writer"],
                    "authority_grant": issued_write_grant(started),
                    "path": path,
                    "content": content,
                }
            ],
        )
        return started, persisted, content

    def _failure_run(self, key: str) -> dict[str, Any]:
        findings = (
            ("DUP-10", "cause-ten", "cause-clause", "app/cause-ten.php"),
            ("OTHER-10", "unrelated", "other-clause", "app/other-ten.php"),
            ("DUP-10", "same-id-other", "same-id-clause", "app/same-id-ten.php"),
        )
        started = self.run_request(
            request(
                idempotency_key=key,
                events=[
                    {
                        "type": "finding",
                        "actor": "reviewer",
                        "source": "reviewer",
                        "issue_id": issue_id,
                        "clause": clause,
                        "location": location,
                        "kind": "architecture",
                        "message": message,
                        "status": "open",
                    }
                    for issue_id, message, clause, location in findings
                ],
            )
        )
        return self.resume_run(
            started,
            events=[
                report_event(
                    started, "verification", "failed", cause="cause-ten"
                )
            ],
        )

    def test_artifact_receipt_metadata_is_reprojected_from_raw_grant_and_generation(self) -> None:
        problems: list[str] = []
        started, persisted, content = self._artifact_run("tenth-receipt-canonical")
        receipt = next(
            item
            for item in persisted["implementation_log"]
            if item.get("kind") == "artifact_receipt"
        )
        manifest, state, artifacts = committed_snapshot(self.runs_dir, persisted)
        expected_receipt_id = "receipt-" + sha256_digest(
            {
                "run_id": started["run_id"],
                "actor": self.roles(started)["writer"],
                "path": "app/tenth-receipt.diff",
                "content": content,
                "artifact_revision": started["artifact_revision"],
                "sequence": len(started["implementation_log"]) + 1,
            }
        )[-20:]
        expected = {
            "receipt_id": expected_receipt_id,
            "kind": "artifact_receipt",
            "path": "app/tenth-receipt.diff",
            "ref": (
                f"{manifest['generation_ref']}/receipts/{expected_receipt_id}.json"
            ),
            "digest": sha256_digest(content),
            "raw_content_persisted": True,
            "authority_grant_digest": issued_write_grant(started)["grant_digest"],
            "issued_by": "team_harness",
            "issue_ids": content["issue_ids"],
            "check_ids": content["check_ids"],
            "deliverable_ids": content["deliverable_ids"],
            "provenance": {
                "producer": self.roles(started)["writer"],
                "run_id": started["run_id"],
                "contract_digest": started["contract_digest"],
                "plan_revision": started["shared_plan"]["revision"],
            },
        }
        if receipt != expected:
            problems.append("persisted receipt is not the exact canonical raw projection")

        def forge_metadata(candidate: dict[str, Any]) -> None:
            forged = next(
                item
                for item in candidate["implementation_log"]
                if item.get("kind") == "artifact_receipt"
            )
            forged.update(
                {
                    "receipt_id": "receipt-forged-metadata-10",
                    "path": "app/tenth-forged-receipt.diff",
                    "ref": f"{manifest['generation_ref']}/receipts/receipt-forged-metadata-10.json",
                    "authority_grant_digest": sha256_digest("caller grant"),
                    "issue_ids": ["FORGED-ISSUE-10"],
                    "check_ids": ["forged-check-10"],
                    "deliverable_ids": ["forged-deliverable-10"],
                    "provenance": {
                        "producer": "reviewer",
                        "run_id": candidate["run_id"],
                        "contract_digest": candidate["contract_digest"],
                        "plan_revision": candidate["shared_plan"]["revision"],
                    },
                }
            )
            candidate["metrics"] = canonical_metrics(candidate)

        write_committed_variant(
            self.runs_dir,
            persisted,
            manifest,
            state,
            artifacts,
            forge_metadata,
            sync_canonical_artifacts,
        )
        run_dir = self.runs_dir / persisted["run_id"]
        forged_ref = (
            f"{manifest['generation_ref']}/receipts/receipt-forged-metadata-10.json"
        )
        _write_json(run_dir / forged_ref, content)

        def bind_forged_metadata(
            visible: dict[str, Any], _: Path
        ) -> None:
            visible["receipt_artifacts"] = [
                {
                    "receipt_id": "receipt-forged-metadata-10",
                    "ref": forged_ref,
                    "digest": sha256_digest(content),
                    "authority_grant_digest": sha256_digest("caller grant"),
                }
            ]

        rewrite_visible_manifest(
            self.runs_dir, persisted, bind_forged_metadata
        )
        blocked, detail = self._integrity_is_blocked(persisted)
        if not blocked:
            problems.append(f"forged receipt metadata was accepted: {detail[:220]}")
        if "receipt_path_scope_invalid" not in detail:
            problems.append(
                "forged receipt metadata did not reach receipt path scope validation: "
                + detail[:220]
            )

        _, append_run, append_content = self._artifact_run(
            "tenth-receipt-append"
        )
        append_manifest, append_state, append_artifacts = committed_snapshot(
            self.runs_dir, append_run
        )
        forged_id = "receipt-forged-append-10"
        forged_ref = (
            f"{append_manifest['generation_ref']}/receipts/{forged_id}.json"
        )

        def append_forged(candidate: dict[str, Any]) -> None:
            original = next(
                item
                for item in candidate["implementation_log"]
                if item.get("kind") == "artifact_receipt"
            )
            forged = copy.deepcopy(original)
            forged["receipt_id"] = forged_id
            forged["ref"] = forged_ref
            candidate["implementation_log"].append(forged)
            candidate["metrics"] = canonical_metrics(candidate)

        write_committed_variant(
            self.runs_dir,
            append_run,
            append_manifest,
            append_state,
            append_artifacts,
            append_forged,
            sync_canonical_artifacts,
        )
        append_dir = self.runs_dir / append_run["run_id"]
        _write_json(append_dir / forged_ref, append_content)

        def append_manifest_receipt(
            visible: dict[str, Any], _: Path
        ) -> None:
            original = visible["receipt_artifacts"][0]
            forged = copy.deepcopy(original)
            forged["receipt_id"] = forged_id
            forged["ref"] = forged_ref
            visible["receipt_artifacts"].append(forged)

        rewrite_visible_manifest(
            self.runs_dir, append_run, append_manifest_receipt
        )
        blocked, detail = self._integrity_is_blocked(append_run)
        if not blocked:
            problems.append(f"appended forged receipt was accepted: {detail[:220]}")
        if "receipt metadata is not the canonical raw/grant projection" not in detail:
            problems.append(
                "appended forged receipt did not reach canonical receipt validation: "
                + detail[:220]
            )
        self.assertEqual([], problems)

    def test_failure_history_is_one_to_one_with_report_cause_findings(self) -> None:
        problems: list[str] = []
        failed = self._failure_run("tenth-failure-history")
        manifest, state, artifacts = committed_snapshot(self.runs_dir, failed)
        cause = failed["failure_history"][-1]["cause"]
        expected_findings = [
            item
            for item in failed["findings"]
            if str(item["message"]).strip().lower() == cause
            or str(item["issue_id"]).strip().lower() == cause
        ]
        expected_identities = [finding_identity(item) for item in expected_findings]
        history = failed["failure_history"][-1]
        if history["finding_identities"] != expected_identities:
            problems.append("baseline failure identities are not cause-derived")
        if history["issue_ids"] != sorted(
            {str(item["issue_id"]) for item in expected_findings}
        ):
            problems.append("baseline failure issue set is not cause-derived")

        def duplicate_history(candidate: dict[str, Any]) -> None:
            candidate["failure_history"].append(
                copy.deepcopy(candidate["failure_history"][-1])
            )
            candidate["metrics"] = canonical_metrics(candidate)

        def add_unrelated_identity(candidate: dict[str, Any]) -> None:
            unrelated = next(
                item for item in candidate["findings"]
                if item["issue_id"] == "OTHER-10"
            )
            candidate["failure_history"][-1]["finding_identities"].append(
                finding_identity(unrelated)
            )
            candidate["failure_history"][-1]["issue_ids"].append("OTHER-10")

        def swap_same_issue_identity(candidate: dict[str, Any]) -> None:
            other = next(
                item for item in candidate["findings"]
                if item["issue_id"] == "DUP-10"
                and item["message"] == "same-id-other"
            )
            candidate["failure_history"][-1]["finding_identities"] = [
                finding_identity(other)
            ]

        corruptions: tuple[tuple[str, StateMutation], ...] = (
            ("duplicate report/history", duplicate_history),
            ("unrelated finding identity", add_unrelated_identity),
            ("same issue different identity", swap_same_issue_identity),
        )
        for label, mutation in corruptions:
            write_committed_variant(
                self.runs_dir,
                failed,
                manifest,
                state,
                artifacts,
                mutation,
                sync_canonical_artifacts,
            )
            blocked, detail = self._integrity_is_blocked(failed)
            if not blocked:
                problems.append(f"{label} was accepted: {detail[:200]}")
            if "failure_history_report_identity_invalid" not in detail:
                problems.append(
                    f"{label} did not reach the failure-history identity validator: "
                    f"{detail[:200]}"
                )
        self.assertEqual([], problems)

    def test_nonblocked_formed_team_replay_rejects_an_exactly_empty_projection(self) -> None:
        problems: list[str] = []
        run = self.run_request(request(idempotency_key="tenth-empty-team"))
        manifest, state, artifacts = committed_snapshot(self.runs_dir, run)

        def empty_team(candidate: dict[str, Any]) -> None:
            candidate["team"] = []
            candidate["selection"] = {
                "writer": None,
                "fallback": None,
                "eligible_writers": [],
            }
            candidate["write_ownership"] = []
            candidate["authority_grants"] = {
                "write": {},
                "quality": {"initial": {}, "final": {}},
            }
            candidate["runtime"]["profiles"] = {}
            candidate["shared_plan"]["waves"] = []
            candidate["shared_plan"]["fallback"] = None
            candidate["thread_count"] = 0
            candidate["write_authorized"] = False
            candidate["metrics"] = canonical_metrics(candidate)

        write_committed_variant(
            self.runs_dir,
            run,
            manifest,
            state,
            artifacts,
            empty_team,
            sync_canonical_artifacts,
        )
        blocked, detail = self._integrity_is_blocked(run)
        if not blocked:
            problems.append(
                "formed nonblocked Run State accepted an empty team replay: "
                + detail[:260]
            )
        self.assertEqual([], problems)

    def test_schema_failure_short_circuits_semantics_and_never_leaks_exceptions(self) -> None:
        problems: list[str] = []
        run = self.run_request(request(idempotency_key="tenth-schema-short-circuit"))
        manifest, state, artifacts = committed_snapshot(self.runs_dir, run)

        def invalid_thread_count(candidate: dict[str, Any]) -> None:
            candidate["thread_count"] = "three"

        write_committed_variant(
            self.runs_dir,
            run,
            manifest,
            state,
            artifacts,
            invalid_thread_count,
            sync_canonical_artifacts,
        )
        with mock.patch(
            "team_harness.storage.validate_run_state_semantics",
            side_effect=AssertionError("semantic validator ran after schema failure"),
        ) as semantic:
            try:
                loaded = self.harness.facade.store.load(run["run_id"])
            except Exception as error:
                problems.append(
                    f"schema-invalid load leaked {type(error).__name__}: {error}"
                )
                loaded = None
            if semantic.call_count:
                problems.append("semantic validator ran after a schema validation failure")
            if not (
                isinstance(loaded, Mapping)
                and loaded.get("state") == "blocked"
                and loaded.get("integrity_status") == "failed"
            ):
                problems.append("schema-invalid state was not a structured integrity block")

        invalid_shapes: tuple[tuple[str, StateMutation], ...] = (
            (
                "task_contract_type",
                lambda candidate: candidate.update({"task_contract": []}),
            ),
            (
                "trace_shape",
                lambda candidate: candidate.update(
                    {"state_trace": {"sequence": "not-an-array"}}
                ),
            ),
            (
                "authority_shape",
                lambda candidate: candidate.update({"authority_grants": []}),
            ),
        )
        for label, mutation in invalid_shapes:
            write_committed_variant(
                self.runs_dir,
                run,
                manifest,
                state,
                artifacts,
                mutation,
                sync_canonical_artifacts,
            )
            try:
                loaded = self.harness.facade.store.load(run["run_id"])
            except Exception as error:
                problems.append(
                    f"{label} leaked {type(error).__name__}: {error}"
                )
                continue
            if not (
                isinstance(loaded, Mapping)
                and loaded.get("state") == "blocked"
                and loaded.get("integrity_status") == "failed"
            ):
                problems.append(f"{label} did not fail closed structurally")
        self.assertEqual([], problems)

    def test_root_pointer_rollback_is_detected_without_rejecting_crash_orphans(self) -> None:
        problems: list[str] = []
        run = self.run_request(request(idempotency_key="tenth-root-rollback"))
        run = self.resume_run(
            run,
            events=[{"type": "plan_revised", "change": "revision two"}],
        )
        run = self.resume_run(
            run,
            events=[{"type": "plan_revised", "change": "revision three"}],
        )
        snapshots = generation_snapshots(self.runs_dir, run)
        old_manifest = snapshots[-2][0]
        run_dir = self.runs_dir / run["run_id"]
        _write_json(run_dir / "commit-manifest.json", old_manifest)
        try:
            rolled_back = self.harness.facade.store.load(run["run_id"])
        except Exception as error:
            problems.append(f"rollback detection leaked {type(error).__name__}: {error}")
            rolled_back = None
        if not (
            isinstance(rolled_back, Mapping)
            and rolled_back.get("state") == "blocked"
            and rolled_back.get("integrity_status") == "failed"
        ):
            problems.append("root pointer accepted an older valid committed manifest")

        orphan_run = self.run_request(request(idempotency_key="tenth-crash-orphan"))
        changed = copy.deepcopy(orphan_run)
        changed["human_summary"] = "uncommitted crash orphan"
        try:
            self.harness.facade.store.save(
                changed,
                expected_revision=orphan_run["revision"],
                crash_at="before_commit_manifest_swap",
            )
            problems.append("crash fixture unexpectedly swapped its root pointer")
        except RuntimeError:
            pass
        except Exception as error:
            problems.append(
                f"crash orphan fixture raised unexpected {type(error).__name__}: {error}"
            )
        try:
            loaded_orphan = self.harness.facade.store.load(orphan_run["run_id"])
        except Exception as error:
            problems.append(f"crash orphan load leaked {type(error).__name__}: {error}")
            loaded_orphan = None
        if not (
            isinstance(loaded_orphan, Mapping)
            and loaded_orphan.get("revision") == orphan_run["revision"]
            and loaded_orphan.get("integrity_status") == "verified"
        ):
            problems.append("uncommitted crash orphan was confused with pointer rollback")
        self.assertEqual([], problems)

    def test_persisted_reserved_trace_replays_the_same_dedicated_evidence_gates(self) -> None:
        problems: list[str] = []
        run = self.run_request(request(idempotency_key="tenth-trace-gates"))
        manifest, state, artifacts = committed_snapshot(self.runs_dir, run)
        paths: dict[str, list[str]] = {
            "implementation_approved": [
                "verifying", "reviewing", "implementation_approved"
            ],
            "source_sync": [
                "verifying", "reviewing", "implementation_approved", "source_sync"
            ],
            "final_verification": [
                "verifying", "reviewing", "implementation_approved",
                "source_sync", "final_verification",
            ],
            "final_review": [
                "verifying", "reviewing", "implementation_approved",
                "source_sync", "final_verification", "final_review",
            ],
            "completed": [
                "verifying", "reviewing", "implementation_approved", "source_sync",
                "final_verification", "final_review", "completed",
            ],
            "blocked": ["blocked"],
            "failed": ["verifying", "failed"],
            "needs_human_approval": ["needs_human_approval"],
            "cancelled": ["cancelled"],
        }

        def forge_trace(targets: list[str]) -> StateMutation:
            def mutate(candidate: dict[str, Any]) -> None:
                source = candidate["state"]
                for target in targets:
                    entry = {
                        "sequence": len(candidate["state_trace"]) + 1,
                        "from": source,
                        "state": target,
                        "actor": "orchestrator",
                        "reason": "caller-rehashed reserved transition",
                    }
                    entry["evidence_digest"] = sha256_digest(entry)
                    candidate["state_trace"].append(entry)
                    source = target
                candidate["state"] = source
                candidate["metrics"] = canonical_metrics(candidate)

            return mutate

        for label, targets in paths.items():
            write_committed_variant(
                self.runs_dir,
                run,
                manifest,
                state,
                artifacts,
                forge_trace(targets),
                sync_canonical_artifacts,
            )
            blocked, detail = self._integrity_is_blocked(run)
            if not blocked:
                problems.append(
                    f"reserved {label} trace bypassed its evidence gate: {detail[:180]}"
                )
            if "reserved_trace_generation_evidence_invalid" not in detail:
                problems.append(
                    f"reserved {label} trace did not reach the reserved-evidence "
                    f"validator: {detail[:180]}"
                )
        self.assertEqual([], problems)

    def test_every_historical_staging_file_is_contained_present_and_digest_bound(self) -> None:
        problems: list[str] = []
        run = self.run_request(request(idempotency_key="tenth-historical-staging"))
        staged = self.stage(run)
        reset = self.resume_run(
            staged,
            events=[{"type": "plan_revised", "change": "reset current staging"}],
        )
        if reset["source_sync"]["staging_artifact"] is not None:
            problems.append("staging reset fixture retained a current staging artifact")
        snapshots = generation_snapshots(self.runs_dir, reset)
        staging_manifest, staging_state, _ = next(
            item
            for item in snapshots
            if item[1].get("source_sync", {}).get("accepted") is True
        )
        staging = staging_state["source_sync"]["staging_artifact"]
        run_dir = self.runs_dir / reset["run_id"]
        staging_path = run_dir / staging["ref"]
        original_bytes = staging_path.read_bytes()

        staging_path.unlink()
        blocked, detail = self._integrity_is_blocked(reset)
        if not blocked:
            problems.append(f"deleted historical staging file was accepted: {detail[:180]}")
        staging_path.write_bytes(original_bytes)

        changed_document = json.loads(original_bytes.decode("utf-8"))
        changed_document["payload"] = {"changes": ["historical tamper"]}
        _write_json(staging_path, changed_document)
        blocked, detail = self._integrity_is_blocked(reset)
        if not blocked:
            problems.append(f"changed historical staging file was accepted: {detail[:180]}")
        staging_path.write_bytes(original_bytes)

        outside = Path(self.temporary_directory.name) / "outside-staging"
        outside.mkdir()
        link = run_dir / "historical-staging-link"
        link.symlink_to(outside, target_is_directory=True)

        def escape_historical_staging(candidate: dict[str, Any]) -> None:
            source_sync = candidate["source_sync"]
            escaped = source_sync["staging_artifact"]
            escaped["ref"] = "historical-staging-link/source-update.json"
            escaped["digest"] = sha256_digest(
                {key: value for key, value in escaped.items() if key != "digest"}
            )
            source_sync["manifest_digest"] = sha256_digest(
                {
                    key: value
                    for key, value in source_sync.items()
                    if key != "manifest_digest"
                }
            )

        rehash_generation_chain(
            self.runs_dir,
            reset,
            staging_manifest["generation_ref"],
            escape_historical_staging,
        )
        escaped_state = next(
            state
            for manifest, state, _ in generation_snapshots(self.runs_dir, reset)
            if manifest["generation_ref"] == staging_manifest["generation_ref"]
        )
        _write_json(
            outside / "source-update.json",
            escaped_state["source_sync"]["staging_artifact"],
        )
        blocked, detail = self._integrity_is_blocked(reset)
        if not blocked:
            problems.append(f"escaping historical staging ref was accepted: {detail[:180]}")
        self.assertEqual([], problems)
