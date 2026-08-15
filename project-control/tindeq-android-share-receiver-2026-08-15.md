# Tindeq Android native share receiver – 2026-08-15

## Status

Implementation branch: `agent/tindeq-android-share-receiver`.

Draft PR: `#21` – `Add local Android Tindeq share receiver`.

Feature status: **implemented + automated build/test verified + Vercel Preview READY; real Android acceptance blocked by Preview Deployment Protection**.

The feature is **not production deployed and not production verified**. It must not be merged without the explicit user gate defined below.

## Why native instead of Web Share Target

A file Web Share Target uses `POST multipart/form-data` to its target URL. Although an active service worker can consume the request locally, that architecture cannot provide the project's absolute guarantee that the ZIP can never use a network fallback. The project therefore uses a native Android `ACTION_SEND` receiver.

## Architecture

1. Tindeq shares one URI using Android `ACTION_SEND`.
2. Knee reads the granted `content://` URI locally.
3. The receiver validates supported ZIP MIME/name combinations and ZIP magic bytes.
4. The archive is copied only into app-private Android `cacheDir/tindeq-share`.
5. The cache copy is capped at 32 MB, has a 30-minute TTL, and stale/orphaned temporary data are cleaned up.
6. Knee opens exact `/tindeq` on the configured origin as a Trusted Web Activity.
7. Digital Asset Links validates the Android app ↔ web origin relationship, including `delegate_permission/common.use_as_origin`.
8. Only after successful relationship validation does Android request a Custom Tabs `postMessage` channel.
9. The ZIP is transferred in 128 KiB chunks over local Android app ↔ browser IPC. The ZIP is not encoded into the navigation URL and is not an HTTP request body.
10. The page reassembles bytes, verifies SHA-256, creates a browser `File`, and invokes the same existing `importTindeqArchive(file)` used by manual upload.
11. The native cache copy is deleted after the page acknowledges successful handoff to the parser path; interrupted flows remain retryable only until TTL.
12. Database persistence is unchanged and remains a separate explicit `Uložit měření ke klientovi` action.

## Privacy invariant

During transfer the original archive exists only in device-local file access/storage:

- sender-provided `content://` source;
- Knee private Android application cache;
- transient in-memory browser/native transfer buffers.

There is no ZIP upload route, form POST, server action, Vercel Function, Supabase Storage object, raw ZIP database write, service-worker cache, Cache Storage entry, analytics payload, or ZIP-byte logging added by this feature.

Normal HTTPS traffic still loads Knee and uses existing authenticated Supabase APIs. ZIP bytes are not included in those requests.

## Failure behavior

- unsupported file or invalid ZIP signature: rejected before browser transfer;
- more than one file: rejected;
- file above 32 MB: rejected;
- Digital Asset Links validation failure: ZIP is not transferred to the web page and remains only in temporary app cache until retry/TTL;
- interrupted transfer/page refresh: no ACK means cache copy remains locally retryable until TTL;
- signed-out user: pending ZIP remains local; `/tindeq` App Link supports returning from the existing magic-link auth flow and resuming pending transfer;
- existing `/tindeq` in another browser context: transfer is bound to the Custom Tabs/TWA session opened by the native receiver rather than silently saving anywhere;
- duplicate/repeated ZIP: existing Tindeq session hashing and persistence dedupe remain authoritative;
- corrupt/non-Tindeq ZIP contents: existing parser error handling is used and nothing is automatically saved.

## Preview evidence

Preview origin pinned into the Android build:

`https://vankotraining-knee-git-agent-tin-19838f-vankotrainings-projects.vercel.app`

Vercel Preview:

- deployment before final assetlinks/docs sync: `dpl_9xDFinsNq3Du1E99uEYYrg3mKLAa`;
- state: `READY`;
- exact implementation head: `d1d98ec91948c252b0cbc74f8422f722e55fbd4b`;
- branch alias: stable origin above.

Android CI:

- workflow run: `31911229864`;
- result: `success`;
- Android unit tests: passed;
- debug/preview APK build: `BUILD SUCCESSFUL`;
- artifact name: `knee-tindeq-share-preview`;
- artifact ID: `9253720882`;
- uploaded artifact ZIP SHA-256: `b5a1e74ecf19a352e3521aac2d93f56c7c63e3a3260611bdc591aec365a0e73f`;
- preview APK certificate SHA-256 fingerprint: `B9:7F:94:BA:0D:C6:EC:46:FC:94:8B:3C:57:24:EC:A7:95:B9:92:7E:F9:4C:F9:E9:33:C1:B9:B7:C5:E2:D7:2A`.

Web CI on the same web implementation has passed unit tests, lint comparison against current `main`, production build, `tsc --noEmit`, project-control validation, whitespace check and Playwright Tindeq E2E. The final assetlinks/docs sync does not modify Android/native transport code.

## Digital Asset Links

`public/.well-known/assetlinks.json` publishes exactly the current preview APK fingerprint and both required relations:

- `delegate_permission/common.handle_all_urls`;
- `delegate_permission/common.use_as_origin`.

The Android intent filter itself is further restricted to the `/tindeq` path.

### Current blocker

The Vercel Preview alias is protected by Vercel Authentication. An anonymous request is redirected to Vercel SSO before Next.js/static assets can answer. Digital Asset Links verification cannot use a Vercel share URL, login cookie or query bypass because Android/Chrome requests the fixed `https://<origin>/.well-known/assetlinks.json` URL.

Therefore `assetlinks.json` is implemented but **not yet externally DAL-verified**.

Preferred resolution: add a Deployment Protection Exception for only the exact PR #21 preview alias, if supported by the current Vercel plan. Do not disable project-wide Preview Authentication without explicit user approval because that would also expose unrelated Preview deployments.

## Preview signing lifecycle

The PR-only workflow generates an ephemeral signing certificate and uploads only the APK artifact. The private preview key is not persisted.

Any later Android/native-code rebuild produces a different preview certificate. That requires all three steps again:

1. update `assetlinks.json` with the new fingerprint;
2. redeploy the exact preview origin;
3. reinstall the new APK on the Android phone.

Production must use a persistent release certificate or Play App Signing certificate. Production Android distribution/signing is deliberately not included before this MVP receives real-device acceptance.

## Manual Android acceptance gate

After the exact Preview origin can serve `/.well-known/assetlinks.json` anonymously with HTTP 200 JSON:

1. install the final `knee-tindeq-share-preview` APK artifact from Android workflow run `31911229864`;
2. open Knee once and confirm `/tindeq` opens on the pinned Preview origin;
3. if signed out, complete the existing magic-link login and confirm return to `/tindeq`;
4. in Tindeq create/export one test Repeaters ZIP;
5. choose Android `Sdílet` → `Knee`;
6. confirm Knee opens `/tindeq` and shows the local receiving/loading state;
7. confirm the ZIP is automatically analyzed with the same result as manual upload;
8. confirm the expected client is not silently auto-saved; explicitly select/verify the client;
9. confirm tag-vs-client warning behavior still appears when relevant;
10. explicitly press `Uložit měření ke klientovi`;
11. verify the resulting structured measurement in the report;
12. repeat the same ZIP and verify existing duplicate protection prevents an unintended second record;
13. share an unsupported file and verify fail-closed rejection;
14. verify server-side architecture/logging/storage has no raw ZIP endpoint/object/write introduced by PR #21.

Only after explicit user confirmation of this real-device test may PR #21 proceed to merge consideration.
