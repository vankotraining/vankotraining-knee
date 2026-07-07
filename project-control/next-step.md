# Next Step

## Aktualni faze

Finalni stabilizace interniho MVP.

Projekt uz nema pokracovat nekonecnym vylepsovanim. Hlavni workflow funguje, export a provozni dokumentace jsou pripraveny. Zbyvaji 3 uzaviraci kroky.

## Zbyvaji 3 kroky

### 1. Finalni technicky uklid

Cil:

- Odstranit legacy fallback anon key po potvrzeni stabilnich Vercel env promennych.
- Zkontrolovat, ze v kodu nezustava nepouzivana archivacni/DOM logika.
- Nezavadet novou funkcionalitu.

Definice hotovo:

- Supabase konfigurace spoleha na Vercel env promenne.
- Build/lint projde.
- Produkcni web dal nacita data.

### 2. Regresni ochrana

Cil:

- Rozsirit ochranu pred regresi na hlavni kriticke toky.
- Minimalne mit jasny opakovatelny smoke-test checklist, idealne i maly automatizovany smoke-test tam, kde to dava smysl.

Toky k hlidani:

- vytvoreni mereni,
- editace mereni,
- archivace/obnova mereni,
- archivace/obnova klienta,
- aktivni seznam nesmi ukazovat archivovane klienty,
- export musi obsahovat aktivni i archivovana data.

Definice hotovo:

- Pred dalsi zmenou existuje jasny testovaci postup.
- Vypocty knee metrik zustavaji kryte testem.
- Kriticka archivacni logika je overitelna.

### 3. Finalni uzavreni MVP

Cil:

- Projit finalni rucni akceptacni test.
- Aktualizovat `project-control` jako uzavrene interni MVP.
- Rozhodnout, ze dalsi produktove napady patri do v2.

Definice hotovo:

- Projekt ma finalni stavovy zapis.
- Je jasne, jak aplikaci pouzivat, zalohovat a obnovit data.
- Dalsi funkcionalita neni blokujici pro pouzivani.

## Co uz ted nepatri do MVP

- Interpretacni karta klienta.
- Tisk detailu klienta.
- Dalsi klinicke doporucovaci funkce.
- Vetsi redesign mobilniho UI.

Tyto veci patri do dalsi faze az po uzavreni MVP.
