## Rozsah

- [ ] Popsal/a jsem cíl změny.
- [ ] Popsal/a jsem explicitní non-scope.
- [ ] Změna neobsahuje nesouvisející runtime, databázové nebo konfigurační úpravy.

## Databázové změny

- [ ] Bez databázové změny.
- [ ] Nebo: je uveden přesný migrační soubor, cílový projekt, rollback/obnova a stav `navrženo` / `databáze aplikována`.
- [ ] Produkční data nebyla změněna bez explicitního schválení.

## Ověřený commit

- Přesný commit: ``
- [ ] Uvedené testy a deploymenty patří tomuto přesnému commitu.

## Testy

- [ ] `npm run project:check`
- [ ] Relevantní unit/integration/E2E testy
- [ ] Lint nebo zdokumentovaný nezměněný baseline
- [ ] Build, pokud změna může ovlivnit runtime
- Výsledek / odkaz:

## Preview

- [ ] Není potřeba, protože změna neovlivňuje runtime.
- [ ] Nebo: exact-commit preview je `READY`.
- Deployment ID / commit:
- Provedené smoke testy:

## Produkce

- [ ] Produkce se tímto PR nemění.
- [ ] Nebo: produkčně nasazeno na uvedeném commitu.
- [ ] Produkčně ověřeno pouze po výslovném uživatelském potvrzení.
- Deployment ID / commit:
- Rozsah uživatelského ověření:

## Zdroje pravdy

- [ ] `PROJECT_SPEC.md` odpovídá rozsahu, pokud se změnil produktový záměr.
- [ ] `PROJECT_STATE.md` odpovídá skutečnému stavu `main`, větví, PR a databáze.
- [ ] `PRODUCTION_STATUS.md` odpovídá skutečnému produkčnímu runtime.
- [ ] Stabilní rozhodnutí mají ADR.
- [ ] Feature dokument je označen jako evidence, nikoli aktuální stav.

## Známá omezení

- Uveď známá omezení, neověřené předpoklady a následný konkrétní krok:
