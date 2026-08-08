# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Aktuální `main` commit

Živě ověřený head větve `main` je:

`8afe1328cfcb8f7ab90bb449775d1de0d441b584` – merge PR #12 `Tindeq: klienti, historie a kanonické reporty`.

Tento živý stav má přednost před staršími záznamy, které ještě uváděly `7e11aa88fb0c14b5216542d4e03101aee082ec17`.

## Aktivní větev a PR

Aktuální oprava interpretace data Tindeq exportů:

- větev: `agent/tindeq-date-format-fix`;
- draft PR: `#17` – `Fix Tindeq Repeater date parsing`;
- base: `main` `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- kódový head před tímto project-control syncem: `f73c3b0d44bd9c0e25ea68467079d4f8b01be8a2`;
- změna se týká pouze parseru data a jeho syntetických regresních testů;
- žádné databázové schéma ani data se v PR #17 nemění.

Paralelně zůstává otevřený PR #16 `Tindeq: clarify metric interpretation states`; není součástí opravy data.

## Produkční runtime commit

Produkční Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`) používá deployment:

`dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`.

Živě ověřený stav:

- target: `production`;
- state: `READY`;
- commit: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- branch: `main`.

Tindeq runtime z PR #12 je tedy v produkci nasazen. Oprava data z PR #17 v produkci nasazená není.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Phase-5 active-session dedupe migrace byla `2026-08-08` aplikována jako:

`20260808091809 tindeq_active_session_unique`.

Doložený invariant:

- validated CHECK `tindeq_sessions_source_session_id_valid` vyžaduje 20znakový lowercase hex `raw_metadata ->> 'tindeqSessionId'`;
- partial unique index `tindeq_sessions_active_source_session_uidx` chrání aktivní identitu `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId') WHERE deleted_at IS NULL`;
- migrace neměnila analytické hodnoty Tindeq sessions.

PR #17 databázi nečte ani nemění a v rámci této opravy nebyl proveden žádný produkční zápis historického měření.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Phase-5 invariant zůstává podle posledního doloženého stavu aktivní i na dev. PR #17 do dev databáze rovněž nezapisuje.

## Fáze 7 — acceptance

Původní ZIP-only Tindeq workflow z PR #12 bylo před mergem manuálně ověřeno na dev Supabase a exact Vercel Preview: auth/environment guard, magic-link návrat bez localhostu, skutečný ZIP import, explicitní save, historie a idempotentní duplicate handling.

Toto historické preview acceptance není produkční ověření opravy data z PR #17.

## Deterministická instalace a exact-head verification

Repo obsahuje autentický `package-lock.json`; workflow `Verify Tindeq client view` používá `npm ci`, unit testy, lint-baseline vůči `main`, produkční build, standalone TypeScript, `project:check`, `git diff --check` a Playwright.

Kódový head PR #17 `f73c3b0d44bd9c0e25ea68467079d4f8b01be8a2` před tímto dokumentačním syncem úspěšně prošel `npm ci`, unit testy, lint-baseline, produkční build, TypeScript, `project:check` a `git diff --check`; browser část workflow ještě v okamžiku syncu probíhala. Proto finální automatické ověření musí být doloženo znovu nad novým exact headem, který obsahuje i tento project-control zápis.

## Aktuální fáze

**Oprava interpretace Tindeq data je implementována ve větvi PR #17 a čeká na finální exact-head automatickou verifikaci.**

Parser už nepoužívá heuristiku `první část > 12`. Hodnotu `info.csv` interpretuje jako pevný Tindeq formát `YYYY-DD-MM HH:mm[:ss]`, validuje kalendářní datum a při neplatném/nepodporovaném formátu failne místo odhadu.

Runtime nepoužívá název ZIPu jako autoritu pro datum, protože soubor lze přejmenovat. Připojený Google Drive v tomto pracovním bloku archiv `repeaters_data_2026_08_08.zip` nevrátil ani při explicitním ZIP MIME hledání; úplná opětovná analýza všech 26 historických exportů proto není doložena. Regresní testy používají konkrétní problematické hodnoty z nahlášeného archivu a syntetická data bez osobních údajů.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee-extension měření, historie a související UI;
- Tindeq ZIP-only runtime z merge PR #12 včetně lokální analýzy, explicitního save, historie, reportů a DB-aware deduplikace;
- produkční phase-5 databázový dedupe invariant;
- deterministická npm instalace a CI.

Současný `main`/produkce stále obsahuje původní heuristický `parseTindeqDate()`, takže nejednoznačné hodnoty jako `2026-04-08` mohou být interpretovány chybně.

## Rozpracováno mimo `main`

PR #17:

- pevná interpretace `YYYY-DD-MM` v `parseTindeqDate()`;
- validace dne, měsíce, času a přestupného roku;
- fail-closed chování, když datum nelze bezpečně určit;
- regresní testy pro 4., 5. a 7. srpna 2026, den > 12, jednoznačné datum a neplatné datum;
- test, že změna data nemění výsledek silové analýzy;
- test, že stejný ZIP má stejný 20znakový session ID i po přejmenování souboru.

PR #16 samostatně řeší prezentační stavy Tindeq metrik a není součástí této opravy.

## Nasazeno

- produkce: `dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`, commit `8afe1328cfcb8f7ab90bb449775d1de0d441b584`, `READY`;
- kódový preview PR #17 před dokumentačním syncem: `dpl_tRNgcXL7H7A6sbRyCLMwVKAVd2uX`, commit `f73c3b0d44bd9c0e25ea68467079d4f8b01be8a2`, `READY`, target preview, alias error `null`.

Nový exact head po tomto project-control commitu musí dostat vlastní preview a verifikaci; starší preview se za finální důkaz nepovažuje.

## Produkčně ověřeno

Oprava data z PR #17 není produkčně nasazená ani manuálně produkčně ověřená.

Produkční Tindeq runtime na `8afe1328cfcb8f7ab90bb449775d1de0d441b584` je technicky nasazený, ale v tomto pracovním bloku nebylo provedeno žádné nové uživatelské produkční acceptance ani žádný produkční import historických měření.

## Známé problémy

- produkční parser na `8afe1328cfcb8f7ab90bb449775d1de0d441b584` stále používá chybnou day/month heuristiku pro nejednoznačné Tindeq datum;
- historický archiv `repeaters_data_2026_08_08.zip` není přes aktuálně připojený Google Drive dohledatelný, takže jeho 26 exportů nebylo v tomto pracovním bloku přímo znovu načteno;
- PR #16 je paralelní změna stejného modulu a před případným mergem obou PR bude potřeba znovu ověřit společný stav proti aktuálnímu `main`.

## Další krok

- Dokončit exact-head CI a Vercel Preview pro PR #17 po project-control syncu a teprve potom rozhodnout o merge/produkčním nasazení opravy data.
