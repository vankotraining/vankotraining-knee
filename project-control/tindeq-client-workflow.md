# Tindeq client workflow implementation evidence

## Rozsah

Tato větev rozšiřuje PR #12 z obecného uloženého Tindeq výsledku na propojený pracovní tok klient → maximum → předpis → potvrzený import → reprodukovatelná historie.

## Výpočty maxima

Vstupy:

- síla vlevo a vpravo v uživatelem zvolené jednotce;
- tělesná hmotnost v kg;
- délka bérce v cm.

Normalizace síly probíhá v `src/lib/tindeq-persistence.ts`. Výpočty v `src/lib/tindeq-workflow.ts`:

- moment `Nm = síla_kg × 9,80665 × délka_bérce_m`;
- relativní moment `Nm/kg = moment_Nm / tělesná_hmotnost_kg`;
- asymetrie podle existující projektové definice vůči silnější straně;
- slabší strana podle existující projektové definice.

Zdrojové hodnoty, jednotka i normalizované výsledky se ukládají. Neplatné, nulové, záporné nebo nekonečné vstupy jsou odmítnuty.

## Předpis

`tindeq_prescriptions` ukládá klienta, konkrétní historické maximum, datum reference, stranu, referenční sílu, procento a cílovou sílu. Databázový check ověřuje vzorec `target = reference × pct / 100`.

## Přesná shoda jména

Priorita zdroje jména:

1. podporovaný název `repeaters_YYYY_DD_MM_HH_MM_YYYYMMDD Jméno [číslo].zip`;
2. Tindeq tag.

Porovnání ignoruje pouze velikost písmen, krajní mezery a opakované mezery. Diakritika, překlep, část jména ani podobnost se neodhadují. Jedna shoda klienta předvybere; nula, více shod nebo chybějící jméno vyžadují ruční výběr. Uložení vždy vyžaduje potvrzovací checkbox.

## Uložené metriky cvičení

- strana;
- reference a předpis jako snapshot;
- počet analyzovaných opakování;
- průměrná síla, nejlepší a nejslabší opakování;
- průměr vůči referenčnímu maximu a cílové síle;
- CV mezi průměrnými silami opakování;
- změna prvního vůči poslednímu opakování v procentních bodech cíle;
- celkový čas pracovních intervalů;
- normalizované detailní metriky a resamplované procentní křivky z PR #12;
- volitelná bolest před, maximum během a po;
- technická upozornění, verze analýzy a SHA-256 import fingerprint.

Původní ZIP a raw zdrojové časové řady se neukládají.

## Deduplikace

Otisk je vytvořen z klienta, strany, času měření, datasetu, protokolu, jednotky a normalizovaných sil/délky jednotlivých opakování. Název souboru, bolest a předpis otisk nemění. Pre-check je doplněn unikátním částečným indexem, který řeší i souběžný zápis.

## Testování

Nové testy pokrývají výpočty maxima, neplatné vstupy, přesnou shodu jména, zákaz fuzzy shody, bolest `null` vs `0`, metriky série, chybějící referenci, historický snapshot, stabilní fingerprint, payload bez ZIP/raw dat a oba mechanismy detekce duplicity. Existing parser tests PR #12 nadále pokrývají podporovaný, nepodporovaný a poškozený export.
