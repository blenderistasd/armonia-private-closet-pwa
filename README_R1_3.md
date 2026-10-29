# ARMONIA R1.3 — iOS build candidate

The public GitHub Pages PWA keeps user garments in local encrypted IndexedDB. Demo catalog is optional and removable. Native Capacitor candidate reuses the same static client and build setup.

## Verified local commands
- `npm run test:logic`
- `npm run test:sports`
- `npm run build` — creates `www` (no private photos, tests or credentials included)

## Codemagic (not yet executed)
- Manual workflow `armonia-ios-unsigned` generates unsigned IPA for external signing; Apple signature and actual installation must still be verified.
- Add this repository on Codemagic, select YAML, manually start workflow. No automatic triggers configured, no App Store account integrated.
- For signed distribution, add a secure signing pipeline separately. No private credentials belong in the repo.

## iOS photo import
- Decode via `createImageBitmap` when available, else local HTMLImageElement, including iOS HEIC only where the device can decode it.
- Unreadable photos no longer prevent valid photos in a batch from being imported.
- Image metadata / original files are not uploaded; encrypted JPEG thumbnails/data are kept locally.

## Important
- PWA and installed native app have **separate local storage**. Transfer personal data using the encrypted backup and the original password.
- Device clearing or app removal may erase local records; export backups periodically.
- No AI computer-vision garment classification is claimed in R1.3.
