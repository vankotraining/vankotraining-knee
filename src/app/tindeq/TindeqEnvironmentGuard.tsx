"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { getConfiguredSupabaseUrl } from "@/lib/supabase-browser";
import { validateTindeqEnvironment } from "@/lib/tindeq-environment";
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

export default function TindeqEnvironmentGuard({ children }: TindeqEnvironmentGuardProps) {
  const href = useSyncExternalStore(subscribeToLocation, getBrowserHref, getServerHref);

  if (!href) {
    return <div className={styles.authState}>Kontroluji Knee prostředí a databázi…</div>;
  }

  const currentUrl = new URL(href);
  const redirectUrl = new URL("/tindeq", currentUrl.origin).toString();
  const validation = validateTindeqEnvironment(href, getConfiguredSupabaseUrl());

  if (!validation.allowed) {
    return (
      <section className={styles.authCard} aria-labelledby="tindeq-environment-error">
        <p className={styles.eyebrow}>Přístup k databázi zablokován</p>
        <h2 id="tindeq-environment-error">Knee prostředí není bezpečně nakonfigurované</h2>
        <div className={styles.errorBox}>{validation.reason}</div>
        <p>
          Očekávaný Supabase project ref: <strong>{validation.expectedProjectRef ?? "neurčen"}</strong>
          <br />
          Nakonfigurovaný project ref: <strong>{validation.actualProjectRef ?? "nezjištěn"}</strong>
        </p>
        <p>Dokud se prostředí neshoduje, modul nenačítá klienty ani neumožní zápis Tindeq dat.</p>
      </section>
    );
  }

  const isPreview = validation.environment === "development" && currentUrl.hostname.endsWith(".vercel.app");

  return (
    <>
      {isPreview ? (
        <section className={styles.authCard} aria-label="Kontrola testovacího prostředí">
          <p className={styles.eyebrow}>Testovací Knee preview</p>
          <p>
            Databáze: vývojový Supabase <strong>{validation.actualProjectRef}</strong>
          </p>
          <p>Magic link z této stránky bude požadovat návrat na:</p>
          <p className={styles.authMessage}><strong>{redirectUrl}</strong></p>
        </section>
      ) : null}
      {children}
    </>
  );
}
