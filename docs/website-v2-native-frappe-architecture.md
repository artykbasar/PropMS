# PropMS Website V2 — Native Frappe Website Architecture

Date: 2026-09-14

Scope: PropMS Website V2 on the production-rehearsal bench. Production was not modified.

## Architectural rule

Website V2 runtime code must not know the identity of Reference Site A, Reference Site B, or any future brand. A site is rendered from Frappe records plus generic PropMS components.

Brand/site-specific values belong in the site database. Reusable capabilities belong in PropMS code/fixtures.

## Native Frappe sources of truth

### Website Settings

Website V2 reads the native Frappe Website Settings record for:

- application/site name
- banner/logo and favicon
- selected Website Theme
- homepage route
- navbar rows and nesting
- Hide Login
- Show Language Picker
- Navbar Search
- call-to-action label and URL
- footer rows and nesting
- footer logo
- copyright
- footer powered text
- Hide Footer Signup
- Show Footer on Login

PropMS adds only the following Custom Fields to Website Settings because current Frappe Website Settings has no equivalent structured fields for them:

- X URL
- Facebook URL
- Instagram URL
- LinkedIn URL
- Google/Maps URL

Those Custom Fields are shipped as fixtures. Their values are site data, not fixture content.

### Contact Us Settings

Website V2 reads native Contact Us Settings for:

- public email
- public telephone
- postal address
- contact introduction/query options where applicable

No company email, phone number or postal address is embedded in the generic V2 renderer.

### Website Theme

Website V2 uses Frappe Website Theme as the branding source. Native Frappe theme fields supply primary/text/background/light/dark values where available.

PropMS adds the minimum additional Website Theme fields needed by the V2 design system:

- secondary colour
- accent colour
- surface colour
- border colour
- card hover style
- PropMS Managed Theme flag

The generic CSS consumes CSS custom properties such as `--brand-primary`, `--brand-secondary`, `--brand-accent`, `--brand-surface`, `--brand-text`, `--brand-border`, `--brand-on-primary`, and `--brand-on-secondary`.

The historical design-token fields on `PropMS Website Settings` remain only as a backward-compatible fallback for restored/older sites. They are hidden in Desk so editors have one active branding surface: **Website Settings → Website Theme**.

There are no active site-specific `.v2-home--*` selectors and no active V2 runtime rules containing site-locked brand colour literals.

The app does not ship site-specific `Color` or `Website Theme` records as global fixtures. Those records are site/deployment data and are promoted explicitly for each installation. The app ships only the reusable Website Theme extension fields and theme-asset preparation machinery.

Generated Frappe `theme_url` and `theme_scss` values are also site-local generated artifacts. `after_migrate` prepares assets for themes explicitly marked as PropMS-managed on that site.

## Page composition

The homepage is a native Frappe Web Page with `content_type = Page Builder`.

It is composed from controlled standard Web Templates shipped by PropMS:

- PropMS V2 Hero
- PropMS V2 Media Content Split
- PropMS V2 Feature Grid
- PropMS V2 Service Grid
- PropMS V2 Area Grid
- PropMS V2 CTA
- PropMS V2 Contact Location

Content, images, section order, section IDs, links, layout choices and card rows are stored in the Web Page block data.

Presentation differences that previously lived in brand CSS are also component data. The Hero exposes overlay style, image treatment and mobile-height choices. The Area Grid exposes heading visibility/alignment/case, logo density, desktop column count and grid width. CTA background media remains ordinary block data. These are generic options available to any site; none of them are selected by hostname or brand name.

The renderer does not contain a `HOME_PROFILES` table, site/domain checks or a brand-name switch.

Normal editors cannot attach arbitrary page CSS, JavaScript or custom CSS classes to controlled V2 blocks. Component values are validated against the Web Template field schema. URLs, section IDs and image sources are validated server-side.

## Data-driven differences between the two rehearsal sites

The two sites intentionally differ because their Frappe records differ, not because runtime code tests their brand name.

### Reference Site A

- Website Theme: a site-managed charcoal/red theme
- homepage: 7 controlled V2 blocks
- contact layout: `cards-form-map`
- Hero: left-gradient overlay, natural media treatment, compact mobile height and `background_scroll = fixed`
- borough-logo Area Grid: heading hidden, compact six-column strip
- CTA: a site-managed image with the shared 80% dark treatment and `background_scroll = fixed`
- native footer signup is enabled
- service/card hover: `brand-fill`, resolving to the selected red primary colour
- Contact Us Settings contains that site's public contact details

### Reference Site B

- Website Theme: a site-managed indigo/gold theme
- homepage: 9 controlled V2 blocks
- extra trust/platform Area Grid blocks are stored as page content
- contact layout: `map-form`
- Hero: solid overlay, muted media treatment, viewport mobile height and `background_scroll = fixed`
- borough-logo Area Grid: heading hidden, compact six-column strip
- `trust-1`: centered uppercase heading, three-column narrow grid
- `trust-2`: centered uppercase heading, five-column full-width grid
- CTA background image is site block data with the shared 80% dark treatment and `background_scroll = fixed`
- service/card hover: `brand-fill`, resolving to the selected gold primary colour
- Contact Us Settings contains that site's public contact details
- social profile URLs are stored in the Website Settings custom fields

Changing any of these choices is a Desk/data operation rather than a code deployment.

Hero and CTA blocks expose a generic **Background scroll behaviour** field (`normal` / `fixed`). The fixed mode reuses the responsive media URL already selected by the browser rather than introducing a second image request. Hero fixed media is enabled from the tablet breakpoint upward, matching the production mobile fallback to normal scrolling; image-backed CTA fixed media remains available at all widths. `prefers-reduced-motion: reduce` keeps the original in-flow image and disables the fixed enhancement.

## Website Theme generated-asset compatibility

Current Frappe development theme compilation can emit CSS imports in generated `/files/website_theme/...` stylesheets using app-public source paths such as `frappe/public/css/...`. A browser resolves those paths relative to `/files/website_theme/`, which caused failed login resources during rehearsal QA.

PropMS handles this through supported extension points rather than modifying Frappe core:

- Website Theme `on_update` calls `propms.website_theme_assets.normalize_generated_theme_asset`.
- only generated `/files/website_theme/...` CSS is considered.
- app-public imports are rewritten to public `/assets/<app>/...` URLs.
- parent-path imports are not rewritten.
- the `after_migrate` hook prepares only themes explicitly marked `PropMS Managed Theme`.
- Frappe `Standard` and the legacy `Day Theme` are not managed or modified by this hook.

Both full rehearsal `bench migrate` runs completed with Standard/Day theme source files unchanged and zero bad relative imports in the active generated PropMS theme CSS.

## Fixtures versus site content

PropMS fixtures define reusable capability:

- Website Settings Custom Fields
- Website Theme Custom Fields
- standard PropMS V2 Web Templates

Site-specific content is intentionally not fixture content:

- Color and Website Theme records
- selected theme
- company/site name
- logo/favicon
- navbar/footer rows
- contact details
- social URLs
- homepage blocks and their values/order
- images
- SEO copy
- CTA copy
- maps
- services/areas content

This separation prevents an app update from overwriting editorial/site data and allows new brands to be created without code changes.

## Rehearsal migration state

Both restored rehearsal sites have already been converted from the old Day homepage blocks to controlled V2 Page Builder blocks and have their Website Settings, Website Theme and Contact Us Settings populated for the desired current presentation.

This content migration is site data. Production must receive the equivalent approved Frappe records/configuration during the deployment change window; it must not be recreated by adding brand-name conditionals to application code.

## Adding another brand/site

A new site should require no new PropMS Python or CSS branch:

1. Configure native Website Settings.
2. Choose/copy/create a Frappe Website Theme and fill any PropMS theme extension fields.
3. Configure native Contact Us Settings.
4. Build the Home Web Page from the standard PropMS V2 Web Templates.
5. Configure navbar/footer/social data.
6. Enter SEO/content/media in Frappe.
7. Enable `propms_v2` only after preview/QA.

If a new presentation requirement cannot be expressed by the existing components, extend the generic component/configuration model. Do not add a site-name selector or domain conditional.

## Rehearsal certification performed for this refactor

After both full `bench migrate` runs:

- 75/75 representative public route/viewport combinations passed at 375, 390, 768, 1024 and 1440 px.
- 50/50 authenticated account route/viewport combinations passed.
- homepage card hover resolved to the selected Website Theme primary colour on both brands.
- Reference Site A contact rendered `cards-form-map`; Reference Site B rendered `map-form` from block data.
- login loaded the selected Frappe Website Theme with zero failed resources and zero console errors.
- live production confirmed fixed Hero and Investors background behaviour; both rehearsal Home pages now store that choice as generic Hero/CTA block data.
- fixed-media QA passed both brands at 375, 390, 768, 1024 and 1440 px: Hero and CTA both retain the configured fixed-background behavior at every viewport width, with zero console/resource failures or horizontal overflow.
- reduced-motion QA keeps both images in normal flow, and the fixed enhancement reuses each already-loaded media resource with no duplicate network request.
- the 768 px Reference Site B QA exposed a fractional logo-grid overflow; logo media is now generically constrained to its grid cell and the five-width matrix passes 10/10.
- Standard Frappe and legacy Day theme source files remained unchanged.
- affected integration/regression suites passed on both sites.
- no active V2 runtime brand-name selector/switch or locked brand hex colour remained.

Production remains untouched.
