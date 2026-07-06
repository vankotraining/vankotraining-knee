# Next Step

## Priorita

Pridat jednoduchy export/zaloha dat a provozni dokumentaci.

## Proc ted

Hlavni aplikacni workflow uz funguje a je prakticky overeny:

- klienti,
- mereni,
- editace,
- archivace mereni,
- obnova mereni,
- archivace klienta,
- obnova klienta,
- mobilni pouziti.

Projekt se posunul ze stavby funkcniho MVP do faze provozni stabilizace. Nejvetsi zbyvajici riziko neni chybejici obrazovka, ale ztrata nebo obtizna obnova dat, nejasne migrace a regresni chyby pri dalsich upravach.

## Cil nejblizsiho kroku

Vytvorit minimalni, prakticky pouzitelnou datovou zalohu/export.

Preferovana varianta pro prvni verzi:

1. Pridat v aplikaci nebo v Supabase SQL jednoduchy export aktivnich dat:
   - klienti,
   - profily klientu,
   - knee extension testy,
   - informace o archivaci.
2. Pripravit SQL view nebo dokumentovany SQL dotaz pro export.
3. Zapsat postup do `project-control`.
4. Nezavadet slozitou automatizaci, dokud neni jasne, co presne budeme zalohovat.

## Definice hotovo

- Je jasne, jak ziskat zalohu dat.
- Export obsahuje aktivni i archivovane relevantni zaznamy.
- Postup je popsany tak, aby ho slo zopakovat rucne.
- Nezasahuje se do stavajicich funkcnich workflow.
- Aplikace po zmene dal buildi/lintuje.

## Nasledujici krok po exportu

1. Dopsat kratkou provozni dokumentaci:
   - env promenne,
   - Supabase migrace/RPC,
   - co zkontrolovat po deployi,
   - jak obnovit data.
2. Rozsirit smoke-testy z vypocetni logiky na nejdulezitejsi UI/regresni toky.
3. Odstranit legacy fallback anon key a nepouzivany `ButtonGuards`, pokud uz nebudou potreba.
