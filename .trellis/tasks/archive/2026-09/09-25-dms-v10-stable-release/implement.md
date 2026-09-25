# DMS plugin v1.0 stable release — implementation plan

## Ordered checklist

1. [ ] Review this plan and approve it before implementation. Start child `09-25-dms-v101-contract-freeze`; do not start the parent for implementation.
2. [ ] **1.0.1 contract freeze.** Compare current source/manifest/UI contracts with the v0.8 evidence and v0.9 decisions. Freeze the candidate metadata and optional-surface behavior; make only verified contract corrections.
3. [ ] **1.0.2 final acceptance.** Run contract/syntax/manifest/Trellis-context checks. Verify the safety and P0/P1 fixture/static matrix. Perform target DMS 1.6.2 checks for core and each retained optional item where a live session is available; record unavailable rows exactly.
4. [ ] **Optional-surface disposition.** If Desktop, zh_CN, or Launcher fails its host gate, disable/defer that item alone, document it, and rerun the core gate. Do not treat a pending host gate as passed.
5. [ ] **1.0.3 release handoff.** Update `TrellisDms/README.md`, local registry-readiness notes, a v1.0 release note, and `PROJECT_PROGRESS.md` from the final tested/disabled package contents.
6. [ ] Start the parent only for the cross-child integration review. Check the whole diff, task artifacts, manifest/docs consistency, and release checklist. Mark final release-ready only when required gates are resolved.

## Validation commands and evidence

- `node tests/test_trellis_contract.mjs` — contract and fixture suite.
- `node --check tests/test_trellis_contract.mjs` and `node --check` for every changed plugin-owned JavaScript helper.
- Parse `TrellisDms/plugin.json` and locale JSON as JSON; compare manifest fields and resource paths with the candidate contract.
- `python3 ./.trellis/scripts/task.py validate <task-dir>` and `task.py list-context <task-dir>` for the parent and each child before activation.
- `git diff --check` and full changed-file/diff review.
- Run `qmllint`/`qmlformat` only if already installed; record unavailable tools without installing them.
- Target-host DMS 1.6.2 checklist: no-project/configured-root load; core bar/popout; refresh/reload/disable cleanup; multi-bar/display if available; Desktop placement/resize; zh_CN/en locale; Launcher query/no-match/project/task selection/popout; multi-surface reload; bad/denied input recovery.

Fixture/static/offscreen checks do not establish live QML, IPC, timing, pointer, focus, display, or restart-persistence behavior. Attribute each host result to direct observation or a user report.

## Review and rollback points

- Review the v1.0 package contract after 1.0.1 and before any final acceptance claim.
- If a P0/P1 check fails, stop the release sequence and fix the originating v0.x contract with a focused regression check.
- If a P2 surface alone fails, remove or disable only that registration/catalog, note its post-v1 status, and repeat P0/P1 checks.
- Keep registry publication, push/deploy, DMS startup/replacement, and user-data edits outside this work.
