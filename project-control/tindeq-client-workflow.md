# Direct client Tindeq record implementation evidence

## Rozsah

Větev rozšiřuje PR #12 tak, aby bylo možné přidat Tindeq výsledek přímo k předem vybranému klientovi na hlavní Knee stránce.

Běžný tok:

1. uživatel vybere klienta v existujícím přehledu;
2. otevře `Přidat Tindeq záznam`;
3. importuje podporovaný Tindeq ZIP;
4. zvolí stranu;
5. volitelně zvolí historické maximum a procento maxima;
6. volitelně zapíše bolest;
7. zkontroluje vypočtené metriky;
8. uloží normalizovaný výsledek do historie klienta.

Samostatná trasa `/tindeq/workflow`, duplicitní vytváření klienta, antropometrie, ruční maximum a samostatné předpisy nejsou součástí výsledného návrhu.

## Uložené metriky cvičení

- klient a strana;
- volitelný snapshot historického maxima;
- volitelné procento maxima a vypočtený cíl;
- počet analyzovaných opakování;
- průměrná síla, nejlepší a nejslabší opakování;
- průměr vůči referenčnímu maximu a cílové síle;
- CV mezi průměrnými silami opakování;
- změna prvního vůči poslednímu opakování v procentních bodech cíle;
- celkový čas pracovních intervalů;
- normalizované detailní metriky a resamplované procentní křivky z PR #12;
- volitelná bolest před, maximum během a po;
- technická upozornění, verze analýzy a SHA-256 import fingerprint.

Původní ZIP a raw zdrojové časové řady se neukládají.

## Snapshot reference

Reference i procento jsou volitelné údaje konkrétního záznamu, nikoli samostatný plán nebo předpis.

Podporované režimy:

- bez reference: uloží se technická analýza, metriky vůči maximu a cíli jsou `null`;
- s referencí bez procenta: uloží se metriky vůči maximu, cíl zůstane `null`;
- s referencí a procentem: uloží se reference, procento, cíl a metriky vůči maximu i cíli.

Historický snapshot se po pozdějším přidání nového maxima nemění.

## Deduplikace

Otisk je vytvořen z klienta, strany, času měření, datasetu, protokolu, jednotky a normalizovaných sil/délky jednotlivých opakování. Název souboru, bolest a volitelná reference otisk nemění.

Pre-check doplňuje unikátní částečný index v databázi, který zachytí i souběžný zápis stejného výsledku.

## Databáze

Migrace `20260803_tindeq_client_workflow.sql` rozšiřuje pouze existující `public.tindeq_sessions`.

- nevytváří `tindeq_prescriptions`;
- zachovává RLS, auditní sloupce a soft delete;
- reference musí patřit stejnému aktivnímu klientovi;
- snapshot cíle musí odpovídat `reference × pct / 100`;
- bolest zachovává rozdíl `null` versus skutečná `0`.

Migrace a SQL kontroly byly aplikovány v bezplatném dev Supabase `twndqnmrvefhwuwuglju`. Produkční Supabase nebyl změněn.

## Autentizovaný live acceptance

Jednorázový acceptance tok proběhl dne `2026-08-04` nad syntetickým klientem a validním syntetickým Tindeq ZIPem.

Ověřený tok:

- skutečné přihlášení přes Supabase Auth;
- čtení klienta přes RLS;
- otevření formuláře v hlavní Knee stránce;
- lokální parsování ZIPu `info.csv + data_set_1.csv`;
- uložení levé strany proti referenci `50 kg` při `70 %` cíli;
- bolest `0 / 2 / 1`;
- autentizované načtení uloženého řádku přes RLS;
- reload stránky a zobrazení historie.

Uložený snapshot:

- reference `50 kg`;
- cíl `35 kg`;
- průměr `33,63 kg`;
- průměr `67,26 %` reference;
- průměr `96,0857 %` cíle;
- bolest `0 / 2 / 1`;
- fingerprint `7c1cacd8c7865e524cf80cd09cea3db0e9e6b70bf5ef4e7691ddc300b5f32763`.

Důkaz:

- commit `2ab818be45d2efc880e6e90438d50a84b203434a`;
- GitHub Actions run `30877791921`: `success`.

Po ověření byl jednorázový E2E test odstraněn a syntetický klient, profil, maximum, Tindeq session, Auth účet i identity byly z dev projektu smazány. Kontrolní počty všech položek jsou `0`.

## Finální čistý head

Commit `74d846e635afa59e48f01f606dc0c89e949da283`:

- GitHub Actions run `30877999256`: `success`;
- unit testy `90/90`;
- lint nepřidává chyby proti stacked base;
- Next.js production build a TypeScript: prošlo;
- Playwright `9/9`;
- Vercel preview `dpl_26VQ1pZyD1H42EU1yhhUeB5tuikR`: `READY`.
