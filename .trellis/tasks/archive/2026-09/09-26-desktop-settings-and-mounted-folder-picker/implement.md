# Implementation plan

1. Inspect all `TrellisSettings.qml` initialization, listeners, child defaults, and save/reset paths; define a clear global-versus-instance branch.
2. Add DMS instance metadata to the settings component and ensure only the matching settings view is active in each context.
3. Add DMS's display selector and position/size reset actions to the desktop instance view; persist `displayPreferences` on that instance only.
4. Add a picker-local `Computer`/filesystem-root quick access entry when the DMS file browser content is created. Keep the explicit selection callback and current trusted-root validation.
5. Add focused contract assertions and update relevant UI documentation. Preserve existing global settings and trusted-root copy.
6. Review the diff, run the existing contract suite and available QML checks, then exercise both Settings contexts and mounted navigation in DMS 1.6.2. Mark runtime checks unverified if unavailable.

## Validation cases

- Two desktop instances retain independent display preferences, including an instance set to one display and another set to all displays.
- Position and size can each be reset from the instance card.
- Opening, changing, and closing instance settings does not alter global `pillMode`, trusted roots, topology interval, or plugin State.
- Global Trellis Settings still load, save, refresh, and restore defaults as before.
- The file browser starts at its usual path, exposes `/`, reaches `/run/media` and `/mnt`, and adds no root until the user selects a concrete folder.
- Existing empty-root, root-cap, task promotion, and canonical-root behavior remains intact.

## Host acceptance update (2026-09-26)

- The first comparison found that the installed plugin's `TrellisSettings.qml`
  and `translations/zh_CN.json` were older than the workspace versions. After
  the user copied the updated files and fully restarted DMS 1.6.2, the user
  confirmed the desktop display settings and picker navigation to `/run/media`
  and `/mnt` work.
- This confirms the reported UI regressions, but the conversation did not
  separately verify two-instance persistence, global-settings isolation,
  geometry reset effects, or the trusted-root list before and after selecting
  a folder. No host logs were captured.

## Rollback

Revert the settings-context and picker changes plus their tests/docs. Do not remove or rewrite stored DMS instance config.
