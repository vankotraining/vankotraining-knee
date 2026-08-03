# Project state

## Datum kontroly

`2026-08-03` (Europe/Prague)

## Výchozí stav

- `main`: `71d6b1f0e67c571c71a53db6248e526704bddabe`;
- Tindeq runtime: draft PR #12, větev `agent/tindeq-results-site`, výchozí head `e368500e8c138930d675e9336d4a02dd70e4c3a8`;
- kanonické zdroje pravdy: draft PR #14, větev `agent/project-control-sources-of-truth`;
- aktuální práce: stacked větev `agent/tindeq-client-workflow` založená na headu PR #12.

## Implementováno ve větvi `agent/tindeq-client-workflow`

- nová cesta `/tindeq/workflow` pro klienta, antropometrii, maximum, předpis, import a historii;
- ruční maximum se zdrojovou jednotkou `kg`, `N` nebo `lb`, normalizací do kg a výpočty Nm, Nm/kg, asymetrie a slabší strany;
- historické předpisy intenzity podle vybrané strany a konkrétního maxima;
- přesná shoda jména po trimu, sjednocení opakovaných mezer a ignorování velikosti písmen;
- explicitní ruční potvrzení klienta před uložením;
- volitelná bolest před, během a po cvičení;
- normalizované metriky série a snapshot interpretace;
- deterministická ochrana proti duplicitě pomocí SHA-256 otisku;
- aditivní Supabase migrace a kontrolní SQL;
- jednotkové, persistence a Playwright testy;
- samostatné GitHub Actions workflow pro stacked větev.

## Databáze

Aplikováno v produkčním Supabase před touto změnou:

- `20260802124337 tindeq_sessions`.

Připraveno v této větvi, ale v okamžiku vytvoření dokumentu ještě neaplikováno:

- `supabase/migrations/20260803_tindeq_client_workflow.sql`.

Migrace je aditivní. Doplňuje momenty a zdrojovou jednotku maxima, vytváří `tindeq_prescriptions`, přidává snapshoty a deduplikaci do `tindeq_sessions` a zpřesňuje RLS vazby na klienta, stranu a referenci.

## Stavové pojmy

- **implementováno ve větvi**: změna je v `agent/tindeq-client-workflow`;
- **implementováno v main**: až po merge do `main`;
- **automatizovaně otestováno**: až po úspěšném příslušném GitHub Actions runu;
- **databáze aplikována**: až po aplikaci migrace v Supabase a kontrole skutečného schématu/RLS;
- **preview nasazeno**: pouze READY Vercel preview navázané na přesný head commit;
- **produkčně nasazeno**: pouze production deployment daného commitu;
- **produkčně ověřeno**: pouze po výslovné uživatelské kontrole autentizovaného workflow.

## Právě jeden další krok

Po úspěšném CI aplikovat aditivní migraci, ověřit její SQL kontroly a provést autentizovaný acceptance tok na exact-head preview; produkční merge zůstává mimo tento krok.
