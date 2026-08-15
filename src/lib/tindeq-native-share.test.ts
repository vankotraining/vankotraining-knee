import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NativeShareAssembler,
  TINDEQ_NATIVE_SHARE_MAX_BYTES,
  isSupportedTindeqShareFile,
  parseNativeShareMessage,
  sha256Hex,
  type NativeShareMetaMessage,
} from "./tindeq-native-share.js";

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

test("Android share accepts ZIP MIME variants without allowing arbitrary files", () => {
  assert.equal(isSupportedTindeqShareFile("repeaters.zip", "application/zip"), true);
  assert.equal(isSupportedTindeqShareFile("repeaters.zip", "application/x-zip-compressed"), true);
  assert.equal(isSupportedTindeqShareFile("repeaters.zip", "application/octet-stream"), true);
  assert.equal(isSupportedTindeqShareFile("repeaters.zip", ""), true);
  assert.equal(isSupportedTindeqShareFile("repeaters.csv", "application/octet-stream"), false);
  assert.equal(isSupportedTindeqShareFile("photo.jpg", "image/jpeg"), false);
});

test("native share protocol rejects oversized or malformed metadata", () => {
  const tooLarge = JSON.stringify({
    v: 1,
    type: "meta",
    shareId: "12345678-abcd",
    name: "repeaters.zip",
    mimeType: "application/zip",
    size: TINDEQ_NATIVE_SHARE_MAX_BYTES + 1,
    sha256: "a".repeat(64),
    chunks: 1,
    chunkSize: 1,
  });
  assert.equal(parseNativeShareMessage(tooLarge), null);
  assert.equal(parseNativeShareMessage("not-json"), null);
});

test("native share assembler restores the exact ZIP bytes and verifies SHA-256", async () => {
  const bytes = Uint8Array.from({ length: 300_123 }, (_, index) => index % 251);
  const chunkSize = 128 * 1024;
  const meta: NativeShareMetaMessage = {
    v: 1,
    type: "meta",
    shareId: "share-12345678",
    name: "repeaters.zip",
    mimeType: "application/octet-stream",
    size: bytes.length,
    sha256: await sha256Hex(bytes),
    chunks: Math.ceil(bytes.length / chunkSize),
    chunkSize,
  };
  const assembler = new NativeShareAssembler(meta);

  for (let index = 0; index < meta.chunks; index += 1) {
    const start = index * chunkSize;
    const end = Math.min(bytes.length, start + chunkSize);
    assembler.addChunk(index, toBase64(bytes.subarray(start, end)));
  }

  const restored = await assembler.finalize();
  assert.deepEqual(Buffer.from(restored), Buffer.from(bytes));
});

test("native share assembler fails closed on out-of-order chunks", async () => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const meta: NativeShareMetaMessage = {
    v: 1,
    type: "meta",
    shareId: "share-abcdefgh",
    name: "repeaters.zip",
    mimeType: "application/zip",
    size: bytes.length,
    sha256: await sha256Hex(bytes),
    chunks: 2,
    chunkSize: 2,
  };
  const assembler = new NativeShareAssembler(meta);
  assert.throws(() => assembler.addChunk(1, toBase64(bytes.subarray(2))), /mimo pořadí/);
});
