# Next Step

## Aktuální fáze

Knee asymmetry PR #25 je mergovaný, databázově canonicalizovaný a technicky produkčně nasazený.

- runtime merge commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- production deployment: `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`;
- deployment state: `READY`;
- production alias: `knee.vankotraining.cz`;
- produkční root: HTTP 200;
- DB migration: `20260917114606 knee_asymmetry_percent_points`;
- všech 132 Knee measurement rows nyní používá `asymmetry_pct` jako procentní body;
- final exact-head CI i Preview: success / READY.

## Produkční data

- 100 historických `google_sheet_import` řádků bylo canonicalizováno z legacy fraction konvence na force-derived procentní body;
- 32 `manual` řádků nebylo jednotkově změněno, včetně 5 archivovaných;
- ambiguous rows: 0;
- `weaker_side` mismatches: 0;
- kontrolní případ `72.4 / 73.1 kg` zůstává uložen jako `0.96 %`, slabší pravá strana.

## Další krok

Ručně v přihlášené produkci ověřit kontrolní měření `72.4 / 73.1 kg`: zobrazení musí být přibližně `1.0 %` a konzistentní v tabulce, detailu, mobilní kartě, klientském souhrnu a grafu; po explicitním potvrzení lze PR #25 označit jako produkčně ověřený.

## Důležitý invariant

`knee_extension_tests.asymmetry_pct` znamená výhradně procentní body. Aplikační ani exportní kód nesmí jednotku odvozovat z velikosti hodnoty.
