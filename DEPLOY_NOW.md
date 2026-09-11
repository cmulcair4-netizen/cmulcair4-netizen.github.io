# FlipForge — Android-only deployment kit

## What this kit fixes

- Replaces the broken `icons` file with a real `icons/` directory.
- Adds the real `icon-192.png` and `icon-512.png` assets.
- Provides a corrected PWA manifest.
- Provides a service worker that caches the actual icon paths.
- Lets you make the existing GitHub Pages frontend installable from Android.

## Fastest route: GitHub Codespaces

1. Open the FlipForge repository on GitHub.
2. Tap **Code → Codespaces → Create codespace on main**.
3. Open the browser-based VS Code terminal.
4. Upload this ZIP into the Codespace Explorer.
5. In the terminal run:

```bash
unzip -o FlipForge_Android_Deploy_Kit.zip -d /tmp/flipforge-kit
rm -f icons
mkdir -p icons
cp /tmp/flipforge-kit/icons/icon-192.png icons/icon-192.png
cp /tmp/flipforge-kit/icons/icon-512.png icons/icon-512.png
cp /tmp/flipforge-kit/manifest.webmanifest manifest.webmanifest
cp /tmp/flipforge-kit/sw.js sw.js
git add icons manifest.webmanifest sw.js
git commit -m "Fix FlipForge PWA icons and service worker"
git push origin main
```

Then open the GitHub Pages site in Chrome and use **Install app / Add to Home screen**.

## Alternative: GitHub website only

GitHub supports browser uploads. Delete the existing root-level `icons` file first, then upload both PNGs into a new `icons` directory. Also replace `manifest.webmanifest` and `sw.js` with the versions in this kit.

## Important backend status

This kit does **not** pretend to activate a backend that does not exist.

The current FlipForge repository is a client-side PWA using local browser storage. The following are still not live until an authorised backend/API is connected:

- marketplace scanning/ingestion
- live comparable sales
- cloud accounts/data persistence
- scheduled scans
- push alerts
- server-side deal analysis

Those require a real backend plus authorised marketplace/API credentials. GitHub Pages itself cannot execute a persistent backend.

## Why this is the Android workaround

The connected ChatGPT GitHub integration can currently read the repository but returns HTTP 403 when asked to write files. Codex is not available as a direct Android-only editing session. GitHub Codespaces is therefore the cleanest Android path because it provides a browser-based VS Code environment with Git access and commit/push capability.
