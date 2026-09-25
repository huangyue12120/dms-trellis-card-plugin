# Trellis DMS local registry readiness

Status: **local review only**. As of 2026-09-25, no GitHub Release or DMS
registry submission has happened.

## Local package metadata

- Name: Trellis DMS
- Description: Read-only Trellis project status for DankMaterialShell
- Package version: `1.0.0`.
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

To disable the whole plugin, disable it in DMS Plugin settings. If an optional
v1.0 surface fails host acceptance, omit only that item from the candidate:

- Desktop: remove `components.desktop` and the `desktop-widget` capability
  from `plugin.json`.
- zh_CN: omit `translations/zh_CN.json`; the English source strings remain the
  fallback.
- Launcher: remove `components.launcher`, the root `trigger`, and the
  `launcher` capability from `plugin.json`.

Reload the plugin and rerun the core acceptance after any such change. To roll
back the local package, restore the prior plugin directory or manifest and
reload DMS.

## DMS online plugin search list

The current upstream contribution guide was checked on 2026-09-25 at registry
revision `f4d3c5d440cef6afcbb70d335522a824ed574264`:
[AvengeMedia/dms-plugin-registry — CONTRIBUTING.md](https://github.com/AvengeMedia/dms-plugin-registry/blob/master/CONTRIBUTING.md).
The list is shown at [plugins.danklinux.com](https://plugins.danklinux.com/)
and in DMS Settings → Plugins → Browse. The guide's process is:

1. Keep this plugin repository public and make the `TrellisDms/` package
   available on its default branch.
2. Fork `AvengeMedia/dms-plugin-registry` and add
   `plugins/huangyue12120-trellis-dms.json`.
3. Supply the required `id`, `name`, `capabilities`, `category`, `repo`,
   `author`, `description`, `dependencies`, `compositors`, and `distro` fields.
   The `id` and `name` must exactly match `TrellisDms/plugin.json`; for this
   monorepo, set `path` to `TrellisDms` and retain `requires_dms: ">=1.6.2"`.
   The contribution guide requires a direct, publicly reachable screenshot URL.
4. Run the registry's `python3 .github/generate.py --validate` and
   `python3 .github/validate_links.py` checks, then open a pull request to its
   `master` branch. The guide asks submitters to disclose meaningful AI
   assistance and personally review and test each submitted change.

The registry entry uses the repository and optional monorepo path; its current
contribution guide does not require a GitHub Release. The repository's tag
workflow is useful for distributing a tested package ZIP, but publishing that
release does not add the plugin to the DMS search list.

Candidate entry values known from the current package are:

- Registry filename: `plugins/huangyue12120-trellis-dms.json`
- `id`: `trellisDms`; `name`: `Trellis DMS`
- `repo`: `https://github.com/huangyue12120/dms-trellis-card-plugin`
- `path`: `TrellisDms`; `requires_dms`: `>=1.6.2`
- `capabilities`: `daemon`, `dankbar-widget`, `desktop-widget`, `launcher`
- `dependencies`: `[]`

This is not ready for submission yet. DMS 1.6.2 host acceptance remains open
for core lifecycle and the retained optional surfaces, no project screenshot
is present, and the final `compositors` / `distro` claims still need to match
the tested support matrix. No registry fork, PR, or listing has been created.

## Readiness checklist

- [x] Local manifest declares the approved surfaces, `!trellis` trigger, and minimum DMS version.
- [x] Launcher adds no permission and does not read Trellis files or launch processes.
- [x] Local installation, disable, and rollback steps are documented.
- [x] `plugin.json` declares package version `1.0.0`.
- [ ] Verify Desktop loading, placement, and resize; if its gate fails, omit it and confirm the core remains usable in a live DMS 1.6.2 session.
- [ ] Verify zh_CN locale switching, reload, catalog coverage, layout, and English fallback in a live DMS 1.6.2 session.
- [ ] Verify Launcher loading, empty/no-match search, selection, popout, State persistence, and multi-surface reload in a live DMS 1.6.2 session.
- [x] Confirm the current external registry's required metadata and submission process; see the upstream flow above.
- [ ] Complete target-host acceptance, prepare the required public screenshot, and finalize `compositors` / `distro` metadata.
- [ ] Review and submit the final listing PR to the registry; no fork, PR, or listing has been created.
- [ ] External publication: pending separate user authorization; none has been performed.

The registry-specific checklist remains open until host acceptance is complete,
the screenshot and support metadata are ready, and the listing pull request is
reviewed. No registry entry, registry push or pull request, or public listing
has been created as part of this work.
