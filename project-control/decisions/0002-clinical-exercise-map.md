# ADR 0002: Clinical Exercise Map jako read-only klinický workspace

- Stav: Přijato jako další produktový směr
- Datum: 2026-10-02
- Implementace: zatím neprovedena

## Kontext

Read-only audit CLIENTS / Knee / Training ukázal, že rehabilitační práce s kolenem už existuje v několika zdrojích, ale není vizuálně ani datově sjednocena.

Aktuálně jsou relevantní zejména:

- CLIENTS: Client → Episode → Visit, kde je skutečný průběh péče a klinické intervence;
- Knee/Tindeq/Fmax: objektivní měření extenzorů kolene a Tindeq sessions;
- Training: canonical exercise library a existující exercise UUID;
- historické plánovací zdroje jako KneeRehab, BV_knee_aid a !!!Exercise_Database;
- Clinical Second Brain / Martin Library: appraised evidence, living claims a klinické guardrails.

Full scan canonical Visits dne 2026-10-02 ukázal 202 řádků Visits a 15 epizod s explicitním knee/meniscus/ACL/quadriceps kontextem. Cviky se opakují napříč diagnózami a fázemi, ale často pod různými textovými názvy.

## Rozhodnutí

### 1. Nový top-level workspace

Knee aplikace má dostat samostatný read-only klinický workspace:

`/clinical/exercises`

Uživatelský název v hlavní navigaci: **Clinical Map**.

Workspace není podstránkou Fmax ani Tindeq. Je to třetí samostatný pracovní povrch vedle klientského/měřicího workflow a Tindeq workflow.

### 2. Exercise-first datový model

Cvik nebude duplikován podle diagnózy. Jedna canonical exercise family/variant může být spojena s více:

- klinickými problémy;
- fázemi/capacity domains;
- Visits;
- klienty;
- Training `exercise_id`;
- historickými programy;
- evidence/guardrail zdroji.

Příklad: `split_squat` je rodina; `iso hold`, `wall-supported`, `TRX-assisted`, `loaded`, `deep ROM`, `wedge`, `jump` a `drop/catch` jsou varianty nebo kandidáti variant.

### 3. Capacity map je hlavní osa

Primární vizuální osa V1:

1. tolerance / irritability,
2. force production / activation,
3. strength / capacity,
4. deeper ROM / knee-forward,
5. dynamic / deceleration / energy storage,
6. sport-specific exposure.

Toto není povinná lineární časová osa. Jde o mapu kapacit.

### 4. Více pohledů na stejná data

V1 má podporovat minimálně tyto read-only pohledy:

- **Podle kapacity**;
- **Podle problému / diagnózy**;
- **Podle cviku**;
- **Klient**.

Všechny pohledy čtou stejný underlying model.

### 5. Jasné oddělení vrstev důkazu

UI i datový model musí odlišovat:

- **clinical-use evidence** – cvik skutečně doložený ve Visit;
- **Training library match** – přesná nebo pravděpodobná vazba na canonical exercise;
- **historical-program evidence** – cvik/varianta z KneeRehab, BV_knee_aid nebo jiného staršího programu;
- **research/evidence layer** – appraised evidence a guardrails z Clinical Second Brain.

Research evidence se nemá mechanicky přilepovat k názvu cviku. Primárně se váže k rozhodovacím principům, progresi a guardrails.

### 6. V1 je striktně read-only

V1 nesmí:

- vytvářet rehabilitační plány;
- zapisovat do Visits;
- měnit Training plans/workouts;
- měnit Exercise DB;
- automaticky určovat diagnózu;
- automaticky rozhodovat o return-to-sport;
- vydávat pracovní hypotézu za potvrzenou diagnózu.

## Důsledky

- nejdříve lze bezpečně zviditelnit současné znalosti a datové mezery;
- uživatel může nad reálným front-endem iterovat klinický model ještě před návrhem automatického plánování;
- canonical exercise ontology a mapping confidence musí být explicitní;
- unresolved varianty musí zůstat viditelné místo násilného mapování na nesprávný `exercise_id`;
- budoucí dosing a plan-generation vrstva se může přidat až nad stabilní mapou.

## První acceptance cíl

První implementační krok je pouze read-only frontend V1 s reálnými daty a bez změny klinických autorit. Má zobrazit alespoň základní exercise families, capacity columns, provenance a detail vybraného cviku.

Podrobný feature brief: `project-control/clinical-exercise-map-v1-2026-10-02.md`.
