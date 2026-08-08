# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Aktuální `main` commit

Živě ověřený head větve `main` je:

`8afe1328cfcb8f7ab90bb449775d1de0d441b584` – merge PR #12 `Tindeq: klienti, historie a kanonické reporty`.

Tento živý stav má přednost před staršími project-control záznamy, které ještě uváděly stav před mergem PR #12.

## Aktivní větev a PR

Aktuální oprava interpretace data Tindeq exportů:

- větev: `agent/tindeq-date-format-fix`;
- draft PR: `#17` – `Fix Tindeq Repeater date parsing`;
- base: `main` `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- PR je open a při posledním fresh GitHub re-checku mergeable;
- submitted reviews: `0`;
- review threads / unresolved review threads: `0`;
- změna runtime se týká parseru data a jeho regresních testů;
- žádné databázové schéma ani produkční data se kódem PR #17 nemění.

Před touto evidence synchronizací prošel exact head `97116e1c78ac5f50ec6047f2826d7b4d08b062c9` kompletním CI a měl exact READY Vercel Preview. Protože synchronizace dokumentace vytváří nový head, finální merge gate musí být znovu doložen nad novým exact headem.

Paralelně zůstává otevřený draft PR #16 `Tindeq: clarify metric interpretation states`, head `904da6768fe72ed86973c93fb164dea5e1eacc87`. PR #16 není součástí opravy data.

## Produkční runtime commit

Produkční Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`) používá deployment:

`dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`.

Fresh ověřený stav:

- target: `production`;
- state: `READY`;
- commit: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: `null`.

Tindeq runtime z PR #12 je tedy v produkci nasazen. Oprava parseru data z PR #17 v produkci nasazená není.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Phase-5 active-session dedupe migrace byla `2026-08-08` aplikována jako:

`20260808091809 tindeq_active_session_unique`.

Doložený invariant:

- validated CHECK `tindeq_sessions_source_session_id_valid` vyžaduje 20znakový lowercase hex `raw_metadata ->> 'tindeqSessionId'`;
- partial unique index `tindeq_sessions_active_source_session_uidx` chrání aktivní identitu `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId') WHERE deleted_at IS NULL`;
- RLS a související policies zůstaly po migraci zachované.

### Produkční historický Tindeq dataset

Dne `2026-08-08` proběhl schválený historický import a následná remediation. Audit původního importu proti archivu zjistil 13 správných a 13 chybných aktivních záznamů. Po explicitním schválení uživatele:

- 13 chybných řádků bylo soft-delete;
- 13 správných náhradních řádků bylo vloženo;
- fyzické mazání nebylo provedeno a auditní stopa zůstala zachovaná.

Doložený post-check proti manifestu:

- `active_count = 26`;
- `missing_count = 0`;
- `extra_count = 0`;
- `metadata_mismatch_count = 0`;
- `active_duplicate_groups = 0`;
- `quality_violations = 0`;
- aktivní sessions jsou rozdělené mezi 7 existujících klientů podle původního archivu.

Fresh read-only re-check produkce dále potvrdil:

- 26 aktivních rows;
- 13 soft-deleted rows;
- 7 klientů mezi aktivními sessions;
- 0 invalidních source session ID;
- 0 active duplicate groups;
- 0 aktivních sessions s chybějícím nebo nekladným `detected_repetitions`.

Detailní anonymizovaný evidence záznam je v [`tindeq-historical-import-remediation-2026-08-08.md`](./tindeq-historical-import-remediation-2026-08-08.md).

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Phase-5 invariant zůstává podle posledního doloženého stavu aktivní i na dev. PR #17 do dev databáze nezapisuje.

## Aktuální fáze

**Oprava interpretace Tindeq data je implementována ve větvi PR #17; produkční historický dataset je po remediation stabilní a finální merge gate nyní vyžaduje nový exact-head CI + preview důkaz po této dokumentační synchronizaci.**

Parser v PR #17 už nepoužívá heuristiku `první část > 12`. Hodnotu `info.csv` interpretuje jako pevný Tindeq formát `YYYY-DD-MM HH:mm[:ss]`, validuje kalendářní datum a při neplatném/nepodporovaném formátu failne místo odhadu.

Historický archive/remediation evidence prakticky potvrzuje potřebnou interpretaci formátu pro problematická data. To není totéž jako produkční ověření parser kódu PR #17, protože tento kód zatím není v produkčním runtime.

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
- fail-closed chování pro neplatný/nepodporovaný formát;
- regresní testy pro problematická srpnová data, den > 12, jednoznačné a neplatné datum;
- test, že změna data nemění výsledek silové analýzy;
- test, že stejný ZIP má stejný 20znakový session ID i po přejmenování souboru;
- synchronizace kanonického produkčního stavu a anonymizovaný evidence záznam historické remediation.

PR #16 samostatně řeší prezentační stavy Tindeq metrik a není součástí této opravy.

## Nasazeno

- produkce: `dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`, commit `8afe1328cfcb8f7ab90bb449775d1de0d441b584`, `READY`;
- exact preview PR #17 před touto evidence synchronizací: `dpl_CZECenUUB3AGY18sjzCv45c6kaCe`, commit `97116e1c78ac5f50ec6047f2826d7b4d08b062c9`, `READY`, target preview, alias error `null`;
- nový exact head po evidence synchronizaci musí dostat vlastní CI a Vercel Preview; starší PASS se za finální merge evidence nepovažuje.

## Produkčně ověřeno

Produkční historická remediation je v tomto rozsahu doložena takto:

- produkčně aplikováno: 13 chybných rows soft-delete + 13 správných náhradních rows;
- automatizovaně/databázově ověřeno: manifest post-check PASS a fresh read-only DB re-check PASS;
- manuálně produkčně ověřeno: uživatel potvrdil v původně problematickém historickém případě správné datum a 8 repetitions.

Oprava parseru z PR #17 není produkčně nasazená ani produkčně ověřená. READY preview, CI ani historická datová remediation se za produkční ověření nového parser runtime nepovažují.

## Známé problémy

- produkční parser na `8afe1328cfcb8f7ab90bb449775d1de0d441b584` stále používá chybnou day/month heuristiku pro nejednoznačné Tindeq datum;
- PR #17 po tomto dokumentačním syncu potřebuje nový exact-head CI a preview evidence;
- PR #16 mění stejné dva kanonické project-control soubory, takže po merge PR #17 bude vyžadovat rebase/konfliktní dokumentační srovnání; runtime kód PR #16 se s parser soubory PR #17 nepřekrývá;
- shared production Supabase má dříve existující advisory nálezy mimo scope této opravy.

## Další krok

- Po PASS nového exact-head CI a Vercel Preview vyžádat explicitní uživatelské schválení merge PR #17; bez tohoto approval gate PR nemergovat ani produkčně nenasazovat.
