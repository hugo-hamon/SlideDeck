import { COLORS, FILLS, div, drawIn, label, svg, tex } from "deck/components.js";

const LINE = "fill: none; stroke: var(--ink); stroke-width: 3; stroke-linejoin: round; stroke-linecap: round";
const BODY = "fill: var(--panel); stroke: var(--ink); stroke-width: 3; stroke-linejoin: round";
const BUBBLE = 7;

/** LaTeX complement of a variable or an expression. */
export const no = (v) => `\\overline{${v}}`;

/** Minterm of a row: a variable at 0 appears complemented. */
export function minterm(bits, names = "abcd") {
  return bits.map((bit, i) => (bit ? names[i] : no(names[i]))).join("\\,");
}

/** Maxterm of a row: a variable at 1 appears complemented. */
export function maxterm(bits, names = "abcd") {
  return `(${bits.map((bit, i) => (bit ? no(names[i]) : names[i])).join("+")})`;
}

/** The 2ⁿ input rows in binary order, as arrays of 0/1. */
export function rowsOf(n) {
  return Array.from({ length: 2 ** n }, (_, k) => Array.from({ length: n }, (_, i) => (k >> (n - 1 - i)) & 1));
}

/** LaTeX piece tagged `k<i>`, to be revealed on its own with `pieces(node, i)`. */
export const part = (i, latex) => `\\htmlClass{k${i}}{${latex}}`;

/** Rendered pieces tagged by `part(i, …)` inside `node`. */
export const pieces = (node, i) => [...node.querySelectorAll(`.k${i}`)];

/** Formula `out = t0 op t1 op …` where each term is a piece, to be written term by term. */
export function termsTex(out, terms, op = "+") {
  return `${out} = ${terms.map((t, i) => part(i, `${i ? `{}${op}` : ""}${t}`)).join("")}`;
}

/* ---------- steps: what is shown at a step fades out at the next one ---------- */

/**
 * Returns `swap(items, position)`: fades the previous items out and the new ones in,
 * so that a highlight or an explanation only lasts for one step.
 */
export function switcher(tl) {
  let current = [];
  return (items, position) => {
    const list = [items].flat().filter(Boolean);
    if (current.length) tl.to(current, { opacity: 0, duration: 0.3, ease: "power2.in" }, position);
    if (list.length) tl.from(list, { opacity: 0, duration: 0.5, ease: "expo.out", stagger: 0.04 }, current.length ? "<0.15" : position);
    current = list;
  };
}

/** Arrow from the edge of a box to a target point, as an SVG overlay. */
function pointer(root, box, [tx, ty], color) {
  const layer = svg(root, "svg", { class: "canvas", viewBox: "0 0 1920 1080" });
  const ax = Math.min(Math.max(tx, box.x + 24), box.x + box.w - 24);
  const ay = Math.min(Math.max(ty, box.y), box.y + box.h);
  const length = Math.hypot(tx - ax, ty - ay);
  const ux = (tx - ax) / length;
  const uy = (ty - ay) / length;
  const ex = tx - ux * 8;
  const ey = ty - uy * 8;
  svg(layer, "line", { x1: ax, y1: ay, x2: ex - ux * 12, y2: ey - uy * 12, style: `stroke: ${COLORS[color]}; stroke-width: 3; stroke-dasharray: 9 7` });
  const [px, py] = [-uy, ux];
  svg(layer, "polygon", {
    points: `${ex},${ey} ${ex - ux * 18 + px * 9},${ey - uy * 18 + py * 9} ${ex - ux * 18 - px * 9},${ey - uy * 18 - py * 9}`,
    style: `fill: ${COLORS[color]}`,
  });
  return layer;
}

/**
 * Floating explanations, one per step: `say(html, { x, y, w, to })` replaces the previous
 * bubble, `to` being a stage point (or a list of points) that the bubble points at.
 * `show(nodes)` replaces the bubble with other elements (a conclusion, for instance).
 */
export function narrator(root, tl) {
  const swap = switcher(tl);
  const say = (html, { x = 100, y = 820, w = 1720, to = [], color = 0, position } = {}) => {
    const node = div(root, `bubble bubble-${["blue", "green", "red"][color]}`, { x, y, w, html });
    const h = node.offsetHeight;
    const targets = to.length && typeof to[0] === "number" ? [to] : to;
    const arrows = targets.map((target) => pointer(root, { x, y, w, h }, target, color));
    swap([node, ...arrows], position);
    return node;
  };
  return { say, show: (nodes, position) => swap(nodes, position) };
}

/* ---------- circuits ---------- */

/** Path data of an orthogonal polyline. */
const pathOf = (points) => points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");

/**
 * Logic gate (AND, OR, NOT, NAND, NOR) whose body starts at x, vertically centred on y.
 * Returns its input pins `in`, its output pin `out`, its top edge and the point `mid` inside.
 */
function gate(parent, type, x, y, h) {
  const node = svg(parent, "g");
  const base = type.replace(/^N(?=AND|OR)/, "");
  const top = y - h / 2;
  const bottom = y + h / 2;
  let w;
  let d;
  let inputs;
  let roof = top;
  if (base === "AND") {
    w = h * 1.05;
    d = `M${x},${top} H${x + w - h / 2} A${h / 2},${h / 2} 0 0 1 ${x + w - h / 2},${bottom} H${x} Z`;
    inputs = [y - h / 4, y + h / 4].map((yy) => [x, yy]);
  } else if (base === "OR") {
    w = h * 1.1;
    const back = h * 0.28;
    d = `M${x},${top} Q${x + back},${y} ${x},${bottom} Q${x + w * 0.62},${bottom} ${x + w},${y} Q${x + w * 0.62},${top} ${x},${top} Z`;
    inputs = [y - h / 4, y + h / 4].map((yy) => {
      const t = (yy - top) / h;
      return [x + 2 * t * (1 - t) * back, yy];
    });
  } else {
    w = h * 0.55;
    roof = y - h * 0.3;
    d = `M${x},${roof} L${x + w},${y} L${x},${y + h * 0.3} Z`;
    inputs = [[x, y]];
  }
  svg(node, "path", { d, style: BODY });
  let out = x + w;
  if (type.startsWith("N")) {
    svg(node, "circle", { cx: out + BUBBLE, cy: y, r: BUBBLE, style: BODY });
    out += 2 * BUBBLE;
  }
  const mid = [base === "NOT" ? x + w * 0.32 : x + w * 0.44, y];
  return { type: base, node, d, in: inputs, out: [out, y], mid, tag: [base === "NOT" ? x + w * 0.2 : x + w * 0.4, roof] };
}

/**
 * Circuit drawn in local coordinates, placed at (ox, oy) with scale s on the stage.
 * Input rails are vertical lines, as in the exercise sheet.
 */
export function circuit(root, layer, { x: ox, y: oy, s = 1, h = 80 }) {
  const group = svg(layer, "g", { transform: `translate(${ox},${oy}) scale(${s})` });
  const wires = svg(group, "g");
  const gates = svg(group, "g");
  const marks = svg(group, "g");
  const dots = svg(group, "g");
  const tags = svg(group, "g");
  const all = [];
  const at = (x, y) => [ox + s * x, oy + s * y];
  const keep = (node) => (all.push(node), node);

  const c = {
    at,
    /** Input rail named `name` at local x, from y1 to y2, label below. */
    rail(name, x, y1, y2) {
      const path = keep(svg(wires, "path", { d: pathOf([[x, y2], [x, y1]]), style: LINE }));
      path.points = [[x, y2], [x, y1]];
      return [path, keep(label(root, tex(name), ...at(x, y2 + 32), 34 * s))];
    },
    gate(type, x, y) {
      const g = gate(gates, type, x, y, h);
      keep(g.node);
      return g;
    },
    wire(...points) {
      const node = keep(svg(wires, "path", { d: pathOf(points), style: LINE }));
      node.points = points;
      return node;
    },
    dot(x, y) {
      return keep(svg(dots, "circle", { cx: x, cy: y, r: 6, style: "fill: var(--ink)" }));
    },
    /** Output: a short wire and the output name. */
    output(g, name, length = 50) {
      return [c.wire(g.out, [g.out[0] + length, g.out[1]]), keep(label(root, tex(name), ...at(g.out[0] + length + 32, g.out[1]), 36 * s))];
    },
    /** Signal name next to a wire (HTML, so that KaTeX renders it). */
    signal(latex, x, y, size = 26) {
      return label(root, tex(`\\htmlClass{c-blue}{${latex}}`), ...at(x, y), size * s);
    },
    /** Propagation time written inside a gate. */
    time(g, text, size = 24) {
      return label(root, `<span class="gate-time">${text}</span>`, ...at(...g.mid), size * s);
    },
    /** Gate number on its top edge. */
    badge(g, n) {
      const node = svg(tags, "g");
      const [x, y] = g.tag;
      svg(node, "circle", { cx: x, cy: y, r: 15, style: "fill: var(--panel); stroke: var(--blue); stroke-width: 2.5" });
      const text = svg(node, "text", { x, y: y + 1, "text-anchor": "middle", "dominant-baseline": "middle", style: "fill: var(--blue); font: 700 19px var(--serif)" });
      text.textContent = n;
      return node;
    },
    /** Stage point of a gate's number, for the explanation arrows. */
    tagAt: (g) => at(g.tag[0], g.tag[1] - 18),
    /** Coloured overlay of a gate or a wire (colour 0, 1 or 2). */
    glow(item, color = 2) {
      if (item.points) return svg(marks, "path", { d: pathOf(item.points), style: `${LINE}; stroke: ${COLORS[color]}; stroke-width: 6` });
      return svg(marks, "path", { d: item.d, style: `fill: ${FILLS[color]}; stroke: ${COLORS[color]}; stroke-width: 4; stroke-linejoin: round` });
    },
    /** Draws some parts: wires and rails as if with a pencil, the rest fading in. */
    show(tl, items, position) {
      const list = items.flat().map((item) => item.node ?? item);
      const lines = list.filter((n) => n.points);
      const rest = list.filter((n) => !n.points);
      if (lines.length) {
        drawIn(tl, lines, { duration: 0.6, stagger: 0.02 }, position);
        // Round caps would show a dot before the stroke is drawn.
        tl.from(lines, { opacity: 0, duration: 0.05, stagger: 0.02 }, "<");
      }
      if (rest.length) tl.from(rest, { opacity: 0, duration: 0.4, stagger: 0.02 }, lines.length ? "<0.1" : position);
    },
    /** Draws everything created so far. */
    reveal(tl, position) {
      c.show(tl, [...all], position);
    },
  };
  return c;
}

/** Lights up a path (gates and wires) in red, for good. */
export function lightPath(tl, c, items, position) {
  const overlays = items.map((item) => c.glow(item));
  const strokes = overlays.filter((_, i) => items[i].points);
  const bodies = overlays.filter((_, i) => !items[i].points);
  drawIn(tl, strokes, { duration: 0.9 }, position);
  tl.from(strokes, { opacity: 0, duration: 0.05 }, "<");
  tl.from(bodies, { opacity: 0, duration: 0.4, stagger: 0.12 }, "<0.1");
  return overlays;
}

/* ---------- tables ---------- */

/**
 * Truth table in the booktabs style. `head` holds LaTeX headers, `rows` the cells (HTML or
 * numbers), `widths` the column widths and `seps` the columns preceded by a vertical rule.
 */
export function truthTable(root, { x, y, head, rows, widths, rowH = 52, headH = 64, size = 30, seps = [] }) {
  const node = div(root, "tt", { x, y, style: { fontSize: `${size}px` } });
  const template = widths.map((w) => `${w}px`).join(" ");
  const line = (cells, className, height) => {
    const row = div(node, `tt-row ${className}`, { style: { gridTemplateColumns: template, height: `${height}px` } });
    return cells.map((html, j) => div(row, `tt-cell${seps.includes(j) ? " tt-sep" : ""}`, { html: String(html) }));
  };
  const heads = line(head.map((h) => tex(h)), "tt-head", headH);
  const cells = rows.map((row) => line(row, "", rowH));
  const left = (c) => widths.slice(0, c).reduce((a, b) => a + b, 0);
  return {
    node,
    heads,
    cells,
    col: (j) => cells.map((row) => row[j]),
    /** Header and cells of column j. */
    column: (j) => [heads[j], ...cells.map((row) => row[j])],
    colX: (j) => x + left(j) + widths[j] / 2,
    rowY: (r) => y + headH + (r + 0.5) * rowH,
    right: x + left(widths.length),
    bottom: y + headH + rows.length * rowH,
    top: y,
    /** Translucent band behind rows r0…r1 and columns c0…c1 (colour 0, 1 or 2). */
    mark(r0, r1, c0, c1, color) {
      return div(node, "tt-mark", {
        x: left(c0) + 3,
        y: headH + r0 * rowH + 3,
        w: left(c1 + 1) - left(c0) - 6,
        h: (r1 - r0 + 1) * rowH - 6,
        style: { background: FILLS[color], borderColor: COLORS[color] },
      });
    },
  };
}

/** Fades marks in with a small horizontal sweep. */
export function showMarks(tl, marks, position, stagger = 0.04) {
  return tl.from(marks, { opacity: 0, scaleX: 0.6, transformOrigin: "left center", duration: 0.5, stagger }, position);
}

/**
 * Truth table of a 3-variable function: inputs, the `cols` ([LaTeX head, values]), then the
 * minterm and/or maxterm of each row (`terms`). `termCol` gives the index of each term column.
 */
export function termTable(root, { x, y, cols, terms = ["min", "max"], rowH = 60 }) {
  const bits = rowsOf(3);
  const heads = { min: "\\text{produit}", max: "\\text{somme}" };
  const render = { min: minterm, max: maxterm };
  const table = truthTable(root, {
    x, y, rowH, headH: 70,
    head: ["a", "b", "c", ...cols.map(([h]) => h), ...terms.map((t) => heads[t])],
    rows: bits.map((b, k) => [...b, ...cols.map(([, v]) => v[k]), ...terms.map((t) => tex(render[t](b)))]),
    widths: [64, 64, 64, ...cols.map(() => 90), ...terms.map((t) => (t === "min" ? 230 : 270))],
    seps: [3, 3 + cols.length],
  });
  table.termCol = Object.fromEntries(terms.map((t, i) => [t, 3 + cols.length + i]));
  return table;
}

/* ---------- derivations ---------- */

/**
 * Box holding an aligned derivation whose lines are revealed one by one with `line(i)`.
 * Each line is [left, right, note], the note being a short reminder in blue.
 */
export function derivation(root, makeBox, lines, { size } = {}) {
  const rows = lines.map(([left, right, noteText], i) =>
    `${part(i, `${left}`)} & ${part(i, `{}${right}${noteText ? `\\qquad \\htmlClass{c-blue}{\\small ${noteText}}` : ""}`)}`);
  const html = tex(`\\begin{aligned} ${rows.join(" \\\\ ")} \\end{aligned}`, true);
  const node = makeBox(size ? `<div style="font-size: ${size}px">${html}</div>` : html);
  return { node, line: (i) => pieces(node, i) };
}
