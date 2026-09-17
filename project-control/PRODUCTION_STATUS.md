# Production status

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), po schválené canonicalizaci produkčních Knee asymmetry dat a před merge PR #25.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Aktuální production deployment před merge PR #25:

`dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`

## Nasazený commit

`de077dc688a45ee7124934eca63c7d626e213770` – `Close Tindeq duplicate cleanup gate`.

PR #25 ještě není v tomto runtime deploymentu.

## Čas a výsledek deploymentu

- deployment: `dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`;
- state: `READY`;
- target: `production`;
- branch: `main`;
- alias: `knee.vankotraining.cz`;
- commit: `de077dc688a45ee7124934eca63c7d626e213770`.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Dne `2026-09-17` byla po explicitním uživatelském pokynu dokončit nasazení aplikována verzovaná migrace:

- migration history version: `20260917114606`;
- name: `knee_asymmetry_percent_points`;
- repo source: `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`.

Fresh precheck před zápisem:

- `google_sheet_import`: 100 řádků, 100 migration candidates, 0 ambiguous;
- `manual`: 32 řádků, 32 canonical, 0 migration candidates, 0 ambiguous;
- invalid manual rows: 0;
- candidate snapshot MD5: `141511a89181810b8ba07f409bd12035`;
- `public.knee_data_export`: existuje a pokrývá všech 132 měření;
- `knee_extension_tests_audit_log` trigger a `public.knee_audit_log`: aktivní.

Post-check po migraci:

- `google_sheet_import`: 100/100 canonical, 0 noncanonical, rozsah `0.18–81.50`;
- `manual`: 32/32 canonical, 0 noncanonical, rozsah `0.96–51.62`;
- `weaker_side` mismatches: 0;
- audit log obsahuje 100 update záznamů změny asymetrie;
- konkrétní `72.4 / 73.1 kg` zůstává `asymmetry_pct = 0.96`, `weaker_side = right`, force-derived `0.9576 %`.

Datový kontrakt je nyní produkčně:

`knee_extension_tests.asymmetry_pct = procentní body`.

Migrace neměnila DDL/RLS/grants/indexy aplikace; změnila pouze 100 jednoznačně prokázaných historických hodnot a byla zapsána do migration history.

## Provedené smoke testy

Předchozí exact-head CI PR #25 na `cc361c...` potvrdilo:

- deterministic dependency install: success;
- unit tests: success;
- lint comparison against current `main`: success;
- production build: success;
- TypeScript check: success.

Selhání tohoto runu bylo pouze v project-control checkeru kvůli nekanonické struktuře stavových dokumentů; runtime/test kroky před ním prošly. Následné commity opravují pouze project-control strukturu a evidence a musí mít nový exact-head zelený gate před merge.

Produkční DB post-check po migraci: PASS podle výše uvedených počtů.

Security/performance advisors byly po migraci spuštěny. Hlásí existující obecné problémy projektu (např. SECURITY DEFINER view/function grants, RLS/performance linty, duplicate/unused indexes), ale migrace asymetrie nevytvořila nový schema objekt ani nezměnila RLS/grants/indexy; tyto baseline problémy nejsou rozsahem PR #25.

## Poslední výslovné uživatelské produkční ověření

- `2026-09-17`: uživatel výslovně požádal `Dokonči nasazení`, čímž schválil pokračování přes dříve blokovaný production DB/merge gate.
- Manuální vizuální produkční acceptance opraveného Knee asymmetry UI ještě neproběhla; označení `produkčně ověřeno` zůstává do uživatelského potvrzení zakázané.

## Produkční stav Tindeq

Tindeq PR #21–#24 a dříve schválený duplicate cleanup zůstávají beze změny. PR #25 se týká pouze Knee asymetrie a nemění Tindeq parser, persistence ani Android share workflow.

## Známé produkční problémy

- dokud není PR #25 merge/deploy hotový, aktuální produkční UI stále obsahuje `<= 1 -> *100` heuristiku a manuální `0.96 %` může zobrazit jako `96.0 %`;
- full-repo lint má existující baseline problémy, proto PR používá comparison proti `main`;
- Supabase advisories obsahují existující security/performance baseline mimo scope PR #25.
