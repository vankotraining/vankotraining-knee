# Project specification

## Účel

Knee aplikace je interní nástroj pro bezpečné ukládání, vyhodnocování a sledování měření extenze kolene a souvisejících Tindeq cvičení. Výsledky musí být deterministické, auditovatelné a reprodukovatelné bez původního exportu.

## Aktuální klientské workflow

1. Oprávněný uživatel vytvoří nebo vybere klienta.
2. U klienta uloží tělesnou hmotnost a délku bérce.
3. Maximum extenze levého a pravého kolene změří pomocí Tindeq mimo Knee aplikaci.
4. Ručně zapíše obě maxima, datum, použitou antropometrii, jednotku a volitelnou poznámku.
5. Aplikace uloží zdrojové síly, normalizované síly v kg, momenty v Nm, Nm/kg, asymetrii a slabší stranu jako historické měření.
6. Uživatel zvolí stranu, historické referenční maximum a procento maxima; aplikace uloží snapshot reference a cílovou sílu.
7. Klient provede cvičení v aplikaci Tindeq.
8. Uživatel exportuje skutečný Tindeq ZIP a importuje jej do Knee aplikace.
9. ZIP se analyzuje lokálně v prohlížeči. Původní ZIP ani raw časová řada se neukládají.
10. Aplikace získá jméno z podporovaného názvu souboru nebo tagu, provede pouze přesnou shodu po bezpečné normalizaci a zobrazí návrh.
11. Uživatel potvrdí klienta, stranu, případnou referenci a volitelné údaje o bolesti.
12. Aplikace uloží normalizovaný výsledek, snapshot interpretace a deterministický deduplikační otisk do historie klienta.

## Bezpečnostní a metodické hranice

- Přímé živé měření přes Bluetooth Tindeq není součástí aktuálního workflow a nyní se neimplementuje.
- Fuzzy matching, částečná shoda a automatické odhadování překlepů nejsou dovoleny.
- Bolest je volitelná; chybějící údaj je `null`, skutečná nula zůstává `0`.
- Bez reference lze uložit technickou analýzu, ale metriky vůči maximu a cíli zůstávají nehodnocené.
- Historické výsledky používají snapshot maxima, data reference, procenta a cílové síly; novější maximum starý výsledek nemění.
- Klinické cut-off hodnoty ani automatické klinické rozhodnutí nejsou součástí této implementace.
- Soft delete a stávající auditní model klientů a měření se zachovává.
- RLS se nevypíná; zápis je povolen pouze oprávněnému uživateli a reference musí patřit stejnému aktivnímu klientovi.
