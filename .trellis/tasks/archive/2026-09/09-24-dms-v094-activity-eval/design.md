# DMS v0.9.4 Agent Activity Provider evaluation — design

## Evaluation boundary

- This is a research-only deliverable for a possible post-v1 activity provider. It does not add an `ActivityProvider`, socket client, QML surface, daemon, hook, or runtime dependency in v0.9.
- Evaluate only the Linux `payprays/codeIsland-dms` / `linux-skeleton` reference. The macOS `rifqiakrm/code-island` project is conceptual only.
- Treat the archived 2026-09-17 source inspection as dated reference evidence. Recheck a local pinned source checkout if available; do not infer production reliability from source alone.
- Record the fresh current-shell observation (no canonical/fallback socket and no `codeislandd` binary) separately from target-host runtime state.

## Questions the report must answer

1. Is the daemon available/installable in the selected Fedora 44/DMS 1.6.2 environment, and is it running independently of DMS?
2. Are `snapshot.full` and `snapshot.patch`, framing, subscription, reconnect, and schema/version behavior documented and stable enough to consume?
3. Which minimum metadata fields are available for provider/session/event/tool/timestamp/permission state?
4. Can cwd safely map to one trusted Trellis project with the existing canonical resolver? Can any reliable session-to-task mapping be demonstrated, or must `taskId` remain null?
5. Can the integration remain read-only, metadata-only, fail-open, and disabled by default without prompts/tool I/O or external writes?

## Future contract direction (not implemented here)

If evidence supports future work, keep a provider-neutral `ActivityEvent`/`ActivitySnapshot` boundary with only provider, session ID, event/tool, timestamp, permission state, and safely resolved project/task identifiers. Keep raw cwd, prompts, assistant output, and tool input/output out of persistence; use a provider adapter outside the Trellis parser. A missing socket must yield Trellis-only behavior.

## Evidence standard

Separate source claims, installed local facts, direct runtime checks, user-reported target evidence, and inference. A source checkout or synthetic fixture does not prove daemon deployment, live protocol compatibility, reconnect behavior, or reliable Trellis task mapping.
