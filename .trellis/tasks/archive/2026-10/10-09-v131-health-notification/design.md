# Health Notification Child Design

## Data flow

`TrellisDaemon.qml:_publishSnapshot` calls the existing
`TrellisChanges.observeSnapshot`, then passes only the returned bounded
`health_degraded` / `health_recovered` events to
`trellisnotifications.js`. The helper returns notification requests and a
bounded lifecycle state. The daemon publishes the Snapshot and Recent Changes
as before, then starts an isolated local DMS notification process for each
request.

The helper never reads files, accesses plugin settings, mutates a Snapshot, or
formats raw warning data. The daemon supplies the enabled setting and current
time; text formatting and argv construction stay in one adapter boundary.

## State and transitions

Use one state object per daemon lifecycle:

```text
{
  initialized: boolean,
  scopes: { [scopeKey]: {
    active: boolean,
    lastNotifiedAt: { health_degraded?: number, health_recovered?: number }
  } }
}
```

Scope keys are bounded project IDs, or one fixed `global` key for an unscoped
Health event. The helper caps scopes and timestamps. Initial input only sets
`initialized` and current active baselines. A disabled setting still advances
the baseline. Same-kind transitions inside the fixed cooldown are suppressed;
opposite-kind transitions retain their own timestamp and can be sent when
eligible.

## Adapter contract

The daemon builds a bounded summary/body from the event's display project name
and transition kind. It strips control characters and never includes project
roots, IDs, task titles, session keys, raw warnings, or Markdown. It invokes a
fixed local DMS executable with an argv list and tracks the short-lived process
outside scan ownership. Process exit errors are local logs only.

The setting is shared plugin data (`notificationsEnabled`) and defaults false.
No click action is attached because the installed DMS plugin API has no stable
outbound notification-action hook.

## Compatibility

If plugin data is absent or malformed, the daemon treats notifications as
disabled. If the DMS command cannot start or exits non-zero, the core observer
continues publishing. Daemon teardown stops owned notification processes.
