# Production status

## Datum poslední kontroly

`2026-08-08` (Europe/Prague), po schválené production phase-5 DB migraci a post-checku.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

Duplicitní projekt `vankotraining-knee-mxei` není produkčním vlastníkem domény a jeho Git integrace zůstává odpojena.

## Deployment ID

Živě evidovaný produkční deployment:

`dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`.

## Nasazený commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` z větve `main` – `Record project-control phase 1 completion`.

Tindeq runtime z draft PR #12 na produkci stále není.

## Čas a výsledek deploymentu

Deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- commit: `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: žádný.

`READY` znamená pouze **produkčně nasazeno**, nikoli **produkčně ověřeno**.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`.

Po explicitním schválení uživatele byla `2026-08-08` aplikována phase-5 migrace z repo souboru:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`.

Supabase migration history ji eviduje jako:

`20260808091809 tindeq_active_session_unique`.

Pre-check bezprostředně před DDL:

- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- invalidní/chybějící `tindeqSessionId`: `0`;
- active duplicate groups: `0`;
- phase-5 CHECK/index před migrací neexistovaly;
- `28` sloupců, RLS zapnuté, `3` policies.

Backup/export gate:

- read-only logický export relevantních `public.tindeq_sessions` dat byl vytvořen před DDL;
- tabulka byla prázdná, export byl přesně `[]`;
- rollback SQL je omezené na odstranění phase-5 indexu a CHECK constraintu a je verzovaně dokumentované.

Post-check po migraci:

- `public.tindeq_sessions`: stále `0` celkem / `0` aktivních;
- invalidní source session ID: `0`;
- active duplicate groups: `0`;
- validated constraint `tindeq_sessions_source_session_id_valid`: existuje;
- definice CHECK vynucuje `^[0-9a-f]{20}$`;
- partial unique index `tindeq_sessions_active_source_session_uidx`: existuje a omezuje pouze `deleted_at IS NULL`;
- počet sloupců zůstal `28`;
- RLS je zapnuté, `3` policies a relevantní grants zůstaly zachované.

Security a performance advisors byly po migraci spuštěny. Neobjevil se nový phase-5 nález na `public.tindeq_sessions`; dříve existující shared-production nálezy zůstávají mimo rozsah této migrace a nebyly měněny.

## Provedené smoke testy

Po phase-5 DB změně bylo databázově/read-only ověřeno:

- migrační historie obsahuje `20260808091809 tindeq_active_session_unique`;
- CHECK je validated a má očekávanou definici;
- partial UNIQUE index má očekávanou definici;
- počty Tindeq dat jsou beze změny `0/0`;
- `0` invalidních source ID a `0` duplicate groups;
- RLS/policies/grants zůstaly zachované;
- security/performance advisors byly spuštěny.

Nebyl vytvořen produkční testovací klient ani Tindeq session a nebyl proveden produkční aplikační write acceptance. Jedinou schválenou produkční mutací v tomto kroku byla verzovaná phase-5 schema migrace.

## Poslední výslovné uživatelské produkční ověření

Současný Tindeq runtime jako celek není označen jako produkčně ověřený.

Uživatel explicitně schválil produkční phase-5 DB migraci; to není totéž jako manuální produkční ověření Tindeq workflow po jeho budoucím runtime deploymentu.

`READY` deployment, CI, preview acceptance ani DB post-check se za produkční runtime ověření nepovažují.

## Produkční stav Tindeq

- `public.tindeq_sessions` existuje a má `0` řádků;
- phase-5 DB dedupe invariant je na produkci aplikovaný a post-check PASS;
- Tindeq runtime z PR #12 stále není v produkčním `main`;
- produkční Tindeq aplikační save nebyl proveden;
- production DB je schema-ready pro dedupe invariant, ale runtime rollout má samostatný merge/deploy gate.

## Preview acceptance stav

Fáze 7 zůstává **manuálně ověřeno: PASS** na dev Supabase a exact Vercel Preview:

- environment guard potvrdil dev project ref;
- skutečný magic-link se vrátil na exact preview bez localhostu;
- `/verify` a session byly úspěšné;
- skutečný Tindeq ZIP byl importován a explicitně uložen;
- duplicate cesta byla idempotentní.

Toto je preview acceptance, nikoli produkční runtime ověření.

## Merge-readiness infrastruktura mimo produkci

PR #12 obsahuje autentický `package-lock.json` a CI používá `npm ci`.

Poslední plně ověřený head před tímto DB-state syncem `2b8094629e9c689894648e38ff1194e228fe2f2b`:

- Verify Tindeq client view: success;
- Project control: success;
- unit `93/93`, Playwright `10/10`, build/TypeScript/project-control/diff PASS;
- lint beze změny proti `main` baseline;
- preview `dpl_B2wQpWAA46EaoCEbiwHXpofoNXj9`: `READY`, alias error `null`;
- duplicitní Vercel projekt: `0` nových deploymentů pro tento head.

Tyto aplikační změny nejsou produkčně nasazené.

## Vercel konsolidace

Kanonický projekt zůstává `vankotraining-knee`. Duplicitní projekt je pouze historický artefakt s odpojenou Git integrací.

## Známé produkční problémy

- Tindeq runtime z PR #12 ještě není produkčně nasazen;
- PR #12 zůstává draft a není merged;
- produkční Tindeq workflow není manuálně produkčně ověřené;
- shared production Supabase má dříve existující security/performance advisor nálezy mimo phase-5 scope;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.
