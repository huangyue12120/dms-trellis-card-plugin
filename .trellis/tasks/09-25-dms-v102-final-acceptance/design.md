# DMS v1.0.2 final acceptance — design

## Verification layers

| Layer | What it establishes | What it cannot establish |
|---|---|---|
| Disposable fixtures / pure helpers | Parser, Snapshot, projection, resolver, and bounded queue semantics | QML rendering, host timing, DMS IPC, or physical display behavior |
| Static source / manifest checks | Resource boundaries, permissions, exact imports, lifecycle contracts, and component declarations | Successful component load or real reload cleanup |
| Offscreen runtime (if available) | QML construction against installed modules in that harness | Real Wayland placement, DMS IPC, pointer/focus, or restart persistence |
| Target DMS 1.6.2 host | The observed UI/API/lifecycle behavior exercised in that session | Untested configurations or earlier DMS versions |
| User-reported host evidence | Reported target behavior, attributed to the user | Independent reproduction or details not included in the report |

Keep these categories distinct in `acceptance-evidence.md` and the progress table.

## Acceptance coverage

- Core: project discovery/empty state; all live task/session and status cases; refresh/topology; project filtering and primary selection; Settings/State; Markdown/archive lazy reads; degraded recovery; safe path and resource bounds; bar/popout/reload/disable behavior.
- Desktop: discoverable placement, resize/scroll, empty and warning state, shared Snapshot updates, and disable behavior.
- Locale: DMS locale switch zh_CN ↔ English, catalog fallback, and layout/readability for long localized strings.
- Launcher: `!trellis` empty/query/no-match states, project/task results, selected project/pin, popout behavior with/without a bar widget, and no filesystem/process side channel.
- Combined lifecycle: one daemon and coherent Snapshot across retained surfaces, reload, and disable.

Any failure in P0/P1 blocks release and routes to the owning v0.x task. Any isolated P2 failure disables or defers that item and triggers a focused repeat of the core integration checks.

## Execution environment

The planning host has DMS 1.6.2 installed but no running DMS/Quickshell process; `qmllint` and `qmlformat` are unavailable. Run non-invasive repository checks locally. Do not launch DMS or replace an installed copy under this task. Capture target-host results from an already available DMS session or from the user's explicit manual test report; otherwise leave those rows `UNVERIFIED` and keep final release status pending.
