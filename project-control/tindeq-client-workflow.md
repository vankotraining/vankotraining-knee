# Přímé Tindeq záznamy klienta

## Rozsah

PR #15 přidává Tindeq jako další typ záznamu přímo k vybranému klientovi v hlavní Knee aplikaci. Nevytváří druhou klientskou aplikaci ani samostatný tréninkový plánovač.

## Uživatelský tok

1. Uživatel vybere klienta v existujícím Knee přehledu.
2. V sekci `Tindeq záznamy klienta` otevře import.
3. Nahraje Tindeq ZIP.
4. Vybere stranu a případně historické maximum klienta.
5. Volitelně doplní procento maxima a bolest.
6. Zkontroluje vypočtené metriky a uloží výsledek.
7. Záznam je ihned dostupný v historii stejného klienta.

Klient je určen před importem. Název souboru ani tag se nepoužívají k automatickému přiřazování.

## Reference

Reference má tři povolené stavy:

- bez reference: technická analýza bez metrik vůči maximu a cíli;
- reference bez procenta: procento dosaženého maxima, ale bez cílové síly;
- reference s procentem: snapshot maxima, procenta a vypočteného cíle.

Samostatná tabulka `tindeq_prescriptions` není potřebná. Vznikne až v budoucnu, pokud aplikace začne předpis vytvářet před cvičením a následně jej párovat s výsledkem.

## Persistence

Ukládá se normalizovaný výsledek do `public.tindeq_sessions`:

- zvolená strana;
- volitelný referenční snapshot;
- metriky síly, konzistence a únavy;
- volitelná bolest;
- SHA-256 fingerprint.

Původní ZIP ani raw časová řada se neukládají. Aktivní duplicita stejného normalizovaného výsledku u stejného klienta je blokována před zápisem i unikátním indexem.

## Bezpečnost

- RLS zůstává zapnuté;
- zápis je povolen pouze oprávněnému přihlášenému uživateli;
- reference musí patřit stejnému aktivnímu klientovi a odpovídat uloženému datu testu;
- soft delete a auditní model existujícího Tindeq ukládání zůstávají zachovány.

## Ověření v bezplatném dev Supabase

Projekt `twndqnmrvefhwuwuglju`:

- odstraněna nadbytečná tabulka předpisů a obsolete vazby;
- ověřeno RLS;
- ověřen zápis bez reference;
- ověřen zápis s referencí bez procenta;
- ověřen zápis s referencí, procentem, cílem a skutečnou bolestí `0`;
- acceptance transakce byla vrácena rollbackem.

Produkční Supabase nebyl změněn.
