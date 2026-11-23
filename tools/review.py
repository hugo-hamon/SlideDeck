"""Rassemble les retours du mode Édition : captures annotées + résumé Markdown.

Les retours sont saisis dans le navigateur (touche `e`) et enregistrés par serve.py dans
<présentation>/feedback.json. Ce script produit .inspection/review/ :
une image par étape annotée (annotations dessinées dessus) et review.md.
"""

import argparse
import json
import shutil
import time
from pathlib import Path

from capture import ROOT, serve
from playwright.sync_api import sync_playwright

FEEDBACK = "feedback.json"
KINDS = {"stroke": "Entouré", "note": "Note"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Lire les retours saisis en mode Édition.")
    parser.add_argument(
        "project", type=Path, help="dossier de la présentation, ex. presentations/2026/demo"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="archiver feedback.json dans .inspection/ puis le supprimer (retours traités)",
    )
    parser.add_argument("--no-shots", action="store_true", help="résumé seul, sans capture")
    return parser.parse_args()


def describe(target: dict) -> str:
    """`div.title` « Plan » @ (x, y, w×h)."""
    name = target["tag"] + "".join(f".{c}" for c in target.get("class", "").split()[:2])
    text = f" « {target['text']} »" if target.get("text") else ""
    x, y, w, h = target["box"]
    return f"`{name}`{text} @ ({x}, {y}, {w}×{h})"


def shoot(project: Path, wanted: list[tuple[int, int]], output: Path) -> dict:
    """Capture chaque étape demandée avec ses annotations ; renvoie le nombre d'étapes réel."""
    server = serve()
    url = f"http://127.0.0.1:{server.server_port}/{project.relative_to(ROOT).as_posix()}/#/1/1"
    counts: dict[int, int] = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(url)
        page.wait_for_function("window.deck !== undefined")
        page.wait_for_load_state("networkidle")
        page.evaluate("deck.review.ready")
        page.evaluate("deck.review.overlay(true)")
        slides = page.evaluate("deck.info().slides")
        for slide, step in wanted:
            if slide > slides:
                continue
            page.evaluate(f"deck.goto({slide}, 1)")
            counts[slide] = page.evaluate("deck.info().steps")
            shown = counts[slide] if step == 0 else min(step, counts[slide])
            page.evaluate(f"deck.goto({slide}, {shown})")
            page.wait_for_timeout(60)
            page.screenshot(path=output / f"s{slide:02d}-e{max(step, 0):02d}.png")
        browser.close()
    server.shutdown()
    return counts


def main() -> None:
    args = parse_args()
    project = (ROOT / args.project).resolve()
    source = project / FEEDBACK
    if not source.exists():
        print("Aucun retour (feedback.json absent).")
        return
    if args.clear:
        archive = project / ".inspection" / "feedback-archive"
        archive.mkdir(parents=True, exist_ok=True)
        shutil.move(source, archive / time.strftime("%Y%m%d-%H%M%S.json"))
        print(f"Retours archivés dans {archive}")
        return

    data = json.loads(source.read_text())
    slides = sorted(((int(k), v) for k, v in data.get("slides", {}).items()), key=lambda s: s[0])
    output = project / ".inspection" / "review"
    shutil.rmtree(output, ignore_errors=True)
    output.mkdir(parents=True)

    # Une capture par étape annotée ; une capture de la dernière étape (0) si seule une note.
    wanted = [(n, int(step)) for n, slide in slides for step in sorted(slide["steps"], key=int)] + [
        (n, 0) for n, slide in slides if not slide["steps"]
    ]
    counts = {} if args.no_shots else shoot(project, wanted, output)

    lines = [f"# Retours — {project.name}", "", f"Mis à jour : {data.get('updated', '?')}", ""]
    for n, slide in slides:
        name = f" · `{slide['name']}()`" if slide.get("name") else ""
        lines += [f"## Slide {n}{name}", ""]
        if not args.no_shots and n not in counts:
            lines += ["⚠ Cette slide n'existe plus.", ""]
        if slide.get("note", "").strip():
            lines += [f"Note générale : « {slide['note'].strip()} »", ""]
            if not slide["steps"]:
                lines += [f"Capture : `s{n:02d}-e00.png` (dernière étape)", ""]
        for step in sorted(slide["steps"], key=int):
            warn = ""
            if n in counts and int(step) > counts[n]:
                warn = f" ⚠ la slide n'a plus que {counts[n]} étapes"
            lines += [f"### Étape {step} — `s{n:02d}-e{int(step):02d}.png`{warn}", ""]
            for i, item in enumerate(slide["steps"][step], 1):
                note = item.get("note", "").strip()
                comment = f"« {note} »" if note else "(sans commentaire)"
                if item["kind"] == "stroke":
                    x, y, w, h = item["box"]
                    where = f"zone ({x}, {y}, {w}×{h})"
                else:
                    where = f"point ({item['at'][0]}, {item['at'][1]})"
                lines.append(
                    f"{i}. **{KINDS.get(item['kind'], item['kind'])}** {comment} — {where}"
                )
                lines += [f"   - {describe(t)}" for t in item.get("targets", [])]
            lines.append("")
    report = "\n".join(lines)
    (output / "review.md").write_text(report)
    print(report)
    print(f"Captures et résumé : {output}")


if __name__ == "__main__":
    main()
