# Host Acceptance and Release Execution Plan

## Checklist

1. Read the state-matrix, recovery-responsive, Desktop projection contracts, and parent runtime research.
2. Confirm children 1.1.1–1.1.3 are complete and run the full local contract test and structured-file checks.
3. Install/enable the candidate on the supported DMS host and execute every matrix item in `design.md`; capture actual DMS/Wayland/restart/locale/clipboard evidence.
4. Regress all listed v1.0 surfaces and confirm no permission, Trellis write, extra scanner/watcher, or network behavior.
5. If all mandatory checks pass, update README, manifest, and `docs/releases/v1.1.0.md`; run local checks and review the final diff. If any required host gate fails or is unavailable, do not bump the version or claim release completion.
6. Run the final `node tests/test_trellis_contract.mjs`, JSON parsing, `git diff --check`, and task validation. Present the commit plan using Trellis workflow before committing.

## Risk / rollback

- Host API/runtime failures block release; fix only within v1.1 scope and repeat the failed gate.
- If release notes/version become inconsistent, revert the release-only docs/manifest edits without discarding accepted feature code.
- Do not publish an external tag or release without explicit authorization after the acceptance evidence is reviewable.
