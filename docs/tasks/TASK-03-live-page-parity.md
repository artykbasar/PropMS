## Business Context

The dynamic Property Instruction page needs to match the guest-facing behavior that already works on the live Estaex Builder page while remaining maintainable inside `propms`.

## Live Page Findings

Source inspected:

- `https://estaex.co.uk/pages/99A-Burlington-Road`
- saved HTML: `/tmp/estaex-builder-page.html`
- rendered DOM inspected in the browser runtime

### Google Translate

The live page uses the stock Google Translate element widget, not the reviewed backend translation flow.

Rendered DOM findings:

- container: `#google_translate_element`
- external script:
  - `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`
- initializer:

```html
function googleTranslateElementInit() {
  new google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
}
```

- rendered widget classes observed:
  - `.skiptranslate`
  - `.goog-te-gadget`
  - `.goog-te-combo`

### Embedded Map

The live Builder page uses a Google iframe embed without an API key.

Rendered iframe attributes:

```html
<iframe
  loading="lazy"
  allowfullscreen
  referrerpolicy="strict-origin-when-cross-origin"
  src="https://www.google.com/maps/embed?pb=..."
  width="450"
  height="450"
  style="border:0;">
```

Wrapper classes observed:

- map column wrapper: `.fb-12ae2ac6`
- immediate iframe wrapper: `.fb-9ed202de`

The page also keeps a separate external Google Maps link ahead of the iframe.

## Local Builder Availability

The local `development.localhost` site does not expose Builder doctypes.

Console findings:

- Builder-like DocTypes: `[]`
- Page-related Builder DocTypes: `[]`
- available relevant page type: `Web Page`

## Architecture Decision

- use the production-style Google Translate widget as the only translation path
- keep Google Translate widget configuration in `Property Management Settings`
- remove the stored reviewed-translation architecture from `propms`
- use a safe generated iframe URL for dynamic records:
  - API-key mode when `google_maps_embed_api_key` exists
  - no-key Google Maps embed fallback on a trusted Google hostname when only address or map query is available
- preserve the external Google Maps button in all cases
- generate guest-guide PDFs in the browser from the already translated DOM rather than from a server-side translated template
- use semantic export DOM generation plus explicit A4 page shells instead of full-document automatic pagination

## PDF Runtime

- local browser PDF assets:
  - `propms/public/js/vendor/html2canvas.min.js` 1.4.1 (MIT)
  - `propms/public/js/vendor/jspdf.umd.min.js` 2.5.1 (MIT)
- current export design:
  - read translated text from semantic guide hooks
  - rebuild a PDF-only DOM with isolated styles
  - paginate into measured A4 shells before capture
  - render each shell independently with `html2canvas`
  - assemble one rasterized shell per `jsPDF` page
  - add clickable link annotations from measured DOM rectangles

## Credentials Strategy

- never commit a real Google Maps key
- production key restrictions should be limited by HTTP referrer:
  - `https://estaex.co.uk/*`
  - `https://*.estaex.co.uk/*`
- development can additionally allow:
  - `http://development.localhost:8000/*`
  - `http://localhost:8000/*`
- no backend translation credentials are required for the current guest-guide architecture

## Validation Plan

- migrate the site after DocType and settings changes
- run the focused Property Instruction tests
- verify rendered HTML contains an iframe without an API key when only address data exists
- verify the Google Translate widget can be enabled and disabled from settings
- validate that browser-generated PDFs reflect the currently translated DOM
