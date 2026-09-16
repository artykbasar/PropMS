# M11 — Website V2 Production-Rehearsal Certification

Date: 2026-09-13

Visual re-certification addendum: 2026-09-14

Scope: production rehearsal bench only. Production was not modified.

Starting checkpoint: `98d90c2` (M10).

## Release recommendation

**RELEASE** from rehearsal QA to the normal approval/deployment stage, subject to the production preconditions below.

Eight release/architecture blockers were found during M11/re-certification and fixed before certification:

1. The V2 sitemap advertised redirect-only, duplicate, noindex legacy and placeholder URLs.
2. The Reference Site B homepage depended on an externally hosted partner logo whose TLS certificate is expired.
3. Restored-site legacy `banner_html` rendered before the V2 login shell, leaving duplicate legacy header markup and unnamed icon-only controls.
4. The Reference Site B layered header logo depended on structural CSS that lived only in `home_v2.css`; `/login` did not load that file, so the logo layers rendered at natural size and expanded the header dramatically. The reusable layer layout now lives in shared `website_v2.css`; homepage-only animation remains in `home_v2.css`.
5. `/login` still duplicated a simplified topbar/header/footer instead of using the same Website V2 shell as the homepage. The topbar, header/navigation and footer are now shared Jinja includes, and login receives the exact homepage navigation/footer context while retaining native Frappe authentication content.
6. Native authenticated account pages (`/me`, profile editing, password management and third-party-app management) were visually broken because the restored legacy Website Theme replaced Frappe's standard website bundle while native account CSS also used broad `.container` rules. These routes now extend the native Frappe templates/controllers inside the shared V2 shell, explicitly restore the standard Frappe website bundle, use route-scoped collision fixes, remain noindex, and preserve native permission/authentication behaviour.
7. Homepage branding/content behaviour still relied on the Python `HOME_PROFILES` brand table plus site-specific `.v2-home--*` CSS forks. The homepage is now a native Frappe Page Builder Web Page rendered from controlled PropMS Web Templates; navigation/footer/contact data comes from native Frappe settings and presentation comes from Website Theme/custom fields. Active runtime code no longer switches on either brand/site name.
8. Frappe-generated non-Standard Website Theme CSS contained relative app-public `@import` paths that browsers resolved under `/files/website_theme/`, producing failed resources on login. PropMS now normalizes those generated imports to `/assets/<app>/...` through a Website Theme `on_update` hook and prepares only explicitly marked PropMS-managed themes after migration. Frappe Standard and legacy Day themes remain unmanaged and unchanged.

All affected checks and the Website V2 regression suites passed after the fixes. Login and native account shells were visually compared with each brand homepage at all five required viewport widths.

## Route and viewport certification

Browser QA covered both brands at:

- 375 px
- 390 px
- 768 px
- 1024 px
- 1440 px

The route matrix included homepage, login, authenticated account routes (`/me`, `/update-profile/<user>`, `/update-profile/<user>/edit`, `/update-password`, `/third_party_apps`), policies, Service hub/detail, Area hub/detail, development hub, public development detail, published guest guide where applicable, and 404/403 behaviour. Redirect routes `/about` and `/contact` were verified separately.

Results after blocker fixes:

- expected HTTP statuses preserved
- exactly one H1 on tested rendered pages
- no horizontal overflow
- keyboard focus reachable and visibly styled
- no unnamed visible controls after the login fix
- no browser console errors on the blocker recheck
- no failed resources on the blocker recheck
- no broken images after lazy-loaded media was scrolled into view
- no Bootstrap, jQuery, Vue, React, Swiper or GLightbox leakage on the V2 marketing surface
- V2 login retained native Frappe authentication
- Reference Site B layered logo remained compact on `/login` at 375, 390, 768, 1024 and 1440 px widths
- homepage and `/login` use the same shared topbar, header/navigation and footer templates rather than duplicated shell markup
- for both brands at all five widths, homepage and `/login` exposed identical navigation links, topbar links and footer links; header height also matched at 70 px
- mobile navigation on `/login` opens correctly, updates `aria-expanded`, and produced no console errors
- the five native account URL variants were rendered on both brands at all five required widths (50 authenticated route/viewport combinations) with expected HTTP 200, one H1, no horizontal overflow, no failed resources and no console errors
- `/me` account icons render at normal 18 × 18 px scale rather than the broken full-size SVG presentation
- profile editing retains the native Frappe Web Form controller/widgets; password management retains the native Frappe password JS/controller; third-party-app management retains the native Frappe session view
- homepage and `/me` expose identical topbar links, navigation links, footer links, 70 px header geometry and brand shell colours at every required width
- native protected account routes preserve guest 403 behaviour; logout invalidates the session and a subsequent `/me` request returns 403
- account-route requests no longer load the restored legacy Website Theme or the legacy Google Fonts stylesheet; browser QA observed no external requests on `/me`
- both homepages were rechecked after the account-route changes; no shared-shell regression was found

## Authentication

Native rehearsal authentication was exercised with the supplied Administrator credentials.

- Reference Site A: login API returned `Logged In`; authenticated `/login` returned 301 to `/apps`.
- Reference Site B: login API returned `Logged In`; authenticated `/login` returned 301 to `/desk/home`.
- Authenticated `/me` exposes the native Frappe Edit Profile, Reset Password, Manage 3rd party apps, Home, Desktop and Logout actions on both sites.
- The native profile Web Form initializes its controls and submit/discard actions; the password view keeps native enable/disable validation and password-visibility toggling. The password form was not submitted during QA, so the rehearsal Administrator password was not changed.
- Logout redirects to `/login` and invalidates the account session; fresh guest access to `/me`, `/third_party_apps` and `/update-profile/...` returns HTTP 403 without exposing account content.

M11 does not replace Frappe authentication, authorization, CSRF, rate limiting, Web Form controllers or password-management JavaScript.

## SEO and crawlability

The V2 sitemap now advertises only canonical, indexable V2 routes.

It excludes:

- `/home` duplicate URL
- `/about` and `/contact` redirect-only URLs
- `/instructions/*` noindex guest guides
- legacy `/pages/*` records
- placeholder routes such as `/new-developments/<development_project>`

The sitemap includes published public development records using encoded canonical paths.

Live pages were checked for title, description, robots, canonical, Open Graph metadata and JSON-LD. Indexable V2 pages expose server-rendered title/description/canonical/robots and schema. Login, guest guides and 404s retain their intentional noindex policy.

`robots.txt` remains reachable and advertises the site sitemap.

Known non-blocking SEO debt:

- `/home` remains a live 200 duplicate with canonical `/`; it is excluded from the sitemap. A future 301 may reduce crawl duplication, but the current canonical contract is safe for release.
- Most non-home marketing pages do not currently have a dedicated `og:image`; Open Graph title, description and URL are present. This is a social-preview enhancement, not an indexability blocker.

## Consent and analytics

Fresh-browser consent checks confirmed:

- the consent UI is delayed rather than immediately covering the page
- no Google Tag Manager request occurs before consent
- Reject stores essential=true and analytics/marketing/external_media=false
- external interactive media remains gated

The broken externally hosted trust-logo dependency was removed from rendering. Trust/platform imagery now renders only from PropMS/site-owned media paths; outbound platform links remain available.

## Enquiries

`propms.tests.test_website_enquiry` passed on both sites. Coverage includes payload validation, anti-spam timing/honeypot behaviour, duplicate suppression, persistence before optional notification/CRM integrations, and failure isolation for optional integrations.

The browser matrix also confirmed the rendered form controls are named and keyboard reachable.

## Language selection

Website V2 now respects Frappe's native **Website Settings → Show Language Picker** value. When enabled, the shared shell uses Frappe's enabled-language API and the native preferred-language cookie rather than a brand-specific static selector. Both rehearsal sites currently have the native picker enabled; the specialised guest-guide translation facility remains separate.


## Native Frappe architecture refactor addendum — 2026-09-14

The Website V2 homepage/shell has been refactored so brand/site differences are configuration rather than runtime branches. Frappe Website Settings, Website Theme, Contact Us Settings and Web Page/Page Builder are now the authoritative editing surfaces. PropMS contributes controlled Web Templates, validation, Website Theme extension fields and generated-theme asset preparation.

Rehearsal data now demonstrates that separation directly:

- Reference Site A selects its site-managed Website Theme, uses seven controlled Home blocks and stores `cards-form-map` in the Contact block.
- Reference Site B selects its site-managed Website Theme, uses nine controlled Home blocks (including its trust/platform sections) and stores `map-form` in the Contact block.
- both use the same generic card-hover rule; the hover fill is the selected theme's `--brand-primary` value.
- public contact details come from Contact Us Settings; Reference Site B social links come from Website Settings custom fields.
- no active V2 code checks a site identity, hostname, or site-specific body class to decide presentation.

Post-refactor browser certification comprised 75/75 representative public route/viewport combinations plus 50/50 authenticated account route/viewport combinations, all passing at 375, 390, 768, 1024 and 1440 px with zero console errors and zero failed resources. The architecture and ownership rules are documented in `docs/website-v2-native-frappe-architecture.md`.

### Fresh production visual-parity comparison — 2026-09-14

A fresh side-by-side comparison was then run against the live production homepages at 390 px and 1440 px after the native-Frappe/Page Builder refactor. All eight captures (two brands × two widths × production/rehearsal) returned HTTP 200 with zero browser console errors and zero failed requests.

The comparison found and corrected refactor regressions without reintroducing brand-name CSS: the borough-logo section no longer shows the accidental `Areas` heading and uses a compact six-logo strip; Reference Site A's native footer signup is enabled; Reference Site B trust/platform blocks use their centered uppercase presentation and configured grid widths; and image-backed Investors CTA treatment remains a shared component behavior. Hero overlay/media/mobile-height differences are stored as generic Hero block fields.

Remaining visual differences from the legacy production pages are intentional V2 refinements already accepted in earlier milestones rather than new regressions, including the clearer Reference Site A white header logo, the shared mobile content-first About order, consent-gated map/privacy behaviour, improved semantic heading structure, and removal of legacy stray/broken presentation artefacts. The target is therefore approved visual/brand parity, not a pixel-for-pixel reproduction of legacy defects.

The new parity controls are generic Web Template fields and are covered by `test_hero_presentation_is_data_driven` and `test_area_logo_presentation_is_data_driven`. The affected component/home/native-settings/route suites pass on both rehearsal sites.

### Fixed background-media parity — 2026-09-14

Live production inspection confirmed that both brands keep the Hero background fixed on desktop and use fixed image-backed Investors sections under the dark overlay. The shared Hero and CTA Web Templates now expose `Background scroll behaviour` (`normal` / `fixed`) so this behavior is Page Builder data rather than a site-name CSS fork. Both rehearsal Home pages set Hero and CTA to `fixed`; each site stores its Investors image in block data rather than application code.

Browser QA passed both brands at 375, 390, 768, 1024 and 1440 px. Hero and Investors CTA now both retain the configured fixed-background effect at every viewport width. `prefers-reduced-motion: reduce` disables the fixed enhancement and preserves the original in-flow images. Performance entries confirmed each Hero/CTA media resource is requested once rather than downloaded again for the fixed layer. The same matrix exposed a one-pixel fractional overflow in Reference Site B's five-column platform-logo grid at 768 px; logo media is now generically constrained to its grid cell and the final matrix passed 10/10 with zero console errors, failed requests or horizontal overflow.

The affected suites pass on both sites: 17/17 component tests, 8/8 homepage tests, 8/8 native-settings tests, 15/15 route tests and 6/6 asset-layer tests.

## Performance

Representative lab measurements were captured in headless Chromium on the rehearsal host.

Profiles:

- cold desktop
- warm desktop
- throttled mobile (390 px, 150 ms latency, constrained throughput, 4x CPU slowdown)

Observed ranges across both homepages, both representative Service details and a representative development page:

- cold/warm desktop LCP: 64–316 ms
- throttled-mobile LCP: 816–1132 ms
- CLS: 0 in all measured runs
- observed interaction event latency: 48–64 ms

These are controlled rehearsal lab results, not CrUX field data, but they are below the programme targets of LCP <= 2.5 s, INP <= 200 ms and CLS <= 0.1.

Compressed application asset sizes remain well below budget:

- `website_v2.css`: 4,254 B gzip
- `home_v2.css`: 6,015 B gzip
- `generic_page.css`: 392 B gzip
- `structured_content.css`: 730 B gzip
- `property_v2.css`: 756 B gzip
- `account_v2.css`: 1,075 B gzip (native account routes only)
- `website_v2.js`: 4,409 B gzip
- `property_gallery_v2.js`: 409 B gzip

Normal marketing-page CSS and JS remain far below the 75 KB CSS / 50 KB JS compressed budgets. No new frontend framework was introduced.

## Accessibility

M11 browser checks covered document heading count, horizontal overflow, keyboard navigation, visible focus, named controls and broken media across the five required widths.

The login-specific legacy banner defect found during M11 was fixed by suppressing restored `banner_html` only inside the V2 login template. After the fix both brands showed one H1, zero unnamed visible controls, no overflow and no legacy topbar.

Native account-route re-certification also found no horizontal overflow or console/resource failures at the required widths. `/me` icons are constrained to normal control size, profile/password controls remain native Frappe-labelled controls, mobile navigation remains keyboard-operable, and protected account pages retain HTTP 403 for guests.

Image-alt policy remains contextual:

- content imagery uses meaningful alt text
- decorative/logo imagery can use empty alt text when the adjacent labelled link supplies the accessible name
- Property gallery images receive generated descriptive alt text

Some shell/logo images do not have explicit HTML `width`/`height` attributes. No CLS was observed in the performance or viewport runs, so this is deferred markup hardening rather than a release blocker.

## Code-quality review

Blocking findings fixed in M11:

- sitemap output did not model the V2 routing/indexability contract
- third-party trust-logo availability was allowed to break a first-party homepage
- login inherited restored legacy banner markup before the V2 shell
- login duplicated its own reduced shell instead of reusing the shared V2 shell
- native account routes inherited a restored Website Theme that suppressed Frappe's required website bundle and allowed native broad `.container` rules to break the branded page layout

The account fix uses child templates that extend Frappe's native pages/controllers rather than copying or monkey-patching Frappe core. Permission handling remains native; the V2 hook only changes presentation after the native route context has been resolved. The route-scoped Standard-theme selection restores Frappe's own website bundle only where its native controls require it, and the account stylesheet scopes compatibility rules under `.v2-account`.

No new raw SQL, transaction commits, permission bypasses, monkey patches, core modifications or client framework dependencies were introduced by the fixes.

The guest enquiry endpoint retains explicit string/type validation, local-path validation, rate limiting, honeypot/timing checks and duplicate suppression before `ignore_permissions=True` persistence. Optional notification/CRM failures are isolated after the durable enquiry record is created.

Safe-to-defer technical debt:

- optional `og:image` coverage for non-home marketing pages
- redirecting `/home` to `/` instead of relying on canonicalisation
- explicit intrinsic dimensions for every shell/logo image even though measured CLS is zero
- guest guides intentionally retain their specialised route-specific application bundle and are outside normal marketing-page asset budgets
- production HTTPS/HSTS/reverse-proxy behaviour cannot be certified from the local HTTP rehearsal host and must be checked at deployment

## Automated tests

Final post-migration affected-suite run on **each** rehearsal site:

- `propms.tests.test_website_native_settings`: 8/8 passed
- `propms.tests.test_website_home`: 8/8 passed
- `propms.tests.test_website_routes`: 15/15 passed
- `propms.tests.test_website_components`: 14/14 passed
- `propms.tests.test_website_catalog`: 7/7 passed
- `propms.tests.test_website_seo`: 15/15 passed
- `propms.tests.test_website_enquiry`: 7/7 passed
- `propms.tests.test_website_theme_assets`: 2/2 passed
- `propms.property_management_solution.doctype.propms_website_settings.test_propms_website_settings`: 13/13 passed

Both full rehearsal `bench migrate` runs completed successfully after the fixture/theme refactor. Generated PropMS theme CSS had zero bad relative app-public imports; Frappe Standard and legacy Day theme source files remained unchanged.

Static checks:

- `git diff --check`: passed
- Python compile checks on changed runtime modules: passed
- Custom Field fixture JSON parsed successfully
- site-specific Color/Website Theme records are not shipped as global app fixtures
- active V2 runtime search found no site-name selector/switch and no site-locked colour literals
- changed runtime diff introduced no raw SQL, manual transaction commit/rollback, `eval`/`exec`, guest endpoint or new permission bypass

The refactor adds supported Custom Field fixtures and an `after_migrate` theme-asset preparation hook. Site-specific Color and Website Theme records are deployment data, so deployment **does require the normal `bench migrate`/fixture sync step plus explicit site-data promotion**. It does not modify Frappe core schema/source.

## Legacy rollback certification

The `website_engine` setting was changed live in rehearsal and restored.

Observed on Reference Site A:

- `propms_v2`: `home_v2.css` present
- switched to `legacy_day`: `home_v2.css` absent and legacy Day markers present
- restored to `propms_v2`: `home_v2.css` present again

Both sites were restored to `propms_v2` after the rollback checks.

Rollback procedure:

1. Set `PropMS Website Settings.website_engine` to `legacy_day` on the affected site.
2. Clear the site cache.
3. Verify the homepage no longer loads the V2 asset signature and that the expected legacy route renders.
4. Verify login and a representative public route.
5. If production is deployed through an immutable image, keep the previous known-good image/tag available so application-image rollback can accompany the engine switch if the defect is not presentation-only.
6. Do not delete Day or legacy data until rollback retirement is explicitly approved in a later milestone.

## Final rehearsal release checklist

- [x] Both sites answer HTTP before testing
- [x] PropMS starting checkpoint matched M10
- [x] Existing unrelated outer `frappe_docker` work preserved
- [x] Required route families checked
- [x] Native authenticated account routes visually certified on both brands
- [x] Native profile/password/third-party-app controls and logout behaviour checked
- [x] Guest account-route 403 protection checked
- [x] Five viewport widths checked
- [x] H1 / overflow / keyboard / focus / named controls checked
- [x] Console / failed resource / broken image checks completed
- [x] SEO metadata / robots / canonical / schema checked
- [x] Sitemap and robots checked
- [x] Redirect behaviour checked
- [x] Consent and analytics gating checked
- [x] Enquiry persistence regression coverage passed
- [x] Native authentication verified
- [x] Asset budgets checked
- [x] Cold / warm / throttled-mobile performance measured
- [x] Legacy rollback switch exercised and restored
- [x] Code-quality review completed
- [x] Scheduler remains paused
- [x] Email remains muted
- [x] Tests restored to disabled
- [x] Production not modified

## Preconditions before production deployment

1. Obtain explicit approval for release from the rehearsal candidate.
2. Build an immutable Frappe Docker image from the certified PropMS commit, not from a mutable rehearsal checkout.
3. Preserve the previous production image/tag and `legacy_day` rollback capability.
4. Run the normal production `bench migrate`/fixture-sync step. The final app contains Website Settings/Website Theme Custom Fields and an `after_migrate` hook that prepares only site-created themes explicitly marked as PropMS-managed.
5. Apply the approved **site data** corresponding to the certified rehearsal records: Website Theme selection, native Website Settings/navbar/footer/social values, Contact Us Settings and the controlled V2 Home Page Builder blocks. Site/editorial content is intentionally not shipped as fixtures and must not be recreated as brand-name conditionals in code.
6. Verify the active production generated PropMS Website Theme CSS has no relative `<app>/public/...` imports and confirm Standard/Day themes were not changed.
7. Verify production proxy/TLS/security-header behaviour and canonical hostnames after deployment.
8. Smoke-test both brands after deployment: `/`, `/login`, authenticated `/me`, profile edit, `/update-password`, `/third_party_apps`, logout/guest-403 behaviour, `/policies`, one Service detail, one Area detail, development routes where applicable, `robots.txt`, `sitemap.xml`, 404 and an enquiry dry-run appropriate to production policy.
9. Do not retire Day until rollback retirement is explicitly approved.
