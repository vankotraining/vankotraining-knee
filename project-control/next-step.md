# Next Step

## Aktuální fáze

PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs` je mergovaný do `main` a produkčně nasazený.

Runtime merge commit:

`ec7979e233f846e4af3cdb740c1265150722b27b`

Produkční deployment:

`dpl_DwAn14ANzVWFZBYk6i6bXyhttyct` – `READY`.

Technický post-deploy check je zelený: `/tindeq` vrací HTTP 200 a nebyly nalezeny produkční `warning/error/fatal` logy.

## Další krok

Na telefonu proveď kontrolovaný duplicate-save test:

1. v Tindeq znovu sdílej stejné měření Rosová Štěpánka `14. 8. 2026 14:31` do Knee;
2. vyber stejného klienta;
3. potvrď uložení výsledku;
4. očekávaná hláška je `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam`;
5. po tvém potvrzení provést read-only kontrolu produkční DB, že nepřibyl třetí aktivní row.

Potvrzený testovací duplicate row `eacaecc9-9185-4cb8-8e52-561872e49cd5` zatím nemaž. Případné odstranění nebo soft-delete je samostatná produkční datová mutace a vyžaduje explicitní schválení.

## Důležitý invariant

Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční data se nemění bez explicitního schválení uživatele.
