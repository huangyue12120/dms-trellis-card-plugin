# v1.4 provider evidence baseline (planning, 2026-10-09)

This was the planning baseline for the v1.4.1 child task. The authoritative refreshed report is `.trellis/tasks/archive/2026-10/10-09-codeisland-provider-evidence-removed/research/activity-provider-evidence-2026-10.md`, which ends in `NO-GO`.

## Current upstream source

- Primary source inspected: <https://github.com/payprays/codeIsland-dms> on 2026-10-09.
- The repository describes a DankMaterialShell CodeIsland plugin for AI coding sessions on niri. Its README identifies `linux-skeleton/` as the source of live session data and describes a Unix-socket daemon, `snapshot.full`/`snapshot.patch` projection, provider grouping, and `interaction_respond` responses.
- The repository page currently exposes five commits, an MIT license, no release entries, and no packaged deployment evidence. The fetched page did not expose a pinned commit hash/date, so revision pinning remains a required child-task check.
- Documented socket paths are `$XDG_RUNTIME_DIR/codeislandd.sock` and `/tmp/codeisland-<uid>/codeislandd.sock` when the runtime directory is unavailable; a custom path is configurable in the plugin settings.
- README/source claims are not proof of a stable wire version, reconnect/backoff or patch-gap contract, daemon lifecycle ownership, production packaging, or compatibility with this plugin's target host.

## Current local shell

The planning shell on 2026-10-09 reported:

- `XDG_RUNTIME_DIR=/run/user/1000`.
- `/run/user/1000/codeislandd.sock`, `/tmp/codeisland-1000/codeislandd.sock`, and `/tmp/codeislandd.sock` were absent.
- `codeislandd` and `codeisland` were not on `PATH`.
- `rpm -q codeislandd code-island codeIsland-dms` reported all three packages not installed.

This is evidence about the current shell only, not proof about a separate graphical target session.

## Historical context to re-check, not reuse blindly

The archived v0.9.4 evaluation found no pinned production deployment, no verified live socket, no stable reconnect/version/gap contract, no preserved field-level schema, no demonstrated cwd-to-project or session-to-task mapping, and no reason to add hooks or collect prompt/tool payloads. The child task must look for substantive current changes rather than copying that decision.

## Required child report questions

| Area | Minimum evidence required | Safe default when absent |
| --- | --- | --- |
| Deployment | Installable daemon, owner, version/revision, target-host availability | `NO-GO`; no startup dependency |
| Protocol | Framing, schema/version, full/patch ordering, malformed/oversized behavior | No adapter |
| Reconnect | Backoff, reconnect, snapshot resync, patch-gap handling, stale semantics | Clear/stale provider state only |
| Lifecycle | Process ownership, shutdown, permissions, socket path/ACL | No daemon start or socket write |
| Mapping | Trusted project resolver and explicit task identity | `unmapped`/null, never guessed |
| Privacy/permission | Metadata-only, read-only, no payload/credential capture | Provider disabled |
| Support matrix | Provider/agent versions and runtime evidence | No advertised support |
| Failure isolation | Missing/malformed/disconnected provider leaves Trellis-only core healthy | Defer |

The child report recorded provenance for each row and ended with `NO-GO`. The missing deployment, pinned protocol, reconnect, mapping, privacy, and target-runtime evidence remain the conditions for reopening the gate.
