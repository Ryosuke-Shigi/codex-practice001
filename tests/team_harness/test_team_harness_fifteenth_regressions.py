"""Fifteenth-wave regressions for exact reserved causes and inactive source."""

from __future__ import annotations

import ast
import copy
import json
from pathlib import Path
from typing import Any, Callable, Mapping

from test_team_harness_contract import (
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_eleventh_regressions import _rewrite_manifests_and_anchor
from test_team_harness_ninth_regressions import _write_json, generation_snapshots
from test_team_harness_stop_contract import StopContractTestCase
from test_team_harness_tenth_regressions import rehash_generation_chain
from test_team_harness_thirteenth_regressions import (
    _bind_generation_reserved_evidence,
)
from team_harness.schema import validate_document
from team_harness.contracts import canonical_rejected_task_contract
from team_harness.state import canonical_completion_projection, canonical_metrics


class FifteenthHarnessRegressionTest(StopContractTestCase):
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

    def _assert_latest_reserved_kind(
        self, run: Mapping[str, Any], expected: str
    ) -> None:
        trace = run["state_trace"][-1]
        evidence = trace.get("reserved_evidence")
        self.assertIsInstance(evidence, Mapping)
        assert isinstance(evidence, Mapping)
        causality = evidence.get("transition_evidence", {}).get(
            "target_causality", {}
        )
        self.assertEqual(expected, causality.get("kind"))

    def _rehash_latest(
        self,
        run: Mapping[str, Any],
        mutate: Callable[[dict[str, Any]], None],
    ) -> None:
        snapshots = generation_snapshots(self.runs_dir, run)
        manifest = snapshots[-1][0]
        prior = copy.deepcopy(snapshots[-2][1]) if len(snapshots) > 1 else {}

        def rebind(candidate: dict[str, Any]) -> None:
            mutate(candidate)
            candidate["completion_report"] = canonical_completion_projection(
                candidate,
                generation_revision=None,
                complete=False,
                gate="not_evaluated",
                reasons=[],
            )
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_generation_reserved_evidence(
                candidate, prior, int(manifest["revision"])
            )

        rehash_generation_chain(
            self.runs_dir, run, str(manifest["generation_ref"]), rebind
        )
        _rewrite_manifests_and_anchor(self.runs_dir, run)

    def test_initial_blocker_requires_the_exact_generation_rejection_and_blocker_set(
        self,
    ) -> None:
        blocked = self.run_request(
            request(
                "Require independent backend and frontend writers",
                domains=["backend", "frontend"],
                capabilities=["php", "react"],
                paths=[
                    "app/Services/FifteenthService.php",
                    "resources/js/Pages/Fifteenth.tsx",
                ],
                idempotency_key="fifteenth-initial-blocker-exact",
            )
        )
        self.assertEqual("blocked", blocked["state"])
        positive = self.harness.facade.store.load(blocked["run_id"])
        self.assertIsNotNone(positive)
        assert positive is not None
        self.assertEqual(
            "verified",
            positive["integrity_status"],
            json.dumps(positive.get("integrity_errors", []), ensure_ascii=False),
        )
        self._assert_latest_reserved_kind(positive, "initial_blocker")

        def add_unrelated_initial_problems(candidate: dict[str, Any]) -> None:
            candidate["rejections"].append(
                {
                    "code": "unrelated_initial_rejection",
                    "message": "unrelated rejection added to the initial generation",
                }
            )
            candidate["blockers"].append(
                {
                    "code": "unrelated_initial_blocker",
                    "message": "unrelated blocker added to the initial generation",
                }
            )

        self._rehash_latest(blocked, add_unrelated_initial_problems)
        self._assert_integrity_code(
            blocked, "reserved_trace_generation_evidence_invalid"
        )

    def test_public_batch_finding_conflict_rejects_an_unrelated_finding_identity(
        self,
    ) -> None:
        conflict_identity = {
            "issue_id": "FIFTEENTH-CONFLICT",
            "clause": "architecture.boundary",
            "location": "app/FifteenthService.php:15",
        }
        conflicting_findings = [
            {
                "type": "finding",
                "actor": "reviewer",
                "source": "reviewer",
                **conflict_identity,
                "kind": "design",
                "message": "reject the boundary",
                "position": "reject",
                "status": "open",
            },
            {
                "type": "finding",
                "actor": "verifier",
                "source": "verifier",
                **conflict_identity,
                "kind": "quality",
                "message": "approve the boundary",
                "position": "approve",
                "status": "open",
            },
        ]
        positive = self.run_request(
            request(
                idempotency_key="fifteenth-finding-conflict-positive",
                events=copy.deepcopy(conflicting_findings),
            )
        )
        self.assertEqual("needs_human_approval", positive["state"])
        loaded = self.harness.facade.store.load(positive["run_id"])
        self.assertIsNotNone(loaded)
        assert loaded is not None
        self.assertEqual("verified", loaded["integrity_status"])
        self._assert_latest_reserved_kind(loaded, "finding_conflict")
        self.assertEqual(
            {tuple(conflict_identity.values())},
            {
                (item["issue_id"], item["clause"], item["location"])
                for item in loaded["findings"]
            },
        )

        unrelated = {
            "type": "finding",
            "actor": "reviewer",
            "source": "reviewer",
            "issue_id": "FIFTEENTH-UNRELATED",
            "clause": "quality.unrelated",
            "location": "tests/unrelated.php:1",
            "kind": "quality",
            "message": "unrelated public-batch finding",
            "position": "approve",
            "status": "open",
        }
        started = self.run_request(
            request(idempotency_key="fifteenth-finding-conflict-mixed")
        )
        before = self.harness.facade.store.load(started["run_id"])
        self.assertIsNotNone(before)
        assert before is not None
        before_generations = [
            manifest["generation_ref"]
            for manifest, _, _ in generation_snapshots(self.runs_dir, started)
        ]
        try:
            rejected = self.resume_run(
                started,
                events=[*copy.deepcopy(conflicting_findings), unrelated],
            )
        except Exception as error:
            self.fail(
                "mixed Finding conflict batch raised "
                f"{type(error).__name__}: {error}"
            )
        self.assertIn(
            "event_batch_after_reserved",
            {
                item.get("code")
                for item in rejected.get("rejections", [])
                if isinstance(item, Mapping)
            },
        )
        after = self.harness.facade.store.load(started["run_id"])
        self.assertIsNotNone(after)
        assert after is not None
        self.assertEqual("verified", after["integrity_status"])
        self.assertEqual(before["state"], after["state"])
        self.assertEqual(before["findings"], after["findings"])
        self.assertEqual(before["revision"], after["revision"])
        self.assertEqual(
            before_generations,
            [
                manifest["generation_ref"]
                for manifest, _, _ in generation_snapshots(self.runs_dir, started)
            ],
        )

        interrupt_positive_started = self.run_request(
            request(idempotency_key="fifteenth-interrupt-positive")
        )
        interrupt_positive = self.resume_run(
            interrupt_positive_started,
            events=[{"type": "interrupt"}],
        )
        self.assertEqual("blocked", interrupt_positive["state"])
        interrupt_positive_loaded = self.harness.facade.store.load(
            interrupt_positive["run_id"]
        )
        self.assertIsNotNone(interrupt_positive_loaded)
        assert interrupt_positive_loaded is not None
        self.assertEqual("verified", interrupt_positive_loaded["integrity_status"])
        self._assert_latest_reserved_kind(interrupt_positive_loaded, "interrupt")

        new_interrupt_positive = self.run_request(
            request(
                idempotency_key="fifteenth-new-interrupt-positive",
                events=[{"type": "interrupt"}],
            )
        )
        self.assertEqual("blocked", new_interrupt_positive["state"])
        new_interrupt_loaded = self.harness.facade.store.load(
            new_interrupt_positive["run_id"]
        )
        self.assertIsNotNone(new_interrupt_loaded)
        assert new_interrupt_loaded is not None
        self.assertEqual("verified", new_interrupt_loaded["integrity_status"])
        self._assert_latest_reserved_kind(new_interrupt_loaded, "interrupt")
        self.assertTrue(
            self.harness.facade.store.has_run(new_interrupt_positive["run_id"])
        )
        self.assertTrue(
            self.runs_dir.joinpath(new_interrupt_positive["run_id"]).is_dir()
        )
        self.assertEqual(
            1,
            len(
                generation_snapshots(
                    self.runs_dir, new_interrupt_positive
                )
            ),
        )

        source_request_fixture = self.run_request(
            request(idempotency_key="fifteenth-reserved-request-fixture")
        )
        rejected_source_request = self.source_request(source_request_fixture)
        self.assertEqual(
            [], validate_document("source_sync_request", rejected_source_request)
        )

        # Request processing follows event processing. A valid interrupt plus a
        # schema-valid source request must therefore be preflighted as one exact
        # atomic batch before either a new generation or an orphan can exist.
        request_batch_violations: list[str] = []
        new_request_rejected: Mapping[str, Any] | None = None
        try:
            new_request_rejected = self.run_request(
                request(
                    idempotency_key="fifteenth-new-interrupt-source-request",
                    events=[{"type": "interrupt"}],
                    source_sync_request=copy.deepcopy(rejected_source_request),
                )
            )
        except Exception as error:
            request_batch_violations.append(
                "new-run interrupt plus source request raised "
                f"{type(error).__name__}: {error}"
            )
        if isinstance(new_request_rejected, Mapping):
            if "event_batch_after_reserved" not in {
                item.get("code")
                for item in new_request_rejected.get("rejections", [])
                if isinstance(item, Mapping)
            }:
                request_batch_violations.append(
                    "new-run did not return event_batch_after_reserved"
                )
            if new_request_rejected.get("state") != "implementing":
                request_batch_violations.append(
                    "new-run did not return the pre-commit implementing state"
                )
            if new_request_rejected.get("findings") != []:
                request_batch_violations.append(
                    "new-run returned committed Finding evidence"
                )
            if new_request_rejected.get("revision") != 0:
                request_batch_violations.append(
                    "new-run returned a committed revision"
                )
            new_request_run_id = str(new_request_rejected.get("run_id"))
            new_request_run_dir = self.runs_dir / new_request_run_id
            if self.harness.facade.store.has_run(new_request_run_id):
                request_batch_violations.append("new-run created a commit pointer")
            if self.harness.facade.store.load(new_request_run_id) is not None:
                request_batch_violations.append("new-run became loadable")
            if new_request_run_dir.exists():
                request_batch_violations.append("new-run created a run directory")
            if generation_snapshots(self.runs_dir, new_request_rejected):
                request_batch_violations.append("new-run created a generation")
            if list(self.runs_dir.glob(f"{new_request_run_id}*")):
                request_batch_violations.append(
                    "new-run left a run-scoped orphan"
                )

        resume_request_started = self.run_request(
            request(idempotency_key="fifteenth-resume-interrupt-source-request")
        )
        resume_request_before = self.harness.facade.store.load(
            resume_request_started["run_id"]
        )
        self.assertIsNotNone(resume_request_before)
        assert resume_request_before is not None
        resume_request_run_dir = self.runs_dir / resume_request_started["run_id"]
        resume_request_generation_dirs = {
            path.name
            for path in resume_request_run_dir.joinpath("generations").iterdir()
            if path.is_dir()
        }
        resume_request_generation_refs = [
            manifest["generation_ref"]
            for manifest, _, _ in generation_snapshots(
                self.runs_dir, resume_request_started
            )
        ]
        resume_request_rejected: Mapping[str, Any] | None = None
        try:
            resume_request_rejected = self.resume_run(
                resume_request_started,
                events=[{"type": "interrupt"}],
                source_sync_request=copy.deepcopy(rejected_source_request),
            )
        except Exception as error:
            request_batch_violations.append(
                "resume interrupt plus source request raised "
                f"{type(error).__name__}: {error}"
            )
        if isinstance(resume_request_rejected, Mapping):
            if "event_batch_after_reserved" not in {
                item.get("code")
                for item in resume_request_rejected.get("rejections", [])
                if isinstance(item, Mapping)
            }:
                request_batch_violations.append(
                    "resume did not return event_batch_after_reserved"
                )
            for field in ("state", "findings", "revision"):
                if resume_request_rejected.get(field) != resume_request_before.get(
                    field
                ):
                    request_batch_violations.append(
                        f"resume returned a mutated {field}"
                    )
        resume_request_after = self.harness.facade.store.load(
            resume_request_started["run_id"]
        )
        if not isinstance(resume_request_after, Mapping):
            request_batch_violations.append("resume removed the committed run")
        else:
            if resume_request_after.get("integrity_status") != "verified":
                request_batch_violations.append(
                    "resume left the committed run integrity-invalid"
                )
            for field in ("state", "findings", "revision"):
                if resume_request_after.get(field) != resume_request_before.get(field):
                    request_batch_violations.append(
                        f"resume persisted a mutated {field}"
                    )
        if resume_request_generation_refs != [
            manifest["generation_ref"]
            for manifest, _, _ in generation_snapshots(
                self.runs_dir, resume_request_started
            )
        ]:
            request_batch_violations.append(
                "resume changed the committed generation refs"
            )
        if resume_request_generation_dirs != {
            path.name
            for path in resume_request_run_dir.joinpath("generations").iterdir()
            if path.is_dir()
        }:
            request_batch_violations.append(
                "resume changed the generation directory set"
            )
        self.assertEqual(
            [], request_batch_violations, "; ".join(request_batch_violations)
        )

        # Regression evidence: before the shared exact preflight, a new-run
        # interrupt→Finding batch returned a rejection but still committed its
        # initial generation. Both orders must now remain wholly pre-commit.
        for order, events in (
            ("finding-before-interrupt", [unrelated, {"type": "interrupt"}]),
            ("interrupt-before-finding", [{"type": "interrupt"}, unrelated]),
        ):
            with self.subTest(new_run_reserved_batch_order=order):
                try:
                    new_rejected = self.run_request(
                        request(
                            idempotency_key=(
                                f"fifteenth-new-reserved-batch-{order}"
                            ),
                            events=copy.deepcopy(events),
                        )
                    )
                except Exception as error:
                    self.fail(
                        f"new-run {order} reserved batch raised "
                        f"{type(error).__name__}: {error}"
                    )
                self.assertIn(
                    "event_batch_after_reserved",
                    {
                        item.get("code")
                        for item in new_rejected.get("rejections", [])
                        if isinstance(item, Mapping)
                    },
                )
                self.assertEqual("implementing", new_rejected["state"])
                self.assertEqual([], new_rejected["findings"])
                self.assertEqual(0, new_rejected["revision"])
                new_run_id = str(new_rejected["run_id"])
                self.assertFalse(self.harness.facade.store.has_run(new_run_id))
                self.assertIsNone(self.harness.facade.store.load(new_run_id))
                self.assertFalse(self.runs_dir.joinpath(new_run_id).exists())
                self.assertEqual(
                    [], generation_snapshots(self.runs_dir, new_rejected)
                )

        for order, events in (
            ("finding-before-interrupt", [unrelated, {"type": "interrupt"}]),
            ("interrupt-before-finding", [{"type": "interrupt"}, unrelated]),
        ):
            with self.subTest(reserved_batch_order=order):
                reserved_started = self.run_request(
                    request(
                        idempotency_key=f"fifteenth-reserved-batch-{order}"
                    )
                )
                reserved_before = self.harness.facade.store.load(
                    reserved_started["run_id"]
                )
                self.assertIsNotNone(reserved_before)
                assert reserved_before is not None
                reserved_before_generations = [
                    manifest["generation_ref"]
                    for manifest, _, _ in generation_snapshots(
                        self.runs_dir, reserved_started
                    )
                ]
                try:
                    reserved_rejected = self.resume_run(
                        reserved_started,
                        events=copy.deepcopy(events),
                    )
                except Exception as error:
                    self.fail(
                        f"{order} reserved batch raised "
                        f"{type(error).__name__}: {error}"
                    )
                self.assertIn(
                    "event_batch_after_reserved",
                    {
                        item.get("code")
                        for item in reserved_rejected.get("rejections", [])
                        if isinstance(item, Mapping)
                    },
                )
                self.assertEqual(
                    reserved_before["state"], reserved_rejected["state"]
                )
                self.assertEqual(
                    reserved_before["findings"], reserved_rejected["findings"]
                )
                self.assertEqual(
                    reserved_before["revision"], reserved_rejected["revision"]
                )
                reserved_after = self.harness.facade.store.load(
                    reserved_started["run_id"]
                )
                self.assertIsNotNone(reserved_after)
                assert reserved_after is not None
                self.assertEqual("verified", reserved_after["integrity_status"])
                self.assertEqual(reserved_before["state"], reserved_after["state"])
                self.assertEqual(
                    reserved_before["findings"], reserved_after["findings"]
                )
                self.assertEqual(
                    reserved_before["revision"], reserved_after["revision"]
                )
                self.assertEqual(
                    reserved_before_generations,
                    [
                        manifest["generation_ref"]
                        for manifest, _, _ in generation_snapshots(
                            self.runs_dir, reserved_started
                        )
                    ],
                )

    def test_quality_blocker_reason_exactly_binds_report_and_failure_cause(
        self,
    ) -> None:
        started = self.run_request(
            request(idempotency_key="fifteenth-quality-blocker-cause")
        )
        staged = self.stage(started)
        cause = "fifteenth exact quality blocker"
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
        loaded = self.harness.facade.store.load(blocked["run_id"])
        self.assertIsNotNone(loaded)
        assert loaded is not None
        self.assertEqual("verified", loaded["integrity_status"])
        self._assert_latest_reserved_kind(loaded, "quality_blocker")
        report = loaded["final_verification_report"]
        failure = loaded["failure_history"][-1]
        self.assertEqual(("final", "verification", "blocked"), (
            report["phase"], failure["report"], report["status"]
        ))
        self.assertEqual(cause, report["cause"])
        self.assertEqual(cause, failure["cause"])
        self.assertEqual(report["report_digest"], failure["report_digest"])
        self.assertEqual(
            f"final verification blocked: {cause}",
            loaded["state_trace"][-1]["reason"],
        )

        def replace_only_trace_cause(candidate: dict[str, Any]) -> None:
            candidate["state_trace"][-1]["reason"] = (
                "final verification blocked: unrelated rehashed suffix"
            )

        self._rehash_latest(blocked, replace_only_trace_cause)
        self._assert_integrity_code(
            blocked, "reserved_trace_generation_evidence_invalid"
        )

    def test_implementation_approval_requires_a_generation_new_initial_review(
        self,
    ) -> None:
        started = self.run_request(
            request(idempotency_key="fifteenth-reserved-kind-inventory")
        )
        verified = self.resume_run(
            started,
            events=[report_event(started, "verification", "passed")],
        )
        approved = self.resume_run(
            verified,
            events=[report_event(verified, "review", "passed")],
        )
        self._assert_latest_reserved_kind(approved, "implementation_approval")
        staged = self.resume_run(
            approved, source_sync_request=self.source_request(approved)
        )
        self._assert_latest_reserved_kind(staged, "source_introduction")
        final_verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        self._assert_latest_reserved_kind(final_verified, "final_verification_pass")
        final_reviewed = self.resume_run(
            final_verified,
            events=[report_event(final_verified, "review", "passed", phase="final")],
        )
        self._assert_latest_reserved_kind(final_reviewed, "final_review_pass")
        completion = self.harness.facade.completion_gate(
            final_reviewed["run_id"], expected_revision=final_reviewed["revision"]
        )
        self.assertTrue(completion["complete"])
        completed = self.harness.facade.store.load(final_reviewed["run_id"])
        self.assertIsNotNone(completed)
        assert completed is not None
        self._assert_latest_reserved_kind(completed, "completion")
        cancel_started = self.run_request(
            request(idempotency_key="fifteenth-cancellation-inventory")
        )
        cancelled = self.resume_run(
            cancel_started,
            events=[
                {
                    "type": "cancel",
                    "actor": "orchestrator",
                    "reason": "fifteenth explicit cancellation",
                }
            ],
        )
        self._assert_latest_reserved_kind(cancelled, "cancellation")

        negative_started = self.run_request(
            request(idempotency_key="fifteenth-approval-report-kind")
        )
        negative_verified = self.resume_run(
            negative_started,
            events=[report_event(negative_started, "verification", "passed")],
        )
        negative_approved = self.resume_run(
            negative_verified,
            events=[report_event(negative_verified, "review", "passed")],
        )
        snapshots = generation_snapshots(self.runs_dir, negative_approved)
        started_state = copy.deepcopy(snapshots[-3][1])
        verification_manifest = copy.deepcopy(snapshots[-2][0])
        original_verification = copy.deepcopy(snapshots[-2][1])
        approval_manifest = copy.deepcopy(snapshots[-1][0])
        original_approval = copy.deepcopy(snapshots[-1][1])

        def move_review_to_prior(candidate: dict[str, Any]) -> None:
            candidate["initial_verification_report"] = copy.deepcopy(
                started_state["initial_verification_report"]
            )
            candidate["verification_report"] = copy.deepcopy(
                started_state["verification_report"]
            )
            candidate["initial_review_report"] = copy.deepcopy(
                original_approval["initial_review_report"]
            )
            candidate["review_report"] = copy.deepcopy(
                original_approval["review_report"]
            )
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
            negative_approved,
            str(verification_manifest["generation_ref"]),
            move_review_to_prior,
        )

        current = generation_snapshots(self.runs_dir, negative_approved)
        prior = copy.deepcopy(current[-2][1])

        def introduce_verification_on_approval(candidate: dict[str, Any]) -> None:
            candidate["initial_review_report"] = copy.deepcopy(
                prior["initial_review_report"]
            )
            candidate["review_report"] = copy.deepcopy(prior["review_report"])
            candidate["initial_verification_report"] = copy.deepcopy(
                original_verification["initial_verification_report"]
            )
            candidate["verification_report"] = copy.deepcopy(
                original_verification["verification_report"]
            )
            candidate["completion_report"] = canonical_completion_projection(
                candidate,
                generation_revision=None,
                complete=False,
                gate="not_evaluated",
                reasons=[],
            )
            candidate["metrics"] = canonical_metrics(candidate)
            _bind_generation_reserved_evidence(
                candidate, prior, int(approval_manifest["revision"])
            )

        rehash_generation_chain(
            self.runs_dir,
            negative_approved,
            str(approval_manifest["generation_ref"]),
            introduce_verification_on_approval,
        )
        _rewrite_manifests_and_anchor(self.runs_dir, negative_approved)
        self._assert_integrity_code(
            negative_approved, "reserved_trace_generation_evidence_invalid"
        )

    def test_every_inactive_historical_source_projection_is_exactly_canonical(
        self,
    ) -> None:
        corruptions: dict[str, Callable[[dict[str, Any]], None]] = {
            "cross-run": lambda sync: sync.__setitem__(
                "run_id", "run-fifteenth-cross-run-source"
            ),
            "stale-artifact-revision": lambda sync: sync.__setitem__(
                "artifact_revision", int(sync["artifact_revision"]) + 7
            ),
            "non-null-inactive-bindings": lambda sync: sync.update(
                {
                    "status": "prepared_for_human_application",
                    "source_artifact_digest": sha256_digest("inactive source artifact"),
                    "manifest_digest": sha256_digest("inactive source manifest"),
                    "committed_revision": 1,
                }
            ),
            "verified-inactive-connection": lambda sync: sync.update(
                {
                    "connection_status": "verified",
                    "external_connection_verified": True,
                }
            ),
        }
        for label, corrupt in corruptions.items():
            with self.subTest(corruption=label):
                started = self.run_request(
                    request(idempotency_key=f"fifteenth-inactive-source-{label}")
                )
                advanced = self.resume_run(
                    started,
                    events=[
                        {
                            "type": "plan_revised",
                            "change": f"inactive historical generation for {label}",
                        }
                    ],
                )
                positive = self.harness.facade.store.load(advanced["run_id"])
                self.assertIsNotNone(positive)
                assert positive is not None
                self.assertEqual("verified", positive["integrity_status"])
                snapshots = generation_snapshots(self.runs_dir, advanced)
                first_manifest = snapshots[0][0]

                def corrupt_historical_inactive_source(
                    candidate: dict[str, Any],
                ) -> None:
                    corrupt(candidate["source_sync"])
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
                    advanced,
                    str(first_manifest["generation_ref"]),
                    corrupt_historical_inactive_source,
                )
                _rewrite_manifests_and_anchor(self.runs_dir, advanced)
                self._assert_integrity_code(
                    advanced, "completion_source_binding_invalid"
                )

        source_policy = self.harness.facade.policy["source_sync"]
        for label, corrupt in {
            "accepted-status": lambda sync: sync.__setitem__(
                "status", "not_requested"
            ),
            "accepted-manual-handoff": lambda sync: sync["staging_artifact"].__setitem__(
                "manual_handoff", not bool(source_policy["manual_activation"])
            ),
        }.items():
            with self.subTest(accepted_source_corruption=label):
                staged = self.stage(
                    self.run_request(
                        request(
                            idempotency_key=(
                                f"fifteenth-accepted-source-{label}"
                            )
                        )
                    )
                )
                positive = self.harness.facade.store.load(staged["run_id"])
                self.assertIsNotNone(positive)
                assert positive is not None
                self.assertEqual("verified", positive["integrity_status"])
                self.assertEqual(
                    source_policy["external_disconnected_status"],
                    positive["source_sync"]["status"],
                )
                self.assertEqual(
                    bool(source_policy["manual_activation"]),
                    positive["source_sync"]["staging_artifact"]["manual_handoff"],
                )
                snapshots = generation_snapshots(self.runs_dir, staged)
                latest_manifest, _, _ = snapshots[-1]
                prior = copy.deepcopy(snapshots[-2][1])

                def corrupt_accepted_source(candidate: dict[str, Any]) -> None:
                    sync = candidate["source_sync"]
                    corrupt(sync)
                    staging = sync["staging_artifact"]
                    staging["digest"] = sha256_digest(
                        {
                            key: value
                            for key, value in staging.items()
                            if key != "digest"
                        }
                    )
                    sync["manifest_digest"] = sha256_digest(
                        {
                            key: value
                            for key, value in sync.items()
                            if key != "manifest_digest"
                        }
                    )
                    candidate["completion_report"] = canonical_completion_projection(
                        candidate,
                        generation_revision=None,
                        complete=False,
                        gate="not_evaluated",
                        reasons=[],
                    )
                    candidate["metrics"] = canonical_metrics(candidate)
                    _bind_generation_reserved_evidence(
                        candidate, prior, int(latest_manifest["revision"])
                    )

                rehash_generation_chain(
                    self.runs_dir,
                    staged,
                    str(latest_manifest["generation_ref"]),
                    corrupt_accepted_source,
                )
                rewritten = generation_snapshots(self.runs_dir, staged)[-1][1]
                rewritten_staging = rewritten["source_sync"]["staging_artifact"]
                _write_json(
                    self.runs_dir
                    / str(staged["run_id"])
                    / str(rewritten_staging["ref"]),
                    rewritten_staging,
                )
                _rewrite_manifests_and_anchor(self.runs_dir, staged)
                self._assert_integrity_code(
                    staged, "completion_source_binding_invalid"
                )

    def test_invalid_task_contracts_persist_only_a_safe_rejected_projection(
        self,
    ) -> None:
        missing_field = request(
            idempotency_key="fifteenth-invalid-contract-missing-field"
        )
        missing_field["task_contract"].pop("goal")
        missing_field["task_contract"]["title"] = (
            "FIFTEENTH_MISSING_FIELD_RAW_SENTINEL"
        )

        empty_required_list = request(
            idempotency_key="fifteenth-invalid-contract-empty-list"
        )
        empty_required_list["task_contract"]["acceptance_criteria"] = []
        empty_required_list["task_contract"]["title"] = (
            "FIFTEENTH_EMPTY_LIST_RAW_SENTINEL"
        )

        wrong_list_item = request(
            idempotency_key="fifteenth-invalid-contract-list-item"
        )
        wrong_list_item["task_contract"]["non_goals"] = [
            {"invalid": "FIFTEENTH_WRONG_ITEM_RAW_SENTINEL"}
        ]

        unsafe_path = "../../FIFTEENTH_TRAVERSAL_RAW_SENTINEL.php"
        traversal = request(
            idempotency_key="fifteenth-invalid-contract-traversal"
        )
        traversal["task_contract"]["allowed_paths"] = [unsafe_path]
        traversal["task_contract"]["scope"] = {"include": [unsafe_path]}
        traversal["task_contract"]["write_ownership"] = [
            {"owner": "dynamic", "paths": [unsafe_path]}
        ]

        cases = (
            (
                "missing-canonical-field",
                missing_field,
                {"contract_schema_invalid", "missing_spec"},
                ("FIFTEENTH_MISSING_FIELD_RAW_SENTINEL",),
            ),
            (
                "empty-required-list",
                empty_required_list,
                {"contract_schema_invalid", "missing_spec"},
                ("FIFTEENTH_EMPTY_LIST_RAW_SENTINEL",),
            ),
            (
                "wrong-list-item",
                wrong_list_item,
                {"contract_schema_invalid"},
                ("FIFTEENTH_WRONG_ITEM_RAW_SENTINEL",),
            ),
            (
                "unsafe-traversal-path",
                traversal,
                {"contract_schema_invalid", "path_traversal"},
                ("FIFTEENTH_TRAVERSAL_RAW_SENTINEL", unsafe_path),
            ),
        )
        safe_contracts: list[dict[str, Any]] = []
        for label, input_task, expected_codes, forbidden_values in cases:
            with self.subTest(invalid_contract=label):
                try:
                    blocked = self.run_request(copy.deepcopy(input_task))
                except Exception as error:
                    self.fail(
                        f"{label} invalid contract raised {type(error).__name__}"
                    )
                self.assertEqual("blocked", blocked["state"])
                problems = [
                    *blocked.get("blockers", []),
                    *blocked.get("rejections", []),
                ]
                problem_codes = {
                    problem.get("code")
                    for problem in problems
                    if isinstance(problem, Mapping)
                }
                self.assertTrue(expected_codes.issubset(problem_codes))
                projection = blocked["start_request"][
                    "input_problem_projection"
                ]
                projected_codes = {
                    problem.get("code")
                    for problem in [
                        *projection["blockers"],
                        *projection["rejections"],
                    ]
                    if isinstance(problem, Mapping)
                }
                self.assertTrue(expected_codes.issubset(projected_codes))

                generations_before = [
                    manifest["generation_ref"]
                    for manifest, _, _ in generation_snapshots(
                        self.runs_dir, blocked
                    )
                ]
                rerun = self.run_request(copy.deepcopy(input_task))
                generations_after = [
                    manifest["generation_ref"]
                    for manifest, _, _ in generation_snapshots(
                        self.runs_dir, blocked
                    )
                ]
                self.assertEqual(blocked["run_id"], rerun["run_id"])
                self.assertEqual(generations_before, generations_after)

                loaded = self.harness.facade.store.load(blocked["run_id"])
                self.assertIsNotNone(loaded)
                assert loaded is not None
                self.assertEqual("blocked", loaded["state"])
                self.assertEqual(
                    "verified",
                    loaded["integrity_status"],
                    json.dumps(loaded.get("integrity_errors", []), ensure_ascii=False),
                )
                self.assertEqual([], loaded.get("integrity_errors", []))
                self.assertEqual(
                    [], validate_document("task_contract", loaded["task_contract"])
                )
                self.assertEqual([], validate_document("run_state", loaded))
                safe_contracts.append(copy.deepcopy(loaded["task_contract"]))

                run_dir = self.runs_dir / str(blocked["run_id"])
                persisted_text = [
                    path.read_text(encoding="utf-8")
                    for path in run_dir.rglob("*")
                    if path.is_file()
                ]
                returned_text = [
                    json.dumps(blocked, ensure_ascii=False, sort_keys=True),
                    json.dumps(rerun, ensure_ascii=False, sort_keys=True),
                    json.dumps(loaded, ensure_ascii=False, sort_keys=True),
                ]
                leak_locations = [
                    f"payload-{payload_index}"
                    for payload_index, payload in enumerate(
                        [*returned_text, *persisted_text]
                    )
                    if any(value in payload for value in forbidden_values)
                ]
                self.assertEqual(
                    [],
                    leak_locations,
                    f"{label} persisted a raw invalid Task Contract value",
                )

        if safe_contracts:
            self.assertEqual(4, len(safe_contracts))
            self.assertTrue(
                all(contract == safe_contracts[0] for contract in safe_contracts)
            )

    def test_input_problem_projection_is_bound_to_the_immutable_run_identity(
        self,
    ) -> None:
        invalid_input = request(
            idempotency_key="fifteenth-input-projection-authority",
        )
        invalid_input["schema_version"] = "2.0"
        invalid_input["unknown_input_field"] = "safe unknown input value"
        blocked = self.run_request(invalid_input)
        self.assertEqual("blocked", blocked["state"])
        positive = self.harness.facade.store.load(blocked["run_id"])
        self.assertIsNotNone(positive)
        assert positive is not None
        self.assertEqual(
            "verified",
            positive["integrity_status"],
            json.dumps(positive.get("integrity_errors", []), ensure_ascii=False),
        )
        self.assertEqual([], positive.get("integrity_errors", []))
        projection = positive["start_request"]["input_problem_projection"]
        self.assertIn("schema_version", projection["top_level_fields"])
        self.assertIn("unknown_input_field", projection["top_level_fields"])
        self.assertTrue(projection["rejections"])

        sensitive_field_cases = (
            (
                "top-level-personal-path-key",
                request(idempotency_key="fifteenth-sensitive-top-level-key"),
                "C:/Users/FIFTEENTH_TOP_LEVEL_FIELD/session-987654321",
                "top_level_fields",
            ),
            (
                "contract-session-key",
                request(idempotency_key="fifteenth-sensitive-contract-key"),
                "C:/Users/FIFTEENTH_CONTRACT_FIELD/session-123456789",
                "task_contract_fields",
            ),
        )
        for label, sensitive_input, raw_key, field_list in sensitive_field_cases:
            with self.subTest(sanitized_field_name=label):
                if field_list == "top_level_fields":
                    sensitive_input[raw_key] = "ordinary value"
                else:
                    sensitive_input["task_contract"][raw_key] = "ordinary value"
                try:
                    sanitized = self.run_request(sensitive_input)
                except Exception as error:
                    self.fail(
                        f"{label} sensitive field name raised "
                        f"{type(error).__name__}: {error}"
                    )
                loaded_sanitized = self.harness.facade.store.load(
                    sanitized["run_id"]
                )
                self.assertIsNotNone(loaded_sanitized)
                assert loaded_sanitized is not None
                self.assertEqual("verified", loaded_sanitized["integrity_status"])
                projection = loaded_sanitized["start_request"][
                    "input_problem_projection"
                ]
                self.assertNotIn(raw_key, projection[field_list])
                self.assertIn(
                    "unknown_input_field"
                    if field_list == "top_level_fields"
                    else "unknown_contract_field",
                    {
                        problem.get("code")
                        for problem in [
                            *projection["blockers"],
                            *projection["rejections"],
                        ]
                        if isinstance(problem, Mapping)
                    },
                )
                run_dir = self.runs_dir / str(sanitized["run_id"])
                serialized = [
                    json.dumps(sanitized, ensure_ascii=False, sort_keys=True),
                    json.dumps(loaded_sanitized, ensure_ascii=False, sort_keys=True),
                    *(
                        path.read_text(encoding="utf-8")
                        for path in run_dir.rglob("*")
                        if path.is_file()
                    ),
                ]
                self.assertFalse(
                    any(raw_key in payload for payload in serialized),
                    f"{label} persisted the raw sensitive field name",
                )

        home_root_and_marker_keys = (
            "/home/alice",
            "/Users/alice",
            "SessionID",
            "sessionId",
            "secretKey",
            "apiToken",
            "PrivateKey",
            "sessionid",
            "SESSIONID",
            "apitoken",
            "APITOKEN",
            "secretkey",
            "SECRETKEY",
            "privatekey",
            "PRIVATEKEY",
            "clientsecret",
            "CLIENTSECRET",
            "accesstoken",
            "ACCESSTOKEN",
            "passwordhash",
            "PASSWORDHASH",
            "secrettoken",
            "SECRETTOKEN",
        )
        private_path_key_groups = (
            (
                "top-level-windows-case-variants",
                "top_level_fields",
                (
                    (
                        "c:/users/alice/customer-alpha",
                        "FIFTEENTH_WINDOWS_TOP_VALUE_ALPHA",
                        "FIFTEENTH_WINDOWS_TOP_TITLE_ALPHA",
                        "app/FifteenthWindowsTopAlpha.php",
                    ),
                    (
                        r"C:\uSeRs\Alice\customer-bravo",
                        "FIFTEENTH_WINDOWS_TOP_VALUE_BRAVO",
                        "FIFTEENTH_WINDOWS_TOP_TITLE_BRAVO",
                        "app/FifteenthWindowsTopBravo.php",
                    ),
                ),
            ),
            (
                "task-contract-windows-case-variants",
                "task_contract_fields",
                (
                    (
                        "c:/users/alice/customer-charlie",
                        "FIFTEENTH_WINDOWS_CONTRACT_VALUE_CHARLIE",
                        "FIFTEENTH_WINDOWS_CONTRACT_TITLE_CHARLIE",
                        "app/FifteenthWindowsContractCharlie.php",
                    ),
                    (
                        r"d:\UsErS\ALICE\customer-delta",
                        "FIFTEENTH_WINDOWS_CONTRACT_VALUE_DELTA",
                        "FIFTEENTH_WINDOWS_CONTRACT_TITLE_DELTA",
                        "app/FifteenthWindowsContractDelta.php",
                    ),
                ),
            ),
            (
                "top-level-macos-case-variants",
                "top_level_fields",
                (
                    (
                        "/Users/alice/customer-alpha",
                        "FIFTEENTH_MACOS_TOP_VALUE_ALPHA",
                        "FIFTEENTH_MACOS_TOP_TITLE_ALPHA",
                        "app/FifteenthMacosTopAlpha.php",
                    ),
                    (
                        "/Users/Alice/Customer-Bravo",
                        "FIFTEENTH_MACOS_TOP_VALUE_BRAVO",
                        "FIFTEENTH_MACOS_TOP_TITLE_BRAVO",
                        "app/FifteenthMacosTopBravo.php",
                    ),
                ),
            ),
            (
                "task-contract-macos-case-variants",
                "task_contract_fields",
                (
                    (
                        "/Users/alice/customer-charlie",
                        "FIFTEENTH_MACOS_CONTRACT_VALUE_CHARLIE",
                        "FIFTEENTH_MACOS_CONTRACT_TITLE_CHARLIE",
                        "app/FifteenthMacosContractCharlie.php",
                    ),
                    (
                        "/Users/ALICE/Customer-Delta",
                        "FIFTEENTH_MACOS_CONTRACT_VALUE_DELTA",
                        "FIFTEENTH_MACOS_CONTRACT_TITLE_DELTA",
                        "app/FifteenthMacosContractDelta.php",
                    ),
                ),
            ),
            (
                "top-level-home-root-and-marker-variants",
                "top_level_fields",
                tuple(
                    (
                        raw_key,
                        f"FIFTEENTH_TOP_POSITIVE_VALUE_{index}",
                        f"FIFTEENTH_TOP_POSITIVE_TITLE_{index}",
                        f"app/FifteenthTopPositive{index}.php",
                    )
                    for index, raw_key in enumerate(home_root_and_marker_keys)
                ),
            ),
            (
                "task-contract-home-root-and-marker-variants",
                "task_contract_fields",
                tuple(
                    (
                        raw_key,
                        f"FIFTEENTH_CONTRACT_POSITIVE_VALUE_{index}",
                        f"FIFTEENTH_CONTRACT_POSITIVE_TITLE_{index}",
                        f"app/FifteenthContractPositive{index}.php",
                    )
                    for index, raw_key in enumerate(home_root_and_marker_keys)
                ),
            ),
        )
        for label, field_list, variants in private_path_key_groups:
            with self.subTest(private_path_mapping_keys=label):
                violations: list[str] = []
                observed_run_ids: list[str] = []
                for index, (raw_key, raw_value, raw_title, raw_path) in enumerate(
                    variants
                ):
                    raw_id = f"fifteenth-{label}-{index}"
                    private_input = request(
                        raw_title,
                        paths=[raw_path],
                        idempotency_key=raw_id,
                    )
                    if field_list == "top_level_fields":
                        private_input[raw_key] = raw_value
                    else:
                        private_input["task_contract"][raw_key] = raw_value
                    try:
                        redacted = self.run_request(private_input)
                    except Exception as error:
                        violations.append(
                            f"variant {index} raised {type(error).__name__}: {error}"
                        )
                        continue
                    observed_run_ids.append(str(redacted.get("run_id")))
                    loaded_redacted = self.harness.facade.store.load(
                        str(redacted.get("run_id"))
                    )
                    if not isinstance(loaded_redacted, Mapping):
                        violations.append(f"variant {index} did not persist a run")
                        continue
                    if redacted.get("state") != "blocked":
                        violations.append(f"variant {index} was not blocked")
                    if redacted.get("idempotency_key") != "redacted-input":
                        violations.append(
                            f"variant {index} did not use the fixed safe id"
                        )
                    if loaded_redacted.get("integrity_status") != "verified":
                        violations.append(
                            f"variant {index} did not remain integrity verified"
                        )
                    if (
                        loaded_redacted.get("task_contract")
                        != canonical_rejected_task_contract()
                        or loaded_redacted.get("start_request", {}).get(
                            "task_contract"
                        )
                        != canonical_rejected_task_contract()
                    ):
                        violations.append(
                            f"variant {index} did not use the canonical rejected contract"
                        )
                    projection = loaded_redacted.get("start_request", {}).get(
                        "input_problem_projection", {}
                    )
                    if (
                        not isinstance(projection, Mapping)
                        or projection.get("redacted") is not True
                    ):
                        violations.append(
                            f"variant {index} was not marked as redacted"
                        )
                    elif raw_key in projection.get(field_list, []):
                        violations.append(
                            f"variant {index} retained the raw mapping key"
                        )
                    run_dir = self.runs_dir / str(redacted.get("run_id"))
                    serialized = [
                        json.dumps(redacted, ensure_ascii=False, sort_keys=True),
                        json.dumps(
                            loaded_redacted, ensure_ascii=False, sort_keys=True
                        ),
                        *(
                            path.read_text(encoding="utf-8")
                            for path in run_dir.rglob("*")
                            if path.is_file()
                        ),
                    ]
                    raw_values = (
                        raw_key,
                        raw_value,
                        raw_id,
                        raw_title,
                        raw_path,
                    )
                    rendered_values = {
                        value
                        for value in raw_values
                    } | {
                        json.dumps(value, ensure_ascii=False)[1:-1]
                        for value in raw_values
                    }
                    if any(
                        value in payload
                        for payload in serialized
                        for value in rendered_values
                    ):
                        violations.append(
                            f"variant {index} persisted a raw key or value"
                        )
                if len(set(observed_run_ids)) != 1:
                    violations.append(
                        "same-kind private-path variants did not converge to one safe identity"
                    )
                self.assertEqual([], violations, "; ".join(violations))

        for index, near_marker in enumerate(
            ("secretary", "tokenizer", "privateer", "sessional")
        ):
            with self.subTest(near_private_marker_control=near_marker):
                control_id = f"fifteenth-near-marker-{index}"
                control_title = f"FIFTEENTH_NEAR_MARKER_TITLE_{index}"
                control_path = f"app/FifteenthNearMarker{index}.php"
                control_value = f"FIFTEENTH_NEAR_MARKER_VALUE_{index}"
                control_input = request(
                    control_title,
                    paths=[control_path],
                    idempotency_key=control_id,
                )
                control_input[near_marker] = control_value
                try:
                    controlled = self.run_request(control_input)
                except Exception as error:
                    self.fail(
                        f"near-marker {near_marker} raised "
                        f"{type(error).__name__}: {error}"
                    )
                self.assertEqual("blocked", controlled["state"])
                self.assertEqual(control_id, controlled["idempotency_key"])
                controlled_loaded = self.harness.facade.store.load(
                    controlled["run_id"]
                )
                self.assertIsNotNone(controlled_loaded)
                assert controlled_loaded is not None
                self.assertEqual("verified", controlled_loaded["integrity_status"])
                self.assertEqual(
                    [], validate_document("task_contract", controlled_loaded["task_contract"])
                )
                self.assertEqual(
                    control_title, controlled_loaded["task_contract"]["title"]
                )
                self.assertNotEqual(
                    canonical_rejected_task_contract(),
                    controlled_loaded["task_contract"],
                )
                control_projection = controlled_loaded["start_request"][
                    "input_problem_projection"
                ]
                self.assertIs(control_projection["redacted"], False)
                self.assertEqual([], control_projection["blockers"])
                self.assertIn(
                    near_marker, control_projection["top_level_fields"]
                )
                control_codes = {
                    item.get("code")
                    for item in control_projection["rejections"]
                    if isinstance(item, Mapping)
                }
                self.assertIn("unknown_input_field", control_codes)
                self.assertNotIn("redaction_required", control_codes)
                control_run_dir = self.runs_dir / str(controlled["run_id"])
                control_serialized = [
                    json.dumps(controlled, ensure_ascii=False, sort_keys=True),
                    json.dumps(
                        controlled_loaded, ensure_ascii=False, sort_keys=True
                    ),
                    *(
                        path.read_text(encoding="utf-8")
                        for path in control_run_dir.rglob("*")
                        if path.is_file()
                    ),
                ]
                self.assertFalse(
                    any(control_value in payload for payload in control_serialized),
                    "near-marker control persisted its unknown-field value",
                )

        relative_boundary_groups = (
            ("top-level", "top_level_fields", "unknown_input_field"),
            (
                "task-contract",
                "task_contract_fields",
                "unknown_contract_field",
            ),
        )
        for scope_label, field_list, expected_code in relative_boundary_groups:
            with self.subTest(relative_personal_path_boundary=scope_label):
                violations: list[str] = []
                for index, relative_key in enumerate(
                    (
                        "docs/Users/alice",
                        "docs/Users/alice/readme",
                        "src/home/alice",
                    )
                ):
                    control_id = (
                        f"fifteenth-relative-boundary-{scope_label}-{index}"
                    )
                    control_title = (
                        f"FIFTEENTH_RELATIVE_BOUNDARY_TITLE_{scope_label}_{index}"
                    )
                    control_path = (
                        f"app/FifteenthRelativeBoundary{scope_label}{index}.php"
                    )
                    control_value = (
                        f"FIFTEENTH_RELATIVE_BOUNDARY_VALUE_{scope_label}_{index}"
                    )
                    control_input = request(
                        control_title,
                        paths=[control_path],
                        idempotency_key=control_id,
                    )
                    if field_list == "top_level_fields":
                        control_input[relative_key] = control_value
                    else:
                        control_input["task_contract"][relative_key] = control_value
                    try:
                        controlled = self.run_request(control_input)
                    except Exception as error:
                        violations.append(
                            f"variant {index} raised {type(error).__name__}: {error}"
                        )
                        continue
                    loaded_control = self.harness.facade.store.load(
                        controlled["run_id"]
                    )
                    if not isinstance(loaded_control, Mapping):
                        violations.append(f"variant {index} did not persist a run")
                        continue
                    if controlled.get("state") != "blocked":
                        violations.append(f"variant {index} was not blocked")
                    if controlled.get("idempotency_key") != control_id:
                        violations.append(
                            f"variant {index} was falsely assigned the redacted id"
                        )
                    if loaded_control.get("integrity_status") != "verified":
                        violations.append(
                            f"variant {index} did not remain integrity verified"
                        )
                    task_contract = loaded_control.get("task_contract", {})
                    if validate_document("task_contract", task_contract):
                        violations.append(
                            f"variant {index} did not persist a schema-valid Task Contract"
                        )
                    start_contract = loaded_control.get("start_request", {}).get(
                        "task_contract"
                    )
                    contract_field_control = field_list == "task_contract_fields"
                    if contract_field_control:
                        if (
                            task_contract != canonical_rejected_task_contract()
                            or start_contract != canonical_rejected_task_contract()
                        ):
                            violations.append(
                                f"variant {index} did not use the canonical rejected Task Contract"
                            )
                    elif (
                        task_contract == canonical_rejected_task_contract()
                        or task_contract.get("title") != control_title
                        or start_contract != task_contract
                    ):
                        violations.append(
                            f"variant {index} replaced the valid Task Contract"
                        )
                    projection = loaded_control.get("start_request", {}).get(
                        "input_problem_projection", {}
                    )
                    if not isinstance(projection, Mapping):
                        violations.append(
                            f"variant {index} has no input problem projection"
                        )
                        continue
                    if projection.get("redacted") is not False:
                        violations.append(
                            f"variant {index} was falsely marked redacted"
                        )
                    blocker_codes = {
                        item.get("code")
                        for item in projection.get("blockers", [])
                        if isinstance(item, Mapping)
                    }
                    rejection_codes = {
                        item.get("code")
                        for item in projection.get("rejections", [])
                        if isinstance(item, Mapping)
                    }
                    if contract_field_control:
                        if not {
                            "contract_schema_invalid",
                            "unknown_contract_field",
                        }.issubset(blocker_codes):
                            violations.append(
                                f"variant {index} lacks the canonical contract blockers"
                            )
                        if projection.get("blockers") != loaded_control.get(
                            "blockers"
                        ):
                            violations.append(
                                f"variant {index} did not preserve blockers in Run State"
                            )
                    elif projection.get("blockers") != []:
                        violations.append(
                            f"variant {index} treated an envelope-only unknown field as a blocker"
                        )
                    elif expected_code not in rejection_codes:
                        violations.append(
                            f"variant {index} lacks {expected_code} rejection"
                        )
                    if (
                        "redaction_required" in rejection_codes
                        or "redaction_required" in blocker_codes
                    ):
                        violations.append(
                            f"variant {index} emitted redaction_required"
                        )
                    if relative_key not in projection.get(field_list, []):
                        violations.append(
                            f"variant {index} lost its safe unknown field name"
                        )
                    run_dir = self.runs_dir / str(controlled["run_id"])
                    serialized = [
                        json.dumps(controlled, ensure_ascii=False, sort_keys=True),
                        json.dumps(
                            loaded_control, ensure_ascii=False, sort_keys=True
                        ),
                        *(
                            path.read_text(encoding="utf-8")
                            for path in run_dir.rglob("*")
                            if path.is_file()
                        ),
                    ]
                    if any(control_value in payload for payload in serialized):
                        violations.append(
                            f"variant {index} persisted its unknown-field value"
                        )
                self.assertEqual([], violations, "; ".join(violations))

        self_attested_problem = {
            "code": "self_attested_input_problem",
            "message": "a rewritten projection cannot select an existing run id",
        }

        def rewrite_projection_and_all_self_attested_digests(
            candidate: dict[str, Any],
        ) -> None:
            candidate_projection = candidate["start_request"][
                "input_problem_projection"
            ]
            candidate_projection["top_level_fields"] = sorted(
                {
                    *candidate_projection["top_level_fields"],
                    "self_attested_unknown_field",
                }
            )
            candidate_projection["rejections"].append(
                copy.deepcopy(self_attested_problem)
            )
            candidate_projection["digest"] = sha256_digest(
                {
                    key: value
                    for key, value in candidate_projection.items()
                    if key != "digest"
                }
            )
            candidate["rejections"].append(copy.deepcopy(self_attested_problem))
            candidate["start_request_digest"] = sha256_digest(
                candidate["start_request"]
            )

        self._rehash_latest(
            blocked, rewrite_projection_and_all_self_attested_digests
        )
        self._assert_integrity_code(
            blocked, "immutable start authority does not match run id"
        )

    def test_redacted_canonical_and_legacy_inputs_persist_only_safe_projections(
        self,
    ) -> None:
        cases = (
            (
                "canonical",
                (
                    {
                        **request(
                            "FIFTEENTH_CANONICAL_TITLE_ALPHA",
                            paths=["app/FifteenthCanonicalAlpha.php"],
                            idempotency_key="fifteenth-canonical-original-id-alpha",
                        ),
                        "api_token": "FIFTEENTH_CANONICAL_SENTINEL_PRIVATE_VALUE",
                    },
                    {
                        **request(
                            "FIFTEENTH_CANONICAL_TITLE_BRAVO",
                            paths=["app/FifteenthCanonicalBravo.php"],
                            idempotency_key="fifteenth-canonical-original-id-bravo",
                        ),
                        "api_token": "FIFTEENTH_CANONICAL_SENTINEL_PRIVATE_VALUE",
                    },
                ),
                (
                    "FIFTEENTH_CANONICAL_TITLE_ALPHA",
                    "FIFTEENTH_CANONICAL_TITLE_BRAVO",
                    "app/FifteenthCanonicalAlpha.php",
                    "app/FifteenthCanonicalBravo.php",
                    "fifteenth-canonical-original-id-alpha",
                    "fifteenth-canonical-original-id-bravo",
                ),
                "FIFTEENTH_CANONICAL_SENTINEL_PRIVATE_VALUE",
            ),
            (
                "legacy",
                (
                    {
                        "schema_version": "1.0",
                        "idempotency_key": "fifteenth-legacy-original-id-alpha",
                        "legacy_single_agent": {
                            "agent": "backend",
                            "task": "FIFTEENTH_LEGACY_TASK_ALPHA",
                            "paths": ["app/FifteenthLegacyAlpha.php"],
                            "password": "FIFTEENTH_LEGACY_SENTINEL_PRIVATE_VALUE",
                        },
                    },
                    {
                        "schema_version": "1.0",
                        "idempotency_key": "fifteenth-legacy-original-id-bravo",
                        "legacy_single_agent": {
                            "agent": "backend",
                            "task": "FIFTEENTH_LEGACY_TASK_BRAVO",
                            "paths": ["app/FifteenthLegacyBravo.php"],
                            "password": "FIFTEENTH_LEGACY_SENTINEL_PRIVATE_VALUE",
                        },
                    },
                ),
                (
                    "FIFTEENTH_LEGACY_TASK_ALPHA",
                    "FIFTEENTH_LEGACY_TASK_BRAVO",
                    "app/FifteenthLegacyAlpha.php",
                    "app/FifteenthLegacyBravo.php",
                    "fifteenth-legacy-original-id-alpha",
                    "fifteenth-legacy-original-id-bravo",
                ),
                "FIFTEENTH_LEGACY_SENTINEL_PRIVATE_VALUE",
            ),
        )
        expected_projection_fields = {
            "schema_version",
            "input_kind",
            "top_level_fields",
            "task_contract_fields",
            "redacted",
            "blockers",
            "rejections",
            "digest",
        }
        for input_kind, input_tasks, forbidden_values, private_value in cases:
            with self.subTest(input_kind=input_kind):
                blocked_runs: list[Mapping[str, Any]] = []
                for input_task in input_tasks:
                    try:
                        blocked = self.run_request(input_task)
                    except Exception as error:
                        self.fail(
                            f"{input_kind} private input raised "
                            f"{type(error).__name__}: {error}"
                        )
                    self.assertEqual("blocked", blocked["state"])
                    self.assertEqual("redacted-input", blocked["idempotency_key"])
                    blocked_runs.append(blocked)
                self.assertEqual(
                    blocked_runs[0]["run_id"],
                    blocked_runs[1]["run_id"],
                    "same-kind redacted inputs must converge to one safe run identity",
                )
                blocked = blocked_runs[0]
                loaded = self.harness.facade.store.load(blocked["run_id"])
                self.assertIsNotNone(loaded)
                assert loaded is not None
                self.assertEqual("blocked", loaded["state"])
                self.assertEqual("verified", loaded["integrity_status"])
                self.assertEqual([], loaded.get("integrity_errors", []))
                self.assertEqual(canonical_rejected_task_contract(), loaded["task_contract"])
                self.assertEqual(
                    canonical_rejected_task_contract(),
                    loaded["start_request"]["task_contract"],
                )

                projection = loaded["start_request"]["input_problem_projection"]
                self.assertEqual(expected_projection_fields, set(projection))
                self.assertEqual(input_kind, projection["input_kind"])
                self.assertIs(projection["redacted"], True)
                self.assertEqual(
                    projection["digest"],
                    sha256_digest(
                        {
                            key: value
                            for key, value in projection.items()
                            if key != "digest"
                        }
                    ),
                )
                problems = [*projection["blockers"], *projection["rejections"]]
                self.assertTrue(problems)
                self.assertTrue(
                    all(set(problem) == {"code", "message"} for problem in problems)
                )
                self.assertIn(
                    "redaction_required",
                    {problem["code"] for problem in projection["rejections"]},
                )
                self.assertEqual(projection["blockers"], loaded["blockers"])
                self.assertEqual(projection["rejections"], loaded["rejections"])

                run_dir = self.runs_dir / str(blocked["run_id"])
                persisted_text = [
                    path.read_text(encoding="utf-8")
                    for path in run_dir.rglob("*")
                    if path.is_file()
                ]
                returned_text = [
                    *(json.dumps(item, ensure_ascii=False, sort_keys=True) for item in blocked_runs),
                    json.dumps(loaded, ensure_ascii=False, sort_keys=True),
                ]
                leak_locations = [
                    f"payload-{payload_index}"
                    for payload_index, payload in enumerate(
                        [*returned_text, *persisted_text]
                    )
                    if any(
                        value in payload
                        for value in (*forbidden_values, private_value)
                    )
                ]
                self.assertEqual(
                    [],
                    leak_locations,
                    f"{input_kind} redaction persisted a forbidden raw value",
                )

    def test_checker_uses_one_authoritative_expected_team_test_count(self) -> None:
        root = Path(__file__).resolve().parents[2]
        checker = root / "scripts/verify_project_ai_harness.py"
        source = checker.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(checker))
        assignments = [
            node
            for node in tree.body
            if isinstance(node, ast.Assign)
            and any(
                isinstance(target, ast.Name)
                and target.id == "EXPECTED_TEAM_TEST_COUNT"
                for target in node.targets
            )
        ]
        self.assertEqual(
            1,
            len(assignments),
            "EXPECTED_TEAM_TEST_COUNT must have one module-level authority",
        )
        assignment = assignments[0]
        self.assertIsInstance(assignment.value, ast.Constant)
        self.assertEqual(206, getattr(assignment.value, "value", None))

        naked_legacy_values = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Constant)
            and (
                node.value == 197
                or (isinstance(node.value, str) and "197" in node.value)
            )
        ]
        self.assertEqual([], naked_legacy_values, "checker retains a naked 197")
        count_uses = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Name)
            and isinstance(node.ctx, ast.Load)
            and node.id == "EXPECTED_TEAM_TEST_COUNT"
        ]
        self.assertGreaterEqual(
            len(count_uses),
            5,
            "comparison, subprocess expectation, regex, diagnostics, and success output must derive from the authority",
        )
        comparisons = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Compare)
            and "all_test_names" in ast.dump(node)
            and "EXPECTED_TEAM_TEST_COUNT" in ast.dump(node)
        ]
        self.assertEqual(1, len(comparisons))
        self.assertIn("test_team_harness_fifteenth_regressions", source)

        timeout_test = root / (
            "tests/team_harness/test_team_harness_fourteenth_regressions.py"
        )
        timeout_explanation = timeout_test.read_text(encoding="utf-8")
        self.assertNotIn("193-test", timeout_explanation)
        self.assertNotIn("193 test", timeout_explanation)


if __name__ == "__main__":
    import unittest

    unittest.main()
