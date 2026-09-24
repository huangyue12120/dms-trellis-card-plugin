# v0.7.3 Settings and State execution plan

## Ordered checklist

1. Load the project frontend specs and parent/child contracts. Freeze key
   names, defaults, normalization caps, migration behavior, and reset scope in
   pure tests before editing QML.
2. Add pure settings/State normalization helpers where reuse is justified;
   avoid scattering mode/default validation across Settings, daemon, and
   widget.
3. Update `TrellisSettings.qml` with `pillMode` migration, visibility toggles,
   restore-defaults action, and bounded error/safety copy. Preserve roots,
   interval, remembered cache, manual refresh, and permission behavior.
4. Extend `TrellisWidget.qml` State loading/sync/persistence and collapse,
   archive-month, visibility, version-warning, and reset interactions without
   adding file/process access or namespace-wide State clearing.
5. Add pure/static/offscreen/state-matrix fixtures for migration, invalid
   settings/state, key-scoped reset, two-widget convergence, empty/error/
   degraded recovery, and no-progress fabrication.
6. Run the complete v0.7 suite and report target-host persistence/focus gates.

## Validation

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
python3 ./.trellis/scripts/task.py validate 09-23-dms-v073-settings-state
```

Also run the installed-module offscreen harness for Settings/Widget and, when
available, a DMS session that changes each setting, opens archive/detail,
reloads two widgets, and exercises restore defaults. The observed DMS State
async disk-write error must be retained as a limitation if it recurs.

## Risk and rollback

Risk is concentrated in settings migration and shared State persistence. Keep
the v0.6 two-key path as the fallback behavior and revert new settings/state
bindings as one child set if a host API differs. Never call `clearPluginState`
or delete user data broadly.
