# v0.7.1 Markdown detail execution plan

## Ordered checklist

1. Read `trellis-before-dev` for the backend/frontend specs before editing
   production files; freeze the request/response names and byte cap in tests.
2. Extend `trellisPaths.js` only where needed for fixed-name detail reads and
   add pure request/document validation helpers.
3. Add daemon-owned detail request handling, stat gate, async read component,
   generation/request cleanup, and bounded response publication. Preserve the
   existing one `snapshot` publisher and scan lifecycle.
4. Add pure fixtures for valid/missing/oversized/malformed documents,
   traversal/symlink/non-allow-list rejection, response caps, and stale request
   suppression.
5. Add the widget detail mode, tabs, loading/error/plain fallback, and native
   controls inside the existing single scroll surface. Confirm no widget file
   or process API appears.
6. Run Node/static/offscreen checks; record native Markdown and real Wayland
   gates separately. Update the parent research/spec note if a host fact
   changes.

## Validation

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
node -e 'JSON.parse(require("node:fs").readFileSync("TrellisDms/plugin.json", "utf8"))'
python3 ./.trellis/scripts/task.py validate 09-23-dms-v071-markdown-detail
```

When available, run the installed-module offscreen harness with three real
documents, a missing document, and a deliberately over-limit fixture. Do not
call the child complete if the harness/runtime was unavailable; mark the gate
unverified.

## Risk and rollback

Risk is concentrated in `TrellisDaemon.qml`, `TrellisWidget.qml`,
`trellisPaths.js`, and the contract fixtures. Revert this child as a coherent
request/reader/UI set if QML detail loading breaks; keep the v0.6 live
projection intact. Never revert by deleting unrelated user/task artifacts.
