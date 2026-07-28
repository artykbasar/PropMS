# Vector PDF Font Inventory

These font files are intentionally tracked for the adaptive vector PDF renderer in:

`/assets/propms/js/property_instruction_export.js`

They are used only for experimental/adaptive vector PDF generation and are not the same files as the browser-facing Inter `.woff2` assets served by Frappe.

## Active files

| Filename | Family | Weight | Runtime use | SHA-256 |
| --- | --- | --- | --- | --- |
| `Inter-Regular.ttf` | Inter | 400 | Latin vector PDF text | `40d692fce188e4471e2b3cba937be967878f631ad3ebbbdcd587687c7ebe0c82` |
| `Inter-Medium.ttf` | Inter | 500 | Latin vector PDF text | `97ad806f526e41546d46365bb3a393145f75b7b1568913db74549ad8b8dba872` |
| `Inter-SemiBold.ttf` | Inter | 600 | Latin vector PDF text | `78a843fade9d4612a5567302fb595b56976eb5fcebf4fea5a5912d638bafcde3` |
| `Inter-Bold.ttf` | Inter | 700 | Latin vector PDF text | `288316099b1e0a47a4716d159098005eef7c0066921f34e3200393dbdb01947f` |
| `NotoSansArabic-Regular.ttf` | Noto Sans Arabic | 400 | Arabic vector PDF text | `ceea25b464a656dc3b26849bab9356740401af62aedf1bfa8b7f0d9b75925b1b` |
| `NotoSansArabic-SemiBold.ttf` | Noto Sans Arabic | 600 | Arabic vector PDF text | `83f122d791bb830b14c59d571859d823349827e4afef23ffa09f5369f62dc5e7` |
| `NotoSansArabic-Bold.ttf` | Noto Sans Arabic | 700 | Arabic vector PDF text | `ed2711b387750ae991b6a980b8dd16fdd65e6702b97e9f52adf3a8edf09ef4df` |

## Provenance

### Inter

- Source project: [rsms/inter](https://github.com/rsms/inter)
- Licence: SIL Open Font License 1.1
- Local font metadata:
  - `Inter-Regular.ttf` fontversion `262210`
  - `Inter-Medium.ttf` fontversion `262210`
  - `Inter-SemiBold.ttf` fontversion `262210`
  - `Inter-Bold.ttf` fontversion `262210`

### Noto Sans Arabic

- Source project: [notofonts/arabic](https://github.com/notofonts/arabic)
- Licence: SIL Open Font License 1.1
- Local font metadata:
  - `NotoSansArabic-Regular.ttf` fontversion `131662`
  - `NotoSansArabic-SemiBold.ttf` fontversion `131662`
  - `NotoSansArabic-Bold.ttf` fontversion `131662`

## Notes

- Inter browser text still comes from Frappe’s own `.woff2` assets.
- The adaptive vector renderer embeds these `.ttf` files into jsPDF.
- Obsolete experimental fonts and unused Latin Noto files were intentionally removed from this directory to keep the review scope and licensing surface small.
- The full SIL OFL 1.1 text used by both families is included in `OFL-1.1.txt`.
