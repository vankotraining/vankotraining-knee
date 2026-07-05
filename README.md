# Vanko Training Knee

Samostatny projekt pro `knee.vankotraining.cz`.

## Ucel

Projekt drzi kod pro specializovanou knee aplikaci oddelene od:

- `vankotraining.cz` - verejny osobni web
- `app.vankotraining.cz` - treninkova aplikace pro klienty
- `knee.vankotraining.cz` - koleno, rehabilitacni guidance, testy a framework

Data klientu mohou pozdeji zustat ve spolecne databazi, ale aplikacni kod ma byt
oddeleny.

## Lokalni spusteni

```bash
npm install
npm run dev
```

Vychozi adresa:

```text
http://localhost:3000
```

## Env

Vytvor `.env.local` podle `.env.example`, pokud bude projekt cist data ze
Supabase.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Rizeni projektu

Rizeni, rozhodnuti, domenu a backlog drzime ve slozce `project-control`.
