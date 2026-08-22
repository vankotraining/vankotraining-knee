# Next Step

## Aktuální fáze

PR #23 `Fix Tindeq stable ID DB constraint compatibility` je mergovaný do `main` a produkčně nasazený.

- merge commit: `59e7f362652e2eedff1e5e7764bbc05181ee1aa2`;
- production deployment: `dpl_GdVMkTenqui48VLoHNBaVDPHSr4f`;
- deployment state: `READY`;
- `knee.vankotraining.cz/tindeq`: HTTP 200;
- post-deploy log check: bez `warning/error/fatal`.

Hotfix zachovává semantic SHA-256 identitu, ale zapisuje ji jako `20` lowercase hex znaků kompatibilních s existujícím produkčním CHECK constraintem `^[0-9a-f]{20}$`. DB migrace není potřeba.

## Další krok

Na telefonu proveď jeden kontrolovaný production duplicate-save test:

1. znovu sdílej stejné měření Rosová Štěpánka `14. 8. 2026 14:31` z Tindeq do Knee;
2. vyber klienta Rosová Štěpánka;
3. stiskni `Uložit měření ke klientovi`;
4. očekávaná hláška je `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam`;
5. po výsledku provést read-only kontrolu produkční DB a potvrdit, že počet aktivních rows zůstává `2`.

## Produkční data

Aktivní jsou stále dva dřívější testovací rows stejného měření:

- původní `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- testovací duplicita `eacaecc9-9185-4cb8-8e52-561872e49cd5`.

Žádný z nich zatím nemaž ani soft-delete bez samostatného explicitního schválení.

## Důležitý invariant

Originální Tindeq ZIP zůstává lokální a nesmí se stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční datové mutace se provádějí pouze po explicitním schválení uživatele.
