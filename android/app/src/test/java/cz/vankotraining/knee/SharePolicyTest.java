package cz.vankotraining.knee;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SharePolicyTest {
    @Test
    public void supportsZipMimeVariantsWithoutAcceptingArbitraryFiles() {
        assertTrue(SharePolicy.isSupportedFile("repeaters.zip", "application/zip"));
        assertTrue(SharePolicy.isSupportedFile("repeaters.zip", "application/x-zip-compressed"));
        assertTrue(SharePolicy.isSupportedFile("repeaters.zip", "application/octet-stream"));
        assertFalse(SharePolicy.isSupportedFile("repeaters.csv", "application/octet-stream"));
        assertFalse(SharePolicy.isSupportedFile("photo.jpg", "image/jpeg"));
    }

    @Test
    public void recognizesZipSignatures() {
        assertTrue(SharePolicy.hasZipSignature(new byte[] {0x50, 0x4b, 0x03, 0x04}, 4));
        assertTrue(SharePolicy.hasZipSignature(new byte[] {0x50, 0x4b, 0x05, 0x06}, 4));
        assertFalse(SharePolicy.hasZipSignature(new byte[] {1, 2, 3, 4}, 4));
    }

    @Test
    public void expiresTemporarySharesAfterThirtyMinutes() {
        long now = 10_000_000L;
        assertFalse(SharePolicy.isExpired(now - SharePolicy.TTL_MS, now));
        assertTrue(SharePolicy.isExpired(now - SharePolicy.TTL_MS - 1, now));
    }
}
