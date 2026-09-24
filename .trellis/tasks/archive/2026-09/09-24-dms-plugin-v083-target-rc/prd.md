# v0.8.3 target environment and release-candidate validation

## Goal

Determine whether the candidate installs, loads, reloads, disables, and behaves correctly on the user-selected Fedora 44 + Wayland + niri + DMS 1.6.2 target, then record a reversible RC state.

## Requirements

- Verify plugin discovery, manifest schema, permissions, requires_dms, no-project startup, bar/widget, popout, multi-bar/screen, reload, and disable cleanup.
- Check version warnings for the supported Trellis version and an unknown/newer version without hiding diagnostics.
- Record exact host versions and distinguish user-reported live evidence from checks independently observed in the development session.
- Produce RC change notes, known issues, tested environment, install/disable instructions, and rollback steps.
- Update the manifest to 0.8.0 only after the required preceding gates and release evidence pass. Preserve requires_dms >=1.6.1 unless direct evidence requires a justified change.

## Acceptance criteria

- [x] The target DMS 1.6.2 loads the plugin with no project configured and without startup failure (user-reported manual verification).
- [x] Installation, enable, reload, disable, and resource cleanup passed in the user's manual test suite on DMS 1.6.2; the report is not independently replayed in this session.
- [x] Multi-bar/screen and popout behavior passed in the user's manual test suite; static/offscreen evidence is kept separate.
- [x] Version/permission/unknown-Trellis warnings are covered by contract checks and the user-reported manual suite.
- [x] RC notes and rollback steps are complete; no known P0/P1 blocker remains in the recorded evidence. This does not mark the project v1.0-ready.

## Dependencies and out of scope

Depends on accepted 0.8.1 and 0.8.2 results and the v0.1.1 DMS API research. Do not install hooks, CodeIsland, external services, or add compositor-specific support beyond the roadmap.
