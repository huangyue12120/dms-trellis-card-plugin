# v1.2.1 Recent Trellis Changes

## Goal

Let users understand changes actually observed in Trellis state, with a bounded Recent Trellis Changes view that never claims Agent activity.

## Background

PROJECT_PROGRESS.md:1709 owns the requirements. The single Snapshot publisher is TrellisDms/TrellisDaemon.qml:1719; schema-2 facts and session identities are in TrellisDms/lib/trellisParser.js:106, :225, :379. Existing Health and primary selection semantics belong to trellisprojection.js:591 and :330. There is no separate publication counter today.

## Requirements

- RC1: Identify project discovery/unavailability/recovery; task discovery, stored-status and display-state changes; session attachment/detachment; active-session-count changes; newly observed archive items; primary/pin selection changes; health degradation/recovery.
- RC2: Events contain a unique event ID, observation time, qualified project/task identity when applicable, event type, bounded before/after facts, and source snapshot generation. UI selection events are explicitly distinct from Trellis data changes.
- RC3: Keep finite, runtime-only recent history. Restart/reload begins with a quiet baseline; repeated semantic snapshots produce no duplicate events.
- RC4: Retain reliable baselines through project/task/session read failures. A failure must not manufacture deletion, completion, detachments, or rediscovery on recovery. Actual changes between reliable observations remain reportable.
- RC5: Archive events derive only from safely read metadata and say newly observed. Initial coverage is quiet; no proactive archive reads or additional watchers.
- RC6: Show the history in the existing popout with project context, honest empty/fallback states, bounded text, keyboard access, and Chinese localization.

## Acceptance Criteria

- [x] RC1–RC2: Deterministic fixtures cover every event type, before/after facts, qualified same-ID tasks, and stable provenance.
- [x] RC3: Identical facts with changed timestamps, reordered warnings, or repeated generations create no duplicates; reload and initial observations are quiet.
- [x] RC4: Partial task/session reads, root failure, last-good fallback, and recovery do not invent task completions/recreation or session detachments; healthy projects still report valid changes.
- [x] RC3–RC5: Event history and all tracking structures have tested finite caps; archive first-read/repeated-read/cancellation/cap behavior is correct.
- [x] RC5–RC6: Only the daemon observes data; history and other surfaces share its events. History title is Recent Trellis Changes; UI selection is visibly separate.
- [ ] RC6: Back/focus/scroll, narrow widths, multi-widget rendering, and reload are checked on a supported host or recorded as unverified.

## Out of Scope

Prompt/response/tool content, inferred thinking or stuck states, mtime-derived semantics, persistent history, task mutation, notifications, extra watchers, and Agent Activity.

## Dependencies

First implementation child of the v1.2 parent. Build the archive observation hook here; the Search child will supply additional bounded metadata observations. Parent research/ui-interaction-plan.md defines the proposed UI gate.

## Verification status

Fixture/static acceptance passed after independent review; see `check-evidence.md`.
Host rendering/lifecycle remains unverified in the parent acceptance matrix.
