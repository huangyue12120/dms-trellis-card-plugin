# DMS v0.9.4 Agent Activity Provider evaluation — implementation plan

1. Review `.trellis/tasks/archive/2026-09/09-17-dms-plugin-prereq-research/research/codeisland-linux.md` and `.trellis/tasks/09-24-dms-v09-optional-p2/research/v09-platform-apis.md`; capture provenance, dates, and gaps.
2. Check local target evidence without mutation: standard and UID-fallback socket presence, daemon executable/package availability, and any available pinned Linux source checkout/revision. Do not install, start, configure, or contact an external daemon.
3. Inspect documented framing/full/patch/subscription/reconnect behavior and available metadata. Confirm whether cwd can pass the existing safe resolver and map to one trusted project; leave task mapping unknown unless source/runtime evidence proves it.
4. Produce `research/activity-provider-evaluation.md` with a question-by-question evidence table, privacy boundary, future minimal contract, explicit adopt/defer recommendation, and bounded next prototype proposal.
5. Check that the evaluation changed only task documentation and made no agent, daemon, socket, hook, Trellis, or plugin configuration changes.

## Validation targets

- The report cites the exact local repository/artifact or installed source used and labels unavailable evidence.
- No finding claims live protocol compatibility from static reference code.
- A missing runtime is an acceptable outcome and leads to a clear defer decision when deployment/stability/mapping remain unproven.

## Rollback point

No product-code rollback is required. Remove or revise only the task-local report if its evidence is found to be inaccurate; preserve all external/user runtime state because none should have been touched.
