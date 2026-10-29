# ARMONIA R1.4 — 100 photographically sourced garments

Date: 2026-10-29. Test device: Windows PC via headless Microsoft Edge with 393 x 852 touch viewport. Physical iPhone test remains pending.

## Data provenance
- 100 independent real-garment photographs from alexeygrigorev/clothing-dataset, repository documented CC0-1.0.
- Source: https://github.com/alexeygrigorev/clothing-dataset
- 100 original source URLs, class annotations and license references in photodemo_meta.json.
- This is a PHOTO DEMO, not a set of verifiable products currently on sale. Brand, material, size, inventory and prices are intentionally not claimed.
- Category count: top 20, bottom 22, dress 14, outer 16, shoes 16, accessory 8, intimate 4.
- All 100 pictures transformed into optimized local WebP assets (~1.4 MB total); import is opt-in and encrypted as IndexedDB garment records.
- Source class labels may contain errors. Colors manually reviewed from contact sheets; style and occasion attributes are approximate test metadata.

## End-to-end browser evidence
- PASS: new encrypted vault and explicit photographic demo import action.
- PASS: 100 photographic garments stored; 96 ordinary cards visible and 4 private undergarments hidden by default.
- PASS: explicit private category shows 4 items.
- PASS: outfit requests for running (2), elegant evening (3), office (3), travel (3); no private garments in ordinary looks.
- PASS: re-import of 100 is idempotent and does not create duplicates.
- PASS: remove-photo-demo clears all 100 photographic demo records.
- PASS: original 30 illustrated demo garments still load after removing photos, and persist across unlock/reopen.
- PASS: existing tests for encryption, backup, sport compatibility, and private garment filtering unchanged.
- Evidence: docs/qa/QA_R14_home.jpg and docs/qa/QA_R14_closet.jpg.

## Limits / next verification
- Native IPA build / code signing not performed; app is available as offline-capable HTTPS PWA.
- Real clothing photos can include mixed womens/mens/unisex items; 100 photo set is intended for UX and recommendation testing.
- The color/occasion attributes are demonstration metadata and must be user-editable before relying on precise styling.
- Dataset images are CC0 according to source repository, but avoid presenting these as specific retail listings.
- Browser local storage is device specific; encrypted backup required to move photo collection to native app or another browser.
