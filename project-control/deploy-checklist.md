# Deploy Checklist

## GitHub

Repo:

```text
vankotraining/vankotraining-knee
```

Po vytvoreni prazdneho repozitare na GitHubu:

```bash
git push -u origin main
```

## Vercel

1. Vytvor novy Vercel project.
2. Importuj repo `vankotraining/vankotraining-knee`.
3. Framework preset: `Next.js`.
4. Production branch: `main`.
5. Root directory: `/`.
6. Pridej domenu `knee.vankotraining.cz`.

## DNS

V Active24 nech spravu DNS pripravenou pro:

```text
knee.vankotraining.cz
```

Konkretni DNS zaznam doplnime podle toho, co Vercel ukaze po pridani domeny.

## Supabase

Zatim nerozhodnuto:

- varianta A: sdilena databaze s treninkovou aplikaci
- varianta B: samostatna databaze pro knee projekt

Vychozi preference: sdilena databaze pouze pro klienty a identitu, specializovana
knee data oddelit tabulkami nebo schematem.
