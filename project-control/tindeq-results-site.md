# Tindeq results site — PR #12 ZIP-only evidence

> [!IMPORTANT]
> Tento dokument je implementační a ověřovací evidence k PR #12, nikoli autoritativní zdroj aktuálního stavu. Aktuální stav je v [`PROJECT_STATE.md`](./PROJECT_STATE.md) a produkční stav v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md). Exact-head SHA, CI runy a preview deployment aktuálního PR se vedou v popisu PR #12.

## Identifikace

- Repository: `vankotraining/vankotraining-knee`
- Base branch: `main`
- Clean-rebuild base SHA: `7e11aa88fb0c14b5216542d4e03101aee082ec17`
- Working branch: `agent/tindeq-results-site`
- Draft PR: `#12`
- Backup původního experimentálního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`
- Produkční Vercel projekt: `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`)
- Produkční Supabase: `zxvndqicslyulrinbpyn`
- Dev Supabase: `twndqnmrvefhwuwuglju`

Git commit nemůže autoritativně obsahovat vlastní SHA ani budoucí CI evidence. Finální exact-head evidence se proto zapisuje do popisu PR #12 až po dokončení změn.

## Závazný ZIP-only tok

Jediný podporovaný vstup skutečných Tindeq dat je **ZIP exportovaný z Tindeq**:

`File (.zip)` → lokální validace/rozbalení → `info.csv` + `data_set_*.csv` → normalizovaná `TindeqSession` → kontrolní náhled → explicitní výběr klienta → explicitní save → historie → klientský pohled → trenérský detail → `tindeq-report-v1`.

PR #12 nesmí zavést ruční Tindeq session, Bluetooth/live měření, automatické přiřazení nebo předvýběr klienta, ukládání původního ZIPu/raw časové řady, plánovač ani paralelní workflow.

## Persistence

- ZIP se analyzuje pouze v prohlížeči.
- Raw časová řada se do DB neukládá.
- Klient se určuje pouze explicitním ručním výběrem.
- Tag je pouze kontrolní informace.
- Save validuje parserový tvar, supported unit/version, opakování, 101bodové křivky a absenci `NaN`/`Infinity`.
- `raw_metadata.importSource = "tindeq-zip"` označuje podporovaný původ.
- Deterministické parser session ID má formát přesně 20 lowercase hex znaků.

## Fáze 3 — clean-code refactor

`TindeqAnalyzer.tsx` byl rozdělen podle odpovědností. Výsledkový panel, graf, side cards a prezentační utility jsou samostatné; vizuální tón se již neurčuje fuzzy parsováním českých textů, ale explicitním `good | warning | problem | neutral` stavem.

Parser, persistence payload, auth flow a `tindeq-report-v1` zůstaly funkčně zachovány.

## Fáze 4 — dev DB alignment a environment guard

Dev `twndqnmrvefhwuwuglju` byl srovnán s kanonickým ZIP-only schématem. PR #15-only sloupce/indexy/constraints a široké grants byly odstraněny bez změny kanonického obsahu existujícího Tindeq řádku.

Environment guard nyní před mountem workspace fail-closed ověřuje hostname/path i project ref parsovaný z `NEXT_PUBLIC_SUPABASE_URL`:

- produkce → pouze `zxvndqicslyulrinbpyn`;
- preview/localhost → pouze `twndqnmrvefhwuwuglju`.

Vercel Preview env value stále není dostupným read-only konektorem nezávisle potvrzená, takže reálná write acceptance zůstává blokovaná.

## Fáze 5 — DB-level deduplikace

### Identita uložené session

Databázová identita jednoho aktivního Tindeq ZIP výsledku je:

`(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId')`.

Tato trojice přesně odpovídá aplikačnímu duplicate lookupu v `src/lib/tindeq-persistence.ts`.

### Verzovaná migrace

Repo obsahuje:

- `supabase/migrations/20260807_tindeq_active_session_unique.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_precheck.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_checks.sql`.

Migrace před změnou sama fail-closed kontroluje:

1. zda každý existující řádek má `raw_metadata.tindeqSessionId` ve formátu `^[0-9a-f]{20}$`;
2. zda už neexistují dva aktivní řádky se stejnou databázovou identitou.

Migrace žádné řádky nemaže, nepřepisuje ani automaticky nededuplikuje. Při nekonzistenci se zastaví.

### Check constraint

`tindeq_sessions_source_session_id_valid` vyžaduje u každého `tindeq_sessions` řádku platný 20znakový lowercase hex `raw_metadata.tindeqSessionId`.

Tím se zabrání obejití unikátního invariantu přes chybějící nebo neplatnou zdrojovou identitu.

### Partial unique index

`tindeq_sessions_active_source_session_uidx` je unique expression index nad:

- `athlete_id`;
- `analysis_version`;
- `raw_metadata ->> 'tindeqSessionId'`;

s predikátem `WHERE deleted_at IS NULL`.

Soft-deleted řádky jsou záměrně mimo unikátní množinu. To zachovává stávající soft-delete chování:

- archivovaný ZIP lze později znovu importovat jako nový aktivní řádek;
- restore staršího archivovaného řádku je DB invariantem odmítnut, pokud už existuje jiný aktivní řádek se stejnou identitou.

### Aplikační race recovery

Předběžný `findDuplicate()` zůstává kvůli rychlé idempotentní odpovědi. Atomickou ochranu ale poskytuje DB index.

Pokud dva requesty současně projdou pre-checkem, druhý insert může dostat PostgreSQL `unique_violation` / kód `23505`. Aplikace potom provede nový exact duplicate lookup:

- pokud najde vítězný aktivní řádek, vrátí `ok: true, duplicate: true`;
- pokud řádek nenajde, původní `23505` nezamaskuje a vrátí chybu.

Testy kryjí oba scénáře.

### Dev databáze — aplikováno a ověřeno

Na dev Supabase `twndqnmrvefhwuwuglju` byla po čistém pre-checku aplikována migrace:

`20260807170014 tindeq_active_session_unique`.

Pre-check:

- `1` Tindeq řádek / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups.

Post-check:

- constraint existuje a je validated;
- unique partial index existuje;
- `1` Tindeq řádek / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups.

Byly provedeny dva databázové enforcement probes bez trvalého testovacího zápisu:

1. druhý aktivní insert se stejnou identitou byl odmítnut `unique_violation` a počet řádků zůstal `1`;
2. insert s neplatným `tindeqSessionId` byl odmítnut `check_violation` a počet řádků zůstal `1`.

Security/performance advisors po migraci nepřidaly žádný phase-5 specifický problém. Zůstávají pouze dříve evidované SECURITY DEFINER/leaked-password warningy a nepoužitý `tindeq_sessions_analysis_version_idx`; nejsou rozsahem této fáze.

### Produkce — pouze připraveno, neaplikováno

Produkční Supabase `zxvndqicslyulrinbpyn` má při posledním phase-5 read-only pre-checku:

- PostgreSQL `17.6`;
- `0` Tindeq řádků;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups.

Produkční migration history stále končí Tindeq migrací `20260802124337 tindeq_sessions`. Phase-5 dedupe migrace **nebyla na produkci aplikována**.

Před případnou produkční aplikací je nutné znovu provést fresh pre-check a zálohovací/rollback gate podle `operations.md` a získat samostatné výslovné schválení uživatele.

### Rollback / mitigation

Phase-5 migrace nepřepisuje data. Případný samostatně schválený rollback odstraní pouze:

1. index `tindeq_sessions_active_source_session_uidx`;
2. constraint `tindeq_sessions_source_session_id_valid`.

Existující Tindeq data se rollbackem nemění.

## Otevřené merge gates po fázi 5

- produkční DB-level dedupe zůstává připravená, ale neaplikovaná bez explicitního approval gate;
- Vercel Preview Supabase ref je potřeba nezávisle potvrdit před write acceptance;
- repo stále nemá autentický npm lockfile;
- druhý Vercel projekt `vankotraining-knee-mxei` vyžaduje samostatnou konsolidaci;
- reálný magic-link + skutečný ZIP acceptance následují až na bezpečně potvrzeném exact-head preview.
