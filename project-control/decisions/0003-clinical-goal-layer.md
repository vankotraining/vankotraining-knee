# Decision 0003 — Clinical goal / limiter layer

Date: 2026-10-03
Status: Accepted for Clinical Map read-only review

## Context

Exercise family × capacity matrix je užitečná pro orientaci v knihovně cviků, ale sama o sobě nevyjadřuje, **čeho se v rehabilitaci snažíme dosáhnout**. Klinické review časné rehabilitace kolene a nové appraised CSB zdroje ukázaly potřebu oddělit clinical goal od konkrétní exercise varianty.

## Decision

Clinical Map bude používat tento konceptuální řetězec:

`diagnosis / operation → guardrails → clinical goal → limiter → capacity → exercise family → variant → future dose → response`.

První canonical clinical goal je:

`Restore knee extension & quadriceps control`.

Obsahuje čtyři komponenty:

1. Extension ROM.
2. Quadriceps activation.
3. Active terminal extension control.
4. Early load acceptance / movement control.

Typické limitery jsou vedeny jako samostatná vrstva, nikoli jako diagnóza.

## Evidence boundary

Clinical goal používá guardrails z Clinical Second Brain, aktuálně zejména:

- `ACL-CLM-008`;
- `AMI-CLM-001`;
- `AMI-CLM-002`.

Buckthorpe ACL-013 slouží jako contextual implementation framework; Aspetar ACL-012 zůstává vyšší guideline authority.

Současná evidence je nejsilnější pro ACL/ACLR. Goal se nesmí prezentovat jako univerzální protokol pro každou operaci kolene. Procedure-specific restrictions, tissue protection a clinician judgment mají přednost.

## Exercise mapping rule

Clinical goal není exercise card.

Konkrétní cvik může být pod goal napojen pouze po klinickém review a s oddělenou informací o:

- clinical-use provenance / confidence;
- Training library linku;
- relevantních goal components;
- limiter targets;
- evidence guardrails.

Absence linku neznamená, že cvik není relevantní; znamená pouze, že link zatím nebyl reviewován.

## Initial reviewed option

`Terminal extension / quadriceps activation` je exercise option pod prvním goalem, nikoli goal samotný.

Direct clinical-use provenance: CLIENTS Visit 2026-09-29, C044.

Training exact mapping zůstává `none`, dokud nebude samostatně schválena canonical Training varianta.

## Non-goals

Tato decision nezavádí:

- automatické přiřazení diagnózy;
- rigidní rehab phases;
- automatický plan generator;
- dosing/progression engine;
- RTS verdict;
- production writes.
