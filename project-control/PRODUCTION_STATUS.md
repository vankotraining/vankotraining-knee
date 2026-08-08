# Production status

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

Kanonický projekt je `vankotraining-knee`.

## Deployment ID

Fresh ověřený produkční deployment:

`dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`.

## Nasazený commit

`8afe1328cfcb8f7ab90bb449775d1de0d441b584` z větve `main` – merge PR #12 `Tindeq: klienti, historie a kanonické reporty`.

Starší project-control údaje popisující stav před mergem PR #12 již neodpovídají živému produkčnímu runtime.

## Čas a výsledek deploymentu

Deployment `dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- commit: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: `null`.

`READY` dokládá produkční nasazení, nikoli automaticky uživatelské produkční ověření konkrétní funkcionality.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`.

Phase-5 migrace byla `2026-08-08` aplikována jako:

`20260808091809 tindeq_active_session_unique`.

Repo SQL zdroj:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`.

Doložený invariant po migraci:

- validated CHECK `tindeq_sessions_source_session_id_valid` vynucuje 20znakový lowercase hex source session ID;
- partial unique index `tindeq_sessions_active_source_session_uidx` chrání aktivní `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId')` při `deleted_at IS NULL`;
- RLS a související policies zůstaly po migraci zachované.

### Produkční historický Tindeq import a remediation

Dne `2026-08-08` byl po schváleném historickém importu proveden audit proti původnímu archivu:

- manifest obsahoval 26 měření pro 7 existujících klientů;
- 13 z 26 aktivních importovaných záznamů odpovídalo archivu;
- 13 z 26 bylo nesprávných.

Po explicitním schválení uživatele byla provedena datová remediation:

- 13 chybných řádků bylo soft-delete, nikoli fyzicky smazáno;
- 13 správných náhradních záznamů bylo vloženo;
- auditní stopa 13 původních chybných řádků zůstala zachovaná.

Manifest post-check zaznamenal:

- `active_count = 26`;
- `missing_count = 0`;
- `extra_count = 0`;
- `metadata_mismatch_count = 0`;
- `active_duplicate_groups = 0`;
- `quality_violations = 0`.

Fresh read-only produkční DB re-check potvrdil:

- 26 aktivních rows;
- 13 soft-deleted rows;
- 7 klientů mezi aktivními sessions;
- 0 invalidních source session ID;
- 0 active duplicate groups;
- 0 aktivních sessions s chybějícím nebo nekladným `detected_repetitions`.

Anonymizovaný detail je v [`tindeq-historical-import-remediation-2026-08-08.md`](./tindeq-historical-import-remediation-2026-08-08.md). Repozitář neobsahuje klientská jména ani konkrétní klientské názvy ZIP souborů.

PR #17 s parser fixem databázové schéma ani data nemění.

## Provedené smoke testy

Pro aktuální produkční stav bylo v tomto pracovním bloku read-only ověřeno:

- produkční Vercel deployment je `READY`;
- metadata deploymentu odpovídají commitu `8afe1328cfcb8f7ab90bb449775d1de0d441b584` na `main`;
- produkční alias zahrnuje `knee.vankotraining.cz` a alias error je `null`;
- `public.tindeq_sessions` má 26 aktivních a 13 soft-deleted rows;
- aktivní sessions patří 7 klientům;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- nonpositive/missing `detected_repetitions` u aktivních sessions: `0`;
- oprava parseru z PR #17 není součástí produkčního deploymentu.

Původní remediation post-check proti manifestu navíc eviduje `missing = 0`, `extra = 0`, `metadata mismatch = 0` a `quality violations = 0`.

## Poslední výslovné uživatelské produkční ověření

Uživatel po remediation v produkční aplikaci ručně zkontroloval původně problematickou klientskou historii a potvrdil:

- správné datum;
- správný počet 8 repetitions.

Tento PASS se vztahuje na ověřený problematický historický případ a stav remediation datasetu. Neznamená produkční ověření parser kódu z PR #17, protože tento kód ještě není produkčně nasazen.

## Produkční stav Tindeq

- Tindeq runtime z PR #12 je na produkci nasazený v commitu `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- produkční historický dataset je po schválené remediation stabilní: 26 aktivních správných sessions + 13 soft-deleted chybných importních rows jako auditní stopa;
- současný produkční `parseTindeqDate()` stále používá heuristiku, která zamění den a měsíc u nejednoznačných hodnot, například `2026-04-08`;
- draft PR #17 mění parser na pevný Tindeq formát `YYYY-DD-MM HH:mm[:ss]`, validuje kalendářní datum a při neplatném formátu failne;
- historický archive/remediation evidence potvrzuje potřebnou interpretaci problematických dat jako den–měsíc;
- PR #17 nemění analytické výpočty síly ani `digest()`/dedupe identitu;
- PR #17 není produkčně nasazený ani produkčně ověřený.

### Preview stav opravy data

Exact head PR #17 před touto evidence synchronizací:

`97116e1c78ac5f50ec6047f2826d7b4d08b062c9`.

Preview:

`dpl_CZECenUUB3AGY18sjzCv45c6kaCe`.

Doloženo:

- state `READY`;
- target preview (`null`, nikoli production);
- exact commit `97116e1c78ac5f50ec6047f2826d7b4d08b062c9`;
- branch `agent/tindeq-date-format-fix`;
- alias error `null`;
- GitHub Actions `Verify Tindeq client view` a `Project control` nad tímto exact headem byly `success`;
- unit `101/101`, production build, standalone TypeScript, project-control, `git diff --check` a Playwright `10/10` byly PASS;
- lint odpovídal existujícímu `main` baseline `3 errors / 1 warning` bez nové regrese.

Evidence synchronizace vytváří nový head; finální merge evidence proto musí být znovu doložena exact-head CI a Vercel Preview po těchto změnách.

## Známé produkční problémy

- produkční parser v `8afe1328cfcb8f7ab90bb449775d1de0d441b584` může nejednoznačné Tindeq datum `YYYY-DD-MM` interpretovat jako `YYYY-MM-DD`, pokud den není větší než 12;
- oprava je zatím pouze v draft PR #17 a není produkčně nasazená;
- PR #16 je samostatná prezentační změna a nesmí být mergována společně s PR #17;
- po merge PR #17 bude PR #16 potřebovat rebase/srovnání dvou společně měněných kanonických project-control souborů.
