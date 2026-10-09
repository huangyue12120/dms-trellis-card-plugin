# v1.4.1 Target Runtime Evidence — 2026-10-09

## Scope and authorization

This report records the user-authorized, read-only target-host collection for the
deferred Linux Agent Activity Provider gate. The checks covered the current
Fedora/DMS/Wayland host and used elevated access only for read-only host package,
service, IPC, process, path, and manifest metadata. No provider installation,
startup, restart, hook/configuration change, socket write, interaction response,
or prompt/tool payload capture was performed.

The result adds real DMS host evidence, but it does not create CodeIsland
runtime evidence: no CodeIsland package, daemon, process, or documented socket
was found in the queried target package, executable, process, and socket-path
surfaces. This is not a claim about host-wide absence outside those surfaces.

## Collection provenance

The read-only verification window ran from `2026-10-09T15:21:55+08:00` through
`2026-10-09T15:24:16+08:00`. The following commands were executed against the
target-visible shell; their summarized results are reported below. The
user-systemd query, DMS IPC query, and target process table were also repeated
under approved elevated read-only execution because the ordinary sandbox could
not access the host buses/process namespace.

```text
date --iso-8601=seconds
cat /etc/os-release | sed -n '1,4p'
uname -srmo
id -u
rpm -q dms dms-cli quickshell niri qt6-qtbase qt6-qtdeclarative qt6-qtwayland
niri --version
quickshell --version
trellis --version
codex --version
claude --version
systemctl --user show dms.service niri.service --no-pager -p ActiveState -p SubState -p MainPID -p FragmentPath -p UnitFileState -p ExecMainStartTimestamp
dms ipc call plugins list
ps -eo user=,pid=,comm= | awk '$3 == "dms" || $3 == "niri" || $3 == "codeislandd" || $3 == "codeisland" || $3 == "opencode" || $3 == "claude" || $3 == "claude-code" || $3 == "codex" {print}'
rpm -qa | grep -Ei '(^|[-_.])(codeisland|code-island)([-_.]|$)'
command -v codeislandd
command -v codeisland
stat -c '%A %U:%G %F %n' /run/user/1000/codeislandd.sock /tmp/codeisland-1000/codeislandd.sock /tmp/codeislandd.sock
sha256sum TrellisDms/plugin.json "$HOME/.config/DankMaterialShell/plugins/TrellisDms/plugin.json"
```

The CodeIsland package, executable, and socket commands returned no matching
entry; missing-path diagnostics were recorded as absence at the documented
paths. `dms --version` is not a supported command in this host image, so the
DMS version is taken from the RPM query (`dms-1.6.3-1.fc44`) and the active
service/process identity.

## Evidence classes

- **Target-runtime:** successful elevated reads from the host user-systemd,
  DMS IPC, process, package, and runtime-artifact surfaces.
- **Local-sandbox:** ordinary shell reads; process and user-bus visibility is
  restricted and cannot establish host absence.
- **Source-test:** prior upstream checkout/tests; not repeated or promoted here.
- **Inference:** bounded gate conclusions from the evidence above.

## Host identity and versions

| Check | Result | Evidence scope |
| --- | --- | --- |
| Distribution | Fedora Linux 44 Workstation | Target-runtime read-only /etc/os-release |
| Kernel/architecture | Linux 7.2.8-200.fc44.x86_64, x86_64 | Target-runtime |
| Session/compositor | Wayland; XDG_CURRENT_DESKTOP=niri; WAYLAND_DISPLAY=wayland-1; niri 26.04 | Target-runtime environment and binary |
| DMS | dms v1.6.3; bundled version 1.6.3 | Target-runtime |
| Quickshell / Qt | Quickshell 0.3.1; Qt 6.11.2 | Target-runtime |
| Trellis | 0.6.17 | Target-runtime command/project metadata |
| Package ownership | dms-1.6.3-1.fc44, dms-cli-1.6.3-1.fc44, quickshell-0.3.1-8.fc44, niri-26.04-1.fc44 | Target-runtime RPM query |

## DMS service and plugin evidence

The elevated read-only user-systemd query reported:

    dms.service: ActiveState=active, SubState=running, MainPID=107227
    FragmentPath=/usr/lib/systemd/user/dms.service
    UnitFileState=enabled
    ExecMainStartTimestamp=Thu 2026-10-08 20:48:41 CST

    niri.service: ActiveState=active, SubState=running, MainPID=107121
    FragmentPath=/usr/lib/systemd/user/niri.service
    UnitFileState=static
    ExecMainStartTimestamp=Thu 2026-10-08 20:48:40 CST

Read-only PID verification found:

    107227 yue dms  /usr/bin/dms run --session
    107121 yue niri niri --session

The DMS runtime socket /run/user/1000/danklinux-107227.sock exists with mode
600 and owner yue:yue; niri's Wayland socket also exists. These are DMS and
compositor artifacts, not CodeIsland provider sockets.

The read-only DMS IPC command dms ipc call plugins list reported:

    trellisDms [loaded]
    appLauncher [loaded]
    clipboardPlus [loaded]
    dankRssWidget [loaded]
    materialWeather [loaded]
    nvidiaGpuMonitor [loaded]
    screenCaptureToolbar [loaded]

The installed Trellis manifest at
$HOME/.config/DankMaterialShell/plugins/TrellisDms/plugin.json matches the
project TrellisDms/plugin.json byte-for-byte. Both have SHA-256
ef648b2340d6aac63dfe45774a27c5539d128414000c163a9a677c46b7da8362 and declare
requires_dms >=1.6.2. This proves host loading of the existing Trellis plugin,
not provider integration.

## Provider and agent evidence

| Surface | Result | Classification |
| --- | --- | --- |
| CodeIsland RPM/binary | No matching RPM, codeislandd, or codeisland in target checks | Target-runtime verified absence in queried package/path surfaces |
| CodeIsland process | Target ps count 0 for codeislandd and codeisland | Target-runtime verified absence in visible process table |
| CodeIsland sockets | /run/user/1000/codeislandd.sock, /tmp/codeisland-1000/codeislandd.sock, and /tmp/codeislandd.sock absent | Target-runtime verified absence at documented paths |
| OpenCode | RPM 2.0.24 installed; no opencode command in PATH; desktop entry points to /opt/OpenCode/ai.opencode.desktop; no active opencode process | Installed-agent presence only |
| Codex | codex-cli 0.162.0; four target codex app-server/CLI processes visible | Agent presence, not CodeIsland integration |
| Claude | 2.1.295 (Claude Code); no active claude/claude-code process | Installed-agent presence only |

No provider activity payload, configuration content, prompt, assistant text, tool
input/output, or permission answer was read.

## Sandbox and namespace limitations

Without elevation, systemctl --user, loginctl, DMS IPC, and ss were blocked by
Operation not permitted; the ordinary process namespace showed only the Codex
sandbox. Elevated read-only queries confirmed DMS/niri service state and target
PIDs, so the earlier sandbox result must not be interpreted as DMS absence.

No CodeIsland socket was found, so no provider handshake, protocol version,
capability negotiation, reconnect, sequence-gap, or payload-bound probe was
possible. No provider was installed or started to manufacture that evidence.

## Evidence delta against v1.4.1 blockers

| Blocker | New target-host evidence | Evidence classification | Remaining gap classification |
| --- | --- | --- | --- |
| Deployment/revision | Fedora target, DMS/niri package ownership, active service units, and DMS plugin loading are verified. CodeIsland deployment is absent. | **Partially evidenced** | **target-runtime required** for provider package/service owner, upgrade, and stale-socket procedure |
| Protocol/version/bounds | No provider daemon/socket exists to probe; previous source-level JSON evidence remains the only protocol evidence. | **Not available** | **not available** |
| Reconnect/patch gaps | No provider transport is running; no live drop/resubscribe/sequence test can be performed. | **Not available** | **target-runtime required** |
| Lifecycle/ownership | DMS/niri ownership and active state are verified; no CodeIsland owner exists on this host. | **Partially evidenced** | **target-runtime required** for provider lifecycle and duplicate/upgrade behavior |
| Project/task mapping | Existing Trellis plugin is loaded, but no provider session or provider-local task ID is present. | **Not available** | **target-runtime required** |
| Privacy/permissions | Host loading does not constrain upstream prompt/tool/permission payloads or hook writes. | **Not available** | **not available** |
| Agent support matrix | DMS/niri and installed OpenCode/Codex/Claude versions are recorded; only Codex processes are visible and none is linked to CodeIsland. | **Partially evidenced** | **target-runtime required** for claimed live provider/agent matrix |
| Failure isolation | Existing Trellis plugin loads while CodeIsland is absent; no provider adapter exists in this project to exercise failure states. | **Partially evidenced** | **target-runtime required** for disabled/absent/malformed/disconnected/stale/provider-crash integration tests |

No blocker is closed by this host pass. The DMS host/service/plugin portions are
now directly evidenced; provider-specific protocol, mapping, privacy, support,
and fail-open portions remain open.

## Concrete next evidence packet

To advance beyond NO-GO, collect only after a supported CodeIsland deployment
exists:

1. Package/service metadata for the exact pinned provider revision, including
   install, upgrade, rollback, shutdown, stale-socket, and owner procedures.
2. A non-sensitive protocol handshake recording provider/protocol/schema
   version, capabilities, bounds, and compatibility behavior.
3. A controlled test that drops the provider transport, skips a sequence, and
   verifies full resubscription recovery without silent state loss.
4. Mapping fixtures for trusted .trellis roots, explicit provider task IDs,
   outside-root paths, and ambiguous cases that must remain unmapped.
5. Metadata-only privacy fixtures proving prompt, assistant, tool, permission,
   credential, raw-cwd, and arbitrary-payload fields are discarded before
   state/UI publication.
6. A versioned OpenCode/Codex/Claude matrix with live target sessions and
   provider ownership.
7. A Trellis integration fail-open test for disabled, absent, malformed,
   disconnected, stale, and provider-process-failure states, asserting that
   startup, Snapshot, Health, and Recent Changes continue normally.

## Safety statement

This collection performed read-only host/package/service/IPC/process checks only.
It did not install or start a provider, modify DMS or agent configuration,
install hooks, write a socket, send an interaction response, persist activity
payloads, or edit product/runtime code.

No 1.4.2, 1.4.3, or 1.4.4 provider production surface is authorized.

## Final disposition

NO-GO
