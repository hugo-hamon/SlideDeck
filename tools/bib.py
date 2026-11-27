"""Shared bibliography: a `references.bib` file read by the slides and the `b` window.

The file used by a presentation is the nearest `references.bib` among its parent folders,
so `presentations/references.bib` is shared by every presentation of every year. Slides
cite entries with `cite("key")` (deck/components.js), which this module finds by scanning
the JavaScript sources.

    python3 tools/bib.py presentations/2026/demo            # entries and citations
    python3 tools/bib.py presentations/2026/demo --add 10.1109/TNNLS.2022.3190922

The home page manages the collection's file (presentations/references.bib): where each
reference is cited (presentation and slide numbers), editing and deletion.
"""

import argparse
import json
import re
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
BIB = "references.bib"
# Collection managed from the home page.
COLLECTION = ROOT / "presentations"
TIMEOUT = 12
USER_AGENT = "SlideDeck/1.0 (bibliography)"

# cite("a"), cite("a", "b"), citet("a", { page: "p. 3" })…: the string arguments are keys.
CITE_CALL = re.compile(r"\bcite[tp]?\(([^)]*)\)")
STRING = re.compile(r"""(["'`])([^"'`\n]+?)\1""")
# The values of an options object ({ page: "p. 3" }) are not keys.
OPTIONS = re.compile(r"\{[^}]*\}")
# Top-level function declarations of a page: a citation belongs to the one above it.
FUNCTION = re.compile(r"^(export\s+)?(default\s+)?(?:async\s+)?function\s*([\w$]*)\s*\(", re.M)
IMPORT = re.compile(r"""import\s+([\w$\s{},]+?)\s+from\s+["']\./([^"']+)["']""")
DECK_CITE = re.compile(r"""import\s*\{[^}]*\bcite[tp]?\b[^}]*\}\s*from\s*["']deck/components\.js""")
KEY = re.compile(r"[^\s,{}()\"'`#%~\\]+")

DOI = re.compile(r"\b(10\.\d{4,9}/[^\s\"'<>{}]+)")
ARXIV = re.compile(
    r"(?:arxiv[:/]\s*|arxiv\.org/(?:abs|pdf)/)?\b(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?:v\d+)?",
    re.I,
)

MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split()
ACCENTS = {
    "'": "\u0301", "`": "\u0300", "^": "\u0302", '"': "\u0308", "~": "\u0303",
    "=": "\u0304", ".": "\u0307", "u": "\u0306", "v": "\u030c", "H": "\u030b",
    "c": "\u0327", "k": "\u0328", "r": "\u030a", "d": "\u0323", "b": "\u0331",
}  # fmt: skip
SYMBOLS = {
    "ss": "ß", "o": "ø", "O": "Ø", "ae": "æ", "AE": "Æ", "oe": "œ", "OE": "Œ",
    "aa": "å", "AA": "Å", "l": "ł", "L": "Ł", "i": "ı", "j": "ȷ",
    "&": "&", "%": "%", "_": "_", "#": "#", "$": "$", "{": "{", "}": "}",
    "textendash": "–", "textemdash": "—", "textquoteright": "’", "textquoteleft": "‘",
    "ldots": "…", "dots": "…", "textellipsis": "…",
}  # fmt: skip


# ---------- locating ----------


def bib_file(project: Path) -> Path:
    """Nearest references.bib above the presentation, or a new one at the collection root.

    For presentations/2026/demo, the default is presentations/references.bib.
    """
    project = project.resolve()
    for folder in [project, *project.parents]:
        if folder == ROOT:
            break
        if (folder / BIB).is_file():
            return folder / BIB
    top = ROOT / project.relative_to(ROOT).parts[0]
    return top / BIB


def presentations_under(folder: Path) -> list[Path]:
    """Presentation folders (with an index.html) below `folder`, hidden ones excluded."""
    return sorted(
        index.parent
        for index in folder.rglob("index.html")
        if not any(part.startswith(".") for part in index.relative_to(folder).parts)
        and (index.parent / "pages").is_dir()
    )


def sources(project: Path) -> list[Path]:
    """JavaScript files of a presentation: helpers next to index.html, then pages/."""
    return sorted(project.glob("*.js")) + sorted((project / "pages").rglob("*.js"))


def keys_in(arguments: str) -> list[str]:
    """Keys of one call's arguments: `"a", "b, c", { page: "p. 3" }` → [a, b, c].

    A string that is not a list of keys (free text with spaces) is ignored.
    """
    keys = []
    for _, value in STRING.findall(OPTIONS.sub("", arguments)):
        parts = [part.strip() for part in value.split(",")]
        if all(KEY.fullmatch(part) for part in parts):
            keys += parts
    return keys


def citations(project: Path) -> list[tuple[str, str, str | None]]:
    """(key, file, function) for every citation, the file being relative to the project.

    `function` is the exported slide function containing the call ("default" for
    `export default function`), or None outside an exported function.
    """
    found = []
    for source in sources(project):
        text = source.read_text(errors="ignore")
        # Only the engine's cite(): a presentation may define its own function of that name.
        if not DECK_CITE.search(text):
            continue
        functions = [
            (m.start(), "default" if m.group(2) else m.group(3) if m.group(1) else None)
            for m in FUNCTION.finditer(text)
        ]
        for call in CITE_CALL.finditer(text):
            owner = next((name for at, name in reversed(functions) if at < call.start()), None)
            file = source.relative_to(project).as_posix()
            found += [(key, file, owner) for key in keys_in(call.group(1))]
    return found


def cited_keys(project: Path) -> list[str]:
    """Keys cited in a presentation's sources, in order of first appearance."""
    return list(dict.fromkeys(key for key, _, _ in citations(project)))


def slides_of(project: Path) -> list[tuple[str, str]]:
    """(file, exported name) of each slide, in the order given to startDeck in index.html."""
    index = (project / "index.html").read_text(errors="ignore")
    names: dict[str, tuple[str, str]] = {}
    for spec, file in IMPORT.findall(index):
        default, _, named = spec.partition("{")
        if default.strip(" ,"):
            names[default.strip(" ,")] = (file, "default")
        for part in named.rstrip("} ").split(","):
            original, _, alias = part.strip().partition(" as ")
            if original:
                names[(alias or original).strip()] = (file, original.strip())
    call = re.search(r"startDeck\(\s*\[(.*?)\]", index, re.S)
    if not call:
        return []
    body = re.sub(r"([\"'`]).*?\1", "", call.group(1), flags=re.S)
    return [names[word] for word in re.findall(r"[\w$]+", body) if word in names]


def title_of(project: Path) -> str:
    match = re.search(r"<title>(.*?)</title>", (project / "index.html").read_text(errors="ignore"))
    return match.group(1).strip() if match else project.name


def project_usage(project: Path) -> dict[str, dict[str, Any]]:
    """Key → {slides: [numbers], files: [sources not tied to a slide]} for one presentation."""
    slides = slides_of(project)
    usage: dict[str, dict[str, set]] = {}
    for key, file, owner in citations(project):
        numbers = [
            n
            for n, (slide_file, name) in enumerate(slides, 1)
            if slide_file == file and owner in (None, name)
        ]
        entry = usage.setdefault(key, {"slides": set(), "files": set()})
        if numbers:
            entry["slides"].update(numbers)
        else:
            entry["files"].add(file)
    return {key: {k: sorted(v) for k, v in value.items()} for key, value in usage.items()}


# ---------- parsing ----------


def parse(text: str) -> list[dict[str, Any]]:
    """BibTeX entries as {type, key, fields}, with raw (LaTeX) field values.

    @string macros are expanded, @comment and @preamble skipped.
    """
    entries: list[dict[str, Any]] = []
    macros = {m: m.capitalize() for m in MONTHS}
    i = 0
    while (at := text.find("@", i)) >= 0:
        head = re.match(r"@\s*(\w+)\s*([{(])", text[at:])
        if not head:
            i = at + 1
            continue
        kind = head.group(1).lower()
        start = at + head.end()
        end = matching(text, start - 1)
        body = text[start:end]
        i = end + 1
        if kind in ("comment", "preamble"):
            continue
        if kind == "string":
            for name, value in fields(body, macros).items():
                macros[name] = value
            continue
        key, _, rest = body.partition(",")
        entries.append(
            {
                "type": kind,
                "key": key.strip(),
                "fields": fields(rest, macros),
                "span": (at, min(end + 1, len(text))),
                "text": text[at : end + 1],
            }
        )
    return entries


def matching(text: str, open_at: int) -> int:
    """Index of the bracket closing the one at `open_at` (end of text if unbalanced)."""
    close = "}" if text[open_at] == "{" else ")"
    depth = 0
    for j in range(open_at, len(text)):
        if text[j] == text[open_at]:
            depth += 1
        elif text[j] == close:
            depth -= 1
            if depth == 0:
                return j
    return len(text)


def fields(body: str, macros: dict[str, str]) -> dict[str, str]:
    """`name = {value} # "value" # macro, …` → {name: value}."""
    out: dict[str, str] = {}
    i = 0
    while match := re.compile(r"\s*,?\s*([\w:.+-]+)\s*=\s*").match(body, i):
        name = match.group(1).lower()
        i = match.end()
        parts = []
        while i < len(body):
            if body[i] == "{":
                end = matching(body, i)
                parts.append(body[i + 1 : end])
                i = end + 1
            elif body[i] == '"':
                end = i + 1
                while end < len(body) and (body[end] != '"' or body[end - 1] == "\\"):
                    end += 1
                parts.append(body[i + 1 : end])
                i = end + 1
            else:
                word = re.compile(r"[^\s,#}]+").match(body, i)
                if not word:
                    break
                parts.append(macros.get(word.group(0).lower(), word.group(0)))
                i = word.end()
            hash_sign = re.compile(r"\s*#\s*").match(body, i)
            if not hash_sign:
                break
            i = hash_sign.end()
        out[name] = re.sub(r"\s+", " ", "".join(parts)).strip()
    return out


# ---------- LaTeX to text ----------


def unlatex(value: str) -> str:
    """Accents and symbols to Unicode, braces removed. Math ($…$) is kept for KaTeX."""
    pieces = re.split(r"(\$[^$]*\$)", value)
    return "".join(piece if piece.startswith("$") else text_part(piece) for piece in pieces).strip()


def text_part(value: str) -> str:
    def accent(match: re.Match[str]) -> str:
        letter = (match.group(2) or match.group(3)).lstrip("\\")
        return unicodedata.normalize("NFC", letter + ACCENTS[match.group(1)])

    letter = r"(\\[ij]|[A-Za-z])"
    out = re.sub(rf"\\([`'^\"~=.uvHckrdb])(?:\s*\{{\s*{letter}\s*\}}|\s*{letter})", accent, value)
    # Known symbols are replaced, other commands (\emph, \textsc…) dropped with their name.
    out = re.sub(r"\\([a-zA-Z]+)\s?", lambda m: SYMBOLS.get(m.group(1), ""), out)
    out = re.sub(r"\\([&%_#${}])", lambda m: m.group(1), out)
    out = out.replace("---", "—").replace("--", "–").replace("~", "\u00a0")
    out = out.replace("``", "“").replace("''", "”")
    return re.sub(r"\s+", " ", out.replace("{", "").replace("}", ""))


def split_top(value: str, separator: str) -> list[str]:
    """Splits on `separator` (a regex) outside braces."""
    parts, depth, start = [], 0, 0
    pattern = re.compile(separator, re.I)
    i = 0
    while i < len(value):
        char = value[i]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
        elif depth == 0 and (match := pattern.match(value, i)):
            parts.append(value[start:i])
            i = start = match.end()
            continue
        i += 1
    parts.append(value[start:])
    return [part.strip() for part in parts if part.strip()]


def people(value: str) -> list[dict[str, str]]:
    """BibTeX names ("Last, First and First von Last and {Org}") → [{last, first}]."""
    out = []
    for name in split_top(value, r"\s+and\s+"):
        if name.lower() == "others":
            out.append({"last": "others", "first": ""})
        elif name.startswith("{") and name.endswith("}") and matching(name, 0) == len(name) - 1:
            out.append({"last": unlatex(name), "first": ""})
        elif len(parts := split_top(name, ",")) > 1:
            out.append({"last": unlatex(parts[0]), "first": unlatex(parts[-1])})
        else:
            words = split_top(name, r"\s+")
            last = len(words) - 1
            while last > 0 and words[last - 1][:1].islower():
                last -= 1
            out.append(
                {"last": unlatex(" ".join(words[last:])), "first": unlatex(" ".join(words[:last]))}
            )
    return out


def entry_json(entry: dict[str, Any]) -> dict[str, Any]:
    """Entry ready for the browser: names split, text fields in Unicode."""
    raw = entry["fields"]
    data: dict[str, Any] = {"key": entry["key"], "type": entry["type"]}
    for role in ("author", "editor"):
        if raw.get(role):
            data[f"{role}s"] = people(raw[role])
    for name, value in raw.items():
        if name not in ("author", "editor", "abstract", "file", "keywords"):
            data[name] = value if name in ("url", "doi") else unlatex(value)
    year = re.search(r"\d{4}", raw.get("year", raw.get("date", "")))
    data["year"] = year.group(0) if year else ""
    # The entry as written in the file (edited from the home page), or rebuilt.
    data["bibtex"] = entry.get("text") or serialize(entry)
    return data


# ---------- writing ----------


def serialize(entry: dict[str, Any]) -> str:
    """BibTeX text of one entry, one field per line."""
    width = max((len(name) for name in entry["fields"]), default=0)
    lines = [f"  {name.ljust(width)} = {{{value}}}," for name, value in entry["fields"].items()]
    return f"@{entry['type']}{{{entry['key']},\n" + "\n".join(lines) + "\n}\n"


def ascii_word(text: str) -> str:
    text = unicodedata.normalize(
        "NFKD", text.replace("ß", "ss").replace("ø", "o").replace("ł", "l")
    )
    return re.sub(r"[^a-z]", "", text.encode("ascii", "ignore").decode().lower())


def make_key(entry: dict[str, Any], taken: set[str]) -> str:
    """`lastname` + `year` (grattarola2022), with a letter appended when already taken."""
    authors = people(entry["fields"].get("author") or entry["fields"].get("editor") or "")
    name = ascii_word(authors[0]["last"].split()[-1]) if authors else ""
    if not name:
        name = ascii_word(unlatex(entry["fields"].get("title", "ref")).split(" ")[0]) or "ref"
    year = re.search(r"\d{4}", entry["fields"].get("year", "")) or None
    base = name + (year.group(0) if year else "")
    key, letter = base, ord("a")
    while key in taken:
        key = f"{base}{chr(letter)}"
        letter += 1
    return key


def fetch(url: str, accept: str) -> str:
    request = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        return response.read().decode("utf-8", errors="replace")


def resolve(item: str) -> tuple[str, str]:
    """A DOI or arXiv identifier → (BibTeX text, identifier)."""
    if doi := DOI.search(item):
        identifier = doi.group(1).rstrip(".,;")
        return fetch(
            f"https://doi.org/{identifier}", "application/x-bibtex; charset=utf-8"
        ), identifier
    if arxiv := ARXIV.search(item):
        identifier = arxiv.group(1)
        return fetch(f"https://arxiv.org/bibtex/{identifier}", "text/plain"), identifier
    raise ValueError(f"not a DOI, an arXiv identifier or BibTeX: {item}")


def same_work(a: dict[str, Any], b: dict[str, Any]) -> bool:
    """Same DOI, same arXiv identifier, or same title and year."""
    fa, fb = a["fields"], b["fields"]
    for name in ("doi", "eprint"):
        if fa.get(name) and fa.get(name, "").lower() == fb.get(name, "").lower():
            return True
    title = lambda f: ascii_word(unlatex(f.get("title", "")))  # noqa: E731
    return bool(title(fa)) and title(fa) == title(fb) and fa.get("year") == fb.get("year")


def add(target: Path, text: str) -> dict[str, list[str]]:
    """Adds BibTeX entries, DOIs or arXiv identifiers (one per line or space separated).

    Fetched entries get a `lastname+year` key, pasted BibTeX keeps its own key unless it
    is already taken. A work already in the file is not added twice.
    """
    existing = parse(target.read_text()) if target.exists() else []
    taken = {entry["key"] for entry in existing}
    found: list[tuple[dict[str, Any], bool]] = []
    errors: list[str] = []
    if "@" in text and "{" in text:
        found += [(entry, False) for entry in parse(text)]
    else:
        for item in text.split():
            try:
                bibtex, identifier = resolve(item)
                entries = parse(bibtex)
                if not entries:
                    raise ValueError(f"no BibTeX returned for {identifier}")
                found.append((entries[0], True))
            except (urllib.error.URLError, TimeoutError, ValueError) as error:
                errors.append(f"{item}: {getattr(error, 'reason', error)}")
    added, present, appended = [], [], []
    for entry, fetched in found:
        if duplicate := next((e for e in existing if same_work(e, entry)), None):
            present.append(duplicate["key"])
            continue
        if fetched or not entry["key"] or entry["key"] in taken:
            entry["key"] = make_key(entry, taken)
        taken.add(entry["key"])
        existing.append(entry)
        added.append(entry["key"])
        appended.append(serialize(entry))
    if appended:
        target.parent.mkdir(parents=True, exist_ok=True)
        before = target.read_text() if target.exists() else ""
        separator = (
            ""
            if not before or before.endswith("\n\n")
            else ("\n" if before.endswith("\n") else "\n\n")
        )
        target.write_text(before + separator + "\n".join(appended))
    if not found and not errors:
        errors.append("nothing recognised: paste BibTeX, a DOI or an arXiv identifier")
    return {"added": added, "present": present, "errors": errors}


# ---------- served payload ----------


def payload(project: Path | None = None) -> dict[str, Any]:
    """Entries, cited keys and where each key is cited.

    For a presentation, `cited` holds its own keys. Without one (home page), the file is
    the collection's and `cited` holds every key cited anywhere. `usage` maps a key to
    [{project, title, slides, files}], `project` being a path from the repository root.
    """
    project = project.resolve() if project else None
    target = bib_file(project) if project else COLLECTION / BIB
    entries = parse(target.read_text()) if target.exists() else []
    usage: dict[str, list[dict[str, Any]]] = {}
    for folder in presentations_under(target.parent) if target.parent.is_dir() else []:
        path, title = folder.relative_to(ROOT).as_posix(), title_of(folder)
        for key, where in project_usage(folder).items():
            usage.setdefault(key, []).append({"project": path, "title": title, **where})
    return {
        "file": target.relative_to(ROOT).as_posix(),
        "project": project.relative_to(ROOT).as_posix() if project else "",
        "entries": [entry_json(entry) for entry in entries],
        "cited": cited_keys(project) if project else sorted(usage),
        "usage": usage,
    }


# ---------- editing (home page) ----------


def find(entries: list[dict[str, Any]], key: str) -> dict[str, Any]:
    """Entry of a key, the last one if the key is repeated (as in the slides)."""
    match = [entry for entry in entries if entry["key"] == key]
    if not match:
        raise ValueError(f"no entry with the key {key}")
    return match[-1]


def edit(target: Path, key: str, text: str, rename: bool = False) -> dict[str, Any]:
    """Replaces an entry by the BibTeX typed by the user, the rest of the file untouched.

    When the key changes and `rename` is true, the citations in the slides follow it.
    """
    source = target.read_text()
    old = find(parse(source), key)
    new = parse(text)
    if len(new) != 1:
        raise ValueError("write exactly one BibTeX entry")
    new_key = new[0]["key"]
    if not KEY.fullmatch(new_key):
        raise ValueError(f"invalid key: {new_key or '(empty)'}")
    if new_key != key and any(entry["key"] == new_key for entry in parse(source)):
        raise ValueError(f"the key {new_key} is already used by another entry")
    start, end = old["span"]
    target.write_text(source[:start] + text.strip() + source[end:])
    renamed = rename_key(target.parent, key, new_key) if rename and new_key != key else []
    return {"key": new_key, "renamed": renamed}


def delete(target: Path, key: str) -> dict[str, Any]:
    """Removes an entry and the blank lines around it."""
    source = target.read_text()
    start, end = find(parse(source), key)["span"]
    before, after = source[:start].rstrip(), source[end:].lstrip()
    target.write_text("\n\n".join(part for part in (before, after) if part) + "\n")
    return {"deleted": key}


def rename_key(folder: Path, old: str, new: str) -> list[str]:
    """Renames a key inside the cite() calls of every presentation below `folder`."""
    word = re.compile(rf"(?<![^\s,]){re.escape(old)}(?![^\s,])")

    def in_call(call: re.Match[str]) -> str:
        literals = STRING.sub(
            lambda s: s.group(1) + word.sub(new, s.group(2)) + s.group(1), call.group(1)
        )
        return call.group(0).replace(call.group(1), literals, 1)

    changed = []
    for project in presentations_under(folder):
        for source in sources(project):
            text = source.read_text(errors="ignore")
            if not DECK_CITE.search(text):
                continue
            updated = CITE_CALL.sub(in_call, text)
            if updated != text:
                source.write_text(updated)
                changed.append(source.relative_to(folder).as_posix())
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description="Shared bibliography of the presentations.")
    parser.add_argument("project", type=Path, help="presentation folder")
    parser.add_argument("--add", nargs="+", help="DOIs, arXiv identifiers or a .bib file")
    args = parser.parse_args()
    project = (ROOT / args.project).resolve()
    if args.add:
        items = [Path(a).read_text() if a.endswith(".bib") else a for a in args.add]
        print(json.dumps(add(bib_file(project), "\n".join(items)), indent=2))
        return
    data = payload(project)
    keys = [entry["key"] for entry in data["entries"]]
    known = set(keys)
    print(f"{data['file']}: {len(known)} entries")
    for key in sorted({k for k in keys if keys.count(k) > 1}):
        print(f"  duplicate key: {key} (the last entry wins)")
    for key in data["cited"]:
        print(f"  cited: {key}" + ("" if key in known else "  (unknown key)"))


if __name__ == "__main__":
    main()
