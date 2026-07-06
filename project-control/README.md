# Project Control

Ridici slozka pro projekt `knee.vankotraining.cz`.

## Aktualni stav k 2026-07-06

Projekt je ve fazi funkcniho interniho MVP. Aplikace je nasazena na produkcni domene a je prakticky pouzitelna pro evidenci knee extension mereni.

Odhad dokonceni:

- Interni pracovni nastroj: 90 %
- Dlouhodobe udrzovatelny produkt: 78 %
- Celkove MVP: 88 %

## Aktualni rozhodnuti

- Kod knee projektu je v samostatnem repozitari `vankotraining/vankotraining-knee`.
- Projekt je oddeleny od `vankotraining.cz` a `app.vankotraining.cz`.
- Produkcni domena je `knee.vankotraining.cz`.
- Stack je Next.js + Supabase.
- Data klientu mohou byt ve sdilene Supabase databazi, ale kod aplikaci se nemicha.
- Mazani mereni a klientu je resene jako archivace/soft delete, ne fyzicke smazani.

## Hotovo

- Supabase je napojena a data se zobrazuji.
- Prihlaseni pres Supabase funguje.
- Seznam aktivnich klientu funguje.
- Detail klienta a knee extension testy funguji.
- Pridani noveho klienta funguje.
- Pridani noveho mereni funguje.
- Editace probehleho mereni funguje.
- Archivace mereni funguje.
- Obnova archivovaneho mereni funguje.
- Archivace celeho klienta funguje.
- Obnova archivovaneho klienta funguje.
- Panel `Archiv klientu` je na webu a prakticky overen.
- Mobilni pouzitelnost je vyrazne lepsi nez prvni verze.
- Graf ukazuje levou, pravou a asymetrii s moznosti skryt jednotlive serie.

## Aktualni technicky dluh

- Cast archivace a obnovy je napojena pres samostatne pomocne komponenty kolem hlavniho dashboardu.
- `ArchivedMeasurements`, `ClientDeletion` a `ButtonGuards` pouzivaji DOM pozorovani misto sdileneho React stavu.
- Migrace jsou historicky spoustene casto rucne pres Supabase SQL editor.
- Chybi jednoduchy export/zaloha dat.
- Chybi kratka provozni dokumentace pro obnovu, migrace a kontrolu produkce.
- Chybi automaticke testy.

## Hranice projektu

| Oblast | Patri sem | Nepatri sem |
| --- | --- | --- |
| Knee extension evidence | Ano | Obecny osobni web |
| Tindeq/knee mereni | Ano | Kompletni treninkovy builder |
| Klienti pro knee workflow | Ano | Plna CRM sprava klientu |
| Archivace a obnova knee dat | Ano | Marketing hlavniho webu |
| Graf progresu a porovnani | Ano | Obecna databaze vsech cviku |

## Domenu drzime takto

```mermaid
flowchart TD
    A["vankotraining.cz"] --> B["Verejny osobni web"]
    A --> C["app.vankotraining.cz"]
    A --> D["knee.vankotraining.cz"]
    C --> E["Treninkova aplikace"]
    D --> F["Knee aplikace"]
```

## Nejblizsi priorita

1. Stabilizovat architekturu archivace a obnovy.
2. Presunout logiku archivace klientu/mereni z pomocnych DOM komponent do hlavni React logiky.
3. Zachovat stavajici funkcnost beze zmen chovani pro uzivatele.
4. Po stabilizaci pridat jednoduchy export/zaloha dat.

## Pravidlo pro dalsi vyvoj

Nepridavat dalsi funkce, dokud nebude archivace a obnova technicky uklizena. Aplikace uz funkcne staci na praci; dalsi hodnota ted lezi ve spolehlivosti a udrzitelnosti.
