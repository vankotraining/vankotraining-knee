# Production status

## Datum poslední kontroly

`2026-08-07 21:07 CEST` (Europe/Prague).

## Produkční URL

`https://knee.vankotraining.cz`

## Kanonický Vercel projekt

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

Duplicitní projekt `vankotraining-knee-mxei` není produkčním vlastníkem domény a jeho Git integrace byla ve fázi 6 odpojena. Projekt nebyl smazán.

## Aktuální produkční deployment

Živě ověřený produkční deployment:

`dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`.

Metadata:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- commit: `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- branch: `main`;
- commit message: `Record project-control phase 1 completion`;
- aliasy zahrnují `knee.vankotraining.cz`, `vankotraining-knee.vercel.app` a main alias;
- alias error: žádný.

`READY` znamená pouze **produkčně nasazeno**, nikoli **produkčně ověřeno**.

## Produkční runtime commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` z větve `main`.

Tindeq runtime z draft PR #12 na produkci stále není. Fáze 6 měnila pouze deployment topologii preview větve a project-control evidenci; produkční aplikační runtime nebyl změněn.

## Produkční Supabase

Project ref:

`zxvndqicslyulrinbpyn`.

Fresh read-only kontrola `2026-08-07`:

- `public.athletes`: `67` celkem / `66` aktivních klientů;
- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- phase-5 unique index `tindeq_sessions_active_source_session_uidx`: neexistuje;
- phase-5 check constraint `tindeq_sessions_source_session_id_valid`: neexistuje.

Relevantní produkční Tindeq migrační historie zůstává na původní migraci `20260802124337 tindeq_sessions`. Phase-5 dedupe migrace na produkci aplikovaná není.

Při fázích 5–6 nebyla provedena žádná produkční DDL ani datová mutace.

## Provedené produkční kontroly

Po Vercel konsolidaci bylo read-only ověřeno:

- `knee.vankotraining.cz` stále patří kanonickému projektu `vankotraining-knee`;
- produkční alias směřuje na `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- deployment odpovídá přesně `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- stav je `READY` a alias error je `null`;
- anonymní GET `/` vrací `200 OK` a vykresluje Knee login stránku;
- produkční DB počty a phase-5 DB objekty zůstaly beze změny.

Nebyl proveden produkční zápis, vytvoření testovacího klienta, Tindeq save, archivace, obnova ani jiná mutace.

## Poslední výslovné uživatelské produkční ověření

Současný runtime jako celek ani Tindeq workflow nejsou označeny jako produkčně ověřené.

`READY` deployment, HTTP smoke, CI nebo read-only DB audit nejsou uživatelské produkční ověření.

Dříve doložené uživatelské potvrzení se týká pouze konkrétního historického mobilního zobrazení splnění normy a nepřenáší se automaticky na současný runtime.

## Produkční stav Tindeq

- `public.tindeq_sessions` existuje a má `0` řádků;
- Tindeq runtime z PR #12 není v produkčním `main`;
- phase-5 DB dedupe invariant není na produkci aplikovaný;
- produkční Tindeq zápis nebyl proveden;
- případná produkční phase-5 migrace vyžaduje nový read-only pre-check, backup/rollback gate a samostatné explicitní schválení uživatele.

## Vercel konsolidace

Fáze 6 je deploymentem ověřena:

- kontrolní commit PR #12: `2f1c6c0c127b35020f32da97a886111648a46342`;
- kanonický preview: `dpl_7PZGdzPyBv9NAc8PJr7fqS2Y7XD4`, `READY`;
- duplicitní projekt pro tento SHA nevytvořil nový deployment;
- jeho poslední historický deployment zůstal `dpl_EfraCnckKVRUHCRuufkaHPHdLZmC` pro starší SHA `f3b4dcc5...`;
- Git auto-deploy tedy pokračuje pouze přes kanonický projekt.

## Známé produkční problémy / gates

- Tindeq runtime z PR #12 ještě není produkčně nasazen;
- produkční phase-5 dedupe migrace není aplikovaná;
- Vercel Preview Supabase ref musí být nezávisle potvrzen před write acceptance;
- reálný magic-link a skutečný ZIP acceptance nejsou dokončeny;
- repo stále nemá autentický npm lockfile;
- shared production Supabase má dříve evidované security/performance advisor nálezy mimo rozsah této konsolidace;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.
