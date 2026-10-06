# v1.1 Parent Execution Plan

The parent coordinates the four independently verifiable children; it is not an implementation target. Do not start the parent task itself.

## Ordered checklist

1. **1.1.1 Health/Freshness** — start and complete `.trellis/tasks/09-29-v11-health-freshness`; preserve raw warnings, add Snapshot v2 runtime metadata and the shared incident projection.
2. **1.1.2 Diagnostics** — after 1.1.1 is integrated, start `.trellis/tasks/09-29-v11-diagnostics`; add the plugin-wide Settings section and redacted, user-triggered copy.
3. **1.1.3 Desktop modes** — after 1.1.1 and 1.1.2, start `.trellis/tasks/09-29-v11-desktop-views`; add per-placement Overview/Tasks/Health projection and instance setting. Keep edits to `TrellisSettings.qml` sequential with 1.1.2.
4. **1.1.4 Host acceptance** — only after the first three children are complete, start `.trellis/tasks/09-29-v11-host-acceptance`; execute the host and regression matrix, prepare release notes, and update version only after required gates pass.
5. Reconcile every child result against this parent PRD, the source checklist in `PROJECT_PROGRESS.md`, and the v1.1 UI Gate. Record any blocked host item without claiming completion.

## Review gates

- The parent planning summary and `.trellis/tasks/09-29-v11-desktop-views/ui-gate.md` must receive explicit user approval before any child task is started.
- Start one child at a time. For implementation and quality review, dispatch the Trellis `trellis-implement` and `trellis-check` agents with prompts beginning `Active task: <child task path>`; agents must implement/review directly and must not recursively delegate.
- Do not start 1.1.4 or set package version `1.1.0` before its prerequisites and host acceptance pass.
- Preserve the pre-existing uncommitted `PROJECT_PROGRESS.md` change. Keep it out of task commits unless the user explicitly includes it in a later commit plan.
- Do not create a remote release, push, or publish a tag as part of local implementation. If a remote publication is requested, prepare it only after all acceptance evidence is complete and seek explicit approval for that external action.

## Validation plan

- Pure/static regression: `node tests/test_trellis_contract.mjs`.
- Structured files: `python3 -m json.tool TrellisDms/plugin.json` and `python3 -m json.tool TrellisDms/translations/zh_CN.json`.
- Diff hygiene: `git diff --check`.
- Trellis artifacts/context: `python3 ./.trellis/scripts/task.py validate <child-task-path>`.
- Run the contract test after each child and again as a full-scope pass before 1.1.4. Review static outputs separately from DMS host evidence.
- Execute real DMS/Wayland, restart, locale, two-placement, clipboard privacy, and v1.0 surface regression checks on the target host; record individual evidence and leave unavailable checks unverified.

## Risk and rollback points

- If Snapshot-v2 consumers or schema-1 compatibility fail, revert the schema/projection chunk before continuing.
- If clipboard output includes an unsafe field, remove that field from the allowlist and re-run privacy checks before host acceptance.
- If per-instance config fails across restart or mode changes trigger a scan, do not release; revert that UI preference change while retaining other accepted health improvements.
- Any failed mandatory host gate blocks release/version bump; record it for v1.1.x follow-up.
