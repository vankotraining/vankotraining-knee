"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { getConfiguredSupabaseUrl } from "@/lib/supabase-browser";
import {
  getTindeqMagicLinkRedirect,
  validateTindeqEnvironment,
} from "@/lib/tindeq-environment";
import styles from "./tindeq.module.css";

type TindeqEnvironmentGuardProps = {
  children: ReactNode;
};

type NativeShareDebugEvent = {
  origin?: string;
  markerMatched?: boolean;
  portPresent?: boolean;
  ports?: number;
  dataType?: string;
};

type NativeShareDebugWindow = Window & {
  __kneeNativeSharePort?: MessagePort;
  __kneeNativeShareDebug?: {
    messages?: number;
    lastOrigin?: string;
    markerMatched?: boolean;
    portPresent?: boolean;
    accepted?: boolean;
    events?: NativeShareDebugEvent[];
  };
};

function subscribeToLocation() {
  return () => {};
}

function subscribeToNativeShareDebug(callback: () => void) {
  window.addEventListener("knee-native-share-debug", callback);
  window.addEventListener("knee-native-share-port", callback);
  return () => {
    window.removeEventListener("knee-native-share-debug", callback);
    window.removeEventListener("knee-native-share-port", callback);
  };
}

function getBrowserHref() {
  return window.location.href;
}

function getServerHref() {
  return "";
}

function getNativeShareDebugSnapshot() {
  const shareWindow = window as NativeShareDebugWindow;
  const currentUrl = new URL(window.location.href);
  const debug = shareWindow.__kneeNativeShareDebug;
  const summary = [
    `intent=${currentUrl.searchParams.get("nativeShare") === "1" ? "ano" : "ne"}`,
    `zprávy=${debug?.messages ?? 0}`,
    `marker kdykoli=${debug?.markerMatched ? "ano" : "ne"}`,
    `port kdykoli=${debug?.portPresent ? "ano" : "ne"}`,
    `přijato=${debug?.accepted ? "ano" : "ne"}`,
    `buffer=${shareWindow.__kneeNativeSharePort ? "ano" : "ne"}`,
  ].join(" · ");

  const events = (debug?.events ?? []).map((event, index) => {
    return `${index + 1}. origin=${event.origin || "—"} · marker=${event.markerMatched ? "ano" : "ne"} · port=${event.portPresent ? "ano" : "ne"} · ports=${event.ports ?? 0} · data=${event.dataType ?? "—"}`;
  });

  return events.length > 0 ? `${summary}\n${events.join("\n")}` : `${summary}\nžádná message událost`;
}

function getServerNativeShareDebugSnapshot() {
  return "";
}

export default function TindeqEnvironmentGuard({ children }: TindeqEnvironmentGuardProps) {
  const href = useSyncExternalStore(subscribeToLocation, getBrowserHref, getServerHref);
  const nativeShareDebug = useSyncExternalStore(
    subscribeToNativeShareDebug,
    getNativeShareDebugSnapshot,
    getServerNativeShareDebugSnapshot,
  );

  if (!href) {
    return <div className={styles.authState}>Kontroluji Knee prostředí a databázi…</div>;
  }

  const currentUrl = new URL(href);
  const redirectUrl = getTindeqMagicLinkRedirect(href);
  const validation = validateTindeqEnvironment(href, getConfiguredSupabaseUrl());

  if (!validation.allowed || !redirectUrl) {
    return (
      <section className={styles.authCard} aria-labelledby="tindeq-environment-error">
        <p className={styles.eyebrow}>Přístup k databázi zablokován</p>
        <h2 id="tindeq-environment-error">Knee prostředí není bezpečně nakonfigurované</h2>
        <div className={styles.errorBox}>
          {validation.reason ?? "Pro tuto adresu nelze bezpečně určit návrat magic linku."}
        </div>
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
  const safeLocation = `${currentUrl.origin}${currentUrl.pathname}`;

  return (
    <>
      {isPreview ? (
        <section className={styles.authCard} aria-label="Kontrola testovacího prostředí">
          <p className={styles.eyebrow}>Testovací Knee preview</p>
          <p>
            Databáze: vývojový Supabase <strong>{validation.actualProjectRef}</strong>
          </p>
          <p>
            Aktuální stránka: <strong>{safeLocation}</strong>
            <br />
            Origin: <strong>{currentUrl.origin}</strong>
          </p>
          <p>Magic link z této stránky bude požadovat návrat na:</p>
          <p className={styles.authMessage}><strong>{redirectUrl}</strong></p>
          <p>
            <strong>Android share diagnostika:</strong>
            <br />
            <span style={{ whiteSpace: "pre-wrap" }}>{nativeShareDebug || "čekám na klientskou diagnostiku…"}</span>
          </p>
        </section>
      ) : null}
      {children}
    </>
  );
}
