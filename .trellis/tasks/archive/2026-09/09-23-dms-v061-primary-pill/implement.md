# v0.6.1 implementation plan

1. Update the approved UI/state/component docs with the primary policy, State
   keys, invalid-preference behavior, and session-recency semantics.
2. Extend session parsing with validated nullable `lastSeenAt`; add fixtures
   for valid/invalid/missing values and preserve every existing session field.
3. Add project-qualified pin token helpers and `selectPrimary()` to the pure
   projection module. Cover each priority branch and deterministic tie-break.
4. Thread optional UI State through `makePillProjection()` without breaking
   existing callers. Update labels/icons/extra counts from selected primary.
5. Do not add State I/O, project filters, or pin buttons; child 0.6.2 owns all
   preference wiring and interaction controls.
6. Run Node contracts, syntax/manifest/resource checks, task validation, and
   available offscreen/live reload tests. Inspect all changed paths for scope.

## Validation commands

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
node -e 'JSON.parse(require("node:fs").readFileSync("TrellisDms/plugin.json", "utf8"))'
python3 ./.trellis/scripts/task.py validate 09-23-dms-v061-primary-pill
```

## Risk and rollback

- Reject invalid timestamp/pin input locally; do not change Snapshot readiness.
- Multi-widget State synchronization must not create save/change loops.
- Roll back parser, projection, widget, docs, and tests together if the QML
  helper signature or reload path regresses.
