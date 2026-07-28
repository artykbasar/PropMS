## Adaptive PDF Validation Tooling

These scripts are the repository-owned replacement for the temporary `/tmp` browser runners used during adaptive PDF development.

### Browser matrix

Run normal interactive PDF generation flows in Chromium and/or WebKit and save:

- downloaded PDFs
- lifecycle and interaction diagnostics
- font requests
- popup/download results
- a run manifest

Script:

`propms/tools/pdf_validation/browser_matrix.js`

Example:

```bash
NODE_PATH=/Users/artykbasar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules \
/Users/artykbasar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node \
/workspace/development/frappe-bench/apps/propms/propms/tools/pdf_validation/browser_matrix.js \
  --base-url http://127.0.0.1:8000 \
  --property-slug 99a-burlington-road \
  --browsers chromium,webkit \
  --renderers default,raster,vector,legacy \
  --actions download,print \
  --languages en,fr,tr,tk,de,ar \
  --output-dir /tmp/propms_pdf_matrix
```

The runner uses the normal route, not artifact mode. It can validate:

- default no-query route
- explicit legacy route
- explicit adaptive raster route
- explicit adaptive vector route
- one-click Download
- explicit Print popup flow

### Output

Each run writes:

- `manifest.json`
- one JSON result file per browser/language/renderer/action
- downloaded PDFs under `pdf/`

Each JSON result includes:

- renderer selection
- page lifecycle state
- interaction diagnostics
- generation diagnostics
- last error/diagnostics
- browser font requests
- vector font requests
- download or popup result
- PDF path, size and SHA-256 where available

### Routing expectations

Current expected routing:

- no PDF query parameters: adaptive/vector
- `?propms_pdf_layout=legacy`: legacy/default rollback path
- `?propms_pdf_layout=adaptive&propms_pdf_renderer=raster`: adaptive raster
- `?propms_pdf_layout=adaptive&propms_pdf_renderer=vector`: adaptive vector

The adaptive default is still controlled in:

`propms/public/js/property_instruction_export.js`

by `PDF_ADAPTIVE_DEFAULT_RENDERER`.

### Rollback

If adaptive vector needs to be disabled, change:

```js
var PDF_ADAPTIVE_DEFAULT_RENDERER = "vector";
```

back to:

```js
var PDF_ADAPTIVE_DEFAULT_RENDERER = "raster";
```

This leaves:

- the no-query default path on adaptive raster
- `propms_pdf_renderer=vector` available for explicit testing
- `propms_pdf_renderer=raster` available as the explicit fallback
