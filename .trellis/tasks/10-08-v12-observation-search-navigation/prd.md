# v1.2 Recent Changes, Search, and Read-only Navigation

## Goal

Deliver PROJECT_PROGRESS.md tasks 1.2.1–1.2.4 so users can understand recent observed Trellis changes and find or navigate to tasks and projects safely.

## Background

- The user approved creating a task tree and planning the entire v1.2 scope on 2026-10-08. Implementation approval follows review of the completed planning artifacts.
- The existing daemon is the single producer of the shared Snapshot. Archive data remains a separate, bounded, on-demand channel.
- The current manifest is 1.0.0; archived v1.1 work includes host checks explicitly recorded as unverified. v1.2 must retain those evidence boundaries.
- The existing uncommitted PROJECT_PROGRESS.md additions are the source roadmap and must be preserved.

## Requirements

- R1: Show deterministic Recent Trellis Changes from observed snapshots using bounded runtime-only history and honest degraded/recovery semantics.
- R2: Search project names, task titles, and task IDs across Live, Archive, and All scopes while preserving lazy, bounded archive access and project context.
- R3: Copy task IDs and canonical project/task paths, and open validated folders using the established safe resolver and local failures.
- R4: Verify v1.2 alongside v1.1 Health/Diagnostics and v1.0 core, record host evidence, and prepare or publish v1.2.0 only after the release gates pass.
- R5: Preserve the read-only observer, shared Snapshot, progress number-or-null, finite resource limits, and absence of new network behavior, Trellis writes, or agent hooks.

## Child Task Map

| Roadmap requirement | Child | Observable deliverable |
| --- | --- | --- |
| R1 / task 1.2.1 | [Recent Changes](../10-08-v12-recent-changes/prd.md) | Honest, bounded recent observed changes in the existing popout |
| R2 / task 1.2.2 | [Global Search](../10-08-v12-global-search/prd.md) | Project-qualified Live / Archive / All metadata results with honest partial coverage |
| R3 / task 1.2.3 | [Quick Actions](../10-08-v12-quick-actions/prd.md) | Verified identity/path copies and safe local folder navigation |
| R4–R5 / task 1.2.4 | [Acceptance and Release](../10-08-v12-acceptance-release/prd.md) | Regression/host evidence and a gated v1.2.0 release |

## Out of Scope

- Agent runtime activity, prompts, responses, tool payloads, notifications, persistent history, Markdown full-text indexing, independent databases, arbitrary-path launching, and Trellis management actions.
- Terminal/editor launching is deferred from this MVP; copy and open-folder actions meet the required roadmap scope.

## Acceptance Criteria

- [ ] R1: Identical snapshots create no duplicate event; reload establishes a quiet baseline; failures and recovery do not create false completion or task-recreation events.
- [ ] R2: Same-named tasks in different projects remain distinct; scopes and empty-query behavior are correct; archive limits and malformed data remain safe.
- [ ] R3: Clipboard values agree with visible identities; traversal, stale identities, and symlink escapes cannot launch a folder; failures remain local.
- [ ] R4: Regression and host matrices show pass/fail/unverified evidence separately; publication requires passing runtime and release gates.
- [ ] R5: No extra filesystem watchers, parser contamination, Trellis writes, network behavior, or new permissions.

## Decisions and Evidence Boundaries

- Extend the existing popout for history, search, and detail actions; preserve existing Theme and core surface behavior. The proposed interaction gate is in research/ui-interaction-plan.md.
- History is runtime-only. Metadata search exposes partial archive coverage; empty queries never initiate archive reads. Only explicit project-result selection changes the project filter; task detail navigation does not automatically pin.
- The source/spec/tool evidence is in research/implementation-evidence.md. Existing fixture/static baseline passes; DMS 1.6.2 is installed; qmllint and qmlformat are unavailable.
- Live clipboard, folder opening, keyboard/scroll, reload/restart, refresh, and multi-surface checks require host evidence. They remain release criteria even when tools/runtime are unavailable.
- This parent owns integration, while each child owns its feature acceptance. The user approved the final planning summary and all four child implementation plans on 2026-10-08; children may now be activated in the reviewed order.
