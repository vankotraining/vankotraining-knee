# Production status

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), při read-only auditu Knee asymetrie před draft PR #25.

## Produkční URL a deployment

- URL: `https://knee.vankotraining.cz`;
- Vercel project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`;
- current deployment: `dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`;
- state: `READY`;
- target: `production`;
- deployed commit: `de077dc688a45ee7124934eca63c7d626e213770` (`Close Tindeq duplicate cleanup gate`).

PR #25 není součástí tohoto deploymentu.

## Produkční Supabase

Project ref: `zxvndqicslyulrinbpyn`.

### Aktuální kontrakt v datech před PR #25

`knee_extension_tests.asymmetry_pct` je `numeric(6,2)` s rozsahem `0–100`, ale produkční data historicky obsahují dvě konvence:

- 100 řádků `google_sheet_import` používá starou desetinnou reprezentaci;
- 32 řádků `manual` už používá procentní body.

Read-only audit všech 132 řádků dne `2026-09-17`:

- legacy `google_sheet_import` kandidáti: `100`;
- manual canonical rows: `32`;
- nejednoznačné řádky: `0`;
- `weaker_side` mismatch: `0`;
- 5 archivovaných Knee měření jsou `manual` a již kanonická.

Konkrétní aktivní měření `72.4 / 73.1 kg` je v DB správně uložené jako `0.96`, přímý výpočet dává `0.957592... %`.

## Otevřený problém

Aktuálně nasazený Knee UI interpretuje každou asymetrii `<= 1` jako desetinný podíl a násobí ji 100. Proto se korektně uložená manuální hodnota `0.96 %` zobrazuje přibližně jako `96.0 %`.

## PR #25 — stav vůči produkci

- implementováno ve větvi: **ano**;
- produkční DB migrace: **neaplikována**;
- merged do `main`: **ne**;
- produkčně nasazeno: **ne**;
- produkčně ověřeno: **ne**.

Připravený cílový kontrakt je:

`knee_extension_tests.asymmetry_pct = procentní body`.

Připravená migrace historické řádky nepřepisuje slepým `*100`; kanonickou hodnotu znovu počítá z `right_force_kg` a `left_force_kg` a mění pouze jednoznačně prokázané legacy kandidáty.

## Produkční write gate

Před změnou produkční databáze je nutné:

1. fresh spustit read-only precheck;
2. potvrdit očekávaných `100` legacy kandidátů a `0` nejednoznačných případů;
3. vytvořit/ověřit backup/export podle `operations.md`;
4. ověřit exact production project ref;
5. získat explicitní souhlas uživatele;
6. teprve potom aplikovat migraci a post-check.

## Poslední výslovné uživatelské produkční ověření

Poslední uzavřené produkční acceptance se stále vztahuje k Tindeq PR #24 a následnému cleanupu z `2026-08-22`. Knee asymmetry PR #25 dosud uživatelem v produkci ověřen nebyl.

## Známé technické baseline

Full-repo lint před PR #25 historicky obsahoval `3 errors / 1 warning`. PR #25 musí být posouzen proti tomuto baseline a nesmí přidat nový relevantní lint problém.
