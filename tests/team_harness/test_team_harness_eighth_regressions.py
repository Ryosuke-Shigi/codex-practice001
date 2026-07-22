"""Eighth-wave regressions for persisted authority, evidence, and policy ownership."""

from __future__ import annotations

import ast
import copy
import json
from pathlib import Path
from typing import Any, Callable, Mapping

from test_team_harness_contract import (
    CONFIG_ROOT,
    ROOT,
    issued_write_grant,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_fifth_regressions import semantic_snapshot
from test_team_harness_hardening_contract import rejection_codes
from test_team_harness_seventh_regressions import rewrite_committed_state
from test_team_harness_stop_contract import StopContractTestCase


def rehash_grant(grant: dict[str, Any]) -> None:
    grant["grant_digest"] = sha256_digest(
        {key: value for key, value in grant.items() if key != "grant_digest"}
    )


def resign_quality_report(report: dict[str, Any]) -> None:
    event_fields = {
        key: value
        for key, value in report.items()
        if key not in {"schema_version", "report", "source_revision", "report_digest"}
    }
    report["report_digest"] = sha256_digest(event_fields)


def sync_verification_projection(state: dict[str, Any], report: Mapping[str, Any]) -> None:
    summary = {
        key: copy.deepcopy(report.get(key))
        for key in ("status", "phase", "checks", "cause", "report_digest")
    }
    state["verification_report"] = summary
    state["metrics"]["test_results"] = copy.deepcopy(summary)
    state["metrics"]["digest"] = sha256_digest(
        {
            key: value
            for key, value in state["metrics"].items()
            if key != "digest"
        }
    )


def literal_state_collections(source: str, states: set[str]) -> list[int]:
    """Return literal multi-state collections that duplicate policy-owned tokens."""

    matches: list[int] = []
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if not isinstance(node, (ast.List, ast.Tuple, ast.Set)):
            continue
        values = [
            item.value
            for item in node.elts
            if isinstance(item, ast.Constant) and isinstance(item.value, str)
        ]
        if len(values) == len(node.elts) and len(values) >= 2 and set(values) <= states:
            matches.append(node.lineno)
    return matches


def schema_state_collections(value: Any, states: set[str]) -> list[list[str]]:
    matches: list[list[str]] = []
    if isinstance(value, list):
        if len(value) >= 2 and all(isinstance(item, str) for item in value):
            if set(value) <= states:
                matches.append(value)
        for item in value:
            matches.extend(schema_state_collections(item, states))
    elif isinstance(value, Mapping):
        for item in value.values():
            matches.extend(schema_state_collections(item, states))
    return matches


class EighthHarnessRegressionTest(StopContractTestCase):
    def _assert_integrity_blocked(self, run: Mapping[str, Any]) -> None:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
            resumed = self.resume_run(run, events=[])
        except Exception as error:
            self.fail(f"semantic integrity failure must be a structured result: {error}")
        self.assertIsInstance(loaded, Mapping)
        if not isinstance(loaded, Mapping):
            return
        self.assertEqual("blocked", loaded.get("state"))
        self.assertEqual("failed", loaded.get("integrity_status"))
        self.assertRegex(
            json.dumps(loaded.get("integrity_errors", [])).lower(),
            r"semantic|registry|team|role|grant|report|finding|receipt|catalog|integrity",
        )
        self.assertEqual("blocked", resumed.get("state"))

    def _fixed_finding_run(
        self, key: str
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
        path = "app/finding-I-8.diff"
        run = self.run_request(
            request(
                idempotency_key=key,
                paths=["app/Http/Controllers/ExampleController.php", path],
                events=[
                    {
                        "type": "finding",
                        "actor": "reviewer",
                        "source": "reviewer",
                        "issue_id": "I-8",
                        "clause": "finding.append-only",
                        "location": path,
                        "kind": "quality",
                        "message": "I-8",
                        "status": "open",
                    }
                ],
            )
        )
        failed = self.resume_run(
            run,
            events=[report_event(run, "verification", "failed", cause="I-8")],
        )
        history = failed["failure_history"][-1]
        with_receipt = self.resume_run(
            failed,
            events=[
                {
                    "type": "artifact",
                    "actor": self.roles(failed)["writer"],
                    "authority_grant": issued_write_grant(failed),
                    "path": path,
                    "content": {"issue_ids": ["I-8"], "patch": "strict I-8 fix"},
                }
            ],
        )
        receipt = next(
            item
            for item in with_receipt["implementation_log"]
            if item.get("kind") == "artifact_receipt" and item.get("path") == path
        )
        fixed = self.resume_run(
            with_receipt,
            events=[
                {
                    "type": "fix_applied",
                    "actor": self.roles(with_receipt)["writer"],
                    "cause": "I-8",
                    "attempt": with_receipt["attempt_count"] + 1,
                    "plan_revision": with_receipt["shared_plan"]["revision"],
                    "issue_ids": ["I-8"],
                    "failed_report_digest": history["report_digest"],
                    "cause_fingerprint": sha256_digest("i-8"),
                    "changed_input_fingerprint": with_receipt["input_fingerprint"],
                    "changed_diff_digest": receipt["digest"],
                    "environment_fingerprint": with_receipt["environment_fingerprint"],
                    "fix_artifact": receipt,
                }
            ],
        )
        return failed, with_receipt, fixed, receipt

    def test_persisted_team_and_grants_rejoin_the_canonical_registry(self) -> None:
        def replace_quality_actor(state: dict[str, Any], actor: str) -> None:
            member = next(item for item in state["team"] if item["role"] == "reviewer")
            member["id"] = actor
            grant = state["authority_grants"]["quality"]["initial"]["reviewer"]
            grant["actor"] = actor
            rehash_grant(grant)

        def unknown_member(state: dict[str, Any]) -> None:
            replace_quality_actor(state, "ghost-reviewer")

        def registry_role_drift(state: dict[str, Any]) -> None:
            replace_quality_actor(state, "architecture")
            member = next(item for item in state["team"] if item["role"] == "reviewer")
            member["model_profile"] = "architecture_profile"
            member["path_scopes"] = ["docs/**"]

        def writer_capability_drift(state: dict[str, Any]) -> None:
            member = next(item for item in state["team"] if item["role"] == "writer")
            member.update(
                {
                    "id": "architecture",
                    "model_profile": "architecture_profile",
                    "path_scopes": ["docs/**"],
                }
            )
            state["selection"]["writer"] = "architecture"
            state["selection"]["eligible_writers"] = ["architecture"]
            state["write_ownership"][0]["owner"] = "architecture"
            grant = state["authority_grants"]["write"].pop("backend")
            grant["agent"] = "architecture"
            rehash_grant(grant)
            state["authority_grants"]["write"] = {"architecture": grant}

        def model_profile_drift(state: dict[str, Any]) -> None:
            member = next(item for item in state["team"] if item["role"] == "reviewer")
            member["model_profile"] = "backend_profile"

        def quality_phase_drift(state: dict[str, Any]) -> None:
            grant = state["authority_grants"]["quality"]["initial"]["reviewer"]
            grant["phase"] = "final"
            rehash_grant(grant)

        mutations: tuple[tuple[str, Callable[[dict[str, Any]], None]], ...] = (
            ("unknown_member_and_quality_actor", unknown_member),
            ("registry_role_drift", registry_role_drift),
            ("writer_capability_drift", writer_capability_drift),
            ("model_profile_drift", model_profile_drift),
            ("quality_phase_drift", quality_phase_drift),
        )
        for label, mutate in mutations:
            with self.subTest(corruption=label):
                run = self.run_request(request(idempotency_key=f"registry-rejoin-{label}"))
                rewrite_committed_state(self.runs_dir, run, mutate)
                self._assert_integrity_blocked(run)

    def test_finding_and_resolution_receipts_are_append_only_and_semantically_bound(self) -> None:
        failed, with_receipt, fixed, artifact_receipt = self._fixed_finding_run(
            "finding-append-only"
        )
        with self.subTest(contract="finding_receipt_immutable"):
            self.assertEqual(failed["findings"], fixed["findings"])
            self.assertTrue(all(item["status"] == "open" for item in fixed["findings"]))
        with self.subTest(contract="artifact_receipt_immutable"):
            persisted = next(
                item
                for item in fixed["implementation_log"]
                if item.get("receipt_id") == artifact_receipt["receipt_id"]
            )
            self.assertEqual(artifact_receipt, persisted)
            self.assertEqual(
                with_receipt["implementation_log"],
                fixed["implementation_log"][: len(with_receipt["implementation_log"])],
            )

        resolutions = [
            item
            for item in fixed["implementation_log"]
            if item.get("kind") == "finding_resolution_receipt"
        ]
        with self.subTest(contract="resolution_receipt_appended"):
            self.assertEqual(1, len(resolutions))
        if resolutions:
            resolution = resolutions[0]
            with self.subTest(contract="resolution_identity_and_digest"):
                self.assertEqual("resolved", resolution.get("status"))
                self.assertEqual("I-8", resolution.get("issue_id"))
                self.assertEqual("finding.append-only", resolution.get("clause"))
                self.assertEqual("app/finding-I-8.diff", resolution.get("location"))
                self.assertEqual(failed["findings"][0]["digest"], resolution.get("finding_digest"))
                self.assertEqual(artifact_receipt["digest"], resolution.get("fix_artifact_digest"))
                self.assertEqual(
                    sha256_digest(
                        {
                            key: value
                            for key, value in resolution.items()
                            if key != "digest"
                        }
                    ),
                    resolution.get("digest"),
                )
        catalog = next(item for item in fixed["finding_catalog"] if item["issue_id"] == "I-8")
        with self.subTest(contract="catalog_status_is_derived"):
            self.assertEqual("resolved", catalog.get("status"))
            if resolutions:
                self.assertEqual(
                    resolutions[0].get("digest"), catalog.get("resolution_receipt_digest")
                )

        def arbitrary_finding_status(state: dict[str, Any]) -> None:
            finding = next(item for item in state["findings"] if item["issue_id"] == "I-8")
            finding["status"] = "ignored"
            finding["digest"] = sha256_digest(
                {key: value for key, value in finding.items() if key != "digest"}
            )

        def mismatched_catalog_identity(state: dict[str, Any]) -> None:
            catalog_entry = next(
                item for item in state["finding_catalog"] if item["issue_id"] == "I-8"
            )
            catalog_entry["issue_id"] = "I-8-FORGED"

        for label, mutate in (
            ("arbitrary_rehashed_finding_status", arbitrary_finding_status),
            ("catalog_issue_identity", mismatched_catalog_identity),
        ):
            with self.subTest(corruption=label):
                _, _, corruptible, _ = self._fixed_finding_run(f"finding-corrupt-{label}")
                rewrite_committed_state(self.runs_dir, corruptible, mutate)
                self._assert_integrity_blocked(corruptible)

        if resolutions:
            def corrupt_resolution_digest(state: dict[str, Any]) -> None:
                resolution = next(
                    item
                    for item in state["implementation_log"]
                    if item.get("kind") == "finding_resolution_receipt"
                )
                resolution["attempt"] += 1

            def forge_open_resolution(state: dict[str, Any]) -> None:
                resolution = next(
                    item
                    for item in state["implementation_log"]
                    if item.get("kind") == "finding_resolution_receipt"
                )
                resolution["status"] = "open"
                resolution["digest"] = sha256_digest(
                    {key: value for key, value in resolution.items() if key != "digest"}
                )

            for label, mutate in (
                ("resolution_digest", corrupt_resolution_digest),
                ("open_resolution_bypass", forge_open_resolution),
            ):
                with self.subTest(corruption=label):
                    _, _, corruptible, _ = self._fixed_finding_run(
                        f"finding-corrupt-{label}"
                    )
                    rewrite_committed_state(self.runs_dir, corruptible, mutate)
                    self._assert_integrity_blocked(corruptible)

    def test_generic_transition_cannot_enter_retrying_without_failed_report_evidence(self) -> None:
        started = self.run_request(request(idempotency_key="direct-retrying-entry"))
        verifying = self.resume_run(
            started,
            events=[
                {
                    "type": "transition",
                    "from": "implementing",
                    "to": "verifying",
                    "actor": "orchestrator",
                }
            ],
        )
        before = semantic_snapshot(verifying)
        attempted = self.resume_run(
            verifying,
            events=[
                {
                    "type": "transition",
                    "from": "verifying",
                    "to": "retrying",
                    "actor": "orchestrator",
                }
            ],
        )
        with self.subTest(contract="evidence_free_entry_is_atomic"):
            self.assertEqual("verifying", attempted["state"])
            after = semantic_snapshot(attempted)
            before.pop("revision")
            after.pop("revision")
            self.assertEqual(before, after)
            self.assertRegex(
                json.dumps(attempted["rejections"]).lower(),
                r"retry.*(?:evidence|gate|report)|dedicated.*retry",
            )

        recovery_start = self.run_request(request(idempotency_key="report-retrying-entry"))
        recovery_verifying = self.resume_run(
            recovery_start,
            events=[
                {
                    "type": "transition",
                    "from": "implementing",
                    "to": "verifying",
                    "actor": "orchestrator",
                }
            ],
        )
        recovered = self.resume_run(
            recovery_verifying,
            events=[
                report_event(
                    recovery_verifying,
                    "verification",
                    "failed",
                    cause="canonical failed report",
                )
            ],
        )
        with self.subTest(contract="failed_report_gate_remains_recoverable"):
            self.assertEqual("retrying", recovered["state"])
            self.assertTrue(recovered["failure_history"])
            self.assertEqual(
                1, recovered["retry_causes"].get(sha256_digest("canonical failed report"))
            )

    def test_persisted_quality_reports_revalidate_full_current_evidence(self) -> None:
        def initial_mutation(
            state: dict[str, Any], mutate: Callable[[dict[str, Any], dict[str, Any]], None]
        ) -> None:
            report = state["initial_verification_report"]
            mutate(state, report)
            sync_verification_projection(state, report)

        def set_and_resign(field: str, value: Any) -> Callable[[dict[str, Any], dict[str, Any]], None]:
            def mutate(_state: dict[str, Any], report: dict[str, Any]) -> None:
                report[field] = value(report) if callable(value) else value
                resign_quality_report(report)

            return mutate

        def corrupt_report_digest(_state: dict[str, Any], report: dict[str, Any]) -> None:
            report["report_digest"] = sha256_digest("forged report digest")

        def corrupt_issued_generation(state: dict[str, Any], report: dict[str, Any]) -> None:
            report["authority_grant"]["issued_revision"] = state["revision"]
            rehash_grant(report["authority_grant"])
            resign_quality_report(report)

        initial_cases: tuple[
            tuple[str, Callable[[dict[str, Any], dict[str, Any]], None]], ...
        ] = (
            ("report_digest", corrupt_report_digest),
            ("attempt", set_and_resign("attempt", lambda report: report["attempt"] + 1)),
            (
                "plan_revision",
                set_and_resign("plan_revision", lambda report: report["plan_revision"] + 1),
            ),
            (
                "artifact_revision",
                set_and_resign(
                    "artifact_revision", lambda report: report["artifact_revision"] + 1
                ),
            ),
            ("artifact_digest", set_and_resign("artifact_digest", sha256_digest("other artifact"))),
            ("diff_digest", set_and_resign("diff_digest", sha256_digest("other diff"))),
            ("input_fingerprint", set_and_resign("input_fingerprint", sha256_digest("other input"))),
            (
                "environment_fingerprint",
                set_and_resign("environment_fingerprint", sha256_digest("other environment")),
            ),
            (
                "provenance",
                set_and_resign(
                    "provenance",
                    lambda report: {**report["provenance"], "producer": "ghost-verifier"},
                ),
            ),
            (
                "checks",
                set_and_resign("checks", lambda report: [*report["checks"], "ghost-check"]),
            ),
            ("issued_generation", corrupt_issued_generation),
        )
        for label, mutate in initial_cases:
            with self.subTest(report="initial", corruption=label):
                run = self.run_request(request(idempotency_key=f"report-initial-{label}"))
                verified = self.resume_run(
                    run, events=[report_event(run, "verification", "passed")]
                )
                rewrite_committed_state(
                    self.runs_dir,
                    verified,
                    lambda state, mutation=mutate: initial_mutation(state, mutation),
                )
                self._assert_integrity_blocked(verified)

        def final_mutation(
            state: dict[str, Any], field: str, value: Any
        ) -> None:
            report = state["final_verification_report"]
            report[field] = value
            resign_quality_report(report)
            sync_verification_projection(state, report)

        final_cases = (
            ("staging_artifact_digest", sha256_digest("other staging")),
            ("source_manifest_digest", sha256_digest("other source manifest")),
            ("source_revision", 999),
        )
        for field, value in final_cases:
            with self.subTest(report="final", corruption=field):
                run = self.run_request(request(idempotency_key=f"report-final-{field}"))
                staged = self.stage(run)
                final_verified = self.resume_run(
                    staged,
                    events=[report_event(staged, "verification", "passed", phase="final")],
                )
                rewrite_committed_state(
                    self.runs_dir,
                    final_verified,
                    lambda state, key=field, replacement=value: final_mutation(
                        state, key, replacement
                    ),
                )
                self._assert_integrity_blocked(final_verified)

    def test_execution_policy_is_the_only_canonical_state_graph_owner(self) -> None:
        policy = json.loads(
            (CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8")
        )
        states = set(policy["states"])
        source_paths = {
            "state": ROOT / "team_harness" / "state.py",
            "orchestrator": ROOT / "team_harness" / "orchestrator.py",
            "checker": ROOT / "scripts" / "verify_project_ai_harness.py",
        }
        forbidden_constants = {
            "CANONICAL_STATES",
            "CANONICAL_TERMINAL_STATES",
            "CANONICAL_RESERVED_STATES",
            "CANONICAL_WRITE_STATES",
            "CANONICAL_ALLOWED_TRANSITIONS",
            "REQUIRED_GATE_TRANSITIONS",
        }
        for label, path in source_paths.items():
            source = path.read_text(encoding="utf-8")
            with self.subTest(source=label, contract="named_duplicate"):
                self.assertFalse(forbidden_constants.intersection(source.split()))
            with self.subTest(source=label, contract="literal_state_set"):
                self.assertEqual([], literal_state_collections(source, states))

        schema = json.loads(
            (CONFIG_ROOT / "team-harness.schema.json").read_text(encoding="utf-8")
        )
        definitions = schema["$defs"]
        policy_schema = definitions["executionPolicy"]
        write_schema = definitions["writeAuthorizationPolicy"]["properties"]["allowed_states"]
        with self.subTest(source="schema", contract="structural_policy_only"):
            self.assertEqual([], schema_state_collections(policy_schema, states))
            self.assertEqual([], schema_state_collections(write_schema, states))
            self.assertNotIn("const", policy_schema["properties"]["allowed_transitions"])


if __name__ == "__main__":
    import unittest

    unittest.main()
