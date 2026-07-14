#!/usr/bin/env python3
"""Validate the project-scoped Codex agent catalog and its safety contract."""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
AGENTS_DIR = ROOT / ".codex" / "agents"
POLICY = ROOT / "docs" / "ai" / "rules" / "model-routing-policy.md"
COMMAND_REGISTRY = ROOT / "docs" / "operations" / "command-registry.md"
RUNTIME_LOG = ROOT / "docs" / "ai" / "logs" / "2026-07-14-custom-subagent-runtime-verification.md"
MARKDOWN_DOCS = (
    ROOT / "docs" / "index.md",
    ROOT / "docs" / "ai" / "index.md",
    POLICY,
    ROOT / "docs" / "ai" / "workflows" / "md-router.md",
    ROOT / "docs" / "ai" / "workflows" / "md-router-cases.md",
    ROOT / "docs" / "ai" / "workflows" / "loop-engineering.md",
    ROOT / "docs" / "ai" / "workflows" / "work-result-feedback-loop.md",
    COMMAND_REGISTRY,
    ROOT / "docs" / "operations" / "sensors.md",
    ROOT / "docs" / "testing.md",
    RUNTIME_LOG,
)
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")

EXPECTED_AGENTS = {
    "luna_explorer": ("gpt-5.6-luna", "low", "read-only"),
    "terra_implementer": ("gpt-5.6-terra", "medium", None),
    "terra_docs_maintainer": ("gpt-5.6-terra", "medium", None),
    "terra_verifier": ("gpt-5.6-terra", "medium", "read-only"),
    "sol_specialist": ("gpt-5.6-sol", "xhigh", None),
    "sol_reviewer": ("gpt-5.6-sol", "high", "read-only"),
    "specification_reviewer": ("gpt-5.6-terra", "high", "read-only"),
    "architecture_specialist": ("gpt-5.6-sol", "xhigh", "read-only"),
    "design_specialist": ("gpt-5.6-terra", "high", "read-only"),
    "frontend_specialist": ("gpt-5.6-terra", "high", None),
    "backend_specialist": ("gpt-5.6-terra", "high", None),
    "database_specialist": ("gpt-5.6-sol", "high", None),
    "test_specialist": ("gpt-5.6-terra", "high", None),
    "context_recovery": ("gpt-5.6-terra", "high", None),
    "operations_specialist": ("gpt-5.6-sol", "high", None),
    "browser_verifier": ("gpt-5.6-terra", "high", "read-only"),
    "environment_specialist": ("gpt-5.6-terra", "high", "read-only"),
}

WRITER_AGENTS = {
    "terra_implementer",
    "terra_docs_maintainer",
    "sol_specialist",
    "frontend_specialist",
    "backend_specialist",
    "database_specialist",
    "test_specialist",
    "context_recovery",
    "operations_specialist",
}

ROLE_MARKERS = {
    "luna_explorer": "対象ファイル",
    "terra_implementer": "Laravel",
    "terra_docs_maintainer": "Markdown",
    "terra_verifier": "command registry",
    "sol_specialist": "複数レイヤー",
    "sol_reviewer": "最終差分",
    "specification_reviewer": "受入条件",
    "architecture_specialist": "ADR Pattern",
    "design_specialist": "mobile",
    "frontend_specialist": "React",
    "backend_specialist": "Laravel",
    "database_specialist": "Migration",
    "test_specialist": "Red",
    "context_recovery": "理解再起動",
    "operations_specialist": "rollback",
    "browser_verifier": "Console",
    "environment_specialist": "Codex App",
}

COMMON_CONTRACT_MARKERS = (
    "対象repo",
    "project root",
    "対象branch",
    "作業段階",
    "編集可否",
    "変更してよい範囲",
    "変更してはいけない範囲",
    "正本docs",
    "現在確認済みの事実",
    "推測禁止",
    "成功条件",
    "失敗条件",
    "停止条件",
    "検証方法",
    "返却形式",
    "親エージェント",
    "再実行",
    "人間判断",
    "branch、commit、push、Pull Request操作",
    "他のsubagentを起動",
    "単一writer",
    "TDD",
    "ハーネス",
    "ループ",
    "runtime",
    "resolved model",
    "permission profile",
    "HEAD",
    "working tree",
)

TERRA_VERIFIER_DOCKER_MARKERS = {
    AGENTS_DIR / "terra_verifier.toml": ("Docker Compose root", "app repoと外側repo", "生成差分"),
    POLICY: ("read-only親task", "Docker経由の登録済みコマンド", "app repoと外側Docker repo"),
    COMMAND_REGISTRY: ("`terra_verifier`によるDocker経由検証", "read-only親task", "app repoと外側repo"),
    RUNTIME_LOG: ("PR #151", "Docker経由検証のruntime実測", "GitHub Actions CI run #456"),
}


def load_toml(path: Path) -> dict:
    with path.open("rb") as handle:
        return tomllib.load(handle)


def validate_local_markdown_links(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    for raw_target in MARKDOWN_LINK.findall(text):
        target = raw_target.strip().strip("<>")
        if not target or target.startswith("#"):
            continue
        if "://" in target or target.startswith(("mailto:", "tel:")):
            continue
        target = unquote(target.split("#", 1)[0].split("?", 1)[0])
        resolved = (ROOT / target.lstrip("/")) if target.startswith("/") else (path.parent / target)
        if not resolved.exists():
            errors.append(f"{path.relative_to(ROOT)}: missing local Markdown link target: {raw_target}")
    return errors


def main() -> int:
    errors: list[str] = []

    config = load_toml(ROOT / ".codex" / "config.toml")
    agent_config = config.get("agents", {})
    if agent_config.get("max_threads") != 3:
        errors.append(".codex/config.toml: agents.max_threads must remain 3")
    if agent_config.get("max_depth") != 1:
        errors.append(".codex/config.toml: agents.max_depth must remain 1")

    actual_files = {path.stem: path for path in AGENTS_DIR.glob("*.toml")}
    expected_names = set(EXPECTED_AGENTS)
    actual_names = set(actual_files)
    for name in sorted(expected_names - actual_names):
        errors.append(f"missing agent TOML: .codex/agents/{name}.toml")
    for name in sorted(actual_names - expected_names):
        errors.append(f"unexpected agent TOML: .codex/agents/{name}.toml")

    policy_text = POLICY.read_text(encoding="utf-8")
    if "17種類のagent" not in policy_text:
        errors.append("model-routing-policy.md: missing canonical 17-agent catalog")

    for markdown_path in MARKDOWN_DOCS:
        errors.extend(validate_local_markdown_links(markdown_path))

    for contract_path, markers in TERRA_VERIFIER_DOCKER_MARKERS.items():
        contract_text = contract_path.read_text(encoding="utf-8")
        for marker in markers:
            if marker not in contract_text:
                errors.append(
                    f"{contract_path.relative_to(ROOT)}: terra_verifier Docker contract marker missing: {marker}"
                )

    for name, (model, effort, sandbox) in EXPECTED_AGENTS.items():
        path = actual_files.get(name)
        if path is None:
            continue

        data = load_toml(path)
        if data.get("name") != name:
            errors.append(f"{path}: name must match filename")
        if not isinstance(data.get("description"), str) or not data["description"].strip():
            errors.append(f"{path}: description is required")
        if data.get("model") != model:
            errors.append(f"{path}: model must be {model}")
        if data.get("model_reasoning_effort") != effort:
            errors.append(f"{path}: model_reasoning_effort must be {effort}")
        if data.get("sandbox_mode") != sandbox:
            expected = sandbox if sandbox is not None else "omitted (inherit parent)"
            errors.append(f"{path}: sandbox_mode must be {expected}")

        instructions = data.get("developer_instructions")
        if not isinstance(instructions, str) or not instructions.strip():
            errors.append(f"{path}: developer_instructions is required")
            continue
        for marker in COMMON_CONTRACT_MARKERS:
            if marker not in instructions:
                errors.append(f"{path}: common contract marker missing: {marker}")
        if sandbox == "read-only" and "ファイル編集は禁止" not in instructions:
            errors.append(f"{path}: read-only agent must explicitly prohibit file edits")
        if f"`{name}`" not in policy_text:
            errors.append(f"model-routing-policy.md: role not registered: {name}")

        model_label = model.rsplit("-", 1)[-1].title()
        expected_sandbox_label = sandbox if sandbox is not None else "親継承"
        policy_row = next(
            (line for line in policy_text.splitlines() if line.startswith(f"| `{name}` |")),
            None,
        )
        if policy_row is None:
            errors.append(f"model-routing-policy.md: catalog row missing: {name}")
        else:
            cells = [cell.strip() for cell in policy_row.strip("|").split("|")]
            if len(cells) < 4 or cells[1] != f"{model_label} / {effort}":
                errors.append(f"model-routing-policy.md: model/effort drift: {name}")
            if len(cells) < 4 or cells[2] != expected_sandbox_label:
                errors.append(f"model-routing-policy.md: sandbox drift: {name}")

        role_marker = ROLE_MARKERS[name]
        if role_marker not in instructions:
            errors.append(f"{path}: role-specific responsibility marker missing: {role_marker}")
        if name in WRITER_AGENTS:
            for lease_marker in ("writer名", "対象ファイル", "lease開始", "終了条件"):
                if lease_marker not in instructions:
                    errors.append(f"{path}: writer lease marker missing: {lease_marker}")

    if errors:
        print("Codex agent harness verification failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Codex agent harness verification passed: 17 agent TOMLs and common contract are consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
