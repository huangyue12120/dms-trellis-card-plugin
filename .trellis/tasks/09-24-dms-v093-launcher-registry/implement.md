# DMS v0.9.3 Launcher and registry readiness — implementation plan

1. [x] Finalize the Launcher UI/state matrix and component contract. The proposal in `launcher-ui-gate.md` was approved on 2026-09-24; implementation follows that contract.
2. [x] Add a bounded pure search projection for project names and live task titles, preserving IDs and Snapshot order. Cap results at 20 matches plus an overflow row; output excludes raw paths/Markdown.
3. [x] Implement `TrellisLauncher.qml` with `getItems(query)` and `executeItem(item)`. Revalidate action IDs against the current global Snapshot; save project/pin State with key-scoped APIs; request the existing popout through `BarWidgetService` when available.
4. [x] Add `components.launcher`, descriptive `launcher` capability, and `trigger: "!trellis"` to `plugin.json`. Do not add Control Center properties or permissions.
5. [x] Add local `docs/registry-readiness.md` covering name/description, version, compatibility, permissions, local installation/disable/rollback, and external requirements that remain pending. Do not publish externally.
6. [x] Complete static search/state boundary checks, query/result bounds, stale-ID validation review, empty/no-match behavior, manifest JSON, JS syntax, task context, and whitespace checks. [ ] Live Launcher use, popout/no-widget behavior, State persistence, and multi-surface reload on DMS 1.6.2 remain host gates.

## Validation targets

- Fixtures: project-only and task-title queries, case folding, multiple equal task IDs in different projects, bounded result lists, empty Snapshot, malformed action IDs, task disappearing between result and selection.
- Static: no filesystem reader, resolver call, process, socket, network, Trellis write, Markdown or full path in Launcher QML.
- Runtime: trigger conflict check, Launcher open/search/select, project-qualified pin replacement, popout on focused screen, unavailable widget behavior, reload/disable, existing daemon instance count.
- State persistence across a full DMS restart remains a separate live evidence gate; the host's existing asynchronous State write behavior must not be represented as synchronously verified.

## Rollback point

Remove the `components.launcher` mapping and root trigger, then remove `TrellisLauncher.qml` and its search helper. Keep `components.desktop`, daemon/widget surfaces, and existing State keys intact.

## Implementation record

- `makeLauncherProjection` searches only project names and live task titles. Empty query returns projects only. Results preserve Snapshot order and remain distinct by project/task ID; DMS 1.6.2 re-sorts rows, so descending `_preScored` values preserve the approved order in the plugin section.
- `resolveLauncherAction` rejects malformed, duplicate, and stale identities against the current Snapshot. Project selection writes `selectedProjectId`; task selection also replaces `pinnedTaskId` with the existing project-qualified token. The QML surface uses no filesystem, process, network, watcher, timer, or Trellis-write API.
- The manifest is `0.9.0`, requires `>=1.6.2`, retains the existing permissions, and exposes the approved Launcher plus Desktop. `docs/registry-readiness.md` is local-only; external registry review/publication remains pending separate authorization.
- Static checks passed for JSON, JS syntax, task context, read-only boundaries, and `git diff --check`. No tests or live DMS/Wayland Launcher checks were run; runtime gates remain pending.
