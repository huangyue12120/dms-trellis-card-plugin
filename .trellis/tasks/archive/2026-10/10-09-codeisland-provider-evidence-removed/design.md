# v1.4.1 Activity Provider Evidence Refresh — design

## Evidence table

Each required area gets a row with `question`, `evidence`, `provenance`, `observed_at`, `confidence`, and `gap`. The report must not merge static source claims with local runtime facts.

| Area | Required proof | No-proof behavior |
| --- | --- | --- |
| Deployment | Pinned Linux source/release, install path, daemon owner, target availability | `NO-GO`; do not start or package it |
| Protocol | Framing, message/schema version, full/patch ordering, bounds, malformed behavior | No adapter contract |
| Reconnect | Backoff, resubscribe, full resync, patch-gap detection, stale/clear state | Provider remains unavailable/stale |
| Lifecycle/ownership | Who starts/stops daemon, socket ACLs, shutdown and upgrade behavior | No plugin-owned process |
| Mapping | Safe project root and explicit task identity | `unmapped`/null; never guess |
| Privacy/permissions | Metadata-only, read-only, no payload/credential capture | Provider disabled |
| Support matrix | Agent/provider versions and direct runtime evidence | Do not advertise support |
| Failure isolation | Missing/disconnected/malformed provider leaves Trellis path healthy | Defer all runtime integration |

## Read-only probes

Allowed probes are source/document inspection, `command -v`, package-query commands, socket existence/type checks, and repository metadata reads. Do not connect to a socket, send protocol frames, install packages, start/stop processes, modify hooks/configuration, or create fixtures that could be mistaken for live evidence.

## Gate rule

`GO` requires sufficient evidence in every row plus an explicit statement that the future adapter can be opt-in, disableable, metadata-only, read-only, fail-open, and outside the Trellis Snapshot. Any missing deployment, protocol-version, reconnect, mapping, privacy, or failure-isolation proof is `NO-GO` under the v1.4 roadmap.

## Deliverable boundary

This task writes only the evidence report. It does not add a provider interface, socket client, QML, manifest/settings key, daemon, hooks, permissions, or release artifact. A future `GO` result may create a new child task, but no production implementation starts from this report.
