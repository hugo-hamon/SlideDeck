"""Exporte les slides en GIF animés, une image par pas de temps de la timeline.

Chaque étape est rejouée à `--fps` images par seconde puis tenue `--hold` secondes,
comme si l'orateur s'arrêtait. Le rendu est exact : la page est figée à chaque instant
(deck.frame), sans dépendre de la vitesse de la machine.

    .venv/bin/python tools/gif.py presentations/2026/demo              # une GIF par slide
    .venv/bin/python tools/gif.py presentations/2026/demo --slide 3 5  # slides choisies
    .venv/bin/python tools/gif.py presentations/2026/demo --combined   # tout dans une GIF
"""

import argparse
import math
from io import BytesIO
from pathlib import Path

from capture import ROOT, serve
from PIL import Image
from playwright.sync_api import Page, sync_playwright

PALETTE_SAMPLES = 8


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Exporter les slides en GIF animés.")
    parser.add_argument(
        "project", type=Path, help="dossier de la présentation, ex. presentations/2026/demo"
    )
    parser.add_argument("--slide", type=int, nargs="+", help="slides à exporter (à partir de 1)")
    parser.add_argument("--fps", type=int, default=25, help="images par seconde (défaut 25)")
    parser.add_argument("--width", type=int, default=960, help="largeur en px (défaut 960)")
    parser.add_argument(
        "--hold", type=float, default=1.5, help="pause à la fin de chaque étape, en s (défaut 1,5)"
    )
    parser.add_argument(
        "--combined", action="store_true", help="une seule GIF enchaînant les slides choisies"
    )
    parser.add_argument("--once", action="store_true", help="jouer une fois au lieu de boucler")
    parser.add_argument(
        "-o", "--output", type=Path, help="dossier de sortie (défaut <projet>/export)"
    )
    return parser.parse_args()


def shoot(page: Page) -> Image.Image:
    return Image.open(BytesIO(page.screenshot())).convert("RGB")


def record(page: Page, slide: int, fps: int, hold: float) -> list[tuple[Image.Image, int]]:
    """Images (et durées en ms) d'une slide : chaque étape jouée puis tenue."""
    page.evaluate(f"deck.goto({slide}, 1)")
    stops = page.evaluate("deck.info().stops")
    frames: list[tuple[Image.Image, int]] = []
    delay = round(1000 / fps)
    start = 0.0
    for step, end in enumerate(stops, 1):
        count = max(1, math.ceil((end - start) * fps))
        for k in range(1, count + 1):
            page.evaluate(f"deck.frame({slide}, {step}, {k / count})")
            frames.append((shoot(page), delay))
        image, last = frames[-1]
        frames[-1] = (image, last + round(hold * 1000))
        start = end
    return frames


def save_gif(frames: list[tuple[Image.Image, int]], path: Path, loop: bool) -> None:
    """Palette commune (évite le scintillement), images identiques fusionnées."""
    picks = frames[:: max(1, len(frames) // PALETTE_SAMPLES)][:PALETTE_SAMPLES]
    width, height = picks[0][0].size
    sheet = Image.new("RGB", (width, height * len(picks)))
    for i, (image, _) in enumerate(picks):
        sheet.paste(image, (0, i * height))
    palette = sheet.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    images = [image.quantize(palette=palette, dither=Image.Dither.NONE) for image, _ in frames]
    images[0].save(
        path,
        save_all=True,
        append_images=images[1:],
        duration=[duration for _, duration in frames],
        loop=0 if loop else 1,
        optimize=True,
        disposal=1,
    )


def main() -> None:
    args = parse_args()
    project = (ROOT / args.project).resolve()
    output = args.output or project / "export"
    output.mkdir(parents=True, exist_ok=True)
    height = round(args.width * 1080 / 1920)
    server = serve()
    url = f"http://127.0.0.1:{server.server_port}/{project.relative_to(ROOT).as_posix()}/#/1/1"
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": args.width, "height": height})
        page.goto(url)
        page.wait_for_function("window.deck !== undefined")
        page.wait_for_load_state("networkidle")
        count = page.evaluate("deck.info().slides")
        slides = [s for s in args.slide or range(1, count + 1) if 1 <= s <= count]
        combined: list[tuple[Image.Image, int]] = []
        for slide in slides:
            frames = record(page, slide, args.fps, args.hold)
            if args.combined:
                combined += frames
                continue
            path = output / f"slide-{slide:02d}.gif"
            save_gif(frames, path, not args.once)
            print(f"{path}  ({len(frames)} images, {path.stat().st_size / 1e6:.1f} Mo)")
        if args.combined and combined:
            path = output / f"{project.name}.gif"
            save_gif(combined, path, not args.once)
            print(f"{path}  ({len(combined)} images, {path.stat().st_size / 1e6:.1f} Mo)")
        browser.close()
    server.shutdown()


if __name__ == "__main__":
    main()
