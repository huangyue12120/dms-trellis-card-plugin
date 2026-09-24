# v0.8.2 stability and security design

## Measurement boundary

Use existing limits in the frontend quality contract and TrellisWatch/TrellisPaths helpers as the source of truth. Measure active objects and refresh outcomes through the available static/offscreen/live surfaces; do not replace missing live measurements with guessed counts.

## Security boundary

Exercise only disposable filesystem fixtures. Canonicalize candidates before containment assertions. Keep FileView read-only and ensure the widget never receives raw paths or owns Trellis readers. Archive and Markdown stay outside the live Snapshot.

## Lifecycle boundary

Trace daemon generation, topology queueing, known-file debounce, watcher registry, and destroy/reload cleanup. Multiple widgets must observe the same published Snapshot. A callback from an old generation must not publish or mutate current state.

## Compatibility

Do not change limits or DMS APIs unless a reproduced regression requires it and the existing contract permits the change. Any cap adjustment needs evidence and an updated contract in the owning implementation task.
