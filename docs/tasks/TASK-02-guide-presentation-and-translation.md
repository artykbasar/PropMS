## Business Context

The guest-facing Property Instruction guide needs one translation and PDF workflow, not two competing systems.

The accepted production model is:

- guests translate the page in the browser with the free Google Website Translator widget
- the downloaded PDF is generated from that already-translated browser view
- no reviewed translation records are stored in Frappe

## Scope

- retain the guest-guide `WebsiteGenerator` page
- keep the free Google Translate widget as the only translation mechanism
- remove the custom translation DocTypes, server-side translation service, and related Desk actions
- replace server-generated translated PDFs with browser-generated PDFs
- preserve existing guide hardening:
  - noindex headers
  - map/link safety
  - Wi-Fi password rendering rules
  - route-specific guest-guide layout

## Architecture

- `Property Instruction` remains the single source document
- page translation is performed only in the guest browser by the free Google widget
- PDF generation happens client-side from the already-rendered translated DOM using explicit A4 page shells
- the export pipeline reads clean translated text from semantic `data-guide-*` hooks, builds an isolated export DOM, paginates it into fixed A4 page shells, rasterizes each shell with `html2canvas`, and assembles the final PDF with `jsPDF`
- no server-side translation cache, translation API, reviewed translation DocType, or translation lookup remains in the feature

## Libraries

- `html2canvas` 1.4.1 is bundled locally under `propms/public/js/vendor/html2canvas.min.js` (MIT)
- `jsPDF` 2.5.1 is bundled locally under `propms/public/js/vendor/jspdf.umd.min.js` (MIT)
- no paid translation service or backend translation SDK is used

## Migration Plan

- remove translation parent and child DocTypes from the app source
- remove translation generation JavaScript and Python service code
- add an idempotent migration patch to remove the obsolete DocType metadata when present
- run `bench --site development.localhost migrate`
- run focused Property Instruction tests
- validate translated browser PDF output in multiple Google Translate languages

## Tests

- guest-guide rendering and route behavior
- Google Translate widget enabled/disabled configuration
- language restriction sanitization
- Wi-Fi password rendering and omission behavior
- browser-PDF export markup and library wiring
- noindex headers and sitemap exclusion
- browser validation for translated PDF output

## Acceptance Criteria

- only the Google Website Translator widget remains as the translation mechanism
- no `Property Instruction Translation` or related translation block code remains in the app
- the downloaded PDF reflects the language currently visible in the browser after widget translation
- cover image, instruction images, links, map section, branding, Wi-Fi password, and pagination remain intact
- no translation credentials or server-side translation state are required
- all intended changes stay isolated to `develop`

## Related Tasks

- `TASK-03-live-page-parity.md`
- `TASK-04-google-widget-pdf-translation-parity.md`

## Search Engine Behaviour

- guest guides return `noindex, nofollow, noarchive, nosnippet, noimageindex` in HTML metadata
- guest guides return `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`
- guest-guide routes remain excluded from sitemap generation

## Cleanup Note

- the migration patch removes Frappe metadata for the deleted translation DocTypes when installed
- physical SQL tables may remain until a later manual database cleanup; this feature does not drop tables automatically
