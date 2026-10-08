# v1.2 Technical Design

## Architecture and boundaries

The parent coordinates the four roadmap children; it is not a production implementation target. The composite daemon remains the only filesystem observer and Snapshot publisher. Existing parser facts, progress semantics, DMS 1.6.2 floor, trusted-root rules, and State ownership remain intact.

| Boundary | Owner | Contract |
| --- | --- | --- |
| Recent observation | daemon + pure change helper | Whitelisted snapshot/selection/archive observations to bounded runtime events |
| Live search | existing pure projection layer | Shared Snapshot plus bounded query to project-qualified results |
| Archive search | daemon request channel | Safe, lazy metadata batches with explicit partial coverage |
| Quick actions | daemon request channel + path helper | Identity-only request to freshly validated clipboard value/local folder launch |
| Presentation | existing popout | Native themed controls; no new scanner or separate Snapshot |
| Release | acceptance child | Fixture/static and live evidence remain separate |

## Integration decisions

- Event capacity: 200 newest events. Initial/reload/root-scope observations establish a quiet baseline. Reliable per-project task/session baselines survive temporary read failures.
- Publication identity: daemon runtime epoch plus monotonic publication counter; it is distinct from scanGeneration. Add optional daemon-owned runtime provenance without changing the parser's schema-2 fact model.
- Recent events publish in a separate global carrying their source publication identity. Widgets correlate it with the Snapshot provenance instead of assuming two global writes are atomic.
- Archive observations come only from successful bounded page/search reads. The first observation of a coverage unit is a quiet baseline; tracking is bounded to 128 page units / 4096 row identities. Evicted coverage is rebaselined quietly.
- Search limits: query 256 characters; at most 64 live and 64 archive displayed results. Each archive continuation examines at most 128 task.json records and 16 directory listings, with existing per-file/command/month/directory/page/warning limits unchanged.
- Archive search keeps a daemon-owned bounded cursor and one active search lifecycle; it does not piggyback on/cancel detail reads. Partial and capped results are explicit; reaching the result cap requires narrowing the query.
- Quick actions have an independent, serialized, bounded lifecycle. Surfaces send validated identifiers, not paths or executable commands. Clipboard uses dms cl copy argv; folder opening uses a percent-encoded local file URL after canonical validation.
- Both new request channels use request IDs, operation generations, cancellation, and cleanup on disable/reload/root changes. A request from another widget can supersede local work; the superseded widget must leave loading state.
- Only explicit project-result selection may change selectedProjectId. No search/pin persistence is added.
- UI structure and accessibility are specified in research/ui-interaction-plan.md and reviewed with this plan.

## Ordering and compatibility

Implement 1.2.1, then 1.2.2, then 1.2.3, then 1.2.4. Search archive batches feed the established archive observation hook. These children share daemon/widget/projection/test files, so implementation agents run sequentially with explicit ownership; check follows each implementation.

No automatic State migration or capability/permission expansion is needed. Consumers lacking the new globals keep core functionality. Preserve Launcher title-only matching and all v1.1 Health/Diagnostics behavior.

## Release and rollback

The manifest currently says 1.0.0; do not claim that archived v1.1 host gates passed. Prepare v1.2 candidate notes/package separately from stable publication. Set 1.2.0 and publish a stable tag/release only after the acceptance matrix and release decision pass; otherwise record the remaining gates without marking the version complete.

Before that version decision, any local draft ZIP retains and reports the current manifest version and is labeled an unreleased integration artifact. A v1.2 tag/package is built only after the manifest version decision; do not feed a mismatched version into the existing candidate workflow.

Each child has a scoped rollback. Remove its own globals/UI/helper changes only; preserve other child work and the pre-existing roadmap edits. Any changed contract is reviewed against the final plan before broadening scope.
