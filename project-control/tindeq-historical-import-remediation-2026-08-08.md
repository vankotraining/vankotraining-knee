# Tindeq historical import remediation — 2026-08-08

Tento dokument je anonymizovaný historický evidence záznam. Aktuální stav projektu a produkce zůstává autoritativně v [`PROJECT_STATE.md`](./PROJECT_STATE.md) a [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

## Rozsah a ochrana osobních údajů

Produkční historický import obsahoval 26 Tindeq měření přiřazených k 7 existujícím klientům.

Tento repozitář záměrně neeviduje jména klientů, názvy jejich konkrétních ZIP souborů ani jiné klientské identifikátory. Záznam používá pouze agregované technické počty a výsledky kontrol.

## Audit původního importu

Audit proti původnímu archivu zjistil:

- očekávaný manifest: 26 měření;
- 13 z 26 aktivních importovaných záznamů odpovídalo archivu;
- 13 z 26 aktivních importovaných záznamů bylo nesprávných.

## Schválená remediation

Po explicitním uživatelském schválení byla provedena produkční datová remediation:

- 13 nesprávných řádků bylo soft-delete, nikoli fyzicky smazáno;
- 13 správných náhradních záznamů bylo vloženo;
- auditní/rollback stopa 13 původních chybných řádků zůstala zachovaná.

Historický import se poté neopakoval a dataset se dále neměnil.

## Post-check remediation

Bezprostřední kontrola proti původnímu manifestu zaznamenala:

- `active_count = 26`;
- `missing_count = 0`;
- `extra_count = 0`;
- `metadata_mismatch_count = 0`;
- `active_duplicate_groups = 0`;
- `quality_violations = 0`;
- rozdělení aktivních sessions mezi 7 klientů odpovídalo původnímu archivu.

Fresh read-only re-check produkčního `public.tindeq_sessions` provedený 2026-08-08 následně potvrdil:

- 26 aktivních řádků;
- 13 soft-deleted řádků;
- 7 klientů mezi aktivními sessions;
- 0 neplatných `raw_metadata ->> 'tindeqSessionId'` podle 20znakového lowercase hex formátu;
- 0 aktivních duplicate groups podle produkční dedupe identity;
- 0 aktivních sessions s chybějícím nebo nekladným `detected_repetitions`.

## Manuální produkční acceptance

Uživatel následně v produkční aplikaci ručně zkontroloval původně problematickou klientskou historii a potvrdil:

- datum je správně;
- počet detekovaných repetitions je 8.

Tento PASS se vztahuje na ověřený problematický historický případ a remediation datasetu. Neznamená produkční ověření kódu z PR #17, protože tento parser fix ještě není v produkčním runtime.

## Vztah k PR #17

Historický archiv a remediation poskytují praktický důkaz, že Tindeq datum musí být pro tento zdroj interpretováno jako `YYYY-DD-MM HH:mm[:ss]`; problematické hodnoty typu `2026-04-08`, `2026-05-08` a `2026-07-08` tedy odpovídají 4., 5. a 7. srpnu 2026.

PR #17 tuto interpretaci implementuje v `parseTindeqDate()` a přidává fail-closed kalendářní validaci a regresní testy. PR #17 nemění sílové výpočty, `digest()`/session identitu, databázové schéma ani produkční data.

Stav je proto nutné rozlišovat:

- historická datová remediation: produkčně aplikována;
- remediation post-check: automatizovaně/databázově ověřen;
- ověřený problematický historický případ: manuálně produkčně ověřen;
- parser fix PR #17: implementován ve větvi a preview/test gate se ověřuje samostatně;
- parser fix PR #17: zatím není produkčně nasazen ani produkčně ověřen.
