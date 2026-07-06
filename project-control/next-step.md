# Next Step

## Priorita

Stabilizovat archivaci a obnovu dat.

## Cil

Archivace a obnova klientu i mereni musi zustat funkcne stejne, ale technicky se maji presunout z pomocnych DOM komponent do cistejsi React logiky.

## Proc ted

Aplikace uz funkcne splnuje hlavni pracovni workflow. Nejvetsi riziko neni chybejici funkce, ale krehkost soucasne implementace archivace:

- `ClientDeletion` cte vybraneho klienta z DOM.
- `ArchivedMeasurements` cte vybraneho klienta z DOM.
- `ButtonGuards` meni texty a blokuje tlacitka pres DOM observer.

To je pouzitelne jako rychla stabilizacni vrstva, ale neni to vhodny dlouhodoby zaklad.

## Pozadovana zmena

1. Vytvorit sdileny stav vybraneho klienta primo v hlavnim dashboardu.
2. Archivaci klienta presunout do hlavniho toku aplikace.
3. Archivovana mereni napojit pres stejne `selectedAthlete` data, ne pres DOM select.
4. Zachovat panel `Archiv klientu`.
5. Zachovat RPC volani:
   - `soft_delete_athlete`
   - `restore_athlete`
   - `list_archived_athletes`
   - `restore_knee_extension_test`
   - `list_archived_knee_extension_tests`
6. Odstranit nebo minimalizovat potrebu `ButtonGuards`.
7. Po zmene otestovat:
   - pridani mereni
   - editace mereni
   - archivace mereni
   - obnova mereni
   - archivace klienta
   - obnova klienta
   - mobilni zobrazeni

## Definice hotovo

- Uzivatel nepozna zmenu chovani UI k horsimu.
- Akce pro mereni nemuze omylem archivovat klienta.
- Akce pro klienta je vizualne a technicky oddelena od akci mereni.
- Kod je mene zavisly na DOM observerech.
- Build a lint projdou.

## Nasledujici krok po stabilizaci

Pridat jednoduchy export/zaloha dat z aplikace nebo pres Supabase view.
