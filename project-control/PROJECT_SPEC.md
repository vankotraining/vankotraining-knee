# Project specification

## Účel

Knee aplikace je interní nástroj pro bezpečné ukládání, vyhodnocování a sledování měření extenze kolene. Snižuje manuální práci, zachovává dohledatelnost výsledků a umožňuje konzistentní klinické a tréninkové rozhodování bez směšování s veřejným webem nebo obecnou tréninkovou aplikací.

## Cíloví uživatelé

- fyzioterapeut nebo trenér spravující klienty a měření;
- klient, kterému je prezentován srozumitelný výsledek nebo report;
- vlastník projektu zajišťující provoz, zálohy a kontrolu změn.

## Rozsah projektu

- autentizovaný seznam klientů a jejich profilů;
- knee extension měření, výpočty Nm/kg, asymetrie, slabší strany a vývoje proti minulým měřením;
- archivace a obnova klientů a měření pomocí soft delete;
- import a lokální analýza podporovaných Tindeq exportů;
- ukládání normalizovaných výsledků Tindeq k vybranému klientovi;
- historie a reprodukovatelný report z uložených normalizovaných výsledků;
- mobilní i desktopové interní workflow;
- provozní evidence, zálohy, migrace a auditovatelný deployment.

## Hranice a explicitní non-goals

- nejde o veřejný marketingový web;
- nejde o plnohodnotné CRM ani obecný tréninkový builder;
- nejde o diagnostický zdravotnický prostředek ani automatické určení způsobilosti ke sportu;
- pracovní heuristiky nesmí být vydávány za validované klinické cut-off hodnoty;
- původní Tindeq ZIP ani raw časová řada se neukládají do databáze nebo Storage;
- automatické či fuzzy přiřazení výsledku ke klientovi není dovoleno;
- víceuživatelský tenant model není součástí aktuálního rozsahu;
- produktové rozšíření nesmí být směšováno s opravou zdrojů pravdy nebo provozní evidencí.

## Hlavní workflow

1. Oprávněný uživatel se přihlásí magic linkem.
2. Vybere nebo vytvoří klienta.
3. Zapíše knee extension měření nebo lokálně analyzuje Tindeq export.
4. Před uložením zkontroluje klienta a výsledek.
5. Aplikace uloží měření nebo normalizovaný výsledek.
6. Uživatel sleduje historii, porovnání a report.
7. Chybný záznam archivuje a případně obnoví; fyzické smazání není běžný tok.
8. Po změně schématu nebo významné práci s daty provede kontrolu a zálohu podle provozní dokumentace.

## Kritéria úspěchu

- každý uložený záznam je jednoznačně přiřazen ke klientovi;
- výpočty jsou deterministické, testovatelné a neprodukují `NaN` nebo `Infinity`;
- aktivní pohledy nezobrazují soft-deleted záznamy;
- historie a report lze rekonstruovat bez původního ZIP;
- stav `main`, preview, produkce a databáze je dohledatelný ke konkrétním commitům a migracím;
- produkční ověření je zaznamenáno pouze po výslovné uživatelské kontrole;
- změny kritického workflow mají automatizovaný test nebo explicitní reprodukovatelný smoke test;
- běžný mobilní tok není blokován překrytím nebo nečitelným rozhraním.
