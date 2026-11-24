import { gsap } from "gsap";
import katex from "katex";

const NS = "http://www.w3.org/2000/svg";
const px = (value) => (value === undefined ? "" : `${value}px`);

export const COLORS = ["var(--blue)", "var(--green)", "var(--red)"];
export const FILLS = ["var(--blue-fill)", "var(--green-fill)", "var(--red-fill)"];

/** Creates an SVG element, with colours set through `style` so that CSS variables are read. */
export function svg(parent, tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent.appendChild(node);
  return node;
}

/** HTML block positioned in pixels in the 1920×1080 stage. */
export function div(parent, className, { x, y, w, h, html, style } = {}) {
  const node = document.createElement("div");
  node.className = className;
  Object.assign(node.style, { left: px(x), top: px(y), width: px(w), height: px(h) }, style);
  if (html !== undefined) node.innerHTML = html;
  parent.appendChild(node);
  return node;
}

/** Full-frame SVG layer, with a shared arrow head. */
export function canvas(root) {
  const node = svg(root, "svg", { class: "canvas", viewBox: "0 0 1920 1080" });
  const marker = svg(svg(node, "defs"), "marker", {
    id: "arrow-head",
    viewBox: "0 0 10 10",
    refX: 8,
    refY: 5,
    markerWidth: 6,
    markerHeight: 6,
    orient: "auto-start-reverse",
  });
  svg(marker, "path", { d: "M0,0 L10,5 L0,10 z", style: "fill: var(--ink)" });
  return node;
}

export function title(root, text, top) {
  return div(root, "title", { html: text, style: top === undefined ? {} : { top: px(top) } });
}

/** Renders a LaTeX expression, where `\htmlClass{c-blue}{…}` colours with the theme tokens. */
export function tex(expression, display = false) {
  return katex.renderToString(expression, { displayMode: display, trust: true, strict: "ignore" });
}

/** Text or formula centred on (x, y). */
export function label(parent, html, x, y, size = 30, className = "abs") {
  const node = div(parent, className, { x, y, html, style: { fontSize: px(size) } });
  gsap.set(node, { xPercent: -50, yPercent: -50 });
  return node;
}

export function arrow(parent, x1, y1, x2, y2) {
  return svg(parent, "line", {
    x1, y1, x2, y2,
    "marker-end": "url(#arrow-head)",
    style: "stroke: var(--ink); stroke-width: 3",
  });
}

/** Draws outlines as if with a pencil. */
export function drawIn(tl, nodes, vars = {}, position) {
  const list = [nodes].flat();
  for (const node of list) {
    const length = node.getTotalLength();
    gsap.set(node, { strokeDasharray: length, strokeDashoffset: length });
  }
  return tl.to(list, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", ...vars }, position);
}

/** Grows an arrow from its origin, head included. */
export function growArrow(tl, line, vars = {}, position) {
  const x1 = line.getAttribute("x1");
  const y1 = line.getAttribute("y1");
  return tl.from(line, { attr: { x2: x1, y2: y1 }, opacity: 0, duration: 0.5, ease: "power3.out", ...vars }, position);
}

/** Translucent box in oblique projection, vertically centred on `y`. */
export function block(parent, { x, y, w, h, dx = 60, dy = -48, color = 0 }) {
  const group = svg(parent, "g");
  const top = y - h / 2;
  const bottom = y + h / 2;
  const stroke = `stroke: ${COLORS[color]}; stroke-width: 2; stroke-linejoin: round`;
  svg(group, "polygon", {
    points: `${x + w},${top} ${x + w + dx},${top + dy} ${x + w + dx},${bottom + dy} ${x + w},${bottom}`,
    style: `fill: ${FILLS[color]}; ${stroke}`,
  });
  svg(group, "polygon", {
    points: `${x},${top} ${x + dx},${top + dy} ${x + w + dx},${top + dy} ${x + w},${top}`,
    style: `fill: ${FILLS[color]}; fill-opacity: 0.6; ${stroke}`,
  });
  svg(group, "rect", { x, y: top, width: w, height: h, style: `fill: ${FILLS[color]}; ${stroke}` });
  return group;
}

/** Numbered badge, like the markers of a paper figure. */
export function badge(parent, x, y, text, r = 20) {
  const group = svg(parent, "g");
  svg(group, "circle", { cx: x, cy: y, r, style: "fill: var(--panel); stroke: var(--ink); stroke-width: 2" });
  const value = svg(group, "text", {
    x, y: y + 1,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    style: `fill: var(--ink); font: ${r * 1.15}px var(--serif)`,
  });
  value.textContent = text;
  return group;
}
