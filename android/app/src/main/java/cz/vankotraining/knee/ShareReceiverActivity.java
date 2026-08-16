package cz.vankotraining.knee;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.view.Gravity;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsService;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import org.json.JSONObject;

import java.io.RandomAccessFile;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class ShareReceiverActivity extends Activity {
    private static final String TAG = "KneeShare";
    private static final String CHANNEL_MARKER = "knee-native-share-v1";
    private static final int PROTOCOL_VERSION = 1;
    private static final int CHUNK_BYTES = 128 * 1024;
    private static final int MAX_MARKER_ATTEMPTS = 5;

    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ArrayList<String> diagnosticTrace = new ArrayList<>();

    private ShareFileStore shareFileStore;
    private PendingShare pendingShare;
    private Uri launchUri;
    private Uri sourceOrigin;
    private CustomTabsClient customTabsClient;
    private CustomTabsSession customTabsSession;
    private CustomTabsServiceConnection serviceConnection;
    private String browserPackage;
    private boolean serviceBound;
    private boolean relationshipValidated;
    private boolean relationshipValidationFinished;
    private boolean navigationFinished;
    private boolean channelRequested;
    private boolean webReady;
    private boolean twaLaunched;
    private int expectedChunkIndex;
    private int markerAttempt;
    private Runnable markerRetry;

    private final CustomTabsCallback customTabsCallback = new CustomTabsCallback() {
        @Override
        public void onRelationshipValidationResult(
                int relation,
                Uri requestedOrigin,
                boolean result,
                Bundle extras) {
            super.onRelationshipValidationResult(relation, requestedOrigin, result, extras);
            if (relation != CustomTabsService.RELATION_USE_AS_ORIGIN) return;
            relationshipValidationFinished = true;
            relationshipValidated = result;
            recordDiagnostic("DAL result=" + result);
            Log.d(TAG, "Digital Asset Links use_as_origin validation for " + requestedOrigin + ": " + result);
            if (result) {
                maybeRequestPostMessageChannel();
            } else if (pendingShare != null) {
                Toast.makeText(
                        ShareReceiverActivity.this,
                        "Bezpečné spojení s Knee se nepodařilo ověřit. ZIP zůstal pouze v zařízení.",
                        Toast.LENGTH_LONG)
                        .show();
            }
        }

        @Override
        public void onNavigationEvent(int navigationEvent, Bundle extras) {
            super.onNavigationEvent(navigationEvent, extras);
            recordDiagnostic("navigation=" + navigationEventName(navigationEvent) + " (" + navigationEvent + ")");
            if (navigationEvent != NAVIGATION_FINISHED) return;
            navigationFinished = true;
            channelRequested = false;
            webReady = false;
            expectedChunkIndex = 0;
            cancelMarkerRetry();
            maybeRequestPostMessageChannel();
        }

        @Override
        public void onMessageChannelReady(Bundle extras) {
            super.onMessageChannelReady(extras);
            recordDiagnostic("onMessageChannelReady");
            if (pendingShare == null) return;
            markerAttempt = 0;
            sendChannelMarkerWithRetry();
        }

        @Override
        public void onPostMessage(String message, Bundle extras) {
            super.onPostMessage(message, extras);
            handleWebMessage(message);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sourceOrigin = Uri.parse(BuildConfig.KNEE_ORIGIN);
        shareFileStore = new ShareFileStore(this);
        beginDiagnosticTrace("onCreate");
        setLoadingView("Připravuji Knee…");
        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        beginDiagnosticTrace("onNewIntent");
        handleIncomingIntent(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (BuildConfig.DEBUG && twaLaunched) {
            twaLaunched = false;
            recordDiagnostic("returned from TWA");
            renderDiagnosticTrace();
        }
    }

    private void handleIncomingIntent(Intent intent) {
        boolean incomingShare = Intent.ACTION_SEND.equals(intent.getAction());
        if (incomingShare) recordDiagnostic("ACTION_SEND received");
        setLoadingView(incomingShare
                ? "Načítám sdílené Tindeq měření…"
                : "Otevírám Knee…");

        if (Intent.ACTION_SEND_MULTIPLE.equals(intent.getAction())) {
            recordDiagnostic("stop: ACTION_SEND_MULTIPLE rejected");
            showFatalError("Knee v této verzi přijímá vždy pouze jeden Tindeq ZIP.");
            return;
        }

        ioExecutor.execute(() -> {
            try {
                PendingShare nextPending;
                if (incomingShare) {
                    Uri sharedUri = getSharedUri(intent);
                    if (sharedUri == null) {
                        throw new IllegalArgumentException("Sdílený Tindeq ZIP nebyl nalezen.");
                    }
                    nextPending = shareFileStore.stage(sharedUri, intent.getType(), System.currentTimeMillis());
                    recordDiagnostic("ZIP staged locally");
                } else {
                    nextPending = shareFileStore.load(System.currentTimeMillis());
                }
                Uri nextLaunchUri = resolveLaunchUri(intent, nextPending != null);
                mainHandler.post(() -> {
                    pendingShare = nextPending;
                    launchUri = nextLaunchUri;
                    resetTransferState();
                    if (incomingShare) {
                        startFreshShareSessionAndLaunch();
                    } else {
                        ensureBrowserSessionAndLaunch();
                    }
                });
            } catch (Exception error) {
                Log.e(TAG, "Unable to prepare shared Tindeq file", error);
                recordDiagnostic("stop: ZIP staging/preparation failed");
                mainHandler.post(() -> showFatalError(
                        error.getMessage() == null ? "Sdílený ZIP se nepodařilo převzít." : error.getMessage()));
            }
        });
    }

    private void startFreshShareSessionAndLaunch() {
        recordDiagnostic("startFreshShareSessionAndLaunch");
        boolean hadOldSession = customTabsSession != null;
        customTabsSession = null;
        relationshipValidated = false;
        relationshipValidationFinished = false;
        recordDiagnostic("old session removed=" + hadOldSession);

        if (customTabsClient != null) {
            recordDiagnostic("CustomTabsClient=reuse" + browserPackageSuffix());
            createBrowserSessionAndLaunch();
            return;
        }

        recordDiagnostic("CustomTabsClient=new bind");
        serviceBound = false;
        ensureBrowserSessionAndLaunch();
    }

    private void ensureBrowserSessionAndLaunch() {
        if (customTabsSession != null) {
            recordDiagnostic("browser session=reuse");
            if (!relationshipValidated) requestRelationshipValidation();
            launchTrustedWebActivity();
            return;
        }
        if (customTabsClient != null) {
            recordDiagnostic("CustomTabsClient=reuse" + browserPackageSuffix());
            createBrowserSessionAndLaunch();
            return;
        }
        if (serviceBound) {
            recordDiagnostic("browser bind already pending");
            return;
        }

        String packageName = CustomTabsClient.getPackageName(this, null);
        browserPackage = packageName;
        recordDiagnostic("browser package=" + (packageName == null ? "none" : packageName));
        if (packageName == null) {
            showFatalError("Nenalezen podporovaný Android prohlížeč pro bezpečné otevření Knee.");
            return;
        }

        serviceConnection = new CustomTabsServiceConnection() {
            @Override
            public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
                browserPackage = name == null ? browserPackage : name.getPackageName();
                recordDiagnostic("browser service connected" + browserPackageSuffix());
                customTabsClient = client;
                client.warmup(0L);
                createBrowserSessionAndLaunch();
            }

            @Override
            public void onServiceDisconnected(ComponentName name) {
                recordDiagnostic("browser service disconnected");
                customTabsClient = null;
                customTabsSession = null;
                relationshipValidated = false;
                relationshipValidationFinished = false;
                serviceBound = false;
            }
        };

        serviceBound = CustomTabsClient.bindCustomTabsService(this, packageName, serviceConnection);
        recordDiagnostic("browser bind result=" + serviceBound);
        if (!serviceBound) {
            showFatalError("Nepodařilo se připojit k Android prohlížeči. ZIP nebyl odeslán na server.");
        }
    }

    private void createBrowserSessionAndLaunch() {
        CustomTabsClient client = customTabsClient;
        if (client == null) {
            recordDiagnostic("newSession skipped: client=null");
            showFatalError("Nepodařilo se připojit k Android prohlížeči. ZIP nebyl odeslán na server.");
            return;
        }
        customTabsSession = client.newSession(customTabsCallback);
        recordDiagnostic("newSession=" + (customTabsSession != null));
        relationshipValidated = false;
        relationshipValidationFinished = false;
        if (customTabsSession == null) {
            showFatalError("Nepodařilo se vytvořit bezpečnou browser session pro Knee.");
            return;
        }
        requestRelationshipValidation();
        launchTrustedWebActivity();
    }

    private void requestRelationshipValidation() {
        if (customTabsSession == null || relationshipValidated) return;
        relationshipValidationFinished = false;
        boolean accepted = customTabsSession.validateRelationship(
                CustomTabsService.RELATION_USE_AS_ORIGIN,
                sourceOrigin,
                null);
        recordDiagnostic("DAL request accepted=" + accepted);
        Log.d(TAG, "Requested Digital Asset Links use_as_origin validation: " + accepted);
        if (!accepted) {
            relationshipValidationFinished = true;
            relationshipValidated = false;
            if (pendingShare != null) {
                Toast.makeText(
                        this,
                        "Android prohlížeč odmítl bezpečnostní ověření Knee. ZIP zůstal pouze v zařízení.",
                        Toast.LENGTH_LONG)
                        .show();
            }
        }
    }

    private void launchTrustedWebActivity() {
        if (customTabsSession == null || launchUri == null) {
            recordDiagnostic("TWA launch skipped: missing session/URI");
            return;
        }
        navigationFinished = false;
        channelRequested = false;
        try {
            recordDiagnostic("TWA launch");
            twaLaunched = true;
            new TrustedWebActivityIntentBuilder(launchUri)
                    .build(customTabsSession)
                    .launchTrustedWebActivity(this);
            recordDiagnostic("TWA launch dispatched=true");
        } catch (RuntimeException error) {
            twaLaunched = false;
            recordDiagnostic("TWA launch dispatched=false");
            Log.e(TAG, "Trusted Web Activity launch failed", error);
            showFatalError("Knee se nepodařilo bezpečně otevřít. ZIP zůstal pouze v zařízení.");
        }
    }

    private void maybeRequestPostMessageChannel() {
        if (pendingShare == null
                || customTabsSession == null
                || !navigationFinished
                || !relationshipValidated
                || channelRequested) {
            if (pendingShare != null && navigationFinished && relationshipValidationFinished && !relationshipValidated) {
                recordDiagnostic("channel request blocked: DAL failed");
                Log.d(TAG, "Not requesting postMessage channel because use_as_origin validation failed.");
            }
            return;
        }
        channelRequested = customTabsSession.requestPostMessageChannel(
                sourceOrigin,
                sourceOrigin,
                new Bundle());
        recordDiagnostic("channel request result=" + channelRequested);
        Log.d(TAG, "Requested postMessage channel: " + channelRequested);
        if (!channelRequested) {
            Toast.makeText(
                    this,
                    "Knee se otevřelo, ale lokální přenos ZIPu se nepodařilo navázat. Zkus aplikaci znovu otevřít.",
                    Toast.LENGTH_LONG)
                    .show();
        }
    }

    private void sendChannelMarkerWithRetry() {
        cancelMarkerRetry();
        if (webReady || pendingShare == null || customTabsSession == null) return;
        markerAttempt += 1;
        int result = customTabsSession.postMessage(CHANNEL_MARKER, null);
        recordDiagnostic("marker post attempt=" + markerAttempt
                + " result=" + result
                + " success=" + (result == CustomTabsService.RESULT_SUCCESS));
        Log.d(TAG, "postMessage channel marker result: " + result);
        if (result != CustomTabsService.RESULT_SUCCESS || markerAttempt >= MAX_MARKER_ATTEMPTS) return;
        long delay = Math.min(8_000L, 1_000L << (markerAttempt - 1));
        markerRetry = this::sendChannelMarkerWithRetry;
        mainHandler.postDelayed(markerRetry, delay);
    }

    private void handleWebMessage(String message) {
        if (pendingShare == null || customTabsSession == null) return;
        try {
            JSONObject value = new JSONObject(message);
            if (value.optInt("v", -1) != PROTOCOL_VERSION) return;
            String type = value.optString("type", "");

            if ("ready".equals(type)) {
                webReady = true;
                recordDiagnostic("web ready=true");
                cancelMarkerRetry();
                expectedChunkIndex = 0;
                sendMetadata();
                return;
            }

            String shareId = value.optString("shareId", "");
            boolean shareMatches = pendingShare.id.equals(shareId);
            if ("next".equals(type)) {
                recordDiagnostic("web next received shareMatch=" + shareMatches);
            }
            if (!shareMatches) return;

            if ("next".equals(type)) {
                int index = value.optInt("index", -1);
                recordDiagnostic("web next index=" + index + " expected=" + expectedChunkIndex);
                if (index != expectedChunkIndex) {
                    sendNativeError("Web požádal o neočekávaný blok sdíleného ZIPu.");
                    return;
                }
                sendChunk(index);
                return;
            }

            if ("complete-request".equals(type)) {
                if (expectedChunkIndex != chunkCount(pendingShare)) {
                    sendNativeError("Sdílený ZIP ještě nebyl přenesen celý.");
                    return;
                }
                sendJson(new JSONObject()
                        .put("v", PROTOCOL_VERSION)
                        .put("type", "complete")
                        .put("shareId", pendingShare.id));
                return;
            }

            if ("ack".equals(type)) {
                shareFileStore.consume(pendingShare.id);
                pendingShare = null;
                resetTransferState();
                return;
            }

            if ("nack".equals(type)) {
                String reason = value.optString("message", "Lokální přenos ZIPu nebyl potvrzen.");
                Toast.makeText(this, reason + " Soubor zůstane dočasně pouze v zařízení.", Toast.LENGTH_LONG).show();
            }
        } catch (Exception error) {
            Log.w(TAG, "Ignoring invalid web postMessage", error);
        }
    }

    private void sendMetadata() throws Exception {
        PendingShare share = pendingShare;
        if (share == null) return;
        boolean sent = sendJson(new JSONObject()
                .put("v", PROTOCOL_VERSION)
                .put("type", "meta")
                .put("shareId", share.id)
                .put("name", share.displayName)
                .put("mimeType", share.mimeType)
                .put("size", share.size)
                .put("sha256", share.sha256)
                .put("chunks", chunkCount(share))
                .put("chunkSize", CHUNK_BYTES));
        recordDiagnostic("metadata sent=" + sent);
    }

    private void sendChunk(int index) {
        PendingShare share = pendingShare;
        if (share == null) return;
        ioExecutor.execute(() -> {
            try (RandomAccessFile file = new RandomAccessFile(share.file, "r")) {
                long offset = (long) index * CHUNK_BYTES;
                int expected = (int) Math.min(CHUNK_BYTES, share.size - offset);
                if (expected <= 0) throw new IllegalArgumentException("Neplatný blok sdíleného ZIPu.");
                byte[] bytes = new byte[expected];
                file.seek(offset);
                file.readFully(bytes);
                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                JSONObject payload = new JSONObject()
                        .put("v", PROTOCOL_VERSION)
                        .put("type", "chunk")
                        .put("shareId", share.id)
                        .put("index", index)
                        .put("data", base64);
                mainHandler.post(() -> {
                    if (pendingShare == null
                            || !pendingShare.id.equals(share.id)
                            || expectedChunkIndex != index) {
                        return;
                    }
                    boolean sent = sendJson(payload);
                    if (index == 0) recordDiagnostic("first chunk sent=" + sent);
                    if (sent) expectedChunkIndex += 1;
                });
            } catch (Exception error) {
                Log.e(TAG, "Unable to read local share chunk", error);
                mainHandler.post(() -> sendNativeError("Dočasný lokální ZIP se nepodařilo přečíst."));
            }
        });
    }

    private boolean sendJson(JSONObject value) {
        if (customTabsSession == null) return false;
        int result = customTabsSession.postMessage(value.toString(), null);
        if (result == CustomTabsService.RESULT_SUCCESS) return true;
        Log.w(TAG, "postMessage failed with result " + result);
        Toast.makeText(
                this,
                "Lokální přenos ZIPu se přerušil. Soubor nebyl odeslán na server; zkus Knee znovu otevřít.",
                Toast.LENGTH_LONG)
                .show();
        return false;
    }

    private void sendNativeError(String message) {
        try {
            sendJson(new JSONObject()
                    .put("v", PROTOCOL_VERSION)
                    .put("type", "error")
                    .put("message", message));
        } catch (Exception ignored) {
            // JSONObject with fixed keys should not fail.
        }
    }

    private Uri resolveLaunchUri(Intent intent, boolean hasPendingShare) {
        Uri data = intent.getData();
        if (Intent.ACTION_VIEW.equals(intent.getAction()) && isAllowedOrigin(data)) return data;
        Uri base = Uri.parse(BuildConfig.KNEE_ORIGIN + "/tindeq");
        return hasPendingShare
                ? base.buildUpon().appendQueryParameter("nativeShare", "1").build()
                : base;
    }

    private boolean isAllowedOrigin(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        String expectedHost = sourceOrigin.getHost();
        return expectedHost != null && expectedHost.equalsIgnoreCase(uri.getHost());
    }

    private static int chunkCount(PendingShare share) {
        return (int) ((share.size + CHUNK_BYTES - 1L) / CHUNK_BYTES);
    }

    private static Uri getSharedUri(Intent intent) {
        if (Build.VERSION.SDK_INT >= 33) {
            return intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
        }
        //noinspection deprecation
        return intent.getParcelableExtra(Intent.EXTRA_STREAM);
    }

    private void resetTransferState() {
        navigationFinished = false;
        channelRequested = false;
        webReady = false;
        expectedChunkIndex = 0;
        markerAttempt = 0;
        cancelMarkerRetry();
    }

    private void cancelMarkerRetry() {
        if (markerRetry != null) mainHandler.removeCallbacks(markerRetry);
        markerRetry = null;
    }

    private void beginDiagnosticTrace(String lifecycle) {
        if (!BuildConfig.DEBUG) return;
        diagnosticTrace.clear();
        twaLaunched = false;
        recordDiagnostic("lifecycle=" + lifecycle);
        recordDiagnostic("package=" + getPackageName());
        recordDiagnostic("APK SHA-256=" + installedSigningFingerprint());
    }

    private void recordDiagnostic(String step) {
        if (!BuildConfig.DEBUG) return;
        if (Looper.myLooper() != Looper.getMainLooper()) {
            mainHandler.post(() -> recordDiagnostic(step));
            return;
        }
        diagnosticTrace.add(step);
        Log.d(TAG, "diag: " + step);
    }

    private void renderDiagnosticTrace() {
        if (!BuildConfig.DEBUG) return;
        StringBuilder text = new StringBuilder("Knee Android share diagnostika\n\n");
        for (int index = 0; index < diagnosticTrace.size(); index += 1) {
            text.append(String.format(Locale.US, "%02d. %s\n", index + 1, diagnosticTrace.get(index)));
        }
        text.append("\nPouze lokální technický trace. Neobsahuje filename, klienta, shareId ani obsah ZIPu. ZIP se diagnostikou neodesílá na server.");

        TextView view = new TextView(this);
        view.setText(text.toString());
        view.setTextSize(16f);
        view.setGravity(Gravity.START);
        view.setPadding(40, 40, 40, 40);
        view.setTextIsSelectable(true);

        ScrollView scrollView = new ScrollView(this);
        scrollView.addView(view);
        setContentView(scrollView);
    }

    private String browserPackageSuffix() {
        return browserPackage == null ? "" : " package=" + browserPackage;
    }

    private String installedSigningFingerprint() {
        try {
            PackageManager packageManager = getPackageManager();
            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo packageInfo = packageManager.getPackageInfo(
                        getPackageName(),
                        PackageManager.GET_SIGNING_CERTIFICATES);
                SigningInfo signingInfo = packageInfo.signingInfo;
                if (signingInfo == null) return "unavailable";
                signatures = signingInfo.hasMultipleSigners()
                        ? signingInfo.getApkContentsSigners()
                        : signingInfo.getSigningCertificateHistory();
            } else {
                //noinspection deprecation
                PackageInfo packageInfo = packageManager.getPackageInfo(
                        getPackageName(),
                        PackageManager.GET_SIGNATURES);
                //noinspection deprecation
                signatures = packageInfo.signatures;
            }
            if (signatures == null || signatures.length == 0) return "unavailable";

            byte[] digest = MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray());
            StringBuilder fingerprint = new StringBuilder();
            for (int index = 0; index < digest.length; index += 1) {
                if (index > 0) fingerprint.append(':');
                fingerprint.append(String.format(Locale.US, "%02X", digest[index] & 0xFF));
            }
            return fingerprint.toString();
        } catch (Exception error) {
            return "unavailable";
        }
    }

    private static String navigationEventName(int navigationEvent) {
        if (navigationEvent == CustomTabsCallback.NAVIGATION_STARTED) return "NAVIGATION_STARTED";
        if (navigationEvent == CustomTabsCallback.NAVIGATION_FINISHED) return "NAVIGATION_FINISHED";
        if (navigationEvent == CustomTabsCallback.NAVIGATION_FAILED) return "NAVIGATION_FAILED";
        if (navigationEvent == CustomTabsCallback.NAVIGATION_ABORTED) return "NAVIGATION_ABORTED";
        if (navigationEvent == CustomTabsCallback.TAB_SHOWN) return "TAB_SHOWN";
        if (navigationEvent == CustomTabsCallback.TAB_HIDDEN) return "TAB_HIDDEN";
        return "UNKNOWN";
    }

    private void setLoadingView(String text) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(18f);
        view.setGravity(Gravity.CENTER);
        view.setPadding(32, 32, 32, 32);
        setContentView(view);
    }

    private void showFatalError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        if (BuildConfig.DEBUG) {
            recordDiagnostic("fatal stop");
            renderDiagnosticTrace();
        } else {
            setLoadingView(message);
        }
    }

    @Override
    protected void onDestroy() {
        cancelMarkerRetry();
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
