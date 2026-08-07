# Production status

## Datum poslední kontroly

`2026-08-07 12:25 CEST` (Europe/Prague).

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
- aliasy zahrnují `knee.vankotraining.cz`, `vankotraining-knee.vercel.app` a kanonické main aliasy;
- alias error: žádný.

`READY` znamená pouze produkčně nasazeno, nikoli produkčně ověřeno.

## Databázové migrace použité produkční aplikací

Supabase projekt: `zxvndqicslyulrinbpyn` (sdílený projekt), stav `ACTIVE_HEALTHY`, PostgreSQL `17.6`.

Aktuální záznamy v historii migrací při kontrole:

- `20260710075659 allow_authenticated_taxonomy_reads`;
- `20260710085333 add_exercise_families_taxonomy`;
- `20260710085357 assign_certain_exercise_families`;
- `20260710094029 resolve_remaining_exercise_families`;
- `20260710095344 add_workout_items_editor_support`;
- `20260710095416 restrict_workout_item_editor_functions`;
- `20260802124337 tindeq_sessions`.

Relevantní databázový audit `2026-08-07`:

- `public.athletes`: `67` celkem / `66` aktivních klientů;
- `auth.users`: `1`;
- `public.tindeq_sessions`: `0` celkových / `0` aktivních řádků;
- RLS na `public.tindeq_sessions`: zapnuto;
- tabulka obsahuje vazbu na klienta, normalizované souhrny, auditní sloupce a soft delete;
- produkční schéma neobsahuje dodatečné klientské/fingerprint sloupce z ukončeného PR #15;
- databáze stále nemá Tindeq DB unique invariant pro souběžnou deduplikaci.

Historické Knee SQL změny nejsou kompletně mapovatelné na uvedenou Supabase migrační historii; část byla dříve aplikována manuálně. Nové změny musí používat verzované repo migrace.

## Provedené smoke testy

Poslední doložená neinvazivní anonymní kontrola `2026-08-04 10:04 CEST`:

- GET `/`: HTTP `200 OK`;
- odpověď obsahovala titul `Knee Data | Vanko Training`;
- vykreslila přihlašovací obrazovku `Přihlášení trenéra`;
- odpověď neobsahovala Next.js error stránku;
- Vercel odpověděl z produkčního aliasu bez redirect nebo access chyby.

Při auditu `2026-08-07` byl znovu ověřen deployment metadata stav, commit a produkční alias. Nebyl proveden produkční zápis ani změna databáze.

## Poslední výslovné uživatelské produkční ověření

`2026-07-30`: uživatel výslovně potvrdil mobilní zobrazení splnění normy jako v pořádku. Rozsah důkazu je omezen na tuto funkci a implementační commit `1de66ddf343c5f0b58a748f0c2c45cca0af51c73`.

Pro současný runtime commit jako celek ani pro UI polish v2 není novější výslovné uživatelské produkční ověření doloženo.

## Produkční stav Tindeq

- databáze aplikována: `public.tindeq_sessions` existuje;
- Tindeq runtime z draft PR #12 není v produkčním `main`;
- žádná produkční Tindeq session není uložena;
- exact-head preview PR #12 není důkazem produkčního nasazení ani produkčního ověření;
- produkční Supabase, Vercel konfigurace ani produkční doména nebyly při auditu změněny.

## Známé produkční problémy

- autentizované hlavní workflow nebylo při této kontrole znovu ručně ověřeno;
- UI polish v2 je produkčně nasazeno, ale bez výslovného uživatelského ověření celého rozsahu;
- Tindeq databázové schéma je aplikováno, ale Tindeq runtime z PR #12 není v produkčním `main`;
- repo migrace Tindeq dosud není v `main`, přestože odpovídající migrace je aplikována v databázi;
- produkční databáze negarantuje Tindeq unikátnost DB constraintem;
- sdílený Supabase projekt obsahuje pre-existující security advisor nálezy, včetně tří `SECURITY DEFINER` views na úrovni `ERROR`, a další security/performance warningy mimo rozsah PR #14;
- sdílený Supabase projekt obsahuje Knee i workout objekty a vyžaduje důsledné oddělení rozsahu;
- úplný mapping historických manuálně aplikovaných Knee SQL změn na repo artefakty není doložen.
