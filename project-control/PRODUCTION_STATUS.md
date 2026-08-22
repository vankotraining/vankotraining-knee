# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po funkčním production duplicate-save testu PR #22 a přípravě hotfixu PR #23.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Runtime deployment PR #22:

`dpl_DwAn14ANzVWFZBYk6i6bXyhttyct`

## Nasazený commit

Runtime-changing production commit:

`ec7979e233f846e4af3cdb740c1265150722b27b` – merge PR #22.

Následný `main@2fe99608985312c3dfc72fa2f7b9d914b2b83955` je project-control docs-only sync.

## Čas a výsledek deploymentu

- PR #22 merged: `2026-08-22T15:17:32Z`;
- deployment `dpl_DwAn14ANzVWFZBYk6i6bXyhttyct`: `READY`, production;
- `/tindeq` vrací HTTP 200;
- technický post-deploy log check nenašel `warning`, `error` ani `fatal`.

Technický deployment je tedy zdravý, ale funkční save test odhalil aplikačně-databázovou nekompatibilitu.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Fresh read-only audit dne `2026-08-22` potvrdil:

`tindeq_sessions_source_session_id_valid = CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny.

PR #22 ukládá stable semantic ID jako `v2:<64 hex>`, což CHECK constraint odmítá. PR #23 mění pouze reprezentaci stejné SHA-256 semantic identity na prvních 10 bytů digestu = `20` lowercase hex znaků. DB migrace není potřeba.

## Provedené smoke testy

Pre-merge PR #22 gate byl zelený a technický production deployment je `READY`.

Funkční production test na telefonu po PR #22:

- stejný Tindeq ZIP / měření se znovu správně otevřelo v Knee;
- klient Rosová Štěpánka byl vybraný;
- explicitní save skončil UI chybou;
- DB hláška: `new row for relation "tindeq_sessions" violates check constraint "tindeq_sessions_source_session_id_valid"`;
- neúspěšný insert nevytvořil nový row.

Fresh DB audit zároveň potvrzuje, že původní dva testovací rows stále existují:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`, legacy session ID `7508cd743009fa48715e`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`, legacy session ID `f90b7299be75c228bc45`.

PR #23 runtime/test head `c423cb15fef6763918cfe5f34c150c70049e7282` prošel unit testy, lint comparison, production buildem, TypeScript, project-control checkem, browser verification a Vercel Preview statusem `success`.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: Android native Tindeq share flow z production APK – funkční;
- `2026-08-22`: první save měření Rosová Štěpánka – funkční;
- `2026-08-22`: druhý re-export/save před PR #22 – vytvořil skutečnou duplicitu;
- `2026-08-22`: post-PR #22 duplicate-save test – save selhal na `tindeq_sessions_source_session_id_valid` CHECK constraintu.

## Produkční stav Tindeq

- Android share/import: **produkčně nasazeno a ověřeno**;
- PR #22 semantic dedupe: **produkčně nasazeno, ale stable-ID formát není DB-kompatibilní**;
- explicitní save na aktuálním production runtime: **může selhat na CHECK constraintu**;
- PR #23 compatibility hotfix: **CI/Preview ověřen, zatím nemergovaný a neprodukční**.

## Známé produkční problémy

- aktuální production runtime PR #22 generuje `v2:<64 hex>` ID, zatímco DB vyžaduje přesně 20 hex znaků;
- potvrzený testovací duplicate row `eacaecc9-9185-4cb8-8e52-561872e49cd5` zůstává aktivní a nebyl odstraněn;
- oba starší testovací rows se nečistí bez samostatného explicitního schválení;
- jeden transientní první Android share fail z rollout PR #21 nebyl reprodukován;
- full-repo lint baseline obsahuje předexistující chyby/warning.
