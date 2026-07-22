"""Ninth-wave regressions for durable history and derived projections."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any, Callable, Mapping

from test_team_harness_contract import (
    minimal_policy,
    minimal_registry,
    report_event,
    request,
    sha256_digest,
)
from test_team_harness_stop_contract import StopContractTestCase

from team_harness.registry import plan_waves, select_team


StateMutation = Callable[[dict[str, Any]], None]
ArtifactMutation = Callable[[dict[str, Any], dict[str, Any]], None]


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, value: Any) -> None:
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def rebuild_commit_anchor(runs_dir: Path, run: Mapping[str, Any]) -> None:
    """Rebuild the local anchor from durable generation manifests.

    Corruption tests use this after rehashing an inner object so an obsolete
    anchor cannot become the accidental reason the test passes.
    """

    run_dir = runs_dir / str(run["run_id"])
    manifests = sorted(
        (
            _read_json(path)
            for path in (run_dir / "generations").glob(
                "generation-*/commit-manifest.json"
            )
        ),
        key=lambda item: int(item["revision"]),
    )
    entries = [
        {
            "revision": manifest["revision"],
            "generation_ref": manifest["generation_ref"],
            "manifest_digest": manifest["manifest_digest"],
            "parent_manifest_digest": manifest["parent_manifest_digest"],
        }
        for manifest in manifests
    ]
    latest = manifests[-1]
    anchor = {
        "schema_version": "1.0",
        "run_id": run["run_id"],
        "entries": entries,
        "high_revision": latest["revision"],
        "high_generation_ref": latest["generation_ref"],
        "high_manifest_digest": latest["manifest_digest"],
    }
    anchor["anchor_digest"] = sha256_digest(anchor)
    _write_json(run_dir / "commit-anchor.json", anchor)


def committed_snapshot(
    runs_dir: Path, run: Mapping[str, Any]
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    run_dir = runs_dir / str(run["run_id"])
    manifest = _read_json(run_dir / "commit-manifest.json")
    state = _read_json(run_dir / str(manifest["state_ref"]))
    artifacts = {
        str(reference["name"]): _read_json(run_dir / str(reference["path"]))
        for reference in state["artifacts"]
    }
    return manifest, state, artifacts


def write_committed_variant(
    runs_dir: Path,
    run: Mapping[str, Any],
    base_manifest: Mapping[str, Any],
    base_state: Mapping[str, Any],
    base_artifacts: Mapping[str, Any],
    mutate_state: StateMutation,
    mutate_artifacts: ArtifactMutation | None = None,
) -> None:
    """Rewrite the visible generation and both manifests with valid digests."""

    run_dir = runs_dir / str(run["run_id"])
    manifest = copy.deepcopy(dict(base_manifest))
    state = copy.deepcopy(dict(base_state))
    artifacts = copy.deepcopy(dict(base_artifacts))
    mutate_state(state)
    if mutate_artifacts is not None:
        mutate_artifacts(state, artifacts)

    references = {
        str(reference["name"]): reference for reference in state["artifacts"]
    }
    for name, document in artifacts.items():
        reference = references[name]
        _write_json(run_dir / str(reference["path"]), document)
        artifact_digest = sha256_digest(document)
        reference["digest"] = artifact_digest
        manifest["artifact_digests"][name] = artifact_digest

    state_path = run_dir / str(manifest["state_ref"])
    _write_json(state_path, state)
    manifest["state_digest"] = sha256_digest(state)
    manifest["trace_digest"] = sha256_digest(state.get("state_trace", []))
    manifest["manifest_digest"] = sha256_digest(
        {key: value for key, value in manifest.items() if key != "manifest_digest"}
    )
    _write_json(
        run_dir / str(manifest["generation_ref"]) / "commit-manifest.json",
        manifest,
    )
    _write_json(run_dir / "commit-manifest.json", manifest)
    rebuild_commit_anchor(runs_dir, run)


def generation_snapshots(
    runs_dir: Path, run: Mapping[str, Any]
) -> list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]]:
    run_dir = runs_dir / str(run["run_id"])
    result: list[
        tuple[dict[str, Any], dict[str, Any], dict[str, Any]]
    ] = []
    for manifest_path in sorted(
        (run_dir / "generations").glob("generation-*/commit-manifest.json")
    ):
        manifest = _read_json(manifest_path)
        state = _read_json(run_dir / str(manifest["state_ref"]))
        artifacts = {
            str(reference["name"]): _read_json(run_dir / str(reference["path"]))
            for reference in state["artifacts"]
        }
        result.append((manifest, state, artifacts))
    return sorted(result, key=lambda item: int(item[0]["revision"]))


def rehash_metrics(state: dict[str, Any]) -> None:
    metrics = state["metrics"]
    metrics["digest"] = sha256_digest(
        {key: value for key, value in metrics.items() if key != "digest"}
    )


def derived_finding_catalog(state: Mapping[str, Any]) -> list[dict[str, Any]]:
    resolutions = {
        str(item.get("finding_digest")): item
        for item in state.get("implementation_log", [])
        if isinstance(item, Mapping)
        and item.get("kind") == "finding_resolution_receipt"
        and item.get("status") == "resolved"
    }
    groups: dict[tuple[str, str, str], list[Mapping[str, Any]]] = {}
    for finding in state.get("findings", []):
        identity = (
            str(finding.get("issue_id")),
            str(finding.get("clause")),
            str(finding.get("location")),
        )
        groups.setdefault(identity, []).append(finding)
    catalog: list[dict[str, Any]] = []
    for identity, findings in groups.items():
        first = findings[0]
        resolved = all(str(item.get("digest")) in resolutions for item in findings)
        first_resolution = resolutions.get(str(first.get("digest")))
        catalog.append(
            {
                "issue_id": identity[0],
                "clause": identity[1],
                "location": identity[2],
                "first_finding_digest": first.get("digest"),
                "status": "resolved" if resolved else "open",
                "resolution_receipt_digest": (
                    first_resolution.get("digest")
                    if isinstance(first_resolution, Mapping)
                    else None
                ),
            }
        )
    return catalog


class NinthHarnessRegressionTest(StopContractTestCase):
    def _integrity_is_blocked(
        self, run: Mapping[str, Any]
    ) -> tuple[bool, str]:
        try:
            loaded = self.harness.facade.store.load(str(run["run_id"]))
            resumed = self.resume_run(run, events=[])
        except Exception as error:  # pragma: no cover - failure is reported, not errored
            return False, f"raised {type(error).__name__}: {error}"
        rendered = json.dumps(loaded, ensure_ascii=False).lower()
        blocked = bool(
            isinstance(loaded, Mapping)
            and loaded.get("state") == "blocked"
            and loaded.get("integrity_status") == "failed"
            and isinstance(resumed, Mapping)
            and resumed.get("state") == "blocked"
        )
        return blocked, rendered

    def _finding_run(self, key: str, issue_id: str, path: str) -> dict[str, Any]:
        return self.run_request(
            request(
                idempotency_key=key,
                paths=["app/Http/Controllers/ExampleController.php", path],
                events=[
                    {
                        "type": "finding",
                        "actor": "reviewer",
                        "source": "reviewer",
                        "issue_id": issue_id,
                        "clause": "ninth.history.binding",
                        "location": path,
                        "kind": "architecture",
                        "message": issue_id,
                        "status": "open",
                    }
                ],
            )
        )

    def test_generation_chain_is_monotonic_append_only_and_binds_finding_artifacts(self) -> None:
        problems: list[str] = []
        path = "app/ninth-generation-fix.diff"
        started = self._finding_run("ninth-generation-chain", "GEN-9", path)
        failed = self.resume_run(
            started,
            events=[report_event(started, "verification", "failed", cause="GEN-9")],
        )
        fixed = self.apply_persisted_fix(
            failed, cause="GEN-9", issue_ids=["GEN-9"], path=path
        )
        generations = generation_snapshots(self.runs_dir, fixed)
        revisions = [int(item[0]["revision"]) for item in generations]
        if revisions != list(range(1, revisions[-1] + 1)):
            problems.append(f"generation revisions are not contiguous: {revisions}")

        append_only_fields = (
            "state_trace",
            "findings",
            "failure_history",
            "implementation_log",
        )
        previous: tuple[
            dict[str, Any], dict[str, Any], dict[str, Any]
        ] | None = None
        for manifest, state, artifacts in generations:
            specialist = artifacts["specialist-findings"]
            expected_specialist = {
                "schema_version": "1.0",
                "receipts": state["findings"],
                "catalog": state["finding_catalog"],
                "conflicts": state["conflicts"],
            }
            reference = next(
                item for item in state["artifacts"]
                if item["name"] == "specialist-findings"
            )
            actual_digest = sha256_digest(specialist)
            if specialist != expected_specialist:
                problems.append(
                    f"revision {state['revision']} specialist findings diverge from state"
                )
            if not (
                actual_digest == reference["digest"]
                == manifest["artifact_digests"]["specialist-findings"]
            ):
                problems.append(
                    f"revision {state['revision']} specialist finding digest is unbound"
                )
            if previous is None:
                if manifest.get("parent_generation_ref", "missing") is not None:
                    problems.append("first generation must persist a null parent generation")
                if manifest.get("parent_manifest_digest", "missing") is not None:
                    problems.append("first generation must persist a null parent digest")
            else:
                prior_manifest, prior_state, _ = previous
                if manifest.get("parent_generation_ref") != prior_manifest.get(
                    "generation_ref"
                ):
                    problems.append(
                        f"revision {state['revision']} does not bind its parent generation"
                    )
                if manifest.get("parent_manifest_digest") != prior_manifest.get(
                    "manifest_digest"
                ):
                    problems.append(
                        f"revision {state['revision']} does not bind its parent manifest"
                    )
                for field in append_only_fields:
                    prior_values = prior_state[field]
                    if state[field][: len(prior_values)] != prior_values:
                        problems.append(
                            f"revision {state['revision']} rewrites append-only {field}"
                        )
            previous = (manifest, state, artifacts)

        tampered = self._finding_run(
            "ninth-generation-delete", "GEN-DELETE-9", "app/ninth-delete.diff"
        )
        tampered = self.resume_run(
            tampered,
            events=[{"type": "plan_revised", "change": "create a later generation"}],
        )
        manifest, state, artifacts = committed_snapshot(self.runs_dir, tampered)

        def delete_receipts(candidate: dict[str, Any]) -> None:
            candidate["findings"] = []
            candidate["finding_catalog"] = []
            candidate["metrics"]["review_findings"] = 0
            candidate["metrics"]["architecture_violations"] = 0
            rehash_metrics(candidate)

        def sync_deleted_findings(
            candidate: dict[str, Any], documents: dict[str, Any]
        ) -> None:
            documents["specialist-findings"] = {
                "schema_version": "1.0",
                "receipts": candidate["findings"],
                "catalog": candidate["finding_catalog"],
                "conflicts": candidate["conflicts"],
            }

        write_committed_variant(
            self.runs_dir,
            tampered,
            manifest,
            state,
            artifacts,
            delete_receipts,
            sync_deleted_findings,
        )
        blocked, detail = self._integrity_is_blocked(tampered)
        if not blocked:
            problems.append(
                "rehash deletion of prior blocking findings/catalog was accepted: "
                + detail[:240]
            )
        self.assertEqual([], problems)

    def test_persisted_team_is_exactly_reconstructed_from_all_selection_inputs(self) -> None:
        problems: list[str] = []
        assignments = {
            "writer": "backend",
            "reviewer": "reviewer",
            "verifier": "verifier",
        }
        registry = minimal_registry()
        policy = minimal_policy()
        # Make the high-risk specialist requirement independent from the writer:
        # the Registry is the authority for this selection input.
        risk_specialist_id = "security"
        risk_specialist = next(
            item for item in registry["agents"] if item["id"] == risk_specialist_id
        )
        risk_specialist["risk_triggers"] = ["high"]
        self.harness.registry = registry
        self.harness.policy = policy
        self.harness.facade = self.harness._make_facade()
        baseline = self.run_request(
            request(
                idempotency_key="ninth-canonical-team",
                risk="high",
                role_assignments=assignments,
            )
        )
        if baseline.get("role_assignments") != assignments:
            problems.append("Run State does not bind the starting role_assignments snapshot")

        selected = select_team(
            registry,
            baseline["task_contract"],
            role_assignments=assignments,
        )
        expected_team = copy.deepcopy(selected["team"])
        max_threads = int(policy["max_threads"])
        implementation = [
            item for item in expected_team
            if item["role"] in {"writer", "specialist"}
        ]
        if len(implementation) > max_threads:
            retained = {item["id"] for item in implementation[:max_threads]}
            expected_team = [
                item for item in expected_team
                if item["role"] in {"reviewer", "verifier"}
                or item["id"] in retained
            ]
        expected_waves = plan_waves(expected_team, max_threads)
        expected_selection = {
            "writer": selected["writer"],
            "fallback": selected["fallback"],
            "eligible_writers": selected["eligible_writers"],
        }
        expected_runtime = {
            item["id"]: item["model_profile"] for item in expected_team
        }
        expected_threads = max(
            (len(wave["agents"]) for wave in expected_waves), default=0
        )
        exact_values = {
            "team set/order/roles/reasons": (baseline["team"], expected_team),
            "selection fallback and eligible writers": (
                baseline["selection"], expected_selection
            ),
            "write ownership": (
                baseline["write_ownership"], selected["write_ownership"]
            ),
            "runtime profiles": (baseline["runtime"]["profiles"], expected_runtime),
            "shared plan waves": (baseline["shared_plan"]["waves"], expected_waves),
            "thread count": (baseline["thread_count"], expected_threads),
        }
        for label, (actual, expected) in exact_values.items():
            if actual != expected:
                problems.append(f"canonical {label} differs")

        def synchronize_team(candidate: dict[str, Any]) -> None:
            candidate["runtime"]["profiles"] = {
                item["id"]: item["model_profile"] for item in candidate["team"]
            }
            candidate["shared_plan"]["waves"] = plan_waves(
                candidate["team"], max_threads
            )
            candidate["thread_count"] = max(
                (
                    len(wave["agents"])
                    for wave in candidate["shared_plan"]["waves"]
                ),
                default=0,
            )
            candidate["metrics"]["selected_agents"] = [
                item["id"] for item in candidate["team"]
            ]
            candidate["metrics"]["selection_reasons"] = {
                item["id"]: copy.deepcopy(item["selection_reasons"])
                for item in candidate["team"]
            }
            candidate["metrics"]["model_profiles"] = copy.deepcopy(
                candidate["runtime"]["profiles"]
            )
            if "team_size" in candidate["metrics"]:
                candidate["metrics"]["team_size"] = len(candidate["team"])
            if "wave_count" in candidate["metrics"]:
                candidate["metrics"]["wave_count"] = len(
                    candidate["shared_plan"]["waves"]
                )
            rehash_metrics(candidate)

        def remove_risk_specialist(candidate: dict[str, Any]) -> None:
            candidate["team"] = [
                item for item in candidate["team"]
                if item["id"] != risk_specialist_id
            ]
            synchronize_team(candidate)

        operations = next(
            item for item in registry["agents"] if item["id"] == "operations"
        )
        unnecessary_member = {
            "id": operations["id"],
            "role": "specialist",
            "registry_roles": copy.deepcopy(operations["roles"]),
            "domains": copy.deepcopy(operations["domains"]),
            "capabilities": copy.deepcopy(operations["capabilities"]),
            "model_profile": operations["model_profile"],
            "path_scopes": copy.deepcopy(operations["path_scopes"]),
            "risk_triggers": copy.deepcopy(operations["risk_triggers"]),
            "registry_agent_digest": sha256_digest(operations),
            "selection_reasons": ["path", "risk"],
        }

        def add_unnecessary_member(candidate: dict[str, Any]) -> None:
            quality_index = next(
                index for index, item in enumerate(candidate["team"])
                if item["role"] in {"reviewer", "verifier"}
            )
            candidate["team"].insert(
                quality_index, copy.deepcopy(unnecessary_member)
            )
            synchronize_team(candidate)

        def alter_selection_reason(candidate: dict[str, Any]) -> None:
            member = next(
                item for item in candidate["team"]
                if item["id"] == risk_specialist_id
            )
            member["selection_reasons"] = ["path"]
            synchronize_team(candidate)

        def alter_wave(candidate: dict[str, Any]) -> None:
            candidate["shared_plan"]["waves"][0]["agents"].reverse()

        corruptions: tuple[tuple[str, StateMutation], ...] = (
            ("required risk specialist deletion", remove_risk_specialist),
            ("unnecessary specialist addition", add_unnecessary_member),
            ("selection reason drift", alter_selection_reason),
            ("shared plan wave drift", alter_wave),
        )
        for index, (label, mutation) in enumerate(corruptions, start=1):
            candidate = self.run_request(
                request(
                    idempotency_key=f"ninth-team-corruption-{index}",
                    risk="high",
                    role_assignments=assignments,
                )
            )
            manifest, state, artifacts = committed_snapshot(self.runs_dir, candidate)
            write_committed_variant(
                self.runs_dir,
                candidate,
                manifest,
                state,
                artifacts,
                mutation,
            )
            blocked, detail = self._integrity_is_blocked(candidate)
            if not blocked:
                problems.append(f"{label} was accepted: {detail[:180]}")
        self.assertEqual([], problems)

    def test_failure_history_binds_a_real_prior_generation_and_finding_identity(self) -> None:
        problems: list[str] = []
        path = "app/ninth-history-fix.diff"
        started = self._finding_run("ninth-history", "HIST-9", path)
        failed = self.resume_run(
            started,
            events=[report_event(started, "verification", "failed", cause="HIST-9")],
        )
        fixed = self.apply_persisted_fix(
            failed, cause="HIST-9", issue_ids=["HIST-9"], path=path
        )
        history = fixed["failure_history"][-1]
        generation_ref = history.get("report_generation_ref")
        generation_revision = history.get("report_generation_revision")
        if not isinstance(generation_ref, str) or not isinstance(
            generation_revision, int
        ):
            problems.append("failure history does not bind a concrete report generation")
        else:
            run_dir = self.runs_dir / fixed["run_id"]
            historical_manifest_path = run_dir / generation_ref / "commit-manifest.json"
            if not historical_manifest_path.is_file():
                problems.append("failure history names a fictional report generation")
            else:
                historical_manifest = _read_json(historical_manifest_path)
                historical_state = _read_json(
                    run_dir / str(historical_manifest["state_ref"])
                )
                report_key = (
                    f"{history['phase']}_{history['report']}_report"
                )
                historical_report = historical_state.get(report_key)
                if generation_revision != historical_manifest.get("revision"):
                    problems.append("historical generation revision is not exact")
                if historical_manifest.get("revision", 0) >= fixed["revision"]:
                    problems.append("failure generation is not prior to the current commit")
                if historical_report != history.get("report_snapshot"):
                    problems.append("failure report snapshot differs from historical state")

                snapshot = history["report_snapshot"]
                role = "verifier" if history["report"] == "verification" else "reviewer"
                expected_grant = historical_state["authority_grants"]["quality"][
                    history["phase"]
                ][role]
                evidence_pairs = (
                    (snapshot.get("authority_grant"), expected_grant, "grant"),
                    (
                        snapshot.get("artifact_digest"),
                        historical_state.get("current_artifact_digest"),
                        "artifact digest",
                    ),
                    (
                        snapshot.get("plan_revision"),
                        historical_state.get("shared_plan", {}).get("revision"),
                        "plan revision",
                    ),
                    (
                        snapshot.get("artifact_revision"),
                        historical_state.get("artifact_revision"),
                        "artifact revision",
                    ),
                    (
                        snapshot.get("attempt"),
                        historical_state.get("attempt_count"),
                        "attempt",
                    ),
                    (
                        snapshot.get("cause"), history.get("cause"), "cause"
                    ),
                    (
                        snapshot.get("report_digest"),
                        history.get("report_digest"),
                        "report digest",
                    ),
                )
                for actual, expected, label in evidence_pairs:
                    if actual != expected:
                        problems.append(f"historical {label} is not exact")

        original_finding = fixed["findings"][0]
        expected_identity = {
            "issue_id": original_finding["issue_id"],
            "clause": original_finding["clause"],
            "location": original_finding["location"],
            "source": original_finding["source"],
            "finding_digest": original_finding["digest"],
        }
        identities = history.get("finding_identities")
        if identities != [expected_identity]:
            problems.append("failure history does not persist exact finding identities")

        resolution = next(
            item for item in fixed["implementation_log"]
            if item.get("kind") == "finding_resolution_receipt"
        )
        artifact_receipt = next(
            item for item in fixed["implementation_log"]
            if item.get("kind") == "artifact_receipt"
            and item.get("receipt_id") == resolution.get("fix_receipt_id")
        )
        if resolution["issue_id"] not in history["issue_ids"]:
            problems.append("resolved issue is absent from matching failure history")
        if resolution["issue_id"] not in artifact_receipt["issue_ids"]:
            problems.append("resolved issue is absent from the fix artifact receipt")
        if resolution.get("source") != original_finding["source"]:
            problems.append("resolution does not bind the finding source identity")

        manifest, state, artifacts = committed_snapshot(self.runs_dir, fixed)

        def unrelated_history_issue(candidate: dict[str, Any]) -> None:
            candidate["failure_history"][-1]["issue_ids"].append("UNRELATED-9")

        write_committed_variant(
            self.runs_dir,
            fixed,
            manifest,
            state,
            artifacts,
            unrelated_history_issue,
        )
        blocked, detail = self._integrity_is_blocked(fixed)
        if not blocked:
            problems.append(f"unrelated historical issue was accepted: {detail[:180]}")

        def redirect_resolution(candidate: dict[str, Any]) -> None:
            existing = candidate["findings"][0]
            other = copy.deepcopy(existing)
            other.update(
                {
                    "sequence": len(candidate["findings"]) + 1,
                    "source": "verifier",
                    "actor": "verifier",
                    "clause": "ninth.history.other-clause",
                    "location": "app/ninth-other-identity.diff",
                }
            )
            other["digest"] = sha256_digest(
                {key: value for key, value in other.items() if key != "digest"}
            )
            candidate["findings"].append(other)
            receipt = next(
                item for item in candidate["implementation_log"]
                if item.get("kind") == "finding_resolution_receipt"
            )
            receipt["finding_digest"] = other["digest"]
            receipt["clause"] = other["clause"]
            receipt["location"] = other["location"]
            if "source" in receipt:
                receipt["source"] = other["source"]
            if isinstance(receipt.get("finding_identity"), dict):
                receipt["finding_identity"] = {
                    "issue_id": other["issue_id"],
                    "clause": other["clause"],
                    "location": other["location"],
                    "source": other["source"],
                    "finding_digest": other["digest"],
                }
            receipt["digest"] = sha256_digest(
                {key: value for key, value in receipt.items() if key != "digest"}
            )
            candidate["finding_catalog"] = derived_finding_catalog(candidate)
            candidate["metrics"]["review_findings"] = len(candidate["findings"])
            candidate["metrics"]["architecture_violations"] = sum(
                1
                for item in candidate["findings"]
                if item.get("kind") in {"architecture", "design"}
            )
            rehash_metrics(candidate)

        def sync_redirected_findings(
            candidate: dict[str, Any], documents: dict[str, Any]
        ) -> None:
            documents["specialist-findings"] = {
                "schema_version": "1.0",
                "receipts": copy.deepcopy(candidate["findings"]),
                "catalog": copy.deepcopy(candidate["finding_catalog"]),
                "conflicts": copy.deepcopy(candidate["conflicts"]),
            }
            documents["implementation-log"] = {
                "schema_version": "1.0",
                "entries": copy.deepcopy(candidate["implementation_log"]),
                "metrics": copy.deepcopy(candidate["metrics"]),
            }

        write_committed_variant(
            self.runs_dir,
            fixed,
            manifest,
            state,
            artifacts,
            redirect_resolution,
            sync_redirected_findings,
        )
        blocked, detail = self._integrity_is_blocked(fixed)
        if not blocked:
            problems.append(
                "same issue_id resolution was moved to another identity: "
                + detail[:180]
            )

        if "report_generation_ref" in history:
            def fictional_generation(candidate: dict[str, Any]) -> None:
                candidate["failure_history"][-1]["report_generation_ref"] = (
                    "generations/generation-99999999-fictional"
                )
                candidate["failure_history"][-1]["report_generation_revision"] = 99999999

            write_committed_variant(
                self.runs_dir,
                fixed,
                manifest,
                state,
                artifacts,
                fictional_generation,
            )
            blocked, detail = self._integrity_is_blocked(fixed)
            if not blocked:
                problems.append(f"fictional historical generation was accepted: {detail[:180]}")
        self.assertEqual([], problems)

    def test_metrics_are_a_closed_projection_recomputed_from_committed_state(self) -> None:
        problems: list[str] = []
        started = self.run_request(
            request(
                idempotency_key="ninth-metrics",
                paths=[
                    "app/Http/Controllers/ExampleController.php",
                    "app/ninth-verification-fix.diff",
                    "app/ninth-review-fix.diff",
                ],
            )
        )
        verification_failed = self.resume_run(
            started,
            events=[
                report_event(
                    started, "verification", "failed", cause="metrics-test-failure"
                )
            ],
        )
        verification_fixed = self.apply_persisted_fix(
            verification_failed,
            cause="metrics-test-failure",
            path="app/ninth-verification-fix.diff",
        )
        verified = self.resume_run(
            verification_fixed,
            events=[report_event(verification_fixed, "verification", "passed")],
        )
        review_failed = self.resume_run(
            verified,
            events=[
                report_event(
                    verified, "review", "failed", cause="metrics-design-failure"
                )
            ],
        )
        review_fixed = self.apply_persisted_fix(
            review_failed,
            cause="metrics-design-failure",
            path="app/ninth-review-fix.diff",
        )
        reverified = self.resume_run(
            review_fixed,
            events=[report_event(review_fixed, "verification", "passed")],
        )
        approved = self.resume_run(
            reverified,
            events=[report_event(reverified, "review", "passed")],
        )
        staged = self.resume_run(
            approved, source_sync_request=self.source_request(approved)
        )
        final_verified = self.resume_run(
            staged,
            events=[report_event(staged, "verification", "passed", phase="final")],
        )
        final_reviewed = self.resume_run(
            final_verified,
            events=[
                report_event(final_verified, "review", "passed", phase="final")
            ],
        )
        completion = self.harness.facade.completion_gate(
            final_reviewed["run_id"], expected_revision=final_reviewed["revision"]
        )
        if not completion.get("complete"):
            problems.append("rich metrics fixture did not complete")
        completed = self.harness.facade.store.load(final_reviewed["run_id"])
        if not isinstance(completed, Mapping):
            self.fail("completed metrics Run State was not persisted")
            return

        failures = completed["failure_history"]
        findings = completed["findings"]
        expected_metrics = {
            "selected_agents": [item["id"] for item in completed["team"]],
            "selection_reasons": {
                item["id"]: item["selection_reasons"] for item in completed["team"]
            },
            "team_size": len(completed["team"]),
            "wave_count": len(completed["shared_plan"]["waves"]),
            "retry_count": completed["attempt_count"] - 1,
            "verification_failures": sum(
                1 for item in failures if item["report"] == "verification"
            ),
            "review_failures": sum(
                1 for item in failures if item["report"] == "review"
            ),
            "architecture_violations": sum(
                1
                for item in findings
                if item.get("kind") in {"architecture", "design"}
            ),
            "test_results": completed["verification_report"],
            "source_updates": int(bool(completed["source_sync"]["accepted"])),
            "completed": completed["state"] == "completed",
            "blocked": completed["state"] == "blocked",
            "elapsed_time": "unavailable",
            "token_usage": "unavailable",
            "cost": "unavailable",
        }
        for field, expected in expected_metrics.items():
            if completed["metrics"].get(field) != expected:
                problems.append(f"metrics.{field} is not derived from Run State")

        manifest, state, artifacts = committed_snapshot(self.runs_dir, completed)

        def mutate_metric(field: str, value: Any) -> StateMutation:
            def mutate(candidate: dict[str, Any]) -> None:
                candidate["metrics"][field] = copy.deepcopy(value)
                rehash_metrics(candidate)

            return mutate

        forged_test_results = copy.deepcopy(state["metrics"]["test_results"])
        forged_test_results["status"] = "failed"
        mutations: tuple[tuple[str, StateMutation], ...] = (
            ("selected_agents", mutate_metric("selected_agents", ["verifier"])),
            (
                "selection_reasons",
                mutate_metric("selection_reasons", {"backend": ["risk"]}),
            ),
            ("team_size", mutate_metric("team_size", len(state["team"]) + 1)),
            (
                "wave_count",
                mutate_metric("wave_count", len(state["shared_plan"]["waves"]) + 1),
            ),
            ("retry_count", mutate_metric("retry_count", 99)),
            (
                "verification_failures",
                mutate_metric("verification_failures", 99),
            ),
            ("review_failures", mutate_metric("review_failures", 99)),
            (
                "architecture_violations",
                mutate_metric("architecture_violations", 99),
            ),
            ("test_results", mutate_metric("test_results", forged_test_results)),
            ("source_updates", mutate_metric("source_updates", 0)),
            ("completed", mutate_metric("completed", False)),
            ("blocked", mutate_metric("blocked", True)),
            ("elapsed_time", mutate_metric("elapsed_time", "1 second")),
            ("token_usage", mutate_metric("token_usage", "1")),
            ("cost", mutate_metric("cost", "1")),
            (
                "unknown_field",
                mutate_metric("caller_supplied_measurement", "trusted"),
            ),
        )
        for label, mutation in mutations:
            write_committed_variant(
                self.runs_dir,
                completed,
                manifest,
                state,
                artifacts,
                mutation,
            )
            blocked, detail = self._integrity_is_blocked(completed)
            if not blocked:
                problems.append(f"rehash metrics {label} drift was accepted: {detail[:160]}")
        self.assertEqual([], problems)
