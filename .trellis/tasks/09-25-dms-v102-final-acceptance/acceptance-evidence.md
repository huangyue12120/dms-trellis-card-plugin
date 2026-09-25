# DMS v1.0.2 final acceptance evidence

Captured 2026-09-25. This task remains **in progress** and the local `1.0.0`
package remains a candidate. The repository contract suite passes, but this
session has no live DMS/Quickshell process, so this is not a final release
acceptance record.

## Evidence classes

- **Fixture/pure**: disposable Node fixtures and pure helper contracts.
- **Static**: source, manifest, translation, and resource checks.
- **Offscreen**: QML construction in an installed-module test harness.
- **Host**: behavior directly observed in a running target DMS 1.6.2 session.
- **User-reported host**: target behavior reported by the user, not independently
  replayed in this session.

The v1.0.1 contract-freeze task is archived with status `completed`. It freezes
version `1.0.0`, `requires_dms >=1.6.2`, the existing three permissions, and
retention of Desktop, zh_CN, and Launcher as individually gated candidate
items. Existing v0.8 DMS checks remain user-reported evidence; they are not
reclassified as observations from this session.

## Automated checks

| Check | Result | Evidence and limits |
|---|---|---|
| `node tests/test_trellis_contract.mjs` | **PASS** | Updated only stale test expectations: the manifest now matches the frozen v1.0 component/capability set, `>=1.6.2`, and `1.0.0`, while retaining the approved permissions and no-network assertion; the Back, archive-error, and Markdown-error source assertions now match the approved `I18n.trFor` usage. All 22 printed state-matrix cases passed and the suite ended with `trellis contract fixtures: ok`. No product QML behavior was changed. |
| `node --check tests/test_trellis_contract.mjs` | **PASS** | Contract test parses as an ES module. |
| Direct `node --check TrellisDms/lib/trellisPaths.js` | **UNSUPPORTED INPUT** | Node reports `SyntaxError: Unexpected token '.'` at QML's `.pragma library` directive. This is not treated as a helper syntax defect. |
| Temporary QML-JavaScript syntax adapter | **PASS** | For all five `TrellisDms/lib/*.js` modules, a disposable `/tmp` copy omitted only the first-line `.pragma library`; `node --check` passed. Repository helper files were unchanged by this check. This checks JavaScript syntax, not QML engine compatibility. |
| Manifest/catalog JSON, package fields, permissions, exact-case resources | **PASS (static)** | `plugin.json` and `translations/zh_CN.json` parse; the catalog has 231 entries. Manifest is `1.0.0`, requires `>=1.6.2`, declares daemon/widget/desktop/launcher components and the existing `process`, `settings_read`, `settings_write` permissions; network is absent. All 16 manifest, Settings/catalog, and local QML-import references resolve with exact case. |
| `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-25-dms-v102-final-acceptance` | **PASS** | Both task context JSONL files validate (9 entries each). |
| `git diff --check` | **PASS** | No whitespace errors in the current diff. |
| `qmllint`, `qmlformat`, offscreen QML harness | **UNAVAILABLE / NOT RUN** | `qmllint` and `qmlformat` are absent; no offscreen harness was available. No replacement tooling was installed. |

The first suite runs exposed stale v0.8 manifest expectations and three source
assertions that still expected unlocalized error labels. These were corrected
in the test file only after confirming the frozen v1.0 manifest and current
approved localization behavior. The subsequent full run passed all 22 state
matrix cases; it does not constitute QML engine or live DMS evidence.

## Host environment and runtime gates

The main session verified these executable-reported versions on 2026-09-25:

| Command | Reported version | Scope |
|---|---|---|
| `dms version` | DMS 1.6.2 | CLI version only |
| `qs --version` | Quickshell 0.3.1 | CLI version only |
| `qtpaths6 --query QT_VERSION` | Qt 6.11.2 | Installed Qt version only |
| `niri --version` | niri 26.04 | CLI version only |

This session found no running `dms` or `quickshell` process. It did not launch,
install, restart, or replace DMS or the plugin. Consequently, every live host
row below remains **UNVERIFIED**:

| Target-host check | Result |
|---|---|
| Core plugin load, empty/unconfigured state, configured/removed roots, discovery and recovery | UNVERIFIED |
| Live task/session refresh, settings/manual refresh, topology changes, watcher timing and resource behavior | UNVERIFIED |
| Bar/popout, multiple bars/displays, reload and disable cleanup | UNVERIFIED |
| Markdown/archive lazy loading and degraded/error recovery | UNVERIFIED |
| Desktop placement/resize/scroll/disable | UNVERIFIED |
| zh_CN ↔ English locale reload, fallback and layout | UNVERIFIED |
| `!trellis` empty/query/no-match, project/task selection, popout and State persistence | UNVERIFIED |
| One-daemon/shared-Snapshot behavior across retained surfaces and reload | UNVERIFIED |

The installed CLI versions do not prove a running graphical session or any UI,
IPC, persistence, timing, or lifecycle behavior. The prior v0.8 user-reported
checks remain attributed to that report and do not cover all v0.9 surfaces.
No optional surface failed a host test in this session because none could be
run; Desktop, zh_CN, and Launcher therefore remain in the candidate with their
approved individual disable/defer paths. No performance value was measured.

## Release gate status

- **Repository fixture/static gate:** passed; all 22 contract state-matrix cases
  and the separate manifest/resource/task/whitespace checks passed.
- **QML/offscreen gate:** unavailable in this environment.
- **Target DMS 1.6.2 gate:** pending for core behavior and every retained P2
  surface; final release status must remain pending until host evidence is
  recorded or individual optional items are disabled/deferred and core host
  acceptance is completed.
- **Scope:** no Trellis data, user configuration, installed plugin, DMS runtime,
  external registry, Agent configuration, hook, or daemon was changed by these
  checks.
