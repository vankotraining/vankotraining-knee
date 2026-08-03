# Vanko Training Knee

Samostatný projekt pro `knee.vankotraining.cz`.

## Účel

Projekt drží kód specializované Knee aplikace odděleně od veřejného webu a tréninkové aplikace. Produkční aplikace používá sdílený Supabase projekt, ale aplikační kód, routing a deployment zůstávají samostatné.

## Lokální spuštění

```bash
npm install
npm run dev
```

Výchozí adresa: `http://localhost:3000`.

## Prostředí

Vytvoř `.env.local` podle `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Zdroje pravdy projektu

Začni v [`project-control/README.md`](project-control/README.md). Aktuální stav je pouze v [`project-control/PROJECT_STATE.md`](project-control/PROJECT_STATE.md) a produkční stav pouze v [`project-control/PRODUCTION_STATUS.md`](project-control/PRODUCTION_STATUS.md). Historické checkpointy a feature dokumenty jsou evidence, nikoli aktuální backlog.
