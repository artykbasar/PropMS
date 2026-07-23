## Business Context

The guest-facing Property Instruction guide needs to evolve from a basic published page into a production-ready guest document that supports three operational requirements:

- a branded embedded map without accepting arbitrary iframe markup
- a professional A4 print layout that works for save-to-PDF handoff
- a secure reviewed translation architecture that keeps cloud credentials server-side

## Scope

- Add safe Google Maps Embed support backed by site or environment configuration
- Rebuild print CSS for full-width A4 output and compact printed metadata
- Add reviewed translation DocTypes and a server-side translation generation flow
- Add a public language selector that only exposes reviewed translations
- Extend focused automated tests for map rendering, printing, and multilingual behavior

## Credentials Strategy

- `google_maps_embed_api_key` may be supplied from site config or `GOOGLE_MAPS_EMBED_API_KEY`
- the embed key is intentionally present in the iframe URL and must be restricted by HTTP referrer in production
- Google Cloud Translation must use Application Default Credentials only
- recommended runtime secret:
  - `GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/estaex-google-translation.json`
- site config may store only non-secret identifiers such as project id and location
- no service account JSON, API keys, passwords, or access codes are committed

## Architecture

- `Property Instruction` remains the public `WebsiteGenerator`
- map embed URLs are generated server-side from structured fields only
- translation state is stored in:
  - `Property Instruction Translation`
  - `Property Instruction Translation Block`
- a Desk action generates or refreshes translations server-side and stores them as `Draft`
- source edits mark existing translations `Stale`
- public language selection uses `?lang=<code>` and falls back to English unless a translation is `Ready`
- print output is driven by template-scoped CSS only, with no builder dependency
- Google Translate changes only the rendered browser DOM, so translated PDF downloads cannot rely on the existing GET endpoint alone
- the guide now emits stable `data-pdf-*` markers for permitted translatable fields and posts a signed, size-limited snapshot back to the server for PDF generation
- the PDF endpoint reconstructs the document from the published source record, overlays only permitted translated text, and preserves protected operational values such as address, Wi-Fi identifiers, URLs, and block order

## Migration Plan

- add map-related fields to `Property Instruction`
- add translation parent and child DocTypes
- add the form script for translation generation
- run `bench --site development.localhost migrate`
- run focused tests and route checks after each slice

## Tests

- map helper URL generation and iframe rendering
- print CSS regressions and removal of `javascript:` links
- translation generation behavior with mocks
- translation visibility and fallback rules
- source-change staleness behavior
- existing Property test module remains part of focused validation

## Acceptance Criteria

- embedded maps render only when explicitly enabled and configured
- external Google Maps navigation remains available even without an iframe
- printed guides use full A4 width with no narrow sidebar column
- public guides never expose Wi-Fi passwords or cloud credentials
- only `Ready` translations are public
- Draft or Stale translations fall back cleanly to English
- translated output remains sanitized and ordered
- all intended changes stay isolated to `feature/property-instructions`
