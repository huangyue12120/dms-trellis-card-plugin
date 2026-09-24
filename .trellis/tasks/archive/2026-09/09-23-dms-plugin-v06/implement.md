# Trellis DMS v0.6 execution plan

## Ordered delivery

1. Execute and verify `09-23-dms-v061-primary-pill`. Add session recency,
   project-qualified pin normalization, deterministic primary selection,
   minimal DMS State plumbing, pill projections, docs, and regression tests.
2. Execute and verify `09-23-dms-v062-live-popout`. Add project filtering,
   pin controls, grouped live-task rows, priority/relationships/session counts,
   warning traceability, and keyboard/focus behavior using child 1 contracts.
3. Execute and verify `09-23-dms-v063-responsive-states`. Complete all P0/P1
   state-matrix paths, responsive/runtime checks, update roadmap/spec evidence,
   and set manifest version `0.6.0` only after integration passes.
4. Run a parent integration review across all child acceptance criteria. Do
   not archive this parent until every child is archived or explicitly marked
   with a non-blocking external-tool limitation.

## Shared validation

```bash
node tests/test_trellis_contract.mjs
node --check tests/test_trellis_contract.mjs
node -e 'JSON.parse(require("node:fs").readFileSync("TrellisDms/plugin.json", "utf8"))'
python3 ./.trellis/scripts/task.py validate 09-23-dms-v061-primary-pill
python3 ./.trellis/scripts/task.py validate 09-23-dms-v062-live-popout
python3 ./.trellis/scripts/task.py validate 09-23-dms-v063-responsive-states
```

When available, also run the offscreen DMS component harness and real DMS
reload checks for horizontal/vertical pills, narrow/normal popouts, focus,
filters, pin persistence, and empty-to-populated recovery. Missing `qmllint`,
`qmlformat`, or host preview support must be reported, not treated as a pass.

## Review gates

- After child 1: primary policy is pure/deterministic and cannot discard facts.
- After child 2: every visible interaction consumes projection fields rather
  than reparsing Snapshot semantics in QML.
- After child 3: every P0/P1 state-matrix row has fixture/static/runtime
  evidence, existing v0.3-v0.5 safety contracts still pass, and the manifest
  is `0.6.0`.

## Rollback points

- Child changes are sequential and must not overlap concurrent edits.
- Revert parser recency, projection, widget UI, tests, docs, and version as a
  coherent child/integration set; never leave QML calling a missing helper.
- UI State keys are safe to leave behind because older versions ignore them.
