# v1.4 Agent Activity Provider Experimental Gate

## Goal

Re-validate whether a Linux Agent Activity Provider has enough current evidence to justify optional experimental runtime activity, without weakening the Trellis-only core.

## Requirements

- Execute the v1.4.1 evidence refresh before considering any provider contract, adapter, or UI work.
- Evaluate the current Linux provider/daemon source and deployment story, not the archived v0.9.4 conclusion alone and not the macOS project as Linux evidence.
- Cover protocol framing and versioning, `snapshot.full`/`snapshot.patch`, subscription and reconnect behavior, lifecycle and process ownership, provider/agent support, permission and privacy boundaries, and project/task mapping.
- Label each finding as current upstream source evidence, current local-shell evidence, target-runtime evidence, user-provided evidence, or inference.
- Keep the existing Trellis DMS path read-only and fully functional when the provider is absent, disabled, stale, malformed, or disconnected.
- Do not install or start a daemon, add hooks, alter agent configuration, open a socket, collect prompt/assistant/tool payloads, persist activity, add network access, or add a startup dependency during the gate.
- Permit tasks 1.4.2 and 1.4.3 only after an explicit `GO`; otherwise record `NO-GO` and defer the experimental surface.

## Acceptance Criteria

- [x] A task-local evidence report answers deployment, protocol, reconnect, lifecycle, ownership, mapping, permission, privacy, support-matrix, and failure-isolation questions with provenance and uncertainty.
- [x] The report includes direct current-shell checks for the canonical socket paths, daemon executable/package availability, and any supported target-runtime evidence without mutating the host.
- [x] The report emits exactly one gate result: `NO-GO`; insufficient evidence is `NO-GO`.
- [x] Because the result is `NO-GO`, no provider code, settings, manifest surface, UI, hooks, permissions, daemon, or socket integration was added; v1.4 is documented as deferred.
- [x] The conditional `GO` follow-up is not applicable; no 1.4.2/1.4.3 implementation task was started.
- [x] Trellis-only behavior remains unchanged and task-local validation confirms that no product configuration or external runtime state was touched.

## Non-goals

- Implementing an `ActivityProvider`, socket client, daemon, hooks, interaction responses, or Agent Activity UI in this gate.
- Treating static source inspection, a synthetic fixture, or a macOS implementation as proof of Linux production readiness.
- Mapping an activity to a Trellis task when the mapping is ambiguous or only inferred from cwd.
