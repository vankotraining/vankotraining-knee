from pathlib import Path


dashboard_path = Path("src/app/components/KneeDashboard.tsx")
dashboard = dashboard_path.read_text(encoding="utf-8")

percentage_source = 'formatNumber(leg.completionPct, 1, " %")'
percentage_target = 'formatNumber(leg.completionPct, 1, " %").replace(".", ",")'
difference_source = 'formatNumber(leg.differenceKg, 1, " kg")'
difference_target = 'formatNumber(leg.differenceKg, 1, " kg").replace(".", ",")'

if dashboard.count(percentage_source) != 1:
    raise SystemExit(
        f"Expected one norm completion percentage formatter, found {dashboard.count(percentage_source)}."
    )

if dashboard.count(difference_source) != 3:
    raise SystemExit(
        f"Expected three norm difference formatters, found {dashboard.count(difference_source)}."
    )

dashboard = dashboard.replace(percentage_source, percentage_target)
dashboard = dashboard.replace(difference_source, difference_target)
dashboard_path.write_text(dashboard, encoding="utf-8")

project_control_path = Path("project-control/norm-completion-display-2026-07-14.md")
project_control = project_control_path.read_text(encoding="utf-8")
localization_note = (
    "\n- Nove souhrnne procento a rozdil v kg pouzivaji ceskou desetinnou carku "
    "(`84,7 %`, `7,8 kg`).\n"
)
if "ceskou desetinnou carku" not in project_control:
    project_control_path.write_text(project_control.rstrip() + localization_note, encoding="utf-8")
