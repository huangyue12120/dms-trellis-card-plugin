# v1.4.1 Activity Provider Evidence Gap Revalidation — design

## Evidence layers

Keep the following layers separate in the report:

1. **Pinned upstream** — commit/tag, URL, access date, license, release page, source and test behavior.
2. **Reproducible source test** — exact command and isolated checkout/fixture result; this proves source behavior only.
3. **Current local shell** — executable/package/process/socket/service checks with command output and scope limits.
4. **Target runtime** — direct Fedora/DMS/Wayland/niri evidence or user-supplied logs; absence stays unknown.
5. **Inference and gate** — only conclusions supported by the previous layers.

## Delta matrix

The report must compare the prior blocker with the new evidence for:

| Blocker | Evidence that can close it | Evidence that cannot be substituted |
| --- | --- | --- |
| Unpinned/deployability | Public commit/tag, package/service metadata, reproducible install path | README source-run instructions alone |
| Protocol/version | Schema/version, compatibility tests, malformed/bounds behavior | A single static dataclass or synthetic happy path |
| Reconnect/gaps | Tests for disconnect, resubscribe, full recovery, sequence gaps | A timer or reconnect loop without gap semantics |
| Ownership | Service owner, socket ACL/cleanup, upgrade/shutdown evidence | Plugin source reading a socket |
| Mapping | Canonical trusted-root and explicit task identity proof | cwd/title/provider-local ID heuristics |
| Privacy/permissions | Metadata-only fixtures and permission review | Filtering after payload capture or optional hooks |
| Support matrix | Versioned target-host agent/provider runs | File names or synthetic provider fixtures |
| Failure isolation | Disabled/absent/malformed/disconnected/process-failure host tests | “Fail-open” prose without runtime proof |

## Safety boundary

All commands are read-only with respect to the user's environment. A temporary source checkout may be created under `/tmp` and removed after inspection, but no source is copied into the plugin and no upstream daemon is started. Socket existence checks must not open or write a socket. Any unavailable target-runtime fact is recorded as `TARGET-RUNTIME-BLOCKED`/`NO-GO`, never guessed.

## Disposition rule

The report may say `GO` only when every required blocker has sufficient evidence and the future adapter can remain opt-in, disableable, metadata-only, read-only, unmapped when ambiguous, and fail-open. If target-runtime evidence is needed but unavailable, the product outcome remains `NO-GO` even if source tests pass.

## Rollback

Delete or revise only task-local evidence files and temporary `/tmp` checkouts. No product or external runtime rollback should be necessary because the task forbids mutation.
