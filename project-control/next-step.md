# Next Step

## Aktuální fáze

PR #23 je mergovaný a produkčně nasazený, ale production duplicate-save test po něm stále vytvořil nový row.

Read-only audit potvrdil, že semantic hodnoty jsou mezi třemi rows shodné. Root cause je přímé stringové porovnání `measured_at`; ekvivalentní reprezentace stejného okamžiku (`.000Z` vs `+00:00`) se přes `===` nerovnají.

PR #24 `Fix Tindeq semantic dedupe timestamp comparison` je otevřený na branchi `agent/tindeq-time-normalization-hotfix`.

Oprava porovnává timestampy přes `Date.parse()` a epoch milliseconds. Stable 20hex ID z PR #23 i ostatní semantic pole zůstávají beze změny. DB migrace není potřeba.

## Další krok

1. Dokončit fresh exact-head CI/Preview gate PR #24 po opravě project-control struktury.
2. Pokud bude celý gate zelený, vyžádat explicitní souhlas k merge PR #24.
3. Po případném merge ověřit production deployment.
4. Na telefonu znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31` a potvrdit save.
5. Očekávání: UI `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam` a počet aktivních rows zůstane `3`.

## Produkční data

Aktivní jsou tři testovací rows stejného měření:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
- `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`.

Žádný zatím nemaž ani soft-delete bez samostatného explicitního schválení.

## Důležitý invariant

Originální Tindeq ZIP zůstává lokální a nesmí se stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční datové mutace se provádějí pouze po explicitním schválení uživatele.
