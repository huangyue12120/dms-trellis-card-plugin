# v0.8.3 target environment and release-candidate validation

## Goal

Determine whether the candidate installs, loads, reloads, disables, and behaves correctly on the roadmap's Fedora 44 + Wayland + niri + DMS 1.6.1 target, then record a reversible RC state.

## Requirements

- Verify plugin discovery, manifest schema, permissions, requires_dms, no-project startup, bar/widget, popout, multi-bar/screen, reload, and disable cleanup.
- Check version warnings for the supported Trellis version and an unknown/newer version without hiding diagnostics.
- Record exact host versions. Current DMS 1.6.2 is useful compatibility evidence but is distinct from the specified 1.6.1 target.
- Produce RC change notes, known issues, tested environment, install/disable instructions, and rollback steps.
- Update the manifest to 0.8.0 only after the required preceding gates and release evidence pass. Preserve requires_dms >=1.6.1 unless direct evidence requires a justified change.

## Acceptance criteria

- [ ] The target DMS loads the plugin with no project configured and without startup failure.
- [ ] Installation, enable, reload, disable, and resource cleanup have live evidence, or each unavailable item remains explicitly unverified.
- [ ] Multi-bar/screen and popout behavior have real runtime evidence; static/offscreen checks are not substituted.
- [ ] Version/permission/unknown-Trellis warnings are accurate and bounded.
- [ ] RC notes and rollback steps are complete, and the candidate is not marked v1.0-ready while a P0/P1 runtime blocker remains.

## Dependencies and out of scope

Depends on accepted 0.8.1 and 0.8.2 results and the v0.1.1 DMS API research. Do not install hooks, CodeIsland, external services, or add compositor-specific support beyond the roadmap.
