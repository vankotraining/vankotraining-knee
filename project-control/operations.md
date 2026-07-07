# Provozni dokumentace knee.vankotraining.cz

Datum doplneni: 2026-07-07

Tento dokument je prakticky provozni navod pro vlastnika projektu. Neni to proces pro velky tym. Cilem je vedet, kde projekt bezi, co zkontrolovat po zmene a co delat, kdyz se neco rozbije.

## Struktura dokumentace

1. Kde projekt bezi
2. Env promenne
3. Supabase databaze
4. Zaloha a export dat
5. Migrace a SQL zmeny
6. Produkcni kontrola po zmene
7. Zakladni incident postup

## 1. Kde projekt bezi

| Oblast | Stav |
| --- | --- |
| GitHub repo | `vankotraining/vankotraining-knee` |
| Produkcni domena | `knee.vankotraining.cz` |
| Vercel | samostatny Vercel projekt napojeny na knee repo |
| Supabase | projekt s URL `https://zxvndqicslyulrinbpyn.supabase.co` |
| Stack | Next.js + Supabase |

Zakladni vztah:

- GitHub drzi zdrojovy kod aplikace a dokumentaci.
- Vercel nasazuje aplikaci z GitHub repa na domenu `knee.vankotraining.cz`.
- Supabase drzi prihlaseni, tabulky, RPC funkce a exportni view.
- Aplikace ve Vercelu komunikuje se Supabase pres verejnou URL a anon key.

Projekt je oddeleny od `vankotraining.cz` a `app.vankotraining.cz`. Zmeny pro knee projekt patri jen do repa `vankotraining/vankotraining-knee`.

## 2. Env promenne

Aplikace potrebuje tyto promenne:

| Promenna | K cemu je |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase projektu |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | verejny anon key pro Supabase clienta |

Kde jsou nastavene:

- produkcne ve Vercelu v nastaveni projektu: `Settings` -> `Environment Variables`,
- lokalne pri vyvoji typicky v `.env.local`, pokud se aplikace spousti lokalne.

Jak poznat problem:

- kdyz env promenne chybi, aplikace ukaze obrazovku `Chybi Supabase konfigurace`,
- kdyz je spatna URL nebo key, typicky se nepodari prihlaseni nebo nacitani dat,
- kdyz magic link neprijde nebo po prihlaseni nejsou data, zkontrolovat nejdriv Vercel env a Supabase auth nastaveni.

Poznamka: v kodu je zatim legacy fallback pro Supabase URL/anon key. Dlouhodobe je cistejsi mit vse ve Vercel env a fallback pozdeji odstranit.

## 3. Supabase databaze

Hlavni tabulky:

| Tabulka | Ucel |
| --- | --- |
| `athletes` | zakladni seznam klientu/sportovcu |
| `athlete_profiles` | profil klienta: datum narozeni, vaha, delka berce, profilove datum |
| `knee_extension_tests` | jednotliva knee extension mereni |

### Archivace / soft delete

Mazani klientu a mereni je resene jako archivace, ne jako fyzicke smazani radku.

Pouzivane sloupce:

| Sloupec | Ucel |
| --- | --- |
| `deleted_at` | kdy byl zaznam archivovan |
| `delete_reason` | proc byl zaznam archivovan |
| `deleted_context` | doplnujici kontext archivace |

Aktivni klienti jsou ti, kteri maji `deleted_at is null`. Archivovany klient zustava v databazi, ale nema se zobrazovat v aktivnim seznamu.

### Hlavni RPC funkce a provozni chovani

| Akce | Funkce / mechanismus | Poznamka |
| --- | --- | --- |
| Archivace klienta | `soft_delete_athlete` | vola se z aplikace s `p_athlete_id` a duvodem archivace |
| Obnova klienta | `restore_athlete` | vraci klienta do aktivniho seznamu |
| Vypis archivovanych klientu | `list_archived_athletes` | pouziva panel `Archiv klientu` |
| Archivace mereni | `delete()` nad `knee_extension_tests` | databaze ma zachytit delete jako soft delete / archivaci |
| Vypis archivovanych mereni | `list_archived_knee_extension_tests` | pouziva panel `Archiv mereni` pro vybraneho klienta |
| Obnova mereni | `restore_knee_extension_test` | vraci mereni z archivu do detailu klienta |

Kdyz aplikace hlasi, ze archiv jeste neni aktivni, typicky chybi odpovidajici RPC migrace v Supabase nebo se zmenil podpis funkce.

## 4. Zaloha a export dat

Rucni export je uz pripraveny:

- SQL: `supabase/manual-data-export.sql`
- navod: `project-control/manual-data-export.md`
- exportni view: `public.knee_data_export`

Kdy export delat:

- pred kazdou migraci nebo SQL zmenou,
- po kazde vetsi praci s daty,
- po oprave incidentu,
- pravidelne jako rucni zaloha, napr. 1x tydne nebo po dulezitem testovacim dni,
- pred jakoukoliv zmenou, ktera se dotyka archivace, obnovy, importu nebo vypoctu metrik.

Doporuceny nazev CSV:

`knee-backup-YYYY-MM-DD.csv`

CSV obsahuje klienty, profily, aktivni i archivovana mereni a stav archivace.

## 5. Migrace / SQL zmeny

Pravidlo:

1. Nejdri vytvor CSV export pres `public.knee_data_export`.
2. Zkontroluj, ze CSV dava smysl.
3. Teprve potom spust migraci v Supabase SQL Editoru.
4. Po migraci udelej produkcni kontrolu aplikace.
5. Po uspesne kontrole udelej novy export, pokud migrace menila data nebo pohled na data.

Jak spoustet SQL v Supabase:

- otevrit spravny Supabase projekt pro `knee.vankotraining.cz`,
- otevrit `SQL Editor`,
- vlozit obsah pripraveneho SQL souboru,
- pred spustenim znovu precist, jestli SQL nemaze fyzicky data,
- spustit `Run`,
- ulozit vysledek nebo screenshot, pokud jde o kontrolni dotaz.

Pojmenovani novych SQL souboru:

- ukladat do slozky `supabase`,
- pouzit malymi pismeny a pomlcky,
- nazev ma rikat, co soubor dela,
- priklady:
  - `supabase/add-knee-export-column.sql`
  - `supabase/fix-archived-athletes-filter.sql`
  - `supabase/restore-knee-extension-test.sql`

Co overit po migraci:

- prihlaseni stale funguje,
- aktivni seznam klientu neobsahuje archivovane klienty,
- archivovany klient je v panelu `Archiv klientu`,
- obnova klienta vrati klienta do aktivniho seznamu,
- archivace mereni nearchivuje celeho klienta,
- obnova mereni vrati mereni do detailu klienta,
- export `public.knee_data_export` jde spustit a hodnoty davaji smysl.

## 6. Produkcni kontrola po zmene

Po kazde zmene projit tuto kratkou kontrolu primo na `knee.vankotraining.cz`:

1. Otevrit aplikaci.
2. Prihlasit se magic linkem.
3. Overit, ze se zobrazi seznam aktivnich klientu.
4. Vybrat klienta a otevrit detail.
5. Pridat testovaci mereni s rozumnymi hodnotami.
6. Upravit datum, vahu a levou/pravou silu u hotoveho mereni.
7. Archivovat jen konkretni mereni a overit, ze klient zustal aktivni.
8. Obnovit archivovane mereni z panelu `Archiv mereni`.
9. Archivovat testovaciho klienta a overit, ze zmizel z aktivniho seznamu.
10. Otevrit `Archiv klientu` a obnovit klienta.
11. Zkontrolovat mobilni zobrazeni: vyber klienta, pridani mereni, detail, spodni tlacitko.
12. Spustit export dat a zkontrolovat, ze CSV obsahuje aktivni i archivovana data.

Doporucene testovaci hodnoty pro rychlou kontrolu vypoctu:

| Hodnota | Priklad |
| --- | --- |
| vaha | `82` kg |
| delka berce | `33` cm |
| leva sila | `35` kg |
| prava sila | `42` kg |
| ocekavana leva | cca `1.38` Nm/kg |
| ocekavana prava | cca `1.66` Nm/kg |
| ocekavana asymetrie | cca `16.7 %` |

## 7. Zakladni incident postup

### Aplikace nejde otevrit

1. Zkontrolovat domenu `knee.vankotraining.cz`.
2. Zkontrolovat Vercel projekt a posledni deployment.
3. Zkontrolovat, jestli deployment nespadl na buildu.
4. Zkontrolovat DNS jen pokud Vercel hlasi problem s domenou.
5. Nesahat do `app.vankotraining.cz` ani `vanko-training-web`.

### Nejde prihlaseni

1. Zkontrolovat, ze je nastavena spravna Supabase URL a anon key ve Vercelu.
2. Zkontrolovat Supabase Auth nastaveni pro magic link.
3. Zkontrolovat, jestli prihlasovaci e-mail neskoncil ve spamu.
4. Zkusit odhlasit/prihlasit v anonymnim okne.

### Neukazuji se data

1. Overit, ze prihlaseni opravdu probehlo.
2. Zkontrolovat konzoli/provozni hlasku v aplikaci.
3. V Supabase overit tabulky `athletes`, `athlete_profiles`, `knee_extension_tests`.
4. Zkontrolovat, jestli aktivni klienti maji `deleted_at is null`.
5. Pokud data jsou v Supabase, ale ne v aplikaci, podezreni je na env promenne, RLS/policies nebo dotaz aplikace.

### Archivovany klient je porad v aktivnim seznamu

1. V Supabase zkontrolovat u klienta `deleted_at`.
2. Pokud `deleted_at` neni vyplnene, archivace neprobehla.
3. Pokud `deleted_at` vyplnene je, zkontrolovat filtr aktivnich klientu a reload aplikace.
4. Spustit export a overit `client_archive_status`.

### Nejde obnova klienta nebo mereni

1. Zkontrolovat, jestli existuje odpovidajici RPC funkce.
2. Pro klienta overit `restore_athlete`.
3. Pro mereni overit `restore_knee_extension_test`.
4. Pokud aplikace hlasi chybu typu `could not find the function`, spustit nebo opravit prislusnou migraci.
5. Po obnove udelat reload a overit aktivni seznam/detail klienta.

### Chyba v exportu

1. Znovu spustit `supabase/manual-data-export.sql`.
2. Overit, ze existuje view `public.knee_data_export`.
3. Zkontrolovat, jestli export vraci aktivni i archivovane klienty.
4. Zkontrolovat znamy prepocet asymetrie z leve/prave sily.
5. Pokud nesedi sloupce, upravit exportni SQL a ulozit novou verzi do `supabase`.

## Minimalni provozni pravidla

- Pred SQL zmenou vzdy export.
- Po zmene vzdy projit produkcni kontrolu.
- Neplest knee repo s webem `vanko-training-web`.
- Nezasahovat do `app.vankotraining.cz` pri praci na knee projektu.
- Fyzicke mazani dat delat jen vedome a az po zaloze.
