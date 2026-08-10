# Project state

## Datum poslední kontroly

`2026-08-10` (Europe/Prague), po explicitním uživatelském Preview review PR #16, fresh pre-merge gate, merge PR #16, produkčním Vercel rollout ověření a HTTP smoke testu `/tindeq` a `/tindeq/reports/demo`.

## Aktuální `main` commit

Bezprostředně před tímto docs-only production-evidence syncem byl exact `main`:

`6c2a08352b509d51336e368771edc6e804006008` – merge PR #16 `Tindeq: clarify metric interpretation states`.

Tento merge je aktuální runtime-changing checkpoint. Následný docs-only evidence sync nemění aplikační runtime.

## Aktivní větev a PR

PR #16 `Tindeq: clarify metric interpretation states` je **merged / closed**.

- head před merge: `bfc9ba06f165a7659dcf2451a8cc2fdeb9ddf4cc`;
- base před merge: `main@2aad506dd482e765c61036a84b6a39a5635c90cf`;
- merge commit: `6c2a08352b509d51336e368771edc6e804006008`;
- merge time: `2026-08-10 13:44:46` Europe/Prague;
- uživatel před mergem výslovně potvrdil Preview review jako `v pořádku` a následně dal explicitní souhlas s merge.

Fresh pre-merge gate exact headu `bfc9ba06...`:

- PR open, draft před převodem na ready, `mergeable: true`;
- `behind_by: 0` proti exact `main@2aad506...`;
- `Project control` run 70: `success`;
- `Verify Tindeq client view` run 214: `success`;
- Vercel Preview `dpl_2k8WvSyHCaPrTM8uxNEXtyFaamNs`: `READY`.

PR byl následně převeden z draftu na ready a mergnut s `expected_head_sha=bfc9ba06...`; GitHub merge result byl `merged: true`.

## Produkční runtime commit

Aktuální runtime-changing production checkpoint:

- commit: `6c2a08352b509d51336e368771edc6e804006008`;
- deployment: `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`;
- stav: `READY`;
- target: `production`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`.

Vercel metadata deploymentu potvrzují exact GitHub commit `6c2a08352b509d51336e368771edc6e804006008` a merge zprávu PR #16.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

Phase-5 dedupe invariant zůstává aktivní:

- CHECK `tindeq_sessions_source_session_id_valid`;
- partial unique index `tindeq_sessions_active_source_session_uidx`.

Poslední fresh read-only DB post-check po live parser acceptance:

- sessions celkem: `40`;
- aktivní sessions: `27`;
- soft-deleted sessions: `13`;
- aktivní klienti v Tindeq sessions: `8`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`.

PR #16 neobsahuje DB schema, data, auth ani persistence změny; po jeho merge proto nebyl proveden žádný DB write ani DDL.

## Aktuální fáze

PR #16 je implementovaný, merged a technicky nasazený do produkce.

Cílový uživatelský model je **3stupňová barevná škála + neutrální stav**:

- zelená `good` = v pořádku / v cílovém rozmezí;
- oranžová `warning` = hraniční / vyžaduje pozornost;
- červená `problem` = problém / výrazná odchylka;
- šedá `neutral` = samostatný neutrální stav pro metriku bez korektní dobré/špatné klasifikace; není čtvrtým hodnoticím stupněm.

`tindeq-report-v1`, databáze, persistence, auth a parserové pravidlo PR #16 nemění.

## Implementováno v `main`

- Knee a Tindeq runtime včetně ZIP-only analýzy, explicitního save, historie a reportů;
- parser data z PR #17 s pevným formátem `YYYY-DD-MM HH:mm[:ss]`, kalendářní validací a fail-closed chováním;
- produkční phase-5 active-session dedupe invariant;
- responsive oprava horní navigace `/tindeq` z PR #19 včetně Playwright regresní kontroly;
- PR #16: centralizované prezentační stavy `good | warning | problem | neutral`, textové badge, vysvětlivky, typy pravidel a explicitní legenda `3stupňová barevná škála + neutrální stav`;
- chybějící/nevyhodnotitelný protokolový kontext je neutrální, nikoli automaticky červený; při známém pracovním intervalu zůstává skutečné nedosažení 95 % cíle problémovým stavem.

## Rozpracováno mimo `main`

- žádná další změna PR #16; PR je merged / closed;
- případné další rozšíření Tindeq metrik nebo hranic je nový samostatný scope.

## Nasazeno

- parser oprava PR #17: produkčně nasazena;
- responsive oprava PR #19: produkčně nasazena;
- PR #16 runtime merge: `6c2a08352b509d51336e368771edc6e804006008`;
- PR #16 production deployment: `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`, `READY`;
- produkční alias: `knee.vankotraining.cz`;
- technický HTTP smoke po rollout: `/tindeq` = HTTP 200, `/tindeq/reports/demo` = HTTP 200; demo HTML obsahuje `tindeq-report-v1`, textové status badge a vysvětlivky PR #16.

## Produkčně ověřeno

Responsive oprava PR #19: **ano** – uživatel ji `2026-08-09` potvrdil na skutečném telefonu.

Parser data / live new-client workflow po PR #17: **ano** – uživatel `2026-08-10` nahrál a uložil nové měření a potvrdil, že vše vypadá v pořádku.

PR #16: **zatím ne jako samostatný produkční acceptance**. Uživatel před mergem výslovně provedl a schválil Preview review; produkční deployment je technicky `READY` a HTTP smoke je zelený, ale dle projektového pravidla je produkční funkční acceptance až po výslovném uživatelském potvrzení produkčního UI.

## Známé problémy

- PR #16 nemá otevřený technický merge/deployment problém; zbývá pouze uživatelský produkční acceptance nového interpretačního UI;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope PR #16.

## Další krok

- Uživatel může na produkci krátce zkontrolovat Tindeq výsledek / demo report a výslovně potvrdit, že nové statusy a vysvětlivky vypadají v pořádku. Poté lze PR #16 označit jako plně produkčně ověřený.
