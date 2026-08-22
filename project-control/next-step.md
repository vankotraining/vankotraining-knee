# Next Step

## Aktuální fáze

PR #21 Android native Tindeq share je produkčně nasazený a ověřený. Kontrolovaný save/duplicate test následně odhalil skutečnou chybu: re-export stejného měření může v aktuálním production main dostat jiné legacy `tindeqSessionId` a vytvořit duplicitní DB row.

PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs` je otevřený na branchi `agent/tindeq-duplicate-feedback`.

Oprava používá dvě vrstvy:

- nový save vytváří stabilní SHA-256 semantic ID, takže stejné strukturované měření konverguje na stejný existující DB unique key;
- starší rows s legacy ID jsou chráněny obsahovým fallback porovnáním.

## Ověřený pre-merge gate

Runtime/test head `c891a96fc1ebd3bd11c2958160a225523cbafe1c` prošel:

- všemi unit testy včetně stable-ID, semantic fallback a race-condition regresí;
- lint comparison bez nové regrese;
- production buildem;
- TypeScript kontrolou;
- project-control checkem;
- browser Tindeq verification;
- Vercel Preview statusem `success`.

`Verify Tindeq client view` run `32580870786` a `Project control` run `32580870814` skončily `success`.

## Další krok

1. Vyžádat explicitní souhlas uživatele k merge PR #22.
2. Po merge ověřit production Vercel deployment.
3. Na telefonu znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31` a zkusit save.
4. Očekávaný výsledek: UI `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam` a počet aktivních DB rows se nezvýší.
5. Potvrzený testovací duplicitní row nečistit bez samostatného explicitního schválení uživatele.

## Důležitý invariant

Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční datové mutace včetně odstranění testovací duplicity se provádějí pouze po explicitním schválení uživatele.
