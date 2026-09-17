# Project state

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), během rollout gate PR #25 pro sjednocení jednotky Knee asymetrie.

## Aktuální `main` commit

`de077dc688a45ee7124934eca63c7d626e213770` – `Close Tindeq duplicate cleanup gate`.

## Aktivní větev a PR

- branch: `fix/knee-asymmetry-percent-contract`;
- draft PR: `#25` `Fix knee asymmetry percentage-point contract`;
- aktuální head před tímto project-control fixem: `cc361c5502d521185301fbcd67a200029dfb6004`;
- app/test commit: `50bfe95`;
- migration/precheck commit: `f4335e0`;
- project-control evidence: `project-control/knee-asymmetry-percent-points-2026-09-17.md`.

Uživatel dne `2026-09-17` výslovně požádal dokončit nasazení, což otevírá dříve blokovaný produkční DB/merge gate za podmínky fresh prechecku a ostatních bezpečnostních kontrol.

## Produkční runtime commit

Produkce stále běží na `main@de077dc688a45ee7124934eca63c7d626e213770`:

- deployment: `dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`;
- state: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Migrace `20260917_knee_asymmetry_percent_points.sql` je připravená ve větvi, ale v okamžiku tohoto záznamu ještě nebyla aplikována. Fresh read-only audit před rolloutem musí znovu potvrdit očekávaných 100 jednoznačných legacy kandidátů a 0 nejednoznačných řádků.

Nový datový kontrakt PR #25 je:

`knee_extension_tests.asymmetry_pct = procentní body`.

## Aktuální fáze

PR #25 odstraňuje hodnotovou heuristiku `<= 1 -> * 100` z Knee UI a exportních SQL a canonicalizuje historické `google_sheet_import` řádky podle sil. Produkční případ `72.4 / 73.1 kg` je správně uložen jako `0.96`; očekávané zobrazení po rollout je `1.0 %`.

Předchozí produkční audit všech 132 řádků potvrdil:

- `google_sheet_import`: 100 řádků, všech 100 legacy fraction convention;
- `manual`: 32 řádků, všech 32 již procentní body, z toho 5 archivovaných;
- ambiguous: 0;
- `weaker_side` mismatch: 0.

CI na headu `cc361c...` potvrdilo unit testy, lint comparison, production build a TypeScript check jako success; selhal pouze project-control check kvůli nekorektním názvům/struktuře sekcí tohoto souboru. Tento commit opravuje právě tuto dokumentační regresi.

## Implementováno v `main`

PR #25 zatím není v `main`. Poslední Knee runtime před PR #25 stále používá hodnotovou heuristiku a proto může sub-1% manuální asymetrii zobrazit chybně.

## Rozpracováno mimo `main`

Na `fix/knee-asymmetry-percent-contract` je implementováno:

- kanonické čtení `asymmetry_pct` jako procentních bodů bez násobení podle velikosti;
- sdílené formátování a klasifikace asymetrie;
- regrese `72.4 / 73.1 -> 0.957592... % -> 1.0 %`;
- testy `42 / 35`, `35 / 35`, `getAsymmetryValue(0.96)`, prahy 10/20 %;
- fail-closed idempotentní datová migrace;
- read-only precheck a post-check;
- odstranění legacy fallbacku z exportních SQL.

## Nasazeno

PR #25 zatím není produkčně nasazen. Preview a finální exact-head CI se ověřují v rollout gate před merge.

## Produkčně ověřeno

PR #25 zatím není produkčně ověřen. Tento stav lze označit až po produkčním rollout a výslovném uživatelském potvrzení výsledku v UI.

## Známé problémy

- full-repo lint baseline obsahuje dříve evidované problémy; PR gate používá comparison vůči aktuálnímu `main`;
- lokální Windows `npm ci` v jednom pomocném prostředí selhal na environmentálním `ENOTEMPTY`; GitHub CI na exact headu instalaci, unit testy, lint comparison, build a TypeScript check úspěšně provedlo;
- dokud není PR #25 nasazen, produkční UI může u manuální asymetrie pod 1 % stále zobrazit hodnotu násobenou 100.

## Další krok

- Dokončit schválený PR #25 rollout: fresh DB precheck a backup/export evidence, aplikace migrace + post-check, zelený exact-head CI/preview, merge, produkční deployment a technická kontrola; produkční UI acceptance následně vyžaduje explicitní potvrzení uživatele.
