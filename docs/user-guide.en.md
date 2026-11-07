# BaoZhang · User guide

English | [中文](user-guide.md)

BaoZhang (随手报账) is an offline receipt organiser for expense claims, for Android phones and Windows PCs. This guide covers Android 0.3.0 and Windows 0.4.0. The phone and the computer each keep their own data; they do not sync.

## 1. Download and install

Download from the [GitHub release page](https://github.com/Asherdeng138/ExpenseClaims/releases/latest) (no sign-in needed). The release page lists a SHA-256 checksum for every file, so you can check the download is complete and unaltered.

### Android (8.0 or later)

1. Download `BaoZhang-<version>.apk`. If your browser warns that this type of file may be harmful, check it came from this project's release page, then choose to keep it.
2. Open the APK. The first time, Android asks you to allow your browser or file manager to install unknown apps. Android asks this for every app that doesn't come from an app store.
3. **When upgrading, install over the old version. Don't uninstall it first**: uninstalling deletes the receipts on your phone. The new version is signed with the same key as the old one, so installing over it keeps your data. If Android says you must uninstall first, stop and report it.
4. If Google Play Protect says it hasn't scanned this app, you can carry on installing from its prompt (usually under "Details" or "More"). The app asks for no internet, SMS or contacts permissions, and receipts are processed only on your phone. If Play Protect says it has *blocked a harmful app*, don't force the install; send the author a screenshot.

### Windows 10/11 (64-bit)

| File | How to use it |
| --- | --- |
| `BaoZhang-Desktop-<version>.zip` (recommended) | Right-click → "Extract All" into an ordinary folder, then run `随手报账.exe` inside it. Keep the other files next to it, and don't run it from inside the ZIP. |
| `BaoZhang-Desktop-Setup-<version>.exe` | Installer. Installs for the current user only, needs no administrator rights, and adds Start menu and desktop shortcuts. |

The app isn't signed with a commercial code-signing certificate, so Windows shows it as from an "Unknown publisher". After checking the SHA-256: if the browser says the file "isn't commonly downloaded", choose "Keep"; if Windows shows "Windows protected your PC", click "More info" → "Run anyway". If Windows Security reports a *threat* or *virus*, don't restore the file or turn off your antivirus; send the threat name to the author. See [Windows download and verification](windows-download.en.md).

To upgrade, close the old version first, then run the new one. The ZIP, the installer and the old portable EXE all use the same data folder (`%APPDATA%\baozhang-desktop`), so switching between them doesn't lose any data.

## 2. First steps: language and currency

- **Phone**: tap the settings button at the top right ("Settings & help"). **Computer**: click "Settings" at the bottom left.
- Choose Chinese or English (British English), and pounds (GBP) or euros (EUR). Your choices are kept after a restart.
- Each receipt keeps its own currency and **nothing is converted between currencies**. Changing the setting doesn't change saved receipts, and you can change the currency of a single receipt while editing it. Totals are shown per currency, e.g. `£10.00 + €5.00`.
- Changing the language doesn't change your data. Export file names, Excel headings and expense types follow the current language.

## 3. Expense types

Local travel (Tube), Long-distance travel, Travel subsistence, Office supplies, Client entertainment. Choose the type before adding receipts.

## 4. Adding and checking receipts

### Phone

1. On the home screen tap "Add receipt", then choose the expense type.
2. Tap "Take a photo", or "Import images / PDFs" (press and hold to pick several, up to 30 files at a time). Each file is one receipt; for a receipt with several pages, use "Add a photo" or "Add an attachment" while checking it.
3. The app crops, straightens and reads the receipt on your phone, which takes about 10–30 seconds. If the crop is wrong, tap "Crop / straighten" and drag the four corners. The original image is always kept.
4. Check the date, total paid and merchant. Suggestions read from the receipt appear as buttons you can tap to fill in; anything the app isn't sure of is left blank for you to fill in. Location and notes are optional.
5. Tick "I’ve checked the date, total paid, merchant and expense type." and tap "Confirm and save". When importing several files, the next one opens automatically, and you can come back to an unfinished batch later.

### Computer

1. In the "Workbench", click "＋ Add receipts", or drag files anywhere onto the window (up to 100 per batch, 50 MB per file). For WeChat images, copy the image and click "Paste WeChat image". Choose the expense type, then import.
2. Tick the receipts to read and click "Scan selected". Receipts are scanned one at a time, and you can "Stop remaining scans" at any point.
3. Check each receipt against the original on the right ("View full size" opens it in its own window to zoom, rotate and turn pages). Tick "I’ve checked the date, amount, merchant and type against the original." and click "Save and go to next". If you haven't finished checking, use "Save to check later".

**Only receipts you have ticked as checked and saved can be exported.** Scan results are suggestions only and are never confirmed automatically.

## 5. Calendar and trip countries

- The calendar marks each day as **green for a business trip, red for office and blue for leave**, with the word shown as well. Calendar status is separate from expense type.
- On the phone tap "Mark trip / office / leave"; on the computer use the panel next to the "Calendar". You can mark one day or a range of dates.
- When you mark a **Trip**, choose the **country** and the **number of days** (the number of days and the end date update each other). The default country is the United Kingdom.

| Daily subsistence allowance | Countries |
| --- | --- |
| £50 (pounds) | United Kingdom |
| €60 | Switzerland, Finland, Sweden, Denmark, Norway, Iceland |
| €50 | Netherlands, Belgium, Luxembourg, Germany, France, Austria, Ireland, Israel and other Middle Eastern countries |
| €40 | Poland, Italy, Greece, Spain, Portugal, Czech Republic, Slovakia, Hungary, Serbia, Romania, Bulgaria, Russia, South Africa, Croatia and other Eastern European countries |

- A receipt dated on a trip day automatically switches to that country's currency. You can change it back by hand.
- Allowances for Switzerland, the Nordic countries and Eastern Europe are set in euros by company policy. Receipts in local currencies (such as CHF or PLN) aren't supported yet.

## 6. Allowance reminders (reminders only; they never stop you saving or exporting)

- **Travel subsistence**: allowance = the trip country's daily rate × the number of consecutive trip days; one day can go over. A change of country, or an office, leave or unmarked day, starts a new trip; crossing into a new month or year doesn't. Only confirmed subsistence receipts in that country's currency count; receipts in other currencies are only counted and mentioned.
- **Local travel**: £150 per calendar month, counting pound receipts only; hidden while the currency setting is euros.
- Below the allowance you see how much is left; at the allowance it shows as fully used; above it shows as over.

## 7. Exporting a claim

1. On the phone tap "Export" at the bottom; on the computer click "Export claim".
2. Choose one expense type, then a date range (both the start and end days are included), then tick the receipts to export.
3. Click "Create PDF + Excel". You get one combined PDF of the receipts and one Excel summary. The Excel file has no location column, shows the currency on each row and totals each currency separately; its page numbers match the PDF.
4. On the phone, "Save to a folder on your phone" or "Share files"; on the computer, "Open export folder".
5. Example file names: `2026-10-01_to_2026-10-31_Travel_Subsistence_Receipts.pdf`; local travel is named by month, e.g. `October_2026_Local_Travel_Summary.xlsx`. With the Chinese interface the names are in Chinese.

## 8. Archive and Recycle Bin

- After a successful export you can "Archive" the exported receipts. Archived receipts still appear in your lists and allowance totals, can be exported again, and can be unarchived.
- Deleting an archived receipt in "Archive & Recycle Bin" moves it to the Recycle Bin, where you can "Restore to archive" within 30 days; after that it is removed automatically. Deleting anywhere else is permanent.

## 9. Upgrading, changing devices and backups

### Upgrading the computer app (same computer): nothing to sync, your receipts are still there

The desktop app doesn't keep receipts in the program folder. They live in the current Windows user's data folder, `%APPDATA%\baozhang-desktop` (which holds `receipts.json` and a `documents` folder of originals). The old portable EXE, the ZIP and the installer all read this same folder, so:

1. Optionally, click "Back up all receipts" at the bottom left of the old version first, to keep a ZIP just in case.
2. Close the old version.
3. Extract the new ZIP and run `随手报账.exe`, or run the `Setup` installer.
4. Your existing receipts, calendar marks and settings appear as before.

Once the new version works, you can delete the old program files (the old portable EXE or the folder you extracted from an old ZIP). **Don't delete `%APPDATA%\baozhang-desktop`**: that's where your receipts are. To look at it, press Win + R, paste `%APPDATA%\baozhang-desktop` and press Enter. Uninstalling the installer version doesn't delete it either.

### Upgrading the phone app: install over the old version

Install the new APK over the old one; receipts, drafts and the calendar are kept. **Don't uninstall the old version first**: that deletes the receipts on your phone.

### Moving to a new computer

1. On the old computer, click "Back up all receipts" at the bottom left and keep the ZIP.
2. Copy the ZIP to the new computer, then install or extract the new version and open it.
3. Click "Restore a desktop backup" at the bottom left and choose the ZIP. The backup is merged in: duplicate originals are skipped, existing calendar marks and settings on the new computer are left alone, and each receipt keeps its own currency.

If the backup would be over 250 MB, the app tells you to copy the app data folder instead. In that case, **close BaoZhang on both computers**, then copy the whole `%APPDATA%\baozhang-desktop` folder from the old computer to the same place on the new one. Only do this while the new computer has no receipts yet, or you will overwrite them.

### Moving to a new phone

On the old phone, tap "Back up all originals (ZIP)" in settings and keep the ZIP on a computer or cloud drive. The phone app **has no one-tap restore yet**: the ZIP keeps all originals, details and the calendar, but on the new phone you need to import the originals again with "Import images / PDFs" and check them.

### Between phone and computer

The phone and the computer **don't sync with each other**; each keeps its own receipts. A phone backup can't be restored on the computer, and a computer backup can't be restored on the phone. Add receipts on each device where you need them.

### Backup reminders

- A backup holds the originals, receipt details (including each receipt's currency) and the calendar. Restoring never changes the language and currency settings on the device.
- **Uninstalling the phone app or clearing its data deletes your receipts.** Back up before reinstalling Windows or changing computers too.

## 10. Privacy and limits

- No account, no server, no cloud sync; receipts are read offline on your device. The phone app has no internet permission, and the desktop app blocks all network requests.
- Scan results must be checked by you. In a test on about 150 real receipts, the date, amount and merchant were all right about 61% of the time.
- Zero amounts, refunds and currencies other than pounds and euros aren't supported. Dates written with European month names (e.g. `12. März 2026`) need to be typed in.
- Phone: 50 MB per attachment, up to 30 attachments per receipt, up to 200 pages per PDF and 200 pages per export. Computer: 50 MB per file, up to 100 files per batch, 300 pages per export, 250 MB per backup.
