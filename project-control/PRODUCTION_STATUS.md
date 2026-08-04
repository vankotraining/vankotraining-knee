# Production status

## Produkční aplikace

- URL: `https://knee.vankotraining.cz`;
- Vercel projekt: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team: `team_alNcbbTIb9p5enXHSpEJZpLt`;
- production deployment: `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`;
- nasazený commit: `71d6b1f0e67c571c71a53db6248e526704bddabe` z `main`;
- stav deploymentu: `READY`.

## Produkční databáze

Produkční Supabase projekt `zxvndqicslyulrinbpyn` obsahoval před touto změnou migraci `20260802124337 tindeq_sessions`. Produkční schéma ani data nebyly při zjednodušení a acceptance PR #15 změněny.

## Stav PR #15

- přímé přidání Tindeq záznamu je implementováno pouze ve větvi `agent/tindeq-client-workflow`;
- běžný tok je integrován do hlavní Knee stránky u vybraného klienta;
- samostatná trasa `/tindeq/workflow` byla odstraněna;
- obecná `/tindeq` zůstává sekundárním analyzátorem;
- zúžené schéma bylo aplikováno a ověřeno pouze v bezplatném dev Supabase `twndqnmrvefhwuwuglju`;
- stabilní Vercel preview alias této větve je připojený k dev Supabase, nikoli k produkčnímu projektu;
- PR zůstává draft a je navrstvený nad PR #12;
- Vercel preview není produkční nasazení.

## Dev acceptance

Autentizovaný import přes UI, RLS zápis, načtení uloženého snapshotu a historie po reloadu prošly dne `2026-08-04` nad syntetickými daty v dev projektu. Důkazem je úspěšný GitHub Actions run `30877791921` pro commit `2ab818be45d2efc880e6e90438d50a84b203434a`.

Jednorázový testovací účet, klient, maximum a Tindeq session byly po ověření odstraněny. Tento výsledek je **ověření v dev**, nikoli produkční ověření.

## Produkčně ověřeno

Přímý import Tindeq záznamu nebyl produkčně nasazen ani produkčně ověřen. Produkční ověření lze zapsat až po řízeném merge, produkční migraci a výslovném uživatelském potvrzení autentizovaného toku.
