"""Executable acceptance contract for the project-neutral Specialist Team harness.

The tests deliberately accept a small choice of facade names so the production
package can expose either ``TeamHarness`` or a narrow function facade.  The
observable contract (states, selected roles, persisted provenance, and safety
decisions) is intentionally not optional.
"""

from __future__ import annotations

import copy
import importlib
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from typing import Any, Mapping


ROOT = Path(__file__).resolve().parents[2]
CONFIG_ROOT = ROOT / ".codex" / "team-harness"
MISSING = object()


def minimal_registry() -> dict[str, Any]:
    """A project-neutral registry used by every behavioral contract test."""
    return {
        "schema_version": "1.0",
        "registry_kind": "project_neutral_test_capabilities",
        "agents": [
            {
                "id": "backend",
                "roles": ["specialist", "writer"],
                "domains": ["backend", "api"],
                "capabilities": ["php", "repository", "service", "dto", "validation"],
                "path_scopes": ["app/**", "routes/**"],
                "risk_triggers": [],
                "model_profile": "backend_profile",
            },
            {
                "id": "frontend",
                "roles": ["specialist", "writer"],
                "domains": ["frontend", "ui"],
                "capabilities": ["react", "typescript", "props"],
                "path_scopes": ["resources/js/**"],
                "risk_triggers": [],
                "model_profile": "frontend_profile",
            },
            {
                "id": "architecture",
                "roles": ["specialist"],
                "domains": ["architecture"],
                "capabilities": ["adr", "boundary", "strategy"],
                "path_scopes": ["docs/**"],
                "risk_triggers": [],
                "model_profile": "architecture_profile",
            },
            {
                "id": "security",
                "roles": ["specialist"],
                "domains": ["security"],
                "capabilities": ["authorization", "authentication", "threat-model"],
                "path_scopes": ["app/**", "routes/**"],
                "risk_triggers": [],
                "model_profile": "security_profile",
            },
            {
                "id": "operations",
                "roles": ["specialist"],
                "domains": ["operations"],
                "capabilities": ["queue", "scheduler", "migration"],
                "path_scopes": ["app/**", "database/**"],
                "risk_triggers": [],
                "model_profile": "operations_profile",
            },
            {
                "id": "reviewer",
                "roles": ["reviewer"],
                "domains": ["quality"],
                "capabilities": ["review", "architecture-review"],
                "path_scopes": ["**"],
                "risk_triggers": [],
                "model_profile": "reviewer_profile",
            },
            {
                "id": "verifier",
                "roles": ["verifier"],
                "domains": ["quality"],
                "capabilities": ["verification", "test"],
                "path_scopes": ["**"],
                "risk_triggers": [],
                "model_profile": "verifier_profile",
            },
        ],
    }


def minimal_policy() -> dict[str, Any]:
    return json.loads((CONFIG_ROOT / "execution-policy.json").read_text(encoding="utf-8"))


def request(
    title: str = "Add backend endpoint",
    *,
    domains: list[str] | None = None,
    capabilities: list[str] | None = None,
    paths: list[str] | None = None,
    risk: str = "low",
    **extra: Any,
) -> dict[str, Any]:
    allowed_paths = paths if paths is not None else ["app/Http/Controllers/ExampleController.php"]
    affected_domains = domains if domains is not None else ["backend"]
    required_capabilities = capabilities if capabilities is not None else ["php"]
    result: dict[str, Any] = {
        "schema_version": "1.0",
        "idempotency_key": extra.pop("idempotency_key", "request-001"),
        "task_contract": {
            "task_id": extra.pop("task_id", "task-001"),
            "title": title,
            "goal": f"Deliver: {title}",
            "background": "Acceptance-contract fixture for the project-neutral harness",
            "current_state": "Contracted change has not been implemented",
            "desired_state": "Contracted change is implemented and independently accepted",
            "scope": {"include": allowed_paths},
            "non_goals": ["Do not expand privileges or edit outside declared ownership"],
            "acceptance_criteria": ["All required checks and independent gates pass"],
            "constraints": ["Task Contract is immutable", "Fail closed on incomplete evidence"],
            "source_of_truth": ["task_contract", "execution_policy"],
            "allowed_paths": allowed_paths,
            "forbidden_paths": [".env*", ".git/**"],
            "affected_domains": affected_domains,
            "risk_level": risk,
            "required_capabilities": required_capabilities,
            "team_assignment": {"mode": "dynamic"},
            "primary_writer": "dynamic",
            "consulting_specialists": [],
            "reviewer": "dynamic",
            "verifier": "dynamic",
            "write_ownership": [{"owner": "dynamic", "paths": allowed_paths}],
            "required_checks": ["unit", "contract"],
            "stop_conditions": ["specification conflict", "unverifiable evidence"],
            "retry_conditions": ["changed input, diff, or environment evidence"],
            "approval_boundaries": ["privilege expansion", "source activation"],
            "required_deliverables": ["implementation", "verification report", "review report"],
            "information_source_sync": {"required": False, "manual_activation": True},
            "completion_conditions": ["initial and final verification/review pass"],
        },
    }
    result.update(extra)
    return result


def sha256_digest(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def evidence_from(run: Mapping[str, Any]) -> dict[str, Any]:
    """Return the exact current-attempt evidence quality reports must bind."""

    return {
        "attempt": run["attempt_count"],
        "plan_revision": run["shared_plan"]["revision"],
        "artifact_revision": run.get("artifact_revision", -1),
        "artifact_digest": run.get("current_artifact_digest", sha256_digest("missing-artifact")),
        "diff_digest": run.get("diff_digest", sha256_digest("missing-diff")),
        "input_fingerprint": run.get("input_fingerprint", sha256_digest("missing-input")),
        "environment_fingerprint": run.get("environment_fingerprint", sha256_digest("missing-environment")),
    }


def source_request_for(run: Mapping[str, Any], **overrides: Any) -> dict[str, Any]:
    """Return a canonical closed source request bound to the supplied Run State."""

    result = {
        "schema_version": "1.0",
        "artifact_revision": run["artifact_revision"],
        "artifact_digest": run["current_artifact_digest"],
        "payload": {"changes": ["source update"]},
        "source_baseline_digest": sha256_digest("source baseline"),
        "target_identity": {"system": "external", "catalog": "team-harness"},
        "activate": False,
    }
    result.update(overrides)
    return result


def report_event(
    run: Mapping[str, Any],
    report: str,
    status: str,
    *,
    phase: str = "initial",
    cause: str | None = None,
    actor: str | None = None,
) -> dict[str, Any]:
    role = "verifier" if report == "verification" else "reviewer"
    assigned = {str(member["role"]): str(member["id"]) for member in run["team"]}
    grant = issued_quality_grant(run, phase, role)
    event: dict[str, Any] = {
        "type": f"{report}_report",
        "phase": phase,
        "status": status,
        "actor": actor or assigned[role],
        "authority_grant": grant,
        "checks": list(run.get("task_contract", {}).get("required_checks", [])),
        **evidence_from(run),
        "provenance": {
            "producer": actor or assigned[role],
            "run_id": run["run_id"],
            "contract_digest": run["contract_digest"],
        },
    }
    if phase == "final":
        sync = run.get("source_sync", {})
        staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
        event["staging_artifact_digest"] = staging.get("digest") if isinstance(staging, Mapping) else None
        event["source_manifest_digest"] = sync.get("manifest_digest") if isinstance(sync, Mapping) else None
    if cause:
        event["cause"] = cause
    event["report_digest"] = sha256_digest(event)
    return event


def parent_lease(
    run: Mapping[str, Any],
    agent: str,
    paths: list[str],
    *,
    lease_id: str | None = None,
) -> dict[str, Any]:
    grants = run.get("authority_grants")
    writers = grants.get("write") if isinstance(grants, Mapping) else None
    lease = writers.get(agent) if isinstance(writers, Mapping) else None
    if not isinstance(lease, Mapping):
        raise AssertionError(f"Run State must persist an issued writer grant for {agent}")
    required = {
        "grant_id", "grant_digest", "kind", "run_id", "agent", "epoch", "expires_at",
        "ownership_revision", "paths", "issued_by", "runtime_authenticity_verified",
    }
    if not required.issubset(lease):
        raise AssertionError(f"issued writer grant is incomplete: {sorted(required - set(lease))}")
    return copy.deepcopy(dict(lease))


def issued_quality_grant(run: Mapping[str, Any], phase: str, role: str) -> dict[str, Any]:
    grants = run.get("authority_grants")
    quality = grants.get("quality") if isinstance(grants, Mapping) else None
    phase_grants = quality.get(phase) if isinstance(quality, Mapping) else None
    grant = phase_grants.get(role) if isinstance(phase_grants, Mapping) else None
    if not isinstance(grant, Mapping):
        raise AssertionError(f"Run State must persist an issued {phase} {role} authority grant")
    required = {
        "grant_id", "grant_digest", "kind", "run_id", "actor", "role", "phase", "attempt",
        "plan_revision", "artifact_revision", "artifact_digest", "expires_at", "issued_by",
        "runtime_authenticity_verified",
    }
    if not required.issubset(grant):
        raise AssertionError(f"issued quality grant is incomplete: {sorted(required - set(grant))}")
    return copy.deepcopy(dict(grant))


def issued_write_grant(run: Mapping[str, Any]) -> dict[str, Any]:
    """Return the exact active primary-writer grant from the supplied Run State."""

    writer = run.get("selection", {}).get("writer")
    grants = run.get("authority_grants")
    write = grants.get("write") if isinstance(grants, Mapping) else None
    grant = write.get(writer) if isinstance(write, Mapping) else None
    if not isinstance(writer, str) or not writer or not isinstance(grant, Mapping):
        raise AssertionError("Run State must persist an active primary-writer authority grant")
    return copy.deepcopy(dict(grant))


class HarnessAdapter:
    """Compatibility adapter for facade spelling only; never for semantics."""

    def __init__(self, runs_dir: Path) -> None:
        try:
            self.module = importlib.import_module("team_harness")
        except ModuleNotFoundError as error:
            raise AssertionError(
                "team_harness package is required; implement TeamHarness or a run_task facade"
            ) from error
        self.runs_dir = runs_dir
        self.registry = minimal_registry()
        self.policy = minimal_policy()
        self.facade = self._make_facade()

    def _make_facade(self) -> Any:
        facade_type = getattr(self.module, "TeamHarness", None)
        if facade_type is None:
            return None
        constructors = (
            lambda: facade_type(self.registry, self.policy, self.runs_dir),
            lambda: facade_type(registry=self.registry, policy=self.policy, runs_dir=self.runs_dir),
            lambda: facade_type.from_config(self.registry, self.policy, runs_dir=self.runs_dir),
        )
        failures: list[Exception] = []
        for constructor in constructors:
            try:
                return constructor()
            except (AttributeError, TypeError) as error:
                failures.append(error)
        raise AssertionError("TeamHarness must accept registry, policy, and an injectable runs_dir") from failures[-1]

    def run(
        self,
        task: Mapping[str, Any],
        *,
        registry: Mapping[str, Any] | None = None,
        policy: Mapping[str, Any] | None = None,
    ) -> Any:
        registry = registry or self.registry
        policy = policy or self.policy
        if self.facade is not None:
            if registry is not self.registry or policy is not self.policy:
                original = (self.registry, self.policy)
                self.registry, self.policy = dict(registry), dict(policy)
                try:
                    self.facade = self._make_facade()
                    return self._call(self.facade, task)
                finally:
                    self.registry, self.policy = original
                    self.facade = self._make_facade()
            return self._call(self.facade, task)
        for name in ("run_task", "run", "orchestrate"):
            function = getattr(self.module, name, None)
            if function is not None:
                return function(task, registry=registry, policy=policy, runs_dir=self.runs_dir)
        raise AssertionError("Expose TeamHarness.run/process/orchestrate or run_task/run/orchestrate")

    @staticmethod
    def _call(facade: Any, task: Mapping[str, Any]) -> Any:
        for name in ("run", "process", "orchestrate"):
            method = getattr(facade, name, None)
            if method is not None:
                return method(task)
        raise AssertionError("TeamHarness must expose run, process, or orchestrate")


class TeamHarnessContractTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.runs_dir = Path(self.temporary_directory.name) / "runs"
        self.harness = HarnessAdapter(self.runs_dir)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def run_request(self, task: Mapping[str, Any], **kwargs: Any) -> Any:
        return self.harness.run(task, **kwargs)

    def resume_run(self, run: Mapping[str, Any], **payload: Any) -> Any:
        return self.run_request(
            {
                "schema_version": "1.0",
                "resume_run_id": run["run_id"],
                "expected_revision": run.get("revision", 0),
                "contract_digest": run["contract_digest"],
                **payload,
            }
        )

    def initially_approve(self, run: Mapping[str, Any]) -> Any:
        verified = self.resume_run(run, events=[report_event(run, "verification", "passed")])
        return self.resume_run(verified, events=[report_event(verified, "review", "passed")])

    def apply_persisted_fix(
        self,
        failed: Mapping[str, Any],
        *,
        cause: str,
        issue_ids: list[str] | None = None,
        path: str = "app/fix.diff",
    ) -> Any:
        """Apply a strict retry using a causal receipt already persisted in Run State."""

        cause_fingerprint = sha256_digest(cause.strip().lower())
        history = next(
            (
                item for item in reversed(failed.get("failure_history", []))
                if item.get("cause_fingerprint") == cause_fingerprint
                and item.get("attempt") == failed.get("attempt_count")
            ),
            None,
        )
        if not isinstance(history, Mapping) or not history.get("report_digest"):
            raise AssertionError("failed Run State must persist current report/cause retry history")
        causal_issues = (
            [str(item) for item in issue_ids]
            if issue_ids is not None
            else [str(item) for item in history.get("issue_ids", [])]
        )
        with_receipt = self.resume_run(
            failed,
            events=[
                {
                    "type": "artifact",
                    "actor": self.roles(failed)["writer"],
                    "authority_grant": issued_write_grant(failed),
                    "path": path,
                    "content": {
                        "issue_ids": causal_issues,
                        "patch": f"strict fix for {cause}",
                    },
                }
            ],
        )
        receipts = [
            item for item in with_receipt.get("implementation_log", [])
            if item.get("kind") == "artifact_receipt" and item.get("path") == path
        ]
        if not receipts:
            raise AssertionError("artifact event must persist a strict fix receipt")
        receipt = receipts[-1]
        return self.resume_run(
            with_receipt,
            events=[
                {
                    "type": "fix_applied",
                    "actor": self.roles(with_receipt)["writer"],
                    "cause": cause,
                    "attempt": with_receipt["attempt_count"] + 1,
                    "plan_revision": with_receipt["shared_plan"]["revision"],
                    "issue_ids": causal_issues,
                    "failed_report_digest": history["report_digest"],
                    "cause_fingerprint": cause_fingerprint,
                    "changed_input_fingerprint": with_receipt["input_fingerprint"],
                    "changed_diff_digest": receipt["digest"],
                    "environment_fingerprint": with_receipt["environment_fingerprint"],
                    "fix_artifact": receipt,
                }
            ],
        )

    def value(self, subject: Any, key: str, default: Any = MISSING) -> Any:
        if isinstance(subject, Mapping) and key in subject:
            return subject[key]
        if hasattr(subject, key):
            return getattr(subject, key)
        for converter in ("to_dict", "as_dict"):
            method = getattr(subject, converter, None)
            if method is not None:
                converted = method()
                if isinstance(converted, Mapping) and key in converted:
                    return converted[key]
        if default is not MISSING:
            return default
        self.fail(f"result must expose {key!r}: {subject!r}")

    def ids(self, result: Any) -> set[str]:
        team = self.value(result, "team")
        return {str(self.value(member, "id")) for member in team}

    def roles(self, result: Any) -> dict[str, str]:
        return {str(self.value(member, "role")): str(self.value(member, "id")) for member in self.value(result, "team")}

    def states(self, result: Any) -> list[str]:
        trace = self.value(result, "state_trace", [])
        return [str(self.value(item, "state", item)) for item in trace]

    def assert_state(self, result: Any, expected: str) -> None:
        self.assertEqual(expected, self.value(result, "state"))


class TeamHarnessAcceptanceScenariosTest(TeamHarnessContractTestCase):
    def test_scenario_01_backend_only_selection(self) -> None:
        result = self.run_request(request())
        self.assertIn("backend", self.ids(result))
        self.assertNotIn("frontend", self.ids(result))
        self.assertEqual("backend", self.roles(result)["writer"])

    def test_scenario_02_frontend_backend_contract(self) -> None:
        result = self.run_request(
            request(
                "Connect React screen to API",
                domains=["frontend", "backend"],
                capabilities=["react", "php", "props"],
                paths=["resources/js/Pages/Example.tsx", "app/Http/Controllers/ExampleController.php"],
            )
        )
        self.assertTrue({"backend", "frontend"}.issubset(self.ids(result)))
        contracts = self.value(result, "interface_contracts")
        self.assertTrue(any("props" in json.dumps(item).lower() for item in contracts))

    def test_scenario_03_dto_repository_service_strategy_boundary(self) -> None:
        result = self.run_request(
            request(
                "Define DTO Repository Service Strategy boundaries",
                domains=["backend", "architecture"],
                capabilities=["dto", "repository", "service", "strategy", "boundary"],
                risk="high",
            )
        )
        self.assertIn("architecture", self.ids(result))
        boundaries = self.value(result, "boundaries")
        self.assertTrue(all(name in json.dumps(boundaries).lower() for name in ("dto", "repository", "service", "strategy")))
        ownership = self.value(result, "write_ownership")
        self.assertEqual(len(ownership), len({json.dumps(item, sort_keys=True) for item in ownership}))

    def test_scenario_04_architecture_decision(self) -> None:
        result = self.run_request(
            request("Choose persistence architecture", domains=["architecture"], capabilities=["adr"], risk="high")
        )
        self.assertIn("architecture", self.ids(result))
        decisions = self.value(result, "architecture_decisions")
        self.assertTrue(decisions)
        self.assertTrue(all(self.value(item, "status") in {"accepted", "needs_human_approval"} for item in decisions))

    def test_scenario_05_security_auth(self) -> None:
        result = self.run_request(
            request(
                "Add authenticated administrator API",
                domains=["backend", "security"],
                capabilities=["php", "authorization", "authentication", "validation"],
                risk="critical",
            )
        )
        self.assertIn("security", self.ids(result))
        security = self.value(result, "security_checks")
        self.assertTrue(all(term in json.dumps(security).lower() for term in ("authorization", "validation")))

    def test_scenario_06_operations_queue_scheduler_migration(self) -> None:
        result = self.run_request(
            request(
                "Add queued scheduled migration maintenance",
                domains=["operations", "backend"],
                capabilities=["queue", "scheduler", "migration"],
                paths=["app/Jobs/ExampleJob.php", "database/migrations/2026_example.php"],
                risk="high",
            )
        )
        self.assertIn("operations", self.ids(result))
        plan = self.value(result, "shared_plan")
        self.assertTrue(all(term in json.dumps(plan).lower() for term in ("queue", "scheduler", "migration")))

    def test_scenario_07_agreeing_findings(self) -> None:
        result = self.run_request(
            request(
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "SCENARIO-07-MISSING-TEST", "clause": "quality.missing-test",
                        "location": "tests", "kind": "quality", "message": "missing test",
                        "severity": "medium", "status": "open",
                    },
                    {
                        "type": "finding", "actor": "verifier", "source": "verifier",
                        "issue_id": "SCENARIO-07-MISSING-TEST", "clause": "quality.missing-test",
                        "location": "tests", "kind": "quality", "message": "missing test",
                        "severity": "medium", "status": "open",
                    },
                ]
            )
        )
        findings = self.value(result, "findings")
        self.assertGreaterEqual(len(findings), 2, "received findings are append-only, including duplicates")
        self.assertNotEqual("needs_human_approval", self.value(result, "state"))

    def test_scenario_08_conflicting_findings(self) -> None:
        result = self.run_request(
            request(
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "SCENARIO-08-REPOSITORY", "clause": "architecture.repository",
                        "location": "app", "kind": "design", "message": "use repository",
                        "position": "approve", "status": "open",
                    },
                    {
                        "type": "finding", "actor": "verifier", "source": "verifier",
                        "issue_id": "SCENARIO-08-REPOSITORY", "clause": "architecture.repository",
                        "location": "app", "kind": "design", "message": "use repository",
                        "position": "reject", "status": "open",
                    },
                ]
            )
        )
        self.assert_state(result, "needs_human_approval")
        self.assertTrue(self.value(result, "conflicts"))
        self.assertGreaterEqual(len(self.value(result, "findings")), 2)

    def test_scenario_09_missing_spec_blocked(self) -> None:
        result = self.run_request({"idempotency_key": "missing-spec", "task_contract": {"title": ""}})
        self.assert_state(result, "blocked")
        self.assertFalse(self.value(result, "team", []))
        self.assertIn("spec", json.dumps(self.value(result, "blockers")).lower())

    def test_scenario_10_verifier_fail_retry(self) -> None:
        started = self.run_request(
            request(
                idempotency_key="scenario-10",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/scenario-10-fix.diff",
                ],
            )
        )
        failed = self.resume_run(
            started,
            events=[report_event(started, "verification", "failed", cause="failing_test")],
        )
        self.assert_state(failed, "retrying")
        fixed = self.apply_persisted_fix(
            failed,
            cause="failing_test",
            path="app/scenario-10-fix.diff",
        )
        result = self.resume_run(fixed, events=[report_event(fixed, "verification", "passed")])
        self.assertIn("retrying", self.states(result))
        self.assertIn("verifying", self.states(result))
        self.assertGreaterEqual(self.value(result, "attempt_count"), 2)
        self.assertEqual("passed", self.value(result, "initial_verification_report")["status"])

    def test_scenario_11_reviewer_design_violation(self) -> None:
        started = self.run_request(request(idempotency_key="scenario-11"))
        verified = self.resume_run(
            started,
            events=[report_event(started, "verification", "passed")],
        )
        cause = "layering_violation"
        failure = report_event(verified, "review", "failed", cause=cause)
        self.assertEqual(self.roles(verified)["reviewer"], failure["actor"])
        self.assertEqual(
            verified["authority_grants"]["quality"]["initial"]["reviewer"],
            failure["authority_grant"],
        )
        self.assertEqual(verified["task_contract"]["required_checks"], failure["checks"])
        self.assertEqual(sha256_digest({key: value for key, value in failure.items() if key != "report_digest"}), failure["report_digest"])
        result = self.resume_run(verified, events=[failure])
        self.assertEqual("retrying", self.value(result, "state"))
        self.assertIn("layering_violation", json.dumps(self.value(result, "findings")).lower())
        retries = result["retry_causes"][sha256_digest(cause)]
        self.assertEqual(1, retries)
        self.assertLessEqual(retries, result["execution_policy"]["same_cause_retry_limit"])
        self.assertEqual(failure["report_digest"], result["initial_review_report"]["report_digest"])

    def test_scenario_12_re_review_re_verify_after_fix(self) -> None:
        started = self.run_request(
            request(
                idempotency_key="scenario-12",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/scenario-12-fix.diff",
                ],
            )
        )
        verified = self.resume_run(started, events=[report_event(started, "verification", "passed")])
        reviewed = self.resume_run(
            verified,
            events=[report_event(verified, "review", "failed", cause="layering_violation")],
        )
        fixed = self.apply_persisted_fix(
            reviewed,
            cause="layering_violation",
            path="app/scenario-12-fix.diff",
        )
        reverified = self.resume_run(fixed, events=[report_event(fixed, "verification", "passed")])
        result = self.resume_run(reverified, events=[report_event(reverified, "review", "passed")])
        trace = self.states(result)
        self.assertGreaterEqual(trace.count("verifying"), 2)
        self.assertGreaterEqual(trace.count("reviewing"), 2)
        self.assertEqual("implementation_approved", self.value(result, "state"))

    def test_scenario_13_multi_writer_request_blocked(self) -> None:
        started = self.run_request(
            request(
                "Independent backend and frontend edits",
                domains=["backend", "frontend"],
                capabilities=["php", "react"],
                paths=["app/Services/ExampleService.php", "resources/js/Pages/Example.tsx"],
                idempotency_key="scenario-13",
            )
        )
        self.assertEqual("blocked", started["state"])
        self.assertIsNone(started["selection"]["writer"])
        self.assertFalse(started["authority_grants"]["write"])
        before = {
            "revision": started["revision"],
            "state_trace": copy.deepcopy(started["state_trace"]),
            "selection": copy.deepcopy(started["selection"]),
            "authority_grants": copy.deepcopy(started["authority_grants"]),
            "parallel_write_candidate": started["parallel_write_candidate"],
            "parallel_write_approved": started["parallel_write_approved"],
        }
        backend_paths = ["app/Services/ExampleService.php"]
        frontend_paths = ["resources/js/Pages/Example.tsx"]
        result = self.resume_run(
            started,
            worktree_request={
                "writers": [
                    {
                        "agent": "backend",
                        "paths": backend_paths,
                        "worktree": "backend-worktree",
                        "lease": {},
                    },
                    {
                        "agent": "frontend",
                        "paths": frontend_paths,
                        "worktree": "frontend-worktree",
                        "lease": {},
                    },
                ],
                "integration_owner": "backend",
                "post_integration_reverification": {
                    "plan_revision": started["shared_plan"]["revision"],
                    "required_reports": ["final_verification", "final_review"],
                    "evidence_digest": sha256_digest("integration evidence plan"),
                },
            },
        )
        self.assertFalse(self.value(result, "parallel_write_candidate"))
        self.assertFalse(self.value(result, "parallel_write_approved"))
        self.assertIsNone(self.value(result, "integration_owner"))
        self.assertEqual("blocked", result["state"])
        self.assertEqual(before["revision"], result["revision"])
        self.assertEqual(before["state_trace"], result["state_trace"])
        self.assertEqual(before["selection"], result["selection"])
        self.assertEqual(before["authority_grants"], result["authority_grants"])
        codes = {item["code"] for item in result["rejections"]}
        self.assertIn("terminal_immutable", codes)
        self.assertNotIn("lease_missing", codes)

    def test_scenario_14_same_file_conflict_reject(self) -> None:
        result = self.run_request(
            request(
                worktree_request={
                    "writers": [
                        {"agent": "backend", "paths": ["app/Services/ExampleService.php"], "worktree": "one"},
                        {"agent": "frontend", "paths": ["app/Services/ExampleService.php"], "worktree": "two"},
                    ],
                    "integration_owner": "backend",
                }
            )
        )
        self.assertFalse(self.value(result, "parallel_write_approved", False))
        self.assertIn("overlap", json.dumps(self.value(result, "rejections")).lower())

    def test_scenario_15_forbidden_path_edit_reject(self) -> None:
        result = self.run_request(request(paths=[".env"], write_request={"agent": "backend", "paths": ["../.env", ".env"]}))
        self.assertFalse(self.value(result, "write_authorized", False))
        rejection = json.dumps(self.value(result, "rejections")).lower()
        self.assertTrue("traversal" in rejection or "scope" in rejection or "forbidden" in rejection)

    def test_scenario_16_interrupt_resume(self) -> None:
        interrupted = self.run_request(request(idempotency_key="interrupt-001", events=[{"type": "interrupt"}]))
        self.assertEqual("blocked", self.value(interrupted, "state"))
        run_id = self.value(interrupted, "run_id")
        self.assertEqual("verified", self.value(interrupted, "integrity_status"))
        resumed = self.resume_run(interrupted, events=[{"type": "resume", "actor": "orchestrator"}])
        self.assertEqual(run_id, self.value(resumed, "run_id"))
        self.assertEqual("blocked", self.value(resumed, "state"))
        self.assertEqual(self.value(interrupted, "revision"), self.value(resumed, "revision"))
        self.assertEqual(
            self.value(interrupted, "state_trace"), self.value(resumed, "state_trace")
        )
        self.assertIn(
            "terminal_immutable",
            {item["code"] for item in self.value(resumed, "rejections")},
        )

    def test_scenario_17_rerun_idempotency(self) -> None:
        input_task = request(idempotency_key="stable-rerun")
        first = self.run_request(input_task)
        second = self.run_request(input_task)
        self.assertEqual(self.value(first, "run_id"), self.value(second, "run_id"))
        self.assertEqual(self.value(first, "contract_digest"), self.value(second, "contract_digest"))

    def test_scenario_18_pre_approval_source_sync_reject(self) -> None:
        started = self.run_request(request(idempotency_key="scenario-18"))
        result = self.resume_run(started, source_sync_request=source_request_for(started))
        self.assertFalse(self.value(result, "source_sync", {}).get("accepted", False))
        self.assertIn("implementation_approved", json.dumps(self.value(result, "rejections")).lower())

    def test_scenario_19_approved_source_sync(self) -> None:
        started = self.run_request(request(idempotency_key="scenario-19"))
        approved = self.initially_approve(started)
        self.assert_state(approved, "implementation_approved")
        result = self.resume_run(
            approved,
            source_sync_request={
                "schema_version": "1.0",
                "artifact_revision": approved["artifact_revision"],
                "artifact_digest": approved["current_artifact_digest"],
                "payload": {"changes": ["team harness source update"]},
                "source_baseline_digest": sha256_digest("source baseline v1"),
                "target_identity": {"system": "external", "catalog": "team-harness"},
                "activate": False,
                "external_connected": False,
            },
        )
        sync = self.value(result, "source_sync")
        self.assertTrue(sync["accepted"])
        self.assertEqual("prepared_for_human_application", sync["status"])
        self.assertTrue(sync["staged"])
        self.assertFalse(sync["overwrote"])
        staging = sync["staging_artifact"]
        self.assertTrue(
            {
                "payload", "ref", "digest", "source_baseline_digest", "target_identity",
                "provenance", "manual_handoff",
            }.issubset(staging)
        )
        self.assertTrue(staging["manual_handoff"])
        self.assertEqual(approved["current_artifact_digest"], sync["source_artifact_digest"])

    def test_scenario_20_final_review_detects_drift(self) -> None:
        def final_verified_run(key: str) -> Any:
            started = self.run_request(request(idempotency_key=key))
            approved = self.initially_approve(started)
            self.assert_state(approved, "implementation_approved")
            staged = self.resume_run(
                approved,
                source_sync_request=source_request_for(
                    approved,
                    payload={"changes": ["v1"]},
                    source_baseline_digest=sha256_digest("baseline"),
                ),
            )
            verified = self.resume_run(
                staged,
                events=[
                    report_event(staged, "verification", "passed", phase="final")
                ],
            )
            self.assertEqual("final_verification", self.value(verified, "state"))
            return verified

        passed_verified = final_verified_run("scenario-20-pass")
        passed = self.resume_run(
            passed_verified,
            events=[
                report_event(
                    passed_verified, "review", "passed", phase="final"
                )
            ],
        )
        self.assertEqual("final_review", self.value(passed, "state"))
        self.assertEqual(
            ["final_review"],
            self.states(passed)[len(self.states(passed_verified)):],
        )

        final_verified = final_verified_run("scenario-20")
        run_dir = self.runs_dir / final_verified["run_id"]
        prior_manifest = json.loads(
            (run_dir / "commit-manifest.json").read_text(encoding="utf-8")
        )
        prior_generations = {
            path.name for path in (run_dir / "generations").glob("generation-*")
        }
        prior_trace = copy.deepcopy(final_verified["state_trace"])
        prior_history = copy.deepcopy(final_verified["failure_history"])
        prior_findings = copy.deepcopy(final_verified["findings"])
        cause = "artifact_drift"
        result = self.resume_run(
            final_verified,
            events=[
                report_event(
                    final_verified,
                    "review",
                    "failed",
                    phase="final",
                    cause=cause,
                )
            ],
        )
        committed_manifest = json.loads(
            (run_dir / "commit-manifest.json").read_text(encoding="utf-8")
        )
        committed_state = json.loads(
            (run_dir / committed_manifest["state_ref"]).read_text(encoding="utf-8")
        )
        committed_generations = {
            path.name for path in (run_dir / "generations").glob("generation-*")
        }
        suffix = result["state_trace"][len(prior_trace):]
        history_suffix = result["failure_history"][len(prior_history):]
        finding_suffix = result["findings"][len(prior_findings):]

        self.assertEqual("retrying", self.value(result, "state"))
        self.assertEqual(final_verified["revision"] + 1, result["revision"])
        self.assertEqual(prior_manifest["revision"] + 1, committed_manifest["revision"])
        self.assertEqual(
            1, len(committed_generations.difference(prior_generations))
        )
        self.assertEqual(prior_trace, result["state_trace"][: len(prior_trace)])
        self.assertEqual(1, len(suffix))
        self.assertEqual("final_verification", suffix[0]["from"])
        self.assertEqual("retrying", suffix[0]["state"])
        self.assertEqual("orchestrator", suffix[0]["actor"])
        self.assertEqual(f"final_review failed: {cause}", suffix[0]["reason"])
        self.assertNotIn("reserved_evidence", suffix[0])
        self.assertNotIn("final_review", [entry["state"] for entry in suffix])

        self.assertEqual(1, len(history_suffix))
        history = history_suffix[0]
        self.assertEqual("final", history["phase"])
        self.assertEqual("review", history["report"])
        self.assertEqual(cause, history["cause"])
        self.assertEqual(sha256_digest(cause), history["cause_fingerprint"])
        self.assertEqual(
            result["final_review_report"]["report_digest"], history["report_digest"]
        )
        self.assertEqual(result["final_review_report"], history["report_snapshot"])
        self.assertEqual(
            committed_manifest["generation_ref"], history["report_generation_ref"]
        )
        self.assertEqual(
            committed_manifest["revision"], history["report_generation_revision"]
        )
        self.assertEqual(["FINAL-DRIFT"], [item["issue_id"] for item in finding_suffix])
        self.assertEqual(cause, finding_suffix[0]["message"])
        self.assertEqual("open", finding_suffix[0]["status"])
        self.assertEqual(
            int(final_verified["retry_causes"].get(sha256_digest(cause), 0)) + 1,
            result["retry_causes"][sha256_digest(cause)],
        )
        self.assertEqual("retrying", committed_state["state"])
        self.assertEqual(result["state_trace"], committed_state["state_trace"])
        self.assertEqual(result["failure_history"], committed_state["failure_history"])
        self.assertEqual(result["findings"], committed_state["findings"])
        self.assertNotIn("_post_reserved_transition", committed_state)
        self.assertIn(cause, json.dumps(self.value(result, "findings")).lower())

        completion = self.harness.facade.completion_gate(
            result["run_id"], expected_revision=result["revision"]
        )
        self.assertFalse(completion["complete"])
        self.assertIn("drift", json.dumps(completion).lower())

    def test_scenario_21_improvement_proposal_generation(self) -> None:
        result = self.run_request(request(events=[{"type": "improvement_proposed", "kind": "quality"}]))
        proposal = self.value(result, "improvement_proposals")[0]
        self.assertEqual("quality", self.value(proposal, "kind"))
        self.assertFalse(self.value(proposal, "applied"))

    def test_scenario_22_privilege_expansion_not_auto_apply(self) -> None:
        result = self.run_request(
            request(events=[{"type": "improvement_proposed", "kind": "privilege_expansion", "requested_scope": "network"}])
        )
        proposal = self.value(result, "improvement_proposals")[0]
        self.assertTrue(self.value(proposal, "manual_approval_required"))
        self.assertFalse(self.value(proposal, "applied"))

    def test_scenario_23_legacy_single_agent_through_common_core(self) -> None:
        result = self.run_request(
            {
                "schema_version": "1.0",
                "idempotency_key": "legacy-001",
                "legacy_single_agent": {
                    "agent": "backend", "task": "Add endpoint",
                    "paths": ["app/Http/Controllers/ExampleController.php"],
                },
            }
        )
        self.assertTrue(self.value(result, "legacy_converted"))
        self.assertTrue(self.value(result, "task_contract"))
        self.assertIn("reviewer", self.roles(result))
        self.assertIn("verifier", self.roles(result))

    def test_scenario_24_writer_reviewer_verifier_role_collision_reject(self) -> None:
        result = self.run_request(request(role_assignments={"writer": "backend", "reviewer": "backend", "verifier": "verifier"}))
        self.assertIn("role_collision", json.dumps(self.value(result, "rejections")).lower())
        self.assertNotEqual("completed", self.value(result, "state"))
        self.assertFalse(self.value(result, "write_authorized", False))

    def test_scenario_25_no_unnecessary_specialists(self) -> None:
        result = self.run_request(request("Small backend-only fix", capabilities=["php"], risk="low"))
        self.assertEqual({"backend", "reviewer", "verifier"}, self.ids(result))
        self.assertLessEqual(self.value(result, "thread_count"), 3)


class TeamHarnessUnitContractTest(TeamHarnessContractTestCase):
    def test_schema_required_and_version(self) -> None:
        required = ("agent-capability-registry.json", "execution-policy.json", "team-harness.schema.json", "acceptance-scenarios.json")
        documents = {name: json.loads((CONFIG_ROOT / name).read_text(encoding="utf-8")) for name in required}
        self.assertTrue(all(documents[name] for name in required))
        self.assertTrue(any("version" in json.dumps(value).lower() for value in documents.values()))

    def test_duplicate_and_unknown_agent_are_rejected(self) -> None:
        registry = minimal_registry()
        registry["agents"].append(dict(registry["agents"][0]))
        duplicate = self.run_request(request(), registry=registry)
        self.assertIn("duplicate", json.dumps(self.value(duplicate, "rejections")).lower())
        unknown = self.run_request(request(role_assignments={"writer": "ghost", "reviewer": "reviewer", "verifier": "verifier"}))
        self.assertIn("unknown", json.dumps(self.value(unknown, "rejections")).lower())

    def test_runtime_profile_is_symbolic_not_concrete_model_success(self) -> None:
        result = self.run_request(request())
        runtime = self.value(result, "runtime")
        self.assertEqual("backend_profile", runtime["profiles"]["backend"])
        self.assertNotIn("resolved_model", runtime)
        self.assertFalse(runtime.get("runtime_verified", False))

    def test_thread_and_depth_policy(self) -> None:
        result = self.run_request(request())
        self.assertLessEqual(self.value(result, "thread_count"), 3)
        self.assertLessEqual(self.value(result, "max_depth_used"), 1)

    def test_task_contract_is_immutable_and_shared_plan_is_revisioned(self) -> None:
        task = request(events=[{"type": "plan_revised", "change": "add validation"}])
        original = json.loads(json.dumps(task["task_contract"]))
        result = self.run_request(task)
        self.assertEqual(original, task["task_contract"])
        plan = self.value(result, "shared_plan")
        self.assertGreaterEqual(plan["revision"], 1)
        self.assertEqual(self.value(result, "contract_digest"), self.value(result, "task_contract")["digest"])

    def test_illegal_transition_is_rejected_and_completed_is_orchestrator_only(self) -> None:
        result = self.run_request(request(events=[{"type": "transition", "from": "received", "to": "completed", "actor": "backend"}]))
        self.assertIn("illegal_transition", json.dumps(self.value(result, "rejections")).lower())
        self.assertNotEqual("completed", self.value(result, "state"))

    def test_redaction_rejection_and_artifact_digest_provenance(self) -> None:
        result = self.run_request(request(events=[{"type": "artifact", "path": ".env", "content": "SECRET=value"}]))
        self.assertIn("redaction", json.dumps(self.value(result, "rejections")).lower())
        artifacts = self.value(result, "artifacts", [])
        self.assertTrue(all(self.value(item, "digest") and self.value(item, "provenance") for item in artifacts))

    def test_stale_shared_plan_revision_is_rejected(self) -> None:
        result = self.run_request(request(events=[{"type": "plan_revised", "change": "v2"}, {"type": "work_submission", "plan_revision": 0}]))
        self.assertIn("stale_plan_revision", json.dumps(self.value(result, "rejections")).lower())

    def test_finding_dedupe_is_catalog_only_and_receipt_is_append_only(self) -> None:
        result = self.run_request(
            request(
                events=[
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "UNIT-MISSING-TEST", "clause": "quality.missing-test",
                        "location": "tests", "kind": "quality", "message": "missing test",
                        "status": "open",
                    },
                    {
                        "type": "finding", "actor": "reviewer", "source": "reviewer",
                        "issue_id": "UNIT-MISSING-TEST", "clause": "quality.missing-test",
                        "location": "tests", "kind": "quality", "message": "missing test",
                        "status": "open",
                    },
                ]
            )
        )
        self.assertEqual(2, len(self.value(result, "findings")))
        self.assertEqual(1, len(self.value(result, "finding_catalog")))

    def test_same_cause_retry_limit(self) -> None:
        current = self.run_request(
            request(
                idempotency_key="retry-limit",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/retry-limit-0.diff",
                    "app/retry-limit-1.diff",
                    "app/retry-limit-2.diff",
                ],
            )
        )
        result = current
        for index in range(3):
            result = self.resume_run(
                current,
                events=[report_event(current, "verification", "failed", cause="same")],
            )
            if result["state"] in {"blocked", "needs_human_approval", "failed"}:
                break
            current = self.apply_persisted_fix(
                result,
                cause="same",
                path=f"app/retry-limit-{index}.diff",
            )
        self.assertIn(self.value(result, "state"), {"blocked", "needs_human_approval", "failed"})
        self.assertIn("retry_limit", json.dumps(self.value(result, "rejections")).lower())

    def test_source_sync_never_overwrites_and_summary_catalog_are_deterministic(self) -> None:
        task = request(idempotency_key="source-no-overwrite")
        started = self.run_request(task)
        approved = self.initially_approve(started)
        first = self.resume_run(
            approved,
            source_sync_request=source_request_for(approved, existing_target=True),
        )
        second = self.run_request(task)
        self.assertFalse(self.value(first, "source_sync")["overwrote"])
        self.assertEqual(self.value(first, "human_summary"), self.value(second, "human_summary"))
        self.assertEqual(self.value(first, "catalog_projection"), self.value(second, "catalog_projection"))


if __name__ == "__main__":
    unittest.main()
