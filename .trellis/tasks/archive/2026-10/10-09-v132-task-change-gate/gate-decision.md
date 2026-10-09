# Task Change Notification Gate

## Decision

`DEFER`

## Evidence

- `TrellisDms/lib/trellischanges.js` already exposes bounded semantic events for
  task discovery/status/state changes, session changes, archive items, and
  health transitions.
- The v1.2 contract keeps initial and reload observations quiet, retains
  reliable baselines through read failures, and never infers completion or
  Agent activity from task disappearance.
- The existing Recent Trellis Changes view provides passive, project-qualified
  inspection without adding interruption or persistence.
- This repository has no usage telemetry or user evidence showing that
  `task entered archive` or `new active task observed` deserves an active alert.

## Evaluation

`task entered archive` overlaps with the existing archive observation and risks
claiming a workflow completion when the observer intentionally does not infer
completion from disappearance. `new active task observed` is useful as passive
history but is likely noisy during discovery, reload, and multi-project scans.
Neither candidate has a demonstrated urgency threshold or a distinct recovery
action that the current Popout/Desktop surfaces cannot provide.

Therefore no notification consumer or new event kind is justified in v1.3.
Per-watcher events, session-count changes, inferred activity, Markdown/task
content, and workflow-engine behavior remain rejected out of scope. Revisit
only with concrete usage evidence and a new product review.
