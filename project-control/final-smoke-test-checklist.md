# Finalni smoke-test checklist interniho MVP

Datum pripravy: 2026-07-07
Projekt: `knee.vankotraining.cz`
Repo: `vankotraining/vankotraining-knee`

## Cil testu

Cilem neni pridavat dalsi funkce ani hledat nekonecna vylepseni. Cilem je potvrdit, ze aplikace je prakticky pouzitelna jako interni pracovni MVP hlavne na telefonu.

Test se dela primo na produkci `knee.vankotraining.cz`.

## Vysledek pripravy checklistu

Stav po priprave: aplikace je podle dosavadnich overeni pripravena na finalni rucni akceptacni pruchod.

Verdikt pro MVP:

- Pokud vsechny kriticke body nize projdou jako PASS, interni MVP muze byt oznacene jako provozne hotove.
- Drobne vizualni nebo komfortni poznamky neblokujou uzavreni MVP, pokud nebrani bezne praci v telefonu.
- Nove napady patri do v2 backlogu az po uzavreni interniho MVP.

## Testovaci data

Doporucene hodnoty pro rychle overeni vypoctu:

| Pole | Hodnota |
| --- | --- |
| Testovaci klient | `Smoke Test 2026-07-07` |
| Vaha | `82` kg |
| Delka berce | `33` cm |
| Leva sila | `35` kg |
| Prava sila | `42` kg |
| Ocekavana leva | cca `1.38` Nm/kg |
| Ocekavana prava | cca `1.66` Nm/kg |
| Ocekavana asymetrie | cca `16.7 %` |

## Kratky smoke-test checklist

| Oblast | Co overit | Stav |
| --- | --- | --- |
| Prihlaseni | Magic link / prihlaseni pusti do aplikace | TODO |
| Aktivni klienti | Zobrazi se seznam aktivnich klientu | TODO |
| Vyber klienta | Detail klienta se otevira a ukazuje mereni/graf | TODO |
| Pridani klienta | Jde vytvorit testovaci klient | TODO |
| Pridani mereni | Jde pridat knee extension mereni k vybranemu klientovi | TODO |
| Vypocty | Nm/kg a asymetrie sedi na testovacich hodnotach | TODO |
| Editace mereni | Jde upravit datum, vahu, levou a pravou silu | TODO |
| Archivace mereni | Archivace skryje jen mereni, klient zustane aktivni | TODO |
| Obnova mereni | Archivovane mereni jde obnovit do detailu klienta | TODO |
| Archivace klienta | Archivace skryje klienta z aktivniho seznamu | TODO |
| Archiv klientu | Archivovany klient je videt v panelu `Archiv klientu` | TODO |
| Obnova klienta | Obnova vrati klienta do aktivniho seznamu | TODO |
| Export | CSV export `knee-backup-YYYY-MM-DD.csv` jde vytvorit a dava smysl | TODO |
| Mobil | Workflow jde projit na telefonu bez blokujiciho prekryti nebo zadrhelu | TODO |

## Rucni testovaci scenar

1. Otevri `knee.vankotraining.cz` na telefonu.
2. Prihlas se.
3. Zkontroluj, ze vidis seznam aktivnich klientu.
4. Vyber existujiciho klienta a over, ze detail a graf davaji smysl.
5. Pridej klienta `Smoke Test 2026-07-07`.
6. Otevri noveho klienta.
7. Pridej mereni s hodnotami: vaha `82`, delka berce `33`, leva `35`, prava `42`.
8. Over vypocet: leva cca `1.38` Nm/kg, prava cca `1.66` Nm/kg, asymetrie cca `16.7 %`.
9. Uprav hotove mereni: zmen datum nebo jednu silovou hodnotu a uloz.
10. Archivuj jen toto mereni.
11. Over, ze klient zustal v aktivnim seznamu.
12. Otevri archiv mereni u klienta a obnov mereni.
13. Archivuj celeho klienta `Smoke Test 2026-07-07`.
14. Over, ze zmizel z aktivniho seznamu.
15. Otevri panel `Archiv klientu`.
16. Over, ze je tam `Smoke Test 2026-07-07`.
17. Obnov klienta.
18. Over, ze se vratil do aktivniho seznamu.
19. Projdi jeste jednou hlavni mobilni workflow: vyber klienta, detail, pridani mereni, editace, archiv panel.
20. V Supabase spust export podle `project-control/manual-data-export.md` a stahni CSV.
21. Zkontroluj, ze export obsahuje aktivni i archivovana data a asymetrie je v procentech.

## Co blokuje uzavreni MVP

Blokujici problem je jen takovy, ktery brani bezne praci:

- nejde se prihlasit,
- nejdou nacist aktivni klienti,
- nejde pridat klient nebo mereni,
- editace mereni neuklada zmeny,
- archivace mereni archivuje celeho klienta,
- archivovany klient zustava v aktivnim seznamu i po reloadu,
- obnova klienta nebo mereni nefunguje,
- export nejde vytvorit nebo ma zjevne spatne hodnoty,
- mobilni zobrazeni brani dokonceni hlavniho workflow.

## Co neblokuje uzavreni MVP

Tyto veci patri do pozdejsi faze, pokud hlavni workflow funguje:

- drobne textove upravy,
- kosmetika grafu,
- lepsi interpretacni karta klienta,
- tisk reportu,
- automatizovane zalohy,
- rozsahlejsi klinicke nebo treninkove funkce,
- dalsi typy testu mimo knee extension.

## Navazujici posledni krok

Po rucnim pruchodu checklistu:

1. Zapsat realny vysledek PASS/FAIL do `project-control`.
2. Pokud nejsou blokujici problemy, oznacit interni MVP jako hotove.
3. Aktualizovat hlavni `project-control/README.md` z faze finalni stabilizace na fazi uzavrene interni MVP.
4. Presunout vsechny nove napady do v2, ne do dokoncovani MVP.
