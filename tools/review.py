"""Gathers edit-mode feedback: annotated captures + a Markdown summary.

Feedback is entered in the browser (`e` key) and saved by serve.py to
<presentation>/feedback.json. This script produces .inspection/review/:
one image per annotated step (annotations drawn on it) and review.md.
"""

import argparse
import json
import shutil
import time
from pathlib import Path

from capture import ROOT, serve
from playwright.sync_api import sync_playwright

FEEDBACK = "feedback.json"
KINDS = {"stroke": "Circled", "note": "Note"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Read the feedback entered in edit mode.")
    parser.add_argument(
        "project", type=Path, help="presentation folder, e.g. presentations/2026/demo"
    )
    parser.add_argument(
        "--clear",
        action="store_true",
        help="archive feedback.json into .inspection/ then delete it (feedback handled)",
    )
    parser.add_argument("--no-shots", action="store_true", help="summary only, no captures")
    return parser.parse_args()


def describe(target: dict) -> str:
    """`div.title` "Outline" @ (x, y, w×h)."""
    name = target["tag"] + "".join(f".{c}" for c in target.get("class", "").split()[:2])
    text = f' "{target["text"]}"' if target.get("text") else ""
    x, y, w, h = target["box"]
    return f"`{name}`{text} @ ({x}, {y}, {w}×{h})"


def shoot(project: Path, wanted: list[tuple[int, int]], output: Path) -> dict:
    """Captures every requested step with its annotations and returns the actual step counts."""
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
        print("No feedback (no feedback.json).")
        return
    if args.clear:
        archive = project / ".inspection" / "feedback-archive"
        archive.mkdir(parents=True, exist_ok=True)
        shutil.move(source, archive / time.strftime("%Y%m%d-%H%M%S.json"))
        print(f"Feedback archived in {archive}")
        return

    data = json.loads(source.read_text())
    slides = sorted(((int(k), v) for k, v in data.get("slides", {}).items()), key=lambda s: s[0])
    output = project / ".inspection" / "review"
    shutil.rmtree(output, ignore_errors=True)
    output.mkdir(parents=True)

    # One capture per annotated step, plus one of the last step (0) when there is only a note.
    wanted = [(n, int(step)) for n, slide in slides for step in sorted(slide["steps"], key=int)] + [
        (n, 0) for n, slide in slides if not slide["steps"]
    ]
    counts = {} if args.no_shots else shoot(project, wanted, output)

    lines = [f"# Feedback — {project.name}", "", f"Updated: {data.get('updated', '?')}", ""]
    for n, slide in slides:
        name = f" · `{slide['name']}()`" if slide.get("name") else ""
        lines += [f"## Slide {n}{name}", ""]
        if not args.no_shots and n not in counts:
            lines += ["⚠ This slide no longer exists.", ""]
        if slide.get("note", "").strip():
            lines += [f'General note: "{slide["note"].strip()}"', ""]
            if not slide["steps"]:
                lines += [f"Capture: `s{n:02d}-e00.png` (last step)", ""]
        for step in sorted(slide["steps"], key=int):
            warn = ""
            if n in counts and int(step) > counts[n]:
                warn = f" ⚠ the slide now has only {counts[n]} steps"
            lines += [f"### Step {step} — `s{n:02d}-e{int(step):02d}.png`{warn}", ""]
            for i, item in enumerate(slide["steps"][step], 1):
                note = item.get("note", "").strip()
                comment = f'"{note}"' if note else "(no comment)"
                if item["kind"] == "stroke":
                    x, y, w, h = item["box"]
                    where = f"area ({x}, {y}, {w}×{h})"
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
    print(f"Captures and summary: {output}")


if __name__ == "__main__":
    main()
