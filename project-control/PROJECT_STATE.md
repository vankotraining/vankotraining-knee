# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

PR #12 zůstává založený přímo na tomto `main`.

Tento soubor eviduje kanonický stav projektu, ale nemůže autoritativně obsahovat vlastní budoucí commit SHA. Přesný živý head PR, CI a Vercel deployment se před další změnou vždy znovu resolve přes GitHub/Vercel.

## Aktivní větev a PR

- větev: `agent/tindeq-results-site`;
- draft PR: `#12`;
- PR je otevřený, ne-merged a při poslední kontrole mergeable;
- bezpečná záloha původního experimentálního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`;
- phase-3 exact head: `e73730c55f7b2e56f638acf380736deaed628df5`;
- phase-4 exact head: `d67a89765b59b0f5ca8db4268cf543beac6082b7`;
- phase-5 exact head: `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- phase-6 verification head: `2f1c6c0c127b35020f32da97a886111648a46342`;
- phase-7 auth incident byl diagnostikován nad headem `aea7340a5d50462905d122c7b54b75fc00c91993`; následný hardening commit se resolve živě z PR;
- PR #14 je merged; PR #15 je uzavřen bez merge.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` je živě ověřen na:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- alias error: žádný.

Tindeq runtime z PR #12 tedy stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Fresh read-only kontrola `2026-08-07`:

- `67` klientů / `66` aktivních;
- `0` Tindeq sessions / `0` aktivních;
- phase-5 index `tindeq_sessions_active_source_session_uidx`: neexistuje;
- phase-5 constraint `tindeq_sessions_source_session_id_valid`: neexistuje;
- phase-5 dedupe migrace není na produkci aplikovaná;
- žádná produkční DDL ani datová mutace nebyla při fázích 5–6 provedena.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Na dev je aplikována migrace:

`20260807170014 tindeq_active_session_unique`.

Ověřený stav:

- validated constraint `tindeq_sessions_source_session_id_valid` vyžaduje `^[0-9a-f]{20}$`;
- partial unique expression index `tindeq_sessions_active_source_session_uidx` vynucuje jednu aktivní identitu `(athlete_id, analysis_version, tindeqSessionId)`;
- `WHERE deleted_at IS NULL` zachovává soft-delete/reimport semantiku;
- `1` Tindeq session / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups;
- duplicate enforcement probe → očekávaný `unique_violation`;
- invalid-ID enforcement probe → očekávaný `check_violation`.

Repo artefakty:

- `supabase/migrations/20260807_tindeq_active_session_unique.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_precheck.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_checks.sql`.

## Fáze 7 — magic-link localhost incident

Dne `2026-08-08` byl diagnostikován dev Supabase magic-link tok, který při testu z deployment-specific Vercel Preview vytvořil e-mail s návratem na `http://localhost:3000`.

Důkazy:

- exact-head preview `dpl_9Tm6yhvadykKviQXrKBajs3Sm3cB` bylo postavené z PR headu `aea7340a5d50462905d122c7b54b75fc00c91993`;
- `TindeqWorkspace.tsx` měl v posledním prokazatelně funkčním branch-preview toku 7. 8. i v incidentním headu stejný blob a stejný výpočet redirectu z aktuální browser domény;
- funkční požadavky 7. 8. se vracely na branch alias `vankotraining-knee-git-agent-tin-d8df0b-vankotrainings-projects.vercel.app/tindeq`;
- incidentní e-maily 8. 8. obsahovaly jako efektivní `redirect_to` localhost;
- Supabase Auth používá nepovolený `redirect_to` jako důvod k fallbacku na `Site URL`; logové pole `referer` proto není samo o sobě důkaz skutečného browser originu;
- repo neobsahuje service worker, PWA cache, middleware, auth callback route, hardcoded `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VERCEL_URL` ani druhou implementaci `signInWithOtp`;
- `next.config.ts` neobsahuje redirecty.

Efektivní příčina je dev Supabase Auth redirect policy, která prokazatelně akceptovala branch alias, ale neakceptovala deployment-specific preview hostname; fallback Site URL je localhost. Dostupný Supabase konektor neumí Auth URL Configuration přímo read/write, takže přesný obsah Dashboard allowlistu není nezávisle exportovatelný. Závěr je doložen chováním obou URL, vygenerovanými e-maily, Auth logy a nezměněným aplikačním auth kódem.

Repo hardening pro tento incident:

- magic-link redirect se počítá jedinou fail-closed utilitou z aktuálního schváleného Knee URL;
- localhost lze z helperu získat pouze tehdy, když aktuální browser URL je skutečně localhost/127.0.0.1;
- deployment-specific i branch-alias Vercel Preview mají explicitní regresní test;
- preview guard bezpečně zobrazuje aktuální origin/path a vypočtený redirect bez query/hash, takže nevystavuje magic-link tokeny.

Požadovaná dev Auth konfigurace před reálným acceptance testem:

- zachovat localhost pouze pro skutečný lokální development;
- v Additional Redirect URLs povolit projektově omezený wildcard `https://vankotraining-knee-*-vankotrainings-projects.vercel.app/**`, aby zahrnoval branch alias i deployment-specific preview;
- produkční Supabase/Auth se v této fázi nemění.

## Aktuální fáze

**Fáze 7 – exact-head acceptance je rozpracovaná.**

Kódová diagnostika a regresní ochrana magic-link originu jsou implementované ve větvi. Reálný magic-link acceptance je blokovaný do chvíle, kdy dev Supabase Auth Additional Redirect URLs pokryjí deployment-specific Knee Preview a odezní/obnoví se e-mailový rate limit. Po této konfiguraci se smí provést jediný nový magic-link pokus a ověřit `/otp`, e-mailový redirect, `/verify` a aktivní preview session.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- produkční `public.tindeq_sessions` tabulka z původní migrace;
- Tindeq runtime z PR #12 stále není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný tok:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → náhled → explicitní klient → explicitní save → historie → klientský/trenérský výstup → `tindeq-report-v1`.

Fáze 3 oddělila prezentační odpovědnosti, fáze 4 srovnala dev DB a zavedla DB-aware environment guard, fáze 5 přidala atomický DB dedupe invariant + race recovery, fáze 6 odstranila paralelní Git auto-deployment cestu ve Vercelu a fáze 7 řeší exact-head acceptance včetně magic-link návratu.

## Nasazeno

- produkčně: pouze `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- poslední incidentně auditovaný preview před auth hardening změnou: `dpl_9Tm6yhvadykKviQXrKBajs3Sm3cB` pro `aea7340a5d50462905d122c7b54b75fc00c91993`;
- finální phase-7 preview musí být po změně znovu resolve na exact nový head;
- phase-5 DB invariant je aplikovaný pouze v dev Supabase `twndqnmrvefhwuwuglju`, nikoli v produkci;
- duplicitní Vercel projekt je zachovaný, ale Git je odpojen.

## Produkčně ověřeno

Tindeq změny z PR #12 nejsou produkčně nasazené ani produkčně ověřené. READY preview, dev DB verification ani automatizované testy se za produkční ověření nepovažují.

## Známé problémy / otevřené gates

- dev Supabase Auth Additional Redirect URLs musí pokrýt deployment-specific Knee Preview; dostupný konektor neumí tuto Auth URL Configuration přímo číst ani zapisovat;
- Supabase dev e-mailový rate limit byl při incidentu `2026-08-08` vyčerpán; další OTP se nesmí posílat naslepo;
- repo nemá autentický npm lockfile a CI používá `npm install`;
- reálný magic-link a skutečný ZIP acceptance ještě nejsou dokončeny;
- phase-5 produkční dedupe migrace je připravena, ale není aplikována; produkční DDL vyžaduje fresh pre-check, backup/rollback gate a samostatné explicitní schválení;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq soubory.

## Další krok

- Ověřit exact nový PR head přes unit/lint/build/project-control/Playwright a exact Vercel Preview, v dev Supabase Auth povolit projektově omezený Vercel Preview wildcard bez změny produkční Auth konfigurace, na exact preview zkontrolovat bezpečnou diagnostiku originu/redirectu/dev project ref a poté provést jediný reálný magic-link acceptance pokus bez návratu na localhost.
