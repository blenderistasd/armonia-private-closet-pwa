# ARMONIA R1.3 — iOS native QA preflight (29/10/2026)

## Provenance
- Repository: https://github.com/blenderistasd/armonia-private-closet-pwa
- Workflow: `armonia-ios-unsigned`; macOS M2; manual only; no automatic CI triggers.
- Bundle ID: `it.armonia.closet.private`; Capacitor 8.0.0; Node 22+; Swift Package Manager.
- Native WebView does NOT share Safari IndexedDB: use encrypted backup export/import and keep the original password.

## Verified on authorized Windows PC
- Git working tree R1.3 base unchanged except isolated iOS workflow QA changes.
- Tests `test:logic` and `test:sports` previously PASS.
- Browser test of live R1.3 previously PASS for 30 encrypted demos, private isolation, running/evening/office/travel, save/reopen, non-destructive demo removal.
- Fresh CI-like build in isolated `CI_REPRO_CLEAN`: `npm run build` PASS, `cap add ios --packagemanager SPM` PASS, `cap sync ios` PASS.
- Verified fresh Xcode project file, Info.plist, app.js/demo.js resource copy and native bundle ID.

## Not yet verified
- Codemagic account application registration, current account free-minute balance and billing configuration.
- macOS Xcode compilation, unsigned IPA file and ARM64 binary inside compiled App.app.
- iPASide signing and actual iPhone installation.
- HEIC decoding on physical Apple device and long-term storage quota behavior.

## Safety gate
Do not launch a Codemagic build until current available free-minute balance and billing state are verified, and the application is registered correctly. Do not use GitHub Actions, do not submit a signed App Store build, and never copy user photographs, keys or passwords to the CI repository.

## Release steps
1. Add the public repository in Codemagic and enable YAML configuration.
2. Confirm individual Mac M2 free minutes; manually run `armonia-ios-unsigned` on `main`.
3. Download `Armonia_R1_3_UNSIGNED.ipa` together with SHA-256 and Xcode log; validate bundle ID, ARM64, file integrity.
4. Sign/install via iPASide with the intended device explicitly connected and authorized.
5. On the native app, if migrating from Safari PWA, use encrypted backup; do not delete the existing PWA data until restore is verified.
