"""Presentation library for the home page of tools/serve.py.

Each presentation keeps its library details (tags, archive, star, description, date, venue)
in `meta.json`, next to its `index.html`: they follow the folder if it is moved.
"""

import html
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
PRESENTATIONS = ROOT / "presentations"
META = "meta.json"
SKIPPED = {".inspection", "export", "feedback.json", "notes.json", "__pycache__"}
NAME = re.compile(r"^[a-z0-9][a-z0-9_]*$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def folder_of(path: str) -> Path | None:
    """presentations/<year>/<name> → folder, if it really is a presentation."""
    folder = (ROOT / path.strip("/")).resolve()
    if PRESENTATIONS not in folder.parents or not (folder / "index.html").is_file():
        return None
    return folder


def read_meta(folder: Path) -> dict[str, Any]:
    try:
        return json.loads((folder / META).read_text())
    except (OSError, ValueError):
        return {}


def title_of(folder: Path) -> str:
    match = re.search(r"<title>(.*?)</title>", (folder / "index.html").read_text(), re.S)
    return html.unescape(match.group(1).strip()) if match else folder.name


def set_title(folder: Path, title: str) -> None:
    """The title lives in index.html's <title> tag (browser tab, home page)."""
    index = folder / "index.html"
    safe = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(
        r"<title>.*?</title>",
        lambda _: f"<title>{safe}</title>",
        index.read_text(),
        count=1,
        flags=re.S,
    )
    index.write_text(text)


def modified(folder: Path) -> float:
    """Last modification of a presentation file (captures and exports excluded)."""
    return max(
        (
            p.stat().st_mtime
            for p in folder.rglob("*")
            if p.is_file() and not SKIPPED.intersection(p.relative_to(folder).parts)
        ),
        default=0.0,
    )


def entries() -> list[dict[str, Any]]:
    out = []
    for index in sorted(PRESENTATIONS.glob("*/*/index.html")):
        folder = index.parent
        meta = read_meta(folder)
        out.append(
            {
                "path": folder.relative_to(ROOT).as_posix(),
                "year": folder.parent.name,
                "name": folder.name,
                "title": title_of(folder),
                "tags": meta.get("tags", []),
                "archived": bool(meta.get("archived")),
                "starred": bool(meta.get("starred")),
                "modified": modified(folder),
                "pages": len(list((folder / "pages").glob("*.js"))),
                "feedback": (folder / "feedback.json").exists(),
                "notes": (folder / "notes.json").exists(),
                "description": meta.get("description", ""),
                "date": meta.get("date", ""),
                "venue": meta.get("venue", ""),
            }
        )
    return out


def update(data: dict[str, Any]) -> dict[str, Any]:
    """Updates tags, archive, star, title, description, date and venue, then returns the entry."""
    folder = folder_of(str(data.get("path", "")))
    if folder is None:
        raise ValueError("presentation not found")
    meta = read_meta(folder)
    if "tags" in data:
        tags = [str(t).strip()[:40] for t in data["tags"] if str(t).strip()]
        meta["tags"] = list(dict.fromkeys(tags))
    for key in ("archived", "starred"):
        if key in data:
            meta[key] = bool(data[key])
    for key, limit in (("description", 400), ("venue", 120)):
        if key in data:
            meta[key] = str(data[key]).strip()[:limit]
    if "date" in data:
        value = str(data["date"]).strip()
        if value and not DATE.match(value):
            raise ValueError("invalid date (YYYY-MM-DD)")
        meta["date"] = value
    if str(data.get("title", "")).strip():
        set_title(folder, str(data["title"]).strip()[:120])
    (folder / META).write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    return next(e for e in entries() if e["path"] == folder.relative_to(ROOT).as_posix())


def create(data: dict[str, Any]) -> str:
    """New presentation from the template (tools/new.py); returns its path."""
    name = str(data.get("name", "")).strip()
    year = str(data.get("year") or date.today().year).strip()
    if not NAME.match(name) or not year.isdigit():
        raise ValueError("invalid folder name (lowercase letters, digits and _)")
    path = f"presentations/{year}/{name}"
    command = [sys.executable, str(ROOT / "tools" / "new.py"), path]
    if str(data.get("title", "")).strip():
        command += ["--title", str(data["title"]).strip()]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise ValueError(result.stderr.strip() or result.stdout.strip() or "new.py failed")
    return path


def duplicate(data: dict[str, Any]) -> str:
    """Copies a presentation (without captures, exports or feedback) into the same year."""
    source = folder_of(str(data.get("path", "")))
    if source is None:
        raise ValueError("presentation not found")
    target = source.with_name(f"{source.name}_copie")
    k = 2
    while target.exists():
        target = source.with_name(f"{source.name}_copie{k}")
        k += 1
    shutil.copytree(source, target, ignore=lambda _, names: [n for n in names if n in SKIPPED])
    index = target / "index.html"
    page = index.read_text()
    index.write_text(
        re.sub(r"<title>(.*?)</title>", r"<title>\1 (copy)</title>", page, count=1, flags=re.S)
    )
    meta = read_meta(target)
    meta.pop("archived", None)
    (target / META).write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    return target.relative_to(ROOT).as_posix()
