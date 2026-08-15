# Next Step

## Aktuální fáze

Draft PR #21 implementuje nativní Android příjem Tindeq ZIP přes systémové `Sdílet` bez serverového uploadu originálního archivu.

Kód, Android build, Android unit testy, web testy a Vercel Preview jsou připravené. Funkce zatím není produkčně nasazená ani produkčně ověřená.

## Aktuální blocker

Preview alias PR #21 je chráněný Vercel Authentication. Android Digital Asset Links potřebuje veřejně načíst přesný `/.well-known/assetlinks.json` bez Vercel login cookie nebo share-query bypassu.

Preferovaný postup je branch-specific Deployment Protection Exception pouze pro:

`vankotraining-knee-git-agent-tin-19838f-vankotrainings-projects.vercel.app`

Pokud současný Vercel plan tuto výjimku neumožňuje, případné dočasné vypnutí Preview Authentication pro celý projekt vyžaduje explicitní rozhodnutí uživatele, protože by zpřístupnilo i ostatní Preview deploymenty.

## Po odblokování Preview

1. ověřit veřejný HTTP 200 JSON na `/.well-known/assetlinks.json`;
2. nainstalovat finální preview APK artifact z workflow run `31911229864`;
3. provést reálný Android tok `Tindeq → Sdílet → Knee → automatický import`;
4. ověřit ruční výběr klienta a explicitní save;
5. ověřit duplicate protection a odmítnutí nepodporovaného souboru;
6. teprve po explicitním uživatelském acceptance rozhodnout o merge PR #21.

## Důležitý invariant

PR #21 se před real-device acceptance nemerguje. Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem.
