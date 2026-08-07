# ADR 0001: Základní architektura a datové zacházení

- Stav: Přijato
- Datum: 2026-08-03

## Kontext

Projekt již běží v samostatném GitHub/Vercel projektu, ale používá sdílený Supabase projekt. Produkční schéma používá soft delete a nově obsahuje normalizované Tindeq výsledky. Tato rozhodnutí jsou realizována ve skutečných artefaktech a nejsou pouze návrhem.

## Rozhodnutí

### Samostatná Knee aplikace

`knee.vankotraining.cz` má vlastní repozitář, Next.js aplikaci a Vercel projekt. Kód se nemíchá s veřejným webem ani obecnou tréninkovou aplikací.

### Sdílený Supabase projekt

Knee aplikace používá Supabase projekt `zxvndqicslyulrinbpyn`, který obsahuje i migrace a data dalších částí ekosystému. Oddělení se řeší tabulkami, RLS a aplikačním rozsahem, nikoli samostatným Supabase projektem.

### Soft delete klientů a měření

Klienti, profily, knee extension měření a Tindeq výsledky používají `deleted_at` a související auditní metadata. Běžná uživatelská akce záznam archivuje; fyzické smazání není standardní workflow.

### Normalizované Tindeq výsledky bez původního ZIP

Tindeq ZIP se analyzuje lokálně. Do `tindeq_sessions` se ukládají normalizované souhrny, opakování, metadata a verze analýzy. Původní ZIP ani raw časová řada se neukládají.

## Důsledky

- deploymenty jednotlivých aplikací lze řídit nezávisle;
- změna sdílené databáze může ovlivnit více aplikací, proto musí mít explicitní rozsah a ověření;
- obnova archivovaných dat zůstává možná a auditovatelná;
- uložený Tindeq report lze rekonstruovat bez ZIP, ale nelze z databáze obnovit původní raw signál;
- případný budoucí multi-tenant provoz vyžaduje vlastnické nebo organizační sloupce a odpovídající RLS.

## Doložení

- produkční Vercel projekt a alias pro samostatnou aplikaci;
- skutečné Supabase schéma se sdílenými workout i Knee migracemi;
- soft-delete sloupce na `athletes`, `athlete_profiles`, `knee_extension_tests` a `tindeq_sessions`;
- aplikovaná migrace `20260802124337 tindeq_sessions` a schema bez sloupce pro původní ZIP.
