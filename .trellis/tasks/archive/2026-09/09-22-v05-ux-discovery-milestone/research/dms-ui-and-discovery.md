# DMS UI and discovery research

## Verified installed DMS 1.6.1 APIs

- `PluginComponent.qml` exposes `horizontalBarPill`, `verticalBarPill`,
  `popoutContent`, `popoutWidth`, `popoutHeight`, and pill click actions. When
  `popoutContent` exists, the default click toggles `PluginPopout`.
- `PluginPopout.qml` focuses its container on open and closes on Escape.
- `SelectionSetting.qml` persists a labelled string option through plugin
  settings.
- `FileBrowserModal.qml` supports `folderMode: true`, emits a cleaned local
  path, and manages focus when opened.
- `PluginSettings.qml` exposes DMS Settings and State access. State is written
  to the plugin's own state JSON and is separate from user-visible settings.
- `BasePill.qml` is pointer-driven. It has no plugin-facing accessible-name or
  keyboard-activation property in this installed version.

## Existing plugin facts

- `TrellisWidget.qml` currently renders one full English count sentence and has
  no popout, which explains the observed no-op click.
- `TrellisSettings.qml` exposes one `projectRoot`, interval, and refresh button.
- `TrellisDaemon.qml` already runs bounded argv-only `find` at depth 4, limits
  projects/tasks/sessions/output/warnings, canonicalizes paths, and accepts an
  array through `TrellisPaths.normalizeRoots` even though settings currently
  supply a string.
- The v0.4 Snapshot already contains all project/task/session and warning facts
  needed for a small read-only popout.

## UI/UX Pro Max targeted results

- Compact labels should stay on one line, bound unpredictable text, and expose
  full information without relying on hover only.
- Badges should remain static unless they own an action; state must not rely on
  color alone.
- Icon-only interactive controls need an accessible name. Since the DMS host
  pill lacks that plugin hook, the limitation must be documented instead of
  pretending QML content can fix it.
- Keyboard focus must remain visible and follow visual order. Popout errors need
  a recovery step, and empty states need useful guidance rather than blank space.
- Use one icon family and avoid emoji as UI icons.

## Decisions

- Native DMS Material Symbols and Theme only.
- `auto` default plus five explicit alternatives.
- One minimal popout, not a rich task-detail UI.
- User-selected trusted roots, never zero-configuration whole-home scanning.
- Remembered projects are bounded state/cache and are revalidated; they are not
  trusted inputs to discovery.
