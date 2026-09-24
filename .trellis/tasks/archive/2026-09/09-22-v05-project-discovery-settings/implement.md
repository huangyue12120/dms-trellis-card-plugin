# Safe discovery implementation plan

1. Add/test effective-root selection and remembered-summary helpers.
2. Build the trusted-folder settings list and folder picker.
3. Preserve legacy `projectRoot` fallback without showing competing controls.
4. Pass effective roots through the existing normalize/canonicalize/depth/cap
   path in the daemon.
5. Persist successful bounded project summaries to DMS state only.
6. Verify no implicit broad root, state-to-trust promotion, or Trellis write.

Validate multi-root, empty, duplicate, invalid, legacy, successful-cache, and
degraded-cache contracts plus available live folder-picker/rescan behavior.
