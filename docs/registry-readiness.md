# Trellis DMS local registry readiness

Status: **local review only; no external publication has occurred**.

## Local package metadata

- Name: Trellis DMS
- Description: Read-only Trellis project status for DankMaterialShell
- Package version: `0.9.0`.
- Minimum DMS version: `>=1.6.2`, based on the locally inspected DMS 1.6.2 plugin schema and Launcher, State, and popout APIs.
- Surfaces: daemon, bar widget/popout, desktop widget, and optional Launcher (`!trellis`). Control Center is not included.
- The `launcher` capability label describes the registered composite surface. The installed schema does not require it: `components.launcher` plus the root `trigger` provide the actual registration contract.
- Permissions: `settings_read`, `settings_write`, and `process`. No `network` permission is declared. Launcher navigation reads the shared Snapshot and writes only the existing project filter and project-qualified task pin in DMS plugin State.

## Local installation and disable

For a local review, copy or symlink the `TrellisDms` plugin directory into
`$CONFIGPATH/DankMaterialShell/plugins/TrellisDms` (commonly
`~/.config/DankMaterialShell/plugins/TrellisDms`), then enable or reload it in
DMS Plugin settings. Restart DMS if the local plugin scanner does not pick up
the directory change.

To disable the whole plugin, disable it in DMS Plugin settings. To disable only
Launcher while keeping the other surfaces, remove `components.launcher` and
the root `trigger` from `plugin.json`, then reload the plugin. To roll back the
local package, restore the prior plugin directory or manifest and reload DMS.

## Readiness checklist

- [x] Local manifest declares the approved surfaces, `!trellis` trigger, and minimum DMS version.
- [x] Launcher adds no permission and does not read Trellis files or launch processes.
- [x] Local installation, disable, and rollback steps are documented.
- [x] `plugin.json` declares package version `0.9.0`.
- [ ] Verify Launcher loading, search, selection, popout behavior, and multi-surface reload in a live DMS 1.6.2 session.
- [ ] Confirm the current external registry's required metadata and submission process.
- [ ] Prepare any registry-requested screenshots and review the final listing/package contents.
- [ ] External publication: pending separate user authorization; none has been performed.

The registry-specific external checklist remains open until the current registry
requirements have been checked. No registry entry, push, or public listing has
been created as part of this work.
