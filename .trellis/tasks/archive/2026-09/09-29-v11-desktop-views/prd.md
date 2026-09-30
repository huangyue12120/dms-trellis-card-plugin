# v1.1.3 Desktop Overview, Tasks, and Health Views

## Goal

Let each Desktop widget placement choose a focused Snapshot projection while all placements continue consuming the same daemon Snapshot.

## Requirements

- Support `Overview`, `Tasks`, and `Health` modes.
- Overview shows project count, active-task summary, and health summary using the current compact combined presentation.
- Tasks groups active tasks by project and shows title, display state, priority, and active session count; avoid large warning lists.
- Health shows healthy/degraded project summary, incidents, last successful scan, and last-good state; do not duplicate the full task list.
- Persist view mode per Desktop placement using the existing DMS per-instance config contract; separate it from global plugin settings.
- Changing the mode must not rescan. Multiple placements share one Snapshot and changing/removing one placement must not affect another.
- Preserve resize behavior and responsive layouts. Tasks with no active items and Health with no incidents need explicit empty/healthy states.
- Complete English and Chinese layouts.
- Desktop remains read-only and must not read `.trellis/`, add a parser, scanner, watcher, timer, or daemon.

## Acceptance Criteria

- Two placements can independently select Tasks and Health, survive DMS restart using the verified State/config contract, and remain independent when one is removed.
- Mode changes do not trigger filesystem work; both placements reflect the same Snapshot and recover/degrade together.
- Overview, Tasks, and Health have no severe overflow at minimum/default/larger dimensions and in both supported locales.
- Explicit empty, healthy, loading, degraded, and last-good states are present where applicable.

## Dependencies

- Depends on task 1.1.1 for incident/freshness projection.
- Reuses the v0.9 Desktop component, DMS per-placement config, and established responsive layout.
