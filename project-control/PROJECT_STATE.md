# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním duplicate-save testu po PR #23, který vytvořil třetí aktivní row, a po root-cause auditu timestamp porovnání.

## Aktuální `main` commit

Aktuální `main` před PR #24:

`22fd311c727c2917f730b5289bea97737a75246f` – docs-only `Set PR #23 production acceptance as next step`.

Poslední runtime-changing commit v `main`:

`59e7f362652e2eedff1e5e7764bbc05181ee1aa2` – merge PR #23.

## Aktivní větev a PR

PR #24 `Fix Tindeq semantic dedupe timestamp comparison` je otevřený na branchi `agent/tindeq-time-normalization-hotfix`.

Runtime/test head před tímto project-control syncem:

`b293a0ee982ea2c19359624ef79f23c169246807`.

## Produkční runtime commit

Produkce stále běží na runtime logice PR #23:

- merge commit: `59e7f362652e2eedff1e5e7764bbc05181ee1aa2`;
- deployment: `dpl_GdVMkTenqui48VLoHNBaVDPHSr4f`;
- stav: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #24 nepřidává DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatickou datovou mutaci.

Existující CHECK zůstává:

`CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

Stable semantic ID z PR #23 zůstává 20 lowercase hex znaků.

## Aktuální fáze

Produkční test po PR #23 odstranil předchozí CHECK chybu, ale duplicate fallback stále minul starší identické rows a vytvořil třetí aktivní row.

Read-only audit potvrdil, že všechny hodnoty používané semantic dedupe jsou mezi třemi rows shodné. Root cause je přímé stringové porovnání `record.measured_at === payload.measured_at`: payload používá `Date.toISOString()` (`.000Z`), zatímco PostgREST může stejný okamžik vrátit jako `+00:00`.

## Implementováno v `main`

- PR #21 Android native share/import tok;
- PR #22 semantic fallback a stable semantic identity;
- PR #23 DB-kompatibilní 20hex stable ID;
- UI duplicate feedback při `duplicate: true`.

Aktuální produkční `main` stále porovnává `measured_at` jako přesný string, což může způsobit false negative semantic dedupe.

## Rozpracováno mimo `main`

PR #24 mění pouze timestamp porovnání v semantic fallbacku:

- `Date.parse()` obou reprezentací;
- porovnání epoch milliseconds;
- ostatní semantic pole beze změny;
- nový regresní test pro `.000Z` vs `+00:00`.

Na headu `b293a0ee982ea2c19359624ef79f23c169246807` prošlo `125/125` testů, lint comparison bez nové regrese, production build a TypeScript. První CI běh zastavil pouze project-control check kvůli chybějícím povinným názvům sekcí; runtime/test části byly zelené.

## Nasazeno

- PR #21: ano;
- PR #22: ano;
- PR #23: ano;
- PR #24: ne, pouze branch/Preview do dokončení gate a merge approval.

## Produkčně ověřeno

- Android share/import: ano;
- první explicitní save: ano;
- semantic dedupe před PR #24: produkčně prokazatelně stále vadný;
- PR #24 timestamp fix: zatím neprodukční.

## Produkční data

Pro testované měření Rosová Štěpánka `14. 8. 2026 14:31` jsou nyní tři aktivní rows:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
- `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`.

Žádný row nebyl smazán ani soft-deleted.

## Známé problémy

- produkční semantic dedupe může kvůli textové reprezentaci stejného timestampu vytvořit duplicitu;
- tři testovací rows zůstávají aktivní do samostatného schválení případného cleanupu;
- první production Android share pokus PR #21 jednou transientně selhal, další pokusy uspěly;
- full-repo lint baseline obsahuje předexistující `3 errors / 1 warning`.

## Další krok

- Dokončit fresh exact-head gate PR #24; po zeleném gate vyžádat explicitní merge approval a po případném produkčním deploymentu zopakovat stejný save test s očekáváním `Měření již uloženo` a počtem aktivních rows stále `3`.
