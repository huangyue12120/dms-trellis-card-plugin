# v0.7.2 archive browsing execution plan

## Ordered checklist

1. Confirm child 0.7.1's request/response and resolver reader contracts before
   editing; do not duplicate Markdown/path policy.
2. Add pure archive month/task validation, page/cap normalization, and summary
   projection helpers. Cover the verified `.trellis/tasks/archive` path and
   reject the roadmap shorthand as an unverified alternate root.
3. Add daemon archive index enumeration and page task.json reads with argv-only
   discovery, canonical checks, read-only bounds, request/generation guards,
   and no live Snapshot mutation.
4. Add archive index/detail UI with explicit historical/read-only labels, back,
   month/page/task controls, empty/error/loading copy, and reuse of child
   0.7.1 Markdown detail rendering.
5. Add fixtures for multiple months, empty/unknown layouts, permission/read
   errors, large page caps, traversal/symlink rejection, live/archive
   disjointness, and stale archive responses.
6. Run the child contract suite and offscreen harness; report Wayland/runtime
   gates separately.

## Validation

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
python3 ./.trellis/scripts/task.py validate 09-23-dms-v072-archive-browsing
```

Use a disposable fixture under `/tmp` for archive directories and symlinks;
never alter a real `.trellis` archive. If the installed DMS/Wayland harness is
unavailable, retain the static/pure results and mark interactive archive
scroll/detail as unverified.

## Risk and rollback

Risk is concentrated in archive enumeration and the shared widget mode. Revert
the archive response/projection/UI additions as one child set if they affect
live Snapshot publication. Do not roll back by deleting archive directories or
modifying task records.
