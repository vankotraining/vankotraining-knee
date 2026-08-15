package cz.vankotraining.knee;

import java.io.File;

final class PendingShare {
    final String id;
    final File file;
    final String displayName;
    final String mimeType;
    final long size;
    final long createdAtMs;
    final String sha256;

    PendingShare(
            String id,
            File file,
            String displayName,
            String mimeType,
            long size,
            long createdAtMs,
            String sha256) {
        this.id = id;
        this.file = file;
        this.displayName = displayName;
        this.mimeType = mimeType;
        this.size = size;
        this.createdAtMs = createdAtMs;
        this.sha256 = sha256;
    }
}
