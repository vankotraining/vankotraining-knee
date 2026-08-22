# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po funkčním produkčním duplicate-save acceptance testu PR #24 a read-only kontrole produkční databáze.

## Aktuální `main` commit

Poslední runtime-changing commit:

`4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812` – `Merge PR #24: Fix Tindeq semantic dedupe timestamp comparison`.

Následující project-control commity jsou dokumentační a nemění runtime logiku.

## Aktivní větev a PR

PR #24 `Fix Tindeq semantic dedupe timestamp comparison` je **merged a closed**.

- pre-merge exact head: `29cb44533a76bed3f0493218e336763a4e525a7d`;
- merge commit: `4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812`;
- `Project control` run `32583799152`: success;
- `Verify Tindeq client view` run `32583799252`: success;
- Vercel Preview status na exact headu: success.

## Produkční runtime commit

PR #24 je nasazený v produkci:

- deployment: `dpl_EvmonjKfidzs8a1unGL7xEbz845j`;
- commit: `4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812`;
- state: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`;
- `GET /tindeq`: HTTP 200;
- post-deploy log check: žádný `warning`, `error` ani `fatal`.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #24 nepřidává DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatickou datovou mutaci.

Existující CHECK zůstává:

`CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

Stable semantic ID z PR #23 zůstává 20 lowercase hex znaků.

## Aktuální fáze

PR #24 opravuje false-negative semantic dedupe způsobený porovnáním ekvivalentních timestampů jako přesných stringů. `sameSemanticMeasurement()` nyní porovnává `measured_at` podle skutečného časového okamžiku přes `Date.parse()` / epoch milliseconds.

Funkční production acceptance na reálném telefonu proběhl úspěšně: opakované uložení stejného měření zobrazilo `Měření již uloženo` a `nevytvořen nový záznam`. Následná read-only kontrola produkční DB potvrdila, že počet aktivních rows zůstal `3`.

## Implementováno v `main`

- PR #21 Android native share/import tok;
- PR #22 semantic duplicate fallback a stable semantic identity;
- PR #23 DB-kompatibilní 20hex stable ID;
- PR #24 normalizované porovnání ekvivalentních `measured_at` timestampů;
- UI duplicate feedback při `duplicate: true`.

## Rozpracováno mimo `main`

Pro tuto opravu není další runtime změna mimo `main`.

## Nasazeno

- PR #21: ano;
- PR #22: ano;
- PR #23: ano;
- PR #24: ano, deployment `dpl_EvmonjKfidzs8a1unGL7xEbz845j` je `READY`.

## Produkčně ověřeno

- Android share/import: ano;
- první explicitní save: ano;
- PR #24 timestamp-normalized semantic dedupe: **ano**;
- production duplicate-save UI: `Měření již uloženo` / `nevytvořen nový záznam`;
- read-only DB audit po acceptance testu: `3` aktivní rows, tedy žádný nový duplicate row.

## Produkční data

Pro testované měření Rosová Štěpánka `14. 8. 2026 14:31` zůstávají tři aktivní rows vzniklé během předchozího ladění:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
- `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`.

Acceptance test PR #24 nevytvořil čtvrtý row. Žádný z existujících tří rows nebyl smazán ani soft-deleted.

## Známé problémy

- tři historické testovací rows stejného měření zůstávají aktivní do samostatného explicitního schválení případného cleanupu;
- první production Android share pokus PR #21 jednou transientně selhal, další pokusy uspěly;
- full-repo lint baseline obsahuje předexistující `3 errors / 1 warning`.

## Další krok

- Rozhodnout samostatně, zda bezpečně odstranit dvě nadbytečné testovací duplicity a ponechat jeden kanonický záznam; bez explicitního schválení produkční data neměnit.
