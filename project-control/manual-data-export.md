# Manual data export / zaloha dat

Datum pripravy: 2026-07-07
Projekt: `knee.vankotraining.cz`
Repo: `vankotraining/vankotraining-knee`

## Nejjednodussi reseni

Primarni provozni reseni je rucni Supabase SQL export pres view `public.knee_data_export`.

Duvody:

- nezasahuje do funkcni aplikace,
- nepotrebuje automatizaci ani dalsi sluzbu,
- zahrne aktivni i archivovana data,
- jde spustit primo v Supabase SQL Editoru,
- vysledek jde stahnout jako jeden CSV soubor.

SQL je ulozene v `supabase/manual-data-export.sql`.

## Doplnkova raw zaloha

Pro kompletnejsi rucni zalohu raw tabulek je pripraveny jeste soubor:

- `project-control/supabase-manual-data-export.sql`

Ten vraci tri samostatne CSV exporty:

- klienti z `athletes`,
- profily z `athlete_profiles`,
- knee extension mereni z `knee_extension_tests`.

Tato varianta je vhodna, kdyz chces stahnout data po tabulkach a mit jiste, ze se neztrati klient bez mereni ani vice profilu jednoho klienta.

## Co primarni export obsahuje

Export vraci jeden radek na klienta a mereni. Pokud klient nema zadne mereni, zustane v exportu jeden radek s prazdnymi poli mereni.

Obsah:

- klient z `athletes`,
- posledni profil z `athlete_profiles`,
- knee extension mereni z `knee_extension_tests`,
- stav archivace klienta,
- stav archivace mereni,
- efektivni stav mereni, tedy jestli je aktivni, archivovane, nebo jen skryte kvuli archivovanemu klientovi,
- datum archivace,
- duvod archivace,
- kontext archivace,
- datum mereni,
- leva/prava sila kg,
- leva/prava Nm/kg,
- asymetrie,
- slabsi strana,
- vaha pri mereni,
- delka berce,
- vek pri mereni,
- poznamka.

## Jak spustit primarni export v Supabase

1. Otevri Supabase projekt pro `knee.vankotraining.cz`.
2. V levem menu otevri `SQL Editor`.
3. Vytvor novy query snippet.
4. Vloz obsah souboru `supabase/manual-data-export.sql`.
5. Klikni na `Run`.
6. Prvni cast vytvori nebo aktualizuje view `public.knee_data_export`.
7. Posledni `select * from public.knee_data_export ...` vypise data k exportu.
8. Vysledek stahni tlacitkem `Download CSV` / `Export CSV` v panelu vysledku.

Doporuceny nazev souboru:

- `knee-backup-YYYY-MM-DD.csv`

## Jak spustit raw export po tabulkach

1. Otevri Supabase projekt pro `knee.vankotraining.cz`.
2. Jdi do `SQL Editor` -> `New query`.
3. Otevri `project-control/supabase-manual-data-export.sql`.
4. Zkopiruj a spust vzdy jen jeden blok:
   - `EXPORT 1: clients`,
   - `EXPORT 2: profiles`,
   - `EXPORT 3: knee extension measurements`.
5. Kazdy vysledek stahni jako samostatny CSV.

Doporucene nazvy souboru:

- `knee_export_clients_YYYY-MM-DD.csv`
- `knee_export_profiles_YYYY-MM-DD.csv`
- `knee_export_measurements_YYYY-MM-DD.csv`

## Bezpecnost a provozni pravidlo

- SQL nedela fyzicke mazani dat.
- SQL neprepina archivaci ani obnovu.
- SQL nezasahuje do workflow aplikace.
- Primarni SQL pouze vytvari/aktualizuje exportni view a cte data.
- Raw export SQL obsahuje pouze `select` dotazy.
- CSV je zaloha osobnich/klientskych dat. Ukladat jen do bezpecneho uloziste.
- Po kazde vetsi praci s daty udelat rucni export.

## Rychla kontrola po exportu

Po stazeni CSV zkontroluj:

- jsou tam aktivni klienti,
- je tam alespon jeden archivovany klient, pokud v databazi existuje,
- jsou tam aktivni i archivovana mereni,
- u znamych testovacich hodnot sedi Nm/kg a asymetrie,
- archivovany klient ma `client_archive_status = archived`,
- archivovane mereni ma `measurement_archive_status = archived`,
- obnoveni klienta se po novem exportu projevi jako `client_archive_status = active`.
