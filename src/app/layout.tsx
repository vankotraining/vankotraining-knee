import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Knee | Vanko Training",
  description: "Specializovany projekt pro guidance rehabilitace kolene.",
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
