## Adaptive PDF Validation Tooling

These scripts are the repository-owned replacement for the temporary `/tmp` browser runners used during adaptive PDF development.

### Browser matrix

Run normal interactive PDF generation flows in Chromium, Firefox, and/or WebKit and save:

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
  --browsers chromium,firefox,webkit \
  --actions download,print \
  --languages en,fr,tr,tk,de,ar \
  --viewport-width 1600 \
  --viewport-height 1200 \
  --output-dir /tmp/propms_pdf_matrix
```

The runner uses the normal route, not artifact mode. It validates the one
adaptive-vector renderer through one-click Download and the Print popup flow.

### Output

Each run writes:

- `manifest.json`
- one JSON result file per browser/language/action
- downloaded PDFs under `pdf/`

Each JSON result includes:

- adaptive-vector renderer identity
- page lifecycle state
- interaction diagnostics
- generation diagnostics
- last error/diagnostics
- browser font requests
- vector font requests
- download or popup result
- PDF path, size and SHA-256 where available

### Renderer

Property Instruction exports use one production architecture: the adaptive
layout rendered directly by jsPDF as `adaptive-vector`. Renderer and layout
query parameters are intentionally ignored; the validation matrix varies
browser, viewport, language, and action rather than PDF implementation.
