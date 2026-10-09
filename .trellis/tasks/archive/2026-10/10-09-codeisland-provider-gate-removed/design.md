# v1.4 Agent Activity Provider Experimental Gate — design

## Boundary

This parent task is a decision gate. Its only implementation surface is task-local evidence and release/defer documentation. No runtime provider, socket transport, daemon, hook, manifest permission, settings key, or QML surface is allowed before v1.4.1 returns `GO`.

The existing Trellis Snapshot, Recent Changes, Health, and notification contracts remain authoritative. Agent Activity is a separate future projection and must never be used to derive Trellis task status, progress, completion, deletion, or Health.

## Evidence model

The child task records separate rows for:

1. **Current upstream source** — URL, observed revision/date, license, files, documented protocol and install path.
2. **Current local shell** — executable/package/socket checks performed without installation, startup, or writes.
3. **Supported target runtime** — only direct host evidence or a clearly identified user-provided report; absence is not silently promoted to source capability.
4. **Inference/recommendation** — bounded conclusions derived from the first three categories.

The current upstream repository is useful source evidence but is not by itself proof of a released daemon, stable protocol, reconnect contract, or target-host availability. A missing or unpinned fact stays unknown.

## Decision gate

The child report must answer every required question and end with one result:

| Result | Meaning | Next task |
| --- | --- | --- |
| `GO` | Deployment, protocol, mapping, privacy, and failure isolation have sufficient evidence for a separately isolated experiment. | Create 1.4.2 only; 1.4.3 remains conditional on runtime validation. |
| `NO-GO` | Any required area is unverified, unstable, unsafe, or not deployable. | Do not create production provider/UI work; record a defer decision. |

The roadmap explicitly makes insufficient evidence `NO-GO`; there is no implicit compatibility default.

## Future contract constraints (not implemented here)

If a later gate is `GO`, a provider-neutral boundary should carry only bounded metadata such as provider, agent, opaque session identity, runtime state, observed time, and explicit project/task mapping status. Raw cwd is transient input only. Prompts, assistant text, tool arguments/results, credentials, permission text, and interaction responses remain outside persistence and the Trellis Snapshot.

The adapter must be opt-in, disableable, read-only, metadata-only, and fail-open. Provider disconnects or malformed envelopes must yield a visible provider-unavailable/stale state while leaving the Trellis-only core usable.

## Rollback

Rollback is limited to task-local planning/report files. The gate must not change external daemon state, agent configuration, socket state, Trellis data, or plugin runtime files.
