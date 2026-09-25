# DMS v1.0.2 final acceptance — implementation plan

## Ordered checklist

1. [x] Read the frozen candidate summary and curated acceptance context; confirm task 1.0.1 is complete.
2. [x] Run `node tests/test_trellis_contract.mjs`; preserve the printed state-matrix evidence labels and result count.
3. [x] Check JavaScript syntax (using a temporary copy without QML's `.pragma library` directive where direct Node parsing is unsupported); parse `plugin.json` and `translations/zh_CN.json`; check exact-case QML imports/resources and permission declarations.
4. [x] Re-run the disposable fixture/static safety and integration coverage: traversal, external absolute path, symlink escape, stale/malformed pointers, Markdown allow-list/size, task/session limits, archive separation, progress `null`, one Snapshot publisher, no surface file readers/network/hooks.
5. [x] Check available QML lint/offscreen tooling; tools/harness were unavailable and this limitation is recorded without installation or substitution claims.
6. [ ] Execute the target DMS 1.6.2 checklist for core and retained P2 surfaces in a permitted live GUI session. Record date, environment, check, result, evidence class, and any report attribution in `acceptance-evidence.md`.
7. [x] No isolated P2 failure was observed because host checks were unavailable; this conditional disable/defer path remains pending any future host result.
8. [x] Run `git diff --check`, validate this task's Trellis context, and review the candidate for scope/security regressions.

## Commands

```text
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
node --check TrellisDms/lib/trellisPaths.js
node --check TrellisDms/lib/trellisParser.js
node --check TrellisDms/lib/trellisprojection.js
node --check TrellisDms/lib/trellisdiscovery.js
node --check TrellisDms/lib/trellisWatch.js
python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-25-dms-v102-final-acceptance
git diff --check
```

Run QML/runtime commands only if available in the intended environment. Do not describe the Node/static commands as live DMS evidence.

## Rollback

- P0/P1 failure: stop, preserve reproduction/evidence, and fix the owning v0.x behavior before rerunning this gate.
- P2-only failure: remove its optional manifest registration or zh_CN catalog, document the deferral, and verify the remaining package still loads through the core gate.
- If any required core host check remains unverified, retain candidate status and do not proceed to a final release claim.
