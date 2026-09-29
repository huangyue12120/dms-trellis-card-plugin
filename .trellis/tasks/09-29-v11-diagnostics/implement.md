# About / Diagnostics Execution Plan

## Checklist

1. Read the settings/state and UI component contracts plus parent runtime research.
2. Implement a pure redacted report builder with an explicit field allowlist; do not serialize raw Snapshot, warning messages, IDs, roots, or archive content.
3. Add the read-only About / Diagnostics section to plugin-wide Settings only. Display manifest version/capabilities, loaded state, Qt version, unavailable host versions, snapshot/health totals, and project summaries.
4. Add user-triggered argv clipboard action with bounded feedback and no automatic network or persistence behavior.
5. Add English/Chinese strings and fixtures for normal/degraded/multi-project states and adversarial path-bearing fields.
6. Run `node tests/test_trellis_contract.mjs`, JSON parse for `zh_CN.json`, `git diff --check`, and the task validator. Inspect generated report fixtures for prohibited substrings.

## Risks / rollback

- If a reliable DMS/Quickshell version API cannot be identified, keep the field unavailable; do not spawn another process to guess it.
- The copy CLI is one-shot and user-triggered. If host invocation is unavailable, keep the acceptance item unverified and do not claim copy success.
- If any path/name/raw message leaks into export, block acceptance, tighten the allowlist, and retest before continuing.
