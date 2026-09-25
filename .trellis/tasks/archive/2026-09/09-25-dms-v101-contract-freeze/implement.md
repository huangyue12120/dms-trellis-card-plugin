# DMS v1.0.1 contract freeze — implementation plan

## Ordered checklist

1. [x] Read the curated frontend contracts and `research/baseline-evidence.md`; compare them with the current parser, resolver, daemon, projections, Settings, surfaces, and manifest.
2. [x] Make a compact requirement-to-file/evidence map for P0/P1 and the three selected P2 items. Keep archived evidence classes intact.
3. [x] Check manifest fields against the installed DMS schema/API research. Set the local candidate to version `1.0.0`, `requires_dms >=1.6.2`, and the existing permission set; retain optional Desktop/Launcher and locale catalog entries.
4. [x] Correct only concrete contract/document mismatches found in this task. Do not alter Snapshot schema, persisted key semantics, root authorization, or surface design.
5. [x] Update `PROJECT_PROGRESS.md` to label the v1.0 candidate and acceptance sequence without marking final acceptance prematurely.
6. [x] Review exact manifest/component/resource spelling and produce the frozen candidate summary for child 1.0.2.

## Requirement-to-file/evidence map

| Scope | Contract owner | Existing evidence and 1.0.2 check |
|---|---|---|
| Snapshot schema, session retention, state mapping, nullable progress, resolver safety | `TrellisDms/lib/trellisParser.js`, `lib/trellisPaths.js`, `lib/trellisprojection.js`; `.trellis/spec/frontend/state-matrix-contract.md`, `quality-guidelines.md`, and `docs/ui-state-matrix.md` | v0.8.1 disposable fixture/path tests and static assertions; rerun the contract suite and safety matrix in 1.0.2. |
| Shared daemon, watcher/topology lifecycle, Settings/State, Markdown/archive isolation | `TrellisDms/TrellisDaemon.qml`, `lib/trellisWatch.js`, `TrellisWidget.qml`, `TrellisSettings.qml`; `.trellis/spec/frontend/quality-guidelines.md`, `settings-state-contract.md`, and archive/Markdown contracts | v0.8.2 fixture/static evidence; the v0.8.3 user report includes topology/reload/multi-screen checks, but was not independently replayed and has no precise timing data. The two-second watcher target and numeric performance remain unmeasured; verify available gates in 1.0.2. |
| Candidate package contract | `TrellisDms/plugin.json`, `docs/registry-readiness.md`; `.trellis/tasks/09-24-dms-v09-optional-p2/research/v09-platform-apis.md` | DMS 1.6.2 schema/API research; JSON, exact resource-path and permission checks pass in this task. Host loading is still a 1.0.2 gate. |
| Desktop | `TrellisDms/TrellisDesktopWidget.qml`, desktop projection contract, v0.9.1 PRD/UI gate | Static projection checks are recorded; DMS load, placement, resize, and disable/core behavior remain pending. On failure, omit the desktop component and capability from the candidate manifest. |
| zh_CN | `TrellisDms/translations/zh_CN.json`, v0.9.2 PRD and locale API evidence | Catalog/source-key and placeholder static checks are recorded; locale switching/layout remain pending. On failure, omit the catalog from the candidate package and retain English source fallback. |
| Launcher | `TrellisDms/TrellisLauncher.qml`, launcher projection contract, v0.9.3 PRD/UI gate | Static search/manifest checks are recorded; live search, selection, popout, State persistence and multi-surface reload remain pending. On failure, omit Launcher component, trigger, and capability from the candidate manifest. |

## Frozen candidate summary

- Local manifest version: `1.0.0`; `requires_dms`: `>=1.6.2`; permissions remain `settings_read`, `settings_write`, and `process`.
- Desktop, zh_CN, and Launcher remain optional candidate items; each has an individual DMS 1.6.2 acceptance check and disable/defer path in `PROJECT_PROGRESS.md` and `docs/registry-readiness.md`.
- v0.2 shared-Snapshot/runtime checks, the precise v0.4 watcher-latency target and independent confirmation of topology behavior, v0.9 optional-surface host checks, and v0.8 measured performance remain pending or unmeasured. This freeze does not claim final acceptance.

## Results

- `TrellisDms/plugin.json` and `TrellisDms/translations/zh_CN.json` parse as JSON; manifest fields and all component/Settings resource paths match exact-case files.
- Version labels, DMS minimum, and permissions match the frozen contract; no network permission or runtime behavior was added.
- `task.py validate` and `task.py list-context` passed for this task; `git diff --check` passed.
- Full Node contract execution and target-host checks remain assigned to task 1.0.2.
- Spec sync review found no new executable coding contract or convention to add; the existing frontend contracts already cover these behaviors.

## Validation

- Parse the manifest and locale catalog as JSON.
- Compare manifest component/resource paths with exact filesystem names and the DMS API research.
- Run `node --check tests/test_trellis_contract.mjs` if the test file or helpers are changed; full contract execution is owned by task 1.0.2.
- Run `git diff --check` and inspect only the files changed for this freeze.
- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-25-dms-v101-contract-freeze` before activation.

## Rollback and review

- If the candidate manifest fails schema/API checks, restore the last known manifest fields and keep the release status at v0.9/candidate.
- If a code defect is found outside the approved contract, record it and hand it to final acceptance as a scoped regression; do not expand this task into feature work.
