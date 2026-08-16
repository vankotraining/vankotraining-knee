package cz.vankotraining.knee;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Process;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.WeakHashMap;

public final class DiagnosticApplication extends Application {
    private static final String PREFS = "knee_lifecycle_diag";
    private static final String TRACE = "trace";
    private static final int MAX_EVENTS = 40;

    private final Map<Activity, Intent> lastReceiverIntent = new WeakHashMap<>();

    @Override
    public void onCreate() {
        super.onCreate();
        if (!BuildConfig.DEBUG) return;

        appendEvent(this, "process start pid=" + Process.myPid());
        registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {
            @Override
            public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
                if (!isShareReceiver(activity)) return;
                Intent intent = activity.getIntent();
                lastReceiverIntent.put(activity, intent);
                appendEvent(activity,
                        "receiver onCreate task=" + activity.getTaskId()
                                + " action=" + safeAction(intent)
                                + " flags=" + flags(intent)
                                + " saved=" + (savedInstanceState != null));
            }

            @Override
            public void onActivityStarted(Activity activity) {
                if (isShareReceiver(activity)) {
                    appendEvent(activity, "receiver onStart task=" + activity.getTaskId());
                }
            }

            @Override
            public void onActivityResumed(Activity activity) {
                if (!isShareReceiver(activity)) return;
                Intent currentIntent = activity.getIntent();
                Intent previousIntent = lastReceiverIntent.get(activity);
                if (previousIntent != null && currentIntent != previousIntent) {
                    appendEvent(activity,
                            "receiver intent replaced before resume task=" + activity.getTaskId()
                                    + " action=" + safeAction(currentIntent)
                                    + " flags=" + flags(currentIntent));
                    lastReceiverIntent.put(activity, currentIntent);
                }
                appendEvent(activity, "receiver onResume task=" + activity.getTaskId());
            }

            @Override
            public void onActivityPaused(Activity activity) {
                if (isShareReceiver(activity)) {
                    appendEvent(activity, "receiver onPause task=" + activity.getTaskId());
                }
            }

            @Override
            public void onActivityStopped(Activity activity) {
                if (isShareReceiver(activity)) {
                    appendEvent(activity, "receiver onStop task=" + activity.getTaskId());
                }
            }

            @Override
            public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
                if (isShareReceiver(activity)) {
                    appendEvent(activity, "receiver onSaveInstanceState task=" + activity.getTaskId());
                }
            }

            @Override
            public void onActivityDestroyed(Activity activity) {
                if (!isShareReceiver(activity)) return;
                appendEvent(activity,
                        "receiver onDestroy task=" + activity.getTaskId()
                                + " finishing=" + activity.isFinishing()
                                + " changingConfig=" + activity.isChangingConfigurations());
                lastReceiverIntent.remove(activity);
            }
        });
    }

    private static boolean isShareReceiver(Activity activity) {
        return activity instanceof ShareReceiverActivity;
    }

    private static String safeAction(Intent intent) {
        if (intent == null) return "none";
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action)) return "SEND";
        if (Intent.ACTION_VIEW.equals(action)) return "VIEW";
        if (Intent.ACTION_MAIN.equals(action)) return "MAIN";
        if (Intent.ACTION_SEND_MULTIPLE.equals(action)) return "SEND_MULTIPLE";
        return action == null ? "none" : "other";
    }

    private static String flags(Intent intent) {
        int value = intent == null ? 0 : intent.getFlags();
        return String.format(Locale.US, "0x%08X", value);
    }

    static synchronized void appendEvent(Context context, String event) {
        String existing = context.getSharedPreferences(PREFS, MODE_PRIVATE).getString(TRACE, "");
        List<String> lines = new ArrayList<>();
        if (!existing.isEmpty()) {
            String[] previous = existing.split("\\n");
            for (String line : previous) {
                if (!line.isEmpty()) lines.add(line);
            }
        }
        lines.add(event);
        while (lines.size() > MAX_EVENTS) lines.remove(0);
        context.getSharedPreferences(PREFS, MODE_PRIVATE)
                .edit()
                .putString(TRACE, String.join("\n", lines))
                .commit();
    }

    static String readTrace(Context context) {
        return context.getSharedPreferences(PREFS, MODE_PRIVATE).getString(TRACE, "Bez záznamu.");
    }
}
