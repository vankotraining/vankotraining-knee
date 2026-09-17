# Production status

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), po produkčním rollout a uživatelském acceptance PR #25 `Fix knee asymmetry percentage-point contract`.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Runtime-changing production deployment PR #25:

`dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`

## Nasazený commit

`59d23c4e18550675b8f5d7401e233ab60cc51d87` – `Merge PR #25: Fix knee asymmetry percentage-point contract`.

## Čas a výsledek deploymentu

- datum: `2026-09-17`;
- deployment: `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`;
- state: `READY`;
- target: `production`;
- branch: `main`;
- commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- alias: `knee.vankotraining.cz`;
- produkční `/`: HTTP 200 a přihlašovací obrazovka Knee se načetla;
- post-deploy runtime log query pro `warning/error/fatal`: žádný nález v kontrolovaném okně.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Migrace PR #25:

- version: `20260917114606`;
- name: `knee_asymmetry_percent_points`;
- repo source: `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`;
- status: produkčně aplikována.

Fresh precheck bezprostředně před zápisem:

- `google_sheet_import`: 100 řádků / 100 legacy kandidátů / 0 ambiguous;
- `manual`: 32 řádků / 32 canonical / 0 migration candidates / 0 ambiguous / 0 invalid manual;
- `weaker_side` mismatches: 0;
- candidate snapshot MD5: `141511a89181810b8ba07f409bd12035`;
- `public.knee_data_export` existoval a pokrýval všech 132 měření;
- audit trigger a `public.knee_audit_log` byly aktivní.

Post-check:

- `google_sheet_import`: 100/100 canonical, 0 noncanonical, rozsah `0.18–81.50`;
- `manual`: 32/32 canonical, 0 noncanonical, rozsah `0.96–51.62`;
- 5 archivovaných manual řádků zachováno;
- `weaker_side` mismatches: 0;
- audit log zaznamenal 100 UPDATE změn asymetrie;
- konkrétní `72.4 / 73.1 kg`: `asymmetry_pct = 0.96`, `weaker_side = right`, force-derived `0.9576 %`.

Datový kontrakt je produkčně jednoznačný:

`knee_extension_tests.asymmetry_pct = procentní body`.

Migrace nepřidala DDL/RLS/grants/indexy a žádný řádek neodstranila.

## Provedené smoke testy

Final exact head PR #25: `4b383d342516fc64c92852483e430a0b16ede2c9`.

- `Project control` run `35217601098`: success;
- `Verify Tindeq client view` run `35217600919`: success;
- deterministic dependency install: success;
- unit tests: success;
- lint comparison vůči `main`: success;
- production build: success;
- TypeScript check: success;
- project-control check: success;
- whitespace check: success;
- browser verification: success;
- exact-head Preview `dpl_2FbJSmqW12hBtt7BRBUFFca4twEX`: `READY`.

Produkční technická kontrola po merge:

- Vercel production deployment `READY` na exact merge commitu;
- `knee.vankotraining.cz/`: HTTP 200;
- production Supabase regression row zůstává `0.96` a celý dataset je kanonický;
- v kontrolovaném log okně nebyly nalezeny `warning/error/fatal` runtime záznamy.

Security/performance advisors po migraci hlásí existující obecné baseline problémy mimo scope PR #25; migrace asymetrie nevytvořila nové schema objekty ani nezměnila RLS/grants/indexy.

## Poslední výslovné uživatelské produkční ověření

- `2026-09-17`: uživatel výslovně požádal `Dokonči nasazení`, což schválilo produkční DB/merge rollout.
- `2026-09-17`: po nasazení uživatel v přihlášeném Knee UI potvrdil, že kontrolní měření `72.4 / 73.1 kg` se zobrazuje jako `1 %`, nikoli `96 %`.
- Tím je hlášená regrese zobrazení asymetrie PR #25 **produkčně ověřena**. Uživatel samostatně nepotvrzoval každou jednotlivou UI reprezentaci; jejich jednotková konzistence je kryta implementací a automatizovanými testy.

## Produkční stav Tindeq

Tindeq PR #21–#24 a schválený duplicate cleanup zůstávají beze změny. PR #25 nemění Tindeq parser, persistence, report logiku ani Android share workflow.

## Známé produkční problémy

- pro opravenou chybu asymetrie není po uživatelském acceptance známý otevřený produkční problém;
- full-repo lint má existující baseline problémy, PR #25 proti `main` nepřidal nový relevantní problém;
- Supabase advisors obsahují existující security/performance baseline mimo scope této opravy.
