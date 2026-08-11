# Project state

## Datum poslední kontroly

`2026-08-11` (Europe/Prague), při fresh auditu a implementaci PR #20 pro bezpečnou editaci jména existujícího klienta. Produkční databáze byla ověřena pouze read-only; PR #20 neprovedl produkční data write, DDL ani změnu RLS/Auth.

## Aktuální `main` commit

Fresh ověřený exact `main` při založení PR #20:

`350d450e336d15fffcd7fc3d33ff41e342f5cd0d` – `Record PR #16 production acceptance`.

PR #20 není v `main` a nemění produkční runtime.

## Aktivní větev a PR

PR #20 `Add safe client name editing` je **draft / open**.

- branch: `feature/edit-client-name`;
- base při založení PR: `main@350d450e336d15fffcd7fc3d33ff41e342f5cd0d`;
- head před tímto docs-only state syncem: `3529383560bcee93ce2a34d7a60e3dd67b0180fb`;
- scope: pouze `athletes.display_name` + synchronní `athletes.name_key` pro konkrétního klienta podle zachyceného `id`;
- žádná změna `athlete_profiles`, měření, Tindeq parseru/persistence, DB schématu, RLS, policies, grants ani Auth;
- automatizované unit/regresní testy: `npm test` 118/118 passed;
- `npm run build`: passed;
- `git diff --check`: passed;
- full-repo `npm run lint` byl spuštěn a zůstává blokovaný třemi předexistujícími `react-hooks/set-state-in-effect` chybami mimo scope PR #20; feature-specific ověření ani build tím nebyly blokované.

Manuální Preview acceptance PR #20 je stále požadovaný před případným merge. Bez explicitního uživatelského souhlasu se PR nemerguje.

Historický PR #16 `Tindeq: clarify metric interpretation states` je **merged / closed / produkčně uživatelsky potvrzený**.

## Produkční runtime commit

Aktuální fresh ověřený produkční deployment při zahájení PR #20:

- GitHub commit: `350d450e336d15fffcd7fc3d33ff41e342f5cd0d`;
- deployment: `dpl_HULPFtJgyym1NCLanJ3kQDfz3QAH`;
- stav: `READY`;
- target: `production`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`.

PR #20 zatím produkční deployment nemá.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

Fresh read-only audit tabulky `public.athletes` pro PR #20 potvrdil:

- `display_name` a `name_key` jsou `NOT NULL` a mají non-blank CHECK constraints;
- `name_key` má unikátní constraint/index;
- UPDATE je chráněný existujícími RLS policies pro oprávněného Knee uživatele;
- existují auditní a `updated_at` UPDATE triggery.

Z toho plyne, že PR #20 nepotřebuje DB migraci ani změnu security policies. Žádná produkční data nebyla změněna.

Phase-5 Tindeq dedupe invariant zůstává beze změny:

- CHECK `tindeq_sessions_source_session_id_valid`;
- partial unique index `tindeq_sessions_active_source_session_uidx`.

## Aktuální fáze

PR #20 je **implementovaný ve feature branchi a automatizovaně otestovaný**, ale není v `main`, není produkčně nasazený a není produkčně uživatelsky ověřený.

Před merge zbývá finalizovat exact Preview gate a uživatelsky na Preview ověřit editaci existujícího klienta, okamžitou změnu UI, persistenci po reloadu a zachování přiřazení existujících měření.

Cílový uživatelský model Tindeq zůstává **3stupňová barevná škála + neutrální stav**:

- zelená `good` = v pořádku / v cílovém rozmezí;
- oranžová `warning` = hraniční / vyžaduje pozornost;
- červená `problem` = problém / výrazná odchylka;
- šedá `neutral` = samostatný neutrální stav pro metriku bez korektní dobré/špatné klasifikace; není čtvrtým hodnoticím stupněm.

## Implementováno v `main`

- Knee a Tindeq runtime včetně ZIP-only analýzy, explicitního save, historie a reportů;
- parser data z PR #17 s pevným formátem `YYYY-DD-MM HH:mm[:ss]`, kalendářní validací a fail-closed chováním;
- produkční phase-5 active-session dedupe invariant;
- responsive oprava horní navigace `/tindeq` z PR #19 včetně Playwright regresní kontroly;
- PR #16: centralizované prezentační stavy `good | warning | problem | neutral`, textové badge, vysvětlivky, typy pravidel a explicitní legenda `3stupňová barevná škála + neutrální stav`;
- chybějící/nevyhodnotitelný protokolový kontext je neutrální, nikoli automaticky červený; při známém pracovním intervalu zůstává skutečné nedosažení 95 % cíle problémovým stavem.

Editace jména klienta z PR #20 **není** implementována v `main`.

## Rozpracováno mimo `main`

- PR #20: editace identity existujícího klienta (`display_name` + synchronní `name_key`) s update cíleným pouze podle zachyceného `athlete.id`;
- UI má akci `Upravit klienta`, explicitně zobrazuje upravovaného klienta a nabízí `Uložit` / `Zrušit`;
- prázdné/whitespace jméno se neukládá; unique konflikt vrací srozumitelnou chybu; DB chyba zachovává původní lokální state;
- po úspěšném update se lokální seznam klientů aktualizuje bez reloadu a vybraný klient zůstává zachovaný;
- Preview acceptance je před merge povinný.

## Nasazeno

- parser oprava PR #17: produkčně nasazena;
- responsive oprava PR #19: produkčně nasazena;
- PR #16 runtime: produkčně nasazen a uživatelsky potvrzen;
- PR #20: zatím pouze feature branch / Preview workflow, nikoli production.

## Produkčně ověřeno

Responsive oprava PR #19: **ano** – uživatel ji `2026-08-09` potvrdil na skutečném telefonu.

Parser data / live new-client workflow po PR #17: **ano** – uživatel `2026-08-10` nahrál a uložil nové měření a potvrdil, že vše vypadá v pořádku.

PR #16: **ano** – po produkčním rollout a technickém smoke uživatel dne `2026-08-10` výslovně potvrdil produkční UI slovy `v pořádku`.

PR #20: **ne** – není v `main`, není produkčně nasazený a uživatel jej zatím produkčně nepotvrdil.

## Známé problémy

- full-repo lint na aktuálním baseline obsahuje předexistující `react-hooks/set-state-in-effect` chyby v `ArchivedClients.tsx`, `ArchivedMeasurements.tsx` a stávajícím selected-client efektu `KneeDashboard.tsx`; oprava těchto nesouvisejících nálezů je mimo scope PR #20;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope PR #20.

## Další krok

- Fresh ověřit exact PR #20 head/base, mergeability, CI a dev-Supabase Preview; poté uživatel na Preview ručně ověří rename + reload + zachování existujících měření; bez explicitního uživatelského souhlasu PR #20 nemergovat.
