# v0.8.1 state-matrix design

## Data flow

Use existing disposable on-disk fixtures and the pure parser/path/projection modules. Assert the resulting schema-1 Snapshot and makePillProjection/makePopoutProjection outputs; use QML/static checks for visible controls and recovery copy. Where an already-configured real project is available, inspect it read-only and label that evidence separately.

## Boundaries

Keep all fixture mutations under the system temporary directory. Do not seed, modify, rename, or archive real Trellis tasks. Keep archive/detail requests separate from the live Snapshot and preserve progress:null.

## Failure handling

A mismatch becomes a targeted test failure and, if reproduced in the product, a small source fix. Do not add fallback behavior solely to make a fixture pass. Runtime timing and settings behavior require a live host result; a Node fixture cannot satisfy them.
