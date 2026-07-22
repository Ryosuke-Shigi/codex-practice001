#!/usr/bin/env python3
"""Command-line entrypoint for the project-neutral Specialist team harness."""

from __future__ import annotations

import argparse
import json
import sys
import tomllib
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from team_harness import TeamHarness, validate_document  # noqa: E402
from team_harness.contracts import (  # noqa: E402
    build_task_contract,
    catalog_projection,
    human_summary,
    legacy_contract,
)
from team_harness.registry import validate_registry  # noqa: E402


DEFAULT_CONFIG = ROOT / ".codex" / "config.toml"


def read_json(path: str) -> Any:
    if path == "-":
        return json.load(sys.stdin)
    return json.loads(Path(path).read_text(encoding="utf-8"))


def emit(value: Any) -> None:
    rendered = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    sys.stdout.write(rendered)


def load_harness(config_path: Path = DEFAULT_CONFIG) -> TeamHarness:
    with config_path.open("rb") as handle:
        config = tomllib.load(handle)
    harness_config = config["team_harness"]
    registry = json.loads((ROOT / harness_config["registry_path"]).read_text(encoding="utf-8"))
    policy = json.loads((ROOT / harness_config["execution_policy_path"]).read_text(encoding="utf-8"))
    return TeamHarness(registry, policy, ROOT / harness_config["runs_path"])


def validate_documents() -> list[str]:
    errors: list[str] = []
    with DEFAULT_CONFIG.open("rb") as handle:
        config = tomllib.load(handle)
    harness_config = config.get("team_harness", {})
    required = {
        "registry_path": ("agent-capability-registry.json", "agent_registry"),
        "execution_policy_path": ("execution-policy.json", "execution_policy"),
        "schema_path": ("team-harness.schema.json", None),
        "acceptance_manifest_path": ("acceptance-scenarios.json", "acceptance_manifest"),
    }
    loaded: dict[str, Any] = {}
    for key, (expected_name, _) in required.items():
        raw_path = harness_config.get(key)
        if not raw_path:
            errors.append(f"missing team_harness.{key}")
            continue
        path = ROOT / str(raw_path)
        if path.name != expected_name or not path.is_file():
            errors.append(f"invalid team_harness.{key}")
            continue
        try:
            loaded[key] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            errors.append(f"{path}: invalid JSON: {error}")
    registry = loaded.get("registry_path")
    if isinstance(registry, dict):
        errors.extend(item["message"] for item in validate_registry(registry))
    for key, (_, kind) in required.items():
        document = loaded.get(key)
        if not isinstance(document, dict) or document.get("schema_version") != "1.0":
            errors.append(f"{key} must declare schema_version 1.0")
        elif kind:
            errors.extend(f"{key}: {message}" for message in validate_document(kind, document))
    example_path = ROOT / ".codex" / "team-harness" / "task-contract.example.json"
    try:
        example = json.loads(example_path.read_text(encoding="utf-8"))
        errors.extend(
            f"task-contract.example.json: {message}"
            for message in validate_document("canonical_input_envelope", example)
        )
    except (OSError, json.JSONDecodeError) as error:
        errors.append(f"task-contract.example.json: {error}")
    return errors


def adapt_legacy_document(document: dict[str, Any]) -> dict[str, Any]:
    """Convert only the versioned legacy envelope; all execution still uses TeamHarness."""

    legacy = document.get("legacy_single_agent")
    if not isinstance(legacy, dict) or "task_contract" in document:
        raise ValueError("legacy-adapt requires only legacy_single_agent")
    agent = str(legacy.get("agent", ""))
    title = str(legacy.get("task", ""))
    paths = legacy.get("paths")
    if not agent or not title or not isinstance(paths, list) or not paths:
        raise ValueError("legacy single-agent input is incomplete")
    return {
        "schema_version": "1.0",
        "idempotency_key": str(document.get("idempotency_key", "legacy-cli-adapt")),
        "task_contract": legacy_contract(agent, title, [str(path) for path in paths]),
    }


def unsuccessful(result: Any) -> bool:
    if not isinstance(result, dict):
        return True
    if result.get("state") in {"blocked", "failed", "needs_human_approval", "cancelled"}:
        return True
    if result.get("blockers") or result.get("rejections"):
        return True
    return False


def event_for_record(kind: str, document: dict[str, Any]) -> dict[str, Any]:
    if kind == "finding":
        return {"type": "finding", **document}
    if kind == "plan":
        return {"type": "plan_revised", **document}
    if kind == "artifact":
        return {"type": "artifact", **document}
    if kind == "report":
        report = str(document.get("report", ""))
        status = str(document.get("status", ""))
        if report not in {"verification", "review"} or status not in {"passed", "failed"}:
            raise ValueError("report record requires report=verification|review and status=passed|failed")
        return {"type": f"{report}_report", **document}
    raise ValueError(f"unsupported record kind: {kind}")


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    subcommands = root.add_subparsers(dest="command", required=True)
    subcommands.add_parser("validate", help="validate config and canonical JSON documents")

    for command in ("build-contract", "team-select", "init-run", "legacy-adapt"):
        child = subcommands.add_parser(command)
        child.add_argument("input", help="JSON file or - for stdin")

    resume = subcommands.add_parser("resume-run")
    resume.add_argument("run_id")
    resume.add_argument("input", help="JSON file containing new events/requests or -")

    transition_parser = subcommands.add_parser("transition")
    transition_parser.add_argument("run_id")
    transition_parser.add_argument("target")
    transition_parser.add_argument("--actor", default="orchestrator")

    record = subcommands.add_parser("record")
    record.add_argument("kind", choices=("finding", "plan", "report", "artifact"))
    record.add_argument("run_id")
    record.add_argument("input")

    authorize = subcommands.add_parser("authorize-write")
    authorize.add_argument("input", help="JSON with task_contract and write_request")

    sync = subcommands.add_parser("source-sync")
    sync.add_argument("run_id")
    sync.add_argument("input", help="JSON source_sync_request")

    improvement = subcommands.add_parser("improvement")
    improvement.add_argument("run_id")
    improvement.add_argument("input", help="JSON proposal fields")

    completion = subcommands.add_parser("completion-gate")
    completion.add_argument("run_id")
    completion.add_argument("--expected-revision", type=int, required=False)

    subcommands.add_parser("catalog-projection")
    return root


def main() -> int:
    args = parser().parse_args()
    if args.command == "validate":
        errors = validate_documents()
        emit({"valid": not errors, "errors": errors})
        return 1 if errors else 0
    if args.command == "build-contract":
        task = read_json(args.input)
        contract, blockers = build_task_contract(task)
        emit({"task_contract": contract, "human_summary": human_summary(contract), "blockers": blockers})
        return 1 if blockers else 0

    harness = load_harness()
    if args.command == "legacy-adapt":
        result = harness.run(read_json(args.input))
        emit(result)
        return 1 if unsuccessful(result) else 0
    if args.command in {"team-select", "init-run"}:
        result = harness.run(read_json(args.input))
        emit(result if args.command == "init-run" else {"team": result["team"], "shared_plan": result["shared_plan"]})
        return 1 if unsuccessful(result) else 0
    if args.command == "resume-run":
        task = read_json(args.input)
        task["resume_run_id"] = args.run_id
        result = harness.run(task)
        emit(result)
        return 1 if unsuccessful(result) else 0
    if args.command == "transition":
        current = harness.store.load(args.run_id)
        if current is None:
            emit({"error": "run not found"})
            return 1
        task = {
            "resume_run_id": args.run_id,
            "events": [{"type": "transition", "from": current["state"], "to": args.target, "actor": args.actor}],
        }
        result = harness.run(task)
        emit(result)
        return 1 if unsuccessful(result) else 0
    if args.command == "record":
        event = event_for_record(args.kind, read_json(args.input))
        result = harness.run({"resume_run_id": args.run_id, "events": [event]})
        emit(result)
        return 1 if unsuccessful(result) else 0
    if args.command == "authorize-write":
        document = read_json(args.input)
        write_request = document["write_request"]
        run_id = str(write_request.get("run_id", document.get("run_id", "")))
        decision = harness.authorize_write(run_id, write_request)
        emit(decision)
        return 0 if decision.get("authorized") else 1
    if args.command == "source-sync":
        document = read_json(args.input)
        request = document.get("source_sync_request", document)
        result = harness.run({"resume_run_id": args.run_id, "source_sync_request": request})
        emit(result)
        return 0 if result.get("source_sync", {}).get("accepted") and not unsuccessful(result) else 1
    if args.command == "improvement":
        proposal = read_json(args.input)
        result = harness.run({"resume_run_id": args.run_id, "events": [{"type": "improvement_proposed", **proposal}]})
        emit(result)
        return 1 if unsuccessful(result) else 0
    if args.command == "completion-gate":
        report = harness.completion_gate(args.run_id, expected_revision=args.expected_revision)
        emit(report)
        return 0 if report.get("complete") else 1
    if args.command == "catalog-projection":
        emit(harness.catalog_projection())
        return 0
    raise AssertionError("unreachable command")


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (KeyError, ValueError, json.JSONDecodeError) as error:
        print(f"team harness error: {error}", file=sys.stderr)
        sys.exit(2)
