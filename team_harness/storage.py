"""Revisioned, crash-safe local Run State persistence."""

from __future__ import annotations

import copy
import fcntl
import json
import os
import tempfile
import threading
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Mapping

from .contracts import canonical_json, digest, forbidden_path, normalize_path
from .registry import path_matches_scope
from .schema import validate_document
from .state import (
    accepted_shadow_source_projection_errors,
    canonical_artifact_documents,
    canonical_completion_projection,
    canonical_failure_history_entry,
    canonical_inactive_source_projection,
    canonical_reserved_evidence,
    dedicated_state_gate_errors,
    reserved_generation_evidence_errors,
    validate_run_state_semantics,
)


_LOCKS_GUARD = threading.Lock()
_THREAD_LOCKS: dict[str, threading.RLock] = {}


class StaleRevisionError(RuntimeError):
    pass


class RunStore:
    def __init__(
        self,
        runs_dir: Path,
        *,
        registry: Mapping[str, Any] | None = None,
        policy: Mapping[str, Any] | None = None,
    ) -> None:
        self.runs_dir = Path(runs_dir)
        self.registry = copy.deepcopy(dict(registry)) if registry is not None else None
        self.policy = copy.deepcopy(dict(policy)) if policy is not None else None
        self._held = threading.local()

    @contextmanager
    def interprocess_lock(self, run_id: str, timeout: float = 5.0) -> Iterator[None]:
        self._validate_run_id(run_id)
        self.runs_dir.mkdir(parents=True, exist_ok=True)
        lock_dir = self.runs_dir / ".locks"
        lock_dir.mkdir(parents=True, exist_ok=True)
        key = str((lock_dir / f"{run_id}.lock").resolve())
        with _LOCKS_GUARD:
            thread_lock = _THREAD_LOCKS.setdefault(key, threading.RLock())
        deadline = time.monotonic() + timeout
        remaining = max(0.0, deadline - time.monotonic())
        if not thread_lock.acquire(timeout=remaining):
            raise TimeoutError(f"run lock timeout: {run_id}")
        handle = None
        try:
            handle = (lock_dir / f"{run_id}.lock").open("a+b")
            while True:
                try:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except BlockingIOError:
                    if time.monotonic() >= deadline:
                        raise TimeoutError(f"run lock timeout: {run_id}")
                    time.sleep(0.01)
            held = getattr(self._held, "run_ids", set())
            self._held.run_ids = {*held, run_id}
            yield
        finally:
            held = getattr(self._held, "run_ids", set())
            self._held.run_ids = set(held) - {run_id}
            if handle is not None:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
                handle.close()
            thread_lock.release()

    def load(self, run_id: str) -> dict[str, Any] | None:
        if self._lock_held(run_id):
            return self._load_locked(run_id)
        # A read of an unknown run must remain read-only.  In particular, do not
        # create the lock directory merely to discover that no commit pointer
        # exists (the CLI may be inspecting a read-only run root).
        if not self.has_run(run_id):
            return None
        with self.interprocess_lock(run_id):
            return self._load_locked(run_id)

    def has_run(self, run_id: str) -> bool:
        """Return whether the durable commit pointer exists without writing."""
        return (self._run_dir(run_id) / "commit-manifest.json").is_file()

    def save(
        self,
        run: dict[str, Any],
        *,
        expected_revision: int | None = None,
        crash_at: str | None = None,
    ) -> None:
        run_id = str(run["run_id"])
        if self._lock_held(run_id):
            self._save_locked(run, expected_revision=expected_revision, crash_at=crash_at)
            return
        with self.interprocess_lock(run_id):
            self._save_locked(run, expected_revision=expected_revision, crash_at=crash_at)

    def _save_locked(
        self,
        run: dict[str, Any],
        *,
        expected_revision: int | None,
        crash_at: str | None,
    ) -> None:
        run_id = str(run["run_id"])
        run_dir = self._run_dir(run_id)
        run_dir.mkdir(parents=True, exist_ok=True)
        try:
            current_manifest = self._read_manifest(run_dir)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            raise ValueError("persisted commit manifest is malformed") from error
        current_revision = int(current_manifest.get("revision", 0)) if current_manifest else 0
        current_anchor = self._read_anchor(run_dir)
        if current_manifest is None:
            if current_anchor is not None:
                raise ValueError("commit anchor exists without a committed root")
        else:
            anchor_errors, _, recovery = self._check_anchor(
                run_dir, current_manifest, current_anchor
            )
            if anchor_errors or recovery:
                raise ValueError("persisted commit anchor is inconsistent")
        current_state: dict[str, Any] | None = None
        if current_manifest is not None:
            current_state_path = self._contained_path(
                run_dir, current_manifest.get("state_ref")
            )
            if current_state_path is None:
                raise ValueError("persisted parent state reference is invalid")
            try:
                loaded_parent = json.loads(
                    current_state_path.read_text(encoding="utf-8")
                )
            except (OSError, json.JSONDecodeError) as error:
                raise ValueError("persisted parent state is malformed") from error
            if not isinstance(loaded_parent, dict):
                raise ValueError("persisted parent state must be an object")
            current_state = loaded_parent
        if expected_revision is None:
            expected_revision = int(run.get("revision", current_revision))
        if int(expected_revision) != current_revision:
            raise StaleRevisionError(
                f"stale run revision: expected {expected_revision}, current {current_revision}"
            )
        new_revision = current_revision + 1
        generations = run_dir / "generations"
        generations.mkdir(parents=True, exist_ok=True)
        generation_dir = Path(tempfile.mkdtemp(prefix=f"generation-{new_revision:08d}-", dir=generations))
        generation_ref = generation_dir.relative_to(run_dir).as_posix()

        for history in run.get("failure_history", []):
            if not isinstance(history, dict) or history.get("report_generation_ref"):
                continue
            report_key = f"{history.get('phase')}_{history.get('report')}_report"
            if run.get(report_key) == history.get("report_snapshot"):
                history["report_generation_ref"] = generation_ref
                history["report_generation_revision"] = new_revision

        # Artifact documents are rebuilt after every generation-bound field is
        # finalized.  A caller-provided/stale projection is never authoritative.
        run.pop("_artifact_documents", None)

        sync = run.get("source_sync")
        staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
        if isinstance(staging, Mapping) and staging.get("ref") == "__generation_staging__":
            staging_dir = generation_dir / "staging"
            staging_dir.mkdir()
            mutable_staging = copy.deepcopy(dict(staging))
            mutable_staging["ref"] = f"{generation_ref}/staging/source-update.json"
            mutable_staging["digest"] = digest(
                {key: value for key, value in mutable_staging.items() if key != "digest"}
            )
            mutable_sync = copy.deepcopy(dict(sync))
            mutable_sync["staging_artifact"] = mutable_staging
            mutable_sync["committed_revision"] = new_revision
            mutable_sync["manifest_digest"] = digest(
                {key: value for key, value in mutable_sync.items() if key != "manifest_digest"}
            )
            run["source_sync"] = mutable_sync
            self._write_json(staging_dir / "source-update.json", mutable_staging)

        pending_receipts = run.pop("_pending_artifact_receipts", [])
        if pending_receipts:
            receipt_dir = generation_dir / "receipts"
            receipt_dir.mkdir()
            for pending in pending_receipts:
                if not isinstance(pending, Mapping):
                    raise ValueError("pending artifact receipt must be an object")
                receipt_id = str(pending.get("receipt_id", ""))
                content = copy.deepcopy(pending.get("content"))
                receipt = next(
                    (
                        item
                        for item in run.get("implementation_log", [])
                        if item.get("kind") == "artifact_receipt"
                        and item.get("receipt_id") == receipt_id
                    ),
                    None,
                )
                if not receipt_id.startswith("receipt-") or not isinstance(receipt, dict):
                    raise ValueError("pending artifact receipt identity is invalid")
                if digest(content) != receipt.get("digest"):
                    raise ValueError("pending artifact receipt content digest is invalid")
                self._write_json(receipt_dir / f"{receipt_id}.json", content)
                receipt["ref"] = f"{generation_ref}/receipts/{receipt_id}.json"
                receipt["raw_content_persisted"] = True
        run["revision"] = new_revision
        completion = run.get("completion_report", {})
        completed = isinstance(completion, Mapping) and completion.get("complete") is True
        run["completion_report"] = canonical_completion_projection(
            run,
            generation_revision=new_revision if completed else None,
            complete=completed,
            gate="passed" if completed else "not_evaluated",
            reasons=[],
        )

        previous_trace_length = (
            len(current_state.get("state_trace", []))
            if isinstance(current_state, Mapping)
            and isinstance(current_state.get("state_trace"), list)
            else 0
        )
        reserved_states = set(run.get("execution_policy", {}).get("reserved_states", []))
        trace = run.get("state_trace", [])
        if not isinstance(trace, list) or previous_trace_length > len(trace):
            raise ValueError("state trace generation suffix is invalid")
        suffix = trace[previous_trace_length:]
        reserved_entries = [
            entry
            for entry in suffix
            if isinstance(entry, dict) and entry.get("state") in reserved_states
        ]
        if reserved_entries and (
            len(reserved_entries) != 1
            or not suffix
            or suffix[-1] is not reserved_entries[0]
            or run.get("state") != reserved_entries[0].get("state")
        ):
            raise ValueError(
                "reserved_trace_generation_evidence_invalid: a generation must end with its single reserved transition"
            )
        for entry in reserved_entries:
            entry["reserved_evidence"] = canonical_reserved_evidence(
                run,
                entry,
                new_revision,
                prior_run=current_state,
                registry=self.registry,
            )
            generation_errors = reserved_generation_evidence_errors(
                run,
                current_state,
                entry,
                entry["reserved_evidence"],
                registry=self.registry,
            )
            if generation_errors:
                raise ValueError(
                    "reserved_trace_generation_evidence_invalid: "
                    + generation_errors[0]
                )
            entry["evidence_digest"] = digest(
                {key: value for key, value in entry.items() if key != "evidence_digest"}
            )

        documents = canonical_artifact_documents(run)
        if len(documents) != 12:
            raise ValueError("exactly twelve artifact documents are required for a commit")

        receipt_artifacts = [
            {
                "receipt_id": item.get("receipt_id"),
                "ref": item.get("ref"),
                "digest": item.get("digest"),
                "authority_grant_digest": item.get("authority_grant_digest"),
            }
            for item in run.get("implementation_log", [])
            if item.get("kind") == "artifact_receipt"
            and item.get("raw_content_persisted") is True
        ]

        artifact_dir = generation_dir / "artifacts"
        artifact_dir.mkdir()
        references: list[dict[str, Any]] = []
        artifact_digests: dict[str, str] = {}
        for name in sorted(documents):
            document = copy.deepcopy(documents[name])
            path = artifact_dir / f"{name}.json"
            self._write_json(path, document)
            document_digest = digest(document)
            artifact_digests[name] = document_digest
            references.append(
                {
                    "name": name,
                    "path": f"{generation_ref}/artifacts/{name}.json",
                    "digest": document_digest,
                    "provenance": {
                        "producer": "team_harness.orchestrator",
                        "run_id": run_id,
                        "contract_digest": run["contract_digest"],
                        "revision": new_revision,
                    },
                }
            )

        run["artifacts"] = references
        run["integrity_status"] = "verified"
        run.pop("integrity_errors", None)
        state_document = copy.deepcopy(run)
        self._write_json(generation_dir / "run-state.json", state_document)
        state_digest = digest(state_document)
        trace_digest = digest(state_document.get("state_trace", []))
        manifest = {
            "schema_version": "1.0",
            "run_id": run_id,
            "revision": new_revision,
            "generation_ref": generation_ref,
            "parent_generation_ref": (
                current_manifest.get("generation_ref")
                if current_manifest is not None
                else None
            ),
            "parent_manifest_digest": (
                current_manifest.get("manifest_digest")
                if current_manifest is not None
                else None
            ),
            "parent_state_ref": (
                current_manifest.get("state_ref")
                if current_manifest is not None
                else None
            ),
            "parent_state_digest": (
                current_manifest.get("state_digest")
                if current_manifest is not None
                else None
            ),
            "parent_artifact_refs": (
                copy.deepcopy(current_state.get("artifacts", []))
                if current_state is not None
                else None
            ),
            "state_ref": f"{generation_ref}/run-state.json",
            "state_digest": state_digest,
            "trace_digest": trace_digest,
            "artifact_digests": artifact_digests,
            "receipt_artifacts": receipt_artifacts,
            "staging_artifact": (
                {
                    "ref": run["source_sync"]["staging_artifact"]["ref"],
                    "digest": run["source_sync"]["staging_artifact"]["digest"],
                }
                if isinstance(run.get("source_sync"), Mapping)
                and isinstance(run["source_sync"].get("staging_artifact"), Mapping)
                else None
            ),
            "provenance": {
                "producer": "team_harness.storage",
                "run_id": run_id,
                "contract_digest": run["contract_digest"],
            },
        }
        manifest["manifest_digest"] = digest(manifest)
        self._write_json(generation_dir / "commit-manifest.json", manifest)
        # The generation and all directory entries it depends on must be
        # durable before the root commit pointer can make it visible.
        self._fsync_directory(artifact_dir)
        receipt_dir = generation_dir / "receipts"
        if receipt_dir.is_dir():
            self._fsync_directory(receipt_dir)
        staging_dir = generation_dir / "staging"
        if staging_dir.is_dir():
            self._fsync_directory(staging_dir)
        self._fsync_directory(generation_dir)
        self._fsync_directory(generations)
        self._fsync_directory(run_dir)
        if crash_at == "before_commit_manifest_swap":
            raise RuntimeError("simulated crash before commit manifest swap")
        self._atomic_json(run_dir / "commit-manifest.json", manifest)
        anchor = self._next_anchor(current_anchor, manifest)
        self._atomic_json(run_dir / "commit-anchor.json", anchor)

    def _load_locked(self, run_id: str) -> dict[str, Any] | None:
        run_dir = self._run_dir(run_id)
        try:
            manifest = self._read_manifest(run_dir)
        except (OSError, json.JSONDecodeError, ValueError):
            return self._integrity_failure(run_id, 0, ["commit manifest integrity failure"])
        if manifest is None:
            return None
        manifest_schema_errors = validate_document("commit_manifest", manifest)
        if manifest_schema_errors:
            revision = manifest.get("revision")
            safe_revision = (
                revision
                if isinstance(revision, int) and not isinstance(revision, bool)
                else 0
            )
            return self._integrity_failure(
                run_id,
                safe_revision,
                [
                    "commit_manifest_schema_invalid",
                    *(
                        f"commit manifest schema integrity failure: {message}"
                        for message in manifest_schema_errors
                    ),
                ],
            )
        errors: list[str] = []
        try:
            anchor = self._read_anchor(run_dir)
        except (OSError, json.JSONDecodeError, ValueError):
            anchor = None
            errors.append("commit anchor integrity failure")
        anchor_errors, anchor, anchor_recovery = self._check_anchor(
            run_dir, manifest, anchor
        )
        errors.extend(anchor_errors)
        expected_manifest_digest = manifest.get("manifest_digest")
        unsigned_manifest = {key: value for key, value in manifest.items() if key != "manifest_digest"}
        if expected_manifest_digest != digest(unsigned_manifest):
            errors.append("commit manifest integrity mismatch")
        state_path = self._contained_path(run_dir, manifest.get("state_ref"))
        if state_path is None:
            return self._integrity_failure(
                run_id, int(manifest.get("revision", 0)), ["run state reference escapes run directory"]
            )
        try:
            state = json.loads(state_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return self._integrity_failure(run_id, int(manifest.get("revision", 0)), ["run state integrity failure"])
        if not isinstance(state, dict):
            return self._integrity_failure(
                run_id,
                int(manifest.get("revision", 0)),
                ["run state schema integrity failure: top-level object required"],
            )
        state_schema_errors = validate_document("run_state", state)
        errors.extend(
            f"run state schema integrity failure: {message}"
            for message in state_schema_errors
        )
        if state_schema_errors:
            state["integrity_status"] = "failed"
            state["integrity_errors"] = errors
            state["state"] = "blocked"
            return state
        chain, chain_errors = self._load_generation_chain(run_dir, manifest)
        errors.extend(chain_errors)
        try:
            semantic_errors = validate_run_state_semantics(
                state,
                registry=self.registry,
                current_policy=self.policy,
            )
        except Exception:
            semantic_errors = ["run state semantic validation failed safely"]
        errors.extend(semantic_errors)
        errors.extend(self._validate_historical_bindings(state, chain))
        if digest(state) != manifest.get("state_digest"):
            errors.append("run state integrity mismatch")
        if digest(state.get("state_trace", [])) != manifest.get("trace_digest"):
            errors.append("state trace integrity mismatch")
        if state.get("run_id") != run_id or state.get("revision") != manifest.get("revision"):
            errors.append("run identity or revision integrity mismatch")
        provenance = manifest.get("provenance", {})
        if provenance.get("run_id") != run_id or provenance.get("contract_digest") != state.get("contract_digest"):
            errors.append("commit provenance integrity mismatch")
        contract = state.get("task_contract", {})
        contract_digest = contract.get("digest") if isinstance(contract, Mapping) else None
        if contract_digest != state.get("contract_digest"):
            errors.append("task contract integrity mismatch")
        elif isinstance(contract, Mapping):
            unsigned_contract = {key: value for key, value in contract.items() if key != "digest"}
            if digest(unsigned_contract) != contract_digest:
                errors.append("task contract digest integrity mismatch")

        sync = state.get("source_sync")
        staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
        manifest_staging = manifest.get("staging_artifact")
        if isinstance(staging, Mapping):
            staging_path = self._contained_path(run_dir, staging.get("ref"))
            if staging_path is None:
                errors.append("staging artifact reference escapes run directory")
            else:
                try:
                    staging_document = json.loads(staging_path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    errors.append("staging artifact integrity failure")
                else:
                    unsigned_staging = {
                        key: value for key, value in staging_document.items() if key != "digest"
                    }
                    actual_staging_digest = digest(unsigned_staging)
                    if (
                        staging_document != staging
                        or staging_document.get("digest") != actual_staging_digest
                        or staging.get("digest") != actual_staging_digest
                    ):
                        errors.append("staging artifact content digest integrity mismatch")
            if manifest_staging != {
                "ref": staging.get("ref"),
                "digest": staging.get("digest"),
            }:
                errors.append("staging artifact commit manifest integrity mismatch")
            unsigned_sync = {key: value for key, value in sync.items() if key != "manifest_digest"}
            if sync.get("manifest_digest") != digest(unsigned_sync):
                errors.append("source update manifest integrity mismatch")
        elif manifest_staging is not None:
            errors.append("staging artifact commit manifest integrity mismatch")

        receipt_manifest = manifest.get("receipt_artifacts")
        persisted_receipts = [
            item
            for item in state.get("implementation_log", [])
            if isinstance(item, Mapping) and item.get("kind") == "artifact_receipt"
        ]
        expected_receipts = [
            {
                "receipt_id": item.get("receipt_id"),
                "ref": item.get("ref"),
                "digest": item.get("digest"),
                "authority_grant_digest": item.get("authority_grant_digest"),
            }
            for item in persisted_receipts
        ]
        if not isinstance(receipt_manifest, list) or receipt_manifest != expected_receipts:
            errors.append("artifact receipt commit manifest integrity mismatch")
        else:
            for receipt, reference in zip(persisted_receipts, receipt_manifest):
                receipt_id = str(receipt.get("receipt_id", ""))
                path = self._contained_path(run_dir, reference.get("ref"))
                if path is None:
                    errors.append(
                        f"artifact receipt reference escapes run directory: {receipt_id}"
                    )
                    continue
                try:
                    content = json.loads(path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    errors.append(f"artifact receipt integrity failure: {receipt_id}")
                    continue
                if (
                    receipt.get("raw_content_persisted") is not True
                    or digest(content) != receipt.get("digest")
                    or receipt.get("digest") != reference.get("digest")
                ):
                    errors.append(
                        f"artifact receipt content digest integrity mismatch: {receipt_id}"
                    )

        expected_artifacts = manifest.get("artifact_digests", {})
        references = state.get("artifacts", [])
        if not isinstance(references, list) or len(references) != 12:
            errors.append("artifact manifest integrity mismatch")
        else:
            for reference in references:
                name = str(reference.get("name", ""))
                path = self._contained_path(run_dir, reference.get("path"))
                if path is None:
                    errors.append(f"artifact reference escapes run directory: {name}")
                    continue
                try:
                    document = json.loads(path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    errors.append(f"artifact integrity failure: {name}")
                    continue
                actual = digest(document)
                if actual != reference.get("digest") or actual != expected_artifacts.get(name):
                    errors.append(f"artifact digest integrity mismatch: {name}")
                ref_provenance = reference.get("provenance", {})
                if (
                    ref_provenance.get("producer") != "team_harness.orchestrator"
                    or ref_provenance.get("run_id") != run_id
                    or ref_provenance.get("contract_digest") != state.get("contract_digest")
                    or ref_provenance.get("revision") != state.get("revision")
                ):
                    errors.append(f"artifact provenance integrity mismatch: {name}")
        if errors:
            state["integrity_status"] = "failed"
            state["integrity_errors"] = errors
            state["state"] = "blocked"
        else:
            if anchor_recovery:
                recovered_anchor = self._next_anchor(anchor, manifest)
                self._atomic_json(run_dir / "commit-anchor.json", recovered_anchor)
            state["integrity_status"] = "verified"
            state.pop("integrity_errors", None)
        return state

    @staticmethod
    def _next_anchor(
        current: Mapping[str, Any] | None,
        manifest: Mapping[str, Any],
    ) -> dict[str, Any]:
        entries = (
            copy.deepcopy(list(current.get("entries", [])))
            if isinstance(current, Mapping)
            else []
        )
        entries.append(
            {
                "revision": manifest.get("revision"),
                "generation_ref": manifest.get("generation_ref"),
                "manifest_digest": manifest.get("manifest_digest"),
                "parent_manifest_digest": manifest.get("parent_manifest_digest"),
            }
        )
        anchor = {
            "schema_version": "1.0",
            "run_id": manifest.get("run_id"),
            "entries": entries,
            "high_revision": manifest.get("revision"),
            "high_generation_ref": manifest.get("generation_ref"),
            "high_manifest_digest": manifest.get("manifest_digest"),
        }
        anchor["anchor_digest"] = digest(anchor)
        return anchor

    def _check_anchor(
        self,
        run_dir: Path,
        manifest: Mapping[str, Any],
        anchor: Mapping[str, Any] | None,
    ) -> tuple[list[str], Mapping[str, Any] | None, bool]:
        errors: list[str] = []
        if not isinstance(anchor, Mapping):
            return ["commit anchor is missing"], anchor, False
        anchor_schema_errors = validate_document("commit_anchor", anchor)
        errors.extend(
            f"commit anchor schema integrity failure: {message}"
            for message in anchor_schema_errors
        )
        if anchor_schema_errors:
            return errors, anchor, False
        unsigned = {key: value for key, value in anchor.items() if key != "anchor_digest"}
        if anchor.get("anchor_digest") != digest(unsigned):
            errors.append("commit anchor digest mismatch")
        if anchor.get("run_id") != manifest.get("run_id"):
            errors.append("commit anchor run binding mismatch")
        entries = anchor.get("entries")
        if not isinstance(entries, list) or not entries:
            errors.append("commit anchor ledger is empty")
            return errors, anchor, False
        previous_digest: Any = None
        for revision, entry in enumerate(entries, start=1):
            if not isinstance(entry, Mapping) or (
                entry.get("revision") != revision
                or entry.get("parent_manifest_digest") != previous_digest
                or not isinstance(entry.get("generation_ref"), str)
                or not isinstance(entry.get("manifest_digest"), str)
            ):
                errors.append("commit anchor ledger is not a contiguous forward chain")
                break
            previous_digest = entry.get("manifest_digest")
        latest = entries[-1] if isinstance(entries[-1], Mapping) else {}
        if (
            anchor.get("high_revision") != latest.get("revision")
            or anchor.get("high_generation_ref") != latest.get("generation_ref")
            or anchor.get("high_manifest_digest") != latest.get("manifest_digest")
        ):
            errors.append("commit anchor high-watermark projection is invalid")
        root_revision = manifest.get("revision")
        high_revision = anchor.get("high_revision")
        if isinstance(root_revision, int) and isinstance(high_revision, int):
            if root_revision < high_revision:
                errors.append("commit_root_rollback_detected: commit root pointer rollback detected")
            elif root_revision == high_revision:
                if (
                    manifest.get("generation_ref") != anchor.get("high_generation_ref")
                    or manifest.get("manifest_digest")
                    != anchor.get("high_manifest_digest")
                ):
                    errors.append("commit root pointer differs from high-watermark")
            elif root_revision == high_revision + 1 and (
                manifest.get("parent_manifest_digest")
                == anchor.get("high_manifest_digest")
            ):
                return errors, anchor, not errors
            else:
                errors.append(
                    "commit_anchor_rollback_detected: commit root pointer is not the next anchored child"
                )
        else:
            errors.append("commit anchor revision binding is invalid")
        return errors, anchor, False

    def _load_generation_chain(
        self,
        run_dir: Path,
        root_manifest: Mapping[str, Any],
    ) -> tuple[
        list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]],
        list[str],
    ]:
        """Follow the committed parent chain and validate every durable snapshot."""

        errors: list[str] = []
        reverse_chain: list[
            tuple[dict[str, Any], dict[str, Any], dict[str, Any]]
        ] = []
        cursor = copy.deepcopy(dict(root_manifest))
        visited: set[str] = set()
        while True:
            generation_ref = cursor.get("generation_ref")
            revision = cursor.get("revision")
            cursor_schema_errors = validate_document("commit_manifest", cursor)
            if cursor_schema_errors:
                errors.append("commit_manifest_schema_invalid")
                errors.extend(
                    f"generation {revision} commit schema integrity failure: {message}"
                    for message in cursor_schema_errors
                )
                break
            if not isinstance(generation_ref, str) or generation_ref in visited:
                errors.append("generation chain reference is invalid or cyclic")
                break
            visited.add(generation_ref)
            unsigned_manifest = {
                key: value for key, value in cursor.items() if key != "manifest_digest"
            }
            if cursor.get("manifest_digest") != digest(unsigned_manifest):
                errors.append(f"generation {revision} manifest digest mismatch")

            generation_dir = self._contained_path(run_dir, generation_ref)
            if generation_dir is None:
                errors.append(f"generation {revision} reference escapes run directory")
                break
            manifest_path = generation_dir / "commit-manifest.json"
            try:
                generation_manifest = json.loads(
                    manifest_path.read_text(encoding="utf-8")
                )
            except (OSError, json.JSONDecodeError):
                errors.append(f"generation {revision} manifest is unreadable")
                break
            if generation_manifest != cursor:
                errors.append(f"generation {revision} root and durable manifests differ")

            state_path = self._contained_path(run_dir, cursor.get("state_ref"))
            if state_path is None:
                errors.append(f"generation {revision} state reference escapes run directory")
                break
            try:
                state = json.loads(state_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                errors.append(f"generation {revision} state is unreadable")
                break
            if not isinstance(state, dict):
                errors.append(f"generation {revision} state must be an object")
                break
            generation_state_schema_errors = validate_document("run_state", state)
            errors.extend(
                f"generation {revision} state schema integrity failure: {message}"
                for message in generation_state_schema_errors
            )
            if generation_state_schema_errors:
                reverse_chain.append((cursor, state, {}))
                break
            try:
                generation_semantic_errors = validate_run_state_semantics(
                    state,
                    registry=self.registry,
                    current_policy=self.policy,
                )
            except Exception:
                generation_semantic_errors = [
                    "run state semantic validation failed safely"
                ]
            errors.extend(
                f"generation {revision} {message}"
                for message in generation_semantic_errors
            )
            if (
                state.get("run_id") != cursor.get("run_id")
                or state.get("revision") != revision
                or digest(state) != cursor.get("state_digest")
                or digest(state.get("state_trace", [])) != cursor.get("trace_digest")
            ):
                errors.append(f"generation {revision} state binding mismatch")

            artifact_documents: dict[str, Any] = {}
            artifact_digests = cursor.get("artifact_digests")
            references = state.get("artifacts")
            if not isinstance(artifact_digests, Mapping) or not isinstance(
                references, list
            ):
                errors.append(f"generation {revision} artifact manifest is invalid")
            else:
                for reference in references:
                    if not isinstance(reference, Mapping):
                        errors.append(
                            f"generation {revision} artifact reference is invalid"
                        )
                        continue
                    name = str(reference.get("name", ""))
                    artifact_path = self._contained_path(
                        run_dir, reference.get("path")
                    )
                    if artifact_path is None:
                        errors.append(
                            f"generation {revision} artifact reference escapes run directory: {name}"
                        )
                        continue
                    try:
                        document = json.loads(
                            artifact_path.read_text(encoding="utf-8")
                        )
                    except (OSError, json.JSONDecodeError):
                        errors.append(
                            f"generation {revision} artifact is unreadable: {name}"
                        )
                        continue
                    actual_digest = digest(document)
                    if (
                        actual_digest != reference.get("digest")
                        or actual_digest != artifact_digests.get(name)
                    ):
                        errors.append(
                            f"generation {revision} artifact digest mismatch: {name}"
                        )
                    artifact_documents[name] = document
                if set(artifact_documents) != set(canonical_artifact_documents(state)):
                    errors.append(
                        f"generation {revision} artifact manifest names are not canonical"
                    )
                if set(artifact_digests) != set(artifact_documents):
                    errors.append(
                        f"generation {revision} artifact digest manifest is not exact"
                    )
                expected_documents = canonical_artifact_documents(state)
                for name, expected in expected_documents.items():
                    if artifact_documents.get(name) != expected:
                        errors.append(
                            f"generation {revision} artifact content is not the canonical Run State projection: {name}"
                        )
            reverse_chain.append((cursor, state, artifact_documents))

            parent_fields = (
                "parent_generation_ref",
                "parent_manifest_digest",
                "parent_state_ref",
                "parent_state_digest",
                "parent_artifact_refs",
            )
            if revision == 1:
                if any(cursor.get(field, "missing") is not None for field in parent_fields):
                    errors.append("first generation parent bindings must all be null")
                break
            if not isinstance(revision, int) or revision < 1:
                errors.append("generation chain revision is invalid")
                break
            parent_ref = cursor.get("parent_generation_ref")
            parent_dir = self._contained_path(run_dir, parent_ref)
            if parent_dir is None:
                errors.append(f"generation {revision} parent reference is invalid")
                break
            try:
                parent_manifest = json.loads(
                    (parent_dir / "commit-manifest.json").read_text(encoding="utf-8")
                )
            except (OSError, json.JSONDecodeError):
                errors.append(f"generation {revision} parent manifest is unreadable")
                break
            if not isinstance(parent_manifest, dict):
                errors.append(f"generation {revision} parent manifest must be an object")
                break
            parent_schema_errors = validate_document("commit_manifest", parent_manifest)
            if parent_schema_errors:
                errors.append("commit_manifest_schema_invalid")
                errors.extend(
                    f"generation {parent_manifest.get('revision')} commit schema integrity failure: {message}"
                    for message in parent_schema_errors
                )
                break
            parent_state_path = self._contained_path(
                run_dir, parent_manifest.get("state_ref")
            )
            try:
                parent_state = (
                    json.loads(parent_state_path.read_text(encoding="utf-8"))
                    if parent_state_path is not None
                    else None
                )
            except (OSError, json.JSONDecodeError):
                parent_state = None
            expected_parent_artifacts = (
                parent_state.get("artifacts")
                if isinstance(parent_state, Mapping)
                else None
            )
            if (
                parent_manifest.get("revision") != revision - 1
                or cursor.get("parent_manifest_digest")
                != parent_manifest.get("manifest_digest")
                or cursor.get("parent_state_ref") != parent_manifest.get("state_ref")
                or cursor.get("parent_state_digest")
                != parent_manifest.get("state_digest")
                or cursor.get("parent_artifact_refs") != expected_parent_artifacts
            ):
                errors.append(f"generation {revision} parent bindings are not exact")
            cursor = parent_manifest

        chain = list(reversed(reverse_chain))
        if chain:
            revisions = [item[0].get("revision") for item in chain]
            if revisions != list(range(1, len(chain) + 1)):
                errors.append("generation chain revisions are not a contiguous monotonic sequence")
            immutable_fields = (
                "run_id",
                "idempotency_key",
                "contract_digest",
                "task_contract",
                "role_assignments",
                "role_assignments_digest",
                "start_request",
                "start_request_digest",
                "execution_policy",
                "registry_binding",
            )
            append_only_fields = (
                "state_trace",
                "findings",
                "failure_history",
                "implementation_log",
                "improvement_proposals",
                "rejections",
                "blockers",
                "conflicts",
            )
            for (_, previous, _), (manifest, current, _) in zip(chain, chain[1:]):
                for field in immutable_fields:
                    if current.get(field) != previous.get(field):
                        errors.append(
                            f"generation {manifest.get('revision')} rewrites immutable {field}"
                        )
                for field in append_only_fields:
                    before = previous.get(field)
                    after = current.get(field)
                    if not isinstance(before, list) or not isinstance(after, list) or (
                        after[: len(before)] != before
                    ):
                        errors.append(
                            f"generation {manifest.get('revision')} rewrites append-only {field}"
                        )
            for (previous_manifest, _, _), (current_manifest, _, _) in zip(
                chain, chain[1:]
            ):
                previous_receipts = previous_manifest.get("receipt_artifacts")
                current_receipts = current_manifest.get("receipt_artifacts")
                if (
                    not isinstance(previous_receipts, list)
                    or not isinstance(current_receipts, list)
                    or current_receipts[: len(previous_receipts)] != previous_receipts
                ):
                    errors.append(
                        f"generation {current_manifest.get('revision')} rewrites append-only artifact receipts"
                    )
            errors.extend(self._validate_generation_receipts(run_dir, chain))
            errors.extend(self._validate_generation_staging(run_dir, chain))
            errors.extend(self._validate_generation_reserved_evidence(chain))
        return chain, errors

    def _validate_generation_receipts(
        self,
        run_dir: Path,
        chain: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]],
    ) -> list[str]:
        """Reproject issued receipt metadata from raw content and prior grants."""

        errors: list[str] = []
        previous_state: Mapping[str, Any] | None = None
        previous_ids: set[str] = set()
        for manifest, state, _ in chain:
            log = state.get("implementation_log", [])
            receipts = [
                item
                for item in log
                if isinstance(item, Mapping)
                and item.get("kind") == "artifact_receipt"
            ]
            expected_manifest_records = [
                {
                    "receipt_id": item.get("receipt_id"),
                    "ref": item.get("ref"),
                    "digest": item.get("digest"),
                    "authority_grant_digest": item.get("authority_grant_digest"),
                }
                for item in receipts
            ]
            if manifest.get("receipt_artifacts") != expected_manifest_records:
                errors.append(
                    f"generation {manifest.get('revision')} receipt manifest is not canonical"
                )
            introduced_ordinal = 0
            for log_index, item in enumerate(log, start=1):
                if not isinstance(item, Mapping) or item.get("kind") != "artifact_receipt":
                    continue
                receipt_id = str(item.get("receipt_id", ""))
                receipt_path = self._contained_path(run_dir, item.get("ref"))
                if receipt_path is None:
                    errors.append(
                        f"generation {manifest.get('revision')} receipt reference escapes run directory"
                    )
                    continue
                try:
                    content = json.loads(receipt_path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    errors.append(
                        f"generation {manifest.get('revision')} receipt raw content is unreadable"
                    )
                    continue
                if receipt_id in previous_ids:
                    if digest(content) != item.get("digest"):
                        errors.append(
                            f"generation {manifest.get('revision')} carried receipt content digest is invalid"
                        )
                    continue
                introduced_ordinal += 1
                actor = str(item.get("provenance", {}).get("producer", ""))
                parent_grant = (
                    previous_state.get("authority_grants", {})
                    .get("write", {})
                    .get(actor)
                    if isinstance(previous_state, Mapping)
                    else None
                )
                parent_artifact_revision = (
                    previous_state.get("artifact_revision")
                    if isinstance(previous_state, Mapping)
                    else None
                )
                parent_plan_revision = (
                    previous_state.get("shared_plan", {}).get("revision")
                    if isinstance(previous_state, Mapping)
                    else None
                )
                if not self._receipt_path_is_in_scope(
                    state=state,
                    prior_state=previous_state,
                    receipt=item,
                    actor=actor,
                ):
                    errors.append(
                        "receipt_path_scope_invalid: persisted receipt path exceeds its prior grant, Task Contract, ownership, or Registry scope"
                    )
                expected_id = "receipt-" + digest(
                    {
                        "run_id": state.get("run_id"),
                        "actor": actor,
                        "path": item.get("path"),
                        "content": content,
                        "artifact_revision": (
                            int(parent_artifact_revision) + introduced_ordinal - 1
                            if isinstance(parent_artifact_revision, int)
                            else None
                        ),
                        "sequence": log_index,
                    }
                )[-20:]
                expected = {
                    "receipt_id": expected_id,
                    "kind": "artifact_receipt",
                    "path": item.get("path"),
                    "ref": f"{manifest.get('generation_ref')}/receipts/{expected_id}.json",
                    "digest": digest(content),
                    "raw_content_persisted": True,
                    "authority_grant_digest": (
                        parent_grant.get("grant_digest")
                        if isinstance(parent_grant, Mapping)
                        else None
                    ),
                    "issued_by": "team_harness",
                    "issue_ids": (
                        list(content.get("issue_ids", []))
                        if isinstance(content, Mapping)
                        else None
                    ),
                    "check_ids": (
                        list(content.get("check_ids", []))
                        if isinstance(content, Mapping)
                        else None
                    ),
                    "deliverable_ids": (
                        list(content.get("deliverable_ids", []))
                        if isinstance(content, Mapping)
                        else None
                    ),
                    "provenance": {
                        "producer": actor,
                        "run_id": state.get("run_id"),
                        "contract_digest": state.get("contract_digest"),
                        "plan_revision": parent_plan_revision,
                    },
                }
                if (
                    not isinstance(content, Mapping)
                    or not isinstance(parent_grant, Mapping)
                    or dict(item) != expected
                ):
                    errors.append(
                        f"generation {manifest.get('revision')} receipt metadata is not the canonical raw/grant projection"
                    )
            previous_state = state
            previous_ids = {str(item.get("receipt_id")) for item in receipts}
        return errors

    def _receipt_path_is_in_scope(
        self,
        *,
        state: Mapping[str, Any],
        prior_state: Mapping[str, Any] | None,
        receipt: Mapping[str, Any],
        actor: str,
    ) -> bool:
        if not isinstance(prior_state, Mapping):
            return False
        raw_path = receipt.get("path")
        try:
            path = normalize_path(str(raw_path))
        except ValueError:
            return False
        if path != raw_path or forbidden_path(path):
            return False
        contract = prior_state.get("task_contract", {})
        if not isinstance(contract, Mapping):
            return False
        allowed = {str(item) for item in contract.get("allowed_paths", [])}
        scope = contract.get("scope", {})
        included = (
            {str(item) for item in scope.get("include", [])}
            if isinstance(scope, Mapping)
            else set()
        )
        excluded = (
            [str(item) for item in scope.get("exclude", [])]
            if isinstance(scope, Mapping)
            else []
        )
        forbidden = [str(item) for item in contract.get("forbidden_paths", [])]
        ownership = next(
            (
                item
                for item in prior_state.get("write_ownership", [])
                if isinstance(item, Mapping) and str(item.get("owner")) == actor
            ),
            None,
        )
        grant = (
            prior_state.get("authority_grants", {}).get("write", {}).get(actor)
            if isinstance(prior_state.get("authority_grants"), Mapping)
            else None
        )
        registry_agent = (
            next(
                (
                    item
                    for item in self.registry.get("agents", [])
                    if isinstance(item, Mapping)
                    and str(item.get("id")) == actor
                    and "writer" in item.get("roles", [])
                ),
                None,
            )
            if isinstance(self.registry, Mapping)
            else None
        )
        policy = prior_state.get("execution_policy", {})
        write_states = (
            set(policy.get("write_authorization", {}).get("allowed_states", []))
            if isinstance(policy, Mapping)
            else set()
        )
        team_writer = next(
            (
                str(item.get("id"))
                for item in prior_state.get("team", [])
                if isinstance(item, Mapping) and item.get("role") == "writer"
            ),
            None,
        )
        provenance = receipt.get("provenance")
        unsigned_grant = (
            {key: value for key, value in grant.items() if key != "grant_digest"}
            if isinstance(grant, Mapping)
            else {}
        )
        return bool(
            state.get("contract_digest") == prior_state.get("contract_digest")
            and prior_state.get("state") in write_states
            and actor == prior_state.get("selection", {}).get("writer")
            and actor == team_writer
            and path in allowed
            and path in included
            and not any(path_matches_scope(path, [pattern]) for pattern in excluded)
            and not any(path_matches_scope(path, [pattern]) for pattern in forbidden)
            and isinstance(ownership, Mapping)
            and path in {str(item) for item in ownership.get("paths", [])}
            and isinstance(grant, Mapping)
            and grant.get("kind") == "write"
            and grant.get("run_id") == prior_state.get("run_id")
            and grant.get("agent") == actor
            and grant.get("issued_by") == "team_harness"
            and grant.get("ownership_revision")
            == prior_state.get("ownership_revision")
            and grant.get("epoch") == prior_state.get("lease_epoch")
            and isinstance(grant.get("issued_revision"), int)
            and int(grant.get("issued_revision", 0))
            <= int(prior_state.get("revision", 0))
            and grant.get("grant_digest") == digest(unsigned_grant)
            and path in {str(item) for item in grant.get("paths", [])}
            and receipt.get("authority_grant_digest") == grant.get("grant_digest")
            and isinstance(provenance, Mapping)
            and provenance.get("producer") == actor
            and provenance.get("run_id") == prior_state.get("run_id")
            and provenance.get("contract_digest")
            == prior_state.get("contract_digest")
            and provenance.get("plan_revision")
            == prior_state.get("shared_plan", {}).get("revision")
            and isinstance(registry_agent, Mapping)
            and path_matches_scope(
                path, [str(item) for item in registry_agent.get("path_scopes", [])]
            )
        )

    def _validate_generation_staging(
        self,
        run_dir: Path,
        chain: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]],
    ) -> list[str]:
        """Validate source introduction, exact carry, files, and report binding."""

        errors: list[str] = []
        previous_sync: Mapping[str, Any] | None = None
        previous_state: Mapping[str, Any] | None = None
        source_basis_fields = (
            "contract_digest",
            "task_contract",
            "artifact_revision",
            "current_artifact_digest",
            "initial_verification_report",
            "initial_review_report",
            "implementation_approval",
        )
        final_report_fields = (
            "final_verification_report",
            "final_review_report",
        )
        for manifest, state, _ in chain:
            sync = state.get("source_sync", {})
            staging = sync.get("staging_artifact") if isinstance(sync, Mapping) else None
            manifest_staging = manifest.get("staging_artifact")
            accepted = (
                isinstance(sync, Mapping)
                and sync.get("accepted") is True
                and sync.get("staged") is True
                and isinstance(staging, Mapping)
            )
            previously_accepted = (
                isinstance(previous_sync, Mapping)
                and previous_sync.get("accepted") is True
                and previous_sync.get("staged") is True
                and isinstance(previous_sync.get("staging_artifact"), Mapping)
            )
            if (
                isinstance(sync, Mapping)
                and sync.get("accepted") is not True
                and dict(sync) != canonical_inactive_source_projection(state)
            ):
                errors.append(
                    "completion_source_binding_invalid: historical inactive source projection is not canonical"
                )
            if accepted:
                errors.extend(accepted_shadow_source_projection_errors(state))
            if not isinstance(staging, Mapping):
                if manifest_staging is not None:
                    errors.append(
                        f"generation {manifest.get('revision')} historical staging manifest is unexpected"
                    )
                previous_sync = copy.deepcopy(dict(sync)) if isinstance(sync, Mapping) else None
                previous_state = copy.deepcopy(state)
                continue
            path = self._contained_path(run_dir, staging.get("ref"))
            if path is None:
                errors.append(
                    f"generation {manifest.get('revision')} historical staging reference escapes run directory"
                )
                previous_sync = copy.deepcopy(dict(sync)) if isinstance(sync, Mapping) else None
                previous_state = copy.deepcopy(state)
                continue
            try:
                document = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                errors.append(
                    f"generation {manifest.get('revision')} historical staging file is unreadable"
                )
                previous_sync = copy.deepcopy(dict(sync)) if isinstance(sync, Mapping) else None
                previous_state = copy.deepcopy(state)
                continue
            unsigned_staging = {
                key: value for key, value in document.items() if key != "digest"
            } if isinstance(document, Mapping) else {}
            if (
                document != staging
                or staging.get("digest") != digest(unsigned_staging)
                or manifest_staging
                != {"ref": staging.get("ref"), "digest": staging.get("digest")}
                or sync.get("manifest_digest")
                != digest(
                    {key: value for key, value in sync.items() if key != "manifest_digest"}
                )
            ):
                errors.append(
                    f"generation {manifest.get('revision')} historical staging content binding is invalid"
                )
            if accepted and not previously_accepted:
                generation_dir = self._contained_path(
                    run_dir, manifest.get("generation_ref")
                )
                provenance = staging.get("provenance")
                target_identity = staging.get("target_identity")
                ref_is_introduced_here = False
                if generation_dir is not None:
                    try:
                        path.relative_to(generation_dir)
                    except ValueError:
                        pass
                    else:
                        ref_is_introduced_here = True
                if (
                    sync.get("committed_revision") != manifest.get("revision")
                    or not ref_is_introduced_here
                    or sync.get("run_id") != state.get("run_id")
                    or sync.get("contract_digest") != state.get("contract_digest")
                    or sync.get("artifact_revision") != state.get("artifact_revision")
                    or sync.get("source_artifact_digest")
                    != state.get("current_artifact_digest")
                    or not isinstance(provenance, Mapping)
                    or provenance.get("producer") != "team_harness.orchestrator"
                    or provenance.get("run_id") != state.get("run_id")
                    or provenance.get("contract_digest")
                    != state.get("contract_digest")
                    or provenance.get("artifact_revision")
                    != state.get("artifact_revision")
                    or provenance.get("artifact_digest")
                    != state.get("current_artifact_digest")
                    or not isinstance(target_identity, Mapping)
                    or set(target_identity) != {"system", "catalog"}
                    or any(
                        not isinstance(value, str) or not value
                        for value in target_identity.values()
                    )
                ):
                    errors.append(
                        "completion_source_binding_invalid: source staging first introduction is not bound to its generation, artifact, provenance, and closed target identity"
                    )
                if not isinstance(previous_state, Mapping) or any(
                    state.get(field) != previous_state.get(field)
                    for field in (*source_basis_fields, *final_report_fields)
                ):
                    errors.append(
                        "completion_source_binding_invalid: source introduction does not exactly carry its approved Task Contract, artifact, approval, and report basis"
                    )
            elif accepted and previously_accepted and sync != previous_sync:
                errors.append(
                    "completion_source_binding_invalid: carried source staging differs from its introducing generation"
                )
            if accepted:
                provenance = staging.get("provenance")
                if (
                    sync.get("run_id") != state.get("run_id")
                    or sync.get("contract_digest") != state.get("contract_digest")
                    or sync.get("artifact_revision") != state.get("artifact_revision")
                    or sync.get("source_artifact_digest")
                    != state.get("current_artifact_digest")
                    or not isinstance(provenance, Mapping)
                    or provenance.get("run_id") != state.get("run_id")
                    or provenance.get("contract_digest")
                    != state.get("contract_digest")
                    or provenance.get("artifact_revision")
                    != state.get("artifact_revision")
                    or provenance.get("artifact_digest")
                    != state.get("current_artifact_digest")
                ):
                    errors.append(
                        "completion_source_binding_invalid: accepted source does not carry its exact Task Contract and artifact basis"
                    )
                if previously_accepted and isinstance(previous_state, Mapping):
                    if any(
                        state.get(field) != previous_state.get(field)
                        for field in source_basis_fields
                    ):
                        errors.append(
                            "completion_source_binding_invalid: accepted source chain rewrites its initial report, approval, Task Contract, or artifact basis"
                        )
                    changed_final_reports = {
                        field
                        for field in final_report_fields
                        if state.get(field) != previous_state.get(field)
                    }
                    allowed_report_changes = {
                        "source_sync": set(),
                        "final_verification": {"final_verification_report"},
                        "final_review": {"final_review_report"},
                        "completed": set(),
                    }.get(str(state.get("state")))
                    if (
                        allowed_report_changes is not None
                        and not changed_final_reports.issubset(allowed_report_changes)
                    ):
                        errors.append(
                            "completion_source_binding_invalid: accepted source generation changes reports outside its state-specific allowance"
                        )
            for report_key in ("final_verification_report", "final_review_report"):
                report = state.get(report_key, {})
                if isinstance(report, Mapping) and report.get("status") != "not_run":
                    if (
                        report.get("staging_artifact_digest") != staging.get("digest")
                        or report.get("source_manifest_digest")
                        != sync.get("manifest_digest")
                        or report.get("source_revision") != sync.get("committed_revision")
                    ):
                        errors.append(
                            "completion_source_binding_invalid: "
                            f"generation {manifest.get('revision')} historical final report staging binding is invalid"
                        )
            completion = state.get("completion_report", {})
            if isinstance(completion, Mapping) and completion.get("complete") is True:
                if (
                    completion.get("source_artifact_digest")
                    != sync.get("source_artifact_digest")
                    or completion.get("source_manifest_digest")
                    != sync.get("manifest_digest")
                    or completion.get("staging_artifact_digest")
                    != staging.get("digest")
                ):
                    errors.append(
                        "completion_source_binding_invalid: completed evidence does not bind the current introduced source"
                    )
            previous_sync = copy.deepcopy(dict(sync)) if isinstance(sync, Mapping) else None
            previous_state = copy.deepcopy(state)
        return errors

    def _validate_generation_reserved_evidence(
        self,
        chain: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]],
    ) -> list[str]:
        """Replay each reserved transition against its introducing generation."""

        errors: list[str] = []
        previous_trace_length = 0
        previous_state: Mapping[str, Any] | None = None
        for manifest, state, _ in chain:
            trace = state.get("state_trace", [])
            policy = state.get("execution_policy", {})
            reserved = set(policy.get("reserved_states", [])) if isinstance(policy, Mapping) else set()
            if not isinstance(trace, list) or previous_trace_length > len(trace):
                errors.append(
                    "reserved_trace_generation_evidence_invalid: transition suffix is not append-only"
                )
                continue
            suffix = trace[previous_trace_length:]
            reserved_entries = [
                entry
                for entry in suffix
                if isinstance(entry, Mapping) and entry.get("state") in reserved
            ]
            if reserved_entries and (
                len(reserved_entries) != 1
                or not suffix
                or suffix[-1] is not reserved_entries[0]
                or state.get("state") != reserved_entries[0].get("state")
            ):
                errors.append(
                    "reserved_trace_generation_evidence_invalid: a generation must introduce exactly one reserved transition at the suffix end and finish in that state"
                )
            for entry in reserved_entries:
                evidence = entry.get("reserved_evidence")
                expected = canonical_reserved_evidence(
                    state,
                    entry,
                    int(manifest.get("revision", 0)),
                    prior_run=previous_state,
                    registry=self.registry,
                )
                gate_errors = dedicated_state_gate_errors(
                    state,
                    policy,
                    str(entry.get("state")),
                    reason=str(entry.get("reason", "")),
                    actor=str(entry.get("actor", "")),
                )
                if not isinstance(evidence, Mapping) or dict(evidence) != expected:
                    errors.append(
                        "reserved_trace_generation_evidence_invalid: reserved evidence is not the canonical introducing-generation projection"
                    )
                if gate_errors:
                    errors.append(
                        "reserved_trace_generation_evidence_invalid: dedicated gate replay failed for the introducing generation"
                    )
                if isinstance(evidence, Mapping):
                    for message in reserved_generation_evidence_errors(
                        state,
                        previous_state,
                        entry,
                        evidence,
                        registry=self.registry,
                    ):
                        errors.append(
                            "reserved_trace_generation_evidence_invalid: " + message
                        )
            previous_trace_length = len(trace)
            previous_state = state
        return errors

    @staticmethod
    def _validate_historical_bindings(
        current_state: Mapping[str, Any],
        chain: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]],
    ) -> list[str]:
        """Bind every failure receipt to the committed report generation it names."""

        errors: list[str] = []
        by_generation = {item[0].get("generation_ref"): item for item in chain}
        for history in current_state.get("failure_history", []):
            if not isinstance(history, Mapping):
                continue
            historical = by_generation.get(history.get("report_generation_ref"))
            if historical is None:
                errors.append("failure history report generation does not exist")
                continue
            manifest, state, _ = historical
            if (
                manifest.get("revision") != history.get("report_generation_revision")
                or int(manifest.get("revision", 0))
                > int(current_state.get("revision", 0))
            ):
                errors.append("failure history report generation revision is invalid")
            report_key = f"{history.get('phase')}_{history.get('report')}_report"
            snapshot = history.get("report_snapshot")
            if state.get(report_key) != snapshot:
                errors.append("failure history snapshot differs from historical report")
                continue
            role = (
                "verifier"
                if history.get("report") == "verification"
                else "reviewer"
            )
            expected_grant = (
                state.get("authority_grants", {})
                .get("quality", {})
                .get(history.get("phase"), {})
                .get(role)
            )
            evidence_pairs = (
                (snapshot.get("authority_grant"), expected_grant),
                (snapshot.get("artifact_digest"), state.get("current_artifact_digest")),
                (snapshot.get("plan_revision"), state.get("shared_plan", {}).get("revision")),
                (snapshot.get("artifact_revision"), state.get("artifact_revision")),
                (snapshot.get("attempt"), state.get("attempt_count")),
                (snapshot.get("cause"), history.get("cause")),
                (snapshot.get("report_digest"), history.get("report_digest")),
            )
            if any(actual != expected for actual, expected in evidence_pairs):
                errors.append("failure history evidence differs from historical state")

            historical_findings = {
                str(item.get("digest")): item
                for item in state.get("findings", [])
                if isinstance(item, Mapping)
            }
            identities = history.get("finding_identities", [])
            expected_history = canonical_failure_history_entry(
                history,
                [
                    item
                    for item in state.get("findings", [])
                    if isinstance(item, Mapping)
                ],
                [
                    item
                    for item in state.get("implementation_log", [])
                    if isinstance(item, Mapping)
                ],
            )
            if dict(history) != expected_history:
                errors.append(
                    "failure_history_report_identity_invalid: failure history is not the exact historical Finding projection"
                )
            if not isinstance(identities, list):
                errors.append("failure history finding identities are invalid")
                continue
            for identity in identities:
                finding = (
                    historical_findings.get(str(identity.get("finding_digest", "")))
                    if isinstance(identity, Mapping)
                    else None
                )
                expected_identity = (
                    {
                        "issue_id": finding.get("issue_id"),
                        "clause": finding.get("clause"),
                        "location": finding.get("location"),
                        "source": finding.get("source"),
                        "finding_digest": finding.get("digest"),
                    }
                    if isinstance(finding, Mapping)
                    else None
                )
                if identity != expected_identity:
                    errors.append(
                        "failure history finding identity differs from historical finding"
                    )
        return errors

    def _read_current_artifacts(self, run_dir: Path, run: Mapping[str, Any]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for reference in run.get("artifacts", []):
            path = self._contained_path(run_dir, reference.get("path"))
            if path is None:
                raise ValueError("artifact reference escapes run directory")
            result[str(reference.get("name", ""))] = json.loads(path.read_text(encoding="utf-8"))
        return result

    @staticmethod
    def _integrity_failure(run_id: str, revision: int, errors: list[str]) -> dict[str, Any]:
        return {
            "run_id": run_id,
            "revision": revision,
            "state": "blocked",
            "integrity_status": "failed",
            "integrity_errors": errors,
            "blockers": [{"code": "integrity_failure", "message": "persisted run integrity failed"}],
            "rejections": [],
            "artifacts": [],
        }

    @staticmethod
    def _read_manifest(run_dir: Path) -> dict[str, Any] | None:
        path = run_dir / "commit-manifest.json"
        if not path.is_file():
            return None
        value = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(value, dict):
            raise ValueError("commit manifest must be an object")
        return value

    @staticmethod
    def _read_anchor(run_dir: Path) -> dict[str, Any] | None:
        path = run_dir / "commit-anchor.json"
        if not path.is_file():
            return None
        value = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(value, dict):
            raise ValueError("commit anchor must be an object")
        return value

    @staticmethod
    def _contained_path(root: Path, reference: Any) -> Path | None:
        if not isinstance(reference, str) or not reference:
            return None
        candidate_ref = Path(reference)
        if candidate_ref.is_absolute() or ".." in candidate_ref.parts:
            return None
        root_resolved = root.resolve()
        candidate = (root / candidate_ref).resolve(strict=False)
        try:
            candidate.relative_to(root_resolved)
        except ValueError:
            return None
        return candidate

    def _run_dir(self, run_id: str) -> Path:
        self._validate_run_id(run_id)
        return self.runs_dir / run_id

    @staticmethod
    def _validate_run_id(run_id: str) -> None:
        if not run_id.startswith("run-") or "/" in run_id or "\\" in run_id or ".." in run_id:
            raise ValueError("invalid run id")

    def _lock_held(self, run_id: str) -> bool:
        return run_id in getattr(self._held, "run_ids", set())

    @staticmethod
    def _write_json(path: Path, value: Any) -> None:
        with path.open("w", encoding="utf-8") as handle:
            handle.write(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
            handle.flush()
            os.fsync(handle.fileno())

    @classmethod
    def _atomic_json(cls, path: Path, value: Any) -> None:
        descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent, text=True)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
                handle.write(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, path)
            cls._fsync_directory(path.parent)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    @staticmethod
    def _fsync_directory(path: Path) -> None:
        descriptor = os.open(path, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
