# Stage 0 research design

## Boundary

This task produces evidence and planning artifacts only. It reads the current
repository and installed tooling, plus authoritative upstream references when
available. It does not implement the future DMS plugin, alter observed Trellis
state, install hooks, or make final UI decisions.

## Evidence model

1. **Local runtime evidence** — command output and installed files are the
   authority for DMS, Quickshell, Qt, niri, and Trellis versions.
2. **Repository evidence** — the current `.trellis/` tree, real task/session
   records, `task_store.py`, active-task resolver, and CLI help establish the
   data contract and lifecycle behavior.
3. **Authoritative upstream evidence** — DMS/Quickshell documentation or source
   and the Linux CodeIsland reference are used only when available and are
   recorded with their URL, revision/version, or local checkout path.
4. **Test evidence** — a disposable path-safety matrix exercises canonical
   containment rules. Results are recorded; no resolver implementation is
   added to the product tree.

Every conclusion is labeled as verified, inferred, unavailable, or deferred.
Unverified assumptions from the specification are never silently promoted to
implementation requirements.

## Deliverable mapping

| Evidence area | Output |
| --- | --- |
| DMS/Quickshell/Qt/niri/Trellis environment | `research/environment.md` |
| `.trellis` layout, task schema, sessions, archive, CLI | `research/trellis-data-model.md` |
| DMS plugin, composite, watcher, Theme, Settings/State APIs | `research/dms-api.md` |
| progress field/checklist semantics | `research/progress-semantics.md` |
| canonical path and containment tests | `research/path-safety.md` |
| Linux CodeIsland protocol and macOS non-reference note | `research/codeisland-linux.md` |

## Safety and reproducibility

- Use read-only inspection for the project tree and external source.
- Use `/tmp` only for disposable path fixtures; remove only the explicitly
  created fixture directory after recording results.
- Do not use a shell string assembled from user paths for any future discovery
  recommendation; record argv-style alternatives instead.
- Preserve command failures and missing tools in the reports so a later task can
  repeat them on the target machine.

## Downstream contract

Later implementation planning may rely on these findings for parser fields,
watcher boundaries, version guards, and safe resolver tests. It must still
revalidate facts that are version-sensitive and must wait for the UI/UX Design
Gate before final QML work.
