# Project state

## Datum poslední kontroly

`2026-09-17` (Europe/Prague), po aplikaci produkční Knee asymmetry datové migrace a před final exact-head merge gate PR #25.

## Aktuální `main` commit

`de077dc688a45ee7124934eca63c7d626e213770` – `Close Tindeq duplicate cleanup gate`.

## Aktivní větev a PR

- branch: `fix/knee-asymmetry-percent-contract`;
- PR: `#25` `Fix knee asymmetry percentage-point contract`;
- app/test commit: `50bfe95`;
- migration/precheck commit: `f4335e0`;
- project-control structure/evidence commits následovaly po těchto technických commitech;
- user deployment approval: `2026-09-17` (`Dokonči nasazení`).

PR #25 zatím není merged.

## Produkční runtime commit

Aktuální aplikace na `knee.vankotraining.cz` stále běží na:

- commit: `de077dc688a45ee7124934eca63c7d626e213770`;
- deployment: `dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`;
- state: `READY`;
- target: `production`.

Kódová oprava PR #25 ještě není v produkčním runtime.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Produkční datová migrace PR #25 byla aplikována:

- migration history version: `20260917114606`;
- name: `knee_asymmetry_percent_points`;
- repo file: `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`.

Fresh precheck před zápisem potvrdil `100` legacy `google_sheet_import` kandidátů, `32` již kanonických `manual` řádků, `0` ambiguous a `0` invalid manual. Ověřený export pokrýval všech `132` měření; audit trigger/tabulka byly aktivní.

Post-check potvrdil:

- `google_sheet_import`: 100/100 canonical, 0 noncanonical, rozsah `0.18–81.50`;
- `manual`: 32/32 canonical, 0 noncanonical, rozsah `0.96–51.62`;
- `weaker_side` mismatches: 0;
- 100 auditních UPDATE záznamů pro migraci;
- `72.4 / 73.1 kg` zůstává `0.96`, `right`, force-derived `0.9576 %`.

Kanonický datový kontrakt je nyní:

`knee_extension_tests.asymmetry_pct = procentní body`.

## Aktuální fáze

Datová část rollout je produkčně aplikována a read-only ověřena. Zbývá dokončit kódový exact-head gate, merge PR #25 a Vercel production deployment.

PR #25 odstraňuje hodnotovou heuristiku `<= 1 -> * 100` z `getAsymmetryValue()` a exportních SQL. Sdílené formátování a klasifikace pracují pouze s procentními body.

Předchozí CI head `cc361c...` prokázal success pro dependency install, unit testy, lint comparison, production build a TypeScript check; jeho jediný failing krok byl project-control check kvůli nekorektní struktuře stavových dokumentů. Následné commity opravují právě project-control strukturu/evidence.

## Implementováno v `main`

PR #25 zatím není v `main`. `main` stále obsahuje starou UI heuristiku pro hodnoty `<=1`.

## Rozpracováno mimo `main`

Na PR #25 je implementováno:

- `getAsymmetryValue(0.96) -> 0.96`, nikoli `96`;
- `72.4 / 73.1 -> 0.957592... % -> 1.0 %` při jednom desetinném místě;
- regrese `42 / 35 -> 16.666... %` a `35 / 35 -> 0 %`;
- klasifikace `0.96 -> ok`, `10/20 -> warning`, `>20 -> problem`;
- jednotná interpretace v tabulce, detailu, mobilních kartách, klientském souhrnu a grafu;
- odstranění legacy hodnotové heuristiky z exportních SQL;
- fail-closed/idempotentní historická migrace a read-only checks.

## Nasazeno

Databázová migrace: **ano**.

Kód PR #25 do Vercel production: **ne**; čeká na final exact-head zelený CI/preview a merge.

## Produkčně ověřeno

Datová post-migration integrita: automatizovaně/read-only ověřena.

Opravené UI PR #25: **ne**. `Produkčně ověřeno` pro UI lze označit až po rollout a výslovném potvrzení uživatele.

## Známé problémy

- aktuální production runtime před merge PR #25 stále může zobrazit kanonickou sub-1% asymetrii násobenou 100;
- full-repo lint baseline obsahuje existující problémy a PR gate proto používá comparison vůči `main`;
- Supabase security/performance advisors obsahují existující baseline mimo scope PR #25; datová migrace nevytvořila nový schema objekt ani nezměnila RLS/grants/indexy.

## Další krok

- Dokončit final exact-head PR #25 CI/preview, merge s expected SHA, ověřit Vercel production deployment a technicky zkontrolovat `72.4 / 73.1 -> 1.0 %`; manuální produkční acceptance pak vyžaduje explicitní potvrzení uživatele.
