<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo-dark.svg">
    <img src="docs/logo.svg" alt="SlideDeck" width="440">
  </picture>
</p>

<p align="center">
  <b>Animated scientific presentations in plain HTML, SVG and JavaScript.</b><br>
  No build step · step-by-step animations · LaTeX formulas · made to be written with an AI agent
</p>

<p align="center">
  <img src="docs/images/demo-topk.gif" alt="An animated slide: node scores are sorted and the top-k nodes are kept" width="800">
</p>

SlideDeck is a small toolkit for talks and courses where **ideas are built visually, step by
step**: graphs that contract, matrices that fill in, formulas that appear at the right moment.
Each slide is a JavaScript function that draws its content and describes its animation with
[GSAP](https://gsap.com), while formulas are rendered with [KaTeX](https://katex.org). As soon
as you save a file, the slide reloads on the same step in under a second.

It comes with everything around the slides: a home page for your presentations, a presenter
view with notes, a pen and a laser pointer for remote teaching, and HTML, PDF or GIF export.

## Contents

- [Highlights](#highlights)
- [Quick start](#quick-start)
- [Tour](#tour)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Writing slides](#writing-slides)
- [Working with an AI agent](#working-with-an-ai-agent)
- [Command-line tools](#command-line-tools)
- [Project layout](#project-layout)
- [Roadmap](#roadmap)

## Highlights

| | |
| --- | --- |
| 🎞️ **Step-by-step animation** | Every slide is a GSAP timeline in which `pause(tl)` marks where the speaker stops. Going back, direct links (`#/slide/step`) and captures are frame-exact. |
| 🗂️ **Home page** | All your presentations with live thumbnails, search, tags, stars, archive, talk date and venue, and an *Upcoming* view. |
| 🎤 **Presenter view** | A second window with the next step, editable speaker notes, a timer and the clock, synced with the projected window. |
| ✏️ **Pen & laser pointer** | Draw over the slides without any menu on screen (colour wheel on long press), or point with a red laser dot. |
| 📦 **Export** | A single offline `.html` file, a vector PDF (one page per step or per slide), or animated GIFs. |
| 🤖 **Agent-friendly** | An agent writes the slides, captures every step in a headless browser, checks its own work, and reads the feedback you draw on the slides. |
| 🌍 **English / French** | The interface is in English by default, French in one click. |

## Quick start

```bash
git clone <this repository> && cd SlideDeck
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m playwright install chromium   # captures and GIF export only

python3 tools/serve.py                            # → http://localhost:8000/
```

Open the printed address: the home page lists every presentation. Click **New presentation**
to start one from the template, or open the example course in `presentations/2026/`.

> An internet connection is needed while presenting from the server: GSAP, KaTeX and the
> EB Garamond font come from a CDN. The HTML export embeds them and works offline.

## Tour

### Home page

<img src="docs/images/home.png" alt="Home page with three presentations, tags and the Upcoming view" width="100%">

Every presentation of `presentations/` with a live thumbnail. Search (`/`), sort, grid or list
view, **stars**, **tags**, **archive**, **duplicate**, and **Edit details…** for the title,
description, date and venue of the talk. The **Upcoming** view lists dated talks, closest first.
Library details are saved in `<presentation>/meta.json`, next to the slides.

### Slides

<img src="docs/images/demo-src.gif" alt="A slide explaining the SRC pooling framework, step by step" width="100%">

The visual style is the one of a paper figure: paper background, navy ink, EB Garamond, three
category colours (blue, green, red) with translucent fills. Objects keep their identity: nodes
move and merge rather than disappear and reappear. The example course in
`presentations/2026/pooling_course` (in French) has slides built this way.

### Presenter view (`s`)

<img src="docs/images/presenter.png" alt="Presenter view: current slide, next step, notes, timer and clock" width="100%">

Opens a second window for your own screen: current slide, next step, **speaker notes**, timer
(starts at the first step forward), clock and progress. Both windows follow each other in both
directions, including the laser pointer, and it also works with an exported HTML file.

Notes are typed right there, one per slide, and saved to `<presentation>/notes.json`. They are
keyed by slide function and occurrence (`planRecap#2`), so a note follows its slide when you
insert slides before it.

### Overview (`g`)

<img src="docs/images/overview.png" alt="Grid of every slide in its final state" width="100%">

Every slide in its final state. Arrows then `Enter`, or a click, jump to a slide, and the
presenter window follows.

### Pen and laser pointer (`p`, `l`)

<img src="docs/images/pen.png" alt="Pen strokes over a slide and the red laser dot" width="100%">

Made for remote teaching, with nothing on screen but your strokes:

- **left click** draws and the **wheel** sets the size
- a **long press** opens a colour wheel, and releasing on a colour picks it
- **right click** erases (wheel while right-clicking: eraser size)
- `Ctrl+Z` undoes and `c` clears the slide, while drawings are kept per slide

`l` turns the cursor into a glowing laser dot, mirrored on the projected window when the
presenter view is open.

### Options and export (`o`)

<img src="docs/images/options.png" alt="Options window, Export tab, all slides selected" width="100%">

A floating window that groups:

- **Export**, for the slides you pick (click, shift-click, or type `1-5, 8`):
  - **HTML**: one file that works offline (slides, engine, GSAP, KaTeX, fonts, images and notes
    inlined, about 1.5 MB), built in the browser.
  - **PDF**: one page per step or per slide, through the browser's *Save as PDF*, with text and
    formulas that stay vector and selectable.
  - **GIF**: rendered frame by frame by the local server, one GIF per slide (zipped) or a single
    one, with looping slides exported as one seamless cycle.
- **Shortcuts**: rebind every key.
- **Pen**: wheel colours and default sizes.
- **Appearance**: interface language (English / French) and the backdrop around the slide.

### Edit mode: feedback for the agent (`e`)

<img src="docs/images/edit.png" alt="Edit mode: a circled table cell with a numbered comment in the side panel" width="100%">

Circle what is wrong, drop numbered notes, write a general note per slide. Feedback is saved to
`<presentation>/feedback.json` with the circled elements (tag, text, LaTeX, position), so an
agent can find the code to change. See [Working with an AI agent](#working-with-an-ai-agent).

## Keyboard shortcuts

All of them can be changed in **Options → Shortcuts**.

| Key | Action | Key | Action |
| --- | --- | --- | --- |
| `→` `Space` `PageDown` | next step | `s` | presenter view |
| `←` `PageUp` | previous step | `g` | overview |
| `Home` / `End` | first / last slide | `l` | laser pointer |
| `f` | fullscreen | `p` | pen (`Ctrl+Z` undo, `c` clear) |
| `o` | options | `e` | edit mode |
| `h` | home page | `Esc` | leave the current mode |

## Writing slides

A presentation is a folder in which `index.html` lists the slides and the footer, while each
slide lives in `pages/`. A slide builds its content **in its final state**, then describes how it appears:

```js
import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";

export default function cover(root) {            // root: an empty 1920×1080 stage
  const heading = title(root, "Pooling on graphs", 430);
  const rule = div(root, "abs", { x: 760, y: 540, w: 400, h: 3, style: { background: "var(--blue)" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.9 });
  pause(tl);                                      // the speaker stops here
  tl.from(rule, { scaleX: 0, duration: 0.8, ease: "power3.inOut" });
  pause(tl);
  return tl;
}
```

The state depends only on the timeline's time, which is why going back, direct links and
captures are exact. Shared building blocks (SVG, labels, KaTeX, arrows) are in
[`deck/components.js`](deck/components.js), and colours come from the theme
([`deck/theme.css`](deck/theme.css)). The full rules (structure, design, motion) are in
[`AGENTS.md`](AGENTS.md).

## Working with an AI agent

SlideDeck is designed to be authored with a coding agent (Claude Code, Codex…), which follows
[`AGENTS.md`](AGENTS.md). Claude Code loads it automatically through `CLAUDE.md`.

1. **Ask for a slide**: *"In my_talk, add a slide showing message passing on a small graph,
   in three steps."*
2. **The agent checks its work**: it captures every step in a headless browser and reads the
   contact sheet and the report (console errors, elements out of frame).
   ```bash
   .venv/bin/python tools/capture.py presentations/2026/my_talk
   ```
3. **You give feedback on the slides**: press `e`, circle and comment, then tell the agent
   *"read my feedback"*. It runs `tools/review.py`, which produces a summary and one annotated
   capture per step.

## Command-line tools

| Command | What it does |
| --- | --- |
| `python3 tools/serve.py [presentation]` | Local server with live reload, home page, notes, feedback and GIF export. |
| `python3 tools/new.py presentations/2026/my_talk --title "My talk"` | New presentation from the template (also available from the home page). |
| `.venv/bin/python tools/capture.py <presentation> [--slide N] [--frames 2]` | One image per step → `.inspection/storyboard.jpg` and `report.json`. |
| `.venv/bin/python tools/review.py <presentation> [--clear]` | Edit-mode feedback → `.inspection/review/review.md` and annotated captures. |
| `.venv/bin/python tools/gif.py <presentation> [--slide 3 5] [--combined]` | Animated GIFs (`--fps`, `--width`, `--hold`, `--once`). |

## Project layout

```text
deck/            the shared engine
                 deck.js (navigation), components.js, theme.css
                 options.*, pen.js, laser.js, presenter.js + notes.js, overview.js,
                 export.js (HTML), print.js (PDF), review.* (edit mode), home.*, i18n.js
tools/           serve.py · library.py · capture.py · review.py · gif.py · new.py
templates/       starting point for new presentations
presentations/   <year>/<name>/ index.html · pages/*.js · assets/ · meta.json · notes.json
docs/            logo and README images
```

## Roadmap

- **Templates on creation**: choose "course", "conference talk" or "short talk" in the
  *New presentation* dialog, with a title slide, outline, section slides and references ready.
- **Bibliography from the interface**: add references (DOI, arXiv, BibTeX paste) from the
  options window, cite them in slides (`cite("grattarola2022")`) and generate a references slide.
- **Shared component library**: promote the building blocks written for courses (comparison
  panels, assignment matrix, SEL → RED → CON stepper…) to `deck/components.js`, with a gallery.

## Credits

Built on [GSAP](https://gsap.com), [KaTeX](https://katex.org),
[EB Garamond](https://fonts.google.com/specimen/EB+Garamond) and
[Playwright](https://playwright.dev) (captures and GIF export).
