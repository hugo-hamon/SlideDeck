import { gsap } from "gsap";
import { COLORS, div, label, svg, tex } from "deck/components.js";
import { MPNN_EDGES, embeddingColors, line, mix, mpnnGraph, theme } from "./helpers.js";

/*
 * Tools shared by the SRC and method slides: the 8-node graph of the MPNN recap, a common
 * set of scores (Top-k, MIVSPool) and the SEL → RED → CON stepper.
 */
export const EDGES = MPNN_EDGES;
export const N = 8;
/** Node scores, shared by Top-k and MIVSPool to compare their selections. */
export const SCORES = [0.92, 0.58, 0.41, 0.33, 0.71, 0.27, 0.8, 0.49];
/** "Natural" communities of the graph: {1, 2, 3}, {4, 5, 8}, {6, 7}. */
export const GROUPS = [0, 0, 0, 1, 1, 2, 2, 1];
export const neighborsOf = (i) => EDGES.filter((e) => e.includes(i)).map(([a, b]) => (a === i ? b : a));

/** Graph numbered 1 to 8; colours = attributes X (same colours as the MPNN recap). */
export function drawGraph(layer, { scale = 190, origin = [430, 575], r = 24 } = {}) {
  const points = mpnnGraph(scale, origin);
  const colors = embeddingColors(N);
  const edgeLayer = svg(layer, "g");
  const edges = EDGES.map(([a, b]) => line(edgeLayer, points[a], points[b], `stroke: ${theme("ink-soft")}`, { "stroke-width": 3, "stroke-opacity": 0.8 }));
  const nodes = points.map(({ x, y }, i) => {
    const group = svg(layer, "g");
    const dot = svg(group, "circle", { cx: x, cy: y, r, style: `fill: ${colors[i]}; stroke: var(--paper); stroke-width: 4` });
    const text = svg(group, "text", { x, y: y + 1, "text-anchor": "middle", "dominant-baseline": "middle", style: "fill: var(--paper); font: 600 26px var(--serif)" });
    text.textContent = i + 1;
    return { group, dot, text };
  });
  return { points, colors, edges, nodes, groups: nodes.map((n) => n.group), dots: nodes.map((n) => n.dot) };
}

/** Stepper of the three stages, where `focus(tl, k, position)` highlights stage k (−1: none). */
export function stepper(root, y = 205) {
  const names = [["SEL", "sélection"], ["RED", "réduction"], ["CON", "connexion"]];
  const items = names.map(([short, long], k) => {
    const node = label(root, `<b>${short}</b> <span class="muted">${long}</span>`, 960 + (k - 1) * 330, y, 30);
    Object.assign(node.style, { padding: "4px 22px", borderRadius: "28px", border: "2px solid var(--line)", background: "var(--panel)" });
    return node;
  });
  const arrows = [0, 1].map((k) => label(root, "→", 960 + (k - 0.5) * 330, y, 32, "abs muted"));
  const [blue, lineColor, panel, soft] = ["blue", "line", "panel", "blue-soft"].map(theme);
  const focus = (tl, k, position) =>
    tl.to(items, {
      opacity: (i) => (k < 0 || i === k ? 1 : 0.35),
      borderColor: (i) => (i === k ? blue : lineColor),
      backgroundColor: (i) => (i === k ? soft : panel),
      duration: 0.5, ease: "power2.inOut",
    }, position);
  return { items, arrows, all: [...items, ...arrows], focus };
}

/** Bibliographic reference, bottom left. */
export function cite(root, html) {
  return div(root, "abs muted", { x: 120, y: 958, html, style: { fontSize: "24px" } });
}

/** Verdict line: strengths and limits side by side. */
export function verdict(root, good, bad, y = 910) {
  return [
    label(root, `<span class="c-green">✓</span> ${good}`, 560, y, 32),
    label(root, `<span class="c-red">✗</span> ${bad}`, 1360, y, 32),
  ];
}


/**
 * Grid of cells (rows = nodes, columns = super-nodes) whose fill opacity encodes the
 * value. Headers are node numbers and colour dots.
 */
export function matrix(root, layer, { x, y, rows, cols, w = 64, h = 40, rowNames = true }) {
  const cells = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, k) =>
      svg(layer, "rect", {
        x: x + k * w, y: y + i * h, width: w - 6, height: h - 6, rx: 5, "fill-opacity": 0,
        style: `fill: ${theme(["blue", "green", "red"][k])}; stroke: ${theme("line")}; stroke-width: 1.5`,
      }),
    ),
  );
  const heads = Array.from({ length: cols }, (_, k) =>
    svg(layer, "circle", { cx: x + k * w + (w - 6) / 2, cy: y - 24, r: 10, style: `fill: ${COLORS[k]}` }),
  );
  const names = rowNames ? Array.from({ length: rows }, (_, i) => label(root, String(i + 1), x - 26, y + i * h + (h - 6) / 2, 26, "abs muted")) : [];
  return { cells, heads, names, frame: [...cells.flat(), ...heads, ...names] };
}

/** Centred formula, above the working area. */
export function formula(root, expression, x = 960, y = 292, size = 36) {
  return label(root, tex(expression), x, y, size);
}
