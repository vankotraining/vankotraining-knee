# Knee Android share receiver

This module is intentionally small. It exists only to receive a Tindeq ZIP from the Android Sharesheet and pass it locally to the existing `/tindeq` browser parser.

## Data path

1. Android `ACTION_SEND` gives the app a temporary `content://` read grant.
2. The receiver copies one supported ZIP into the app cache (`cacheDir/tindeq-share`).
3. The temporary copy is capped at 32 MB and expires after 30 minutes.
4. A Trusted Web Activity opens the configured `kneeOrigin`.
5. After Digital Asset Links validation succeeds, the native app and the page create a Custom Tabs `postMessage` channel.
6. The ZIP is transferred in 128 KiB chunks over local app ↔ browser IPC. It is never used as an HTTP request body.
7. The page verifies the SHA-256 digest, reconstructs a `File`, and calls the existing `importTindeqArchive(file)` path.
8. The native cache copy is deleted only after the page acknowledges receipt. Database persistence remains a separate explicit user action in the web UI.

## Preview signing

The PR workflow generates an ephemeral signing certificate and uploads a signed APK artifact. The workflow logs the SHA-256 certificate fingerprint. That fingerprint must be published in the matching Preview origin's `/.well-known/assetlinks.json` with both:

- `delegate_permission/common.handle_all_urls`
- `delegate_permission/common.use_as_origin`

Because the preview key is deliberately ephemeral, a later Android rebuild requires a new fingerprint, a new `assetlinks.json`, and reinstalling the APK. Production must use a persistent release/Play App Signing certificate and must not reuse the ephemeral preview process.
