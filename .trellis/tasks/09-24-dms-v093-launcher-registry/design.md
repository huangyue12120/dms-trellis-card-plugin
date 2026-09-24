# DMS v0.9.3 Launcher and registry readiness — design

## Launcher data path

- Add `TrellisLauncher.qml` as the optional composite `components.launcher` surface with root manifest trigger `!trellis`.
- On launcher open, read the daemon's global Snapshot; `getItems(query)` searches only project names and task titles, case-insensitively. Do not read `.trellis/`, Markdown, settings roots, paths, or external services from this surface.
- Return DMS launcher result objects with bounded names/comments and stable IDs in action data. Preserve Snapshot project/task order, cap the total results, and never infer progress or activity.
- A project result writes its `selectedProjectId` to DMS State. A task result writes `selectedProjectId` and the existing project-qualified `pinnedTaskId`. Revalidate both IDs against the current Snapshot before writing.
- After a valid selection, request `BarWidgetService.triggerWidgetPopout("trellisDms")`. If no bar widget is registered, keep the saved selection and do not report that the popout opened. State changes are UI navigation, not Trellis writes.
- Empty Snapshot returns a bounded informational item that opens the existing empty-state popout when available; a non-empty query with no matches uses the DMS launcher's normal no-results state. Malformed/stale action data is a no-op.
- Launcher instances are created on first Launcher use; no background timers, filesystem work, or independent Snapshot cache is added.

## Local registry readiness

- Prepare the local composite manifest, concise install/compatibility/permission notes, and a readiness checklist under `docs/`.
- The final local manifest includes the approved desktop and launcher surfaces, the `!trellis` trigger, the minimum evidenced DMS version, and no new permission.
- External DMS registry submission, push, or publication is excluded. Screenshots are not fabricated; any registry-specific external requirements remain listed as pending.
- Control Center is explicitly deferred from 0.9.3.

## Failure, compatibility, and disable behavior

- A missing Snapshot or no-match query returns no unsafe result. A stale ID cannot alter plugin State.
- If `BarWidgetService` is unavailable or returns false, the launcher surface remains usable and does not affect the daemon/core plugin.
- The Launcher component is optional in the composite manifest; the `!trellis` trigger makes ordinary launcher search unchanged. Removing the manifest component disables it independently.
- Verify `trigger`, `getItems`, `executeItem`, `PluginService` State, and `BarWidgetService.triggerWidgetPopout` on DMS 1.6.2 before relying on the API; guard optional host calls.
