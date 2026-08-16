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
import android.view.Gravity;
import android.widget.TextView;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import org.json.JSONObject;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Preview-only diagnostic receiver.
 *
 * It deliberately stops before transferring real ZIP bytes. Its only purpose is to identify the
 * nearest failing native TWA/postMessage step without changing the parser, web assembly, or
 * persistence.
 */
public final class DiagnosticShareReceiverActivity extends Activity {
    private static final String CHANNEL_MARKER = "knee-native-share-v1";
    private static final String PREFS = "knee-twa-diagnostic";
    private static final String KEY_TRACE = "trace";
    private static final String DIAGNOSTIC_SHARE_ID = "diag-12345678";
    private static final String DIAGNOSTIC_CHUNK_BASE64 = "UEsDBA==";
    private static final String DIAGNOSTIC_SHA256 =
            "8dcc7e601606217f3b754766511182a916b17e9a26a94c9d887104eba92e9bb2";

    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private SharedPreferences preferences;
    private ShareFileStore shareFileStore;
    private Uri sourceOrigin;
    private CustomTabsSession session;
    private CustomTabsServiceConnection serviceConnection;
    private boolean serviceBound;
    private boolean diagnosticMetaSent;
    private boolean diagnosticChunkSent;

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
            handleDiagnosticWebMessage(message);
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
                shareFileStore.stage(sharedUri, intent.getType(), System.currentTimeMillis());
                mainHandler.post(() -> {
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

    private void handleDiagnosticWebMessage(String message) {
        if (session == null) return;
        try {
            JSONObject value = new JSONObject(message);
            if (value.optInt("v", -1) != 1) return;
            String type = value.optString("type", "");

            if ("ready".equals(type) && !diagnosticMetaSent) {
                JSONObject meta = new JSONObject()
                        .put("v", 1)
                        .put("type", "meta")
                        .put("shareId", DIAGNOSTIC_SHARE_ID)
                        .put("name", "diagnostic.zip")
                        .put("mimeType", "application/zip")
                        .put("size", 4)
                        .put("sha256", DIAGNOSTIC_SHA256)
                        .put("chunks", 1)
                        .put("chunkSize", 16 * 1024);
                int result = session.postMessage(meta.toString(), null);
                diagnosticMetaSent = true;
                recordStep("diagnostic meta post result=" + result);
                return;
            }

            if ("next".equals(type)) {
                int index = value.optInt("index", -1);
                recordStep("web next received index=" + index);
                if (index == 0 && !diagnosticChunkSent) {
                    JSONObject chunk = new JSONObject()
                            .put("v", 1)
                            .put("type", "chunk")
                            .put("shareId", DIAGNOSTIC_SHARE_ID)
                            .put("index", 0)
                            .put("data", DIAGNOSTIC_CHUNK_BASE64);
                    int result = session.postMessage(chunk.toString(), null);
                    diagnosticChunkSent = true;
                    recordStep("diagnostic chunk post result=" + result);
                }
                return;
            }

            if ("complete-request".equals(type)) {
                recordStep("web complete-request received");
                return;
            }

            if ("nack".equals(type)) {
                recordStep("web nack received");
            }
        } catch (Exception ignored) {
            // The preview bootstrap also sends a fixed plain-text acknowledgement. Ignore its body.
        }
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
                        + "\n\nTento build nepřenáší skutečný ZIP do webu. Posílá jen bezpečné syntetické meta a 4 bajty ZIP signatury a čeká na complete-request.");
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
