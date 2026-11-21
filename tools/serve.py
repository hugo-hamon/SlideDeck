import argparse
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
WATCHED = {".html", ".css", ".js", ".svg", ".json", ".png", ".jpg"}
POLL_SECONDS = 0.25
PING_SECONDS = 15


def latest_change(folders: list[Path]) -> float:
    """Date de la dernière modification parmi les fichiers suivis."""
    return max(
        (p.stat().st_mtime for f in folders for p in f.rglob("*") if p.suffix in WATCHED),
        default=0.0,
    )


class DeckHandler(SimpleHTTPRequestHandler):
    """Sert le dépôt et pousse un événement /__reload à chaque sauvegarde."""

    def __init__(self, *args: Any, folders: list[Path], **kwargs: Any) -> None:
        self.folders = folders
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        if self.path == "/__reload":
            self.stream_reload()
        else:
            super().do_GET()

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
