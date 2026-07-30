# Mobilni zobrazeni splneni normy

Datum implementace: 2026-07-30
Projekt: `knee.vankotraining.cz`
Vychozi commit `main`: `33a03448b33ad23070c3ea5a4d7625fac59619df`

## Co bylo zmeneno

- Sdilena funkce `getNormGap()` nove vraci `completionPct` pro skutecne slabsi nohu podle hodnoty Nm/kg.
- Mobilni kompaktni souhrn uz nepouziva `Chybi`; zobrazuje `Splnění` a procento splneni normy slabsi nohou.
- Mobilni panel `Porovnani` uz nepouziva `Chybi do normy`; pouziva stejne oznaceni `Splnění` a stejny vyznam procenta.
- Existujici udaj v kg zustal v porovnavacim panelu zachovany.
- Desetinna procenta a kg v techto normovych vystupech pouzivaji ceskou desetinnou carku.
- Databazove schema, Supabase data, autentizace, archivace, asymetrie a norma `3,0 Nm/kg` nebyly meneny.

## Vypocet

Procento se pocita presne jako:

`completionPct = weakerNmPerKg / NORM_NM_PER_KG * 100`

Hodnota neni zastropovana na 100 %. Slabsi noha se vybira podle nizsi hodnoty Nm/kg; kg udaj se bere ze stejne nohy.

Chybejici, nekladne nebo ne-konecne vstupy vraceji nevypocitatelnou hodnotu. UI proto nepodava `NaN %` ani `Infinity %`.

## Regresni testy

Automatizovane testy v `src/lib/knee-metrics.test.ts` overuji:

- splneni pod 100 % (`80 %`),
- presne `100 %`,
- splneni nad 100 % (`108,4 %`),
- ze vysledek nad 100 % neni zastropovany,
- vyber skutecne slabsi nohy podle Nm/kg a prirazeni jeji kg hodnoty,
- chybejici, ne-konecne, nulove a zaporne vstupy.

## Technicke overeni

- `npm test`: PASS.
- `npm run lint`: znamy vychozi stav zustal beze zmeny (exit code `1`, 3 chyby, 1 varovani; `src/app/components/ArchivedClients.tsx`, `src/app/components/ArchivedMeasurements.tsx`, `src/app/components/KneeDashboard.tsx`). Zmena nepridala novy lint problem.
- `npm run build`: PASS.

## Stav

- Implementovano: ano.
- Nasazeno: v tomto zaznamu nepotvrzeno; samotny commit neni dukaz produkcniho deploymentu.
- Produkcne overeno: ne; vyzaduje vyslovne potvrzeni uzivatele.

## Co zbyva produkcne overit

V mobilnim zobrazeni na `knee.vankotraining.cz` rucne overit:

- kompaktni souhrn ukazuje `Splnění X %`,
- panel `Porovnani` ukazuje stejny vyznam procenta,
- pod normou se zobrazi napr. `80,0 %`,
- presne na norme se zobrazi `100,0 %`,
- nad normou se zobrazi napr. `108,4 %`,
- pri chybejicich nebo neplatnych datech se zobrazi existujici prazdna hodnota, ne `NaN %` ani `Infinity %`,
- zachovany kg udaj odpovida slabsi noze.
