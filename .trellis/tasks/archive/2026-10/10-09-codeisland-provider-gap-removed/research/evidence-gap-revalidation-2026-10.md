# v1.4.1 Evidence Gap Revalidation — 2026-10-09

## Scope and decision

This follow-up re-checks the eight blockers in the original v1.4.1 Linux
Agent Activity Provider gate. It adds a current upstream revision check, a
temporary source checkout, source-level tests, and read-only checks in the
current development shell. It does not install, start, connect to, or configure
the provider.

The new evidence improves revision and source-behavior provenance, but it does
not establish a packaged deployment, a target Fedora/DMS/Wayland runtime, a
versioned compatibility contract, safe Trellis mapping, metadata-only privacy,
or fail-open behavior inside this plugin. The original product gate therefore
remains closed.

## Evidence labels

- **Upstream-pinned:** read-only inspection of the public repository at the
  exact `main` revision recorded below.
- **Source-test:** tests executed against that checkout. These prove source
  behavior only; they do not prove a target-host service or integration.
- **Local-shell:** observations from this development shell only.
- **Target-runtime:** evidence from a live Fedora/DMS/Wayland/niri host,
  provider daemon, socket, or agent matrix. None was supplied or observed.
- **Inference:** a bounded conclusion derived from the preceding evidence.

## Provenance and freshness

### Upstream revision

On 2026-10-09, the following read-only command was run against the upstream
repository (network access required an approved elevated read-only request):

```text
git ls-remote https://github.com/payprays/codeIsland-dms.git HEAD refs/heads/main 'refs/tags/*'
f6143cecc61c5edd9c31bf4862ce48423fbdc975	HEAD
f6143cecc61c5edd9c31bf4862ce48423fbdc975	refs/heads/main
```

No tag ref was returned. A depth-one checkout was then created outside the
project at `/tmp/codeisland-dms-evidence-20261009`:

```text
git rev-parse HEAD
f6143cecc61c5edd9c31bf4862ce48423fbdc975
git show -s --format='%s%ncommit date: %cI' HEAD
Retry live watcher daemon reconnects
commit date: 2026-05-13T18:01:55+08:00
git tag --list
(empty)
```

The [upstream releases page](https://github.com/payprays/codeIsland-dms/releases)
also reports that there are no releases. The source checkout is therefore
repeatable by SHA, but there is still no versioned release, signed artifact,
distribution package, or upgrade/support policy.

The inspected source is MIT-licensed. Relevant source/test paths are in the
checkout under `linux-skeleton/` and include `protocol.py`, `server.py`,
`store.py`, `live_watcher.py`, the OpenCode/Codex/Claude adapters and hooks,
`CodeIslandWidget.qml`, and `linux-skeleton/tests/`.

### Source-level test evidence

The documented command was run from the temporary checkout:

```text
cd /tmp/codeisland-dms-evidence-20261009/linux-skeleton
python3 -m unittest discover -s tests -v
Ran 111 tests in 0.115s
FAILED (failures=1, errors=40)
```

All 40 errors were the same environment restriction while tests attempted to
bind a Unix socket:

```text
PermissionError: [Errno 1] Operation not permitted
```

The one failure was an environment-sensitive terminal identity assertion:
the test expected `WezTerm`, while the shell exposes Ghostty variables. It is
not a provider protocol or Trellis integration result. A non-socket selection
covering store, fixtures, activation, adapter translation, hook translation,
hook installation, and plugin installation ran 71 tests successfully after
removing only the shell's Ghostty detection variables:

```text
env -u GHOSTTY_RESOURCES_DIR -u GHOSTTY_BIN_DIR \
  python3 -m unittest tests.test_store tests.test_fixture tests.test_activation \
  tests.test_codex_adapter.CodexAdapterTests \
  tests.test_claude_adapter.ClaudeAdapterTests \
  tests.test_codex_hook.CodexHookAdapterTests \
  tests.test_codex_hook.CodexHookInstallTests \
  tests.test_claude_hook.ClaudeHookAdapterTests \
  tests.test_claude_hook.ClaudeHookInstallTests \
  tests.test_opencode_plugin.OpenCodePluginInstallTests -v
Ran 71 tests in 0.028s
OK
```

These are useful source checks, but the Unix-socket server tests could not
execute in this restricted shell and no elevated socket test was attempted.
No upstream test result is promoted to target-runtime evidence.

## Read-only local-shell checks

The following observations were collected on 2026-10-09:

| Read-only command | Result | Limitation |
| --- | --- | --- |
| `date -Is; id -u` | 2026-10-09; UID `1000` | Current shell only. |
| `printf '%s\n' "$XDG_RUNTIME_DIR"` | `/run/user/1000` | Current shell only. |
| `command -v codeislandd; command -v codeisland` | Both absent from `PATH` | Does not rule out another host or un-PATHed installation. |
| `ps -eo user,pid,comm` filtered by exact process name | No `codeislandd` or `codeisland` process | Process-name check only. |
| `test -S /run/user/1000/codeislandd.sock; test -S /tmp/codeisland-1000/codeislandd.sock` | Both documented sockets absent | No socket was contacted. |
| `rpm -q codeislandd code-island codeIsland-dms` | No matching CodeIsland package | RPM query only; no install was attempted. |
| `systemctl --user list-units --all --no-legend` | `systemctl` exists, but exits 1 with `Operation not permitted` | User-bus state is unknown; this is not proof of service absence. |

The local shell is not evidence of a separate graphical target session. No
target-host or user-provided runtime evidence was available.

## Evidence delta by blocker

| Original blocker | New evidence | Evidence classification | Remaining gap classification | Remaining risk |
| --- | --- | --- | --- | --- |
| Deployment and revision | Current `main` is pinned to `f6143ce…`; source is runnable and reproducible by SHA. No tag, release, package, service unit, or target-host install was found. | **Partially evidenced** | **target-runtime required** | Deployment owner, upgrade/rollback, stale-socket handling, and supported target installation remain unverified. |
| Protocol, version, and bounds | `protocol.py`/`server.py` source shows newline JSON, request-size checks, malformed-object rejection, event fields, and same-user socket credentials; non-socket source tests pass. | **Partially evidenced** | **not available** | No protocol/schema version, compatibility range, negotiated field allowlist, signature, or stable release contract; payload is extensible and RPC includes writes. |
| Reconnect and patch gaps | QML resets state, waits 1,600 ms, resubscribes, and requires a full snapshot; watcher retries on intervals. | **Partially evidenced** | **target-runtime required** | No replay cursor, sequence-gap/out-of-order check, patch history, or proof that a resubscription snapshot is a consistent recovery point. Socket tests were sandbox-blocked. |
| Lifecycle and ownership | Server source creates 0700/0600 paths, checks same-user credentials, and removes owned sockets; widget does not own daemon startup. | **Partially evidenced** | **target-runtime required** | No service manager, startup owner, duplicate-instance policy, upgrade/shutdown contract, or target runtime ownership evidence. |
| Project and task mapping | Source carries `project_root` and provider-local task IDs; adapter tests exercise provider translation. | **Partially evidenced** | **target-runtime required** | No canonical `.trellis` root resolution, Trellis project/task identity, mapping confidence, or explicit unmapped contract. |
| Privacy and permissions | Source tests and adapters demonstrate prompts, assistant text, tool data, permission/question payloads, paths, process metadata, and hook/config writes. | **Not available** | **not available** | The observed data flow conflicts with the project's metadata-only/read-only boundary; no filtering proof or permission review closes it. |
| Agent support matrix | Current source names OpenCode, Codex, and Claude adapters/hooks and their source tests; Gemini is synthetic fixture input. | **Partially evidenced** | **target-runtime required** | No agent/daemon/Fedora/DMS/Wayland/niri version matrix or live target evidence. |
| Failure isolation | README and source contain unavailable-daemon hook fallbacks and client offline reset behavior. | **Partially evidenced** | **target-runtime required** | No test through this plugin proves disabled/absent/malformed/disconnected/stale provider states leave Trellis startup, Snapshot, Health, and Recent Changes untouched. |

Residual-gap labels required by the task are: deployment/revision,
reconnect/patch gaps, lifecycle/ownership, project/task mapping, agent support
matrix, and failure isolation are **target-runtime required**;
protocol/version/bounds and privacy/permissions are **not available**. No
blocker is **closed**. The table's **Partially evidenced** label records the
source-level progress before that target-runtime or unavailable gap is closed.

## Detailed findings

### Deployment

**Upstream-pinned:** `linux-skeleton/README.md` calls the implementation a
runnable **Phase 0 reference skeleton**, runs it from Python source, and
documents optional OpenCode/Codex/Claude hook installers. It describes an
in-memory daemon and source-copy widget flow, not a distro package or signed
release. The upstream `plugin.json` is version `0.1.0` and declares DMS
`>=1.4.0`, but it is a widget manifest rather than a daemon package.

**Local-shell:** no provider executable, process, package, socket, or usable
user-systemd query was found.

**Inference:** a reproducible SHA is an evidence improvement, not proof of a
supported Fedora/DMS deployment.

### Protocol and reconnect

**Upstream-pinned:** the protocol uses newline-delimited JSON. The envelope
contains event ID, session ID, kind, timestamp, optional task ID, optional
sequence, and an arbitrary payload. The server limits request lines to 65,536
bytes, rejects malformed/non-object JSON, checks peer UID, exposes
`ping`/`subscribe` plus task, focus, interaction, and event-ingest methods,
and sends full snapshots followed by full-array snapshot patches. The client
reads up to 16 MiB responses.

The QML client rejects patches before a full snapshot, clears state on
disconnect, retries after 1,600 ms, and resubscribes. The source contains no
protocol version negotiation, schema version, replay cursor, server-side patch
history, or skipped-sequence rejection. `next_seq` normalization is not a gap
check.

**Source-test:** store and translation tests pass; server tests requiring Unix
socket bind are blocked by the current sandbox. This distinguishes source
behavior from a live transport result.

**Inference:** an adapter could choose a fresh-full-snapshot-only policy, but
the upstream source does not prove event completeness or compatibility across
reconnects/upgrades.

### Lifecycle and mapping

The daemon source owns an in-memory store and socket while the DMS client
connects to an already-running process. Adapter/watch processes and hook
installers are separate. Provider cwd and provider-local IDs are not Trellis
canonical identities. Nothing in the source establishes configured-root
validation, mapping confidence, or a safe `unmapped` result for ambiguity.

### Privacy and permissions

The source model is not metadata-only. It carries prompt text, assistant text,
tool input/results, permission/question text and answers, project paths,
terminal/process metadata, and arbitrary event payloads. Optional adapters read
local provider databases/transcripts or JSONL streams. Optional hook installers
write provider configuration, and server/QML methods can send interaction
responses. This is the opposite of the current Trellis gate's requirement that
provider observation be bounded, read-only, and non-persistent.

### Support and failure isolation

The source and source tests give useful evidence that OpenCode, Codex, and
Claude translation paths exist. They do not constitute a supported version
matrix or live Linux target proof. The existing Trellis plugin contains no
provider integration; therefore Trellis-only behavior is currently unchanged,
but that absence cannot certify a future adapter's fail-open behavior.

## Safety and non-actions

This follow-up performed only public-source reads, a temporary checkout,
source tests, and read-only local probes. It did **not**:

- install or start a daemon;
- connect to or write a provider socket;
- install hooks or modify agent configuration;
- create persistence, network services, or provider settings;
- modify product/runtime code.

## Evidence required to reopen the gate

1. A pinned, supported Linux package/source revision with daemon owner,
   install/upgrade/rollback/shutdown, stale-socket, and socket-ACL procedures.
2. A versioned protocol or compatibility suite covering bounds, capabilities,
   full/patch ordering, malformed input, reconnect, sequence gaps, and fresh
   full-snapshot recovery.
3. Target-host mapping proof that canonicalizes provider cwd under one trusted
   Trellis root and maps only explicit provider task IDs; ambiguity must remain
   `unmapped`.
4. Metadata-only privacy fixtures proving prompts, assistant text, tool I/O,
   permission text, credentials, raw cwd, and arbitrary payload fields are
   discarded before state/UI publication.
5. A versioned OpenCode/Codex/Claude (and any claimed additional agent) matrix
   with direct target-runtime evidence.
6. A target-host fail-open test showing that disabled, absent, malformed,
   disconnected, stale, and provider-process-failure states leave the
   Trellis-only Snapshot, Health, Recent Changes, and startup path functional.

No 1.4.2, 1.4.3, or 1.4.4 provider production surface is authorized by this
report.

## Final disposition

NO-GO
