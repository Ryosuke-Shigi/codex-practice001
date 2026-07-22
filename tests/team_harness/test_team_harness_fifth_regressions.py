"""Negative contracts from the fifth architecture and reviewer audit."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Mapping

from test_team_harness_contract import (
    CONFIG_ROOT,
    TeamHarnessContractTestCase,
    issued_write_grant,
    minimal_policy,
    minimal_registry,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_hardening_contract import rejection_codes


REQUIRED_RESERVED_STATES = {
    "implementation_approved",
    "source_sync",
    "final_verification",
    "final_review",
    "completed",
    "blocked",
    "failed",
    "needs_human_approval",
    "cancelled",
}


def semantic_snapshot(run: Mapping[str, Any]) -> dict[str, Any]:
    return copy.deepcopy(
        {
            "revision": run["revision"],
            "state": run["state"],
            "shared_plan": run["shared_plan"],
            "artifact_revision": run["artifact_revision"],
            "current_artifact_digest": run["current_artifact_digest"],
            "implementation_log": run["implementation_log"],
            "findings": run["findings"],
            "attempt_count": run["attempt_count"],
        }
    )


class ReservedPolicyAndBatchRegressionTest(TeamHarnessContractTestCase):
    def test_canonical_policy_and_schema_define_every_harness_reserved_state(self) -> None:
        from team_harness import TeamHarness, validate_document

        policy = json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8"))
        schema = json.loads((CONFIG_ROOT / "team-harness.schema.json").read_text(encoding="utf-8"))
        with self.subTest(source="canonical_policy"):
            self.assertTrue(REQUIRED_RESERVED_STATES.issubset(set(policy["reserved_states"])))
            self.assertTrue(set(policy["terminal_states"]).issubset(policy["reserved_states"]))
            self.assertEqual(set(policy["states"]), set(policy["allowed_transitions"]))
            self.assertEqual(
                policy["policy_digest"],
                sha256_digest(
                    {key: value for key, value in policy.items() if key != "policy_digest"}
                ),
            )
        execution = schema["$defs"]["executionPolicy"]
        with self.subTest(source="structural_schema"):
            self.assertIs(execution["additionalProperties"], False)
            for field in ("states", "terminal_states", "reserved_states", "allowed_transitions"):
                self.assertIn(field, execution["required"])
                self.assertIn(field, execution["properties"])
            self.assertEqual(
                {"$ref": "#/$defs/nonEmptyStringList"},
                execution["properties"]["reserved_states"],
            )
            self.assertEqual([], validate_document("execution_policy", policy))
        loaded = TeamHarness(
            minimal_registry(), policy, self.runs_dir / "canonical-policy-pin"
        )
        self.assertEqual(policy, loaded.policy)

    def test_constructor_rejects_missing_or_incomplete_reserved_states_without_defaulting(self) -> None:
        from team_harness import TeamHarness, validate_document

        with self.subTest(case="missing"):
            missing = minimal_policy()
            missing.pop("reserved_states")
            self.assertTrue(validate_document("execution_policy", missing))
            with self.assertRaises(ValueError):
                TeamHarness(minimal_registry(), missing, self.runs_dir / "reserved-missing")

        with self.subTest(case="incomplete"):
            incomplete = minimal_policy()
            incomplete["reserved_states"] = sorted(REQUIRED_RESERVED_STATES - {"blocked"})
            with self.assertRaises(ValueError):
                TeamHarness(minimal_registry(), incomplete, self.runs_dir / "reserved-incomplete")

    def test_generic_reserved_transition_batch_cannot_mutate_later_plan_artifact_or_finding(self) -> None:
        for target in sorted(REQUIRED_RESERVED_STATES):
            with self.subTest(target=target):
                run = self.run_request(request(idempotency_key=f"reserved-batch-{target}"))
                before = semantic_snapshot(run)
                result = self.resume_run(
                    run,
                    events=[
                        {
                            "type": "transition", "from": run["state"], "to": target,
                            "actor": "orchestrator",
                        },
                        {"type": "plan_revised", "change": "must not execute after reserved transition"},
                        {
                            "type": "artifact", "actor": self.roles(run)["writer"],
                            "authority_grant": issued_write_grant(run),
                            "path": run["task_contract"]["allowed_paths"][0],
                            "content": {"patch": "must not persist"},
                        },
                        {
                            "type": "finding", "actor": "reviewer", "source": "reviewer",
                            "issue_id": f"BATCH-{target}", "clause": "event.batch.atomic",
                            "location": "run", "kind": "quality", "message": "must not persist",
                            "status": "open",
                        },
                    ],
                )
                self.assertEqual(before, semantic_snapshot(result))
                self.assertIn("reserved_state_transition", rejection_codes(result))


class ArtifactReceiptAuthorityRegressionTest(TeamHarnessContractTestCase):
    def artifact_event(
        self,
        run: Mapping[str, Any],
        *,
        actor: str,
        path: str | None = None,
        content: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        return {
            "type": "artifact",
            "actor": actor,
            "authority_grant": issued_write_grant(run),
            "path": path or run["task_contract"]["allowed_paths"][0],
            "content": copy.deepcopy(
                dict(
                    content
                    or {
                        "issue_ids": ["SELF-ISSUE"],
                        "check_ids": ["self-check"],
                        "deliverable_ids": ["self-deliverable"],
                        "patch": "caller supplied",
                    }
                )
            ),
        }

    def assert_artifact_rejected_without_mutation(
        self, run: Mapping[str, Any], event: Mapping[str, Any]
    ) -> None:
        before = semantic_snapshot(run)
        result = self.resume_run(run, events=[dict(event)])
        self.assertEqual(before, semantic_snapshot(result))
        self.assertTrue(result["rejections"])

    def test_unassigned_and_quality_actors_cannot_mint_any_receipt_kind(self) -> None:
        for actor in ("attacker", "reviewer", "verifier"):
            with self.subTest(actor=actor):
                run = self.run_request(request(idempotency_key=f"receipt-actor-{actor}"))
                self.assert_artifact_rejected_without_mutation(
                    run, self.artifact_event(run, actor=actor)
                )

    def test_primary_writer_receipt_rejects_out_of_scope_path_and_non_write_state(self) -> None:
        with self.subTest(case="scope"):
            run = self.run_request(request(idempotency_key="receipt-scope"))
            self.assert_artifact_rejected_without_mutation(
                run,
                self.artifact_event(
                    run, actor=self.roles(run)["writer"], path="app/Services/Outside.php"
                ),
            )

        with self.subTest(case="state"):
            approved_start = self.run_request(request(idempotency_key="receipt-state"))
            approved = self.initially_approve(approved_start)
            self.assertEqual("implementation_approved", approved["state"])
            self.assert_artifact_rejected_without_mutation(
                approved,
                self.artifact_event(approved, actor=self.roles(approved)["writer"]),
            )

    def test_authorized_receipt_persists_raw_immutable_content_ref_digest_and_grant_binding(self) -> None:
        run = self.run_request(request(idempotency_key="receipt-persistence"))
        content = {
            "issue_ids": [], "check_ids": ["unit"], "deliverable_ids": ["implementation"],
            "patch": "immutable content",
        }
        result = self.resume_run(
            run,
            events=[
                self.artifact_event(run, actor=self.roles(run)["writer"], content=content)
            ],
        )
        receipts = [
            item for item in result["implementation_log"] if item.get("kind") == "artifact_receipt"
        ]
        self.assertTrue(receipts)
        receipt = receipts[-1]
        self.assertTrue(
            {"ref", "digest", "authority_grant_digest", "raw_content_persisted"}.issubset(receipt)
        )
        self.assertTrue(receipt["raw_content_persisted"])
        writer = self.roles(run)["writer"]
        self.assertEqual(
            run["authority_grants"]["write"][writer]["grant_digest"],
            receipt["authority_grant_digest"],
        )
        root = (self.runs_dir / run["run_id"]).resolve()
        content_path = (root / receipt["ref"]).resolve()
        content_path.relative_to(root)
        self.assertTrue(content_path.is_file())
        persisted = json.loads(content_path.read_text(encoding="utf-8"))
        self.assertEqual(content, persisted)
        self.assertEqual(sha256_digest(content), receipt["digest"])


class RetryConditionReceiptRegressionTest(TeamHarnessContractTestCase):
    def test_receipt_condition_is_required_and_missing_condition_is_atomic(self) -> None:
        payload = request(
            idempotency_key="retry-condition-receipt",
            paths=[
                "app/Http/Controllers/ExampleController.php",
                "app/fix.diff",
            ],
            events=[
                {
                    "type": "finding", "actor": "verifier", "source": "verifier",
                    "issue_id": "RETRY-COND-1", "clause": "retry.condition",
                    "location": "app/fix.diff", "kind": "quality", "message": "retry condition",
                    "status": "open",
                }
            ],
        )
        payload["task_contract"]["retry_conditions"] = ["receipt:security-check"]
        run = self.run_request(payload)
        failed = self.resume_run(
            run,
            events=[report_event(run, "verification", "failed", cause="retry condition")],
        )
        with_receipt = self.resume_run(
            failed,
            events=[
                {
                    "type": "artifact", "actor": self.roles(failed)["writer"],
                    "authority_grant": issued_write_grant(failed),
                    "path": "app/fix.diff",
                    "content": {
                        "issue_ids": ["RETRY-COND-1"], "check_ids": [],
                        "deliverable_ids": [], "patch": "does not prove security-check",
                    },
                }
            ],
        )
        receipt = with_receipt["implementation_log"][-1]
        history = failed["failure_history"][-1]
        before = semantic_snapshot(with_receipt)
        result = self.resume_run(
            with_receipt,
            events=[
                {
                    "type": "fix_applied", "actor": self.roles(with_receipt)["writer"],
                    "cause": "retry condition", "attempt": with_receipt["attempt_count"] + 1,
                    "plan_revision": with_receipt["shared_plan"]["revision"],
                    "issue_ids": ["RETRY-COND-1"],
                    "failed_report_digest": history["report_digest"],
                    "cause_fingerprint": sha256_digest("retry condition"),
                    "changed_input_fingerprint": with_receipt["input_fingerprint"],
                    "changed_diff_digest": receipt["digest"],
                    "environment_fingerprint": with_receipt["environment_fingerprint"],
                    "fix_artifact": receipt,
                }
            ],
        )
        with self.subTest(assertion="atomic"):
            self.assertEqual(before, semantic_snapshot(result))
        with self.subTest(assertion="condition"):
            self.assertRegex(
                json.dumps(result["rejections"]).lower(),
                r"receipt:security-check|retry.*condition",
            )


class ConstructorCanonicalInputRegressionTest(TeamHarnessContractTestCase):
    def test_registry_constructor_rejects_fully_legacy_shape_instead_of_backfilling(self) -> None:
        from team_harness import TeamHarness, validate_document

        legacy = minimal_registry()
        legacy.pop("registry_kind")
        for agent in legacy["agents"]:
            agent["runtime_profile"] = agent.pop("model_profile")
            agent.pop("risk_triggers")
        self.assertTrue(validate_document("agent_registry", legacy))
        with self.assertRaises(ValueError):
            TeamHarness(legacy, minimal_policy(), self.runs_dir / "legacy-registry-default")

    def test_policy_constructor_rejects_each_missing_required_value_without_backfilling(self) -> None:
        from team_harness import TeamHarness, validate_document

        cases = {
            "states": lambda policy: policy.pop("states"),
            "reserved_states": lambda policy: policy.pop("reserved_states"),
            "retention": lambda policy: policy.pop("retention"),
            "parallel_write_requires": lambda policy: policy["write_authorization"].pop(
                "parallel_write_requires"
            ),
            "legacy_entrypoint": lambda policy: policy["legacy_adapter"].pop("entrypoint"),
        }
        for label, mutate in cases.items():
            with self.subTest(field=label):
                policy = minimal_policy()
                mutate(policy)
                self.assertTrue(validate_document("execution_policy", policy))
                with self.assertRaises(ValueError):
                    TeamHarness(minimal_registry(), policy, self.runs_dir / f"policy-{label}")


class TopLevelRoleAssignmentRegressionTest(TeamHarnessContractTestCase):
    def alternate_registry(self) -> dict[str, Any]:
        registry = minimal_registry()
        registry["agents"].extend(
            [
                {
                    "id": "z_backend_alt", "roles": ["specialist", "writer"],
                    "domains": ["backend", "api"], "capabilities": ["php"],
                    "path_scopes": ["app/**", "routes/**"], "risk_triggers": [],
                    "model_profile": "backend_alt_profile",
                },
                {
                    "id": "z_reviewer_alt", "roles": ["reviewer"], "domains": ["quality"],
                    "capabilities": ["review"], "path_scopes": ["**"], "risk_triggers": [],
                    "model_profile": "reviewer_alt_profile",
                },
                {
                    "id": "z_verifier_alt", "roles": ["verifier"], "domains": ["quality"],
                    "capabilities": ["verification"], "path_scopes": ["**"], "risk_triggers": [],
                    "model_profile": "verifier_alt_profile",
                },
            ]
        )
        return registry

    def test_top_level_role_assignments_drive_exact_team_primary_writer_and_grant(self) -> None:
        result = self.run_request(
            request(
                idempotency_key="top-level-role-exact",
                role_assignments={
                    "writer": "z_backend_alt",
                    "reviewer": "z_reviewer_alt",
                    "verifier": "z_verifier_alt",
                },
            ),
            registry=self.alternate_registry(),
        )
        with self.subTest(assertion="roles"):
            self.assertEqual(
                {
                    "writer": "z_backend_alt",
                    "reviewer": "z_reviewer_alt",
                    "verifier": "z_verifier_alt",
                },
                self.roles(result),
            )
        with self.subTest(assertion="selection"):
            self.assertEqual("z_backend_alt", result["selection"]["writer"])
        with self.subTest(assertion="grant"):
            self.assertEqual({"z_backend_alt"}, set(result["authority_grants"]["write"]))

    def test_requested_writer_scope_mismatch_blocks_without_silent_fallback(self) -> None:
        result = self.run_request(
            request(
                idempotency_key="top-level-role-scope",
                role_assignments={
                    "writer": "frontend", "reviewer": "reviewer", "verifier": "verifier",
                },
            )
        )
        with self.subTest(assertion="state"):
            self.assertEqual("blocked", result["state"])
        with self.subTest(assertion="selection"):
            self.assertIsNone(result["selection"]["writer"])
        with self.subTest(assertion="grant"):
            self.assertFalse(result["authority_grants"]["write"])
        with self.subTest(assertion="rejection"):
            self.assertRegex(
                json.dumps(result["rejections"]).lower(), r"assignment.*scope|writer.*scope"
            )
