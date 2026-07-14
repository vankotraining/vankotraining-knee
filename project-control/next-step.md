# Next Step

## Aktualni faze

Finalni stabilizace interniho MVP.

Hlavni workflow funguje, export a provozni dokumentace jsou pripravene a zobrazeni procenta vuci norme bylo zpresneno. Zbyvaji 3 uzaviraci kroky.

## Posledni dokoncena zmena

V detailu leve a prave nohy se uz neukazuje nejednoznacne `Chybi X %`.

Nove se zobrazuje veta:

- pod normou: `Norma je splnena na X %. Do normy chybi Y kg.`
- nad normou: `Norma je splnena na X %. Norma je prekrocena o Y kg.`

Ciselne hodnoty jsou zvyraznene. Procento se pocita jako `aktualni sila / cilova sila * 100` a neni zastropovane na 100 %.

## Zbyvaji 3 kroky

### 1. Finalni technicky uklid

Cil:

- Odstranit legacy fallback anon key po potvrzeni stabilnich Vercel env promennych.
- Zkontrolovat, ze v kodu nezustava nepouzivana archivacni/DOM logika.
- Sjednotit kompaktni mobilni souhrn s novou terminologii splneni normy; aktualne muze stale pouzivat popisek `Chybi`.
- Nezavadet novou funkcionalitu.

Definice hotovo:

- Supabase konfigurace spoleha na Vercel env promenne.
- Terminologie je konzistentni na desktopu i mobilu.
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
- export musi obsahovat aktivni i archivovana data,
- splneni normy pod 100 %, presne 100 % a nad 100 %,
- chovani pri chybejicich nebo neplatnych datech.

Definice hotovo:

- Pred dalsi zmenou existuje jasny testovaci postup.
- Vypocty knee metrik zustavaji kryte testem.
- Kriticka archivacni logika a nova prezentace normy jsou overitelne.

### 3. Finalni uzavreni MVP

Cil:

- Projit finalni rucni akceptacni test.
- Vizualne overit novou vetu o splneni normy na desktopu i mobilu.
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
