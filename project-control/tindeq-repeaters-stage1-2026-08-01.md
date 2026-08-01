# Tindeq Repeaters – etapa 1

Datum: 2026-08-01  
Větev: `feature/tindeq-repeaters-import`  
Draft PR: `#11`  
Produkční aplikace: `https://knee.vankotraining.cz`

## Audit před změnou

- Aplikace je Next.js 16 App Router / React 19 / TypeScript a běží ve stávajícím Vercel projektu `vankotraining-knee`.
- Klienti jsou v `public.athletes`, profily v `public.athlete_profiles` a maximální testy v `public.knee_extension_tests`.
- Existující normalizace jména používá trim, lowercase, odstranění diakritiky a sjednocení oddělovačů do pomlček. Repeaters používají stejný formát `name_key`.
- Přihlášení bylo čistě klientské přes Supabase magic link a browser storage. Route Handler z takové session nemohl bezpečně ověřit uživatele.
- Supabase projekt je sdílený s další aplikací. Stávající tabulky obsahují vedle Knee policies také obecné role `owner`/`coach`; tyto policies etapa 1 z důvodu regresního rizika nemění.
- Před etapou 1 neexistoval žádný Supabase Storage bucket.
- Výchozí stav `main`: 26 testů PASS, TypeScript a production build PASS. Lint má čtyři známé výchozí nálezy; CI porovnává přesnou signaturu s `main` a nepovolí nové nálezy.

## Implementace

### Autentizace

- Browser i server používají `@supabase/ssr`.
- Next.js `proxy.ts` obnovuje cookie session.
- PKCE kód se vyměňuje na serveru na `/auth/callback` a pro zpětnou kompatibilitu také na `/`.
- Import používá `supabase.auth.getUser()` a nepovoluje anonymní upload.

### Datový model a Storage

Migrace `20260801_tindeq_repeaters_stage1.sql` přidává:

- `tindeq_repeaters_sessions`,
- `tindeq_repetitions`,
- `tindeq_import_errors`,
- privátní bucket `tindeq-raw`,
- RLS policies vázané na `owner_user_id = auth.uid()` a současné `is_knee_admin()`.

Projekt zatím nemá organizační model pro Knee. První verze proto používá uživatelský scope a unikátní `(owner_user_id, file_hash)`. Budoucí multi-tenant verze může scope rozšířit o `organization_id` bez změny původních ZIPů.

Původní ZIP se ukládá beze změny do:

`{userId}/{measurementId}/original.zip`

Časová řada se neduplikuje po vzorcích do PostgreSQL. PostgreSQL obsahuje metadata, souhrn série a agregované metriky jednotlivých opakování. Budoucí přepočet načte původní ZIP a vytvoří novou verzi analýzy.

### Import a analýza

- Jeden serverový endpoint `POST /api/import/tindeq` přijímá `multipart/form-data`.
- Podporuje jeden export i ZIP obsahující více jednotlivých ZIP exportů.
- Validuje `info.csv` a `data_set_1.csv` a vrací stabilní chybové kódy.
- SHA-256 původního jednotlivého exportu zabraňuje duplicitám.
- Chybějící tag vytvoří nepřiřazenou session; čitelný nový tag vytvoří klienta.
- Vzorkovací frekvence se počítá z mediánu časových rozdílů.
- Analytická vrstva zachovává raw data, používá přibližně 100ms vyhlazení a centrální konfigurační heuristiky.
- Výpočet zahrnuje průměr, relativní plnění cíle, medián, SD, CV, MAD, RMSE, čas v ±5/±10 %, čas do 90/95 %, přestřelení, nedosažení, drift a délku intervalu.
- Konec záznamu bez relaxace není neplatný, pokud byla dokončena pracovní doba.
- Každá session ukládá verzi parseru, segmentace, metrik a datum analýzy.

### UI

- Na hlavní obrazovce je dominantní mobilní akce `Nahrát Tindeq ZIP` bez předchozího formuláře.
- UI zobrazuje stavy nahrávání, kontroly, analýzy, ukládání a dokončení.
- Po importu se otevře detail session; duplicita otevře existující detail s informací o duplicitě.
- Detail obsahuje nastavení protokolu, souhrn série, upozornění a metriky opakování.
- Bolest a RPE rozlišují `null`, `0` a `1–10`.

## Bezpečnostní rozhodnutí

- Service-role klíč se nepoužívá a není přidán do frontendového kódu.
- Bucket je privátní a cesta začíná `auth.uid()`; RLS dovoluje pouze SELECT/INSERT/DELETE vlastních objektů.
- Technický detail importní chyby je pouze v server logu a chráněné tabulce.
- Next.js byl aktualizován z `16.2.10` na bezpečnostně opravený `16.2.12`; `eslint-config-next` je na stejné verzi.
- Produkční dependency tree používá overrides `postcss@8.5.18` a `sharp@0.35.0`; `npm audit --omit=dev --audit-level=high` vrací 0 zranitelností.
- Stávající širší policies sdílené databáze nebyly automaticky odstraněny. Je vhodné je samostatně auditovat s ohledem na druhou aplikaci.

## Automatické ověření

Finální ověřený stav feature větve:

- 37/37 testů PASS,
- TypeScript kontrola PASS,
- žádný nový lint nález proti `main`,
- production dependency audit: 0 zranitelností,
- Next.js production build PASS,
- izolovaný databázový integrační job PASS.

Automatické testy používají syntetické anonymní ZIP fixtures a pokrývají:

- validní jednotlivý ZIP,
- více exportů v jednom ZIPu,
- chybějící `info.csv`,
- chybějící `data_set_1.csv`,
- poškozenou časovou řadu,
- chybějící tag,
- normalizaci s diakritikou,
- bilaterální měření,
- neúplný interval,
- konec bez relaxace,
- bolest `null`, `0` a `1–10`,
- duplicitní upload vracející existující session,
- odmítnutí uploadu bez autentizované session.

GitHub Actions navíc spouští čistou lokální Supabase instanci, aplikuje migraci a ověřuje RLS, privátní Storage, izolaci vlastníků, duplicitu a databázové constraints. Workflow run `30716054045` je PASS.

## Bezplatné hostované preview

V organizaci `vanko-training` byl založen samostatný bezplatný Supabase projekt:

- název: `tindeq-repeaters-preview`,
- project ref: `ednbxwvvzomvdkjdybau`,
- region: Frankfurt (`eu-central-1`),
- cena: `0 USD / měsíc`,
- neobsahuje produkční klientská data.

Do projektu byly aplikovány pouze minimální Knee tabulky potřebné pro preview, Tindeq migrace a privátní bucket. Supabase security advisors po úpravách nevracejí žádný nález.

Vercel preview používá tento projekt pouze tehdy, když současně platí:

- `VERCEL_ENV=preview`,
- `VERCEL_GIT_COMMIT_REF=feature/tindeq-repeaters-import`.

Produkční build ani jiné větve se touto konfigurací nemění. Preview deployment pro commit `06e6df0` je READY a zobrazuje samostatné testovací přihlášení.

Preview URL:

`https://vankotraining-knee-ntsm1xvt0-vankotrainings-projects.vercel.app`

## Ruční end-to-end gate

Reálné klientské exporty nejsou součástí veřejného repozitáře ani CI. Před přijetím PR zbývá ručně ověřit:

1. přihlášení do testovacího preview,
2. upload jednoho reálného privátního Tindeq ZIPu,
3. otevření detailu měření,
4. opakovaný upload stejného ZIPu a návrat existující session,
5. fyzickou existenci původního ZIPu v privátním bucketu,
6. uložení bolesti, RPE a poznámky.

Po dokončení tohoto gate lze rozhodnout o produkční migraci. Produkční Supabase projekt zatím nebyl změněn.

## Známá omezení a další etapa

Etapa 2 (PWA manifest a Android Web Share Target) nebyla zahájena, protože ještě chybí ruční end-to-end test s reálným privátním ZIPem. Grafy, klientská historie Repeaters a ruční správa nepřiřazených měření patří do etapy 3.
