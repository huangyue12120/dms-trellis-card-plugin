# v1.2 Repository and Host Evidence

Recorded 2026-10-08 during planning. Source inspection and fixture checks do not establish live DMS behavior.

## Source requirements and existing behavior

| Evidence | Finding | Planning implication |
| --- | --- | --- |
| PROJECT_PROGRESS.md:1688, :1709, :1783, :1845, :1901 | v1.2 contains Recent Changes, global metadata search, copy/open-folder actions, and acceptance/release. | Four independently verifiable child tasks; the parent owns integration. |
| TrellisDms/TrellisDaemon.qml:1719 | One publisher calls the pure parser and publishes the shared snapshot. | Hook observations here; retain a single publisher. |
| TrellisDms/TrellisDaemon.qml:37, :1722, :1975 | scanGeneration guards scans/reloads; there is no distinct snapshot publication counter. | Add a daemon publication generation for event provenance, separate from scan cancellation. |
| TrellisDms/lib/trellisParser.js:379 | Snapshot schema 2 includes runtime freshness and project/task/session facts. | Keep parser facts and schema compatibility; optional observation provenance belongs to the daemon. |
| TrellisDms/lib/trellisParser.js:106, :225, :350 | Task IDs are project-qualified; session identity uses sessionKey; progress is null. | Diff whitelisted facts, not raw JSON or timestamps. |
| TrellisDms/lib/trellisprojection.js:330, :591 | Existing primary selection and Health projection own display semantics. | Reuse these projections; do not invent activity or health meanings. |
| TrellisDms/TrellisDaemon.qml:651, :740, :829, :1001 | Archive rows are canonicalized and size-checked before bounded task.json reads; detail requests have cancellation guards. | Reuse safe policies; global search needs its own bounded request lifecycle. |
| TrellisDms/lib/trellisPaths.js:11, :480, :514, :526, :547 | Archive caps are 48 months, 2048 directories/month, 32 rows/page, page maximum 63, 8 warnings. Resolver policy is pure and centralized. | Preserve these caps and path boundaries; add finite global search batches. |
| TrellisDms/TrellisWidget.qml:384, :411, :423, :948 | State writes are key-scoped; detail/archive modes already exist in a bounded popout. | Search is transient; selection reuses existing project navigation/detail without automatic pinning. |
| TrellisDms/TrellisSettings.qml:459 | Diagnostics copy uses argv ["dms", "cl", "copy", report] with process completion feedback. | Reuse the host clipboard contract, executing new navigation operations in the daemon. |
| /usr/share/quickshell/dms/Modals/DankLauncherV2/Controller.qml:2155, :2162 | The installed DMS opens local files/folders through Qt.openUrlExternally. | Use an encoded local file URL after canonical validation; no shell concatenation. |
| /usr/share/quickshell/dms/DankCommon/Widgets/DankTextField.qml:24, :32, :80 | Native text, maximumLength, and focus APIs exist. | Use native input and focusable result controls; verify keyboard behavior on the host. |
| .github/workflows/candidate-release.yml:5, :31, :76 | Existing CI supports generic vMAJOR.MINOR.PATCH-rc.N tags and creates prereleases, not stable releases. | Reuse candidate packaging; add stable release support only in acceptance work when gates pass. |
| .trellis/tasks/archive/2026-10/09-29-v11-host-acceptance/acceptance-evidence.md:24, :77 | Prior QML tooling and many host checks were unavailable/unverified. | Carry these checks forward; administrative archive is not acceptance. |

## Checks completed in planning

- `rtk proxy node tests/test_trellis_contract.mjs`: PASS, including the existing state-matrix fixture/static checks.
- `rtk proxy dms version`: reports dms v1.6.2.
- Installed `/usr/share/quickshell/dms/VERSION`: 1.6.2.
- Tool availability: Node, qs, dms, and xdg-open are installed; qmllint and qmlformat are absent.
- No clipboard contents were read/written and no folder was opened.
- No running host, UI loading, Wayland interaction, or publication was established by these checks.
- Initial PROJECT_PROGRESS.md SHA-256: `a6c386bebbe0bece3f6bced42961b889806962d78c7f2d882c5aa514010ce57d`. Preserve the user's uncommitted roadmap additions.

## Settled technical choices

- Runtime-only event history; first observations establish quiet baselines.
- A source publication counter identifies snapshot observations; timestamps alone are not generations.
- Independent bounded archive-search and action lifecycles prevent searches or clipboard operations from cancelling the existing Markdown/detail channel.
- Search examines metadata only and exposes incomplete coverage explicitly; empty queries never read archive metadata.
- Folder opening uses the installed Qt local-URL contract. Terminal/editor integration is deferred from this MVP.
- Resource caps bound retained data and per-request work. They are not claims about measured peak memory, latency, or simultaneous process counts.

## Implementation cautions

- The 32951-byte quality-guidelines.md exceeds the 32768-byte per-file injection limit. It is intentionally not injected wholesale. Implement/check agents must read relevant sections directly: v0.3 data policy at :29, watcher/recovery at :55, trusted-root discovery at :189/:305, primary selection at :379, preference State at :469, exact-case reload resources at :576, and the review checklist at :706. The curated leaf specs and frontend index remain injected.
- Ignore generatedAt, lastSeenAt, mtime, scan clocks, and warning order when diffing semantic facts.
- Suppress unreliable task/session deltas during discovery/read failure; retain last reliable baselines through recovery.
- Treat newly observed archive metadata as observation evidence, never proof of a completion time.
- All identity maps must handle duplicate and prototype-like IDs without ambiguity.
- Revalidate configured trusted roots and current identities immediately before path operations; a remembered project is not authorization.
- Existing filename case and QML import contracts are enforced by the test harness.
