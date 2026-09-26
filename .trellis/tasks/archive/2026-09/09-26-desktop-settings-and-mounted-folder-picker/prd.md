# Desktop settings and mounted-folder picker

## Goal

Restore DMS's per-instance desktop display controls and let users explicitly reach mounted filesystem paths when adding trusted Trellis roots.

## Requirements

- In a desktop widget instance context, expose DMS's display selector with an all-displays default and per-instance persistence.
- Preserve DMS's standard position and size reset actions.
- Keep plugin-wide Trellis settings separate; instance-scoped DMS settings must not trigger global settings initialization, migration, reset, or writes.
- Add a picker-local route to the filesystem root so users can browse to `/run/media/<user>` and `/mnt/<mount>`.
- Add a trusted root only after the user selects it. Retain the current trusted-root cap, scan depth, canonical path handling, legacy setting fallback, and empty-list behavior.
- Do not infer a Codex workdir or auto-add any path.

## Acceptance criteria

- [ ] DMS instance settings show display selection and position/size reset controls.
- [ ] Display selection persists independently for two instances and leaves global plugin settings unchanged.
- [ ] Opening an instance settings card does not mutate plugin-wide settings or DMS plugin State.
- [ ] The picker provides a deliberate route to `/`; the user can select a concrete directory below `/run/media` and `/mnt`.
- [ ] Browsing without selecting does not change `scanRoots`; selecting adds only the selected/promoted project root.
- [ ] Empty `scanRoots` continues to disable discovery; no full-home, root, procfs, or all-mount scan is initiated automatically.

## Parent and sequencing

- Parent: `09-26-dms-desktop-trusted-root-discovery`.
- This child owns the settings surface and picker integration. Coordinate edits to `tests/test_trellis_contract.mjs` serially with the sibling archive-warning child.

## Out of scope

- Codex process/session autodiscovery, hooks, or automatic trust grants.
- DMS source changes or changes to Trellis project files.
