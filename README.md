# Trellis DMS

Trellis DMS displays read-only Trellis project and task status in
DankMaterialShell (DMS). It discovers configured Trellis roots and shares one
snapshot across its plugin surfaces; it does not write Trellis project data.

## Candidate status

The manifest version is `1.0.0` and the minimum supported DMS version is
`1.6.2`. This is a **candidate**, not a stable release. Repository fixture and
static checks are recorded as passing, while required DMS 1.6.2 host checks
remain open for core lifecycle behavior and the retained Desktop, Simplified
Chinese, and `!trellis` Launcher surfaces. In particular, Launcher search and
selection have not yet been verified in the DMS Launcher UI.

As of 2026-09-25, no GitHub Release or DMS registry submission has happened.

The candidate manifest declares these DMS permissions: `settings_read`,
`settings_write`, and `process`. It does not declare network access. The
package includes a bar widget/popout, Desktop widget, Simplified Chinese
translations, and the optional Launcher trigger `!trellis`; these surfaces
remain subject to the host acceptance above.

## Install a candidate

1. When the GitHub pre-release is available, download its candidate ZIP and
   extract it. The archive contains `TrellisDms/`, `README.md`, and `LICENSE`.
2. Place the extracted `TrellisDms` directory at
   `$CONFIGPATH/DankMaterialShell/plugins/TrellisDms`. If `CONFIGPATH` is not
   set, the usual location is `~/.config/DankMaterialShell/plugins/TrellisDms`.
   Back up any existing plugin directory before replacing it.
3. Enable or reload **Trellis DMS** in DMS Plugin settings. Restart DMS if its
   plugin scanner does not pick up the directory change.
4. To try the candidate Launcher surface, open the DMS Launcher and enter
   `!trellis` in its search field. The trigger and its interactions have not
   completed host acceptance yet.

For local review, copy the repository's `TrellisDms/` directory to the same
plugin location. Configure one or more trusted Trellis project roots in the
plugin settings. An empty root list disables discovery.

## Disable or roll back

Disable Trellis DMS in DMS Plugin settings to stop the whole plugin. To roll
back a candidate update, restore the backed-up plugin directory (or install a
previous package version), then reload DMS. Remove any Desktop placement
separately if you want to remove only that visible surface while retaining the
rest of the plugin.

DMS stores plugin-owned state under the plugin ID `trellisDms`, including the
discovered-project cache and UI choices such as the selected project, pinned
task, collapsed groups, and archive month. This state is separate from Trellis
project files. Removing the plugin does not change Trellis data; whether DMS
automatically removes its saved plugin state on uninstall has not been verified.
If you choose to clear it, use DMS's supported cleanup for the `trellisDms`
plugin state only. Do not delete the whole DMS settings store.

## Distribution and project listing

After the candidate is merged to `main`, a matching `v1.0.0-rc.N` tag runs the
tagged-release workflow, which validates and packages a ZIP and creates a
GitHub **pre-release**. No tag or release has been created for this candidate.
The workflow does not submit the package to the DMS online plugin
registry/search list. Registry requirements and publication remain separate
and pending.

See [the v1.0.0 candidate notes](docs/releases/v1.0.0-candidate.md) and
[local registry readiness](docs/registry-readiness.md) for acceptance and
distribution details.
