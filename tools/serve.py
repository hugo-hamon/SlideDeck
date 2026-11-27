import argparse
import json
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import uuid
import zipfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlsplit

import bib
import library
import new

ROOT = Path(__file__).resolve().parent.parent
WATCHED = {".html", ".css", ".js", ".svg", ".json", ".png", ".jpg"}
POLL_SECONDS = 0.25
PING_SECONDS = 15
FEEDBACK = "feedback.json"
NOTES = "notes.json"
VENV_PYTHON = ROOT / ".venv" / "bin" / "python"
JOBS: dict[str, dict[str, Any]] = {}
# references.bib written by the `b` window: mtime after the write → mtime before it.
# The watcher keeps seeing the old date, so adding a reference does not reload the page.
SELF_WRITES: dict[Path, tuple[float, float]] = {}


def latest_change(folders: list[Path], files: tuple[Path, ...] = ()) -> float:
    """Date of the latest change among the watched files.

    Edit-mode feedback, notes, library details and hidden folders (.inspection…) are
    ignored: saving them must not reload the page. `files` are watched too (the shared
    bibliography), unless the server wrote them itself from the `b` window.
    """
    watched = (
        p
        for f in folders
        for p in f.rglob("*")
        if p.suffix in WATCHED
        and p.name not in (FEEDBACK, NOTES, library.META)
        and not any(part.startswith(".") for part in p.relative_to(f).parts)
    )
    dates = [p.stat().st_mtime for p in watched]
    for file in files:
        if file.exists():
            date = file.stat().st_mtime
            written, before = SELF_WRITES.get(file, (None, 0.0))
            dates.append(before if date == written else date)
    return max(dates, default=0.0)


def project_folder(url: str, suffix: str) -> Path | None:
    """<presentation>/<suffix> → presentation folder, if it really is one."""
    path = unquote(urlsplit(url).path)
    if not path.endswith(f"/{suffix}"):
        return None
    folder = (ROOT / path.removesuffix(suffix).lstrip("/")).resolve()
    if ROOT not in folder.parents or not (folder / "index.html").is_file():
        return None
    return folder


def feedback_file(url: str) -> Path | None:
    """<presentation>/__feedback → feedback.json and <presentation>/__notes → notes.json."""
    for suffix, name in (("__feedback", FEEDBACK), ("__notes", NOTES)):
        if folder := project_folder(url, suffix):
            return folder / name
    return None


def gif_python() -> str | None:
    """Interpreter able to run tools/gif.py (Playwright and Pillow installed)."""
    if not hasattr(gif_python, "cached"):
        candidates = [str(VENV_PYTHON)] if VENV_PYTHON.exists() else []
        candidates.append(sys.executable)
        gif_python.cached = next(  # type: ignore[attr-defined]
            (
                python
                for python in candidates
                if subprocess.run(
                    [python, "-c", "import playwright, PIL"], capture_output=True
                ).returncode
                == 0
            ),
            None,
        )
    return gif_python.cached  # type: ignore[attr-defined]


def run_gif_job(job: dict[str, Any], project: Path, options: dict[str, Any]) -> None:
    """Runs tools/gif.py in a temporary folder and follows its progress."""
    output = Path(tempfile.mkdtemp(prefix="deck-gif-"))
    job["dir"] = output
    slides = [int(n) for n in options.get("slides", [])]
    command = [
        str(gif_python()),
        str(ROOT / "tools" / "gif.py"),
        str(project.relative_to(ROOT)),
        "--fps", str(int(options.get("fps", 25))),
        "--width", str(int(options.get("width", 960))),
        "--hold", str(float(options.get("hold", 1.5))),
        "-o", str(output),
        "--progress",
    ]  # fmt: skip
    if slides:
        command += ["--slide", *map(str, slides)]
    if options.get("combined"):
        command.append("--combined")
    if not options.get("loop", True):
        command.append("--once")
    process = subprocess.Popen(
        command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
    )
    log: list[str] = []
    for line in process.stdout or []:
        if line.startswith("@progress "):
            _, fraction, message = line.rstrip().split(" ", 2)
            job.update(progress=float(fraction), message=message)
        else:
            log.append(line)
    if process.wait() != 0:
        job["error"] = "".join(log[-6:]) or "tools/gif.py failed"
        return
    gifs = sorted(output.glob("*.gif"))
    if not gifs:
        job["error"] = "aucune image produite"
        return
    if len(gifs) == 1:
        job["file"] = gifs[0]
    else:
        archive = output / f"{project.name}-gif.zip"
        with zipfile.ZipFile(archive, "w") as zipped:
            for gif in gifs:
                zipped.write(gif, gif.name)
        job["file"] = archive
    job.update(progress=1.0, message="Done", done=True)


def guarded_job(job: dict[str, Any], project: Path, options: dict[str, Any]) -> None:
    """An unexpected error is reported to the browser instead of leaving it waiting."""
    try:
        run_gif_job(job, project, options)
    except Exception as error:  # noqa: BLE001
        job["error"] = str(error)


def send_json(handler: SimpleHTTPRequestHandler, data: object, status: int = 200) -> None:
    body = json.dumps(data).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def send_bib(handler: SimpleHTTPRequestHandler, url: str) -> bool:
    """<presentation>/__bib → shared bibliography (entries, citations), if it is one."""
    if (project := project_folder(url, "__bib")) is None:
        return False
    send_json(handler, bib.payload(project))
    return True


def send_feedback(handler: SimpleHTTPRequestHandler, target: Path) -> None:
    """Returns the saved feedback, or an empty object (no 404 in the console)."""
    body = target.read_bytes() if target.exists() else b"{}"
    handler.send_response(200)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class DeckHandler(SimpleHTTPRequestHandler):
    """Serves the repository and pushes a /__reload event on every save."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/__reload":
            self.stream_reload()
        elif path == "/favicon.ico":
            self.path = "/deck/favicon.ico"
            super().do_GET()
        elif path in ("/", "/index.html"):
            self.path = "/deck/home.html"
            super().do_GET()
        elif path == "/__library":
            send_json(self, library.entries())
        elif path == "/__bib":
            send_json(self, bib.payload())
        elif path.startswith("/__template/"):
            self.template_get(path.removeprefix("/__template/"))
        elif (target := feedback_file(self.path)) is not None:
            send_feedback(self, target)
        elif send_bib(self, self.path):
            pass
        elif "/__export/" in self.path:
            self.export_get()
        else:
            super().do_GET()

    def template_get(self, rest: str) -> None:
        """Template preview of the home page: /__template/<theme>/<file>, placeholders filled."""
        theme, _, name = rest.partition("/")
        if name in ("__feedback", "__notes"):
            send_json(self, {})
            return
        if name == "__bib":
            send_json(self, {"file": "", "project": "", "entries": [], "cited": [], "usage": {}})
            return
        file = (new.TEMPLATE / (name or "index.html")).resolve()
        if theme not in new.themes() or new.TEMPLATE not in file.parents or not file.is_file():
            self.send_error(404)
            return
        values = new.values_for("", "Titre de la présentation", theme, "Ada Lovelace")
        body = new.fill(file.read_text(), values).encode()
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(str(file)))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def export_get(self) -> None:
        """GIF export from the options window: availability, progress, file."""
        query = parse_qs(urlsplit(self.path).query)
        job = JOBS.get(query.get("job", [""])[0])
        if project_folder(self.path, "__export/ping"):
            send_json(self, {"gif": gif_python() is not None})
        elif job is None:
            self.send_error(404)
        elif project_folder(self.path, "__export/status"):
            send_json(self, {k: job.get(k) for k in ("progress", "message", "done", "error")})
        elif project_folder(self.path, "__export/file") and job.get("file"):
            path: Path = job["file"]
            body = path.read_bytes()
            self.send_response(200)
            self.send_header(
                "Content-Type", "image/gif" if path.suffix == ".gif" else "application/zip"
            )
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Content-Disposition", f'attachment; filename="{path.name}"')
            self.end_headers()
            self.wfile.write(body)
            shutil.rmtree(job["dir"], ignore_errors=True)
            JOBS.pop(query["job"][0], None)
        else:
            self.send_error(404)

    def library_post(self, action: str) -> None:
        """Home page: tags / archive / star / details, creation, duplication and deletion."""
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            if action == "update":
                send_json(self, library.update(data))
            elif action == "new":
                send_json(self, {"path": library.create(data)})
            elif action == "duplicate":
                send_json(self, {"path": library.duplicate(data)})
            elif action == "delete":
                send_json(self, {"path": library.delete(data)})
            else:
                self.send_error(404)
        except ValueError as error:
            send_json(self, {"error": str(error)}, 400)

    def bib_post(self, project: Path) -> None:
        """`b` window: adds BibTeX, DOIs or arXiv identifiers to the shared bibliography."""
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        except ValueError:
            self.send_error(400)
            return
        target = bib.bib_file(project)
        # Date the watcher last saw: kept across several additions in a row.
        date = target.stat().st_mtime if target.exists() else 0.0
        written, seen = SELF_WRITES.get(target, (None, date))
        before = seen if date == written else date
        result = bib.add(target, str(data.get("input", "")))
        if result["added"]:
            SELF_WRITES[target] = (target.stat().st_mtime, before)
        send_json(self, {**result, **bib.payload(project)})

    def collection_bib_post(self, action: str) -> None:
        """Home page: add, edit or delete references of presentations/references.bib."""
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            target = bib.COLLECTION / bib.BIB
            if action == "add":
                result = bib.add(target, str(data.get("input", "")))
            elif action == "edit":
                result = bib.edit(
                    target, str(data["key"]), str(data["bibtex"]), bool(data.get("rename"))
                )
            elif action == "delete":
                result = bib.delete(target, str(data["key"]))
            else:
                self.send_error(404)
                return
            send_json(self, {**result, **bib.payload()})
        except (ValueError, KeyError, OSError) as error:
            send_json(self, {"error": str(error)}, 400)

    def do_POST(self) -> None:
        """Edit-mode feedback, notes, bibliography, GIF export or the home page library."""
        path = urlsplit(self.path).path
        if path.startswith("/__library"):
            self.library_post(path.removeprefix("/__library").strip("/") or "update")
            return
        if path.startswith("/__bib/"):
            self.collection_bib_post(path.removeprefix("/__bib/"))
            return
        if (project := project_folder(self.path, "__bib")) is not None:
            self.bib_post(project)
            return
        if (project := project_folder(self.path, "__export/gif")) is not None:
            if gif_python() is None:
                self.send_error(501, "Playwright not found: install the .venv (see README)")
                return
            options = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            name = uuid.uuid4().hex
            JOBS[name] = {"progress": 0.0, "message": "Starting the browser…", "done": False}
            threading.Thread(
                target=guarded_job, args=(JOBS[name], project, options), daemon=True
            ).start()
            send_json(self, {"job": name})
            return
        target = feedback_file(self.path)
        if target is None:
            self.send_error(404)
            return
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        except ValueError:
            self.send_error(400)
            return
        if data.get("slides") or data.get("notes"):
            target.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        else:
            target.unlink(missing_ok=True)
        self.send_response(204)
        self.end_headers()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def stream_reload(self) -> None:
        """Watches the listening page's presentation (from Referer) and the engine."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        page = urlsplit(self.headers.get("Referer", "")).path
        project = library.folder_of(unquote(page).rsplit("/", 1)[0]) if page else None
        self.folders = [ROOT / "deck"] + ([project] if project else [])
        files = (bib.bib_file(project),) if project else ()
        last = latest_change(self.folders, files)
        quiet = 0.0
        try:
            while True:
                time.sleep(POLL_SECONDS)
                quiet += POLL_SECONDS
                now = latest_change(self.folders, files)
                if now != last:
                    last, quiet = now, 0.0
                    self.wfile.write(b"data: reload\n\n")
                elif quiet >= PING_SECONDS:
                    quiet = 0.0
                    self.wfile.write(b": ping\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, format: str, *args: object) -> None:
        if "/__reload" not in str(args[0]) and "/__export/status" not in str(args[0]):
            super().log_message(format, *args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Local server with live reload and a home page.")
    parser.add_argument(
        "project",
        type=Path,
        nargs="?",
        help="presentation to open (optional, the home page otherwise)",
    )
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), DeckHandler)
    print(f"Home: http://localhost:{args.port}/", flush=True)
    if args.project:
        project = (ROOT / args.project).resolve()
        print(f"http://localhost:{args.port}/{project.relative_to(ROOT).as_posix()}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
