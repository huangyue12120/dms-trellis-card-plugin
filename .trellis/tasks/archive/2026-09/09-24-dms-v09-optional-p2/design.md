# DMS v0.9 optional P2 enhancements — design

## Task structure and ownership

The parent task owns the v0.9 scope, cross-surface design review, final manifest/version integration, progress record, and combined release-candidate review. Four child tasks own independently verifiable work:

1. `09-24-dms-v091-desktop` — optional all-project desktop overview.
2. `09-24-dms-v092-i18n` — DMS-managed zh_CN localization with English source fallback.
3. `09-24-dms-v093-launcher-registry` — `!trellis` Launcher and local registry readiness; no Control Center surface.
4. `09-24-dms-v094-activity-eval` — feasibility report only; no provider runtime.

Child tasks do not imply ordering. The ordered dependencies are recorded in the parent and child `implement.md` files. The three tasks that affect shared `plugin.json` are executed serially; the parent alone owns the final `0.9.0` version bump and integration record.

## Data flow and boundaries

```text
Trellis roots → existing daemon/parser/resolver → schema-1 Snapshot
                                            ├→ existing Bar + popout
                                            ├→ optional Desktop projection
                                            └→ optional Launcher search results
```

- Keep the daemon as the only discovery/reader/watcher owner. Snapshot schema, path resolver, progress semantics, archive/detail channels, and P0/P1 behavior stay unchanged.
- Desktop and Launcher read `PluginGlobalVar("snapshot")`; pure bounded display/search logic belongs in `trellisprojection.js` or a plugin-local projection helper, not in a surface's filesystem code.
- Desktop uses `DesktopPluginComponent`, receives the shared snapshot, and presents all snapshot projects in a scrollable overview. DMS registers plugin desktop widgets as available user-placed widgets; no automatic desktop placement is added.
- Launcher uses the DMS launcher contract. Choosing a project saves `selectedProjectId`; choosing a task saves that project and the existing project-qualified `pinnedTaskId`. It then requests `BarWidgetService.triggerWidgetPopout("trellisDms")`. If no bar widget is present, saved state remains valid and the launcher must fail quietly rather than claim that a popout opened.
- Localization uses the DMS plugin translation table with literal `I18n.trFor("trellisDms", "English source")` calls and `TrellisDms/translations/zh_CN.json`. English remains the source/fallback. Language selection and live reload follow DMS; no second plugin locale setting is introduced.
- Activity remains outside production data flow in v0.9.4. The task produces an evaluation report and a future contract recommendation only.

## User-approved product decisions

- Desktop: overview all projects, active-task summaries, and bounded warnings.
- i18n: follow the active DMS locale; zh_CN translations with English fallback.
- Launcher: `!trellis`, search project names/task titles, and navigate read-only. Selecting a task replaces the current pin and opens the existing popout.
- Surface selection for 0.9.3: Launcher only. Control Center is deferred.
- Registry: prepare local metadata/documentation; external publication is excluded pending separate confirmation.
- Activity: feasibility evaluation only. No hooks, agent configuration edits, daemon install, prompts, or tool I/O collection.

## Compatibility and resource limits

- The locally selected target is DMS 1.6.2 / Quickshell 0.3.1 / Qt 6.11.2. DMS plugin surfaces, translation support, and navigation APIs are documented in `research/v09-platform-apis.md`.
- Confirm the minimum DMS version for `I18n.trFor` and the launcher-to-popout API before changing `requires_dms`. Keep the 1.6.1 minimum only if the required API is verified there; otherwise raise it to the lowest evidenced compatible version and document the change.
- Respect existing limits: at most 32 projects per Snapshot, 128 tasks per project, 8 popout warnings, bounded names/titles, one shared daemon. Desktop may scroll through all Snapshot projects but must not multiply filesystem work; Launcher results need a separate explicit result cap.
- Add no permissions, processes, network calls, hooks, sockets, or Trellis writes for the first three child tasks.

## Design gates and failure behavior

- Before desktop or Launcher final QML is written, add their states and interactions to the UI state matrix/component contract and present the concrete UI contracts for user approval.
- Desktop loading, unconfigured/empty, no-active-task, healthy warning, version warning, and degraded-last-good states preserve the same semantics as the existing popout. Removing the desktop placement or optional manifest component leaves the core usable.
- Launcher query/no-match/empty-snapshot/stale-result/state-save/no-widget cases use the host's empty/error behavior or bounded copy. Invalid or stale IDs cause no State change; unavailable popout does not affect Trellis data or daemon health.
- Missing zh_CN entries fall back through the DMS catalog to English. Unknown Trellis statuses, user titles, Markdown, project paths, and IDs are not translated or rewritten.
- Activity evaluation reports the missing local socket/daemon as evidence, not proof about a different live graphical session. If protocol or mapping evidence is insufficient, recommend defer.

## Rollback

- Desktop and Launcher can be disabled independently by removing their optional manifest entries and QML resources; no persisted Trellis data is touched.
- Localization can fall back to English by removing/ignoring the plugin translation table and retaining English source strings.
- The activity evaluation is a documentation-only deliverable. It changes no runtime state.
- If integration checks fail, keep the previous manifest version and omit the failing optional surface entry. Do not delete or rewrite user Trellis data or publish a registry release.
