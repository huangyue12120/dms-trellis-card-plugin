# v1.2 Popout Interaction Plan

Status: approved UI gate, covered by the user's final planning approval on 2026-10-08. The existing DMS Theme, sizing, controls, and shell Escape behavior remain authoritative.

## Placement and navigation

- Extend the existing popout only; no new desktop mode, Launcher behavior, Control Center surface, or manifest capability.
- Add a labeled search field near the top of the normal popout, with clear control and Live / Archive / All scope buttons. Default scope is Live.
- A non-empty query temporarily replaces the task list with search results. Clearing it cancels archive work and restores the current project/task projection immediately.
- Global means all currently trusted discovered projects, independent of the current project filter.
- Show separate Live and Archive result groups in All mode. Project name accompanies every task result; include task ID so equal titles remain distinguishable.
- Project result selection uses the existing project-filter action. Task result selection opens existing live/archive detail. Neither task selection nor searching automatically changes the pin.
- Add a Recent Changes entry to open a bounded history view headed “Recent Trellis Changes”. Back returns to the prior projection. Data events and UI selection events have distinct text.
- Put copy/open-folder controls in project headers and task detail, including archive detail. Use an Actions disclosure if controls would exceed the available width.

## Honest feedback

- History is session-only; the empty state explains that observations begin after the initial baseline.
- Show before/after status or count only when supported by reliable observations. Do not describe task absence as completed/deleted or expose prompt/tool content.
- First archive-page observations are quiet. A later archive event reads “Archive item newly observed”, not “Task completed”.
- Archive search shows loading, examined-count, partial coverage, continue, no-match-within-coverage, errors, and terminal caps explicitly.
- A query/scope change clears obsolete results and ignores old callbacks. A superseded request ends local loading and offers retry.
- Copy/open controls show pending state while validating. Clipboard completion requires successful process exit. Folder open reports accepted/failed launch request, not proof that a file-manager window appeared.
- Failed actions use bounded local text and leave snapshot/health facts intact.

## Keyboard, layout, and localization

- Native focusable controls keep visual and tab order aligned; show focus indicators.
- Tab and Shift-Tab reach query, scope, clear, result actions, continuation, Back, and quick actions. Return/Space activate buttons; host Escape retains its existing close behavior.
- Return in the input may move focus to the first result using the native text-field accepted signal. Do not replace host shortcuts or introduce a global shortcut.
- The existing screen-clamped popout and one vertical scroll region remain. Focused results must be scrolled into view; labels elide, while explanatory/error copy wraps.
- Preserve DMS Theme colors, spacing, icons, and existing 40-logical-pixel native control targets; no new animation, fonts, or palette.
- Add English source strings and zh_CN translations in the owning feature tasks.

## UX evidence

A targeted ui-ux-pro-max query, `keyboard search focus navigation --domain ux`, returned Keyboard Navigation, Focus States, and Focus Not Obscured guidance. Apply native focus visibility and sensible traversal; web-specific CSS examples do not apply to QML. Exact keyboard/scroll behavior remains a host check.

## UI acceptance

Search and history are reachable without a pointer; focus remains visible at narrow and normal widths; same-named tasks retain project context; clearing search restores the prior view; partial archives never present a complete no-results claim; detail Back preserves the originating query/history view; copy/open failure remains local.
