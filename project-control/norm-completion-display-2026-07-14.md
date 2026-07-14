# Zobrazeni splneni normy

Datum: 2026-07-14
Projekt: `knee.vankotraining.cz`
Repo: `vankotraining/vankotraining-knee`

## Zmena

- Polozka `Chybi %` byla v detailu leve a prave nohy odstranena.
- Procento se nove pocita jako `aktualni_sila_kg / cilova_sila_kg * 100`.
- Procento neni zastropovane na 100 %.
- Karta zachovava aktualni silu, Nm/kg, cilovou silu a absolutni rozdil v kg.
- Pod metrikami je jedna citelna veta se zvyraznenym procentem a rozdilem v kg.
- Pri chybejici nebo neplatne cilove sile ci aktualni sile se zobrazi `Splneni normy nelze vypocitat.`
- Norma 3,0 Nm/kg, vypocet cilove sily, asymetrie, Supabase a ostatni workflow zustaly beze zmeny.

## Overeni

- `npm run lint`
- `npm run build`
- cilova sila se pocita a pouziva v plne presnosti; v UI se zobrazuje na jedno desetinne misto
- raw cil `50.651 kg` se v UI zobrazi jako `50.7 kg`
- `42.9 / 50.651 * 100 = 84.7 %` po zaokrouhleni na jedno desetinne misto
- `37.5 / 50.651 * 100 = 74.0 %` po zaokrouhleni na jedno desetinne misto
- overena byla i hodnota nad 100 %: `108.4 %` a rozdil `4.2 kg`

## Stav projektu

Jde o prezentacni upravu hotoveho interniho MVP. Datovy model, autentizace, archivace a vypoctova pravidla mimo nove procento splneni normy nebyly meneny.

## CI vysledek

- Plny `npm run lint` byl spusten. Projekt ma znamy vychozi stav 3 chyb a 1 varovani v `ArchivedClients.tsx`, `ArchivedMeasurements.tsx` a v existujicim efektu `KneeDashboard.tsx`; tato mista nejsou soucasti zadane prezentacni upravy.
- Samostatny lint upraveneho `KneeDashboard.tsx` po vypnuti pouze uvedenych existujicich pravidel probehl uspesne bez nove chyby.
- `npm run build` probehl uspesne.
- Nove souhrnne procento a rozdil v kg pouzivaji ceskou desetinnou carku (`84,7 %`, `7,8 kg`).
