# v1.4 Agent Activity Provider Experimental Gate — implementation plan

1. Run the v1.4.1 child evidence refresh against the current upstream Linux source and current local shell; preserve the old v0.9.4 report only as dated context.
2. Review protocol framing, full/patch ordering, subscription, reconnect/version/gap behavior, lifecycle, process ownership, deployment/installability, provider support, and available metadata. Do not infer runtime guarantees from static code.
3. Verify the privacy and permission boundary: no hooks, agent configuration changes, prompt/tool payload collection, persistence, network service, socket writes, or startup dependency.
4. Verify project/task mapping against the existing canonical resolver. Keep project/task identifiers null or explicitly unmapped when evidence is ambiguous; never guess from cwd or provider labels.
5. Produce the child evidence report and explicit `GO`/`NO-GO` result with a bounded confidence statement and missing-evidence list.
6. If `NO-GO`, update `PROJECT_PROGRESS.md` and a v1.4 release/defer note only; do not create provider/UI implementation tasks. If `GO`, create separately scoped 1.4.2/1.4.3 follow-ups without starting them in this gate.
7. Validate that the diff contains only task-local evidence/planning and any explicitly approved progress/release documentation; confirm the Trellis-only runtime path is untouched.

## Validation targets

- The report identifies exact sources, access dates, local commands, and unavailable evidence.
- Every protocol claim distinguishes documented behavior from observed behavior and inference.
- Missing daemon/socket or unsupported mapping produces a safe defer result, not an assumed adapter contract.
- No product test or source change is required when the gate is `NO-GO`; any later `GO` implementation gets its own tests and host gate.

## Rollback point

Remove or revise only the task-local planning/report artifacts if evidence changes. Do not reset unrelated v1.3 commits or alter external/user runtime state.
