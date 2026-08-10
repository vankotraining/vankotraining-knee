# Tindeq metric interpretation states — 2026-08-08

## Zdroj pravdy

- Původní výchozí `main`: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`.
- Pracovní větev: `agent/tindeq-metric-statuses`.
- PR: #16 `Tindeq: clarify metric interpretation states`.
- Původní head před reconciliation: `904da6768fe72ed86973c93fb164dea5e1eacc87`.
- Fresh `main` při reconciliation dne `2026-08-10`: `2aad506dd482e765c61036a84b6a39a5635c90cf`.
- Reconciliation kódový checkpoint: `88dc6cce27321306f4770285c3d35d904022f669`.
- Final docs-only PR head před merge: `bfc9ba06f165a7659dcf2451a8cc2fdeb9ddf4cc`.
- Merge commit: `6c2a08352b509d51336e368771edc6e804006008`.
- Production deployment merge commitu: `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`, `READY`.

## Cíl změny

Rozšířit `/tindeq` o konzistentní, textově čitelné stavové hodnocení rozhodovacích metrik bez falešného dojmu, že každá Tindeq hodnota má univerzální klinickou hranici dobré/špatné.

Uživatelský model je výslovně:

**3stupňová barevná škála + neutrální stav.**

- zelená = v pořádku / v cílovém rozmezí;
- oranžová = hraniční / vyžaduje pozornost;
- červená = problém / výrazná odchylka;
- šedá = neutrální stav pro metriku, kterou nelze korektně klasifikovat jako dobrou nebo špatnou.

Šedá není čtvrtý hodnoticí stupeň.

## Implementace

- Interní centralizovaný tón: `good | warning | problem | neutral`.
- Centralizovaný typ významu: `protocol | contextual | descriptive`.
- Viditelné textové labely podle významu, např. `V cíli`, `Sleduj`, `Mimo cíl`, `Bez hodnocení`.
- Výsledek pro klienta a odpovídající UI používají explicitní legendu `3stupňová barevná škála + neutrální stav`.
- Chybějící klinický/protokolový kontext a nehodnotitelná data jsou neutrální; technicky vadný záznam je oddělen od patologického nálezu.
- Pokud není známá platná délka pracovního intervalu, chybějící `timeTo95Seconds` se neinterpretuje jako červené `Cíl nedosažen`; při známém intervalu a skutečně nedosaženém 95% cíli zůstává stav červený.
- Barva je sekundární nosič informace; rozhodující jsou text, badge a vysvětlivka.
- `src/lib/tindeq-report.ts` / `tindeq-report-v1` se tímto PR výpočetně nemění.

## Metriky s pracovním stavem

- dosažení cílové síly;
- čas v cílovém pásmu;
- úspěšnost opakování;
- CV uvnitř kontrakce;
- CV mezi opakováními;
- kombinovaný vývoj série;
- technické flagy / důvěra v záznam;
- reakce bolesti při úplných datech;
- souhrnné findingy a doporučení kanonického reportu.

## Metriky záměrně bez automatické klinické klasifikace

- předchozí maximum / MVIC;
- předepsaná intenzita;
- cílová síla;
- absolutní průměrná síla;
- samotný počet úspěšných opakování `x/y`;
- samostatný trend série;
- první–poslední;
- změna času v pásmu;
- rozdíl náběhu stran;
- rozdíl normalizovaného výkonu stran;
- rozdíl absolutní průměrné síly stran.

`normalizedSideDifferencePctPoints` je rozdíl plnění vlastního cíle obou stran, nikoli LSI.

## Pracovní pravidla protokolu

Hranice jsou transparentní pracovní pravidla aplikace, ne validované klinické normy:

- dosažení cíle: 95–105 % `good`; 90–<95 % nebo >105–110 % `warning`; mimo rozsah `problem`;
- čas v cíli: ≥60 % `good`; 40–59 % `warning`; <40 % `problem`;
- úspěšnost opakování: ≥70 % `good`; 50–69 % `warning`; <50 % `problem`;
- CV uvnitř kontrakce: ≤5 % stabilní; >5–8 % sledovat; >8 % vysoká variabilita;
- CV mezi opakováními: ≤8 % stabilní; >8–12 % sledovat; >12 % vysoká variabilita;
- technické flagy: ≤10 % technicky v pořádku; >10–30 % sledovat; >30 % nízká důvěra;
- bolest: stávající pracovní toleranční logika `tindeq-report-v1`; chybějící údaje = `Bez hodnocení`;
- kombinovaný vývoj série: stávající algoritmus `tindeq-report-v1`; UI jej neprezentuje jako přímé měření fyziologické únavy.

## Výpočet a data

- `src/lib/tindeq-report.ts` se PR #16 nemění.
- Databázové schéma, persistence, auth a environment variables se PR #16 nemění.
- Parserové pravidlo PR #17 je zachované.
- Responsive navigace PR #19 je zachovaná.
- Reakce další ráno nebyla přidána, protože není v aktuálním datovém modelu.

## Reconciliation 2026-08-10

Původní PR vznikl proti staršímu `main`. Reconciliation byla provedena proti exact `main@2aad506...` tak, aby výsledný strom zachoval parser PR #17, responsive navigaci PR #19 a pouze přenesl scope PR #16.

Kódový reconciliation commit `88dc6cce...` má rodiče původní PR head `904da676...` a `main@2aad506...`. Fresh compare potvrdil `behind_by: 0` a stejný 13souborový scope PR #16 bez rollbacku parseru nebo mobilní navigace.

## Pre-merge ověření

Final exact PR head: `bfc9ba06f165a7659dcf2451a8cc2fdeb9ddf4cc`.

- GitHub PR: `mergeable: true`, `behind_by: 0`;
- `Project control` run 70: `success`;
- `Verify Tindeq client view` run 214: `success`;
- Vercel Preview `dpl_2k8WvSyHCaPrTM8uxNEXtyFaamNs`: `READY`;
- uživatel Preview funkčně zkontroloval a potvrdil `v pořádku`;
- uživatel následně dal explicitní souhlas s merge.

## Merge a produkční rollout 2026-08-10

PR #16 byl převeden z draftu na ready a mergnut pouze za použití očekávaného head SHA `bfc9ba06...`.

GitHub:

- PR #16: `merged: true`, `closed`;
- merge commit: `6c2a08352b509d51336e368771edc6e804006008`;
- `main` po merge ukazoval přesně na `6c2a08352...`.

Vercel:

- production deployment: `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`;
- state: `READY`;
- target: `production`;
- GitHub SHA: `6c2a08352b509d51336e368771edc6e804006008`;
- alias zahrnuje `knee.vankotraining.cz`.

Technický production smoke:

- `/tindeq` → HTTP 200;
- `/tindeq/reports/demo` → HTTP 200;
- demo HTML obsahuje `tindeq-report-v1`, status badge, typy pravidel a vysvětlivky PR #16.

## Preview / produkce

- Preview review: **uživatelsky schváleno před mergem**.
- Implementováno v `main`: **ano**.
- Produkčně nasazeno: **ano**, `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`, `READY`.
- Technicky produkčně ověřeno: **ano** (deployment metadata + HTTP smoke).
- Uživatelské produkční funkční ověření po rollout: **zatím ne**; vyžaduje samostatné explicitní potvrzení uživatele podle projektového acceptance pravidla.
