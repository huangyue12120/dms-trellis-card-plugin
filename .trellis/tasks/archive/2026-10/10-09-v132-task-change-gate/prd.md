# v1.3.2 Task Change Notification Gate

## Goal

Evaluate whether a small set of Task Change notifications provides distinct
user value at acceptable noise, then close the gate with an explicit decision.

## Evidence to use

- v1.2 Recent Changes is runtime-only, bounded, and quiet on initial/reload
  observations.
- It reports semantic task/archive observations but deliberately does not infer
  Agent activity or task completion from disappearance.
- The repository contains no usage telemetry or user evidence showing that
  `task entered archive` or `new active task observed` should interrupt users.

## Requirements

- Evaluate the two candidate events against user value, false-positive/noise
  risk, deduplication, restart behavior, and overlap with passive Recent
  Changes.
- Do not add implementation or notification consumers in this child.
- Close the gate as exactly `IMPLEMENT LIMITED SET`, `DEFER`, or `REJECT`.

## Acceptance Criteria

- [x] A short evidence record cites the v1.2 contract and explains the selected
  decision.
- [x] The record explicitly rejects per-watcher, session-count, inferred
  activity, and Markdown-content alerts.
- [x] Parent release notes and `PROJECT_PROGRESS.md` can link to the decision.

## Decision

`DEFER`: passive Recent Changes already covers observed task transitions, while
the repository has no evidence that active task/archive notifications justify
the added interruption and maintenance cost.

## Out of scope

Any QML, daemon, manifest, settings, notification, parser, watcher, or Trellis
write change.
