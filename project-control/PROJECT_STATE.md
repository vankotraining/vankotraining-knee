# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po úspěšném production acceptance PR #24 a následném schváleném cleanupu dvou testovacích duplicit.

## Aktuální `main` commit

Poslední runtime-changing commit:

`4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812` – `Merge PR #24: Fix Tindeq semantic dedupe timestamp comparison`.

`main` před tímto cleanup dokumentačním syncem byl `eb728c295eae9554698bcc6d471f7cbde2d2379c`. Následující project-control commity jsou dokumentační a nemění runtime logiku.

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

PR #24 je funkčně produkčně ověřený. Opakované uložení stejného měření na reálném telefonu zobrazilo `Měření již uloženo` a `nevytvořen nový záznam`; následná read-only kontrola DB potvrdila, že nevznikl čtvrtý row.

Po explicitním schválení uživatele byl proveden kontrolovaný cleanup dvou historických testovacích duplicit. Cleanup použil soft-delete, nikoliv hard delete.

## Implementováno v `main`

- PR #21 Android native share/import tok;
- PR #22 semantic duplicate fallback a stable semantic identity;
- PR #23 DB-kompatibilní 20hex stable ID;
- PR #24 normalizované porovnání ekvivalentních `measured_at` timestampů;
- UI duplicate feedback při `duplicate: true`.

## Rozpracováno mimo `main`

Pro duplicate-save opravu ani cleanup není další runtime změna mimo `main`.

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
- read-only DB audit po acceptance testu: nevznikl nový duplicate row;
- post-cleanup DB audit: z původních tří testovacích rows je aktivní přesně `1`.

## Produkční data

Pro testované měření Rosová Štěpánka `14. 8. 2026 14:31`:

- kanonický aktivní row ponechán: `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- testovací duplicita soft-deleted: `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
- testovací duplicita soft-deleted: `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`.

Soft-delete proběhl `2026-08-22T16:24:31.605156Z` (`18:24` Europe/Prague) s `deleted_context = duplicate_cleanup_pr24_acceptance_2026_08_22`. `deleted_by` zůstal `null`, v souladu s existujícím produkčním auditním vzorem pro kontrolované korekce. Post-cleanup kontrola potvrdila `active_count = 1`.

## Známé problémy

- první production Android share pokus PR #21 jednou transientně selhal, další pokusy uspěly;
- full-repo lint baseline obsahuje předexistující `3 errors / 1 warning`.

## Další krok

- Duplicate-save rollout a cleanup jsou uzavřené. Pro tuto oblast není otevřený další produkční gate; další práce může přejít na další prioritu projektu.
