import argparse
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "templates" / "presentation"
THEMES = ROOT / "deck" / "themes"
DEFAULT_THEME = "paper"


def themes() -> list[str]:
    """Available themes: one stylesheet per theme in deck/themes/."""
    return sorted(path.stem for path in THEMES.glob("*.css"))


def fill(text: str, values: dict[str, str]) -> str:
    """Replaces the {{key}} placeholders of a template file."""
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    return text


def values_for(path: str, title: str, theme: str, author: str = "") -> dict[str, str]:
    return {
        "title": title,
        "path": path,
        "theme": theme,
        "author": author or "Auteur",
        "date": date.today().strftime("%d/%m/%Y"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a presentation from the template.")
    parser.add_argument("path", type=Path, help="e.g. presentations/2026/my_course")
    parser.add_argument("--title", help="displayed title (default: folder name)")
    parser.add_argument("--theme", default=DEFAULT_THEME, help=f"one of: {', '.join(themes())}")
    parser.add_argument("--author", default="", help="author shown on the title page and footer")
    args = parser.parse_args()
    if args.theme not in themes():
        raise SystemExit(f"unknown theme {args.theme!r} (available: {', '.join(themes())})")
    target = (ROOT / args.path).resolve()
    if target.exists():
        raise SystemExit(f"{target} already exists")
    title = args.title or target.name.replace("_", " ").capitalize()
    shutil.copytree(TEMPLATE, target)
    values = values_for(target.relative_to(ROOT).as_posix(), title, args.theme, args.author)
    for file in target.rglob("*"):
        if file.is_file():
            file.write_text(fill(file.read_text(), values))
    print(f"python3 tools/serve.py {target.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
