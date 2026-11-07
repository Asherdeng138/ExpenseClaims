# BaoZhang (随手报账) · Android and Windows

English | [中文](README.md)

An offline receipt organiser for expense claims: photograph or import receipts → read them on the device → check them yourself → manage them on a calendar → export a combined PDF and an Excel summary for one expense type. The interface switches between Chinese and British English, and the currency can be pounds (GBP) or euros (EUR). Data stays on your device: no account, no server, no cloud sync, and the phone and the computer are independent of each other.

**See the [user guide](docs/user-guide.en.md)** for installing, settings, adding and checking receipts, the calendar and trip countries, allowances, exporting and backups.

## Download

**[Download the latest release →](https://github.com/Asherdeng138/ExpenseClaims/releases/latest)** (no sign-in needed)

Current version: **Android 0.3.0 / Windows 0.4.0** (2026-11-07)

| Platform | File | Notes |
| --- | --- | --- |
| Android | `BaoZhang-0.3.0.apk` | Android 8.0 or later. Signed with the same key as earlier versions: **install over the old version, don't uninstall it** (uninstalling deletes the receipts on your phone). |
| Windows | `BaoZhang-Desktop-0.4.0.zip` (**recommended**) | Windows 10/11, 64-bit. Extract the whole ZIP, then run `随手报账.exe` inside it. Uses your existing data folder. |
| Windows | `BaoZhang-Desktop-Setup-0.4.0.exe` | Installer: current user only, no administrator rights, Start menu and desktop shortcuts. Uninstalling keeps your receipts. |

From Windows 0.4.0 the portable EXE is no longer provided: each time it started it silently unpacked about 600 MB with no window for a long time, and browsers and Windows Security often blocked it.

The release page lists the SHA-256 of every file; check a download with `Get-FileHash <file> -Algorithm SHA256`. Back up from the app's settings before upgrading. The Windows app has no trusted code-signing certificate, so you may see "isn't commonly downloaded" in the browser or "Windows protected your PC / Unknown publisher" when running it. These are reputation prompts: once the hash matches, keep the file or click "More info → Run anyway". If Defender reports a *threat* and quarantines the file, don't restore it or turn off protection; send the threat name and hash to the author. See [Windows download and verification](docs/windows-download.en.md).

## Features

- **Language and currency**: switch in settings; kept after a restart (phone: settings button at the top right; computer: "Settings" at the bottom left). Each receipt keeps its own currency and nothing is converted. Changing the currency doesn't change saved receipts, and you can change one receipt's currency while editing it. Totals are shown per currency.
- **Five expense types**: Local travel (Tube), Long-distance travel, Travel subsistence, Office supplies, Client entertainment.
- **Offline scanning**: the PP-OCRv6 engine reads the date, total paid and merchant on the device (Android also uses ML Kit; Windows falls back to Tesseract). Uncertain fields are left blank with tappable suggestions, and your own edits are never overwritten by a re-scan. With euros selected, it also understands `1.234,56`, `12,50 €` and receipt words such as Summe, Total TTC and Totale; with pounds those rules are off. A receipt marked only in the other currency is flagged for checking, never converted.
- **Automatic cropping**: before reading, receipts are cropped, straightened and turned the right way up (both apps). On Android you can drag the corners in "Crop / straighten", and the exported PDF uses the cropped image; on Windows cropping is only used for reading and the export uses the original. Originals are always kept unchanged.
- **Batch import**: on Android, pick several files and check them one by one, resuming later if you close the app; on Windows, drag files anywhere onto the window or paste a copied WeChat image. One file is one receipt; a multi-page PDF is one receipt.
- **Calendar**: green for business trips, red for office days, blue for leave; mark ranges of dates. Separate from expense types.
- **Trip countries**: when marking a trip, choose the country and number of days. The UK is £50 a day; other countries in the company's Europe region use its daily subsistence rate in euros (e.g. Germany, France, the Netherlands €50; Switzerland and the Nordic countries €60; Italy, Spain, Poland and others €40). A receipt dated on a trip day switches to that country's currency, which you can change back.
- **Allowance reminders** (reminders only; never block saving or exporting):
  - Travel subsistence: the country's daily rate × consecutive trip days, with any one day allowed to go over. A change of country, or an office, leave or unmarked day, starts a new trip; month and year boundaries don't. Only subsistence receipts in that country's currency count.
  - Local travel: £150 per calendar month, pound receipts only; hidden while the currency setting is euros.
  - Below the allowance it shows what's left; at it, fully used; above it, over.
- **Home screen total**: choose the period (this month by default, last month, the month shown in the calendar, this year, all time) and expense type; remembered on the device.
- **Export**: choose an expense type → date range → receipts, then get a combined PDF and an Excel file (details plus a summary by type, with no location column). Sorted by date, with Excel page numbers matching the PDF. File names follow the interface language, e.g. `2026-10-01_to_2026-10-31_Travel_Subsistence_Receipts.pdf` or `October_2026_Local_Travel_Summary.xlsx`. One export can mix currencies: each Excel row shows its currency and each currency is totalled separately. Only checked receipts can be exported.
- **Archive and Recycle Bin**: archive receipts after exporting; deleting from the archive moves them to the Recycle Bin, where they can be restored for 30 days.
- **Duplicate warnings**: the same original file, or the same date, merchant and amount, is flagged as a possible duplicate, and you decide whether to keep it.
- **Backup**: both apps export a ZIP (originals + details + calendar). Windows can merge a backup back in; Android has no one-tap restore yet. Phone and computer backups aren't interchangeable.

## Main limits

- Scan results must be checked by hand, and the location is typed in. In a test on about 150 real receipts, date, amount and merchant were all right about 61% of the time.
- Android: 50 MB per attachment, 30 attachments per receipt, 200 pages per PDF, 200 pages per export. The combined PDF is made of page images, so it doesn't keep searchable text or digital signatures from the original PDFs (the originals are kept intact).
- Windows: 50 MB per file, 100 files per batch, 300 pages per export, 250 MB per backup.
- No zero amounts, refunds or currencies other than GBP and EUR. Dates written with European month names (e.g. `12. März 2026`) aren't read yet and need typing in.

## Building from source (Windows)

| Purpose | Run | Notes |
| --- | --- | --- |
| Set up the Android toolchain (first time) | `build.cmd` | Downloads JDK 17, Gradle 8.13 and Android SDK 36 into `.tools/`; you must accept the SDK licences |
| Android release | `tools\build-release-android.cmd` | Java tests, lint, signed APK, 16 KB alignment check; writes `output\BaoZhang-<version>.apk` |
| Android test build | `tools\build-apk-test.cmd` | As above, written to `output\test\` so it doesn't replace the release |
| Windows release | `tools\build-release-desktop.cmd` | Fetches Node 22, installs dependencies, builds, runs the tests (including a real-OCR smoke test), packages the Setup EXE and ZIP, then tests the packaged app |
| Both | `tools\build-release-all.cmd` | Runs the two release scripts in turn |
| Publish to GitHub | `tools\publish-release.cmd` | Needs the GitHub CLI and `gh auth login`; checks the hashes, then uploads the latest release |

Logs go to `output\`. Node tests: `node --test tests/parser.test.cjs tests/parser-sync.test.cjs tests/i18n.test.cjs tests/version-label.test.cjs`. For desktop development commands see [desktop/README.en.md](desktop/README.en.md).

The Android release must be signed with the original key to install over earlier versions. That key (`.tools/personal-release.p12`, `.tools/signing.properties`) is private and is not in this repository; a build from a fork will be signed with a different key and can't upgrade an installed copy of the published app.

The apps make no network requests at run time: the Android app has its internet permission removed, and the Windows app blocks all HTTP/HTTPS requests. Only build steps download tools, dependencies and OCR models.

Licence: no open-source licence has been chosen yet (`desktop/package.json` says `UNLICENSED`).

## Documents

- [User guide](docs/user-guide.en.md) ([中文](docs/user-guide.md))
- [Windows download and verification](docs/windows-download.en.md) ([中文](docs/windows-download.md))
- [Change log](docs/CHANGELOG.md) (Chinese): every change, the reason and the tests run.
- [AGENTS.md](AGENTS.md) (Chinese): development rules and business constraints.
- [docs/history/](docs/history/) (Chinese): notes and test records from older versions (out of date, for reference only).
