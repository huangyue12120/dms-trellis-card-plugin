# v0.8 planning baseline

Captured on 2026-09-24 before implementation. This note records repository and host facts; it does not claim runtime acceptance.

## Roadmap and current implementation

- PROJECT_PROGRESS.md:955-1067 defines v0.8 as three ordered gates: state matrix, performance/lifecycle/security, and target environment/RC.
- TrellisDms/plugin.json is 0.7.0 and declares requires_dms >=1.6.1. The inspected installed manifest also reports 0.7.0.
- tests/test_trellis_contract.mjs is the existing 1,493-line Node contract suite. It already includes a stateMatrixFixtures table, parser/Snapshot checks, archive and Markdown fixtures, path containment cases, source checks, and watcher-limit assertions. Planning should identify coverage gaps before adding tests.
- No root package.json or separate test runner script was found. The existing suite is invoked directly with Node.
- The frontend quality and recovery, Markdown, archive, and Settings/State specs define the existing observer, no-fabricated-progress, read-only, resource, and runtime evidence boundaries.
- The v0.7 parent execution plan is the precedent for direct Node checks, task context validation, installed-module offscreen loading, and separately reported Wayland/host gates.

## Host evidence

| Component | Current observation | Relevance |
|---|---|---|
| Distribution | Fedora 44 | Matches roadmap |
| Session/compositor | Wayland; niri 26.04 | Matches roadmap |
| DMS CLI | dms v1.6.2 | Newer than, but not identical to, target 1.6.1 |
| Quickshell | 0.3.1 | Matches roadmap |
| Qt | 6.11.2 | Matches roadmap |
| Trellis project | .trellis/.version = 0.6.17 | Matches roadmap |
| DMS process | No running DMS/Quickshell process observed | Live IPC/reload is not currently available |
| QML lint tools | qmllint and qmlformat not found on PATH | Tooling limitation; not proof QML is invalid |

The supported version query is dms version; dms --version is not supported. The Trellis CLI executable is not on PATH in this shell, while the repository's Trellis Python scripts are available.

## Planning implications

- Keep the exact 1.6.1 target distinct from current 1.6.2 host evidence. Do not install/downgrade DMS to manufacture a target result.
- No live shell means installation, reload, disable cleanup, real multi-bar/screen, and Wayland interaction remain environment gates until a suitable session is available.
- Keep fixture writes under temporary directories. Never alter this project's real .trellis data to exercise the matrix.
- Prior milestone manifests advanced from 0.6.0 to 0.7.0; use 0.8.0 only at the final RC gate, not during child regression work.

## Source references

- PROJECT_PROGRESS.md: current v0.8 scope.
- .trellis/spec/frontend/quality-guidelines.md: observer, Snapshot, watcher, and source boundaries.
- .trellis/spec/frontend/recovery-responsive-contract.md: recovery, viewport, and host evidence requirements.
- .trellis/spec/frontend/markdown-detail-contract.md and archive-browsing-contract.md: bounded read-only detail paths.
- .trellis/spec/frontend/settings-state-contract.md: settings and UI State behavior.
- .trellis/tasks/archive/2026-09/09-23-dms-plugin-v07/implement.md: prior validation commands and evidence separation.
