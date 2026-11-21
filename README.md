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
4. Give feedback by step, e.g. *"slide 2, step 3: the formula is too close to the graph"*.

## Layout

```text
deck/            engine (deck.js), components (components.js), theme (theme.css)
tools/           serve.py · capture.py · new.py
templates/       starting point for new presentations
presentations/   one folder per talk: index.html + pages/*.js
```

A slide is a function that builds its content and returns a GSAP timeline; `pause(tl)` marks
where the speaker stops. See [`AGENTS.md`](AGENTS.md) for the details.
