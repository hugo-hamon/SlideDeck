import argparse
import json
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
WATCHED = {".html", ".css", ".js", ".svg", ".json", ".png", ".jpg"}
POLL_SECONDS = 0.25
PING_SECONDS = 15
FEEDBACK = "feedback.json"


def latest_change(folders: list[Path]) -> float:
    """Date de la dernière modification parmi les fichiers suivis.

    Les retours du mode Édition et les dossiers cachés (.inspection…) sont ignorés :
    les enregistrer ne doit pas recharger la page.
    """
    return max(
        (
            p.stat().st_mtime
            for f in folders
            for p in f.rglob("*")
            if p.suffix in WATCHED
            and p.name != FEEDBACK
            and not any(part.startswith(".") for part in p.relative_to(f).parts)
        ),
        default=0.0,
    )


def feedback_file(url: str) -> Path | None:
    """<présentation>/__feedback → <présentation>/feedback.json, si c'est bien une présentation."""
    path = unquote(urlsplit(url).path)
    if not path.endswith("/__feedback"):
        return None
    folder = (ROOT / path.removesuffix("__feedback").lstrip("/")).resolve()
    if ROOT not in folder.parents or not (folder / "index.html").is_file():
        return None
    return folder / FEEDBACK


def send_feedback(handler: SimpleHTTPRequestHandler, target: Path) -> None:
    """Renvoie les retours enregistrés, ou un objet vide (pas de 404 dans la console)."""
    body = target.read_bytes() if target.exists() else b"{}"
    handler.send_response(200)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class DeckHandler(SimpleHTTPRequestHandler):
    """Sert le dépôt et pousse un événement /__reload à chaque sauvegarde."""

    def __init__(self, *args: Any, folders: list[Path], **kwargs: Any) -> None:
        self.folders = folders
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        if self.path == "/__reload":
            self.stream_reload()
        elif (target := feedback_file(self.path)) is not None:
            send_feedback(self, target)
        else:
            super().do_GET()

    def do_POST(self) -> None:
        """Enregistre les retours du mode Édition dans <présentation>/feedback.json."""
        target = feedback_file(self.path)
        if target is None:
            self.send_error(404)
            return
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
        except ValueError:
            self.send_error(400)
            return
        if data.get("slides"):
            target.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        else:
            target.unlink(missing_ok=True)
        self.send_response(204)
        self.end_headers()

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def stream_reload(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        last = latest_change(self.folders)
        quiet = 0.0
        try:
            while True:
                time.sleep(POLL_SECONDS)
                quiet += POLL_SECONDS
                now = latest_change(self.folders)
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
        if "/__reload" not in str(args[0]):
            super().log_message(format, *args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Serveur local avec rechargement automatique.")
    parser.add_argument(
        "project", type=Path, help="dossier de la présentation, ex. presentations/2026/demo"
    )
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    project = (ROOT / args.project).resolve()
    folders = [project, ROOT / "deck"]
    handler = partial(DeckHandler, folders=folders)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"http://localhost:{args.port}/{project.relative_to(ROOT).as_posix()}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
