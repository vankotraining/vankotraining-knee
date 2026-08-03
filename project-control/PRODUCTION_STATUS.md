# Production status

## Produkční aplikace

- URL: `https://knee.vankotraining.cz`;
- Vercel projekt: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team: `team_alNcbbTIb9p5enXHSpEJZpLt`;
- production deployment: `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`;
- nasazený commit: `71d6b1f0e67c571c71a53db6248e526704bddabe` z `main`;
- stav deploymentu: `READY`.

## Produkční databáze při zahájení práce

Supabase projekt `zxvndqicslyulrinbpyn` obsahoval aplikovanou migraci `20260802124337 tindeq_sessions`. Relevantní tabulky `athletes`, `athlete_profiles`, `knee_extension_tests` a `tindeq_sessions` měly zapnuté RLS. `tindeq_sessions` měla při kontrole 0 řádků.

## Stav této změny

- nové klientské Tindeq workflow není součástí produkčního `main`;
- produkční runtime nebyl touto větví změněn;
- připravená migrace `20260803_tindeq_client_workflow.sql` není vydávána za aplikovanou, dokud to nepotvrdí skutečná historie migrací a kontrola schématu;
- Vercel preview není vydáváno za produkční nasazení;
- anonymní HTTP odpověď ani READY deployment nejsou vydávány za produkční ověření klientského workflow.

## Produkčně ověřeno

Toto propojené workflow nebylo produkčně ověřeno. Produkční ověření lze zapsat až po výslovném uživatelském potvrzení autentizovaného toku od klienta a maxima po znovuotevření uloženého Tindeq výsledku.
