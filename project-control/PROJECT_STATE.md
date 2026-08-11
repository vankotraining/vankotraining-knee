# Project state

## Datum poslední kontroly

`2026-08-11` (Europe/Prague), po explicitním uživatelském produkčním potvrzení funkčnosti PR #20. Produkční databáze nebyla v rámci rollout ani acceptance měněna. Uživatel současně zaznamenal neblokující UX poznámku, že akce `Upravit klienta` na první pohled nepůsobila dostatečně jako tlačítko.

## Aktuální `main` commit

Runtime-changing checkpoint po merge PR #20:

`1b48da7ed9340e8f53f591f3b427d4d6758246e1` – `Add safe client name editing (#20)`.

Následné `project-control` commity jsou docs-only a aplikační runtime ani databázi nemění.

## Aktivní větev a PR

PR #20 `Add safe client name editing` je **merged / closed**.

- feature branch: `feature/edit-client-name`;
- exact pre-merge base: `main@350d450e336d15fffcd7fc3d33ff41e342f5cd0d`;
- exact pre-merge head: `de98726c5bcd76d042b57af6f0228c505891f5ac`;
- pre-merge `behind_by: 0`;
- pre-merge PR byl mergeable;
- uživatel dne `2026-08-11` explicitně schválil přechod na nasazení;
- squash merge commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- uživatel následně dne `2026-08-11` explicitně potvrdil funkčnost na produkci.

## Produkční runtime commit

Runtime-changing production checkpoint:

- commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- deployment: `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`;
- stav: `READY`;
- target: `production`;
- branch: `main`;
- alias zahrnoval `knee.vankotraining.cz`;
- Vercel metadata potvrzují exact GitHub SHA `1b48da7ed9340e8f53f591f3b427d4d6758246e1`.

Následný docs-only produkční deployment `dpl_8EHXGTZuGpkgoFJxkVgxGGxkxjj6` je `READY` nad `main@551e99d8637397b67f85de9667ba7b81d679fb1f`; runtime kód PR #20 tím není změněn.

Technický post-rollout smoke:

- `https://knee.vankotraining.cz/` → HTTP 200;
- `https://knee.vankotraining.cz/tindeq` → HTTP 200.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

PR #20 nevyžadoval a neprovedl DB migraci, DDL, produkční datový write, změnu RLS, policies, grants ani Auth.

Fresh read-only audit před implementací potvrdil pro `public.athletes` existující:

- `display_name` a `name_key` s non-blank ochranou;
- unikátní constraint/index nad `name_key`;
- UPDATE RLS pro oprávněného Knee uživatele;
- auditní a `updated_at` UPDATE triggery.

Phase-5 Tindeq dedupe invariant zůstává beze změny.

## Aktuální fáze

PR #20 je **implementovaný v `main`, automatizovaně otestovaný na exact pre-merge headu, produkčně nasazený, technicky smoke-testovaný a produkčně uživatelsky ověřený**.

Uživatel dne `2026-08-11` po rollout explicitně potvrdil funkčnost přejmenování existujícího klienta. UX poznámka k vizuální rozpoznatelnosti tlačítka není funkční blocker a není součástí uzavřeného rollout scope.

## Implementováno v `main`

- editace `athletes.display_name` v kontextu vybraného klienta;
- synchronní přepočet `athletes.name_key` stejným normalizačním pravidlem jako při vytvoření klienta;
- UPDATE fixovaný na `athlete.id` zachycené při otevření editace;
- lokální state se mění až po potvrzeném DB úspěchu;
- vybraný klient zůstává po úspěšném přejmenování zachovaný;
- `Uložit` / `Zrušit`, odmítnutí whitespace-only jména a srozumitelná chyba při unique konfliktu;
- DB chyba nebo neočekávané ID failne closed bez korupce původního lokálního stavu;
- žádné změny profilových parametrů, měření, Tindeq parseru/persistence ani DB security.

Stávající Knee a Tindeq runtime z předchozích PR zůstává beze změny.

## Rozpracováno mimo `main`

- žádná rozpracovaná implementační změna PR #20;
- UX zvýraznění akce `Upravit klienta` je pouze zaznamenaný follow-up návrh, nikoli schválený scope.

## Nasazeno

- PR #20 runtime merge: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- runtime-changing Vercel production deployment: `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`, `READY`;
- následný docs-only deployment: `dpl_8EHXGTZuGpkgoFJxkVgxGGxkxjj6`, `READY`;
- produkční alias: `knee.vankotraining.cz`;
- technický HTTP smoke `/` a `/tindeq`: HTTP 200.

## Produkčně ověřeno

PR #20: **ano** – uživatel dne `2026-08-11` na produkci explicitně potvrdil funkčnost přejmenování klienta. Současně uvedl pouze neblokující UX připomínku, že `Upravit klienta` vizuálně nebylo na první pohled zřejmé jako tlačítko.

Dřívější produkční acceptance PR #16, parseru PR #17 a responsive opravy PR #19 zůstávají platné.

## Známé problémy

- neblokující UX discoverability: `Upravit klienta` nemusí na první pohled působit dostatečně jako tlačítko; změna zatím není schválená ani implementovaná;
- full-repo lint baseline nadále obsahuje 3 předexistující `react-hooks/set-state-in-effect` chyby a 1 warning; PR #20 nepřidal žádnou novou lint chybu ani warning;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope PR #20.

## Další krok

- PR #20 rollout je uzavřen; případné vizuální zvýraznění `Upravit klienta` řešit pouze jako samostatný schválený UX task.
