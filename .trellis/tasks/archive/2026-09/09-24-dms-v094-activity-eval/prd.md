# DMS v0.9.4 Agent Activity Provider evaluation

## Goal

Assess whether an optional Linux Agent Activity Provider can be safely and reliably added after v1.0, without implementing a runtime provider in this task.

## Requirements

- Evaluate the Linux `payprays/codeIsland-dms` socket protocol and target-environment deployment; do not use macOS `rifqiakrm/code-island` as an implementation source.
- Assess `snapshot.full`/`snapshot.patch`, reconnect behavior, provider/session fields, and cwd/session-to-Trellis project/task mapping.
- Define the minimum internal ActivityEvent/ActivitySnapshot contract and privacy boundary needed for a future adapter.
- Do not install hooks, change agent configuration, collect/persist prompts or agent/tool I/O, or make a daemon/socket a startup dependency.
- Record evidence, uncertainty, adopt/defer recommendation, and a bounded prototype proposal in a task-local report.

## Existing evidence

- The archived v0.1.3 research inspected the Linux reference protocol but could not verify daemon deployment/runtime stability.
- A fresh planning-shell check found the canonical and UID-fallback socket paths absent and no `codeislandd` executable. This is not proof about a separate target graphical session.

## Acceptance Criteria

- [x] Report distinguishes locally verified facts, source claims, missing runtime evidence, and inference.
- [x] Report answers deployment, protocol, reconnect, mapping, privacy, and fail-open questions.
- [x] Recommendation is explicit; insufficient evidence results in defer/not adopt rather than assumed compatibility.
- [x] No hooks, agent configuration, external daemon, or provider runtime is changed or installed.
