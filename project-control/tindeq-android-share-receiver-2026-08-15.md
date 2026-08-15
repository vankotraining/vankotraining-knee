# Tindeq Android native share receiver – 2026-08-15

## Status

Implementation branch: `agent/tindeq-android-share-receiver`.

This document describes the isolated Android MVP for receiving one Tindeq ZIP from the Android Sharesheet without sending the original archive to Vercel, Supabase, object storage, analytics, logs, or another server-side endpoint.

The feature is **not production verified** until a real Android device test is explicitly accepted by the user. It must not be merged without that gate.

## Why native instead of Web Share Target

A Web Share Target for files uses a `POST multipart/form-data` request to the declared target URL. An active service worker can intercept that request before network fetch, but the architecture cannot provide an absolute guarantee that the POST can never fall back to the network when the service worker is unavailable or not controlling the request.

The project therefore uses a native Android `ACTION_SEND` receiver for this feature.

## Architecture

1. Tindeq shares one URI using Android `ACTION_SEND`.
2. The Knee Android receiver reads the granted `content://` URI locally.
3. The receiver validates supported ZIP MIME/name combinations and ZIP magic bytes.
4. The archive is copied only into Android app cache under `cacheDir/tindeq-share`.
5. The cache copy is limited to 32 MB, has a 30-minute TTL, and orphaned temporary files are cleaned up.
6. The app opens `/tindeq` as a Trusted Web Activity.
7. Digital Asset Links must validate both `delegate_permission/common.handle_all_urls` and `delegate_permission/common.use_as_origin` for the exact Android signing certificate and Knee origin.
8. Only after successful origin validation is a Custom Tabs `postMessage` channel opened.
9. The ZIP is sent from the Android process to the browser process in 128 KiB chunks through local IPC. It is never encoded into a URL and is never an HTTP request body.
10. The page reconstructs the bytes, verifies SHA-256, creates a browser `File`, and passes it into the existing `importTindeqArchive(file)` code path.
11. The page acknowledges receipt only after the existing parser has been invoked. The Android cache file is then deleted.
12. Saving to Supabase is unchanged and remains a separate explicit `Uložit měření ke klientovi` action.

## Privacy invariant

The original archive is temporarily present in two device-local places during transfer:

- the sender-provided `content://` source;
- Knee's private Android application cache.

The binary transport from Knee Android to the Trusted Web Activity is Custom Tabs `postMessage` IPC after Digital Asset Links origin validation. There is no ZIP upload route, API endpoint, form POST, server action, Vercel Function, Supabase write, Cache Storage entry, service-worker cache, analytics event, or logging of ZIP bytes.

Normal HTTPS traffic still occurs to load the Knee web application and to use its existing authenticated Supabase APIs. The ZIP bytes themselves are not part of those requests.

## Failure behavior

- unsupported file or invalid ZIP signature: rejected before browser transfer;
- multiple files: rejected;
- file above 32 MB: rejected;
- Digital Asset Links validation failure: ZIP is not sent to the page and remains only in temporary app cache until retry/TTL cleanup;
- interrupted page transfer: no acknowledgement is sent, therefore the cache copy is retained for retry until TTL;
- refresh/navigation before acknowledgement: the native side can establish a new message channel and resend the pending file;
- signed-out user: the pending file stays in app cache; the verified App Link can return the magic-link navigation into the native Knee activity and the pending import can resume after authentication;
- duplicate/repeated ZIP: existing Tindeq session hashing and persistence dedupe remain authoritative;
- parser failure/corrupt Tindeq contents: existing parser error UI is used and nothing is auto-saved.

## Preview signing and Android gate

The PR-only Android workflow creates an ephemeral signing certificate, builds a signed preview APK, prints the SHA-256 certificate fingerprint, and uploads only the APK artifact. It does not upload or persist the private signing key.

After the Preview URL is known, `android/gradle.properties` must be pinned to that exact Preview origin. The certificate fingerprint from the final Android workflow run must then be published at the same Preview origin in `/.well-known/assetlinks.json`.

Because the preview key is ephemeral, rebuilding the APK produces a different certificate and requires a new `assetlinks.json` plus reinstalling the preview app. Production must use a persistent release or Play App Signing certificate.

## Manual Android acceptance

The feature remains only **implemented / Preview-deployed** until the user performs the real-device test and explicitly confirms it. Browser automation is not a substitute for Android Sharesheet/TWA validation.
