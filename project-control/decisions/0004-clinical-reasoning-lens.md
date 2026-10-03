# Decision 0004 — Clinical Map as a reasoning lens

Date: 2026-10-03
Status: Accepted for read-only Clinical Map review

## Context

Detailní phase logic by Clinical Map posouvala směrem k protokolu. Clinician workflow je naopak založený na průběžném úsudku podle stavu kolene a reakce na zatížení.

## Decision

Clinical Map bude prioritně zobrazovat **proměnné pro klinickou rozvahu**, nikoli předepisovat posloupnost kroků.

Primary reasoning model:

`State → Limiter → Modifiers → Options → Response`.

Tento řetězec je organizační pomůcka, ne automatický decision tree.

## Meaning of the layers

### State
Co je dnes relevantní na koleni: reaktivita, effusion, ROM, activation, capacity a load acceptance/confidence.

### Limiter
Co aktuálně omezuje zvolený cíl nebo progresi.

### Modifiers
Co lze měnit v dávce nebo provedení: load, ROM, contraction, assistance, laterality, tempo/velocity, exposure/frequency a exercise/environment.

### Options
Management, exercise options a adjuncts. Více možností může běžet paralelně.

### Response
Co sledujeme po zásahu: immediate tolerance, delayed response, reactivity/swelling, ROM, activation/control a force/performance.

## Quiet knee

`Quiet knee` není samostatný exercise goal ani binární gate. Je to pracovní readiness description pro koleno, které je dostatečně settled pro zamýšlenou progresi.

Effusion zůstává klinicky relevantní response marker, ale není proxy pro AMI nebo quadriceps strength.

## Existing goals

`Restore knee extension & quadriceps control` zůstává reviewed clinical goal uvnitř širšího reasoning lens. Není názvem celé early fáze.

## Non-goals

Clinical Map nebude v této etapě:

- určovat povinné pořadí cviků;
- generovat plán;
- stanovovat automatické progression gates;
- automaticky klasifikovat diagnózu;
- poskytovat RTS verdict.
