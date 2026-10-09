# v1.4.1 Activity Provider Evidence Gap Revalidation

## Goal

Expand the v1.4.1 evidence enough to distinguish gaps that can be closed by public source/test inspection or safe local probes from gaps that require a real target Fedora/DMS runtime. Preserve the original `NO-GO` report and issue a fresh, evidence-backed disposition rather than silently upgrading the provider.

## Confirmed baseline

- The previous v1.4.1 report concluded `NO-GO` because the public Linux source was an unpinned Phase 0 reference skeleton, the development shell had no daemon/package/socket, the protocol had no versioned reconnect/gap contract, provider-local IDs were not trusted Trellis mappings, and the source crossed the metadata-only privacy boundary.
- The current upstream Releases page reports no releases, so release metadata itself is an evidence result rather than a deployable artifact: <https://github.com/payprays/codeIsland-dms/releases>.
- The existing Trellis plugin has no provider implementation; Trellis-only behavior must remain unchanged.
- `PROJECT_PROGRESS.md` requires insufficient evidence to remain `NO-GO` and forbids provider/UI work until the gate passes.

## Requirements

- Re-inspect the current upstream repository and release/tag metadata, recording a pinned commit/tag when publicly available or explicitly documenting why it cannot be pinned.
- Inspect upstream protocol/server/client tests and source for framing, schema/version, full/patch semantics, sequence handling, reconnect/resubscription, malformed/oversized input, lifecycle, socket ownership, and write capabilities.
- Where safe and available, reproduce upstream tests or static fixtures in an isolated temporary checkout without installing hooks, starting a daemon, contacting a provider socket, or modifying user/agent configuration. Synthetic or source tests must be labelled as such.
- Re-run read-only local checks for daemon/package/process/socket/service evidence and document whether the current shell is or is not the selected target graphical host.
- Re-evaluate trusted project/task mapping, metadata-only privacy, permission scope, provider support matrix, and failure isolation against the existing Trellis contracts.
- Explicitly classify each remaining gap as `closed`, `partially evidenced`, `target-runtime required`, or `not available`.
- Preserve the Trellis-only core. Do not add provider code, settings, manifest permissions, socket clients, hooks, agent configuration, persistence, network services, or Agent Activity UI.

## Acceptance Criteria

- [ ] A new task-local report cites current upstream release/revision metadata, source/test paths, local commands, dates, and evidence labels; it does not overwrite the original report.
- [ ] The report includes an evidence-delta table against every prior blocker: deployment, protocol/versioning, reconnect/gap recovery, lifecycle/ownership, mapping, privacy/permissions, support matrix, and failure isolation.
- [ ] Any upstream test or synthetic fixture result is clearly separated from target-host runtime evidence; no static result is presented as production proof.
- [ ] Read-only local probes and any temporary checkout leave no daemon, socket, hook, agent, Trellis, manifest, settings, or external runtime changes.
- [ ] The report ends with exactly one disposition: `GO`, `NO-GO`, or `TARGET-RUNTIME-BLOCKED`; the roadmap rule still maps insufficient evidence to `NO-GO` for product work.
- [ ] If any blocker remains, the report lists concrete reopen evidence and confirms that no 1.4.2/1.4.3 implementation is authorized.
