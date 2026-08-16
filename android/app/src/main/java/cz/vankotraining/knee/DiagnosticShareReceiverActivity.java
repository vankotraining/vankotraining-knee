package cz.vankotraining.knee;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.Gravity;
import android.widget.TextView;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import org.json.JSONObject;

import java.io.RandomAccessFile;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Preview-only diagnostic receiver.
 *
 * This gate transfers the real staged ZIP only through the already-validated local TWA
 * postMessage channel. It does not upload the ZIP, call a server endpoint, or persist analysis.
 * The existing web parser decides whether the reconstructed File is valid and replies ack/nack.
 */
public final class DiagnosticShareReceiverActivity extends Activity {
    private static final String CHANNEL_MARKER = "knee-native-share-v1";
    private static final String PREFS = "knee-twa-diagnostic";
    private static final String KEY_TRACE = "trace";
    private static final int PROTOCOL_VERSION = 1;
    private static final int CHUNK_BYTES = 128 * 1024;

    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private SharedPreferences preferences;
    private ShareFileStore shareFileStore;
    private PendingShare pendingShare;
    private Uri sourceOrigin;
    private CustomTabsSession session;
    private CustomTabsServiceConnection serviceConnection;
    private boolean serviceBound;
    private boolean metadataSent;
    private boolean completeSent;
    private int expectedChunkIndex;

    private final CustomTabsCallback callback = new CustomTabsCallback() {
        @Override
        public void onRelationshipValidationResult(
                int relation,
                Uri requestedOrigin,
                boolean result,
                Bundle extras) {
            super.onRelationshipValidationResult(relation, requestedOrigin, result, extras);
            if (relation == CustomTabsService.RELATION_USE_AS_ORIGIN) {
                recordStep("DAL result=" + result);
            }
        }

        @Override
        public void onNavigationEvent(int navigationEvent, Bundle extras) {
            super.onNavigationEvent(navigationEvent, extras);
            recordStep("navigation event=" + navigationEvent);
            if (navigationEvent != NAVIGATION_FINISHED || session == null) return;

            boolean accepted = session.requestPostMessageChannel(
                    sourceOrigin,
                    sourceOrigin,
                    new Bundle());
            recordStep("channel request=" + accepted);
        }

        @Override
        public void onMessageChannelReady(Bundle extras) {
            super.onMessageChannelReady(extras);
            recordStep("channel ready");
            if (session == null) return;
            int result = session.postMessage(CHANNEL_MARKER, null);
            recordStep("marker post result=" + result);
        }

        @Override
        public void onPostMessage(String message, Bundle extras) {
            super.onPostMessage(message, extras);
            recordStep("web reply received");
            handleWebMessage(message);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences(PREFS, MODE_PRIVATE);
        preferences.edit().remove(KEY_TRACE).commit();
        shareFileStore = new ShareFileStore(this);
        sourceOrigin = Uri.parse(BuildConfig.KNEE_ORIGIN);
        recordStep("activity created");
        handleIntent(getIntent());
    }

    private void handleIntent(Intent intent) {
        if (!Intent.ACTION_SEND.equals(intent.getAction())) {
            recordStep("stop: not ACTION_SEND");
            return;
        }
        recordStep("ACTION_SEND received");

        Uri sharedUri = getSharedUri(intent);
        if (sharedUri == null) {
            recordStep("stop: no EXTRA_STREAM");
            return;
        }

        ioExecutor.execute(() -> {
            try {
                PendingShare staged = shareFileStore.stage(
                        sharedUri,
                        intent.getType(),
                        System.currentTimeMillis());
                mainHandler.post(() -> {
                    pendingShare = staged;
                    metadataSent = false;
                    completeSent = false;
                    expectedChunkIndex = 0;
                    recordStep("ZIP staged locally");
                    bindBrowserAndLaunch();
                });
            } catch (Exception error) {
                mainHandler.post(() -> recordStep("stop: ZIP staging failed"));
            }
        });
    }

    private void bindBrowserAndLaunch() {
        String packageName = CustomTabsClient.getPackageName(this, null);
        recordStep("browser=" + (packageName == null ? "none" : packageName));
        if (packageName == null) return;

        serviceConnection = new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                recordStep("service connected");
                boolean warmed = client.warmup(0L);
                recordStep("warmup=" + warmed);
                session = client.newSession(callback);
                recordStep("session=" + (session != null));
                if (session == null) return;

                boolean validationAccepted = session.validateRelationship(
                        CustomTabsService.RELATION_USE_AS_ORIGIN,
                        sourceOrigin,
                        null);
                recordStep("DAL request=" + validationAccepted);

                Uri launchUri = Uri.parse(BuildConfig.KNEE_ORIGIN + "/tindeq")
                        .buildUpon()
                        .appendQueryParameter("nativeShare", "1")
                        .build();
                recordStep("launch TWA");
                new TrustedWebActivityIntentBuilder(launchUri)
                        .build(session)
                        .launchTrustedWebActivity(DiagnosticShareReceiverActivity.this);
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                recordStep("service disconnected");
                session = null;
                serviceBound = false;
            }
        };

        serviceBound = CustomTabsClient.bindCustomTabsService(this, packageName, serviceConnection);
        recordStep("service bind=" + serviceBound);
    }

    private void handleWebMessage(String message) {
        PendingShare share = pendingShare;
        if (session == null || share == null) return;
        try {
            JSONObject value = new JSONObject(message);
            if (value.optInt("v", -1) != PROTOCOL_VERSION) return;
            String type = value.optString("type", "");

            if ("ready".equals(type) && !metadataSent) {
                JSONObject meta = new JSONObject()
                        .put("v", PROTOCOL_VERSION)
                        .put("type", "meta")
                        .put("shareId", share.id)
                        .put("name", share.displayName)
                        .put("mimeType", share.mimeType)
                        .put("size", share.size)
                        .put("sha256", share.sha256)
                        .put("chunks", chunkCount(share))
                        .put("chunkSize", CHUNK_BYTES);
                int result = session.postMessage(meta.toString(), null);
                metadataSent = result == CustomTabsService.RESULT_SUCCESS;
                recordStep("real meta post result=" + result + " chunks=" + chunkCount(share));
                return;
            }

            String shareId = value.optString("shareId", "");
            if (!share.id.equals(shareId)) return;

            if ("next".equals(type)) {
                int index = value.optInt("index", -1);
                if (index != expectedChunkIndex) {
                    recordStep("stop: unexpected web chunk index=" + index);
                    return;
                }
                sendRealChunk(share, index);
                return;
            }

            if ("complete-request".equals(type)) {
                recordStep("web complete-request received");
                if (expectedChunkIndex != chunkCount(share)) {
                    recordStep("stop: complete requested before all chunks");
                    return;
                }
                if (!completeSent) {
                    JSONObject complete = new JSONObject()
                            .put("v", PROTOCOL_VERSION)
                            .put("type", "complete")
                            .put("shareId", share.id);
                    int result = session.postMessage(complete.toString(), null);
                    completeSent = result == CustomTabsService.RESULT_SUCCESS;
                    recordStep("real complete post result=" + result);
                }
                return;
            }

            if ("ack".equals(type)) {
                recordStep("web ack received: parser accepted real ZIP");
                shareFileStore.consume(share.id);
                pendingShare = null;
                return;
            }

            if ("nack".equals(type)) {
                String reason = value.optString("message", "");
                recordStep(reason.isBlank() ? "web nack received" : "web nack received: " + reason);
            }
        } catch (Exception ignored) {
            // The preview bootstrap also sends a fixed plain-text acknowledgement. Ignore its body.
        }
    }

    private void sendRealChunk(PendingShare share, int index) {
        ioExecutor.execute(() -> {
            try (RandomAccessFile file = new RandomAccessFile(share.file, "r")) {
                long offset = (long) index * CHUNK_BYTES;
                int expected = (int) Math.min(CHUNK_BYTES, share.size - offset);
                if (expected <= 0) throw new IllegalArgumentException("Invalid chunk boundary");

                byte[] bytes = new byte[expected];
                file.seek(offset);
                file.readFully(bytes);
                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                JSONObject chunk = new JSONObject()
                        .put("v", PROTOCOL_VERSION)
                        .put("type", "chunk")
                        .put("shareId", share.id)
                        .put("index", index)
                        .put("data", base64);

                mainHandler.post(() -> {
                    PendingShare active = pendingShare;
                    if (active == null
                            || !active.id.equals(share.id)
                            || expectedChunkIndex != index
                            || session == null) {
                        return;
                    }
                    int result = session.postMessage(chunk.toString(), null);
                    if (result == CustomTabsService.RESULT_SUCCESS) {
                        expectedChunkIndex += 1;
                    }
                    int totalChunks = chunkCount(share);
                    if (index == 0 || index == totalChunks - 1 || result != CustomTabsService.RESULT_SUCCESS) {
                        recordStep("real chunk index=" + index + " post result=" + result);
                    }
                });
            } catch (Exception error) {
                mainHandler.post(() -> recordStep("stop: real ZIP chunk read failed"));
            }
        });
    }

    private static int chunkCount(PendingShare share) {
        return (int) ((share.size + CHUNK_BYTES - 1L) / CHUNK_BYTES);
    }

    private void recordStep(String step) {
        mainHandler.post(() -> {
            String previous = preferences.getString(KEY_TRACE, "");
            String next = previous == null || previous.isBlank() ? step : previous + "\n→ " + step;
            preferences.edit().putString(KEY_TRACE, next).commit();
            renderTrace(next);
        });
    }

    private void renderTrace(String trace) {
        TextView view = new TextView(this);
        view.setText(
                "Knee Android share diagnostika\n\n"
                        + trace
                        + "\n\nTento gate přenáší skutečný ZIP pouze lokálně přes TWA MessagePort do existujícího webového parseru. Neprovádí serverový upload ani automatické uložení výsledku do Supabase.");
        view.setTextSize(17f);
        view.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        view.setPadding(48, 48, 48, 48);
        setContentView(view);
    }

    private static Uri getSharedUri(Intent intent) {
        if (Build.VERSION.SDK_INT >= 33) {
            return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
        }
        //noinspection deprecation
        return intent.getParcelableExtra(Intent.EXTRA_STREAM);
    }

    @Override
    protected void onDestroy() {
        ioExecutor.shutdownNow();
        if (serviceBound && serviceConnection != null) {
            try {
                unbindService(serviceConnection);
            } catch (IllegalArgumentException ignored) {
                // Already unbound by the browser/service lifecycle.
            }
        }
        super.onDestroy();
    }
}
