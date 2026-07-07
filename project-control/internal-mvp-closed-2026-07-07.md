# Uzavreni interniho MVP

Datum uzavreni: 2026-07-07
Projekt: `knee.vankotraining.cz`
Repo: `vankotraining/vankotraining-knee`

## Verdikt

Interni MVP je provozne hotove.

Aplikace je pouzitelna jako interni pracovni nastroj pro evidenci knee extension testu, hlavne v mobilnim workflow. Finalni rucni smoke-test probehl uspesne bez blokujici chyby.

## Stav po finalnim smoke-testu

| Oblast | Vysledek |
| --- | --- |
| Prihlaseni | PASS |
| Aktivni klienti | PASS |
| Vyber klienta a detail | PASS |
| Pridani klienta | PASS |
| Pridani mereni | PASS |
| Vypocty Nm/kg a asymetrie | PASS |
| Editace mereni | PASS |
| Archivace mereni | PASS |
| Obnova mereni | PASS |
| Archivace klienta | PASS |
| Archiv klientu | PASS |
| Obnova klienta | PASS |
| Export / zaloha dat | PASS |
| Mobilni pouzitelnost | PASS |

## Overene testovaci hodnoty

Finalni kontrola vypoctu probehla s hodnotami:

| Pole | Hodnota |
| --- | --- |
| Vaha | `82.0 kg` |
| Delka berce | `33.0 cm` |
| Leva sila | `35 kg` |
| Prava sila | `42 kg` |
| Leva | `1.38 Nm/kg` |
| Prava | `1.66 Nm/kg` |
| Asymetrie | `16.7 %` |
| Slabsi strana | leva |
| Chybi do normy | `54.0 %`, cca `41.0 kg` na slabsi strane |

Tyto hodnoty odpovidaji ocekavanemu smoke-testu.

## Finalni stav projektu

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
- Archivovany klient mizi z aktivniho seznamu.
- Archivovany klient je dostupny v panelu `Archiv klientu`.
- Obnova klienta funguje.
- Obnoveny klient se vraci do aktivniho seznamu.
- Mobilni workflow je prakticky pouzitelne.
- Manualni export / zaloha dat je pripravena a overena.
- Hlavni export `knee-backup-2026-07-07.csv` byl zkontrolovan a je pouzitelny.
- Raw export mereni byl opraven, asymetrie je v procentech.

## Stav dokonceni

| Pohled | Stav |
| --- | --- |
| Interni pracovni nastroj | 100 % |
| Celkove MVP | 100 % pro interni pouziti |
| Dlouhodobe udrzitelny produkt | cca 91-92 % |

Poznamka: dlouhodoba udrzitelnost neni 100 %, protoze veci jako automatizovane zalohy, rozsahlejsi automatizovane testy, interpretacni karta klienta nebo tisk reportu patri az do dalsi faze.

## Hranice po uzavreni MVP

Od tohoto bodu se projekt nepovazuje za rozpracovane MVP, ale za hotovy interni nastroj.

Dalsi prace se deli na:

1. Provozni udrzbu: opravy realnych chyb, exporty, zalohy, nutne bezpecnostni upravy.
2. V2 backlog: nove funkce, komfortni vylepseni, interpretace vysledku, tisk, automatizace.

Do MVP uz nepridavat nove produktove funkce jen proto, ze jsou napady po ruce.

## Doporučeny dalsi krok

Projekt uzavrit jako interni MVP a zacit pouzivat v realnem provozu. Po nekolika realnych merenich sbirat jen konkretni poznamky z praxe a az potom rozhodnout o v2.
