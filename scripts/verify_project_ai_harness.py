#!/usr/bin/env python3
"""Validate the public, project-scoped AI harness without personal agents."""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
PROJECT_CONFIG = ROOT / ".codex" / "config.toml"
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
CHILD_START_MARKERS = ("対象repo", "project root", "remote", "対象branch", "HEAD", "working tree")


def validate_markdown_links(path: Path) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    for raw_target in MARKDOWN_LINK.findall(text):
        target = raw_target.strip().strip("<>")
        if not target or target.startswith("#"):
            continue
        if "://" in target or target.startswith(("mailto:", "tel:")):
            continue
        target = unquote(target.split("#", 1)[0].split("?", 1)[0])
        resolved = Path(target) if target.startswith("/") else path.parent / target
        if not resolved.exists():
            errors.append(f"{path.relative_to(ROOT)}: missing Markdown link target: {raw_target}")
    return errors


def main() -> int:
    errors: list[str] = []

    for path in REQUIRED_FILES:
        if not path.is_file():
            errors.append(f"missing required project harness file: {path.relative_to(ROOT)}")

    if PROJECT_CONFIG.is_file():
        with PROJECT_CONFIG.open("rb") as handle:
            config = tomllib.load(handle)
        agents = config.get("agents", {})
        if agents.get("max_threads") != 3:
            errors.append(".codex/config.toml: agents.max_threads must remain 3")
        if agents.get("max_depth") != 1:
            errors.append(".codex/config.toml: agents.max_depth must remain 1")

    agent_tomls = sorted((ROOT / ".codex" / "agents").glob("*.toml"))
    for path in agent_tomls:
        errors.append(f"public repo must not require personal agent config: {path.relative_to(ROOT)}")
    if OLD_CHECKER.exists():
        errors.append(f"obsolete personal agent checker remains: {OLD_CHECKER.relative_to(ROOT)}")
    if RUNTIME_LOG.exists():
        errors.append(f"personal runtime history remains: {RUNTIME_LOG.relative_to(ROOT)}")

    markdown_files = sorted({ROOT / "README.md", ROOT / "AGENTS.md", *(ROOT / "docs").rglob("*.md")})
    for path in markdown_files:
        if path.is_file():
            errors.extend(validate_markdown_links(path))

    forbidden_text = (
        ".codex" + "/agents",
        "verify_codex_" + "agents.py",
        "2026-07-14-custom-" + "subagent-runtime-verification.md",
        "gpt" + "-5.6-" + "luna",
        "gpt" + "-5.6-" + "terra",
        "gpt" + "-5.6-" + "sol",
        "codex-personal-" + "harness",
        "agent " + "TOML",
        "runtime " + "trace",
        "17" + "役",
    )
    for path in POLICY_FILES:
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for forbidden in forbidden_text:
            if forbidden in text:
                errors.append(f"{path.relative_to(ROOT)}: public policy contains personal harness dependency: {forbidden}")
        if SESSION_ID.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains a raw session ID")
        if PERSONAL_PATH.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains a personal absolute path")
        if PERSONAL_MODEL_REFERENCE.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains a personal model or role reference")
        if COMMIT_SHA.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains an individual commit SHA")
        if PR_REFERENCE.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains an individual pull request reference")
        if CI_REFERENCE.search(text):
            errors.append(f"{path.relative_to(ROOT)}: public policy contains an individual CI run reference")

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
        start_text = start_contract.group("section")
        for marker in CHILD_START_MARKERS:
            if marker not in start_text:
                errors.append(f"model-routing-policy.md: child start contract marker missing: {marker}")
    for marker in (
        "MDルーター", "小さい作業", "探索", "仕様・設計", "実装", "検証", "レビュー",
        "親agent", "単一writer", "read-heavy", "対象repo", "成功条件", "停止条件",
        "Subagentが利用できない", "Git / Pull Request", "設定値", "runtime実測",
    ):
        if marker not in policy_text:
            errors.append(f"model-routing-policy.md: missing project contract marker: {marker}")

    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8") if (ROOT / ".gitignore").is_file() else ""
    for marker in (".local/", "*.local.md", ".env"):
        if marker not in gitignore:
            errors.append(f".gitignore: missing local safety pattern: {marker}")

    if errors:
        print("Project AI harness verification failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Project AI harness verification passed: the public repo is self-contained and personal-agent independent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
