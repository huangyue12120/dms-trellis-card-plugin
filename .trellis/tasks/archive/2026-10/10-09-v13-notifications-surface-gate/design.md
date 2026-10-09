# v1.3 Notifications and Surface Gate Design

## Boundaries

The existing daemon remains the only owner of filesystem discovery, Health
projection, Recent Changes observation, and notification side effects. Widgets,
Desktop, Launcher, and Settings remain projections or configuration surfaces;
none of them starts a scanner or notification process. The feature adds no
Trellis write, network permission, Agent hook, external push service, parser
field, or watcher.

The v1.3 parent integrates three children:

1. Health notification implementation.
2. Task Change product evaluation (`DEFER`).
3. Control Center product gate (`DEFER`).

## Health notification flow

```text
Snapshot scan/reload
        ↓
TrellisProjection.makeHealthProjection
        ↓
TrellisChanges.observeSnapshot
        ↓
recentChanges health transition events
        ↓
pure notification transition helper
        ↓ enabled + eligible transition
daemon-owned argv process → local DMS notification
```

`TrellisChanges` remains the semantic authority. The notification layer only
consumes `health_degraded` and `health_recovered` events, keyed by
`project_id`, with a separate bounded key for an unscoped/root incident. It
does not inspect raw warning messages, task/session records, Markdown, paths,
or file timestamps.

## Transition contract

Add a small pure helper (planned as `TrellisDms/lib/trellisnotifications.js`)
with a bounded state containing:

- `initialized`: first observation only establishes a quiet baseline;
- per-scope `active` state;
- per-scope last-notified timestamp by transition kind;
- bounded scope count and a fixed cooldown constant.

The helper receives the current state, a bounded event list, an enabled flag,
and an observation timestamp. It returns a cloned next state plus notification
requests. It never mutates the event list or Snapshot. It applies these rules:

- Initial/restarted observation is quiet.
- `health_degraded` sends once when a scope was previously healthy.
- Repeated degraded events while active send nothing.
- `health_recovered` sends only when the scope was active, then clears active.
- A same-kind transition inside the cooldown is suppressed while the state
  transition is still recorded.
- Disabled notifications still advance the in-memory baseline and produce no
  requests. Re-enabling does not replay an old incident.

The daemon resets this state with its lifecycle. This deliberately prevents a
restart from replaying an incident that was already present before the new
quiet baseline; persistence is not needed for the v1.3 contract.

## DMS adapter

The daemon adds a local notification adapter that consumes the helper's
bounded request. It launches the DMS CLI with an argv array equivalent to:

```text
dms notify <summary> <body> --app "Trellis DMS" --icon <icon> --timeout <ms>
```

The exact executable is resolved through the installed DMS/Quickshell process
contract or a fixed executable name; no shell string is built. Project names
and summaries are length-limited and sanitized for control characters. The
body contains only a localized Health transition summary and a direction to
open the existing Health/Diagnostics view. No click action is promised because
the installed plugin API exposes no stable outbound notification-action hook.

The adapter owns its one-shot process separately from scan processes. Exit
failure is logged or retained as local notification diagnostics only; it never
enters Snapshot warnings, changes Recent Changes, cancels a scan, or blocks
publication. Disabling the setting stops pending adapter processes where the
host allows it and prevents new requests.

## Settings and compatibility

Add `notificationsEnabled` to the existing plugin settings with a default of
`false`. It is read from the shared plugin data by the daemon and written by
the existing `PluginSettings` path. Restore Defaults writes `false`. Changing
this setting must not start a topology scan or alter any Snapshot field.

The existing manifest permissions remain exactly
`settings_read`, `settings_write`, and `process`; `network` is not added. The
manifest version remains the current candidate version until the release gate
has supported-host evidence. Release notes can describe a v1.3.0 candidate
without claiming stable publication.

## Product-gate conclusions

### Task Change Notification

The v1.2 event contract already provides bounded, passive observations with a
quiet initial/reload baseline and no inferred activity. There is no usage
telemetry or user evidence showing that `task entered archive` or `new active
task observed` merits active alerts. Record `DEFER`; do not add event consumers
or notification kinds.

### Control Center

The proposed Health summary, Recent Changes, and Diagnostics entry are already
covered by Desktop, Popout, and Launcher projections of the shared Snapshot.
There is no unique workflow, no required new projection, and no evidence that
another DMS surface would reduce navigation cost. Record `DEFER`; do not add
`ccWidget` properties, manifest components, or production QML. A future
approval must open a separate UI/Product Gate implementation task.

## Compatibility and rollback

Absent or malformed plugin data normalizes notifications to disabled. Missing
or failing notification executables leave the observer functional. Removing
the helper, adapter, setting, translations, and tests restores the prior
daemon publication path; the existing Snapshot schema and all core surfaces
remain unchanged.
