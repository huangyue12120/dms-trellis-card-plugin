# v1.3 Release / Defer Decision

## Implemented

Health notifications are implemented as an explicit opt-in, default-off
runtime projection. The implementation is bounded, current-generation only,
argv-only, privacy-safe, and isolated from Snapshot publication. Static and
fixture checks pass.

## Deferred

- Task Change notifications: `DEFER` ([gate record](../10-09-v132-task-change-gate/gate-decision.md)).
- Control Center surface: `DEFER` ([gate record](../10-09-v133-control-center-gate/gate-decision.md)).

The archived child gate records contain the source-backed evidence and exact
rejection/defer boundaries.

## Release status

Record this work as an unreleased `v1.3.0` candidate. Do not bump the manifest
from `1.0.0`, create a tag, submit to a registry, or claim stable publication:
the supported DMS 1.6.2 host gate is unavailable in this run. Popup delivery,
enabled/disabled runtime behavior, restart quietness, duplicate suppression,
recovery, and notification-process failure isolation remain **UNVERIFIED**.

The existing permissions remain `settings_read`, `settings_write`, and
`process`; no network, Trellis write, Agent hook, external push, scanner,
watcher, or Control Center surface was added.
