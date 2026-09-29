# About / Diagnostics Execution Plan

## Checklist

1. [x] Read the settings/state and UI component contracts plus parent runtime research.
2. [x] Implement a pure redacted report builder with an explicit field allowlist; do not serialize raw Snapshot, warning messages, IDs, roots, or archive content.
3. [x] Add the read-only About / Diagnostics section to plugin-wide Settings only. Display manifest version/capabilities, loaded state, Qt version, unavailable host versions, snapshot/health totals, and project summaries.
4. [x] Add user-triggered argv clipboard action with bounded feedback and no automatic network or persistence behavior.
5. [x] Add English/Chinese strings and fixtures for normal/degraded/multi-project states and adversarial path-bearing fields.
6. [x] Run the contract, translation JSON, scoped diff, and task validation checks. Inspect report fixtures for prohibited substrings.

## Verification

- `node tests/test_trellis_contract.mjs` — passed, including multi-project, normal/degraded, malicious path/name/message, archive-content, unavailable-version, and report-length assertions.
- `node -e 'JSON.parse(require("node:fs").readFileSync("TrellisDms/translations/zh_CN.json", "utf8"))'` — passed.
- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-29-v11-diagnostics` — passed.
- `git diff --check -- TrellisDms/TrellisSettings.qml TrellisDms/lib/trellisprojection.js TrellisDms/translations/zh_CN.json tests/test_trellis_contract.mjs` — passed.
- DMS/Wayland UI rendering and a user-clicked clipboard run remain unverified on the host.

## Risks / rollback

- If a reliable DMS/Quickshell version API cannot be identified, keep the field unavailable; do not spawn another process to guess it.
- The copy CLI is one-shot and user-triggered. If host invocation is unavailable, keep the acceptance item unverified and do not claim copy success.
- If any path/name/raw message leaks into export, block acceptance, tighten the allowlist, and retest before continuing.
