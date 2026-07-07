# Stav projektu - data export a provozni zaloha

Datum: 2026-07-07
Projekt: `knee.vankotraining.cz`

## Aktualni stav

Projekt je overene interni MVP.

Odhad dokonceni:

- interni pracovni nastroj: 97 %
- dlouhodobe udrzitelny produkt: 90 %
- celkove MVP: 96 %

## Hotovo v teto fazi

- Supabase je napojena.
- Prihlaseni funguje.
- Aktivni klienti se zobrazuji.
- Detail klienta a knee extension testy funguji.
- Pridani klienta funguje.
- Pridani mereni funguje.
- Editace mereni funguje.
- Archivace mereni funguje.
- Obnova mereni funguje.
- Archivace klienta funguje.
- Archivovany klient mizi ze seznamu aktivnich klientu.
- Archivovany klient je dostupny v panelu Archiv klientu.
- Obnova klienta funguje.
- Obnoveny klient se vraci do aktivniho seznamu.
- Mobilni workflow je pouzitelne.
- Manualni export / zaloha dat je pripravena.

## Export / zaloha dat

Primarni cesta:

- `supabase/manual-data-export.sql`
- vytvari nebo aktualizuje view `public.knee_data_export`,
- nasledny `select` lze stahnout jako jeden CSV soubor.

Doplnkova raw cesta:

- `project-control/supabase-manual-data-export.sql`
- obsahuje tri read-only exporty:
  - klienti,
  - profily,
  - knee extension mereni.

Navod:

- `project-control/manual-data-export.md`

## Co zatim neni potreba delat

- Nezavadet automaticke zalohy.
- Nezasahovat do UI aplikace.
- Nepridavat dalsi workflow, dokud neni rucni export prakticky overeny.

## Rucni test pred uzavrenim faze

1. V Supabase otevrit SQL Editor.
2. Spustit `supabase/manual-data-export.sql`.
3. Stahnout vysledek jako CSV.
4. Zkontrolovat aktivniho klienta a aktivni mereni.
5. Zkontrolovat archivovaneho klienta, pokud v databazi existuje.
6. Zkontrolovat archivovane mereni, pokud v databazi existuje.
7. Overit, ze hodnoty kg, Nm/kg, asymetrie a slabsi strana sedi s aplikaci.
8. Volitelne spustit i raw export z `project-control/supabase-manual-data-export.sql` a stahnout tri CSV soubory.

## Dalsi logicky krok

Po overeni exportu uzavrit MVP jako provozne pouzitelny interni nastroj. Pak delat uz jen male stabilizacni upravy podle realneho pouzivani, ne nekonecne vylepsovani.
