# DMS v0.9.2 Chinese and English i18n

## Goal

Localize plugin-owned interface text in zh_CN and English without changing Trellis data, status semantics, or Snapshot content.

## Requirements

- Cover pill, popout, settings, Markdown fallback, archive, warning/error, loading, and the selected v0.9 surfaces.
- Follow DMS's active locale and plugin translation mechanism; ship `zh_CN` plugin translations with English source strings and the platform's locale fallback.
- Use a stable fallback for missing translations; keep original task titles, Markdown, and paths unchanged.
- Language switching must not change Snapshot, filtering, or archive data.
- Document locale selection, fallback, and narrow-bar/long-text behavior in UI artifacts and user-facing plugin guidance.
- Do not make localization a prerequisite for parsing or startup.

## Confirmed platform behavior

- DMS 1.6.2 plugin docs support `I18n.trFor("trellisDms", "English source")` and per-plugin JSON files under `translations/`.
- DMS loads the file matching its active locale and reloads it when the DMS locale changes. Missing plugin entries fall back through the global DMS catalog and then the English source term.
- `en.json` is not needed because English source strings are the fallback. A plugin-specific locale switch would duplicate the DMS setting and is not required.
- `requires_dms` is now `>=1.6.2` under the approved desktop integration. This task uses that same locally verified API floor and does not change the manifest or permissions.

## Acceptance Criteria

- [x] Core, desktop, and approved Launcher source strings have matching `zh_CN` entries; English source strings remain the fallback.
- [x] DMS 1.6.2 documentation confirms plugin/global/English fallback. Catalog JSON and source-key/placeholder coverage pass static checks.
- [x] Locale changes are presentation-only in the implementation; they do not call scan, Snapshot, State, filter, pin, or archive mutation code.
- [ ] Live locale switching and Chinese/English layout readability in DMS remain runtime verification gates.
