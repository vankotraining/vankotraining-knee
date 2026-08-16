import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./mobile-safe-area.css";

export const metadata: Metadata = {
  title: "Knee Data | Vanko Training",
  description: "Interní databáze knee extension měření.",
};

const nativeShareBootstrap = `
(() => {
  const marker = "knee-native-share-v1";
  const portKey = "__kneeNativeSharePort";
  const readyEvent = "knee-native-share-port";
  const debugEvent = "knee-native-share-debug";
  const debugKey = "__kneeNativeShareDebug";

  window[debugKey] = {
    messages: 0,
    lastOrigin: "",
    markerMatched: false,
    portPresent: false,
    accepted: false,
    acceptedReason: "",
    replySent: false,
    events: [],
  };

  window.addEventListener("message", (event) => {
    const debug = window[debugKey];
    const markerMatched = event.data === marker;
    const portPresent = Boolean(event.ports && event.ports[0]);
    const origin = event.origin || "";
    const url = new URL(window.location.href);
    const isPreviewNativeShare =
      url.hostname.endsWith(".vercel.app") &&
      url.searchParams.get("nativeShare") === "1";
    const expectedAndroidOrigin = "android-app://" + url.hostname;

    debug.messages += 1;
    debug.lastOrigin = origin;
    debug.markerMatched = debug.markerMatched || markerMatched;
    debug.portPresent = debug.portPresent || portPresent;
    debug.events.push({
      origin,
      markerMatched,
      portPresent,
      ports: event.ports ? event.ports.length : 0,
      dataType: typeof event.data,
    });
    if (debug.events.length > 8) debug.events.shift();

    const strictAccepted =
      origin === window.location.origin &&
      markerMatched &&
      event.ports &&
      event.ports[0];

    const diagnosticAccepted =
      isPreviewNativeShare &&
      origin === expectedAndroidOrigin &&
      event.ports &&
      event.ports[0];

    const accepted = strictAccepted || diagnosticAccepted;

    if (accepted) {
      const previous = window[portKey];
      if (previous && typeof previous.close === "function") {
        previous.close();
      }

      const port = event.ports[0];
      debug.accepted = true;
      debug.acceptedReason = strictAccepted ? "strict-marker" : "preview-android-origin";
      window[portKey] = port;

      if (diagnosticAccepted) {
        try {
          port.postMessage("knee-web-port-accepted-v1");
          debug.replySent = true;
        } catch {
          debug.replySent = false;
        }
      }

      window.dispatchEvent(new Event(readyEvent));
    }

    window.dispatchEvent(new Event(debugEvent));
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>
        <Script
          dangerouslySetInnerHTML={{ __html: nativeShareBootstrap }}
          id="knee-native-share-bootstrap"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
