export const TINDEQ_NATIVE_SHARE_PROTOCOL_VERSION = 1 as const;
export const TINDEQ_NATIVE_SHARE_CHANNEL_MARKER = "knee-native-share-v1";
export const TINDEQ_NATIVE_SHARE_MAX_BYTES = 32 * 1024 * 1024;
export const TINDEQ_NATIVE_SHARE_MAX_CHUNK_BYTES = 256 * 1024;

const ZIP_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
]);

const GENERIC_ARCHIVE_MIME_TYPES = new Set([
  "application/octet-stream",
  "application/x-compressed",
]);

export type NativeShareMetaMessage = {
  v: 1;
  type: "meta";
  shareId: string;
  name: string;
  mimeType: string;
  size: number;
  sha256: string;
  chunks: number;
  chunkSize: number;
};

export type NativeShareChunkMessage = {
  v: 1;
  type: "chunk";
  shareId: string;
  index: number;
  data: string;
};

export type NativeShareCompleteMessage = {
  v: 1;
  type: "complete";
  shareId: string;
};

export type NativeShareErrorMessage = {
  v: 1;
  type: "error";
  message: string;
};

export type NativeShareMessage =
  | NativeShareMetaMessage
  | NativeShareChunkMessage
  | NativeShareCompleteMessage
  | NativeShareErrorMessage;

function normalizedMime(value: string | null | undefined) {
  return (value ?? "").split(";", 1)[0].trim().toLocaleLowerCase("en-US");
}

export function isSupportedTindeqShareFile(
  name: string | null | undefined,
  mimeType: string | null | undefined,
) {
  const fileName = (name ?? "").trim();
  const mime = normalizedMime(mimeType);
  const zipName = /\.zip$/i.test(fileName);

  if (ZIP_MIME_TYPES.has(mime)) return true;
  if (!mime || GENERIC_ARCHIVE_MIME_TYPES.has(mime)) return zipName;
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeShareId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9-]{8,80}$/.test(value);
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function parseMeta(value: Record<string, unknown>): NativeShareMetaMessage | null {
  const size = value.size;
  const chunkSize = value.chunkSize;
  const chunks = value.chunks;
  const name = value.name;
  const mimeType = value.mimeType;
  const sha256 = value.sha256;

  if (!isSafeShareId(value.shareId)) return null;
  if (typeof name !== "string" || name.length < 1 || name.length > 255) return null;
  if (typeof mimeType !== "string" || mimeType.length > 160) return null;
  if (!isSupportedTindeqShareFile(name, mimeType)) return null;
  if (!isIntegerInRange(size, 1, TINDEQ_NATIVE_SHARE_MAX_BYTES)) return null;
  if (!isIntegerInRange(chunkSize, 16 * 1024, TINDEQ_NATIVE_SHARE_MAX_CHUNK_BYTES)) return null;
  if (!isIntegerInRange(chunks, 1, 2048)) return null;
  if (chunks !== Math.ceil(size / chunkSize)) return null;
  if (typeof sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(sha256)) return null;

  return {
    v: 1,
    type: "meta",
    shareId: value.shareId,
    name,
    mimeType,
    size,
    sha256: sha256.toLowerCase(),
    chunks,
    chunkSize,
  };
}

export function parseNativeShareMessage(value: unknown): NativeShareMessage | null {
  if (typeof value !== "string" || value.length > 512 * 1024) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed) || parsed.v !== TINDEQ_NATIVE_SHARE_PROTOCOL_VERSION) return null;

  if (parsed.type === "meta") return parseMeta(parsed);

  if (parsed.type === "chunk") {
    if (!isSafeShareId(parsed.shareId)) return null;
    if (!isIntegerInRange(parsed.index, 0, 1_000_000)) return null;
    if (typeof parsed.data !== "string" || parsed.data.length > 400 * 1024) return null;
    return {
      v: 1,
      type: "chunk",
      shareId: parsed.shareId,
      index: parsed.index,
      data: parsed.data,
    };
  }

  if (parsed.type === "complete") {
    if (!isSafeShareId(parsed.shareId)) return null;
    return { v: 1, type: "complete", shareId: parsed.shareId };
  }

  if (parsed.type === "error") {
    if (typeof parsed.message !== "string" || parsed.message.length < 1 || parsed.message.length > 500) {
      return null;
    }
    return { v: 1, type: "error", message: parsed.message };
  }

  return null;
}

function decodeBase64(value: string) {
  let decoded: string;
  try {
    decoded = atob(value);
  } catch {
    throw new Error("Sdílený ZIP obsahuje neplatný přenosový blok.");
  }
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}

export async function sha256Hex(bytes: Uint8Array) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export class NativeShareAssembler {
  readonly meta: NativeShareMetaMessage;
  private readonly bytes: Uint8Array;
  private nextIndex = 0;

  constructor(meta: NativeShareMetaMessage) {
    this.meta = meta;
    this.bytes = new Uint8Array(meta.size);
  }

  get expectedIndex() {
    return this.nextIndex;
  }

  get complete() {
    return this.nextIndex === this.meta.chunks;
  }

  addChunk(index: number, base64Data: string) {
    if (index !== this.nextIndex) {
      throw new Error(`Sdílený ZIP dorazil mimo pořadí (blok ${index + 1}).`);
    }

    const chunk = decodeBase64(base64Data);
    const offset = index * this.meta.chunkSize;
    const expectedLength = Math.min(this.meta.chunkSize, this.meta.size - offset);
    if (chunk.byteLength !== expectedLength) {
      throw new Error(`Sdílený ZIP má neplatnou délku bloku ${index + 1}.`);
    }

    this.bytes.set(chunk, offset);
    this.nextIndex += 1;
  }

  async finalize() {
    if (!this.complete) {
      throw new Error("Sdílený ZIP nebyl přenesen celý.");
    }
    const digest = await sha256Hex(this.bytes);
    if (digest !== this.meta.sha256) {
      throw new Error("Kontrolní součet sdíleného ZIPu nesouhlasí. Soubor nebyl použit.");
    }
    return new Uint8Array(this.bytes);
  }
}
