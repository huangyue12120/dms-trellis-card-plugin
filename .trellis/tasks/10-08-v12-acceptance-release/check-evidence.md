# v1.2 Final Full-Scope Check

Recorded 2026-10-08 by `v12_check` for required final workflow step 2.2.
**Repository fixture/static gate: PASS. Candidate supported-host hot reload:
FAIL. Complete candidate runtime acceptance and stable release: OPEN.**

## Scope and review boundary

`get_context.py --mode packages` reports one repository with frontend/backend
spec layers. Affected implementation is the frontend QML/JavaScript plugin,
its contract suite, frontend executable specs, and integration documentation.
No backend/package implementation changed.

Loaded acceptance PRD/design/implementation/check context, frontend index and
applicable quality, state-matrix, recovery, settings/State, Markdown/archive,
Desktop, Launcher, Recent Changes, Global Search, and Quick Actions contracts.
Reviewed README, candidate notes, acceptance matrix/checklist, current manifest,
candidate workflow, and local packaging evidence. Earlier feature checks are
retained; this pass focuses on final integration and evidence drift.

No additional source/test/spec/document repair was required or made during this
final pass. Product/tests remain frozen. Only this checker evidence was added.
Main retains installation/restart/release/task-state ownership; no agents were
spawned and no host patch, restart, tag, publication, commit, or archival was
performed by this checker.

## Findings fixed in preceding feature checks

- Recent Changes capacity turnover now preserves surviving identities before
  comparison; incomplete/null archive metadata does not establish a reliable
  baseline; the missing Snapshot translation is present.
- Global Search no longer lets a short month followed by full pages exceed
  its 128-candidate batch. Incomplete coverage retains its reliable baseline;
  Search/detail and root-cancellation lifecycle regressions pass.
- Quick Actions consume owned active/queued raw requests after completion or
  cancellation/destruction. Matching feedback survives request-null ordering,
  newer ownership survives old completion/close, and recreated daemon fixtures
  cannot replay finished/cancelled actions. Legal live JSON retains the approved
  effective-ID directory fallback, including null/array/primitive values.

Details remain in the three feature children's `check-evidence.md` files. This
final pass introduced no further fix and did not redo their bounded reviews.

## Integrated repository result

| Boundary | Evidence/result |
| --- | --- |
| Snapshot/observation | One daemon Snapshot publisher; only optional runtime epoch/publication provenance is added. Existing parser facts, freshness, nullable progress, health, and body exclusion are preserved. Repeat/partial/fallback/recovery and selection fixtures pass without false completion/rediscovery. |
| Shared readers/watchers | Existing daemon discovery and known-file watcher owner remain. The sole `watchChanges: true` template is unchanged; all three FileView templates block writes. Desktop/Launcher/widget surfaces do not read Trellis files or create another scanner. Search adds a UI debounce timer, not a watcher or topology poller. |
| Search/detail/Recent bridge | Live consumes Snapshot metadata; Archive has bounded independent transport/generation, explicit coverage/continuation, and blank-query zero I/O. Qualified identity handoff enters existing fresh-authority detail. Only complete guarded archive pages reach the observation hook. |
| Actions/isolation | Identity-only request allowlist, fresh configured-root/canonical/JSON authority and guards, separated clipboard argv, encoded local-folder URLs, truthful local feedback, and raw ownership consumption pass. Actual Search/detail handlers complete during action failure/cancellation with their generations intact. |
| Core/v1.1 preservation | Full fixture/static suite covers existing bar/popout/filter/pin, archive/Markdown, Settings, Launcher, Health/freshness/last-good/recovery, redacted Diagnostics and Desktop modes. The suite does not establish GUI interaction or restart persistence. |
| Permission/data boundary | Manifest equals HEAD byte-for-byte semantically and retains DMS >=1.6.2 and settings_read/settings_write/process only. No new network, Trellis write, agent hook, control surface, permission, alternate store, or watcher registry is introduced. |
| Native UI/localization | Existing native button/Theme/focus-reveal and one clamped scroll surface are reused. Exact-case resources and all widget Chinese translation keys pass. Native rendered focus/layout/locale remain separate runtime gates. |
| Docs/spec/status | Executable feature contracts match final helpers, lifecycle/caps and evidence limits. README/notes/matrix report the hot-reload failure, baseline rollback and unverified full candidate. Manifest remains 1.0.0 and stable release/task completion remain open. |

The original user roadmap is preserved exactly: removing the single new v1.2
status insertion reproduces `/tmp/trellis-v12-original-progress.md` bytes.
Original SHA-256 is
`a6c386bebbe0bece3f6bced42961b889806962d78c7f2d882c5aa514010ce57d`.
Pre-existing hard-break spaces and blank EOF were preserved; the inserted
status has no trailing whitespace. No unrelated roadmap text was rewritten.

## Verification performed in this final pass

- **Full tests PASS:** `rtk proxy node tests/test_trellis_contract.mjs`, exit zero
  on the frozen final state. This includes v1.0/v1.1, all three feature children,
  actual daemon/widget transport fixtures, cross-channel integration, and
  retained-global completion/cancellation/recreation regressions.
- **JavaScript syntax PASS:** `rtk proxy node --check tests/test_trellis_contract.mjs`
  and `rtk proxy node /tmp/trellis-v12-static.mjs`; six pure modules and 105
  daemon / 50 widget root methods parse. This is not QML type/component checking.
- **JSON/resource PASS:** manifest/translations parse; test suite checks
  exact-case imports and widget translation coverage. Planning/task JSON/JSONL
  and 47 relevant documentation/context files pass UTF-8/LF and trailing-space
  inspection.
- **Context PASS:** all five v1.2 task validators pass. Parent 8 implement/9
  check entries; Recent Changes 6/7; Global Search 7/8; Quick Actions 10/11;
  acceptance 11/12.
- **Scoped whitespace PASS:** `git diff --check -- . ':(exclude)PROJECT_PROGRESS.md'`.
  Original progress bytes and own inserted status were verified separately.
- **Lint/TypeCheck N/A:** project has no configured linter/type checker and
  `qmllint`, `qmlformat`, `eslint`, `tsc` are unavailable. Syntax/fixtures are not
  represented as successful lint or QML type checking.

## Package and release contract

Independently opened `/tmp/trellis-dms-v1.2-unreleased.zip`: **PASS** for ZIP CRC,
16 unique/sorted exact members, every member equal to its source bytes, no source
symlinks, fixed 1980-01-01 timestamps, and 0644 modes. Contents are exactly the
14-file `TrellisDms/` bundle plus README/LICENSE, excluding tests, task/journal/
repository metadata and private evidence. Manifest is 1.0.0 with unchanged
permissions and DMS floor. Main separately verified repeat-build byte equality.

ZIP SHA-256:
`2a7c74757173bce0db7164b7d0e632af77ad64f15aefc995df94914b26849655`.

Inspected the existing workflow: candidate tag regex/version/notes and
origin/main ancestry gates precede packaging; publication uses `--prerelease`.
Main executed its exact Node verifier without tags: current-manifest
`v1.0.0-rc.1` accepts; mismatched `v1.2.0-rc.1`, stable and malformed tags reject.
The source is an uncommitted frozen working tree, so an actual release source/
tag ancestry check was not performed. No matching v1.2 manifest decision/tag,
stable automation, or publication exists. The local artifact is an unreleased
integration review package, not a versioned v1.2.0 release.

## Findings not fixed / runtime evidence

No new repository-level code/spec/document defect was found. The following
failed/open gates remain; they are not waived by repository PASS:

| Evidence class | Result and boundary |
| --- | --- |
| Full isolated offscreen DMS harness | UNAVAILABLE: even unchanged baseline DMS modules did not resolve. No whole-component offscreen pass. No retry was made by this checker. |
| Real candidate hot reload | FAIL: inspected main's logs show at 16:53:13 daemon import line 11 reports `lib/trellischanges.js unavailable` / `File name case mismatch`. Exact disk/import spelling and installed bytes were verified. This does not establish a source-case error. |
| Restored original host | PASS for baseline only: logs at 16:54:31 show bar/daemon reload after original 13-file restoration. Main byte-verified that rollback; current host runs the original baseline. |
| Fresh isolated Qt library | PASS for library only: main's fresh engine imports/executes the exact library. It does not load the complete DMS candidate or prove interaction/reload. |
| Complete candidate fresh DMS load | UNVERIFIED. Running-loader directory caching is a hypothesis, not an established cause or demonstrated remedy. No full-shell restart is authorized/executed in this check. |
| Host interactions/core carry-forward | UNVERIFIED: clipboard bytes, folder target/window, focus/scroll/narrow layout, search/history, multiple widgets/Desktop placements, settings/manual/automatic refresh, locale and disable/enable/restart. |
| Preference restart persistence | UNVERIFIED: pre-existing host-owned DMS State writer error remains. No alternate persistence store or DMS patch was introduced. |

Logs reviewed: `/tmp/trellis-v12-host-first-load.log` and
`/tmp/trellis-v12-host-load-and-rollback.log`. No real clipboard content was read
or written and no folder was opened by this checker. A separately reviewed
reinstall/full-shell restart plan and remaining supported-host checks belong to
main and the user. Stable release and full acceptance task completion stay open.

## Final freeze hashes

Product/tests retain the previous verified freeze; no source-changing fix was
needed and the reviewed package matches those files. README/candidate notes
are main-frozen and verified as below. Main owns any later approved version,
deployment, commit/tag or release change; such changes require updated evidence.

| File | SHA-256 |
| --- | --- |
| `TrellisDms/TrellisDaemon.qml` | `8e38d41891fb86249ec8c8478de813872ae7ba263e129030e256b5190d37a83d` |
| `TrellisDms/TrellisWidget.qml` | `aaae714476ec2882fbecc0cddd54ccb4e119c420829bc3411f12cc592387119b` |
| `TrellisDms/lib/trellisPaths.js` | `a888d80adc993e435c3a45566ecea57e8efa03edced1e5c232e7de9c0ddbd947` |
| `TrellisDms/lib/trellisprojection.js` | `ed8b68fa6d4cfa16ade550c113cb304f0c57f3532d4b530e5ccb7c8a83e89e36` |
| `TrellisDms/lib/trellischanges.js` | `314296221cdbc943b81d2c9bedf935e9264435d7e6bc526b9097a285b4013508` |
| `TrellisDms/translations/zh_CN.json` | `d1fd0acc63ce23549837c55ea5087160d97530fd5d29a0902564d26e5dc8064e` |
| `TrellisDms/plugin.json` | `ef648b2340d6aac63dfe45774a27c5539d128414000c163a9a677c46b7da8362` |
| `tests/test_trellis_contract.mjs` | `98bb9c04e42bcd92e1802e177cbe412ea2f2e2fe6bf08450a6ad4c84f5b7b16a` |
| `README.md` | `f99bf1619e881aaee865c5c2e48e34783c92de461ce5ad69b1060ca644eeb3a0` |
| `docs/releases/v1.2.0-candidate.md` | `be532cbb3ece6950b95dc55b071ed889ca4153f0b42acb2739084268f6c80cc8` |
