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
  };

  window.addEventListener("message", (event) => {
    const debug = window[debugKey];
    debug.messages += 1;
    debug.lastOrigin = event.origin || "";
    debug.markerMatched = event.data === marker;
    debug.portPresent = Boolean(event.ports && event.ports[0]);

    const accepted =
      event.origin === window.location.origin &&
      event.data === marker &&
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
