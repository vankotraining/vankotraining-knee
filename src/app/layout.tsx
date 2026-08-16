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

  window.addEventListener("message", (event) => {
    if (
      event.origin !== window.location.origin ||
      event.data !== marker ||
      !event.ports ||
      !event.ports[0]
    ) {
      return;
    }

    const previous = window[portKey];
    if (previous && typeof previous.close === "function") {
      previous.close();
    }

    window[portKey] = event.ports[0];
    window.dispatchEvent(new Event(readyEvent));
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
