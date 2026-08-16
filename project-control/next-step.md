# Next Step

## Aktuální fáze

Draft PR #21 implementuje nativní Android příjem jednoho Tindeq ZIP přes systémové `Sdílet` bez serverového uploadu originálního archivu.

Real-device Preview gate na Android telefonu už prokázal celý technický tok:

`Tindeq ACTION_SEND → app-private cache → Chrome/TWA MessagePort → SHA-256 → existující Tindeq parser → zobrazená analýza`.

Normální `ShareReceiverActivity` je nyní systémový `ACTION_SEND` receiver. Dočasné diagnostické Activity/UI byly po úspěšném gate odstraněny. Funkce stále není v `main`, není produkčně nasazená a PR #21 zůstává draft.

## Ověřené invarianty

- skutečný Tindeq ZIP byl na telefonu přenesen přes lokální TWA `postMessage` kanál a existující parser jej přijal;
- Vercel runtime log v době real-ZIP testu neukázal žádný POST/upload request;
- share import nevolá automatické uložení do Supabase;
- klient se nadále vybírá explicitně;
- Android dočasnou kopii maže po webovém `ack`; bez `ack` zůstává pouze lokálně do TTL cleanupu;
- žádný serverový ZIP endpoint nebyl přidán.

## Nejbližší manuální gate

Po sestavení a připnutí finálního stabilizačního Preview APK:

1. nainstalovat přesně APK, jehož fingerprint je publikovaný v Preview `/.well-known/assetlinks.json`;
2. otevřít Knee a ponechat jej běžet;
3. sdílet **druhý platný skutečný Tindeq ZIP** přes `Tindeq → Sdílet → Knee`;
4. ověřit, že se bez diagnostické obrazovky automaticky zobrazí správná analýza;
5. nic neukládat do Supabase, pokud účelem testu není explicitně ověřit save;
6. zopakovat share při již otevřeném Knee, aby se ověřil `singleTask/onNewIntent` tok;
7. ověřit Vercel runtime log: žádný POST/upload ZIPu.

Po tomto gate zbývá před merge zejména odmítnutí nepodporovaného souboru, duplicate protection při explicitním save a rozhodnutí o produkčním Android signing/distribuci.

## Důležitý invariant

PR #21 se nemerguje bez explicitního uživatelského schválení. Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem.
