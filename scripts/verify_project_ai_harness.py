#!/usr/bin/env python3
"""Verify the self-contained project AI harness through its real contracts."""

from __future__ import annotations

import ast
import copy
import json
import os
import re
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path
from typing import Any
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

PROJECT_CONFIG = ROOT / ".codex" / "config.toml"
TEAM_ROOT = ROOT / ".codex" / "team-harness"
TEAM_REGISTRY = TEAM_ROOT / "agent-capability-registry.json"
TEAM_POLICY = TEAM_ROOT / "execution-policy.json"
TEAM_SCHEMA = TEAM_ROOT / "team-harness.schema.json"
TEAM_SCENARIOS = TEAM_ROOT / "acceptance-scenarios.json"
TEAM_EXAMPLE = TEAM_ROOT / "task-contract.example.json"
TEAM_SPEC = ROOT / "docs" / "ai" / "rules" / "team-execution-spec.md"
TEAM_DECISION = ROOT / "docs" / "ai" / "decisions" / "0001-dynamic-specialist-team-harness.md"
TEAM_CLI = ROOT / "scripts" / "team_harness.py"
TEAM_PACKAGE = ROOT / "team_harness" / "__init__.py"
TEAM_SCHEMA_VALIDATOR = ROOT / "team_harness" / "schema.py"
TEAM_STATE = ROOT / "team_harness" / "state.py"
TEAM_STORAGE = ROOT / "team_harness" / "storage.py"
TEAM_SKILL = ROOT / "skills" / "team-task-contract" / "SKILL.md"
TEAM_SKILL_UI = TEAM_SKILL.parent / "agents" / "openai.yaml"
TEAM_TEST_ROOT = ROOT / "tests" / "team_harness"
FULL_SUITE_TIMEOUT_SECONDS = 300
EXPECTED_TEAM_TEST_COUNT = 206
TEAM_TESTS = (
    TEAM_TEST_ROOT / "test_team_harness_contract.py",
    TEAM_TEST_ROOT / "test_team_harness_hardening_contract.py",
    TEAM_TEST_ROOT / "test_team_harness_stop_contract.py",
    TEAM_TEST_ROOT / "test_team_harness_review_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_fifth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_sixth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_seventh_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_eighth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_ninth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_tenth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_eleventh_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_twelfth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_thirteenth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_fourteenth_regressions.py",
    TEAM_TEST_ROOT / "test_team_harness_fifteenth_regressions.py",
)
POLICY = ROOT / "docs" / "ai" / "rules" / "model-routing-policy.md"
RUNTIME_LOG = ROOT / "docs" / "ai" / "logs" / ("2026-07-14-custom-" + "subagent-runtime-verification.md")
OLD_CHECKER = ROOT / "scripts" / ("verify_codex_" + "agents.py")
REQUIRED_FILES = (
    ROOT / "AGENTS.md",
    ROOT / "README.md",
    PROJECT_CONFIG,
    POLICY,
    ROOT / "docs" / "ai" / "workflows" / "md-router.md",
    ROOT / "docs" / "ai" / "workflows" / "loop-engineering.md",
    ROOT / "docs" / "ai" / "workflows" / "work-result-feedback-loop.md",
    ROOT / "docs" / "operations" / "command-registry.md",
    ROOT / "docs" / "operations" / "sensors.md",
    ROOT / "docs" / "testing.md",
    TEAM_REGISTRY,
    TEAM_POLICY,
    TEAM_SCHEMA,
    TEAM_SCENARIOS,
    TEAM_EXAMPLE,
    TEAM_SPEC,
    TEAM_DECISION,
    TEAM_CLI,
    TEAM_PACKAGE,
    TEAM_SCHEMA_VALIDATOR,
    TEAM_STATE,
    TEAM_STORAGE,
    TEAM_SKILL,
    TEAM_SKILL_UI,
    *TEAM_TESTS,
)
POLICY_FILES = (
    ROOT / "AGENTS.md",
    ROOT / "docs" / "index.md",
    ROOT / "docs" / "ai" / "index.md",
    ROOT / "docs" / "ai" / "logs" / "index.md",
    *sorted((ROOT / "docs" / "ai" / "rules").glob("*.md")),
    *sorted((ROOT / "docs" / "ai" / "workflows").glob("*.md")),
    ROOT / "docs" / "operations" / "command-registry.md",
    ROOT / "docs" / "operations" / "sensors.md",
    ROOT / "docs" / "testing.md",
)

MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
SESSION_ID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I)
PERSONAL_PATH = re.compile(r"(?:/home/[^/\s]+/|/mnt/[a-z]/Users/|[A-Za-z]:\\\\Users\\\\)")
COMMIT_SHA = re.compile(r"\b[0-9a-f]{40}\b", re.I)
PR_REFERENCE = re.compile(
    r"(?:https://github\.com/[^\s)]+/pull/\d+\b|(?<![A-Za-z0-9])(?:Related\s+)?PRs?\s*(?::\s*)?#\d+\b)",
    re.I,
)
CI_REFERENCE = re.compile(
    r"(?:https://github\.com/[^\s)]+/actions/runs/\d+\b|(?<![A-Za-z0-9])(?:GitHub\s+Actions\s+)?CI(?:\s+run)?\s*#\d+\b)",
    re.I,
)
PERSONAL_MODEL_REFERENCE = re.compile(r"(?<![A-Za-z0-9])sol(?![A-Za-z0-9])", re.I)
CONCRETE_MODEL_REFERENCE = re.compile(r"\b(?:gpt|claude|gemini|llama|mistral)[-_]?[A-Za-z0-9._-]*", re.I)

CANONICAL_TASK_FIELDS = {
    "task_id", "title", "goal", "background", "current_state", "desired_state", "scope",
    "non_goals", "acceptance_criteria", "constraints", "source_of_truth", "allowed_paths",
    "forbidden_paths", "affected_domains", "risk_level", "required_capabilities",
    "team_assignment", "primary_writer", "consulting_specialists", "reviewer", "verifier",
    "write_ownership", "required_checks", "stop_conditions", "retry_conditions",
    "approval_boundaries", "required_deliverables", "information_source_sync",
    "completion_conditions",
}
REQUIRED_SCHEMA_DEFINITIONS = {
    "canonicalinputenvelope", "resumeinputenvelope", "writeauthorizationrequest",
    "sourcesyncrequest", "runtimeevent", "agentregistry", "executionpolicy", "acceptancemanifest",
    "taskcontract", "runstate", "finding", "findingcollection", "sharedplan",
    "teamassignment", "implementationlog", "statetransition", "initialverificationreport",
    "finalverificationreport", "initialreviewreport", "finalreviewreport", "sourcemanifest",
    "completion", "improvements", "artifactmanifest", "commitmanifest",
    "roleassignments", "fixartifactreceipt", "fixartifactreceiptinput",
    "artifactreceiptreference", "commitanchorentry", "commitanchor",
    "artifactevent", "findingevent", "qualityreportevent", "genericruntimeevent",
    "evidencegatepolicy", "problem", "orchestratorstate", "teammember",
    "selectionstate", "runtimestate", "authoritygrantstate", "verificationsummary",
    "reviewsummary", "implementationapprovalstate", "failurehistoryentry", "metricsstate",
    "policybinding", "registrybinding", "findingresolutionreceipt", "fixappliedlogentry",
    "implementationlogentry", "findingidentity", "startrequestsnapshot",
    "inputproblemprojection",
    "reservedevidence", "reservedtransitionevidence", "reservedreportdigests",
    "reservedcausalreport", "reservedtargetcausality", "stagingprovenance", "cancelevent",
}
REQUIRED_ARTIFACTS = (
    "task-contract", "baseline-inventory", "team-assignment", "specialist-findings",
    "shared-plan", "implementation-log", "state-transition-log", "verification-report",
    "review-report", "source-update-manifest", "completion-report", "improvement-proposals",
)
EXPECTED_SCENARIO_TESTS = tuple(f"test_scenario_{number:02d}_{suffix}" for number, suffix in (
    (1, "backend_only_selection"),
    (2, "frontend_backend_contract"),
    (3, "dto_repository_service_strategy_boundary"),
    (4, "architecture_decision"),
    (5, "security_auth"),
    (6, "operations_queue_scheduler_migration"),
    (7, "agreeing_findings"),
    (8, "conflicting_findings"),
    (9, "missing_spec_blocked"),
    (10, "verifier_fail_retry"),
    (11, "reviewer_design_violation"),
    (12, "re_review_re_verify_after_fix"),
    (13, "multi_writer_request_blocked"),
    (14, "same_file_conflict_reject"),
    (15, "forbidden_path_edit_reject"),
    (16, "interrupt_resume"),
    (17, "rerun_idempotency"),
    (18, "pre_approval_source_sync_reject"),
    (19, "approved_source_sync"),
    (20, "final_review_detects_drift"),
    (21, "improvement_proposal_generation"),
    (22, "privilege_expansion_not_auto_apply"),
    (23, "legacy_single_agent_through_common_core"),
    (24, "writer_reviewer_verifier_role_collision_reject"),
    (25, "no_unnecessary_specialists"),
))
EXPECTED_SCENARIO_NAMES = (
    "backend-only selection", "frontend-backend contract", "DTO/Repository/Service/Strategy boundary",
    "architecture decision", "security auth", "operations queue/scheduler/migration", "agreeing findings",
    "conflicting findings", "missing spec blocked", "verifier fail retry", "reviewer design violation",
    "re-review/re-verify after fix", "multi-writer request blocked", "same-file conflict reject",
    "forbidden path edit reject", "interrupt/resume", "rerun idempotency",
    "pre-approval source sync reject", "approved source sync", "final review detects drift",
    "improvement proposal generation", "privilege expansion not auto-apply",
    "legacy single-agent through common core", "writer/reviewer/verifier role collision reject",
    "no unnecessary specialists",
)


def validate_markdown_links(path: Path) -> list[str]:
    errors: list[str] = []
    for raw_target in MARKDOWN_LINK.findall(path.read_text(encoding="utf-8")):
        target = raw_target.strip().strip("<>")
        if not target or target.startswith("#") or "://" in target or target.startswith(("mailto:", "tel:")):
            continue
        target = unquote(target.split("#", 1)[0].split("?", 1)[0])
        resolved = Path(target) if target.startswith("/") else path.parent / target
        if not resolved.exists():
            errors.append(f"{path.relative_to(ROOT)}: missing Markdown link target: {raw_target}")
    return errors


def load_json_document(path: Path, errors: list[str]) -> dict[str, Any]:
    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        errors.append(f"{path.relative_to(ROOT)}: invalid JSON: {error}")
        return {}
    if not isinstance(document, dict):
        errors.append(f"{path.relative_to(ROOT)}: top-level JSON must be an object")
        return {}
    return document


def validate_schema_and_generated_artifacts(
    errors: list[str],
    registry: dict[str, Any],
    policy: dict[str, Any],
    schema: dict[str, Any],
    manifest: dict[str, Any],
    example: dict[str, Any],
) -> None:
    try:
        from team_harness import TeamHarness, validate_document
        from team_harness.state import validate_policy
    except ImportError as error:
        errors.append(f"team harness import failed: {error}")
        return

    definitions = schema.get("$defs", {})
    normalized = {name.replace("_", "").lower(): value for name, value in definitions.items()} if isinstance(definitions, dict) else {}
    missing = REQUIRED_SCHEMA_DEFINITIONS - set(normalized)
    if missing:
        errors.append(f"team harness schema is missing canonical definitions: {sorted(missing)}")
    for name, definition in definitions.items() if isinstance(definitions, dict) else ():
        if isinstance(definition, dict) and definition.get("type") == "object":
            if definition.get("additionalProperties") is not False or not definition.get("required"):
                errors.append(f"team harness schema object must be closed and required: {name}")
    contract_schema = normalized.get("taskcontract", {})
    if not CANONICAL_TASK_FIELDS.issubset(set(contract_schema.get("required", []))):
        errors.append("Task Contract schema does not require all 29 user fields")
    if not CANONICAL_TASK_FIELDS.issubset(set(contract_schema.get("properties", {}))):
        errors.append("Task Contract schema does not define all 29 user fields")
    if contract_schema.get("additionalProperties") is not False:
        errors.append("Task Contract schema must reject unknown properties")

    documents = {
        "agent_registry": registry,
        "execution_policy": policy,
        "acceptance_manifest": manifest,
        "canonical_input_envelope": example,
    }
    for kind, document in documents.items():
        for message in validate_document(kind, document):
            errors.append(f"schema validation failed for {kind}: {message}")

    canonical_input = example.get("task_contract", {})
    if isinstance(canonical_input, dict):
        mutations: list[dict[str, Any]] = []
        missing_goal = copy.deepcopy(canonical_input)
        missing_goal.pop("goal", None)
        mutations.append(missing_goal)
        wrong_path_type = copy.deepcopy(canonical_input)
        wrong_path_type["allowed_paths"] = "app/A.php"
        mutations.append(wrong_path_type)
        unknown = copy.deepcopy(canonical_input)
        unknown["surprise"] = True
        mutations.append(unknown)
        empty_acceptance = copy.deepcopy(canonical_input)
        empty_acceptance["acceptance_criteria"] = []
        mutations.append(empty_acceptance)
        for index, mutation in enumerate(mutations):
            if not validate_document("task_contract_input", mutation):
                errors.append(f"schema negative mutation {index} was incorrectly accepted")

    try:
        validate_policy(policy)
    except ValueError as error:
        errors.append(f"execution policy is contradictory: {error}")

    try:
        with tempfile.TemporaryDirectory(prefix="team-harness-check-") as temporary:
            runs_dir = Path(temporary) / "runs"
            harness = TeamHarness(registry, policy, runs_dir, project_root=ROOT)
            run = harness.run(example)
            if run.get("blockers") or run.get("rejections"):
                errors.append("canonical example did not produce an accepted generated run")
                return
            if len(run.get("artifacts", [])) != 12:
                errors.append("generated run must expose exactly 12 artifact references")
            if {item.get("name") for item in run.get("artifacts", [])} != set(REQUIRED_ARTIFACTS):
                errors.append("generated run artifact names do not match the canonical set")
            for reference in run.get("artifacts", []):
                artifact_path = runs_dir / run["run_id"] / str(reference.get("path", ""))
                artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
                for message in validate_document(str(reference.get("name", "")), artifact):
                    errors.append(f"generated artifact schema failure ({reference.get('name')}): {message}")
            for message in validate_document("task_contract", run.get("task_contract")):
                errors.append(f"generated Task Contract schema failure: {message}")
            for message in validate_document("run_state", run):
                errors.append(f"generated Run State schema failure: {message}")
            artifact_manifest = {"schema_version": "1.0", "artifacts": run.get("artifacts", [])}
            for message in validate_document("artifact_manifest", artifact_manifest):
                errors.append(f"generated artifact manifest schema failure: {message}")
            commit_path = runs_dir / run["run_id"] / "commit-manifest.json"
            commit_manifest = json.loads(commit_path.read_text(encoding="utf-8"))
            for message in validate_document("commit_manifest", commit_manifest):
                errors.append(f"generated commit manifest schema failure: {message}")
            anchor_path = runs_dir / run["run_id"] / "commit-anchor.json"
            commit_anchor = json.loads(anchor_path.read_text(encoding="utf-8"))
            for message in validate_document("commit_anchor", commit_anchor):
                errors.append(f"generated commit anchor schema failure: {message}")
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        errors.append(f"generated harness artifact validation failed: {error}")


def validate_test_contract(errors: list[str], manifest: dict[str, Any]) -> None:
    scenarios = manifest.get("scenarios", [])
    manifest_ids = tuple(str(item.get("id", "")) for item in scenarios if isinstance(item, dict))
    manifest_names = tuple(str(item.get("name", "")) for item in scenarios if isinstance(item, dict))
    manifest_tests = tuple(str(item.get("test", "")) for item in scenarios if isinstance(item, dict))
    if manifest_ids != tuple(f"{number:02d}" for number in range(1, 26)):
        errors.append("acceptance manifest must contain ordered ids 01 through 25")
    if manifest_names != EXPECTED_SCENARIO_NAMES or manifest_tests != EXPECTED_SCENARIO_TESTS:
        errors.append("acceptance manifest names/tests do not match the canonical 25 scenarios")

    all_test_names: list[str] = []
    scenario_names: list[str] = []
    for path in TEAM_TESTS:
        if not path.is_file():
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        names = [
            node.name
            for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_")
        ]
        all_test_names.extend(names)
        scenario_names.extend(name for name in names if name.startswith("test_scenario_"))
    if len(all_test_names) != EXPECTED_TEAM_TEST_COUNT:
        errors.append(
            "team harness suite must define exactly "
            f"{EXPECTED_TEAM_TEST_COUNT} test methods, found {len(all_test_names)}"
        )
    if tuple(scenario_names) != EXPECTED_SCENARIO_TESTS:
        errors.append("acceptance test methods do not map one-to-one to the ordered 25 scenarios")

    environment = os.environ.copy()
    existing_path = environment.get("PYTHONPATH")
    environment["PYTHONPATH"] = str(TEAM_TEST_ROOT) + (os.pathsep + existing_path if existing_path else "")
    try:
        completed = subprocess.run(
            [
                sys.executable, "-m", "unittest", "test_team_harness_contract",
                "test_team_harness_hardening_contract", "test_team_harness_stop_contract",
                "test_team_harness_review_regressions", "test_team_harness_fifth_regressions",
                "test_team_harness_sixth_regressions", "test_team_harness_seventh_regressions",
                "test_team_harness_eighth_regressions", "test_team_harness_ninth_regressions",
                "test_team_harness_tenth_regressions", "test_team_harness_eleventh_regressions",
                "test_team_harness_twelfth_regressions",
                "test_team_harness_thirteenth_regressions",
                "test_team_harness_fourteenth_regressions",
                "test_team_harness_fifteenth_regressions",
            ],
            cwd=ROOT,
            env=environment,
            text=True,
            capture_output=True,
            timeout=FULL_SUITE_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        errors.append(
            f"team harness {EXPECTED_TEAM_TEST_COUNT}-test execution failed to run: {error}"
        )
        return
    output = completed.stdout + completed.stderr
    if completed.returncode != 0:
        errors.append(
            f"team harness {EXPECTED_TEAM_TEST_COUNT}-test execution failed with exit {completed.returncode}"
        )
    if re.search(rf"Ran\s+{EXPECTED_TEAM_TEST_COUNT}\s+tests?\b", output) is None:
        errors.append(
            "team harness test output did not confirm exactly "
            f"{EXPECTED_TEAM_TEST_COUNT} executed tests"
        )


def validate_team_harness(errors: list[str], config: dict[str, Any]) -> None:
    team_config = config.get("team_harness", {})
    if not isinstance(team_config, dict):
        errors.append(".codex/config.toml: team_harness table is missing")
        return
    expected_config = {
        "registry_path": ".codex/team-harness/agent-capability-registry.json",
        "execution_policy_path": ".codex/team-harness/execution-policy.json",
        "execution_policy_version": "2026-07-22.2",
        "execution_policy_digest": "sha256:7f4ef1d056f121e9c7ff67f2360fbf394bb60e5baa81d21d3e4190b10093157b",
        "schema_path": ".codex/team-harness/team-harness.schema.json",
        "acceptance_manifest_path": ".codex/team-harness/acceptance-scenarios.json",
        "runs_path": ".codex/runs",
    }
    for key, expected in expected_config.items():
        if team_config.get(key) != expected:
            errors.append(f".codex/config.toml: team_harness.{key} must be {expected!r}")
    policy_owned_config = {
        "mode", "legacy_adapter", "legacy_adapter_enabled", "source_sync", "source_sync_minimum_state",
        "write_authorization", "same_cause_retry_limit", "allowed_transitions", "terminal_states",
    }
    duplicated = sorted(policy_owned_config & set(team_config))
    if duplicated:
        errors.append(f".codex/config.toml duplicates Execution Policy ownership: {duplicated}")

    documents = {
        path: load_json_document(path, errors)
        for path in (TEAM_REGISTRY, TEAM_POLICY, TEAM_SCHEMA, TEAM_SCENARIOS, TEAM_EXAMPLE)
        if path.is_file()
    }
    for path, document in documents.items():
        if document.get("schema_version") != "1.0":
            errors.append(f"{path.relative_to(ROOT)}: schema_version must be 1.0")
    registry = documents.get(TEAM_REGISTRY, {})
    policy = documents.get(TEAM_POLICY, {})
    schema = documents.get(TEAM_SCHEMA, {})
    manifest = documents.get(TEAM_SCENARIOS, {})
    example = documents.get(TEAM_EXAMPLE, {})

    agents = registry.get("agents", [])
    ids: list[str] = []
    if not isinstance(agents, list) or not agents:
        errors.append("agent capability registry must contain agents")
    else:
        for agent in agents:
            if not isinstance(agent, dict):
                errors.append("agent capability registry entries must be objects")
                continue
            agent_id = str(agent.get("id", ""))
            ids.append(agent_id)
            profile = str(agent.get("model_profile", ""))
            if not profile or CONCRETE_MODEL_REFERENCE.search(profile):
                errors.append(f"agent capability registry has non-symbolic model_profile for {agent_id}")
            for forbidden_key in ("resolved_model", "runtime_available", "session_id", "personal_catalog"):
                if forbidden_key in agent:
                    errors.append(f"agent capability registry contains runtime/personal field: {forbidden_key}")
        if len(ids) != len(set(ids)):
            errors.append("agent capability registry contains duplicate agent ids")

    if policy.get("mode") != "shadow" or policy.get("max_threads") != 3 or policy.get("max_depth") != 1:
        errors.append("execution policy must preserve shadow mode, max_threads=3, and max_depth=1")
    policy_states = set(policy.get("states", []))
    terminal_states = set(policy.get("terminal_states", []))
    reserved_states = set(policy.get("reserved_states", []))
    if not terminal_states or not terminal_states.issubset(reserved_states):
        errors.append("Execution Policy terminal states must be reserved")
    if set(policy.get("allowed_transitions", {})) != set(policy.get("states", [])):
        errors.append("Execution Policy must define transitions for every state exactly once")
    legacy = policy.get("legacy_adapter", {})
    if legacy != {"enabled": True, "entrypoint": "team_harness.orchestrator:TeamHarness"}:
        errors.append("Execution Policy must own the enabled legacy adapter and common-core entrypoint")
    source_sync = policy.get("source_sync", {})
    if not isinstance(source_sync, dict) or not source_sync.get("manual_activation") or not source_sync.get("no_overwrite"):
        errors.append("execution policy source staging must be manual and no-overwrite")
    retention = policy.get("retention", {})
    if not isinstance(retention, dict) or retention.get("days") != 30 or retention.get("automatic_deletion") is not False:
        errors.append("execution policy retention must be 30 days without automatic deletion")
    evidence_gates = policy.get("evidence_gates", {})
    if evidence_gates != {
        "artifact_requires_exact_committed_write_grant": True,
        "quality_requires_prior_committed_grant": True,
        "retry_exit_requires_verified_fix": True,
        "final_review_retry_limit_state": "needs_human_approval",
    }:
        errors.append("Execution Policy must own the strict committed evidence gates")
    write_states = set(
        policy.get("write_authorization", {}).get("allowed_states", [])
    )
    if not write_states or not write_states.issubset(policy_states - terminal_states):
        errors.append("Execution Policy write states must be known non-terminal states")
    example_binding = example.get("policy_binding", {})
    if example_binding != {
        "version": policy.get("policy_version"),
        "digest": policy.get("policy_digest"),
    }:
        errors.append("canonical example policy binding does not match Execution Policy")
    example_constraints = " ".join(
        str(item)
        for item in example.get("task_contract", {}).get("constraints", [])
    )
    for marker in (
        "sanitized input problem projection",
        "immutable run identity",
        "typed exact reason",
        "canonical inactive source projection",
        "safe rejected Task Contract",
    ):
        if marker not in example_constraints:
            errors.append(f"canonical example is missing integrity marker: {marker}")

    validate_schema_and_generated_artifacts(errors, registry, policy, schema, manifest, example)
    validate_test_contract(errors, manifest)

    cli_text = TEAM_CLI.read_text(encoding="utf-8") if TEAM_CLI.is_file() else ""
    for command in (
        "validate", "build-contract", "team-select", "init-run", "resume-run", "transition", "record",
        "authorize-write", "source-sync", "improvement", "completion-gate", "catalog-projection", "legacy-adapt",
    ):
        if f'"{command}"' not in cli_text:
            errors.append(f"team harness CLI is missing command: {command}")
    for marker in ("validate_document", "unsuccessful", "authorize_write(run_id", "source_sync", "completion_gate"):
        if marker not in cli_text:
            errors.append(f"team harness CLI is missing fail-closed behavior marker: {marker}")

    skill_text = TEAM_SKILL.read_text(encoding="utf-8") if TEAM_SKILL.is_file() else ""
    for marker in (
        "name: team-task-contract", "scripts/team_harness.py build-contract", "scripts/team_harness.py validate",
        "Do not invent", "29 fields", "human_summary", "Stop", "legacy-adapt", "shadow mode",
        "role_assignments", "artifact receipt authority", "atomic event batch",
        "prior committed", "status: open", "Run State schema",
        "public `review_failed`", "semantic corruption", "terminal states",
        "Registry snapshot", "resolution receipt", "Policy artifact pin",
        "generic transition into `retrying`", "persisted quality report",
        "parent manifest", "canonical selection replay", "historical report generation",
        "closed metrics projection", "canonical raw receipt projection",
        "one-to-one failure history", "schema-first", "commit anchor",
        "dedicated state gate", "historical staging", "reserved evidence",
        "coordinated", "receipt path scope", "completion/source binding",
        "generation-new evidence", "source introduction", "prior write-enabled generation",
        "dedicated cancellation", "four report digests", "target-specific causality",
        "private pending transition", "source basis", "exact causal subset", "canonical inactive",
        "sanitized input problem projection", "immutable run identity",
        "typed exact causal subset", "canonical inactive source projection",
        "safe rejected Task Contract",
    ):
        if marker not in skill_text:
            errors.append(f"team-task-contract Skill is missing marker: {marker}")
    for field in CANONICAL_TASK_FIELDS:
        if f"`{field}`" not in skill_text:
            errors.append(f"team-task-contract Skill is missing Task Contract field: {field}")
    skill_ui = TEAM_SKILL_UI.read_text(encoding="utf-8") if TEAM_SKILL_UI.is_file() else ""
    for marker in (
        'display_name: "Team Task Contract"',
        'short_description: "Build complete validated team task contracts"',
        "$team-task-contract",
    ):
        if marker not in skill_ui:
            errors.append(f"team-task-contract agents/openai.yaml is missing aligned metadata: {marker}")
    for extra_name in ("README.md", "INSTALLATION_GUIDE.md", "QUICK_REFERENCE.md", "CHANGELOG.md"):
        if (TEAM_SKILL.parent / extra_name).exists():
            errors.append(f"team-task-contract Skill contains unnecessary file: {extra_name}")

    spec_text = TEAM_SPEC.read_text(encoding="utf-8") if TEAM_SPEC.is_file() else ""
    for artifact in REQUIRED_ARTIFACTS:
        if artifact not in spec_text:
            errors.append(f"team execution specification is missing artifact: {artifact}")
    for marker in (
        "shadow mode", "29", "Execution Policy", "run-scoped", "derived approval", "initial",
        "final", "flock", "compare-and-swap", "immutable generation", "commit manifest",
        "integrity", "Strict source staging", "terminal", "non-zero", "Legacy",
        "parent manifest chain", "canonical start request", "historical report generation",
        "closed metrics projection", "canonical raw receipt projection",
        "one-to-one failure history", "schema-first", "commit anchor",
        "dedicated state gate", "historical staging", "reserved evidence",
        "coordinated", "receipt path scope", "completion/source binding",
        "generation-new evidence", "source introduction", "prior write-enabled generation",
        "dedicated cancellation", "four report digests", "target-specific causality",
        "private pending transition", "source basis", "exact causal subset", "canonical inactive",
        "sanitized input problem projection", "immutable run identity",
        "typed exact causal subset", "canonical inactive source projection",
        "safe rejected Task Contract",
    ):
        if marker not in spec_text:
            errors.append(f"team execution specification is missing implementation marker: {marker}")

    for path in (TEAM_REGISTRY, TEAM_POLICY, TEAM_SCHEMA, TEAM_SCENARIOS, TEAM_EXAMPLE, TEAM_SPEC, TEAM_DECISION):
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        if SESSION_ID.search(text):
            errors.append(f"{path.relative_to(ROOT)}: contains a raw session ID")
        if PERSONAL_PATH.search(text):
            errors.append(f"{path.relative_to(ROOT)}: contains a personal absolute path")


def validate_public_policy(errors: list[str]) -> None:
    if OLD_CHECKER.exists():
        errors.append(f"obsolete personal agent checker remains: {OLD_CHECKER.relative_to(ROOT)}")
    if RUNTIME_LOG.exists():
        errors.append(f"personal runtime history remains: {RUNTIME_LOG.relative_to(ROOT)}")
    for path in sorted((ROOT / ".codex" / "agents").glob("*.toml")):
        errors.append(f"public repo must not require personal agent config: {path.relative_to(ROOT)}")

    forbidden_text = (
        ".codex" + "/agents", "verify_codex_" + "agents.py",
        "2026-07-14-custom-" + "subagent-runtime-verification.md",
        "gpt" + "-5.6-" + "luna", "gpt" + "-5.6-" + "terra", "gpt" + "-5.6-" + "sol",
        "codex-personal-" + "harness", "agent " + "TOML", "runtime " + "trace", "17" + "役",
    )
    for path in POLICY_FILES:
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for forbidden in forbidden_text:
            if forbidden in text:
                errors.append(f"{path.relative_to(ROOT)}: public policy contains personal harness dependency: {forbidden}")
        if SESSION_ID.search(text) or PERSONAL_PATH.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains private runtime identity")
        if PERSONAL_MODEL_REFERENCE.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains a personal model or role reference")
        if COMMIT_SHA.search(text) or PR_REFERENCE.search(text) or CI_REFERENCE.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains ephemeral delivery history")

    agents_text = (ROOT / "AGENTS.md").read_text(encoding="utf-8") if (ROOT / "AGENTS.md").is_file() else ""
    for marker in ("MDルーター", "利用可能なSubagent", "Subagentが利用できない場合", "親agent"):
        if marker not in agents_text:
            errors.append(f"AGENTS.md: missing thin project harness marker: {marker}")
    policy_text = POLICY.read_text(encoding="utf-8") if POLICY.is_file() else ""
    start_contract = re.search(
        r"^## childへ渡す開始契約\s*$\n(?P<section>.*?)(?=^## |\Z)",
        policy_text,
        re.MULTILINE | re.DOTALL,
    )
    if start_contract is None:
        errors.append("model-routing-policy.md: child start contract section is missing")
    else:
        for marker in ("対象repo", "project root", "remote", "対象branch", "HEAD", "working tree"):
            if marker not in start_contract.group("section"):
                errors.append(f"model-routing-policy.md: child start contract marker missing: {marker}")

    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8") if (ROOT / ".gitignore").is_file() else ""
    for marker in (".local/", "*.local.md", ".env", "/.codex/runs/", "__pycache__/", "*.py[cod]"):
        if marker not in gitignore:
            errors.append(f".gitignore: missing local safety pattern: {marker}")


def main() -> int:
    errors: list[str] = []
    for path in REQUIRED_FILES:
        if not path.is_file():
            errors.append(f"missing required project harness file: {path.relative_to(ROOT)}")

    if PROJECT_CONFIG.is_file():
        with PROJECT_CONFIG.open("rb") as handle:
            config = tomllib.load(handle)
        agents = config.get("agents", {})
        if agents.get("max_threads") != 3 or agents.get("max_depth") != 1:
            errors.append(".codex/config.toml: agents limits must remain max_threads=3 and max_depth=1")
        validate_team_harness(errors, config)

    markdown_files = sorted({ROOT / "README.md", ROOT / "AGENTS.md", *(ROOT / "docs").rglob("*.md")})
    for path in markdown_files:
        if path.is_file():
            errors.extend(validate_markdown_links(path))
    validate_public_policy(errors)

    if errors:
        print("Project AI harness verification failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(
        "Project AI harness verification passed: closed schemas, 12 generated "
        f"artifacts, 25 scenarios, and {EXPECTED_TEAM_TEST_COUNT} tests are current."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
