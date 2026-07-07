# Manual data export / zaloha dat

Datum pripravy: 2026-07-07

## Nejjednodussi reseni

Pouzivame rucni Supabase SQL export pres view `public.knee_data_export`.

Duvody:

- nezasahuje do funkcni aplikace,
- nepotrebuje automatizaci ani dalsi sluzbu,
- zahrne aktivni i archivovana data,
- jde spustit primo v Supabase SQL Editoru,
- vysledek jde stahnout jako CSV.

SQL je ulozene v `supabase/manual-data-export.sql`.

## Co export obsahuje

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

## Jak spustit v Supabase

1. Otevri Supabase projekt pro `knee.vankotraining.cz`.
2. V levem menu otevri `SQL Editor`.
3. Vytvor novy query snippet.
4. Vloz obsah souboru `supabase/manual-data-export.sql`.
5. Klikni na `Run`.
6. Prvni cast vytvori nebo aktualizuje view `public.knee_data_export`.
7. Posledni `select * from public.knee_data_export ...` vypise data k exportu.
8. Vysledek stahni tlacitkem `Download CSV` / `Export CSV` v panelu vysledku.

## Bezpecnost a provozni pravidlo

- SQL nedela fyzicke mazani dat.
- SQL neprepina archivaci ani obnovu.
- SQL pouze vytvari/aktualizuje exportni view a cte data.
- CSV je zaloha osobnich/klientskych dat. Ukladat jen do bezpecneho uloziste.
- Po kazde vetsi praci s daty udelat rucni export a soubor pojmenovat napr. `knee-backup-YYYY-MM-DD.csv`.

## Rychla kontrola po exportu

Po stazeni CSV zkontroluj:

- jsou tam aktivni klienti,
- je tam alespon jeden archivovany klient, pokud v databazi existuje,
- jsou tam aktivni i archivovana mereni,
- u znamych testovacich hodnot sedi Nm/kg a asymetrie,
- archivovany klient ma `client_archive_status = archived`,
- obnoveni klienta se po novem exportu projevi jako `client_archive_status = active`.
