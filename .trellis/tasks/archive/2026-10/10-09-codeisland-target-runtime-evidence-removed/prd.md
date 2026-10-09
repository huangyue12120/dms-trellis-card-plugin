# v1.4.1 Target Runtime Evidence Collection

## Goal

Collect direct, reproducible evidence from the current Fedora/DMS/Wayland
host for the deferred Linux Agent Activity Provider gate. Close only the gaps
that this host can actually demonstrate, preserve the existing `NO-GO` result
when provider evidence is absent, and leave the Trellis plugin and external
runtime unchanged.

## Confirmed facts

- Current shell reports Fedora Linux 44 Workstation, Linux 7.2.8, UID 1000,
  Wayland session `wayland-1`, `XDG_CURRENT_DESKTOP=niri`, and niri 26.04.
- `/usr/bin/dms`, `/usr/bin/niri`, `systemctl`, and `loginctl` are installed;
  `codeislandd` and `codeisland` are not in `PATH`.
- The current process namespace shows no `dms`, `niri`, or CodeIsland process;
  the user-systemd query is blocked by the restricted shell's
  `Operation not permitted` error. This may be a namespace/permission limit,
  not proof that the graphical host has no running DMS.
- `/run/user/1000` contains Wayland/niri and DMS-related runtime artifacts, but
  no CodeIsland socket was observed. Existing archived environment evidence
  reports DMS 1.6.1, Quickshell 0.3.1, Qt 6.11.2, and no live DMS IPC.
- The upstream revision/source/test evidence and original/revalidation reports
  already exist; this task adds host-specific evidence rather than repeating
  source research.

## Requirements

- Record host identity, OS, kernel, Wayland/compositor, DMS/Quickshell/Qt,
  Trellis, package ownership, agent/provider binaries, processes, documented
  sockets, and service-manager state with exact read-only commands and dates.
- Determine whether this shell can access the selected graphical DMS runtime;
  distinguish namespace/permission blocks from verified absence.
- If a provider daemon/package/session is already present, collect only
  non-sensitive metadata: version, owner, socket metadata, service owner,
  protocol handshake/capabilities if safely readable, and controlled
  reconnect/failure observations.
- Keep source-test, local-shell, and target-runtime evidence separate.
- Re-evaluate deployment, protocol, reconnect, lifecycle, mapping, privacy,
  support matrix, and fail-open blockers against the new host evidence.
- Do not add provider code, settings, manifest permissions, socket clients,
  hooks, agent configuration, persistence, network services, or Agent Activity
  UI.

## Safety boundary

- Default scope is read-only host inspection and non-invasive runtime checks.
- Do not install packages, start/stop/restart daemons, install hooks, modify
  agent configuration, send interaction responses, or capture prompt/tool
  payloads without a separate explicit authorization.
- Do not connect to a provider socket merely to prove it exists; socket type,
  owner, mode, and path metadata are sufficient unless the user explicitly
  authorizes a protocol probe.
- Redact tokens, prompt text, assistant text, tool I/O, credentials, and raw
  project paths from task evidence.

## Acceptance criteria

- [x] A task-local host evidence report records commands, timestamps, scope,
      outputs, and limitations for Fedora/DMS/Wayland and provider presence.
- [x] Every v1.4.1 blocker is classified as `closed`, `partially evidenced`,
      `target-runtime required`, or `not available` after this host pass.
- [x] Any namespace/permission limitation is explicitly separated from a
      verified absence claim.
- [x] No product/runtime/provider configuration is changed and no sensitive
      activity payload is persisted.
- [x] The final disposition remains exactly `GO`, `NO-GO`, or
      `TARGET-RUNTIME-BLOCKED`; absent provider evidence maps to `NO-GO` for
      product work.
- [x] If blockers remain, the report lists the smallest concrete next evidence
      packet and keeps v1.4.2–v1.4.4 deferred.

## Decision resolved

The user authorized read-only, non-invasive host inspection and, if an already
running provider socket is found, non-sensitive version/owner/handshake
metadata only. Installation, startup, restart, hooks, configuration changes,
interaction responses, and prompt/tool payload capture remain out of scope.
