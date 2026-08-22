# Next Step

## Aktuální fáze

PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs` je mergovaný a produkčně nasazený, ale jeho funkční production duplicate-save test odhalil další konkrétní chybu.

Aktuální produkční runtime generuje stable semantic ID jako `v2:<64 hex>`, zatímco produkční Supabase CHECK constraint vyžaduje přesně `^[0-9a-f]{20}$`. Save proto skončil chybou `tindeq_sessions_source_session_id_valid` a databáze insert odmítla.

Hotfix PR #23 `Fix Tindeq stable ID DB constraint compatibility` je otevřený na branchi `agent/tindeq-stable-id-check-hotfix`.

PR #23 zachovává stejnou SHA-256 semantic identitu, ale ukládá prvních 10 bytů digestu = 20 lowercase hex znaků. DB migrace není potřeba.

Runtime/test head `c423cb15fef6763918cfe5f34c150c70049e7282` prošel unit testy, lint comparison, production buildem, TypeScript checkem, project-control checkem, browser Tindeq verification a Vercel Preview statusem `success`.

## Další krok

1. Po dokončení tohoto project-control syncu provést fresh exact-head gate PR #23.
2. Vyžádat explicitní souhlas uživatele k merge PR #23.
3. Po merge ověřit production Vercel deployment.
4. Na telefonu znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31` a potvrdit save.
5. Očekávaný výsledek: UI `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam` a read-only DB kontrola potvrdí, že nepřibyl další aktivní row.

Potvrzený testovací duplicate row `eacaecc9-9185-4cb8-8e52-561872e49cd5` zatím nemaž ani soft-delete bez samostatného explicitního schválení.

## Důležitý invariant

Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční data se nemění bez explicitního schválení uživatele.
