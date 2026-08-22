package cz.vankotraining.knee;

import java.util.Locale;
import java.util.Set;

final class SharePolicy {
    static final long MAX_BYTES = 32L * 1024L * 1024L;
    static final long TTL_MS = 30L * 60L * 1000L;

    private static final Set<String> ZIP_MIME_TYPES = Set.of(
            "application/zip",
            "application/x-zip-compressed",
            "application/x-zip");
    private static final Set<String> GENERIC_ARCHIVE_MIME_TYPES = Set.of(
            "application/octet-stream",
            "application/x-compressed");

    private SharePolicy() {}

    static boolean isSupportedFile(String displayName, String mimeType) {
        String name = displayName == null ? "" : displayName.trim();
        String mime = normalizeMime(mimeType);
        boolean zipName = name.toLowerCase(Locale.US).endsWith(".zip");
        if (ZIP_MIME_TYPES.contains(mime)) return true;
        return (mime.isEmpty() || GENERIC_ARCHIVE_MIME_TYPES.contains(mime)) && zipName;
    }

    static boolean hasZipSignature(byte[] header, int length) {
        if (header == null || length < 4) return false;
        return header[0] == 0x50
                && header[1] == 0x4b
                && ((header[2] == 0x03 && header[3] == 0x04)
                || (header[2] == 0x05 && header[3] == 0x06)
                || (header[2] == 0x07 && header[3] == 0x08));
    }

    static boolean isExpired(long createdAtMs, long nowMs) {
        if (createdAtMs <= 0) return true;
        if (nowMs + 60_000L < createdAtMs) return true;
        return nowMs - createdAtMs > TTL_MS;
    }

    static String safeDisplayName(String value) {
        String input = value == null ? "" : value.trim();
        if (input.isEmpty()) return "tindeq-export.zip";
        String sanitized = input
                .replace('\\', '_')
                .replace('/', '_')
                .replaceAll("[\\p{Cntrl}]", "_")
                .trim();
        if (sanitized.isEmpty()) return "tindeq-export.zip";
        return sanitized.length() > 180 ? sanitized.substring(0, 180) : sanitized;
    }

    private static String normalizeMime(String value) {
        if (value == null) return "";
        String base = value.split(";", 2)[0].trim();
        return base.toLowerCase(Locale.US);
    }
}
