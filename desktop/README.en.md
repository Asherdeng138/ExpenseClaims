# BaoZhang · Windows desktop app

English | [中文](README.md)

The Windows desktop app (Electron). It shares its look and receipt-reading rules with the Android app. Language and currency are under "Settings" at the bottom left, and receipts are read offline on your computer; nothing is uploaded. For downloads and an overview see the [main README](../README.en.md); for step-by-step use see the [user guide](../docs/user-guide.en.md).

Data is kept in the current Windows user's application data folder (`%APPDATA%\baozhang-desktop`). Moving the program folder, switching to the installer or uninstalling it doesn't affect your data.

## Development

From `desktop/`, with Node.js 22:

```text
npm install            # also runs prepare: downloads the Tesseract models and copies the Android PP-OCRv6 models
npm run build          # builds ui/app.js and the PDF.js files (edit ui/app.src.js, never ui/app.js)
npm test               # service tests: storage, import/duplicates, export, backup and restore
npm run test:ui        # browser UI tests, including language, currency and trip countries (simulated Desktop API; needs Playwright)
npm run test:settings  # end-to-end language and currency test in Electron (real IPC, restart, euro scanning, English export)
npm run smoke          # end-to-end test in Electron with real OCR
npm run dist           # packages the NSIS Setup EXE and the ZIP into release/; then set BAOZHANG_PACKAGED=1 and run smoke against the packaged app
```

On Windows you can double-click `tools\build-release-desktop.cmd` in the repository to run all of the above.

There is no trusted Authenticode certificate. electron-builder only edits the EXE's resources (icon, version information); that is not code signing.
