# Project control

Tento soubor je pouze rozcestník. Aktuální backlog ani průběžný stav se sem nezapisují.

## Mapa autoritativních zdrojů

| Otázka | Autoritativní zdroj |
| --- | --- |
| Co a proč stavíme, rozsah a non-goals | [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) |
| Aktuální stav `main`, větví, PR a databáze | [`PROJECT_STATE.md`](./PROJECT_STATE.md) |
| Skutečný produkční deployment a jeho ověření | [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md) |
| Stabilní architektonická a datová rozhodnutí | [`decisions/`](./decisions/) |
| Provoz, incidenty, migrace a zálohy | [`operations.md`](./operations.md) |
| Historické implementační a ověřovací důkazy | Ostatní datované a feature dokumenty v této složce |

## Hierarchie při rozporu

1. produkční runtime a produkční data,
2. aktuální kód a databázové schéma,
3. testy spuštěné nad přesným commitem,
4. projektové stavové dokumenty,
5. zadání,
6. staré prompty a chaty.

Historický dokument nikdy nepřebíjí novější skutečný artefakt. Vercel stav `READY` dokládá pouze deployment, nikoli produkční ověření.

## Stavová terminologie

Používej pouze tyto úrovně:

- **navrženo** – existuje návrh, ale ne implementace;
- **implementováno ve větvi** – změna existuje mimo `main`;
- **implementováno v `main`** – změna je dosažitelná z aktuálního `main`;
- **automatizovaně otestováno** – existuje úspěšný test nad uvedeným přesným commitem;
- **databáze aplikována** – změna je doložena skutečným schématem nebo historií migrací cílové databáze;
- **preview nasazeno** – Vercel preview je `READY` a metadata odpovídají uvedenému commitu;
- **produkčně nasazeno** – produkční alias ukazuje na `READY` deployment uvedeného commitu;
- **produkčně ověřeno** – uživatel výslovně potvrdil ruční kontrolu konkrétního rozsahu na produkci.

Samostatné tvrzení „hotovo“ nepoužívej.

## Pravidlo aktualizace

Každá změna, která mění stav projektu nebo produkce, musí aktualizovat příslušný kanonický dokument ve stejném PR. Feature dokumenty mohou uchovávat detailní důkazy, ale musí odkazovat na `PROJECT_STATE.md` a `PRODUCTION_STATUS.md`.
