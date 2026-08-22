# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge PR #22 a technickém post-deploy ověření.

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

Následný project-control sync je docs-only a nemění runtime chování Tindeq.

## Čas a výsledek deploymentu

- PR #22 merged: `2026-08-22T15:17:32Z`;
- deployment `dpl_DwAn14ANzVWFZBYk6i6bXyhttyct`: `READY`;
- target: `production`;
- branch: `main`;
- commit: `ec7979e233f846e4af3cdb740c1265150722b27b`;
- production alias: `knee.vankotraining.cz`;
- `/tindeq` po deploymentu vrací HTTP 200;
- Vercel runtime log check po deploymentu: žádný `warning`, `error` ani `fatal`.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #22 nepřidává DB migraci. Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny.

Nové save operace ukládají stabilní SHA-256 semantic ID `v2:<64 hex>`. Historické rows s legacy ID zůstávají detekovatelné semantic fallbackem.

## Provedené smoke testy

Pre-merge exact-head gate `9590068bf04cce4807f22947f63ee3e9a051543f`:

- `Project control` run `32581024950`: success;
- `Verify Tindeq client view` run `32581024910`: success;
- Vercel Preview: success;
- žádné unresolved review threads.

Post-merge technický production check:

- PR #22 je merged;
- Vercel production deployment je `READY` na správném merge commitu;
- production `/tindeq` vrací HTTP 200;
- nebyly nalezeny produkční `warning/error/fatal` logy.

Funkční duplicate-save smoke test po PR #22 ještě nebyl proveden na telefonu.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: Android native Tindeq share flow z production APK – funkční na skutečném telefonu;
- `2026-08-22`: první explicitní save měření Rosová Štěpánka – potvrzen UI i DB;
- `2026-08-22`: druhý save stejného re-exportovaného měření – audit prokázal vznik skutečné duplicity před opravou PR #22;
- funkční post-PR #22 duplicate-save acceptance zatím čeká na uživatele.

## Produkční stav Tindeq

- Android share/import: **produkčně nasazeno a ověřeno**;
- PR #22 duplicate detection fix: **merged a produkčně nasazen**;
- technický post-deploy check: **pass**;
- funkční duplicate-save acceptance na telefonu: **open**.

## Známé produkční problémy

- potvrzený testovací duplicate row `eacaecc9-9185-4cb8-8e52-561872e49cd5` je stále aktivní; nebyl bez explicitního schválení odstraněn;
- před opravou PR #22 produkce prokazatelně vytvořila duplicitu při re-exportu stejného obsahu s jiným legacy ID;
- po opravě je nutné dokončit production duplicate-save smoke test;
- jeden transientní první Android share fail z rollout PR #21 nebyl reprodukován;
- full-repo lint baseline obsahuje předexistující chyby/warning.
