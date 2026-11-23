# SlideDeck

Animated scientific presentations written as plain HTML, SVG and JavaScript (GSAP + KaTeX).
No build step: save a file and the slide reloads in under a second. Each presentation is
a folder; the engine, components and visual theme are shared.

Designed to be authored with an AI coding agent (Claude Code, Codex…): the agent writes
slides, captures every step in a headless browser and checks its own work.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m playwright install chromium   # only needed for captures
```

## Present

```bash
python3 tools/serve.py presentations/2026/pooling_course
```

Open the printed URL. `→` / `Space` / `PageDown`: next step · `←` / `PageUp`: previous step ·
`f`: fullscreen · `Home` / `End`: first / last slide. The URL (`#/slide/step`) is a direct link
to any step.

An internet connection is required: GSAP, KaTeX and the font load from a CDN.

## Work with an agent

1. Create a presentation:
   ```bash
   python3 tools/new.py presentations/2026/my_talk --title "My talk"
   ```
2. Start the preview (command above) and ask the agent for a slide, e.g. *"In my_talk, add a
   slide showing message passing on a small graph, three steps"*.
   The agent follows [`AGENTS.md`](AGENTS.md) (structure, slide contract, design and
   motion rules); Claude Code loads it automatically through `CLAUDE.md`.
3. The agent checks every step with:
   ```bash
   .venv/bin/python tools/capture.py presentations/2026/my_talk
   ```
   → `.inspection/storyboard.jpg` (one image per step) and `report.json`.
4. Give feedback directly on the slides: press **`e`** in the browser to enter edit mode
   (see below), annotate, then tell the agent *"read my feedback"*.

## Edit mode (feedback)

Press `e` during the preview to open the edit panel; the slide shrinks to make room.
Navigation keys keep working.

| Key | Tool |
| --- | --- |
| `p` | **Pen**: circle the element that is wrong, then type a comment in the panel |
| `n` | **Note**: click to drop a numbered pin with a comment |
| `x` | **Eraser**: click an annotation to delete it |
| `Ctrl Z` | Undo |
| `e` / `Esc` | Leave edit mode |

The panel also holds a **general note** per slide and the list of slides that have feedback
(click to jump). Annotations belong to a slide *and* a step; those of earlier steps are shown
faded. Everything is saved to `<presentation>/feedback.json` by `serve.py` (git-ignored);
for each circled zone the circled elements (tag, text, LaTeX, position) are recorded too.

The agent reads it with:

```bash
.venv/bin/python tools/review.py presentations/2026/my_talk          # summary + annotated captures
.venv/bin/python tools/review.py presentations/2026/my_talk --clear  # archive once handled
```

→ `.inspection/review/review.md` and one annotated image per step (`sNN-eNN.png`).

## Layout

```text
deck/            engine (deck.js), components (components.js), theme (theme.css),
                 edit mode (review.js, review.css)
tools/           serve.py · capture.py · review.py · new.py
templates/       starting point for new presentations
presentations/   one folder per talk: index.html + pages/*.js
```

A slide is a function that builds its content and returns a GSAP timeline; `pause(tl)` marks
where the speaker stops. See [`AGENTS.md`](AGENTS.md) for the details.
