# DMS v0.9.2 i18n — implementation plan

1. [x] Inventory widget, settings, desktop, and Launcher interface strings; keep Trellis-provided names, titles, paths, Markdown, IDs, unknown statuses, and dynamic error details unchanged.
2. [x] Confirm `I18n.trFor` and plugin-catalog fallback from the local DMS 1.6.2 plugin guide. The manifest already requires `>=1.6.2` from the desktop integration, so this task makes no compatibility or permission changes.
3. [x] Wrap fixed labels and stable diagnostics at the QML presentation boundary with literal `I18n.trFor("trellisDms", ...)` source terms.
4. [x] Add `TrellisDms/translations/zh_CN.json`; update Settings, UI docs, and `TrellisDms/README.md` to describe DMS-owned locale selection, English fallback, and narrow-layout behavior.
5. [x] Parse the catalog and compare all literal source terms/placeholders across the four QML surfaces. Static coverage passes for 231 unique source terms.
6. [ ] Live locale switching and visual checks in DMS were not run; retain them as runtime verification gates.

## Validation targets

- JSON validity and translation-key/source-string inventory.
- Static search: no unwrapped plugin-owned UI strings in the covered QML files; no wrapped task titles, project names, paths, Markdown, or unknown status data.
- DMS 1.6.2 runtime: plugin translation loads, locale change reloads it, and missing keys display English source text. Keep unavailable older-version checks explicitly unverified.

## Implementation record

- Added 231 `zh_CN` source entries matching widget, Settings, desktop, and the
  now-present Launcher component. There is no `en.json` or language selector.
- Stable warning and error messages are translated at the UI boundary. Unknown
  or dynamic parser/system details remain intact in English; their values are
  not rewritten in the Snapshot.
- Static JSON/source-key/placeholder checks and `git diff --check` passed.
  `qmllint`/`qmlformat` and a live DMS locale-switch session were unavailable,
  so QML loading, live retranslation, and visual fit remain unverified.

### Locale-switch binding follow-up

- Confirmed the installed DMS 1.6.2 `I18n.trFor()` reads the reactive
  `pluginTranslations` property. `PluginService` reloads and registers that
  table after `I18n.localeApplied`, so translations used inside QML text
  bindings update when the active locale changes.
- Widget preference, State, recovery, Markdown-detail, and archive notices now
  retain English source text; their visible bindings call the localization
  helper. Preference warnings remain newline-separated and are translated
  individually. Unknown dynamic warning details continue to render unchanged.
- Wrapped the Desktop widget heading in `I18n.trFor`; the existing catalog
  already contains its source entry. No Snapshot, State, filter, pin, or archive
  behavior changed.
- Follow-up static binding/catalog checks and `git diff --check` pass. Runtime
  locale switching and visual layout checks remain unverified in DMS.

## Rollback point

If locale integration regresses, restore English source literals and remove the locale table; do not change Snapshot/domain data or block plugin startup.
