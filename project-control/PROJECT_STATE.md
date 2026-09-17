# Project state

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), po merge, produkčním rollout a uživatelském acceptance PR #25 `Fix knee asymmetry percentage-point contract`.

## Aktuální `main` commit

Poslední runtime-changing commit:

`59d23c4e18550675b8f5d7401e233ab60cc51d87` – `Merge PR #25: Fix knee asymmetry percentage-point contract`.

## Aktivní větev a PR

PR #25 je **merged a closed**.

- final exact head: `4b383d342516fc64c92852483e430a0b16ede2c9`;
- merge commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- exact-head `Project control` run `35217601098`: success;
- exact-head `Verify Tindeq client view` run `35217600919`: success;
- exact-head Vercel Preview: `dpl_2FbJSmqW12hBtt7BRBUFFca4twEX`, `READY`.

Tento docs-only sync probíhá na `docs/knee-asymmetry-rollout-20260917` a nemění runtime logiku.

## Produkční runtime commit

PR #25 je nasazený v produkci:

- runtime commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- deployment: `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`;
- state: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`;
- produkční root: HTTP 200;
- post-deploy kontrola `warning/error/fatal`: 0 nalezených logů v kontrolovaném okně.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Migrace PR #25 je produkčně aplikována:

- version: `20260917114606`;
- name: `knee_asymmetry_percent_points`;
- repo file: `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`.

Fresh precheck před zápisem:

- `google_sheet_import`: 100 legacy kandidátů, 0 ambiguous;
- `manual`: 32 již kanonických řádků, 0 invalid, 0 ambiguous;
- backup/export surface `public.knee_data_export` pokrýval všech 132 měření;
- candidate snapshot MD5: `141511a89181810b8ba07f409bd12035`.

Post-check:

- `google_sheet_import`: 100/100 canonical, 0 noncanonical, rozsah `0.18–81.50`;
- `manual`: 32/32 canonical, 0 noncanonical, rozsah `0.96–51.62`;
- 5 archivovaných manuálních měření zachováno;
- `weaker_side` mismatches: 0;
- audit log: 100 UPDATE záznamů migrace;
- případ `72.4 / 73.1 kg`: `asymmetry_pct = 0.96`, `weaker_side = right`, přímý výpočet `0.9576 %`.

Kanonický kontrakt:

`knee_extension_tests.asymmetry_pct = procentní body`.

## Aktuální fáze

PR #25 má dokončený datový i aplikační rollout. Heuristika `value <= 1 ? value * 100 : value` byla odstraněna z UI i exportních SQL. Tabulka, detail, mobilní karty, klientský souhrn, graf a barevná klasifikace používají jedinou jednotku – procentní body.

Hlášená produkční regrese je uzavřena i manuálním acceptance: uživatel po nasazení potvrdil v přihlášeném Knee UI zobrazení kontrolního měření `72.4 / 73.1 kg` jako `1 %`, nikoli `96 %`.

## Implementováno v `main`

Ano:

- `getAsymmetryValue(0.96) -> 0.96`;
- sdílené formátování asymetrie na jedno desetinné místo;
- prahy `<10 / 10–20 / >20 %` pracují přímo s procentními body;
- regrese `72.4 / 73.1 -> 0.957592... % -> 1.0 %`;
- odstranění magnitude heuristiky z repository exportů;
- verzovaná fail-closed/idempotentní historická migrace a checks.

## Rozpracováno mimo `main`

Pro PR #25 nezůstává žádná runtime ani databázová změna mimo `main`. Otevřený je pouze docs-only synchronizační PR #26, který zaznamenává rollout a acceptance.

## Nasazeno

- aplikace PR #25: **ano**, `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`, `READY`;
- DB migrace: **ano**, `20260917114606 knee_asymmetry_percent_points`;
- produkční alias `knee.vankotraining.cz`: ukazuje na deployment merge commitu PR #25.

## Produkčně ověřeno

- databázová integrita po migraci: **ano, read-only/automatizovaně ověřena**;
- produkční deployment a dostupnost: **ano, technicky ověřeno**;
- hlášená UI regrese `72.4 / 73.1 -> 1 %` místo `96 %`: **ano, výslovně potvrzeno uživatelem v přihlášené produkci dne 2026-09-17**.

PR #25 je tím ve smyslu projektové terminologie **produkčně ověřen**. Uživatel samostatně nepotvrzoval každou jednotlivou UI reprezentaci; jejich konzistence se stejnou procentní jednotkou je kryta implementací a regresními testy.

## Známé problémy

- pro opravenou chybu asymetrie není po acceptance známý otevřený produkční problém;
- full-repo lint baseline obsahuje dříve evidované problémy; PR #25 nepřidal nový relevantní lint problém;
- Supabase security/performance advisors obsahují existující problémy mimo scope PR #25; tato datová migrace neměnila RLS, grants ani indexy.

## Další krok

- Dokončit docs-only synchronizaci PR #26 po zelených kontrolách. Pro Knee asymmetry fix není potřeba další runtime ani databázový zásah; další projektový úkol zvolí uživatel.
