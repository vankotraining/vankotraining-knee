# Next Step

## Aktuální fáze

PR #21 Android native Tindeq share je produkčně nasazený a ověřený. Následný kontrolovaný save/duplicate test ale odhalil skutečnou chybu: re-export stejného měření může dostat jiné legacy `tindeqSessionId` a obejít stávající duplicate lookup.

PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs` je otevřený na branchi `agent/tindeq-duplicate-feedback` a přidává semantic duplicate fallback nad persistovaným strukturovaným výsledkem.

## Ověřená evidence

- první save měření Rosová Štěpánka `14. 8. 2026 14:31` vytvořil očekávaný row;
- druhý import stejného měření vytvořil další aktivní row s jiným `tindeqSessionId`;
- read-only porovnání potvrdilo, že oba řádky jsou obsahově shodné kromě session ID;
- PR #22 na headu `584b10cac279905a2a0f58f0e42361362a7cedd5` prošel `124/124` unit testy, lint comparison, production build a TypeScript check;
- Preview deployment `dpl_D3JxpEErMCpbvehTLnCCrL3WEyN3` je `READY`;
- poslední CI selhalo pouze na project-control checkeru kvůli dříve přejmenovaným povinným sekcím; aktuální docs sync tento stav opravuje.

## Další krok

1. Nechat proběhnout fresh CI na aktuálním PR #22 headu a ověřit zelený Preview gate.
2. Bez explicitního souhlasu uživatele PR #22 nemergovat.
3. Po schválení a production deploymentu zopakovat stejný re-export/save test; očekávaný výsledek je `Měření již uloženo` a žádný nový DB row.
4. Potvrzený testovací duplicitní row v produkci nečistit bez samostatného explicitního schválení uživatele.

## Důležitý invariant

Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční datové mutace včetně odstranění testovací duplicity se provádějí pouze po explicitním schválení uživatele.
