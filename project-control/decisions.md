# Decisions

## 2026-07-05: Samostatny knee projekt

Rozhodnuti: `knee.vankotraining.cz` bude samostatne repo a samostatny Vercel
projekt.

Duvod: kod ma byt oddeleny od verejneho webu i treninkove aplikace. Sdilena
mohou byt jen klientska data nebo jina databazova vrstva, pokud to pozdeji
zjednodusi provoz.

Dusledky:

- Mensi riziko zmatku v deployi a domene.
- Jednodussi mentalni model: kazda domena ma vlastni projekt.
- Sdilene prvky se budou resit az ve chvili, kdy budou skutecne potreba.
