from pathlib import Path
import re
import textwrap


dashboard_path = Path("src/app/components/KneeDashboard.tsx")
dashboard = dashboard_path.read_text(encoding="utf-8")

type_pattern = re.compile(
    r"  missingKg: number \| null;\n"
    r"  missingPct: number \| null;\n"
    r"  isDeficit: boolean;"
)
type_replacement = (
    "  differenceKg: number | null;\n"
    "  completionPct: number | null;\n"
    "  hasNormData: boolean;\n"
    "  isDeficit: boolean;"
)

calculation_pattern = re.compile(
    r"    const missingKg =\n"
    r"      targetKg === null \|\| leg\.forceKg === null\n"
    r"        \? null\n"
    r"        : Math\.max\(0, targetKg - leg\.forceKg\);\n"
    r"    const missingPct =\n"
    r"      leg\.nmPerKg === null\n"
    r"        \? null\n"
    r"        : Math\.max\(0, \(\(NORM_NM_PER_KG - leg\.nmPerKg\) / NORM_NM_PER_KG\) \* 100\);\n\n"
    r"    return \{\n"
    r"      \.\.\.leg,\n"
    r"      targetForceKg: targetKg,\n"
    r"      missingKg,\n"
    r"      missingPct,\n"
    r"      isDeficit: \(missingKg \?\? 0\) > 0 \|\| \(missingPct \?\? 0\) > 0,\n"
    r"    \};"
)
calculation_replacement = textwrap.indent(
    textwrap.dedent(
        """
        if (
          targetKg === null ||
          !Number.isFinite(targetKg) ||
          targetKg <= 0 ||
          leg.forceKg === null ||
          !Number.isFinite(leg.forceKg) ||
          leg.forceKg < 0
        ) {
          return {
            ...leg,
            targetForceKg: targetKg,
            differenceKg: null,
            completionPct: null,
            hasNormData: false,
            isDeficit: false,
          };
        }

        const differenceKg = Math.abs(targetKg - leg.forceKg);
        const completionPct = (leg.forceKg / targetKg) * 100;

        return {
          ...leg,
          targetForceKg: targetKg,
          differenceKg,
          completionPct,
          hasNormData: true,
          isDeficit: leg.forceKg < targetKg,
        };
        """
    ).strip("\n"),
    "    ",
)

card_pattern = re.compile(
    r'            <article className=\{leg\.isDeficit \? "leg-detail-card deficit" : "leg-detail-card ok"\} key=\{leg\.key\}>\n'
    r'.*?'
    r'            </article>',
    re.DOTALL,
)
card_replacement = textwrap.indent(
    textwrap.dedent(
        """
        <article
          className={
            leg.hasNormData
              ? leg.isDeficit
                ? "leg-detail-card deficit"
                : "leg-detail-card ok"
              : "leg-detail-card"
          }
          key={leg.key}
        >
          <div className="leg-detail-title">
            <h3>{leg.label}</h3>
            <span>
              {leg.hasNormData
                ? leg.isDeficit
                  ? "Pod normou"
                  : "Norma splněna"
                : "Nelze vypočítat"}
            </span>
          </div>
          <dl>
            <div><dt>Aktuálně</dt><dd>{formatNumber(leg.forceKg, 1, " kg")}</dd></div>
            <div><dt>Nm/kg</dt><dd>{formatNumber(leg.nmPerKg, 2)}</dd></div>
            <div><dt>Cílová síla</dt><dd>{formatNumber(leg.targetForceKg, 1, " kg")}</dd></div>
            <div><dt>Rozdíl</dt><dd>{formatNumber(leg.differenceKg, 1, " kg")}</dd></div>
          </dl>
          {leg.hasNormData ? (
            <p className="leg-norm-summary">
              Norma je splněna na <strong>{formatNumber(leg.completionPct, 1, " %")}</strong>.{" "}
              {leg.isDeficit ? (
                <>Do normy chybí <strong>{formatNumber(leg.differenceKg, 1, " kg")}</strong>.</>
              ) : (
                <>Norma je překročena o <strong>{formatNumber(leg.differenceKg, 1, " kg")}</strong>.</>
              )}
            </p>
          ) : (
            <p className="leg-norm-summary">Splnění normy nelze vypočítat.</p>
          )}
        </article>
        """
    ).strip("\n"),
    "            ",
)

for pattern, replacement, label in (
    (type_pattern, type_replacement, "LegNormGap type"),
    (calculation_pattern, calculation_replacement, "norm calculation"),
    (card_pattern, card_replacement, "leg detail card"),
):
    dashboard, count = pattern.subn(replacement, dashboard, count=1)
    if count != 1:
        raise SystemExit(f"Expected exactly one {label} block, found {count}.")

dashboard_path.write_text(dashboard, encoding="utf-8")

css_path = Path("src/app/globals.css")
css = css_path.read_text(encoding="utf-8")
css_block = textwrap.dedent(
    """

    .leg-norm-summary {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      color: var(--foreground);
      font-size: 14px;
      line-height: 1.5;
    }

    .leg-norm-summary strong {
      font-weight: 900;
    }
    """
)
if ".leg-norm-summary" not in css:
    css_path.write_text(css.rstrip() + css_block + "\n", encoding="utf-8")

project_control = Path("project-control/norm-completion-display-2026-07-14.md")
project_control.write_text(
    textwrap.dedent(
        """
        # Zobrazeni splneni normy

        Datum: 2026-07-14
        Projekt: `knee.vankotraining.cz`
        Repo: `vankotraining/vankotraining-knee`

        ## Zmena

        - Polozka `Chybi %` byla v detailu leve a prave nohy odstranena.
        - Procento se nove pocita jako `aktualni_sila_kg / cilova_sila_kg * 100`.
        - Procento neni zastropovane na 100 %.
        - Karta zachovava aktualni silu, Nm/kg, cilovou silu a absolutni rozdil v kg.
        - Pod metrikami je jedna citelna veta se zvyraznenym procentem a rozdilem v kg.
        - Pri chybejici nebo neplatne cilove sile ci aktualni sile se zobrazi `Splneni normy nelze vypocitat.`
        - Norma 3,0 Nm/kg, vypocet cilove sily, asymetrie, Supabase a ostatni workflow zustaly beze zmeny.

        ## Overeni

        - `npm run lint`
        - `npm run build`
        - cilova sila se pocita a pouziva v plne presnosti; v UI se zobrazuje na jedno desetinne misto
        - raw cil `50.651 kg` se v UI zobrazi jako `50.7 kg`
        - `42.9 / 50.651 * 100 = 84.7 %` po zaokrouhleni na jedno desetinne misto
        - `37.5 / 50.651 * 100 = 74.0 %` po zaokrouhleni na jedno desetinne misto
        - overena byla i hodnota nad 100 %: `108.4 %` a rozdil `4.2 kg`

        ## Stav projektu

        Jde o prezentacni upravu hotoveho interniho MVP. Datovy model, autentizace, archivace a vypoctova pravidla mimo nove procento splneni normy nebyly meneny.
        """
    ).lstrip(),
    encoding="utf-8",
)
