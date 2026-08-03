# Project specification

## Účel

Knee aplikace je interní nástroj pro ukládání, vyhodnocování a sledování měření extenze kolene a souvisejících Tindeq cvičení. Výsledky musí být deterministické, auditovatelné a reprodukovatelné bez původního exportu.

## Aktuální Tindeq tok

1. Oprávněný uživatel vybere klienta na hlavní Knee stránce.
2. U vybraného klienta použije akci `Přidat Tindeq záznam`.
3. Nahraje podporovaný Tindeq ZIP; analýza proběhne lokálně v prohlížeči.
4. Zvolí levou nebo pravou stranu.
5. Volitelně vybere historické maximální měření klienta, zadá procento maxima a bolest před, během a po cvičení.
6. Před uložením zkontroluje vypočtený souhrn série.
7. Aplikace uloží normalizovaný výsledek přímo do historie vybraného klienta.

## Ukládaná data

- identifikace klienta a datum měření;
- zvolená strana;
- normalizované souhrny a opakování;
- průměrná, nejlepší a nejslabší síla;
- konzistence, změna první–poslední a pracovní čas;
- volitelný snapshot referenčního maxima, procenta a cílové síly;
- volitelná bolest;
- deterministický otisk pro ochranu proti duplicitnímu importu.

Původní ZIP ani nezpracovaná časová řada se neukládají.

## Hranice

- klient se nepřiřazuje podle názvu souboru; je znám z hlavní Knee stránky;
- samostatná tabulka tréninkových předpisů není součástí aktuálního rozsahu;
- procento a reference jsou volitelný snapshot konkrétního záznamu;
- bez reference lze uložit technickou analýzu, ale metriky vůči maximu a cíli zůstávají `null`;
- bolest je volitelná; chybějící údaj je `null`, skutečná nula zůstává `0`;
- přímé živé Bluetooth měření není součástí aktuálního rozsahu;
- RLS, audit, soft delete a vazba na aktivního klienta se zachovávají;
- obecná trasa `/tindeq` zůstává sekundárním analyzátorem, nikoli hlavní klientskou cestou.
