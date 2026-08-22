# Next Step

## Aktuální fáze

PR #24 `Fix Tindeq semantic dedupe timestamp comparison` je mergovaný do `main` a produkčně nasazený.

- merge commit: `4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812`;
- production deployment: `dpl_EvmonjKfidzs8a1unGL7xEbz845j`;
- deployment state: `READY`;
- `knee.vankotraining.cz/tindeq`: HTTP 200;
- post-deploy log check: bez `warning/error/fatal`.

Oprava porovnává ekvivalentní `measured_at` timestampy podle skutečného časového okamžiku místo přesného stringu. Stable 20hex ID i ostatní semantic dedupe pole zůstávají beze změny. DB migrace není potřeba.

## Další krok

Na telefonu proveď jeden kontrolovaný production duplicate-save test:

1. znovu sdílej stejné měření Rosová Štěpánka `14. 8. 2026 14:31` z Tindeq do Knee;
2. vyber klienta Rosová Štěpánka;
3. stiskni `Uložit měření ke klientovi`;
4. očekávaná hláška je `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam`;
5. po výsledku provést read-only kontrolu produkční DB a potvrdit, že počet aktivních rows zůstává `3`.

## Produkční data

Aktivní jsou tři testovací rows stejného měření:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
- `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`.

Žádný zatím nemaž ani soft-delete bez samostatného explicitního schválení.

## Důležitý invariant

Originální Tindeq ZIP zůstává lokální a nesmí se stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční datové mutace se provádějí pouze po explicitním schválení uživatele.
