# SlideDeck in five slides

A short example bundled with the repository, to see what the tool can do in a couple of
minutes. It is meant to be read, changed or deleted freely (from the home page or by removing
this folder).

- `cover.js`: title page from the theme.
- `timeline.js`: a slide is a function and a GSAP timeline, where `pause(tl)` marks each click.
- `pythagoras.js`: an SVG figure and a KaTeX formula built together, with matching colours.
- `sorting.js`: objects keep their identity and move to their new place.
- `tools.js`: the keyboard shortcuts around the slides.

```bash
python3 tools/serve.py examples/getting_started
.venv/bin/python tools/capture.py examples/getting_started
```

The look comes from the `paper` theme (`deck/themes/paper.css`, linked in `index.html`).
