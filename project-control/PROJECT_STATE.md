# Project state

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), při přípravě draft PR #25 pro sjednocení jednotky Knee asymetrie.

## Aktuální `main`

`de077dc688a45ee7124934eca63c7d626e213770` – `Close Tindeq duplicate cleanup gate`.

Aktuální produkční Vercel deployment odpovídá tomuto commitu:

- `dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`;
- state `READY`;
- target `production`;
- alias `knee.vankotraining.cz`.

## Aktivní větev a PR

- branch: `fix/knee-asymmetry-percent-contract`;
- draft PR: `#25` `Fix knee asymmetry percentage-point contract`;
- app/test commit: `50bfe95`;
- migration/precheck commit: `f4335e0`;
- project-control evidence: `project-control/knee-asymmetry-percent-points-2026-09-17.md`.

PR #25 není mergovaný.

## Potvrzený problém Knee asymetrie

Současná manuální měření ukládají `asymmetry_pct` přímo v procentních bodech. Produkční případ `72.4 / 73.1 kg` je uložen jako `0.96`, což odpovídá přímému výpočtu `0.957592... %`.

UI ale na `main` používá v `getAsymmetryValue()` heuristiku `abs(value) <= 1 ? abs(value) * 100 : abs(value)`, a proto `0.96` zobrazí jako přibližně `96.0 %`.

## Produkční DB audit — read-only

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Všech 132 řádků `knee_extension_tests` bylo porovnáno s přímým výpočtem ze sil:

- `google_sheet_import`: 100 řádků, všech 100 jednoznačně odpovídá staré desetinné konvenci, 0 nejednoznačných;
- `manual`: 32 řádků, všech 32 už používá procentní body, z toho 5 archivovaných;
- `weaker_side` mismatch: 0;
- historický uložený rozsah: `0.00–0.81`;
- očekávaný kanonický rozsah po přepočtu v `numeric(6,2)`: `0.18–81.50`.

Nový datový kontrakt:

`knee_extension_tests.asymmetry_pct = procentní body`.

## Stav PR #25

### Implementováno ve větvi

Ano:

- UI již nehádá jednotku podle velikosti hodnoty;
- formátování a barevná klasifikace asymetrie používají stejnou kanonickou jednotku;
- přidány regresní testy pro sub-1% asymetrii a prahy 10/20 %;
- připravena fail-closed idempotentní migrace historických `google_sheet_import` řádků;
- připraven read-only precheck a post-check;
- repository export SQL již nemá `<=1 -> *100` fallback.

### Otestováno

Finální exact-head automatizované výsledky jsou evidovány v PR #25. Lokální `npm ci` na připojeném Windows stroji nebyl použit jako autoritativní gate kvůli environmentálnímu `ENOTEMPTY` problému při instalaci; CI/Vercel jsou autoritativní automatizované kontroly.

### Databáze aplikována

**Ne.** Produkční DB nebyla změněna.

### Preview nasazeno

Stav finálního exact-head preview je evidován v PR #25.

### Implementováno v `main`

**Ne.** PR #25 je draft.

### Produkčně nasazeno

**Ne.** Produkce stále běží na `main@de077dc688a45ee7124934eca63c7d626e213770`.

### Produkčně ověřeno

**Ne.** Tento stav smí být označen až po explicitním potvrzení uživatele po rollout.

## Tindeq

Poslední dokončený Tindeq rollout PR #24 a následný schválený cleanup zůstávají uzavřené a nejsou PR #25 měněny.

## Další krok

Před produkčním zápisem:

1. znovu spustit read-only asymmetry precheck;
2. potvrdit požadovaný backup/export podle `operations.md`;
3. ověřit `ambiguous_rows = 0` a očekávaný počet kandidátů;
4. získat explicitní souhlas uživatele s produkční datovou migrací;
5. až poté aplikovat migraci, post-check a řešit merge/deployment gate.
