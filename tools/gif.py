"""Exports slides as animated GIFs, one frame per timeline time step.

Each step is replayed at `--fps` frames per second, then held for `--hold` seconds, as if
the speaker paused. Rendering is exact: the page is frozen at each instant (deck.frame),
independently of the machine's speed.

    .venv/bin/python tools/gif.py presentations/2026/demo              # one GIF per slide
    .venv/bin/python tools/gif.py presentations/2026/demo --slide 3 5  # chosen slides
    .venv/bin/python tools/gif.py presentations/2026/demo --combined   # all in one GIF
"""

import argparse
import math
from collections.abc import Callable
from io import BytesIO
from pathlib import Path

from capture import ROOT, serve
from PIL import Image
from playwright.sync_api import Page, sync_playwright

PALETTE_SAMPLES = 8


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export slides as animated GIFs.")
    parser.add_argument(
        "project", type=Path, help="presentation folder, e.g. presentations/2026/demo"
    )
    parser.add_argument("--slide", type=int, nargs="+", help="slides to export (from 1)")
    parser.add_argument("--fps", type=int, default=25, help="frames per second (default 25)")
    parser.add_argument("--width", type=int, default=960, help="width in px (default 960)")
    parser.add_argument(
        "--hold", type=float, default=1.5, help="pause at the end of each step, in s (default 1.5)"
    )
    parser.add_argument(
        "--combined", action="store_true", help="a single GIF chaining the chosen slides"
    )
    parser.add_argument("--once", action="store_true", help="play once instead of looping")
    parser.add_argument(
        "-o", "--output", type=Path, help="output folder (default <project>/export)"
    )
    parser.add_argument(
        "--progress", action="store_true", help='prints "@progress f message" lines (for serve.py)'
    )
    return parser.parse_args()


def shoot(page: Page) -> Image.Image:
    return Image.open(BytesIO(page.screenshot())).convert("RGB")


def window(start: float, end: float, loops: list[dict[str, float]]) -> tuple[float, float, bool]:
    """Interval to render for a step, reduced to a single cycle if the step contains a loop.

    The chosen cycle is the loop's second one: the opening animations are over, so the
    GIF loops seamlessly.
    """
    for loop in loops:
        cycle = loop["cycle"]
        if cycle <= 0 or loop["end"] <= start or loop["start"] >= end or end - start < 2 * cycle:
            continue
        first = loop["start"] + max(1, math.ceil((start - loop["start"]) / cycle)) * cycle
        if first + cycle <= end:
            return first, first + cycle, True
    return start, end, False


def record(
    page: Page, slide: int, fps: int, hold: float, report: Callable[[float], None] = lambda f: None
) -> list[tuple[Image.Image, int]]:
    """Frames (and durations in ms) of a slide: each step played, then held.

    `report` receives the progress within the slide, between 0 and 1, as frames are taken.
    """
    page.evaluate(f"deck.goto({slide}, 1)")
    info = page.evaluate("deck.info()")
    stops, loops = info["stops"], info.get("loops", [])
    frames: list[tuple[Image.Image, int]] = []
    delay = round(1000 / fps)
    start = 0.0
    for step, end in enumerate(stops, 1):
        first, last, looping = window(start, end, loops)
        count = max(1, math.ceil((last - first) * fps))
        for k in range(1, count + 1):
            fraction = (first + (last - first) * k / count - start) / (end - start)
            page.evaluate(f"deck.frame({slide}, {step}, {fraction})")
            frames.append((shoot(page), delay))
            if k % 5 == 0 or k == count:
                report((step - 1 + k / count) / len(stops))
        if not looping:
            image, previous = frames[-1]
            frames[-1] = (image, previous + round(hold * 1000))
        start = end
    return frames


def save_gif(frames: list[tuple[Image.Image, int]], path: Path, loop: bool) -> None:
    """Shared palette (avoids flicker), identical frames merged."""
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
        for done, slide in enumerate(slides):

            def report(fraction: float, done: int = done, slide: int = slide) -> None:
                if args.progress:
                    total = (done + fraction) / len(slides)
                    print(
                        f"@progress {total:.4f} Slide {slide} ({done + 1}/{len(slides)})",
                        flush=True,
                    )

            frames = record(page, slide, args.fps, args.hold, report)
            if args.combined:
                combined += frames
                continue
            path = output / f"slide-{slide:02d}.gif"
            save_gif(frames, path, not args.once)
            print(f"{path}  ({len(frames)} images, {path.stat().st_size / 1e6:.1f} MB)")
        if args.combined and combined:
            path = output / f"{project.name}.gif"
            save_gif(combined, path, not args.once)
            print(f"{path}  ({len(combined)} images, {path.stat().st_size / 1e6:.1f} MB)")
        browser.close()
    server.shutdown()


if __name__ == "__main__":
    main()
