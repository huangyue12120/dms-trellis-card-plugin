# v1.3.1 Health Notification

## Goal

Implement an explicit opt-in notification for project/root Health transitions
without changing the shared Snapshot or observer boundaries.

## Background

The daemon already receives semantic `health_degraded` and `health_recovered`
events from `TrellisChanges.observeSnapshot`. Health projection and Recent
Changes provide the facts; this child adds only a bounded notification
projection and local DMS adapter.

## Requirements

- Add a persisted `notificationsEnabled` setting with default `false` and a
  Restore Defaults value of `false`.
- Consume only Health transition events. Do not notify task/session counts,
  warning ordering, mtimes, Markdown, or inferred Agent activity.
- Establish a quiet initial/restart baseline; notify a scope once on degraded,
  once on recovery after a corresponding degraded transition, and suppress
  repeated same-kind transitions during the cooldown.
- Use bounded, localized, privacy-safe text and argv-only local DMS notification
  execution. Do not expose raw roots, IDs, task content, or session pointers.
- Keep notification failures and disable behavior local to the adapter. Do not
  add Snapshot warnings, Trellis writes, network access, hooks, watchers, or
  manifest permissions.

## Acceptance Criteria

- [x] Pure tests cover quiet initial/restart, one degraded notification,
  duplicate degraded suppression, one recovery notification, duplicate
  recovery suppression, cooldown, disabled mode, bounded state, and input
  immutability.
- [x] Static checks prove settings default/reset/localization and exact argv
  notification execution.
- [x] Existing contract tests remain green and notification failure cannot block
  Snapshot publication.
- [ ] Supported DMS 1.6.2 host evidence verifies enabled/disabled behavior,
  degraded/recovered transitions, duplicate suppression, restart quietness, and
  failure isolation; unavailable host checks remain explicitly unverified.

## Out of scope

- Task/session/Markdown notifications, inferred activity, external push, custom
  notification UI, notification click routing, or Control Center integration.

## Dependencies and ownership

- Depends on the parent v1.3 design and existing v1.1 Health/v1.2 Recent
  Changes contracts.
- Owns `TrellisDms/lib/trellisnotifications.js`, daemon/settings/translation
  edits required for this feature, and focused test updates. Do not revert
  unrelated work already present in the shared workspace.
