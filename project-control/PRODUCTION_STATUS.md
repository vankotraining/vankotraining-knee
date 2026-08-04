# Production status

## Datum poslední kontroly

`2026-08-04 10:04 CEST` (Europe/Prague).

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`

Vercel team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

`dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`

## Nasazený commit

`71d6b1f0e67c571c71a53db6248e526704bddabe` z větve `main`.

## Čas a výsledek deploymentu

- vytvořen: `2026-08-02 11:47:52 CEST`;
- READY: `2026-08-02 11:48:50 CEST`;
- target: `production`;
- stav: `READY`;
- aliasy: `knee.vankotraining.cz`, `vankotraining-knee.vercel.app` a kanonické main aliasy;
- alias error: žádný.

`READY` znamená pouze produkčně nasazeno, nikoli produkčně ověřeno.

## Databázové migrace použité produkční aplikací

Supabase projekt: `zxvndqicslyulrinbpyn` (sdílený projekt).

Aktuální záznamy v historii migrací při kontrole:

- `20260710075659 allow_authenticated_taxonomy_reads`;
- `20260710085333 add_exercise_families_taxonomy`;
- `20260710085357 assign_certain_exercise_families`;
- `20260710094029 resolve_remaining_exercise_families`;
- `20260710095344 add_workout_items_editor_support`;
- `20260710095416 restrict_workout_item_editor_functions`;
- `20260802124337 tindeq_sessions`.

Relevantní databázový audit `2026-08-04`:

- PostgreSQL `17.6`;
- `public.athletes`: `66` aktivních klientů;
- `public.tindeq_sessions`: `0` celkových a `0` aktivních řádků;
- RLS na `public.tindeq_sessions`: zapnuto;
- tabulka obsahuje vazbu na klienta, normalizované souhrny, auditní sloupce a soft delete;
- produkční schéma neobsahuje dodatečné klientské/fingerprint sloupce z ukončeného PR #15.

Historické Knee SQL změny nejsou kompletně mapovatelné na uvedenou Supabase migrační historii; část byla dříve aplikována manuálně. Proto nelze tvrdit úplnou shodu všech produkčních databázových změn s repo migracemi.

## Provedené smoke testy

Anonymní kontrola `2026-08-04 10:04 CEST`:

- GET `/`: HTTP `200 OK`;
- odpověď obsahovala titul `Knee Data | Vanko Training`;
- vykreslila přihlašovací obrazovku `Přihlášení trenéra`;
- odpověď neobsahovala Next.js error stránku;
- Vercel odpověděl z produkčního aliasu bez redirect nebo access chyby.

Nebylo provedeno přihlášení, čtení klientských dat, zápis, archivace, obnova ani export. Smoke test neměnil produkční data.

## Poslední výslovné uživatelské produkční ověření

`2026-07-30`: uživatel výslovně potvrdil mobilní zobrazení splnění normy jako v pořádku. Rozsah důkazu je omezen na tuto funkci a implementační commit `1de66ddf343c5f0b58a748f0c2c45cca0af51c73`.

Pro současný runtime commit jako celek ani pro UI polish v2 není novější výslovné uživatelské produkční ověření doloženo.

## Produkční stav Tindeq

- databáze aplikována: tabulka `public.tindeq_sessions` existuje;
- Tindeq runtime z draft PR #12 není v produkčním `main`;
- žádná produkční Tindeq data nejsou uložena;
- exact-head preview PR #12 není důkazem produkčního nasazení ani produkčního ověření;
- produkční Supabase, Vercel konfigurace ani produkční doména nebyly při kontrole změněny.

## Známé produkční problémy

- autentizované hlavní workflow nebylo při této kontrole znovu ručně ověřeno;
- UI polish v2 je produkčně nasazeno, ale bez výslovného uživatelského ověření celého rozsahu;
- Tindeq databázové schéma je aplikováno, ale Tindeq runtime z PR #12 není v produkčním `main`;
- repo migrace Tindeq dosud není v `main`, přestože odpovídající migrace je aplikována v databázi;
- sdílený Supabase projekt obsahuje Knee i workout migrace a vyžaduje důsledné oddělení rozsahu;
- úplný mapping historických manuálně aplikovaných Knee SQL změn na repo artefakty není doložen.
