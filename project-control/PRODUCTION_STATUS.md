# Production status

## Datum poslední kontroly

`2026-08-08` (Europe/Prague), fresh read-only audit.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

Duplicitní projekt `vankotraining-knee-mxei` není produkčním vlastníkem domény a jeho Git integrace byla ve fázi 6 odpojena. Projekt nebyl smazán. Fresh kontrola merge-readiness SHA neukázala žádný nový deployment v duplicitním projektu.

## Deployment ID

Živě ověřený produkční deployment:

`dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`.

## Nasazený commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` z větve `main` – `Record project-control phase 1 completion`.

Tindeq runtime z draft PR #12 na produkci stále není.

## Čas a výsledek deploymentu

Deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- commit: `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- branch: `main`;
- aliasy zahrnují `knee.vankotraining.cz`;
- alias error: žádný.

`READY` znamená pouze **produkčně nasazeno**, nikoli **produkčně ověřeno**.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`.

Fresh read-only Tindeq pre-check `2026-08-08`:

- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- chybějící nebo neplatný `raw_metadata ->> 'tindeqSessionId'`: `0`;
- duplicate groups mezi aktivními záznamy podle `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId')`: `0`;
- phase-5 unique index `tindeq_sessions_active_source_session_uidx`: neexistuje;
- phase-5 check constraint `tindeq_sessions_source_session_id_valid`: neexistuje;
- RLS je zapnuté;
- Tindeq policies a relevantní table grants odpovídají dev před/po phase-5 invariant rozdílu;
- produkční schéma odpovídá repo migraci `20260807_tindeq_active_session_unique.sql` jako bezpečný pre-state;
- phase-5 dedupe migrace na produkci aplikovaná není.

Při merge-readiness práci `2026-08-08` nebyla provedena žádná produkční DDL, datová mutace, změna Auth ani environment variables.

## Provedené smoke testy

Dříve a při fresh konsolidační kontrole bylo read-only ověřeno:

- `knee.vankotraining.cz` patří kanonickému projektu `vankotraining-knee`;
- produkční alias směřuje na `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- deployment odpovídá přesně `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- stav je `READY` a alias error je `null`;
- produkční Tindeq DB pre-check je čistý a phase-5 objekty zůstávají nepřítomné.

Nebyl proveden produkční zápis, vytvoření testovacího klienta, Tindeq save, archivace, obnova ani jiná mutace.

## Poslední výslovné uživatelské produkční ověření

Současný runtime jako celek ani Tindeq workflow nejsou označeny jako produkčně ověřené.

`READY` deployment, HTTP smoke, CI, Vercel Preview acceptance nebo read-only DB audit nejsou uživatelské produkční ověření.

Dříve doložené uživatelské potvrzení se týká pouze konkrétního historického mobilního zobrazení splnění normy a nepřenáší se automaticky na současný runtime.

## Produkční stav Tindeq

- `public.tindeq_sessions` existuje a má `0` řádků;
- Tindeq runtime z PR #12 není v produkčním `main`;
- phase-5 DB dedupe invariant není na produkci aplikovaný;
- produkční Tindeq zápis nebyl proveden;
- phase-5 migrační SQL + pre/post checks jsou připravené v repozitáři;
- fresh produkční pre-check je PASS;
- produkční phase-5 migrace vyžaduje použitelný backup/restore gate a samostatné explicitní schválení uživatele.

## Preview acceptance stav

Fáze 7 je uzavřená jako **manuálně ověřeno: PASS** na dev Supabase a exact Vercel Preview:

- environment guard potvrdil dev project ref;
- skutečný magic-link se vrátil na stejný exact preview `/tindeq` bez localhostu;
- `/verify` a session byly úspěšné;
- skutečný Tindeq ZIP byl importován a explicitně uložen;
- duplicate cesta byla idempotentní a nevytvořila druhý aktivní DB řádek.

Toto je preview acceptance, nikoli produkční ověření.

## Merge-readiness infrastruktura mimo produkci

Na PR #12 je implementován autentický `package-lock.json` a CI používá `npm ci`.

Exact implementation head `aa4471d90e796a01030622b6b2028f8a28d7156d`:

- GitHub run `31246203230`: success;
- unit `93/93`, Playwright `10/10`, build/TypeScript/project-control/diff PASS;
- lint bez nové chyby/warning proti `main` baseline;
- preview `dpl_7v8m7r2JTHxKMXZtQ36qzAp9v6eg`: `READY`, alias error `null`.

Tyto změny nejsou produkčně nasazené.

## Vercel konsolidace

Fáze 6 zůstává deploymentem ověřena:

- kanonický preview deployment vzniká v projektu `vankotraining-knee`;
- duplicitní projekt pro nové merge-readiness SHA nevytvořil deployment;
- Git auto-deploy tedy pokračuje pouze přes kanonický projekt.

## Známé produkční problémy / gates

- Tindeq runtime z PR #12 ještě není produkčně nasazen;
- produkční phase-5 dedupe migrace není aplikovaná;
- před produkční DDL musí být potvrzen použitelný backup/restore nebo export gate;
- PR #12 zůstává draft a není merged;
- shared production Supabase má dříve evidované security/performance advisor nálezy mimo rozsah Tindeq merge-readiness;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.
