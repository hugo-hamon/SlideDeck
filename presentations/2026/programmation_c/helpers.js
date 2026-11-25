import { gsap } from "gsap";
import { div, svg } from "deck/components.js";

const KEYWORDS = "int|char|double|float|void|return|if|else|for|while|struct|const|sizeof|size_t|NULL";
const TOKEN = new RegExp(`(//.*)|("(?:\\\\.|[^"\\\\])*")|('(?:\\\\.|[^'\\\\])*')|(^\\s*#.*)|\\b(${KEYWORDS})\\b`, "g");
const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** One line of C with light syntax colouring. `⟦…⟧` marks a hole (red, bold). */
export function colorC(line) {
  return line
    .split(/⟦(.*?)⟧/)
    .map((part, i) => {
      if (i % 2) return `<span class="hole">${esc(part)}</span>`;
      let out = "";
      let last = 0;
      for (const match of part.matchAll(TOKEN)) {
        out += esc(part.slice(last, match.index));
        const kind = match[1] ? "c" : match[2] || match[3] ? "s" : match[4] ? "p" : "k";
        out += `<span class="tok-${kind}">${esc(match[0])}</span>`;
        last = match.index + match[0].length;
      }
      return out + esc(part.slice(last));
    })
    .join("");
}

/** Inline code, coloured like the listings. */
export const c = (source) => `<span class="inline">${colorC(source)}</span>`;

/** Removes the first and last empty lines and the common indentation. */
function dedent(source) {
  const lines = source.replace(/^\s*\n/, "").replace(/\n\s*$/, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(indent));
}

/**
 * C listing at (x, y). `focus(tl, from, to)` slides a red bar onto lines from…to (0-based),
 * which is how the execution is followed. `lineY(i)` gives the stage y of a line centre.
 */
export function code(root, source, { x, y, w, size = 26, lh = 1.5, pad = 16 } = {}) {
  const lines = dedent(source);
  const lineH = Math.round(size * lh);
  const height = 2 * pad + lines.length * lineH;
  const node = div(root, "code", { x, y, w, h: height, style: { fontSize: `${size}px`, lineHeight: `${lineH}px`, paddingTop: `${pad}px` } });
  const bar = div(node, "code-bar", { style: { height: `${lineH}px`, opacity: 0 } });
  const rows = lines.map((line) => div(node, "code-line", { html: colorC(line) || " " }));
  let shown = false;
  return {
    node,
    rows,
    height,
    lineY: (i) => y + pad + (i + 0.5) * lineH,
    focus(tl, from, to = from, position) {
      const vars = { y: pad + from * lineH, height: (to - from + 1) * lineH };
      if (!shown) {
        shown = true;
        return tl.fromTo(bar, { opacity: 0, ...vars, scaleX: 0.96 }, { opacity: 1, ...vars, scaleX: 1, duration: 0.4, ease: "power2.out", immediateRender: false }, position);
      }
      return tl.to(bar, { ...vars, duration: 0.5, ease: "power3.inOut" }, position);
    },
    unfocus(tl, position) {
      shown = false;
      return tl.to(bar, { opacity: 0, duration: 0.3, ease: "power2.in" }, position);
    },
  };
}

/**
 * Table at (x, y): `cols` are column widths, `head` the header row (optional).
 * `set(tl, r, c, html)` replaces a value with a short cross-fade and a red flash.
 * `cx(c)` and `cy(r)` give the stage centre of a column and of a body row.
 */
export function grid(root, { x, y, cols, head, rows, size = 28, rowH = 56, caption }) {
  const node = div(root, "grid", {
    x, y,
    style: { gridTemplateColumns: cols.map((w) => `${w}px`).join(" "), gridAutoRows: `${rowH}px`, fontSize: `${size}px` },
  });
  const total = cols.reduce((a, b) => a + b, 0) + 2;
  const cap = caption ? div(root, "grid-caption", { x, y: y - size * 1.6, w: total, html: caption, style: { fontSize: `${size}px` } }) : null;
  const make = (html, cls) => {
    const cell = div(node, `cell ${cls}`);
    div(cell, "flash");
    const value = div(cell, "v", { html });
    cell.current = value;
    return cell;
  };
  const header = head ? head.map((html) => make(html, "head")) : [];
  const cells = rows.map((row) => row.map((html) => make(html, "")));
  const top = y + 2 + (head ? rowH : 0);
  const left = cols.map((_, i) => x + 2 + cols.slice(0, i).reduce((a, b) => a + b, 0));
  return {
    node,
    caption: cap,
    header,
    cells,
    rowsOf: (r) => cells[r],
    width: total,
    height: rowH * (rows.length + (head ? 1 : 0)) + 2,
    cx: (col) => left[col] + cols[col] / 2,
    left: (col) => left[col],
    right: (col) => left[col] + cols[col],
    cy: (r) => top + (r + 0.5) * rowH,
    set(tl, r, col, html, position, { flash = true, cls = "c-red" } = {}) {
      const cell = cells[r][col];
      const old = cell.current;
      const value = div(cell, `v ${cls}`, { html });
      cell.current = value;
      gsap.set(value, { opacity: 0 });
      tl.to(old, { opacity: 0, y: -12, duration: 0.25, ease: "power2.in" }, position);
      tl.fromTo(value, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, "<0.15");
      if (flash) {
        const glow = cell.querySelector(".flash");
        tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, "<");
        tl.to(glow, { opacity: 0, duration: 0.8, ease: "power2.inOut" }, ">0.4");
      }
      return value;
    },
  };
}

/** Terminal at (x, y): `print(tl, text)` types a line of output, and the screen scrolls when full. */
export function terminal(root, { x, y, w, h, size = 26, command = "./a.out" }) {
  const lineH = Math.round(size * 1.45);
  const node = div(root, "term", { x, y, w, h, style: { fontSize: `${size}px`, lineHeight: `${lineH}px` } });
  div(node, "term-head", { html: "Terminal" });
  const screen = div(node, "", { style: { position: "relative", overflow: "hidden", height: `${h - size * 0.8 - 26}px` } });
  const content = div(screen, "", { style: { paddingTop: "6px", height: "100%", boxSizing: "border-box" } });
  const prompt = div(content, "term-line", { html: `<span class="prompt">$</span> ${esc(command)}` });
  const capacity = Math.floor((h - size * 0.8 - 26 - 6) / lineH);
  let count = 1;
  return {
    node,
    prompt,
    print(tl, text, position, { html = false, duration } = {}) {
      const line = div(content, "term-line", { html: html ? text : esc(text) || " " });
      count += 1;
      const n = Math.max(text.length, 1);
      gsap.set(line, { autoAlpha: 0 });
      tl.fromTo(line, { autoAlpha: 1, clipPath: "inset(0% 100% 0% 0%)" }, {
        autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", duration: duration ?? Math.min(0.03 * n, 0.9), ease: `steps(${n})`, immediateRender: false,
      }, position);
      if (count > capacity) tl.to(content, { y: -(count - capacity) * lineH, duration: 0.2, ease: "power2.out" }, "<");
      return line;
    },
  };
}

/** SVG layer with red pointer-arrow heads (separate, so that the shaft can be drawn in). */
export function layer(root) {
  return svg(root, "svg", { class: "canvas", viewBox: "0 0 1920 1080" });
}

/**
 * Pointer arrow along `points` (a polyline with rounded corners), with a separate head.
 * Returns { path, head, draw(tl, position) }.
 */
export function pointer(parent, points, { color = "var(--red)", width = 4, radius = 14 } = {}) {
  const shaft = (pts) => roundedPath(trim(pts, 12), radius);
  const path = svg(parent, "path", { d: shaft(points), style: `fill: none; stroke: ${color}; stroke-width: ${width}; stroke-linejoin: round` });
  const head = svg(parent, "path", { d: "M2,0 L-18,-10 L-18,10 z", style: `fill: ${color}` });
  const dash = (length) => `${length.toFixed(1)}px, 4000px`;
  gsap.set(path, { strokeDasharray: dash(path.getTotalLength()) });
  placeHead(head, points);
  return {
    path,
    head,
    draw(tl, position, duration = 0.7) {
      const length = path.getTotalLength();
      // Hidden from the start of the slide: the arrow only exists once it is drawn.
      gsap.set(path, { strokeDasharray: dash(0) });
      gsap.set(head, { opacity: 0 });
      tl.fromTo(path, { strokeDasharray: dash(0) }, { strokeDasharray: dash(length), duration, ease: "power2.inOut", immediateRender: false }, position);
      tl.fromTo(head, { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, ">-0.1");
      return tl;
    },
    /** Moves the arrow to new points (same number of points). */
    move(tl, next, position, duration = 0.6) {
      const target = shaft(next);
      const probe = svg(parent, "path", { d: target, style: "display: none" });
      const length = probe.getTotalLength();
      probe.remove();
      tl.to(path, { attr: { d: target }, strokeDasharray: dash(length), duration, ease: "power3.inOut" }, position);
      const [x, y, rotation] = headPose(next);
      tl.to(head, { x, y, rotation, duration, ease: "power3.inOut" }, "<");
      return tl;
    },
    hide(tl, position) {
      return tl.to([path, head], { opacity: 0, duration: 0.3, ease: "power2.in" }, position);
    },
  };
}

/** Shortens the last segment so that the shaft stops inside the arrow head. */
function trim(points, by) {
  const [a, b] = points.slice(-2);
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const k = Math.min(by, length - 1) / length;
  return [...points.slice(0, -1), [b[0] - (b[0] - a[0]) * k, b[1] - (b[1] - a[1]) * k]];
}

function headPose(points) {
  const [a, b] = points.slice(-2);
  return [b[0], b[1], (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI];
}

function placeHead(head, points) {
  const [x, y, rotation] = headPose(points);
  gsap.set(head, { x, y, rotation, svgOrigin: "0 0" });
}

/** Polyline with rounded corners, always written with the same number of commands. */
export function roundedPath(points, r) {
  const fmt = (v) => v.toFixed(1);
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const d1 = Math.hypot(x - px, y - py) || 1;
    const d2 = Math.hypot(nx - x, ny - y) || 1;
    const k1 = Math.min(r, d1 / 2) / d1;
    const k2 = Math.min(r, d2 / 2) / d2;
    d += ` L${fmt(x - (x - px) * k1)},${fmt(y - (y - py) * k1)} Q${fmt(x)},${fmt(y)} ${fmt(x + (nx - x) * k2)},${fmt(y + (ny - y) * k2)}`;
  }
  const last = points.at(-1);
  return `${d} L${fmt(last[0])},${fmt(last[1])}`;
}

/** Fades in a list of elements, slightly staggered. */
export function reveal(tl, nodes, position, vars = {}) {
  return tl.from(nodes, { opacity: 0, y: 18, duration: 0.6, stagger: 0.05, ...vars }, position);
}

/** Frame title band + subtitle line (the Beamer « block » title is shown as a subtitle). */
export function subtitle(root, html, { y = 150, x = 80 } = {}) {
  return div(root, "abs", { x, y, html, style: { fontSize: "40px", fontWeight: 600, color: "var(--madrid-2)" } });
}

/**
 * Bulleted list where an item starting with "- " is a sub-item (triangle marker).
 * Returns the <li> items.
 */
export function points(root, items, { x, y, w, size = 36, gap } = {}) {
  const list = document.createElement("ul");
  list.className = "bullets";
  Object.assign(list.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, fontSize: `${size}px` });
  const nodes = items.map((html) => {
    const item = document.createElement("li");
    const sub = html.startsWith("- ");
    if (sub) item.className = "sub";
    item.innerHTML = sub ? html.slice(2) : html;
    if (gap !== undefined) item.style.marginBottom = `${sub ? gap * 0.5 : gap}px`;
    list.appendChild(item);
    return item;
  });
  root.appendChild(list);
  return nodes;
}

/**
 * Texts stacked at the same place, shown one at a time: `show(tl, k)` cross-fades to text k.
 */
export function captions(root, list, { x, y, w, size = 30 }) {
  const nodes = list.map((html) => div(root, "abs", { x, y, w, html, style: { fontSize: `${size}px`, whiteSpace: "normal", lineHeight: 1.3 } }));
  gsap.set(nodes, { opacity: 0 });
  let current = -1;
  return {
    nodes,
    show(tl, k, position) {
      if (current >= 0) tl.to(nodes[current], { opacity: 0, duration: 0.25, ease: "power2.in" }, position);
      tl.fromTo(nodes[k], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, current >= 0 ? ">" : position);
      current = k;
      return tl;
    },
  };
}

/** A small memory box (name above, value inside), for the little diagrams beside the listings. */
export function box(root, { x, y, w = 150, h = 64, name, value = "", color = "var(--blue)", size = 30 }) {
  const node = div(root, "abs mono", {
    x, y, w, h,
    style: {
      boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${size}px`,
      border: `3px solid ${color}`, background: `color-mix(in srgb, ${color} 12%, transparent)`, borderRadius: "6px",
    },
  });
  const content = div(node, "", { html: value });
  const label = name ? div(root, "abs mono", { x, y: y - 40, w, html: name, style: { fontSize: "26px", textAlign: "center", color, fontWeight: 700 } }) : null;
  return { node, content, label, x, y, w, h };
}
