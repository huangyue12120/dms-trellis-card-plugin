# v1.4.1 Activity Provider Evidence Gap Revalidation — implementation plan

1. Read the original v1.4.1 report, parent defer note, v1.4 roadmap, and Trellis read-only/privacy/mapping contracts; enumerate each blocker without changing its prior result.
2. Inspect the upstream repository page, releases/tags, raw source, test files, and any accessible commit metadata. Record URL, access date, revision pinning status, and whether the source is a package, service, or reference skeleton.
3. If a safe source checkout or raw fixture is available, run only its protocol/server tests in an isolated temporary location. Do not install dependencies into the project, start a daemon, open a provider socket, install hooks, or change agent configuration. Record exact commands and classify results as source-level evidence.
4. Re-run current-shell checks: `PATH` commands, package queries, process names, canonical/fallback socket type, and read-only user-service discovery. Keep current shell and target graphical host scopes separate.
5. Trace the source for full/patch and sequence behavior, reconnect/resubscription and gap recovery, lifecycle/ownership, provider/task/project mapping, payload fields, permissions, hooks, and failure paths. Compare every finding with the project contracts.
6. Write `research/evidence-gap-revalidation-2026-10.md` with an evidence-delta table, closed/partial/target-required labels, concrete reopen conditions, and exactly one final disposition.
7. If any blocker remains, keep product outcome `NO-GO` and update only the parent defer note/roadmap if the evidence materially changes the wording. Do not create or implement 1.4.2/1.4.3 surfaces.
8. Run task validation, report coverage checks, `git diff --check`, and the existing Trellis contract test; confirm the diff contains no product/runtime changes.

## Validation commands

```bash
python3 ./.trellis/scripts/task.py validate .trellis/tasks/archive/2026-10/10-09-codeisland-provider-gap-removed
git diff --check
node tests/test_trellis_contract.mjs
```

## Completion / rollback

Completion is the report plus any narrowly updated defer wording. If a command would install, start, write, or contact a provider, stop and record the evidence as unavailable instead of escalating scope.
