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

Živě ověřený produkční deployment:

`dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`.

## Nasazený commit

`8afe1328cfcb8f7ab90bb449775d1de0d441b584` z větve `main` – merge PR #12 `Tindeq: klienti, historie a kanonické reporty`.

Starší project-control údaj `7e11aa88fb0c14b5216542d4e03101aee082ec17` již neodpovídá živému produkčnímu runtime.

## Čas a výsledek deploymentu

Deployment `dpl_CxDNPh5Skm8Mwa4SxVXXWDfAsCDS`:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- commit: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- branch: `main`.

`READY` dokládá produkční nasazení, nikoli uživatelské produkční ověření konkrétní funkcionality.

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

Oprava data v PR #17 nemění databázové schéma ani data. V tomto pracovním bloku nebyl proveden žádný produkční import historických Tindeq měření ani jiný produkční DB zápis.

## Provedené smoke testy

Pro aktuální produkční runtime bylo v tomto pracovním bloku read-only ověřeno:

- produkční Vercel deployment je `READY`;
- metadata deploymentu odpovídají commitu `8afe1328cfcb8f7ab90bb449775d1de0d441b584` na `main`;
- oprava data z PR #17 není součástí produkčního deploymentu.

Nebyl proveden produkční aplikační write smoke test ani historický import.

## Poslední výslovné uživatelské produkční ověření

Oprava interpretace data z PR #17 nebyla uživatelem produkčně ověřena, protože ještě není produkčně nasazená.

Předchozí manuální acceptance Tindeq workflow proběhlo na vývojovém Supabase a Vercel Preview před mergem PR #12; preview acceptance se nepovažuje za produkční ověření.

## Produkční stav Tindeq

- Tindeq runtime z PR #12 je na produkci nasazený v commitu `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- současný produkční `parseTindeqDate()` používá heuristiku, která zamění den a měsíc u nejednoznačných hodnot, například `2026-04-08`;
- draft PR #17 mění parser na pevný Tindeq formát `YYYY-DD-MM HH:mm[:ss]`, validuje kalendářní datum a při neplatném formátu failne;
- PR #17 nemění analytické výpočty síly ani `digest()`/dedupe identitu;
- PR #17 není produkčně nasazený.

## Preview stav opravy data

Kódový head PR #17 před project-control syncem:

`f73c3b0d44bd9c0e25ea68467079d4f8b01be8a2`.

Preview:

`dpl_tRNgcXL7H7A6sbRyCLMwVKAVd2uX`.

Doloženo:

- state `READY`;
- target preview (`null`, nikoli production);
- exact commit `f73c3b0d44bd9c0e25ea68467079d4f8b01be8a2`;
- branch `agent/tindeq-date-format-fix`;
- alias error `null`;
- kanonický Vercel project ID `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`.

Po project-control změnách vzniká nový head; finální preview evidence musí odpovídat tomuto novému exact headu.

## Známé produkční problémy

- produkční parser v `8afe1328cfcb8f7ab90bb449775d1de0d441b584` může nejednoznačné Tindeq datum `YYYY-DD-MM` interpretovat jako `YYYY-MM-DD`, pokud den není větší než 12;
- oprava je zatím pouze v draft PR #17 a není produkčně nasazená;
- historický archiv `repeaters_data_2026_08_08.zip` nebyl v tomto pracovním bloku dostupný přes aktuálně připojený Google Drive, takže všech 26 exportů nebylo přímo revalidováno;
- paralelní PR #16 mění prezentační vrstvu Tindeq a před případným společným nasazením je nutné ověřit aktuální společný `main`.
