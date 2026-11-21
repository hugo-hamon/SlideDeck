import argparse
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
TILE = (640, 360)
COLUMNS = 3
LABEL_HEIGHT = 34
OUT_OF_FRAME_JS = """() => {
  const stage = document.querySelector('.stage').getBoundingClientRect();
  const slide = [...document.querySelectorAll('.slide')].at(-1);
  return [...slide.querySelectorAll('*')]
    .filter((e) => !e.closest('defs, .katex') && getComputedStyle(e).opacity !== '0')
    .map((e) => [e, e.getBoundingClientRect()])
    .filter(([, r]) => r.width && (r.left < stage.left - 1 || r.top < stage.top - 1
      || r.right > stage.right + 1 || r.bottom > stage.bottom + 1))
    .map(([e, r]) => `${e.tagName} ${(e.textContent || '').trim().slice(0, 30)}`);
}"""


def parse_args() -> argparse.Namespace:
    """Lit les options de capture."""
    parser = argparse.ArgumentParser(description="Capturer chaque étape d'un deck web.")
    parser.add_argument(
        "project", type=Path, help="dossier de la présentation, ex. presentations/2026/demo"
    )
    parser.add_argument("--slide", type=int, help="ne capturer que cette slide (à partir de 1)")
    parser.add_argument(
        "--frames",
        type=int,
        default=0,
        help="images intermédiaires par étape, pour juger le mouvement",
    )
    parser.add_argument("-o", "--output", type=Path, help="dossier des résultats")
    return parser.parse_args()


class QuietHandler(SimpleHTTPRequestHandler):
    """Sert le dépôt sans journal ; 204 sur /__reload coupe le rechargement automatique."""

    def do_GET(self) -> None:
        if self.path == "/__reload":
            self.send_response(204)
            self.end_headers()
        else:
            super().do_GET()

    def log_message(self, format: str, *args: object) -> None:
        pass


def serve() -> ThreadingHTTPServer:
    """Sert le dépôt sur un port libre, le temps de la capture."""
    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def capture(page: Page, slide: int, step: int, fraction: float, path: Path) -> None:
    page.evaluate(f"deck.frame({slide}, {step}, {fraction})")
    page.wait_for_timeout(60)
    page.screenshot(path=path)


def storyboard(shots: list[tuple[str, Path]], path: Path) -> None:
    """Assemble les captures dans une planche légendée, dans l'ordre de présentation."""
    rows = -(-len(shots) // COLUMNS)
    sheet = Image.new("RGB", (TILE[0] * COLUMNS, (TILE[1] + LABEL_HEIGHT) * rows), "#20242c")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype("DejaVuSans.ttf", 22)
    for i, (name, shot) in enumerate(shots):
        x = (i % COLUMNS) * TILE[0]
        y = (i // COLUMNS) * (TILE[1] + LABEL_HEIGHT)
        sheet.paste(Image.open(shot).convert("RGB").resize(TILE), (x, y + LABEL_HEIGHT))
        draw.text((x + 10, y + 5), name, fill="#e8ecf2", font=font)
    sheet.save(path, quality=88)


def main() -> None:
    args = parse_args()
    project = (ROOT / args.project).resolve()
    output = args.output or project / ".inspection"
    output.mkdir(parents=True, exist_ok=True)
    server = serve()
    url = f"http://127.0.0.1:{server.server_port}/{project.relative_to(ROOT).as_posix()}/#/1/1"
    report: dict = {"steps": [], "console": []}
    shots: list[tuple[str, Path]] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.on(
            "console",
            lambda m: m.type in ("error", "warning") and report["console"].append(m.text),
        )
        page.on("pageerror", lambda e: report["console"].append(str(e)))
        page.goto(url)
        page.wait_for_function("window.deck !== undefined")
        page.wait_for_load_state("networkidle")
        count = page.evaluate("deck.info().slides")
        for slide in [args.slide] if args.slide else range(1, count + 1):
            page.evaluate(f"deck.goto({slide}, 1)")
            steps = page.evaluate("deck.info().steps")
            for step in range(1, steps + 1):
                for k in range(1, args.frames + 1):
                    fraction = k / (args.frames + 1)
                    path = output / f"s{slide:02d}-e{step:02d}-{round(fraction * 100):02d}.png"
                    capture(page, slide, step, fraction, path)
                    shots.append((f"{slide}.{step} à {fraction:.0%}", path))
                path = output / f"s{slide:02d}-e{step:02d}.png"
                capture(page, slide, step, 1, path)
                shots.append((f"slide {slide} · étape {step}", path))
                report["steps"].append(
                    {
                        "slide": slide,
                        "step": step,
                        "image": path.name,
                        "out_of_frame": page.evaluate(OUT_OF_FRAME_JS),
                    }
                )
        browser.close()
    server.shutdown()
    storyboard(shots, output / "storyboard.jpg")
    (output / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(output / "storyboard.jpg")
    if report["console"]:
        print("Console :", *report["console"], sep="\n  ")


if __name__ == "__main__":
    main()
