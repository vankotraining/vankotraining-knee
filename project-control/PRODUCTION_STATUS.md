# Production status

## Datum poslední kontroly

`2026-08-07 12:37 CEST` (Europe/Prague).

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`

Vercel team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Poslední explicitně ověřený produkční deployment merge commitu fáze 1: `dpl_G4iaoxQ9f4DztA76djs8hfaceouZ`.

Aktualizace tohoto stavového dokumentu může sama vytvořit novější dokumentační deployment se stejným aplikačním runtime; před jakoukoli změnou proto vždy znovu vyřeš živý produkční deployment ve Vercelu.

## Nasazený commit

Merge commit fáze 1: `704950a7a5a0516175126f7761adf1ccb34dc043` – `Establish canonical project control sources (#14)`.

Tento commit změnil pouze projektovou dokumentaci/řízení, `package.json` kontrolní skript a GitHub workflow/template. Diff proti předchozímu produkčnímu commitu neobsahuje žádný `src/**`, databázovou migraci ani Vercel konfiguraci.

## Čas a výsledek deploymentu

Deployment `dpl_G4iaoxQ9f4DztA76djs8hfaceouZ`:

- vytvořen: `2026-08-07 12:35:50 CEST`;
- READY: `2026-08-07 12:36:14 CEST`;
- target: `production`;
- stav: `READY`;
- commit: `704950a7a5a0516175126f7761adf1ccb34dc043`;
- aliasy zahrnují `knee.vankotraining.cz`, `vankotraining-knee.vercel.app` a main alias;
- alias error: žádný.

`READY` znamená pouze produkčně nasazeno, nikoli produkčně ověřeno.

## Databázové migrace použité produkční aplikací

Produkční Supabase: `zxvndqicslyulrinbpyn`, sdílený projekt.

Relevantní migrační historie zůstává beze změny; Tindeq migrace je `20260802124337 tindeq_sessions`.

Read-only audit po merge PR #14:

- `public.athletes`: `67` celkem / `66` aktivních klientů;
- `auth.users`: `1`;
- `public.tindeq_sessions`: `0` celkových / `0` aktivních řádků;
- `tindeq_sessions` neobsahuje PR #15 extra sloupce ani fingerprint unique index;
- indexy: `tindeq_sessions_active_athlete_measured_idx`, `tindeq_sessions_analysis_version_idx`, `tindeq_sessions_pkey`.

PR #14 neprovedl žádnou databázovou změnu ani produkční datový zápis.

## Provedené smoke testy

Po merge fáze 1 bylo ověřeno:

- GitHub `main` merge commit `704950a7a5a0516175126f7761adf1ccb34dc043`;
- exact-commit workflow `Project control`, run `31170713406`: `success`;
- Vercel deployment stejného commitu: `READY`, target `production`, bez alias error;
- diff proti předchozímu runtime neobsahuje `src/**`;
- produkční Supabase počty a Tindeq schéma zůstaly beze změny.

Nebyl proveden produkční zápis ani změna databáze.

## Poslední výslovné uživatelské produkční ověření

Fáze 1 není označena jako produkčně ověřená. `READY` deployment ani automatizované kontroly nejsou uživatelské produkční ověření.

Poslední dříve doložené výslovné uživatelské produkční ověření v repozitáři se týká pouze konkrétního mobilního zobrazení splnění normy, nikoli současného runtime jako celku.

## Produkční stav Tindeq

- produkční DB tabulka `public.tindeq_sessions` existuje a má `0` řádků;
- Tindeq runtime z PR #12 stále není v produkčním `main`;
- žádný Tindeq produkční zápis nebyl v rámci fáze 1 proveden;
- databáze zatím nemá schválený unique invariant pro souběžnou Tindeq deduplikaci.

## Známé produkční problémy

- produkční shared Supabase má pre-existující security/performance advisor nálezy mimo rozsah fáze 1;
- repo migrace pro již aplikované `tindeq_sessions` je stále pouze v PR #12 a musí být konsolidována do čisté historie;
- současný Tindeq runtime není v produkci;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen;
- následné dokumentační evidence commity mohou vytvořit novější Vercel deployment se stejným runtime, proto přesný aktuální alias/deployment vždy ověř živě.
