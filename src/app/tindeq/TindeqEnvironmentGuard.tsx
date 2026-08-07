"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import styles from "./tindeq.module.css";

type TindeqEnvironmentGuardProps = {
  children: ReactNode;
};

function subscribeToLocation() {
  return () => {};
}

function getBrowserHref() {
  return window.location.href;
}

function getServerHref() {
  return "";
}

function isAllowedKneeLocation(url: URL) {
  const { hostname, pathname } = url;
  const isTindeqPath = pathname === "/tindeq" || pathname.startsWith("/tindeq/");
  const isProduction = hostname === "knee.vankotraining.cz";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isVercelPreview =
    hostname === "vankotraining-knee.vercel.app" ||
    (hostname.startsWith("vankotraining-knee-") && hostname.endsWith(".vercel.app"));

  return isTindeqPath && (isProduction || isLocal || isVercelPreview);
}

export default function TindeqEnvironmentGuard({ children }: TindeqEnvironmentGuardProps) {
  const href = useSyncExternalStore(subscribeToLocation, getBrowserHref, getServerHref);

  if (!href) {
    return <div className={styles.authState}>Kontroluji přihlašovací doménu…</div>;
  }

  const currentUrl = new URL(href);
  const redirectUrl = new URL("/tindeq", currentUrl.origin).toString();

  if (!isAllowedKneeLocation(currentUrl)) {
    return (
      <section className={styles.authCard} aria-labelledby="tindeq-origin-error">
        <p className={styles.eyebrow}>Přihlášení zablokováno</p>
        <h2 id="tindeq-origin-error">Toto není povolená Knee adresa</h2>
        <div className={styles.errorBox}>
          Magic link nelze odeslat z adresy {currentUrl.origin}{currentUrl.pathname}.
        </div>
        <p>Otevři přímo stránku <strong>/tindeq</strong> na Knee produkci nebo schváleném Knee preview.</p>
      </section>
    );
  }

  const isPreview = currentUrl.hostname.endsWith(".vercel.app");

  return (
    <>
      {isPreview ? (
        <section className={styles.authCard} aria-label="Kontrola testovacího prostředí">
          <p className={styles.eyebrow}>Testovací Knee preview</p>
          <p>Magic link z této stránky bude požadovat návrat na:</p>
          <p className={styles.authMessage}><strong>{redirectUrl}</strong></p>
        </section>
      ) : null}
      {children}
    </>
  );
}
