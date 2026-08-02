// TypeScript's generic Uint8Array<ArrayBufferLike> is not currently accepted as
// BlobPart even though browsers accept Uint8Array at runtime. Keep this shim
// isolated until the DOM library types converge.
declare global {
  interface Uint8Array<TArrayBuffer extends ArrayBufferLike = ArrayBufferLike>
    extends Blob {}
}

export {};
