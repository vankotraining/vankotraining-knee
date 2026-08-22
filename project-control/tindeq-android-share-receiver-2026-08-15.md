# Tindeq Android native share receiver – 2026-08-15

## Status

Implementation branch: `agent/tindeq-android-share-receiver`.

Draft PR: `#21` – `Add local Android Tindeq share receiver`.

Feature status: **implemented + automated build/test verified + Vercel Preview READY + real Android transport/parser gate passed + normal receiver UX gate passed**.

The feature is **not production deployed and not production verified**. PR #21 must not be merged without explicit user approval.

## Why native instead of Web Share Target

A file Web Share Target uses `POST multipart/form-data` to its target URL. Although an active service worker can consume the request locally, that architecture cannot provide the project's strict guarantee that the ZIP can never use a network fallback. The project therefore uses a native Android `ACTION_SEND` receiver.

## Architecture

1. Tindeq shares one URI using Android `ACTION_SEND`.
2. Knee reads the granted `content://` URI locally.
3. `ShareFileStore` validates supported ZIP MIME/name combinations and ZIP magic bytes.
4. The archive is copied only into app-private Android `cacheDir/tindeq-share`.
5. The cache copy is capped at 32 MB, has a 30-minute TTL, and stale/orphaned temporary data are cleaned up.
6. `ShareReceiverActivity` opens exact `/tindeq?nativeShare=1` on the configured origin as a Trusted Web Activity.
7. Digital Asset Links validates `delegate_permission/common.use_as_origin`.
8. Android requests a Custom Tabs `postMessage` channel.
9. Chrome exposes the transferred `MessagePort` to the page with exact `android-app://<current-host>` event origin; the before-interactive bootstrap accepts it only for `nativeShare=1` and only for that exact host.
10. The ZIP is transferred in 128 KiB chunks over local Android app ↔ browser IPC. It is never encoded into the navigation URL and is not an HTTP request body.
11. The page reassembles bytes, verifies SHA-256, creates a browser `File`, and invokes the same existing `importTindeqArchive(file)` used by manual upload.
12. On parser success the page sends `ack`; Android then consumes/deletes the pending cache copy.
13. Parser/transport failure returns `nack`; the temporary copy remains only locally and is retryable until TTL cleanup.
14. Database persistence is unchanged and remains a separate explicit `Uložit měření ke klientovi` action.

## Privacy invariant

During transfer the original archive exists only in device-local file access/storage:

- sender-provided `content://` source;
- Knee private Android application cache;
- transient in-memory browser/native transfer buffers.

There is no ZIP upload route, form POST, server action, Vercel Function, Supabase Storage object, raw ZIP database write, service-worker cache, Cache Storage entry, analytics payload, or ZIP-byte logging added by this feature.

Normal HTTPS traffic still loads Knee and uses existing authenticated Supabase APIs. ZIP bytes are not included in those requests.

## Real-device evidence – 2026-08-16

The Android debugging sequence deliberately advanced one boundary at a time instead of attempting full functionality at once.

Observed and passed gates:

1. `ACTION_SEND received` and `ZIP staged locally`.
2. Chrome Custom Tabs/TWA session established.
3. Digital Asset Links `use_as_origin` result `true`.
4. `requestPostMessageChannel=true` and `channel ready`.
5. Web received a `MessagePort` from `android-app://<preview-host>`.
6. Web → Android reply was received, proving bidirectional channel communication.
7. Synthetic metadata reached the web protocol and web returned `next index=0`.
8. Synthetic binary ZIP signature chunk reached the assembler and web returned `complete-request`.
9. Synthetic incomplete ZIP reached the existing Tindeq parser and correctly returned `nack: ZIP nemá platný centrální adresář.`.
10. A **real Tindeq ZIP** was transferred in multiple chunks, completed, passed SHA-256 and was accepted by the existing parser: `web ack received: parser accepted real ZIP`.
11. The normal `ShareReceiverActivity` was then made the actual Android Sharesheet target and a real `Tindeq → Sdílet → Knee` flow displayed the expected Tindeq analysis without the diagnostic receiver.

Vercel runtime logs around the real-ZIP test showed normal page requests only and no POST/upload request carrying the archive.

## Stabilization after successful gate

After the normal receiver UX test passed:

- `DiagnosticShareReceiverActivity` was removed;
- its manifest entry was removed;
- Preview Android-share debug counters/history and debug reply were removed from the web UI/bootstrap;
- the real observed Chrome event-origin behavior was promoted into the normal security rule: accept the transferred port only when the URL has `nativeShare=1`, `event.origin` equals exact `android-app://<current-host>`, and a `MessagePort` is present;
- parser, structured persistence and manual upload behavior were not changed by this cleanup.

## Failure behavior

- unsupported file or invalid ZIP signature: rejected before browser transfer;
- more than one file: rejected;
- file above 32 MB: rejected;
- Digital Asset Links validation failure: ZIP is not transferred and remains only in temporary app cache until retry/TTL;
- interrupted transfer/page refresh: no `ack` means cache copy remains locally retryable until TTL;
- duplicate/repeated ZIP: existing Tindeq session hashing and persistence dedupe remain authoritative;
- corrupt/non-Tindeq ZIP contents: existing parser error handling is used and nothing is automatically saved.

## Preview signing lifecycle

The PR-only workflow generates an ephemeral signing certificate and uploads only the APK artifact. The private preview key is not persisted.

Any Android rebuild produces a different Preview certificate. A canonical manual test build therefore always requires:

1. choose the completed workflow artifact that contains the code to test;
2. publish that exact APK fingerprint in Preview `/.well-known/assetlinks.json`;
3. wait for the matching Preview deployment;
4. install that exact APK on the Android phone.

The later workflow triggered by the fingerprint-only commit is not automatically the canonical device build.

Production must use a persistent release certificate or Play App Signing certificate; ephemeral Preview signing is not suitable for production distribution.

## Remaining manual gate before merge consideration

1. Build/pin the post-cleanup normal receiver APK.
2. Share a second valid real Tindeq ZIP, preferably while Knee is already open, and verify the `singleTask/onNewIntent` flow still opens the analysis automatically.
3. Verify no server-side ZIP POST/upload appears in Vercel runtime logs.
4. Verify unsupported-file rejection.
5. If explicit save is tested, verify duplicate protection prevents unintended duplicate persistence.
6. Decide and document production Android signing/distribution strategy before production rollout.
7. Obtain explicit user approval before merge.

## Merge gate

PR #21 remains draft and **must not be merged without explicit user approval**. Preview/manual success is not production verification.
