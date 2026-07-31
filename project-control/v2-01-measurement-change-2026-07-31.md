# V2-01 – Změna oproti předchozímu měření

Datum implementace: 2026-07-31
Projekt: `knee.vankotraining.cz`
Repo: `vankotraining/vankotraining-knee`
Výchozí commit `main`: `da83f4ab1a66079f5839b1125d41b5e08fcd37b3`
Implementační commit: `18dcde174a1e261e3db4c1e20c4b4ec998627035`

## Zařazení

Interní MVP bylo formálně uzavřeno v `project-control/internal-mvp-closed-2026-07-07.md`. Tato změna je první plánovaná produktová položka verze v2 a nemění zpětně stav uzavření MVP.

## Účel

Detail každého aktivního měření trvale ukazuje změnu levé a pravé nohy proti chronologicky předchozímu aktivnímu měření stejného klienta. Změna je odvozená dynamicky z načtené historie a neukládá se do databáze.

## Přesné pravidlo porovnání

Měření se řadí vzestupně podle této stabilní posloupnosti:

1. `test_date`,
2. `created_at`,
3. `source_row`,
4. `id`.

Předchozí měření je bezprostředně předcházející aktivní záznam v tomto pořadí. Primární význam má vždy datum měření. `created_at` je spolehlivé sekundární časové razítko, které existuje v aktuálním databázovém modelu. `updated_at` se záměrně nepoužívá, protože editace nesmí změnit chronologické pořadí. `source_row` řeší případ shodného času u importovaných záznamů a `id` poskytuje poslední deterministický tie-break.

## Vzorce

Pro každou nohu samostatně:

```ts
changeKg = currentForceKg - previousForceKg;
changePct = previousForceKg > 0
  ? (changeKg / previousForceKg) * 100
  : null;
```

Směr změny se zachovává. Nejde o absolutní hodnotu.

## Archivovaná měření

Porovnání používá pouze aktivní měření, tedy stejnou historii, kterou uživatel vidí v aktivním detailu klienta. Archivovaný záznam není skrytým referenčním bodem. Po obnově měření se znovu zařadí do chronologie a porovnání se dynamicky přepočítají.

## Historické vložení a editace

- Historicky vložené měření se zařadí podle `test_date`, nikoli podle pořadí vložení.
- Po editaci historického měření se přepočítá jeho vlastní porovnání i porovnání chronologicky následujícího měření.
- Odvozené změny nejsou ukládány do Supabase, takže nemohou zastarat.

## Prezentace

V detailu měření se pod kartami levé a pravé nohy zobrazuje neutrální sekce:

- `Změna oproti měření D. M. RRRR`,
- `Levá noha`,
- `Pravá noha`,
- změna v kg a procentech se znaménkem a českou desetinnou čárkou.

Barevné rozlišení je pouze orientační:

- kladná změna: tlumený zelený odstín navazující na `--accent`,
- záporná změna: tlumený okrový odstín navazující na `--warning`,
- nulová nebo nevypočitatelná změna: neutrální šedá.

Význam je vždy dostupný i bez barvy prostřednictvím znamének `+`, `−` a čísel. Nejsou použité alarmující ikony, červená výstraha ani hodnotící texty.

## Hraniční stavy

- První aktivní měření: `Předchozí měření není k dispozici.`
- Chybějící nebo neplatná hodnota jedné nohy: `-` a `Změnu nelze vypočítat.`
- Nulová předchozí hodnota: změna v kg se zobrazí, procento je `-` a doplní se `Procentní změnu nelze vypočítat.`
- Stejná hodnota: `0,0 kg · 0,0 %`.
- Výpočet nikdy nevrací `NaN` ani `Infinity` do UI.

## Změněné soubory

- `src/lib/knee-metrics.ts`
- `src/lib/knee-metrics.test.ts`
- `src/app/components/KneeDashboard.tsx`
- `src/app/globals.css`
- `project-control/v2-01-measurement-change-2026-07-31.md`

## Regresní testy

Testy pokrývají:

1. zvýšení hodnoty,
2. snížení hodnoty,
3. nulovou změnu,
4. procentní výpočet proti předchozí hodnotě,
5. samostatnou levou a pravou nohu,
6. první měření,
7. chybějící aktuální hodnotu,
8. chybějící předchozí hodnotu,
9. nulovou předchozí hodnotu,
10. nepřítomnost `NaN` a `Infinity`,
11. nejbližší starší měření,
12. historicky vložené měření,
13. dopad editace na následující porovnání,
14. více měření ve stejný den podle `created_at` a `source_row`,
15. vyloučení archivovaného měření.

Projekt nemá komponentní testovací infrastrukturu; kvůli jediné funkci proto nebyl zaveden nový framework. Texty a znaménka jsou součástí sdíleného detailu používaného mobilním i desktopovým UI.

## Technické ověření

- `npm test`: PASS (26/26 testů; z toho 15 scénářů V2-01).
- `npm run lint`: známý výchozí stav beze změny; exit code 1; 4 problémy.
- Lint byl porovnán s výchozím stavem podle souboru, závažnosti a pravidla; změna nepřidala nový lint problém.
- `npm run build`: PASS.
- `git diff --check`: PASS.

## Důkaz nasazení

Vercel deployment `dpl_9qUUd6U2cF6kiJB9YfmUHcqyrtUr`:

- projekt: `vankotraining-knee`,
- Git commit: `18dcde174a1e261e3db4c1e20c4b4ec998627035`,
- Git větev: `main`,
- stav: `READY`,
- cíl: `production`,
- přiřazená produkční doména projektu: `knee.vankotraining.cz`.

## Stav

- Implementováno: ano; změna je v commitu `18dcde174a1e261e3db4c1e20c4b4ec998627035` na `main`.
- Nasazeno: ano; existuje výše uvedený Vercel production deployment příslušného commitu.
- Produkčně ověřeno: ne; vyžaduje výslovné potvrzení uživatele po ruční kontrole produkce.

## Co zbývá ověřit na produkci

- desktopový detail měření,
- mobilní detail měření,
- první měření bez předchozího záznamu,
- kladné, záporné a nulové znaménko,
- českou desetinnou čárku,
- nulovou předchozí hodnotu,
- historické vložení a editaci,
- archivaci a následnou obnovu referenčního měření.
