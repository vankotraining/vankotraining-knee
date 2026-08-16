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
    events: [],
  };

  window.addEventListener("message", (event) => {
    const debug = window[debugKey];
    const markerMatched = event.data === marker;
    const portPresent = Boolean(event.ports && event.ports[0]);
    const origin = event.origin || "";

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

    const accepted =
      origin === window.location.origin &&
      markerMatched &&
      event.ports &&
      event.ports[0];

    if (accepted) {
      const previous = window[portKey];
      if (previous && typeof previous.close === "function") {
        previous.close();
      }

      debug.accepted = true;
      window[portKey] = event.ports[0];
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
