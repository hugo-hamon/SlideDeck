import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "templates" / "presentation"


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a presentation from the template.")
    parser.add_argument("path", type=Path, help="e.g. presentations/2026/my_course")
    parser.add_argument("--title", help="displayed title (default: folder name)")
    args = parser.parse_args()
    target = (ROOT / args.path).resolve()
    if target.exists():
        raise SystemExit(f"{target} already exists")
    title = args.title or target.name.replace("_", " ").capitalize()
    shutil.copytree(TEMPLATE, target)
    for file in target.rglob("*"):
        if file.is_file():
            text = file.read_text().replace("{{title}}", title)
            file.write_text(text.replace("{{path}}", target.relative_to(ROOT).as_posix()))
    print(f"python3 tools/serve.py {target.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
