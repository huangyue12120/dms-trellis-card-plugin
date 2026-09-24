# v0.6.3 design

## Integration boundary

This child consumes the completed parser/projection/Widget contracts and fixes
only state-matrix, responsive, lifecycle, or release-gate defects found during
integration. It does not redesign the primary policy or popout model.

## State and recovery matrix

Fixtures enter through the same pure parser/projection interfaces used by the
runtime. A state record defines Snapshot input, normalized UI State, expected
pill kind/label/icon, expected visible project/task groups, warning presence,
and allowed recovery action. Rescan keeps the last coherent view until a new
Snapshot publishes; loading never exposes a partial list.

Manual refresh writes only the existing DMS `refreshToken` setting. Opening
settings uses the documented DMS settings surface when available. Neither
action touches a Trellis root.

## Responsive validation

Static checks prove bounded/elided text and icon-only vertical composition.
The offscreen/real DMS gate exercises target 420 × 480 and constrained narrow
popouts, scrolling, native focus order, long values, warning blocks, and
controls. Unsupported host pill-keyboard behavior remains a documented limit.

## Lifecycle and release

Reload validation distinguishes a newly loaded v0.6 generation from a stale
survivor by checking settings/projection behavior and DMS logs. State checks
wait beyond the host debounce before restart observation. A host failure is
reported rather than masked with plugin settings.

Only after the full test matrix passes is the manifest changed to `0.6.0` and
roadmap/spec evidence updated. Rollback restores `0.5.0` together with all v0.6
integration changes; State keys remain inert and safe.
