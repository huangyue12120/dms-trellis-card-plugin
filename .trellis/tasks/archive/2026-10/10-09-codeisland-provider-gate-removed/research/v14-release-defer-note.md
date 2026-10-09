# v1.4 Agent Activity release/defer decision — 2026-10-09

## Decision

`NO-GO` for the optional Agent Activity Provider experimental surface.

## Basis

- The current `payprays/codeIsland-dms` `main` revision is pinned to `f6143cecc61c5edd9c31bf4862ce48423fbdc975`, but remains a no-tag/no-release Phase 0 Python reference skeleton rather than a verified package or target-host service.
- The source demonstrates newline-delimited JSON and full/patch snapshots, but not a versioned compatibility contract, replay cursor, patch-gap handling, or reconnect/resume guarantee.
- The source carries prompts, assistant text, tool inputs/results, permission interactions, project paths, process metadata, and provider-local task IDs; optional adapters/hooks write agent configuration and expose write-capable RPC methods.
- The current development shell and target host have no CodeIsland provider daemon, package, process, or documented socket. The target DMS/niri runtime and Trellis plugin are verified, but no provider runtime evidence is available.
- The target Fedora/DMS/niri host is now directly verified: DMS 1.6.3 and niri 26.04 are active, and DMS IPC reports `trellisDms [loaded]`; however, no CodeIsland package, process, or documented socket exists, so provider protocol, mapping, privacy, and fail-open behavior remain unverified.
- The existing Trellis plugin has no provider integration, so Trellis-only behavior remains unchanged and safe.

## Consequences

- Do not create or implement task 1.4.2, 1.4.3, or 1.4.4 production surfaces.
- Do not add a provider setting, manifest permission, socket client, daemon dependency, hook installer, interaction response, prompt/tool payload path, or Agent Activity UI.
- Keep v1.4 deferred and do not manufacture a release version for an unimplemented experimental surface.

## Reopen conditions

Reopen only with target-host evidence covering deployment/ownership, protocol version and bounds, reconnect/full-resync/patch-gap behavior, canonical project/task mapping, metadata-only privacy, agent support, and failure isolation for disabled/absent/malformed/disconnected provider states. The current SHA is pinned, but no release/package or target-runtime proof exists.

Authoritative evidence reports: `.trellis/tasks/archive/2026-10/10-09-codeisland-provider-evidence-removed/research/activity-provider-evidence-2026-10.md` (original), `.trellis/tasks/archive/2026-10/10-09-codeisland-provider-gap-removed/research/evidence-gap-revalidation-2026-10.md` (source/local revalidation), and `.trellis/tasks/archive/2026-10/10-09-codeisland-target-runtime-evidence-removed/research/target-runtime-evidence-2026-10-09.md` (target-host collection).
