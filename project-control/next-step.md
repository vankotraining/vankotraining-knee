# Next Step

## Aktuální fáze

PR #24 `Fix Tindeq semantic dedupe timestamp comparison` je mergovaný, produkčně nasazený a funkčně produkčně ověřený.

- runtime merge commit: `4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812`;
- production deployment: `dpl_EvmonjKfidzs8a1unGL7xEbz845j`;
- deployment state: `READY`;
- `knee.vankotraining.cz/tindeq`: HTTP 200;
- post-deploy log check: bez `warning/error/fatal`;
- production duplicate-save acceptance: UI zobrazilo `Měření již uloženo` a `nevytvořen nový záznam`;
- následná read-only DB kontrola potvrdila, že počet aktivních rows zůstal `3`.

Oprava porovnává ekvivalentní `measured_at` timestampy podle skutečného časového okamžiku místo přesného stringu. Stable 20hex ID i ostatní semantic dedupe pole zůstávají beze změny. DB migrace nebyla potřeba.

## Další krok

Rozhodnout, zda provést kontrolovaný cleanup dvou nadbytečných testovacích duplicit a ponechat jeden kanonický záznam. Bez explicitního schválení uživatele žádný produkční row nemaž ani soft-delete.

## Produkční data

Aktivní jsou tři historické testovací rows stejného měření Rosová Štěpánka `14. 8. 2026 14:31`:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
- `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`.

PR #24 acceptance test nevytvořil čtvrtý row.

## Důležitý invariant

Originální Tindeq ZIP zůstává lokální a nesmí se stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční datové mutace se provádějí pouze po explicitním schválení uživatele.
