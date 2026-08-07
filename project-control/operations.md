# Provozní dokumentace knee.vankotraining.cz

Tento dokument popisuje aktuální provozní postupy. Aktuální projektový stav je v [`PROJECT_STATE.md`](./PROJECT_STATE.md) a produkční stav v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

## 1. Kde projekt běží

| Oblast | Kanonický cíl |
| --- | --- |
| GitHub | `vankotraining/vankotraining-knee` |
| Produkční doména | `knee.vankotraining.cz` |
| Produkční Vercel projekt | `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`) |
| Produkční Supabase | `zxvndqicslyulrinbpyn` |
| Vývojový Supabase | `twndqnmrvefhwuwuglju` |
| Stack | Next.js App Router, React, TypeScript, Supabase, Vercel |

Druhý Vercel projekt napojený na stejné repo není kanonický deployment cíl. Jeho aktuální stav a plán konsolidace jsou vedeny v `PROJECT_STATE.md`.

## 2. Environment variables

Aplikace používá zejména:

- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Pravidla:

- produkční Vercel musí používat produkční Supabase;
- preview Vercel nesmí zapisovat, dokud není nezávisle potvrzeno, že používá vývojový Supabase;
- localhost smí používat pouze explicitně schválené vývojové prostředí;
- hodnoty klíčů se nezapisují do dokumentace, logů ani PR evidence;
- existující legacy fallback v runtime je známý technický dluh, nikoli schválený způsob konfigurace.

Při incidentu nejdříve ověř skutečný deployment, hostname a project ref odvozený z `NEXT_PUBLIC_SUPABASE_URL`; nespoléhej pouze na název environmentu v dashboardu.

## 3. Supabase databáze

Hlavní Knee tabulky zahrnují:

- `public.athletes`;
- `public.athlete_profiles`;
- `public.knee_extension_tests`;
- `public.tindeq_sessions`.

Aktivní aplikační záznamy používají soft delete. Běžný uživatelský tok nesmí fyzicky mazat klientská nebo měřicí data.

Produkční Supabase je sdílený s dalšími částmi ekosystému. Každá změna proto musí mít přesně omezený rozsah a nesmí opravovat nesouvisející objekty jen proto, že je odhalí advisor.

## 4. Záloha a kontrola dat

Před schválenou produkční DDL nebo datovou změnou:

1. ověř aktuální počet relevantních řádků a stav schématu;
2. vytvoř nebo ověř použitelnou zálohu/export relevantních dat;
3. zkontroluj migrační SQL a rollback/obnovovací postup;
4. zaznamenej přesný cílový Supabase project ref;
5. teprve poté žádej explicitní schválení produkční změny.

Existující ruční export Knee dat používá `public.knee_data_export` a dokument [`manual-data-export.md`](./manual-data-export.md). Historický exportní SQL artefakt není náhradou za verzovanou migraci schématu.

## 5. Databázové změny

### Kanonické pravidlo

Veškeré nové změny databázového schématu musí mít explicitní verzovaný soubor v `supabase/migrations/` a odpovídající kontrolní SQL, pokud je potřeba. Ad-hoc produkční DDL v Supabase SQL Editoru není podporovaný postup.

Produkční databázi neměň bez explicitního schválení uživatele.

Před aplikací migrace musí být doloženo:

- proč je změna potřebná;
- přesný migrační soubor;
- cílový Supabase project ref;
- očekávaný diff schématu;
- dopad na existující data;
- kontrolní SQL;
- rollback nebo obnovovací postup;
- stav před změnou včetně relevantních počtů řádků.

Po aplikaci:

1. ověř migrační historii a skutečné schéma;
2. spusť databázové checks;
3. spusť Supabase security advisors;
4. spusť Supabase performance advisors;
5. ověř RLS, grants, indexy a relevantní počty dat;
6. aktualizuj `PROJECT_STATE.md` a při produkční změně také `PRODUCTION_STATUS.md`.

SQL Editor lze použít pro read-only auditní a kontrolní dotazy. Schéma nebo produkční data se jím nesmí měnit mimo předem schválený, verzovaný migrační postup.

## 6. Produkční kontrola

Výchozí produkční kontrola je neinvazivní:

1. ověř, že produkční doména odpovídá očekávanému Vercel projektu;
2. ověř přesný nasazený commit a stav `READY`;
3. otevři produkční stránku a zkontroluj, že nejde o error page;
4. podle potřeby ověř přihlášení a čtení bez vytváření či změny klientských dat;
5. zkontroluj runtime chyby relevantní k nasazenému commitu.

Produkční zápis, vytvoření testovacího klienta, měření, archivace, obnova nebo jiná mutace se provádí pouze po explicitním schválení. `READY` deployment ani automatizovaný test se neoznačuje jako produkčně ověřený.

## 7. Preview acceptance

Zápisová acceptance Tindeq se provádí pouze na exact-head preview a až po nezávislém potvrzení, že preview používá vývojový Supabase project ref.

Acceptance data musí být jasně testovací, minimální a po dokončení odstraněna. Produkční klientská data se do dev prostředí nekopírují.

## 8. Incident postup

### Aplikace nejde otevřít

1. ověř produkční doménu a Vercel alias;
2. ověř poslední produkční deployment a jeho commit;
3. zkontroluj build/runtime chyby;
4. DNS řeš pouze při doloženém problému s doménou.

### Nejde přihlášení

1. ověř hostname, Supabase project ref a redirect URL;
2. ověř Supabase Auth konfiguraci;
3. ověř, že callback vrací uživatele na očekávanou Knee doménu a route;
4. neměň produkční Auth konfiguraci bez explicitního rozsahu a následného ověření.

### Neukazují se data

1. ověř platnou session;
2. ověř správný Supabase project ref;
3. ověř skutečné tabulky, RLS a policies;
4. ověř filtry aktivních záznamů (`deleted_at is null`);
5. teprve poté řeš aplikační dotaz.

### Databázový drift

1. porovnej skutečné schéma s repo migracemi;
2. rozděl rozdíly na schválené, historické manuální a nechtěné;
3. nepřepisuj produkci ad-hoc;
4. připrav explicitní srovnávací migraci a rollback;
5. produkční DDL proveď až po schválení.

## Minimální provozní pravidla

- zdroj pravdy je skutečný runtime, databáze a aktuální repo, ne starý prompt;
- nové schema změny pouze přes `supabase/migrations/`;
- produkční DDL a produkční zápis pouze po explicitním schválení;
- preview zápis pouze po potvrzení dev Supabase;
- po každé významné změně eviduj přesný commit, deployment a databázový stav;
- produkčně ověřeno znamená pouze výslovné uživatelské potvrzení.
