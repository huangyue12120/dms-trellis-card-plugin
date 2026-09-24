# DMS v0.9 optional P2 enhancements — implementation plan

## Ordered work

1. [x] **Review this plan.** The user approved all four roadmap items and the implementation scope; child tasks were activated after their planning artifacts and UI gates were reviewed.
2. [x] **0.9.4 activity evaluation.** The bounded feasibility report and defer recommendation are archived. No external daemon or hooks were installed or run.
3. [x] **0.9.1 desktop UI gate.** The user approved the state matrix/component contract before the all-project projection and optional component were implemented over the shared Snapshot.
4. [x] **0.9.3 Launcher UI gate and surface.** The user approved the `!trellis` states, query fields, selection-to-pin behavior, and no-widget fallback before implementation. The Launcher component/trigger and local registry-readiness documentation are in place.
5. [x] **0.9.2 i18n.** Plugin-owned interface strings use the DMS translation API; the `zh_CN` catalog covers core, desktop, and Launcher source strings. The compatibility floor is `>=1.6.2`.
6. [x] **Parent integration.** Local compatibility/install metadata is complete, `plugin.json` is `0.9.0`, and `PROJECT_PROGRESS.md` records delivered work and pending runtime evidence.
7. [x] **Combined static review.** The full worktree diff, JSON, JS syntax, task context, translation source/placeholders, and Launcher read-only boundary have been checked. [ ] Target DMS/Wayland runtime gates remain pending and are not represented as passed.

`0.9.4` is independent of the three UI/localization children; it is ordered first because it is a bounded research-only deliverable. `0.9.2` follows the surface implementations so its coverage includes their final strings. Registry publication and provider implementation remain outside the parent.

## Validation commands and evidence

- Task artifacts: `python3 ./.trellis/scripts/task.py validate <child-task>` and `python3 ./.trellis/scripts/task.py list-context <child-task>` before starting each child.
- Manifest: parse `TrellisDms/plugin.json` as JSON and validate against the installed DMS 1.6.2 `plugin-schema.json`; check component/trigger/capability/permission compatibility.
- Projection and integration: `node tests/test_trellis_contract.mjs` with fixtures for all-project caps, project/task launcher filtering, stale IDs, and existing State semantics.
- Translation: parse every locale JSON; inventory all plugin-owned QML strings; inspect fallback and locale-change behavior under the target DMS.
- QML: run `qmllint`/`qmlformat` if available; load the desktop and launcher components in the offscreen DMS harness if present.
- Target runtime: on the selected DMS 1.6.2 host, verify desktop placement/resize/multiple displays and disable; Launcher query/selection with and without a bar widget; live locale switching; plugin reload and one-daemon/multiple-surface lifecycle.
- Provider evaluation: record source/runtime evidence and limits in the task report; absence of the socket is a valid evaluated outcome, not a test failure.

The automated test suite was not run for this implementation turn. Static checks do not replace the pending DMS/Wayland host checks listed above.

If a tool/runtime is unavailable, record exactly which gate remains unverified. Do not substitute static checks for DMS/Wayland behavior.

## Review and rollback points

- Review each desktop/Launcher UI contract before its final surface implementation.
- Keep the manifest at 0.8.0 until all selected child deliverables and compatibility checks pass. If one surface fails, remove only that optional surface entry and keep the previous version while the issue is resolved.
- Registry readiness is local-only. Do not push, publish, or submit to the external registry.
- On any regression, remove the optional manifest component and its new files; preserve the daemon, current Snapshot contract, user State, trusted roots, and Trellis files.
