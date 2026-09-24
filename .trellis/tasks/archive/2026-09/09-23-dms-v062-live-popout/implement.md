# v0.6.2 implementation plan

1. Extend the approved UI/state/component docs with State lifecycle, filter,
   pin, grouping, relationship-summary, and keyboard contracts.
2. Extend the pure popout projection with filter-before-cap behavior, fixed
   groups, bounded priority/relation/session views, pin flags, and invalid
   project-state fallback. Add duplicate-ID/cycle/cap fixtures.
3. Add widget-local State load/save/remove/sync helpers for only the two keys.
   Verify no `clearPluginState` or plugin-settings fallback is introduced.
4. Build All/per-project filter controls and pin/unpin task controls with DMS
   native focusable components. Thread only projection fields into row QML.
5. Render deterministic group headings, priority, relation summary, and
   session counts while retaining existing warnings/empty copy and scroll cap.
6. Run Node/static/resource/task checks plus available offscreen/live tests for
   filter, pin, reload, multi-widget sync, focus, and State debounce behavior.

## Validation commands

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
rg -n "clearPluginState|savePluginState|removePluginStateKey|pinnedTaskId|selectedProjectId" TrellisDms tests
python3 ./.trellis/scripts/task.py validate 09-23-dms-v062-live-popout
```

## Risk and rollback

- A State feedback loop can cause repeated writes; signal handlers load only
  and user actions save only when normalized values change.
- Filter before capping; otherwise a valid selected project can disappear.
- Roll back projection and Widget changes together. Never remove or clear the
  shared `discoveredProjects` State entry.
