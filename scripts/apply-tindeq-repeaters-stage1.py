from pathlib import Path

from tindeq_stage1_app import apply as apply_app
from tindeq_stage1_core import apply as apply_core
from tindeq_stage1_db import apply as apply_database


if __name__ == "__main__":
    apply_core()
    apply_app()
    apply_database()

    analysis_path = Path("src/lib/tindeq/analysis.ts")
    analysis = analysis_path.read_text(encoding="utf-8")
    analysis = analysis.replace(
        "      firstToLastChangePct,\n",
        "      firstToLastChangePct: firstLastChangePct,\n",
    )
    analysis_path.write_text(analysis, encoding="utf-8")

    parser_path = Path("src/lib/tindeq/parser.ts")
    parser = parser_path.read_text(encoding="utf-8")
    parser = parser.replace(
        "  if (rows.length >= 2 && rows[0].length === rows[1].length) {\n",
        "  if (rows.length >= 2 && rows[0].length > 2 && rows[0].length === rows[1].length) {\n",
    )
    parser_path.write_text(parser, encoding="utf-8")
