# Website V2 M10 public route inventory

M10 migrates the remaining **supported PropMS public routes** without deleting Day. Routes outside the public website surface remain native/legacy deliberately.

| Route family | M10 status | Index policy | Access/content policy |
| --- | --- | --- | --- |
| `/login` | V2 visual shell + native Frappe login | noindex | Native Frappe login controller, CSRF, rate limiting and client auth are retained. |
| `/policies` | V2 generic/legal wrapper | index unless Web Page explicitly says noindex | Existing published legal content is sanitised and rendered in the shared V2 shell. |
| `/about` | 301 to `/#about` | destination governs | No duplicate standalone About page exists in either rehearsal site. |
| `/contact` | 301 to `/#contact` | destination governs | No duplicate standalone Contact page exists in either rehearsal site. |
| `/new-developments` | V2 property hub | index | Lists only `Property.publish_online = 1` development projects. |
| `/new-developments/<web_name>` | V2 property detail | index | Resolves only explicitly published development projects and exposes a public-field allowlist. |
| property gallery | V2 native gallery | same as property | Gallery JavaScript loads only when public images exist. No Bootstrap/Swiper/Glightbox dependency is global. |
| `/instructions/<slug>` | specialised guest-guide renderer retained | **noindex** | Only `published = 1` guides resolve publicly. Existing noindex meta and `X-Robots-Tag` are retained. These are intentionally shareable guest documents, not marketing pages. |
| missing routes / HTTP errors | V2 error page | noindex | Original HTTP status is preserved. |
| Desk, APIs and private Property data | native/private | not an SEO surface | M10 does not expose authenticated fields or make private records public. |

## Legacy kept deliberately

Day remains installed for rollback and legacy routes that are not part of the supported public PropMS surface. M10 does not delete it. The shared Website V2 engine remains controlled by per-site `website_engine` configuration.
