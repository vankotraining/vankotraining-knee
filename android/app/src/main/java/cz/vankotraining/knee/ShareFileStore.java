package cz.vankotraining.knee;

import android.content.ContentResolver;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.UUID;

final class ShareFileStore {
    private static final String PREFS = "knee-tindeq-share";
    private static final String KEY_ID = "id";
    private static final String KEY_NAME = "name";
    private static final String KEY_MIME = "mime";
    private static final String KEY_SIZE = "size";
    private static final String KEY_CREATED_AT = "createdAt";
    private static final String KEY_SHA256 = "sha256";
    private static final String DIRECTORY = "tindeq-share";

    private final Context context;
    private final SharedPreferences preferences;
    private final File directory;

    ShareFileStore(Context context) {
        this.context = context.getApplicationContext();
        this.preferences = this.context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        this.directory = new File(this.context.getCacheDir(), DIRECTORY);
    }

    PendingShare stage(Uri uri, String intentMimeType, long nowMs) throws Exception {
        cleanup(nowMs);
        ContentResolver resolver = context.getContentResolver();
        String displayName = SharePolicy.safeDisplayName(queryDisplayName(resolver, uri));
        String resolverMime = resolver.getType(uri);
        String mimeType = preferMime(resolverMime, intentMimeType);
        if (!SharePolicy.isSupportedFile(displayName, mimeType)) {
            throw new IllegalArgumentException("Knee přijímá pouze jeden Tindeq ZIP soubor.");
        }

        deletePending();
        if (!directory.exists() && !directory.mkdirs()) {
            throw new IllegalStateException("Nelze připravit lokální dočasné úložiště.");
        }

        String id = UUID.randomUUID().toString();
        File partial = new File(directory, id + ".part");
        File complete = new File(directory, id + ".zip");
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        long total = 0L;

        try (InputStream input = resolver.openInputStream(uri);
             FileOutputStream output = new FileOutputStream(partial)) {
            if (input == null) throw new IllegalArgumentException("Sdílený soubor nelze otevřít.");
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > SharePolicy.MAX_BYTES) {
                    throw new IllegalArgumentException("Sdílený ZIP je příliš velký (maximum 32 MB).");
                }
                digest.update(buffer, 0, count);
                output.write(buffer, 0, count);
            }
        } catch (Exception error) {
            partial.delete();
            throw error;
        }

        if (total <= 0) {
            partial.delete();
            throw new IllegalArgumentException("Sdílený ZIP je prázdný.");
        }

        byte[] header = new byte[4];
        int headerLength;
        try (FileInputStream input = new FileInputStream(partial)) {
            headerLength = input.read(header);
        }
        if (!SharePolicy.hasZipSignature(header, headerLength)) {
            partial.delete();
            throw new IllegalArgumentException("Sdílený soubor nemá platnou ZIP hlavičku.");
        }

        if (!partial.renameTo(complete)) {
            partial.delete();
            throw new IllegalStateException("Dočasný ZIP se nepodařilo dokončit.");
        }
        complete.setLastModified(nowMs);

        String sha256 = toHex(digest.digest());
        boolean persisted = preferences.edit()
                .putString(KEY_ID, id)
                .putString(KEY_NAME, displayName)
                .putString(KEY_MIME, mimeType)
                .putLong(KEY_SIZE, total)
                .putLong(KEY_CREATED_AT, nowMs)
                .putString(KEY_SHA256, sha256)
                .commit();
        if (!persisted) {
            complete.delete();
            throw new IllegalStateException("Dočasný ZIP se nepodařilo bezpečně evidovat.");
        }

        cleanupOrphans(id, nowMs);
        return new PendingShare(id, complete, displayName, mimeType, total, nowMs, sha256);
    }

    PendingShare load(long nowMs) {
        cleanup(nowMs);
        String id = preferences.getString(KEY_ID, null);
        if (id == null || id.isBlank()) return null;
        long createdAt = preferences.getLong(KEY_CREATED_AT, 0L);
        if (SharePolicy.isExpired(createdAt, nowMs)) {
            deletePending();
            return null;
        }
        File file = new File(directory, id + ".zip");
        if (!file.isFile()) {
            clearPreferences();
            return null;
        }
        long size = preferences.getLong(KEY_SIZE, -1L);
        if (size <= 0 || file.length() != size || size > SharePolicy.MAX_BYTES) {
            deletePending();
            return null;
        }
        String name = SharePolicy.safeDisplayName(preferences.getString(KEY_NAME, "tindeq-export.zip"));
        String mime = preferences.getString(KEY_MIME, "application/zip");
        String sha256 = preferences.getString(KEY_SHA256, "");
        if (sha256 == null || !sha256.matches("(?i)^[0-9a-f]{64}$")) {
            deletePending();
            return null;
        }
        cleanupOrphans(id, nowMs);
        return new PendingShare(id, file, name, mime == null ? "application/zip" : mime, size, createdAt, sha256.toLowerCase(Locale.US));
    }

    void consume(String shareId) {
        String current = preferences.getString(KEY_ID, null);
        if (current == null || !current.equals(shareId)) return;
        deletePending();
    }

    void cleanup(long nowMs) {
        if (!directory.exists()) return;
        String currentId = preferences.getString(KEY_ID, null);
        long currentCreatedAt = preferences.getLong(KEY_CREATED_AT, 0L);
        if (currentId != null && SharePolicy.isExpired(currentCreatedAt, nowMs)) {
            deletePending();
            currentId = null;
        }
        cleanupOrphans(currentId, nowMs);
    }

    private void deletePending() {
        String id = preferences.getString(KEY_ID, null);
        clearPreferences();
        if (id != null && !id.isBlank()) {
            new File(directory, id + ".zip").delete();
            new File(directory, id + ".part").delete();
        }
    }

    private void clearPreferences() {
        preferences.edit().clear().commit();
    }

    private void cleanupOrphans(String currentId, long nowMs) {
        File[] files = directory.listFiles();
        if (files == null) return;
        for (File file : files) {
            String expectedZip = currentId == null ? "" : currentId + ".zip";
            if (file.getName().equals(expectedZip)) continue;
            if (file.getName().endsWith(".part") || nowMs - file.lastModified() >= 0) {
                file.delete();
            }
        }
    }

    private static String queryDisplayName(ContentResolver resolver, Uri uri) {
        try (Cursor cursor = resolver.query(uri, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String value = cursor.getString(index);
                    if (value != null && !value.isBlank()) return value;
                }
            }
        } catch (RuntimeException ignored) {
            // Fallback below.
        }
        String segment = uri.getLastPathSegment();
        return segment == null ? "tindeq-export.zip" : segment;
    }

    private static String preferMime(String resolverMime, String intentMime) {
        String resolver = resolverMime == null ? "" : resolverMime.trim();
        String intent = intentMime == null ? "" : intentMime.trim();
        if (resolver.equalsIgnoreCase("application/zip")
                || resolver.equalsIgnoreCase("application/x-zip-compressed")
                || resolver.equalsIgnoreCase("application/x-zip")) {
            return resolver;
        }
        if (intent.equalsIgnoreCase("application/zip")
                || intent.equalsIgnoreCase("application/x-zip-compressed")
                || intent.equalsIgnoreCase("application/x-zip")) {
            return intent;
        }
        return !resolver.isBlank() ? resolver : intent;
    }

    private static String toHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) builder.append(String.format(Locale.US, "%02x", value & 0xff));
        return builder.toString();
    }
}
