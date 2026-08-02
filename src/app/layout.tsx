import type { Metadata } from "next";
import "./globals.css";
import "./mobile-safe-area.css";

export const metadata: Metadata = {
  title: "Knee Data | Vanko Training",
  description: "Interní databáze knee extension měření.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
