# Tindeq Repeaters – etapa 1

Datum: 2026-08-01  
Větev: `feature/tindeq-repeaters-import`  
Draft PR: `#11`  
Produkční aplikace: `https://knee.vankotraining.cz`

## Stav

Etapa 1 je implementovaná na samostatné feature větvi. Produkční Supabase projekt ani `main` nebyly změněny.

## Implementovaný rozsah

- bezpečná Supabase SSR autentizace pro Route Handlers,
- `POST /api/import/tindeq` pro jeden ZIP i ZIP obsahující více exportů,
- parser `info.csv` a `data_set_1.csv`, výpočet skutečné vzorkovací frekvence,
- SHA-256 kontrola duplicity,
- přiřazení nebo vytvoření klienta podle normalizovaného tagu,
- nepřiřazená session při chybějícím tagu,
- bilaterální segmentace, metriky opakování a série,
- detail měření, bolest, RPE a klinická poznámka,
- verzování parseru, segmentace, metrik a analýzy,
- privátní uložení původního ZIPu do `{userId}/{measurementId}/original.zip`.

## Datový model a bezpečnost

Migrace `20260801_tindeq_repeaters_stage1.sql` vytváří:

- `tindeq_repeaters_sessions`,
- `tindeq_repetitions`,
- `tindeq_import_errors`,
- privátní bucket `tindeq-raw`,
- RLS policies vázané na `owner_user_id = auth.uid()` a `is_knee_admin()`.

Service-role klíč se nepoužívá. Stávající širší policies sdíleného produkčního projektu nebyly změněny.

## Automatické ověření

- 37/37 testů PASS,
- TypeScript PASS,
- žádný nový lint nález proti `main`,
- production dependency audit: 0 zranitelností,
- Next.js production build PASS,
- izolovaný Supabase databázový integrační job PASS.

GitHub Actions ověřuje čistou migraci, RLS, privátní Storage, izolaci vlastníků, anonymní/neadmin přístup, duplicitu a databázové constraints. Poslední ověřený workflow před hostovaným preview: `30716054045`.

## Bezplatné hostované preview

Byl založen oddělený bezplatný Supabase projekt:

- název `tindeq-repeaters-preview`,
- project ref `ednbxwvvzomvdkjdybau`,
- region `eu-central-1`,
- cena `0 USD / měsíc`,
- bez produkčních klientských dat.

Supabase security advisors po aplikaci schématu nevracejí žádný nález.

Vercel používá tento projekt pouze pro přesnou kombinaci:

- `VERCEL_ENV=preview`,
- `VERCEL_GIT_COMMIT_REF=feature/tindeq-repeaters-import`.

Produkční build ani ostatní větve se nemění.

Preview:

`https://vankotraining-knee-ntsm1xvt0-vankotrainings-projects.vercel.app`

Preview zobrazuje samostatné testovací přihlášení. Dočasné heslo není uloženo v repozitáři.

## Zbývající ruční gate

Před produkční migrací je potřeba v preview ručně ověřit:

1. přihlášení,
2. upload jednoho reálného privátního Tindeq ZIPu,
3. otevření detailu,
4. opakovaný upload stejného ZIPu a návrat existující session,
5. původní ZIP v privátním bucketu,
6. uložení bolesti, RPE a poznámky.

## Další etapy

Etapa 2 – PWA manifest a Android Web Share Target – nezačne před dokončením ručního gate. Grafy, historie Repeaters a správa nepřiřazených importů patří do etapy 3.
