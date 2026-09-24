# v0.9.4 Agent Activity Provider evaluation

Evaluation date: 2026-09-24  
Decision: **defer provider adoption and implementation**

## Scope and evidence labels

This is a read-only evaluation of the Linux `payprays/codeIsland-dms` reference. It does not add a provider, connect to a socket, install or start a daemon, change agent configuration, or install hooks. The macOS `rifqiakrm/code-island` project is not an implementation source.

Evidence below is separated into:

- **Archived source inspection**: a prior local inspection recorded in `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/codeisland-linux.md`, dated 2026-09-17, of commit `f6143cecc61c5edd9c31bf4862ce48423fbdc975`.
- **Current-shell observation**: commands and paths checked in this development shell on 2026-09-24. This is not proof about a separate graphical target session.
- **Unknown**: evidence unavailable in the retained source report or not established by a live target runtime.
- **Recommendation**: a proposed future boundary, not a claim about current provider behavior.

## Findings

| Question | Evidence | Result |
|---|---|---|
| Deployment and target availability | The archived report describes a Python daemon/server and labels the Linux tree a “Phase 0/reference skeleton”; it does not establish a packaged or production-supported Fedora 44 deployment. On this shell, `codeislandd`, `codeisland`, and DMS are resolved separately: only DMS is on `PATH`; RPM queries report `codeislandd`, `code-island`, and `codeIsland-dms` not installed. The prior temporary checkout `/tmp/trellis-dms-refs.jfDbfs/codeIsland-dms` is no longer present. | **Not established.** No daemon was installed or run. A separate target graphical session may differ. |
| Socket availability | The archived protocol defaults are `$XDG_RUNTIME_DIR/codeislandd.sock`, `/tmp/codeisland-<uid>/codeislandd.sock`, and `/tmp/codeislandd.sock`. For UID 1000, all three checked paths were absent in the current shell. | **Absent in this shell only.** |
| Framing and subscription | The archived source inspection reports newline-delimited JSON, a line splitter, and subscriptions to `sessions`, `tasks`, and `interactions`. It reports `snapshot.full` handling and `snapshot.patch` application only after a full snapshot. | **Source claim from the pinned 2026-09-17 inspection.** Not rechecked against a current checkout or live daemon. |
| Reconnect, versioning, schema stability | The prior report calls the reference a useful transport/reconnect pattern, but retained evidence does not specify a stable reconnect/backoff contract, protocol negotiation/versioning, patch sequence/gap recovery, or compatibility guarantees. No live server was available. | **Unknown; insufficient for a production adapter.** A reconnect example is not a compatibility contract. |
| Available metadata | The retained inspection identifies session/task/interaction channels and request names (`subscribe`, `interaction_respond`, `focus_session`). It does not preserve a verified field-level schema for provider, session identity, cwd, event/tool name, timestamps, or permission state. The protocol includes write-capable interaction/focus requests, outside this plugin’s read-only scope. | **Field-level availability and stability are unknown.** Future integration must use subscription only and discard unapproved fields. |
| cwd → trusted project mapping | Current `TrellisPaths.resolveTaskDirectory` validates canonical task paths beneath a known project’s `.trellis/tasks` or opted-in archive subtree; it does not establish that an arbitrary provider cwd is a trusted project. The current shell has no provider event to map. | **Not demonstrated.** A future adapter must canonicalize cwd under configured trusted roots, match exactly one discovered project, and otherwise leave `projectId` null. Centralize any required resolver extension in `TrellisPaths`; do not add path policy to a surface. |
| session → Trellis task mapping | No field-level session/task correlation contract or live paired event and Trellis fixture is available. cwd alone may identify a project but cannot safely identify one of its tasks. | **Not demonstrated.** Keep `taskId` null unless a future explicit, verified identifier maps to a current Snapshot task. Never infer it from title, recency, or session count. |
| Privacy and fail-open behavior | The archived Linux README reportedly describes optional Codex/Claude/OpenCode adapters and hook installers, duplicate-hook cautions, and daemon-unavailable fail-open behavior. These are source claims, not tested runtime outcomes. The Trellis core already operates from its own Snapshot and has no CodeIsland dependency. | **Architecture can remain optional, but actual runtime behavior is unverified.** A missing socket must leave Trellis-only operation unchanged. No hooks, prompt/tool content, interaction responses, or external writes are in scope. |

## Evidence from the current shell

- `XDG_RUNTIME_DIR` is `/run/user/1000`.
- These documented paths were absent: `/run/user/1000/codeislandd.sock`, `/tmp/codeisland-1000/codeislandd.sock`, and `/tmp/codeislandd.sock`.
- `codeislandd` and `codeisland` were not found on `PATH`; RPM reported `codeislandd`, `code-island`, and `codeIsland-dms` are not installed.
- The former temporary Linux reference checkout is absent. No network lookup or external daemon contact was performed.
- These observations say nothing conclusive about another user session or a future installation on the selected Fedora 44 target.

## Future minimum contract proposal

Only if a separately approved post-v1 prototype first verifies the upstream field schema, the adapter boundary should be provider-neutral and ephemeral:

```text
ActivitySnapshot {
  availability: "disabled" | "unavailable" | "connected" | "stale" | "error",
  provider: bounded string | null,
  events: ActivityEvent[]  // strictly capped; empty when unavailable
}

ActivityEvent {
  sessionId: bounded opaque string | null,
  kind: bounded allow-listed event kind | null,
  toolName: bounded allow-listed/tool label | null,
  timestamp: validated ISO timestamp | null,
  permissionState: coarse allow-listed state | null,
  projectId: current Snapshot project ID | null,
  taskId: current Snapshot task ID | null
}
```

The adapter must reject malformed or oversized envelopes, accept patches only after a valid full snapshot, and clear or mark activity stale after disconnect without blocking daemon startup. It must not persist the snapshot. Raw cwd is used only transiently for trusted-root resolution and is not exposed to UI or saved. Prompts, assistant responses, tool arguments/results, permission-response text, and arbitrary socket fields are discarded. Unknown or ambiguous project/task mapping remains `null`.

These are proposed safety limits, not claims that the reference currently emits the listed fields. If the upstream schema cannot supply a field reliably, omit it rather than synthesizing it.

## Recommendation and bounded next step

**Defer adoption for v0.9 and v1.0.** Current evidence is insufficient to rely on Fedora deployment, live protocol compatibility, reconnect semantics, field stability, or task mapping. Keep the plugin Trellis-only; do not add permissions, sockets, processes, hooks, or provider settings now.

If revisited after v1.0, propose a separate, explicitly approved prototype with this order:

1. Review a pinned Linux source revision and document the exact envelope/schema, daemon deployment, socket ownership/permissions, and protocol version/reconnect behavior.
2. Use synthetic events first to prove bounded full/patch decoding and trusted-root mapping; keep session-to-task mapping null without an explicit verified identifier.
3. Only after the user approves runtime work, try a disabled-by-default, metadata-only read-only adapter on the selected target. Verify absent-socket fail-open, reconnect/patch-gap recovery, and that no raw cwd or agent/tool content is retained.

The present shell evidence does not satisfy these future gates. This evaluation authorizes none of those runtime steps.
