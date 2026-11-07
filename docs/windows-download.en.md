# Windows: download, verification and security prompts

English | [中文](windows-download.md)

This page can be pasted straight into a GitHub release description. Replace `<version>` with the actual version, e.g. `0.4.0`.

## Which file to download

| File | Best for | How to use it |
| --- | --- | --- |
| `BaoZhang-Desktop-<version>.zip` (**recommended**) | Everyone; nothing to install | Right-click → "Extract All" into an ordinary folder (e.g. `Documents\BaoZhang`), then run `随手报账.exe` inside it. Keep the other files next to it; don't copy just the EXE, and don't run it from inside the ZIP. |
| `BaoZhang-Desktop-Setup-<version>.exe` | If you want Start menu and desktop shortcuts | Double-click to install. Installs for the current user only, needs no administrator rights, and lets you choose the folder. Uninstall from Settings → Apps; uninstalling keeps your receipts. |

Both keep your receipts in the `随手报账` folder under `%APPDATA%`, the same place as the old portable EXE, so switching between them loses nothing. Before upgrading, back up from the bottom-left of the app and close the old version.

Windows 0.3.1 and earlier only offered a portable `BaoZhang-Desktop-<version>.exe` plus the ZIP; for those releases, download the ZIP. Every time the portable EXE starts, it silently unpacks about 600 MB (over 7,000 files) into a temporary folder with no window showing, so it can look as though it won't open, and security software is more likely to block it. From 0.4.0 it is no longer provided.

## Checking the file (SHA-256)

The release page lists the SHA-256 of every file. In the folder holding the download, Shift + right-click → "Open in Terminal", then run (with the name of the file you downloaded):

```powershell
Get-FileHash .\BaoZhang-Desktop-<version>.zip -Algorithm SHA256
```

The Hash must match the release page (upper or lower case doesn't matter). If it doesn't, delete the file and download it again. Only download from this project's GitHub release page.

## If Windows shows a security prompt

BaoZhang is not signed with a trusted code-signing certificate, so Windows treats it as from an "Unknown publisher", and a new version has little download history, so it has no reputation yet. These are **reputation prompts, not virus detections**:

| Prompt | Meaning | What to do |
| --- | --- | --- |
| Edge: "*file* isn't commonly downloaded" / "couldn't be verified"; Chrome: "uncommon download" | The browser's download reputation check (Microsoft Defender SmartScreen or Google Safe Browsing) on an unsigned EXE with few downloads | Check it came from this project's release page. In Edge: "…" → "Keep" → "Show more" → "Keep anyway"; in Chrome choose "Keep" in the download list. Or download the ZIP instead (ZIPs usually aren't blocked this way). Check the SHA-256 after keeping it. |
| Blue "Windows protected your PC" window when you run it | SmartScreen app reputation check, because of the "Unknown publisher" | Once the SHA-256 matches, click "More info" → "Run anyway". |
| Windows Security / Defender says it found a "threat" or "virus" and quarantined the file | An antivirus detection (possibly a false positive) | **Don't** restore the file, turn off protection or add an exclusion. Note the threat name shown and send it to the author with the file name and SHA-256; the author can submit that file to Microsoft for false-positive review. Meanwhile, try the other download. |

Never turn off your antivirus, real-time protection or SmartScreen, or add an exclusion, to run this app.
