# Research: Activity Provider Evidence Refresh

- Query: Re-validate the Linux Agent Activity Provider for the v1.4.1 Go / No-Go gate.
- Scope: mixed; internal project/spec inspection, current upstream source inspection, and read-only local runtime checks.
- Date: 2026-10-09

## Decision summary

The current upstream Linux implementation is still explicitly described as a
runnable **Phase 0 reference skeleton**. It provides a useful Unix-socket
transport and source-level examples, but it does not establish a pinned,
packaged, target-host deployment or a versioned protocol contract. Its current
schema intentionally carries prompts, assistant text, tool input/output,
permission interactions, project paths, and terminal metadata. The current
source therefore does not satisfy this project's metadata-only, read-only,
privacy boundary.

The development shell has no daemon executable, package, process, or documented
socket. No user supplied target-host evidence or live provider session was
available. The checks below never connected to a socket, installed or started a
daemon, installed hooks, changed agent configuration, or modified external
runtime state.

## Evidence labels

- **Upstream/static**: claims and behavior read from the current public
  payprays/codeIsland-dms main source on the access date. The source URL is
  current, but a commit SHA/date was not exposed by the accessible pages; the
  old local commit is not reused as current evidence.
- **Local-shell**: observations from this development shell only. They do not
  prove what exists in a separate graphical target session or on another host.
- **Target-runtime**: a live Fedora/DMS/Wayland provider session, daemon, socket,
  deployment, or agent matrix. No such evidence was supplied or observed.
- **User evidence**: information supplied by the user about a target runtime.
  None was supplied for this gate.
- **Inference**: a bounded conclusion from the evidence, not a provider claim.

## Files found

### Internal project files

- PROJECT_PROGRESS.md:2101-2263 — v1.4 gate, conditional follow-up tasks,
  metadata/privacy boundaries, and the explicit rule that insufficient evidence
  is NO-GO.
- TrellisDms/plugin.json:1-23 — current Trellis manifest (1.0.0) with
  settings_read, settings_write, and process only; no provider/socket
  permission or dependency.
- TrellisDms/TrellisDaemon.qml:1-12,2759-2784 — the existing Trellis-owned
  Snapshot and Recent Changes publication path.
- TrellisDms/lib/trellischanges.js:1-12,64-110 — bounded Trellis runtime
  observation helper, separate from Agent Activity.
- TrellisDms/lib/trellisPaths.js:548-724 — canonical configured-root,
  task/session, and archive path policy.
- .trellis/spec/frontend/recent-changes-contract.md:5-11,154-223 — Recent
  Changes is Trellis data, not Agent Activity; optional consumers must be
  runtime-only and fail open.
- .trellis/spec/frontend/quality-guidelines.md:7-24,152-170,674-684 — the
  plugin is a read-only observer; static checks reject network/hooks/socket
  surfaces, while live host behavior remains a separate evidence gate.
- .trellis/tasks/archive/2026-09/09-24-dms-v094-activity-eval/research/activity-provider-evaluation.md — historical v0.9.4
  evidence and deferral; retained only as dated context.
- .trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/codeisland-linux.md — historical pinned Linux
  source inspection at f6143cecc61c5edd9c31bf4862ce48423fbdc975; not used as
  current source evidence.

### Current upstream source

- README.md — current Linux/DMS/niri widget overview, daemon-backed runtime
  model, socket paths, and source-copy installation:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/README.md:2-39
- linux-skeleton/README.md — Phase 0 reference-skeleton status, Python
  implementation, in-memory daemon, adapters, hooks, and tests:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/README.md:2-28
- linux-skeleton/README.md — source-run commands, optional config-writing hook
  installers, fail-open hook behavior, socket defaults, and unittest command:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/README.md:29-71,142-198
- linux-skeleton/codeisland_linux/protocol.py — socket path, event kinds,
  dataclass schema, JSON-lines framing, and payload serialization:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/protocol.py:10-139
- linux-skeleton/codeisland_linux/server.py — Unix-socket daemon, size and
  JSON validation, capabilities, subscriptions, write methods, socket modes,
  same-user credential check, and shutdown:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/server.py:18-114,157-246
- linux-skeleton/codeisland_linux/store.py — in-memory state, event sequence
  assignment, full-array patch payloads, and arbitrary activity payload
  forwarding:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/store.py:24-56,601-627
- CodeIslandWidget.qml — client line parsing, full-before-patch guard,
  reconnect timer, resubscribe, and disconnect reset:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/CodeIslandWidget.qml:112-169,294-344
- linux-skeleton/codeisland_linux/live_watcher.py — adapter-side
  refresh/stale intervals, session refresh, file replay, and retry-by-interval
  behavior:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/live_watcher.py:11-21,113-197
- linux-skeleton/codeisland_linux/opencode_adapter.py — cwd/database mapping,
  provider-local task IDs, prompts, tool payloads, and assistant summaries:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/opencode_adapter.py:84-181,316-398
- linux-skeleton/codeisland_linux/codex_adapter.py — Codex session metadata,
  prompt/assistant events, and line-based fallback task IDs:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/codex_adapter.py:58-114,412-509
- linux-skeleton/codeisland_linux/claude_adapter.py — Claude session metadata,
  prompt/assistant/tool-result events, and fallback task IDs:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/linux-skeleton/codeisland_linux/claude_adapter.py:57-100,428-530
- LICENSE — current upstream MIT license:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/LICENSE:0-18
- plugin.json — upstream widget manifest (0.1.0, DMS >=1.4.0, settings
  permissions), not a daemon package:
  https://raw.githubusercontent.com/payprays/codeIsland-dms/main/plugin.json:0

## Provenance and source freshness

- Current source was inspected from https://github.com/payprays/codeIsland-dms
  and its raw.githubusercontent.com main files on 2026-10-09.
- The accessible repository page exposes a small public repository and five
  commits, but the current page/raw URLs did not expose a commit SHA or commit
  date. The current revision is therefore **un-pinned** and cannot be treated
  as a stable protocol release.
- The current README calls linux-skeleton a runnable Phase 0 reference
  skeleton and says the Python runtime is used because the environment lacks a
  Swift toolchain. The README documents running Python modules from source,
  not a distro package, signed release, system service, upgrade policy, or
  supported Fedora deployment.
- The repository is MIT-licensed. No code was copied into this project.
- The macOS wxtsky/CodeIsland project was not used as Linux evidence. Its
  releases, hooks, and macOS support matrix cannot establish Fedora,
  Wayland/niri, DMS, or Linux daemon behavior.

## Read-only local checks

Commands were run in the project shell on 2026-10-09. Results:

| Check | Result | Scope / limitation |
| --- | --- | --- |
| date -Is, id -u | 2026-10-09T13:35:34+08:00, UID 1000 | Current shell only. |
| XDG_RUNTIME_DIR | /run/user/1000 | Current shell only. |
| command -v codeislandd | absent | Does not rule out an un-PATHed binary on another host. |
| command -v codeisland | absent | Does not rule out another installation/session. |
| command -v dms | /usr/bin/dms | DMS is present; this does not imply provider support. |
| rpm -q codeislandd code-island codeIsland-dms | all three packages not installed | RPM database only; no package installation was attempted. |
| test -S /run/user/1000/codeislandd.sock | absent | Documented canonical path; no socket connection attempted. |
| test -S /tmp/codeisland-1000/codeislandd.sock | absent | Documented UID fallback; no socket connection attempted. |
| test -S /tmp/codeislandd.sock | absent | Historical source fallback; no socket connection attempted. |
| ps -eo user,pid,comm filtered by process name | no matching process names | Process names only; current shell has no provider daemon. |
| historical checkout /tmp/trellis-dms-refs.jfDbfs/codeIsland-dms | absent | The 2026-09-17 checkout is gone; its SHA remains historical only. |
| systemctl --user service listing | command present; user-bus query failed with `Operation not permitted` in the restricted shell | No provider-specific unit evidence; this does not prove service absence. |

No local command contacted a provider socket or external daemon. The shell
does not constitute target-runtime or user evidence.

## Findings

### Deployment and installability

**Upstream/static:** The current README says to start the daemon with
python3 -m codeisland_linux.server, install optional adapters/hooks with
Python module commands, and symlink/copy the DMS widget into the DMS plugin
directory. The skeleton is explicitly Phase 0 and uses an in-memory daemon.
The inspected repository did not expose a pinned revision, distro package,
systemd unit, service owner, release artifact, upgrade contract, or target-host
installation proof. The raw linux-skeleton/pyproject.toml request did not
return an inspectable file; this is only a source-layout observation, not proof
that no packaging exists in an uninspected branch.

**Local-shell:** No daemon executable, package, process, or documented socket
exists in this shell.

**Inference:** There is no defensible claim that a supported Linux provider is
deployable on the selected Fedora/DMS target. Source-run instructions are not
deployment evidence.

### Protocol, framing, and schema stability

**Upstream/static:** protocol.py serializes newline-delimited UTF-8 JSON and
defines Session, Task, Interaction, and EventEnvelope records. The envelope
accepts an arbitrary payload object and has event_id, session_id, kind, ts,
optional task_id, and optional sequence. server.py limits an incoming line to
65,536 bytes, rejects malformed/non-object JSON, and returns RPC errors. The
client advertises a 16 MiB response reader limit.

ping advertises both read and write capabilities, including create_task,
cancel_task, retry_task, focus_session, interaction_respond, and ingest_event.
The subscription path sends snapshot.full; subsequent snapshot.patch messages
contain the complete current sessions/tasks/interactions/activities/state arrays
plus an event and sequence, rather than a documented interoperable patch
operation. The public code contains no protocol version, schema version,
capability version, compatibility range, signature, or negotiated field
allowlist.

**Inference:** JSON-lines and current source-level field names are observable,
but they are not a stable provider contract. An adapter cannot safely assume
future field shape, payload bounds, event-kind compatibility, or patch semantics.

### Reconnect, resubscription, and patch gaps

**Upstream/static:** The DMS QML client clears its snapshot and
hasFullSnapshot on disconnect/error, retries every 1,600 ms, resubscribes after
reconnect, and ignores snapshot.patch until a new full snapshot has arrived.
The daemon sends a full snapshot immediately for a new subscription. The
adapter-side watcher uses configurable polling (with 3-second daemon refresh
and 15-second stale scan defaults) and catches connection/OS/runtime errors
before sleeping for the next interval.

**Not established:** There is no documented exponential/backoff policy,
connection identity, replay cursor, last-sequence request, patch-gap detection,
server-side event history, protocol negotiation, or explicit stale/error
contract. The QML next_seq normalization is not a gap check, and the client
does not reject an out-of-order or skipped patch sequence. A new subscription
gets the current full snapshot, but no proof exists that the full snapshot is a
consistent recovery point for a missed provider event.

**Inference:** A future consumer could choose to discard state and require a
fresh full snapshot, but reconnect correctness and event completeness are not
proven by the current source. This fails the v1.4.1 reconnect gate.

### Lifecycle and process ownership

**Upstream/static:** server.py creates the parent directory, sets it to mode
0700, creates the Unix socket with mode 0600, serves until shutdown, closes
subscribers, and removes a socket only after checking that it is a socket owned
by the current user. It checks SO_PEERCRED and rejects peers whose UID does not
match the daemon UID. The DMS widget connects to an already running daemon; it
does not start, supervise, upgrade, or own that daemon.

The README documents separate source-run adapter/watch processes and optional
hook installers. It does not define a service manager, startup ordering,
shutdown/upgrade protocol, daemon version ownership, or cleanup policy for
adapter/watch processes.

**Local-shell/target-runtime:** No daemon or service was available to inspect.

**Inference:** Same-user socket ACLs are a useful local design detail, but they
do not answer who owns the daemon lifecycle or how the plugin behaves across
daemon upgrades, duplicate instances, stale sockets, or user-session restart.

### Project and task mapping

**Upstream/static:** The provider schema carries project_root and
current_task_id. OpenCode maps a database directory to project_root and creates
task IDs from provider message IDs. Codex and Claude derive task IDs from
provider records or line-based fallback helpers. These IDs are provider local;
the source does not define a Trellis project ID, .trellis root authority,
canonical-path check, mapping confidence, or explicit unmapped state.

**Internal contract:** trellisPaths.js accepts project roots only after
canonical validation and resolves task/session paths under the configured
project's .trellis/tasks or .trellis/.runtime/sessions tree. The existing
Recent Changes contract likewise keeps Trellis identities and observed facts
bounded and does not infer task completion from disappearance.

**Inference:** A provider cwd/project path cannot be displayed as a Trellis
project without a trusted-root resolution that is absent today. A provider
message ID, title, recency, session count, or line-number fallback cannot prove
the corresponding Trellis task. Ambiguous mappings must remain null/unmapped;
the current source does not supply that safe mapping contract.

### Permissions and privacy

**Upstream/static:** The current protocol and state model are not metadata-only:

- Session includes project_root, terminal identifiers, process IDs, and
  workspace hints.
- Task includes prompt, error text, and lifecycle fields.
- Interaction includes prompt_text, options, and answer_payload.
- EventEnvelope.payload is unrestricted. The activity kind allowlist includes
  prompt, tool-use, permission, question, assistant-response, and completion
  events.
- Derived state stores the last user prompt and last assistant message.
- The OpenCode, Codex, and Claude adapters read local databases/transcripts or
  JSONL and forward prompt, assistant, tool input, tool result, error, and
  permission-related data. The optional hook bridges consume provider event
  stdin and can write Codex/Claude configuration files.

The server also exposes write-capable RPC methods and the QML plugin sends
approval/question responses. The README documents hook installation into
~/.config/opencode, $CODEX_HOME/hooks.json/~/.codex/hooks.json, and
~/.claude/settings.json.

**Internal contract:** The Trellis roadmap forbids prompt/assistant/tool
payload persistence, credential capture, automatic agent configuration, and
provider startup dependency. The current manifest has no provider permission;
the project quality contract rejects network/hooks/socket surfaces and writes
to Trellis data.

**Inference:** A future adapter could filter the upstream stream, but no
current upstream proof shows that raw prompts, tool I/O, permission text, and
credentials are never exposed or required. The current source demonstrates the
opposite data flow. Privacy and permission evidence is therefore insufficient
for GO.

### Agent/provider support matrix

**Upstream/static:** The Linux README names live/replay support for OpenCode,
Codex, and Claude Code, and the source contains corresponding adapter and hook
modules. Its board-demo fixture also names Gemini, but the README describes
that as synthetic fixture input rather than a verified live adapter. The
upstream DMS widget manifest says version 0.1.0 and requires DMS >=1.4.0; it
does not provide agent-version, daemon-version, Fedora-version, or Wayland/niri
compatibility bounds.

**Target-runtime/user evidence:** No provider executable, daemon, agent build,
live session, or target host matrix was supplied or observed. The macOS
CodeIsland project and its release history are explicitly out of scope for
Linux support claims.

**Inference:** “OpenCode/Codex/Claude files exist in the repository” is not a
supported production matrix. The v1.4 gate cannot advertise agent support.

### Failure isolation and Trellis-only behavior

**Upstream/static:** The upstream QML client renders an offline/session-list
state and clears provider state when disconnected; this is a client-side
projection behavior, not a tested integration with this Trellis plugin. The
README says hook commands skip when the daemon is unavailable so the provider
can fall back to native agent behavior, but no target runtime exercised that
path.

**Internal/static:** This repository contains no CodeIsland/provider/socket
implementation or provider settings. TrellisDaemon.qml publishes the existing
Trellis Snapshot and Recent Changes independently. Recent Changes is explicitly
not Agent Activity, and the quality contract requires missing live host checks
to remain unverified rather than treating source checks as runtime proof.

**Inference:** The current Trellis-only core is unaffected because no provider
integration exists. That absence is a safe present-state boundary, not evidence
that a future adapter will fail open. A future adapter would need an explicit
disabled/unavailable/stale/error state, bounded decoding, no Trellis health
pollution, and proof that provider failure cannot block daemon startup or
Snapshot publication.

## Gate requirements to reopen

Before reconsidering 1.4.1, collect all of the following against a pinned
upstream revision and the selected target host:

1. A reproducible Linux package/source revision, daemon startup owner, install,
   upgrade, shutdown, stale-socket, and socket-ACL procedure.
2. A versioned protocol document or equivalent compatibility tests covering
   JSON framing, envelope/schema bounds, full/patch ordering, capability
   negotiation, malformed messages, sequence gaps, resubscription, and fresh
   full-snapshot recovery.
3. A direct mapping proof that canonicalizes provider cwd under one configured
   trusted Trellis root and maps only explicit provider task IDs; ambiguous
   mappings must remain unmapped.
4. A metadata-only privacy review and fixtures proving prompts, assistant text,
   tool input/output, permission text, credentials, raw cwd, and arbitrary
   payload fields are rejected or discarded before UI/state publication.
5. A versioned OpenCode/Codex/Claude (and any other claimed agent) support
   matrix with direct target-runtime evidence, not only source modules or
   synthetic fixtures.
6. A target-host fail-open test proving that disabled, absent, malformed,
   disconnected, stale, and provider-process-failure states leave the
   Trellis-only Snapshot, Health, Recent Changes, and startup path functional.

No follow-up adapter, provider setting, hook, permission, socket client, or UI
task is authorized by this report.

## Caveats / Not Found

- The current main branch could not be pinned to a SHA through the accessible
  upstream pages; all current-source claims are mutable branch evidence.
- No public deployment package, signed Linux release, system service, or
  target-host installation proof was found in the inspected source/README.
- No protocol version, schema version, patch-gap contract, reconnect/backoff
  contract, or server-side replay/resume contract was found.
- No live daemon/socket was available; no socket was contacted, and no external
  daemon or agent process was started.
- `systemctl`, `rg`, and `grep` are present in the shell, but the restricted
  user-bus query returned `Operation not permitted`; no provider-specific unit
  evidence was obtained. Socket checks, command lookup, RPM lookup,
  process-name inspection, and source reads completed; service-manager state
  remains unknown.
- The local shell is not the selected target graphical session. No user/target
  evidence was supplied to close that gap.
- Historical v0.9.4 conclusions were not reused as current proof; they only
  identify the earlier evidence gaps and the old unpinned runtime absence.

## Gate result

NO-GO
