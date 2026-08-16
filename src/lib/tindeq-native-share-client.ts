import {
  NativeShareAssembler,
  TINDEQ_NATIVE_SHARE_CHANNEL_MARKER,
  parseNativeShareMessage,
} from "./tindeq-native-share";

type NativeShareReceiverOptions = {
  onFile: (file: File) => Promise<void>;
  onStatus: (message: string | null) => void;
  onError: (message: string) => void;
};

type WebToNativeMessage =
  | { v: 1; type: "ready" }
  | { v: 1; type: "next"; shareId: string; index: number }
  | { v: 1; type: "complete-request"; shareId: string }
  | { v: 1; type: "ack"; shareId: string }
  | { v: 1; type: "nack"; shareId?: string; message: string };

type NativeShareBootstrapWindow = Window & {
  __kneeNativeSharePort?: MessagePort;
};

const NATIVE_SHARE_PORT_EVENT = "knee-native-share-port";

export function attachTindeqNativeShareReceiver(options: NativeShareReceiverOptions) {
  let port: MessagePort | null = null;
  let assembler: NativeShareAssembler | null = null;
  let closed = false;

  function send(message: WebToNativeMessage) {
    if (!port || closed) return;
    port.postMessage(JSON.stringify(message));
  }

  function fail(message: string, shareId?: string) {
    options.onStatus(null);
    options.onError(message);
    send({ v: 1, type: "nack", shareId, message });
    assembler = null;
  }

  async function handlePortMessage(event: MessageEvent) {
    if (closed) return;

    // Chrome delivers the native channel marker on the established MessagePort.
    // It is a transport handshake, not a protocol payload, so do not treat it as malformed data.
    if (event.data === TINDEQ_NATIVE_SHARE_CHANNEL_MARKER) return;

    const message = parseNativeShareMessage(event.data);
    if (!message) {
      fail("Nativní Android přenos poslal neplatná data.");
      return;
    }

    try {
      if (message.type === "error") {
        fail(message.message);
        return;
      }

      if (message.type === "meta") {
        assembler = new NativeShareAssembler(message);
        options.onError("");
        options.onStatus("Přijímám sdílené Tindeq měření…");
        send({ v: 1, type: "next", shareId: message.shareId, index: 0 });
        return;
      }

      if (!assembler || message.shareId !== assembler.meta.shareId) {
        fail("Sdílený ZIP neodpovídá aktivnímu Android přenosu.", message.shareId);
        return;
      }

      if (message.type === "chunk") {
        assembler.addChunk(message.index, message.data);
        if (assembler.complete) {
          options.onStatus("Kontroluji sdílený Tindeq ZIP…");
          send({ v: 1, type: "complete-request", shareId: assembler.meta.shareId });
        } else {
          send({
            v: 1,
            type: "next",
            shareId: assembler.meta.shareId,
            index: assembler.expectedIndex,
          });
        }
        return;
      }

      if (message.type === "complete") {
        const active = assembler;
        const bytes = await active.finalize();
        const file = new File([bytes], active.meta.name, {
          type: active.meta.mimeType || "application/zip",
          lastModified: Date.now(),
        });
        options.onStatus("Analyzuji sdílené Tindeq měření…");
        await options.onFile(file);
        send({ v: 1, type: "ack", shareId: active.meta.shareId });
        assembler = null;
        options.onStatus(null);
      }
    } catch (error) {
      fail(
        error instanceof Error ? error.message : "Sdílený ZIP se nepodařilo bezpečně převzít.",
        assembler?.meta.shareId,
      );
    }
  }

  function adoptPort(nextPort: MessagePort) {
    if (closed) {
      nextPort.close();
      return;
    }

    port?.close();
    assembler = null;
    port = nextPort;
    port.onmessage = (portEvent) => {
      void handlePortMessage(portEvent);
    };
    port.start();
    send({ v: 1, type: "ready" });
  }

  function adoptBootstrappedPort() {
    const shareWindow = window as NativeShareBootstrapWindow;
    const bootstrappedPort = shareWindow.__kneeNativeSharePort;
    if (!bootstrappedPort) return false;
    delete shareWindow.__kneeNativeSharePort;
    adoptPort(bootstrappedPort);
    return true;
  }

  function handleBootstrapPort() {
    adoptBootstrappedPort();
  }

  function handleWindowMessage(event: MessageEvent) {
    if (
      closed ||
      event.origin !== window.location.origin ||
      event.data !== TINDEQ_NATIVE_SHARE_CHANNEL_MARKER ||
      !event.ports?.[0]
    ) {
      return;
    }

    adoptPort(event.ports[0]);
  }

  window.addEventListener("message", handleWindowMessage);
  window.addEventListener(NATIVE_SHARE_PORT_EVENT, handleBootstrapPort);
  adoptBootstrappedPort();

  return () => {
    closed = true;
    window.removeEventListener("message", handleWindowMessage);
    window.removeEventListener(NATIVE_SHARE_PORT_EVENT, handleBootstrapPort);
    port?.close();
    port = null;
    assembler = null;
  };
}
