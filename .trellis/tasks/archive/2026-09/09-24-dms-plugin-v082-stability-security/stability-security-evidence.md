# v0.8.2 stability and security evidence

Captured on 2026-09-24. This note separates source checks and disposable Node
fixtures from host runtime evidence. No production limits or resolver rules
were changed.

## Requirement map

| Requirement | Evidence in this child | Result and boundary |
|---|---|---|
| Multiple widgets share one daemon Snapshot | Static assertions for the plugin manifest's daemon/widget components, the daemon's single `setGlobalVar(..., "snapshot", ...)` publisher, and widgets reading the `snapshot` global | PASS, static only. Multi-screen/multi-widget IPC behavior was not observed live. |
| No duplicate watchers/readers; reload and destruction cleanup | Static assertions for watcher registry deduplication/cap, generation checks, owned-object tracking, timer stops, queue clearing, watcher destruction, and daemon destruction | PASS, static only. Active object counts and actual reload cleanup remain unmeasured. |
| Idle, known-file, topology, and settings refresh behavior | Static assertions for one-shot timers, a 30-second topology default with 15–300 second normalization, 200 ms known-file debounce, settings refresh trigger, and one coherent reload publisher | PASS, source contract only. Idle wakeups and the two-second task refresh target were not measured. |
| Archive lazy loading and Markdown exclusion from Snapshot | Existing parser/Snapshot fixtures and static request/response checks show archive summary starts unloaded, detail reads use separate responses, and raw Markdown is absent from Snapshot | PASS, fixture/static. DMS rendering and IPC remain unverified. |
| Traversal, absolute path, symlink escape, stale/malformed pointers | Disposable path fixtures reject traversal and absolute pointers; canonical containment rejects an external task and task/archive/Markdown symlink escapes. New temporary session files cover malformed JSON and a stale pointer whose target fails `realpath -e`. Symlink creation was confirmed available on this host. | PASS on the fixture paths. Permission denial was outside this fixture; see the later user-reported live result below. |
| Markdown allow-list and size; archive containment; malformed/oversized JSON | Disposable live/archive task trees cover the three Markdown basenames, non-allow-listed/nested names, external symlink, empty and over-limit Markdown, valid/invalid archive month/task paths, archive symlink escape, malformed task JSON, and a task JSON payload over 1 MiB. Static checks verify detail `stat` rejects over-limit files before creating a detail reader. | PASS for path/parser fixtures and static read ordering. The DMS `FileView` behavior was not run. |
| Bounded pending work, warnings, and watcher count | Pure `TrellisWatch` assertions cover duplicate-path coalescing, queue cap/drop behavior, warning cooldown, and ledger eviction. Static assertions pin daemon caps and watcher cap handling. | PASS for helper/static behavior; no live burst or active watcher count was measured. |
| Empty, malformed, inaccessible, or changing inputs keep the shell usable | Existing v0.8.1 state matrix plus this child’s parser/path fixtures and source checks cover empty, malformed, stale, and changing records. | Fixture/static coverage passes. Live shell behavior was unavailable at the initial capture; the user later reported the manual permission-denied case recovered normally (see follow-up below). |

## Existing limits observed

| Resource or interval | Current value |
|---|---:|
| Trusted scan roots | 16 |
| Projects / scan | 32 |
| Discovery depth / ancestor candidates | 4 / 8 |
| Task records / project; session records / project | 128 / 128 |
| Known-file watchers / pending changed paths | 512 / 256 |
| Snapshot/parser warnings; warning cooldown | 256; 5,000 ms |
| Known-file debounce | 200 ms |
| Topology interval | 30 s default; 15–300 s accepted |
| Settings refresh coalescing timer | 100 ms |
| `maxCommandBytes` parser limit | 256 KiB of JavaScript string characters |
| Task/session JSON accepted-size limit | 1 MiB of JavaScript string characters |
| Markdown detail (live and archived) accepted-size limit | 256 KiB UTF-8 bytes |
| Archive months / task directories per month | 48 / 2,048 |
| Archive page size / page maximum / warning cap | 16 default; 32 max; page 63; 8 warnings |

Archive task JSON uses the 1 MiB JSON limit shown above; the 256 KiB limit is
for live and archived Markdown detail. The values above are existing
contracts, not measured throughput thresholds.
`parseBoundedLines` truncates captured command output after it has arrived in
the `StdioCollector`; the 256 KiB setting therefore bounds retained parsing,
not pre-capture process memory. Ordinary task/session `FileView` reads call
`text()` before checking the 1 MiB string limit, so that limit bounds accepted
parser input but not the bytes first loaded by the reader. Markdown and archive
detail reads do a `test -f` plus `stat` preflight before creating the reader,
and the detail reader checks UTF-8 size again after load.

There is no separate numeric cap for simultaneous owned processes or readers.
Their arrays are tracked and destroyed on scan replacement and daemon teardown;
record discovery has the roots/projects/tasks/sessions limits above. This
source inspection does not provide a peak simultaneous process/reader count.

## Evidence classes and host gates

- Fixture: `node tests/test_trellis_contract.mjs`, including disposable
  filesystem paths, parser inputs, archive/Markdown cases, and the 22-row
  v0.8.1 state matrix. Temporary fixtures are removed by the test.
- Static: daemon lifecycle, timers, global publication, watcher/read paths,
  caps, widget boundaries, archive/detail handling, and source restrictions.
- Offscreen: not run. `qmllint`, `qmlformat`, and `qmltestrunner` were not found
  on `PATH`.
- Live at initial capture: not run. No `dms` or `quickshell` process was
  present. The installed CLI reported DMS 1.6.2; the then-current roadmap
  target was 1.6.1.

At the original evidence capture, DMS 1.6.1 compatibility, live idle activity,
task refresh latency, topology/settings/manual refresh, reload/destruction
cleanup, multi-widget/multi-screen behavior, and live
empty/malformed/inaccessible shell recovery were **UNVERIFIED**. Large-data
fixtures establish the input sizes and parser/detail branches, but do not
measure peak memory, latency, or simultaneous process/reader counts.

## Follow-up user-reported live checks

On 2026-09-24, the user reported that the planned local manual checks passed
without issues on DMS 1.6.2. This follow-up covers the previously listed live
idle/reload, topology and multi-bar/screen behavior, disable/destruction, and
resource-cleanup checks. The user later confirmed that permission-denied input
also recovered normally. The user selected DMS 1.6.2 as the v0.8 target
baseline, superseding the original 1.6.1 target. This is user-reported live
evidence; no per-case logs, screenshots, or timing measurements were attached,
and this session did not independently replay the checks.

The manual pass does not change the fixture/static evidence boundaries above.
Peak memory, throughput, exact refresh latency, and simultaneous process/
reader counts remain unmeasured. Permission-denied behavior is user-reported,
with no raw log attached and no independent replay in this session. The
manifest's `requires_dms >=1.6.1` minimum remains unchanged based on the API
research; this RC's live checks ran on 1.6.2.

## Commands

- `node tests/test_trellis_contract.mjs` — PASS (pure/fixture/static)
- `node --check tests/test_trellis_contract.mjs` — PASS
- `git diff --check` — PASS for the tracked diff
- `python3 ./.trellis/scripts/task.py validate .trellis/tasks/09-24-dms-plugin-v082-stability-security` — PASS
