## Status

Release blocker

## Affected Commit

- `ab525a7`

## Summary

The guest-guide browser page can eventually reach a complete Google Website Translator result, but the application Download PDF flow may capture an earlier partial translation state.

Observed language:

- Turkmen

Potentially affected:

- any language served by the Google Website Translator widget

## Problem Statement

- browser Print after translation can contain the final coherent translated guide
- application Download PDF can capture an earlier partially translated semantic state
- previous export readiness used a short mutation quiet period and a truncated signature
- previous export also created new English strings after translation had already finished
- the temporary PDF export DOM was mounted into the live document without translation protection, so Google Translate could translate already translated Turkmen text a second time

## Constraints

- do not introduce backend or paid translation services
- do not restore stored Frappe translation records
- do not replace the semantic export DOM or per-page browser PDF renderer

## Required Resolution

- capture the original English semantic snapshot before translation
- track Google widget language changes as translation generations
- require a full settled translated semantic snapshot before export
- expose off-screen guide sections so the widget can finish translating them
- compare visible translated semantic nodes against the export model node by node
- abort export when parity fails or the page changes before rendering
- remove post-translation English from the generated PDF
- permit explicitly declared language-specific identical translations without weakening global translation checks
- track semantic progress timestamps from snapshot-fingerprint changes rather than from any node merely differing from English

## Acceptance Criterion

The exported semantic text must exactly match the visible settled guide text at export time.

## Implemented Fix

- the original English semantic baseline is captured before the Google widget can mutate guide content
- semantic nodes remain classified individually; only the Parking section heading declares a language-specific identical allowance with `data-guide-allow-identical-languages="fr"`
- snapshot analysis now accepts intentionally unchanged translatable values only when they are explicitly allowlisted for the current language
- semantic progress timing now updates only when the translated snapshot fingerprint changes, which prevents false “still progressing” timestamps after translation has actually stalled
- image, parity, shell-count, link-annotation, and protected-value checks remain strict
- the PDF export DOM is built while detached, then marked with both `class="notranslate"` and `translate="no"` before mount
- the same no-translate protection is applied to the export root, export document, every export page shell, page body shell, and PDF footer
- export DOM parity is now checked after build, after mount, after pagination, before each page capture, and after rendering
- a temporary export-root mutation guard aborts export if any unexpected post-mount mutation occurs
- Turkmen HAR validation confirms no later `translateHtml` request resubmits already translated guest-guide instruction text from the mounted export DOM

## Legitimate Identical Translation Case

- node: `section:parking:title`
- source text: `Parking`
- accepted identical target language: `fr`
- reason: the French translation is legitimately identical to the English source in this case

This node remains `data-guide-translation-kind="translatable"`. It is not globally exempted, so identical `Parking` still fails readiness for other languages unless explicitly allowed.

## Final Validation Matrix

| Language | Pages | Cards | Images | Parity | Links | Visual result |
| --- | ---: | ---: | ---: | --- | ---: | --- |
| English | 5 | 8 | 8/8 painted | Pass | 2 | Pass |
| French | 5 | 8 | 8/8 painted | Pass | 2 | Pass |
| Turkish | 5 | 8 | 8/8 painted | Pass | 2 | Pass |
| Turkmen | 5 | 8 | 8/8 painted | Pass | 2 | Pass |
| German | 5 | 8 | 8/8 painted | Pass | 2 | Pass |
| Arabic | 5 | 8 | 8/8 painted | Pass | 2 | Pass (RTL) |

## Double-Translation Proof

- reproduction root cause: Google Translate translated the mounted temporary export DOM a second time, corrupting already translated Turkmen text before capture
- protection added: `class="notranslate"` plus `translate="no"` on every mounted export shell before insertion into `document.body`
- Turkmen HAR result: no post-mount `translateHtml` request contained settled Turkmen instruction text as input
- export DOM parity result: detached build, post-mount, post-pagination, pre-capture, and post-render snapshots all matched the settled visible guide text for the same run

## Performance And Image Follow-Up

- follow-up base: `b622dc1`
- goal: reduce browser-side PDF export time without changing the translation-readiness or per-page renderer architecture
- confirmed bottleneck: per-page `html2canvas` captures repeatedly re-fetched proxy images while cloning the larger live document
- confirmed clipping root cause: portrait photos kept the correct aspect ratio but were still clipped by export image frames that used `max-height` with overflow clipping while the image width expanded to the full available card width

### Follow-Up Fix

- export images are now fetched once per unique proxy URL, converted to data URIs, cached in-memory, and reused across the detached export DOM, the mounted export DOM, and the isolated page-capture stage
- live guide proxy images are temporarily inlined during capture preparation so `html2canvas` does not trigger another round of proxy downloads while cloning the owner document
- per-page capture now renders an isolated off-screen same-origin iframe containing only the current export page plus cloned styles, rather than letting `html2canvas` clone the full live document tree
- export performance timings are recorded per stage in `window.__propertyInstructionPdfPerformance`
- final image sizing is now computed from intrinsic image dimensions before pagination, with exact fitted width and height assigned to both the image and its frame
- image validation now rejects export images that preserve ratio but still extend outside their frame bounds

### Before / After

| Metric | Before | After |
| --- | --- | --- |
| Total export time | about `31.3s` | about `10.33s` |
| Proxy image requests | `96` total | `24` total |
| Unique proxy image URLs | `8` | `8` |
| Maximum requests per image | `12` | `3` |
| Approx. transferred proxy-image bytes | about `35.4 MB` | about `8.85 MB` |
| Page capture timings | capture checkpoints around `+16s`, `+20s`, `+23s`, `+26s`, `+29s` | `108ms`, `192ms`, `201ms`, `318ms`, `209ms` |

### Current Result

- the representative Turkmen guide renders with five page shells and five PDF pages
- all eight expected images paint into the PDF canvas
- portrait instruction photos are no longer clipped
- two clickable map links remain present
- Wi-Fi password remains visible in the rendered PDF
- no blank or duplicate pages were detected in the validated runs

## Release Blockers

- Manual Safari validation where a compatible environment is available
- Manual Edge validation where a compatible environment is available

## Release Validation

- Chromium full pass
- manual Safari validation because Playwright WebKit is unavailable locally
- manual Edge validation where an Edge environment is available
- run migration and focused tests on a clean development site
- verify the removed translation DocTypes no longer appear after migration
- confirm no regression to images, links, Wi-Fi password, pagination, and RTL on the actual 99A Burlington Road guide

## Post-Release Enhancements

- actual no-key static map preview in the PDF; current implementation is a link-only fallback when no preview is available
- investigate an optional selectable-text PDF approach; current per-page raster PDF design trades text extraction for layout fidelity
- consider optional manual cleanup of obsolete physical translation SQL tables after confirming they are no longer needed
