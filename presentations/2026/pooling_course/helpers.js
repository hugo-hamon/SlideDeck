import { gsap } from "gsap";
import { COLORS, FILLS, div, svg } from "deck/components.js";

/* Graphe à 21 nœuds en trois communautés, repris de la version Manim (helpers.py). */
const CENTERS = [[-1.25, 0.7], [1.25, 0.65], [0, -1.15]];
const OFFSETS = [[-0.8, 0.15], [-0.35, 0.75], [0.45, 0.6], [0.9, -0.1], [0.4, -0.65], [-0.5, -0.55], [0.05, 0.05]];
const COMMUNITY_EDGES = [
  [0, 1, 2, 3, 4, 5, 6].map((i) => [i, (i + 1) % 7]),
  [0, 1, 2, 3, 4, 5].map((i) => [6, i]),
  [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 6], [6, 3]],
];
export const BRIDGES = [[2, 7], [3, 12], [6, 7], [4, 15], [5, 14], [6, 16], [11, 16], [12, 17]];
export const INTERNAL = COMMUNITY_EDGES.flatMap((edges, c) => edges.map(([a, b]) => [7 * c + a, 7 * c + b]));
export const LINKS = [...INTERNAL, ...BRIDGES];
export const COARSE_LINKS = [[0, 1], [0, 2], [1, 2]];

/** Positions en pixels du graphe : `scale` px par unité Manim, centré sur `center`. */
export function network(scale, [ox, oy]) {
  const nodes = CENTERS.flatMap(([cx, cy], c) =>
    OFFSETS.map(([dx, dy], j) => ({
      c,
      x: ox + (cx + dx * (1 - c * 0.08)) * scale,
      y: oy - (cy + dy + (j % 2 === c ? 0.12 : 0)) * scale,
    })),
  );
  const centroids = [0, 1, 2].map((c) => {
    const members = nodes.filter((n) => n.c === c);
    return { x: members.reduce((s, n) => s + n.x, 0) / 7, y: members.reduce((s, n) => s + n.y, 0) / 7 };
  });
  const weights = COARSE_LINKS.map(([a, b]) => BRIDGES.filter(([u, v]) => nodes[u].c === a && nodes[v].c === b).length);
  return { nodes, centroids, weights, scale };
}

export const line = (parent, a, b, style, attrs = {}) =>
  svg(parent, "line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, style, ...attrs });

/** Dessine le graphe fin ; opacité et épaisseur sont des attributs pour pouvoir les animer. */
export function drawNetwork(parent, net, { r = 13 } = {}) {
  const edges = svg(parent, "g");
  const nodeLayer = svg(parent, "g");
  const internal = INTERNAL.map(([a, b]) =>
    line(edges, net.nodes[a], net.nodes[b], `stroke: ${COLORS[net.nodes[a].c]}`, { "stroke-width": 2.5, "stroke-opacity": 0.55 }),
  );
  const bridges = BRIDGES.map(([a, b]) =>
    line(edges, net.nodes[a], net.nodes[b], "stroke: var(--ink)", { "stroke-width": 2, "stroke-opacity": 0.4 }),
  );
  const nodes = net.nodes.map(({ x, y, c }) =>
    svg(nodeLayer, "circle", { cx: x, cy: y, r, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 3` }),
  );
  return { internal, bridges, nodes, edges: [...internal, ...bridges] };
}

/** Graphe réduit : trois super-nœuds reliés par des arêtes d'épaisseur proportionnelle au nombre de ponts. */
export function drawCoarse(parent, net, { r = 34 } = {}) {
  const edgeLayer = svg(parent, "g");
  const edges = COARSE_LINKS.map(([a, b], k) =>
    line(edgeLayer, net.centroids[a], net.centroids[b], `stroke: var(--ink); stroke-width: ${net.weights[k] * 2.2}; stroke-opacity: 0.7`),
  );
  const supers = net.centroids.map(({ x, y }, c) =>
    svg(parent, "circle", { cx: x, cy: y, r, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 4` }),
  );
  return { edges, supers };
}

/** Rend un attribut fonction arbitraire du temps : l'« ease » renvoie directement la valeur. */
export function follow(tl, target, attr, fn, duration, position) {
  return tl.fromTo(target, { attr: { [attr]: 0 } }, { attr: { [attr]: 1 }, ease: fn, duration, immediateRender: false }, position);
}

/** Générateur pseudo-aléatoire à graine fixe (mulberry32) : trajectoires reproductibles. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smooth = (t) => {
  const u = Math.min(Math.max(t, 0), 1);
  return u * u * u * (u * (6 * u - 15) + 10);
};

/** Voisinage induit à un saut, copié dans un groupe, avec un anneau sur la racine. */
export function ego(parent, net, index, links = LINKS) {
  const members = new Set([index]);
  for (const [a, b] of links) if (a === index || b === index) members.add(a === index ? b : a);
  const group = svg(parent, "g");
  for (const [a, b] of links) {
    if (members.has(a) && members.has(b)) line(group, net.nodes[a], net.nodes[b], "stroke: var(--ink-soft); stroke-width: 2.5");
  }
  for (const i of members) {
    const { x, y, c } = net.nodes[i];
    svg(group, "circle", { cx: x, cy: y, r: 11, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 2.5` });
  }
  const root = net.nodes[index];
  svg(group, "circle", { cx: root.x, cy: root.y, r: 19, style: "fill: none; stroke: var(--ink); stroke-width: 2.5" });
  return { group, box: bounds([...members].map((i) => net.nodes[i]), 19) };
}

/** Nœuds et arêtes internes d'une communauté, dans sa couleur. */
export function cluster(parent, net, c) {
  const group = svg(parent, "g");
  for (const [a, b] of INTERNAL) {
    if (net.nodes[a].c === c) line(group, net.nodes[a], net.nodes[b], `stroke: ${COLORS[c]}; stroke-width: 2.5`);
  }
  const members = net.nodes.filter((n) => n.c === c);
  for (const { x, y } of members) svg(group, "circle", { cx: x, cy: y, r: 11, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 2.5` });
  return { group, box: bounds(members, 11) };
}

export function bounds(points, pad = 0) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/** Place un groupe SVG : son cadre `box` est centré en (x, y) avec la largeur ou hauteur voulue. */
export function fit(box, { x, y, w, h }) {
  const scale = w ? w / box.w : h / box.h;
  return { x: x - box.x, y: y - box.y, scale, svgOrigin: `${box.x} ${box.y}` };
}

/** Couleur résolue d'un jeton du thème (GSAP n'interpole pas les var(--…)). */
export function theme(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

const rgb = (color) =>
  color.startsWith("#") ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) : color.match(/[\d.]+/g).slice(0, 3).map(Number);

/** Mélange pondéré de couleurs (« #rrggbb » ou « rgb(…) »), renvoyé en « rgb(…) ». */
export function mix(colors, weights = colors.map(() => 1)) {
  const total = weights.reduce((s, w) => s + w, 0);
  const parts = colors.map(rgb);
  const out = [0, 1, 2].map((k) => Math.round(parts.reduce((s, p, i) => s + p[k] * weights[i], 0) / total));
  return `rgb(${out.join(", ")})`;
}

/** Cercle pointillé autour d'une communauté, comme une région. */
export function hull(parent, net, c, pad = 36) {
  const center = net.centroids[c];
  const reach = Math.max(...net.nodes.filter((n) => n.c === c).map((n) => Math.hypot(n.x - center.x, n.y - center.y)));
  return svg(parent, "circle", {
    cx: center.x, cy: center.y, r: reach + pad,
    style: `fill: ${FILLS[c]}; stroke: ${COLORS[c]}; stroke-width: 2.5; stroke-dasharray: 9 7`,
  });
}

/** Trait lumineux qui parcourt un segment de a vers b (équivalent de ShowPassingFlash). */
export function flash(parent, a, b, color, tl, position, duration = 0.9) {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const dash = length * 0.4;
  const node = line(parent, a, b, `stroke: ${color}; stroke-width: 7; stroke-linecap: butt`, {
    "stroke-dasharray": `${dash} ${length * 2}`,
    "stroke-dashoffset": dash,
  });
  tl.fromTo(node, { attr: { "stroke-dashoffset": dash } }, { attr: { "stroke-dashoffset": -length }, duration, ease: "power1.inOut", immediateRender: false }, position);
  return node;
}

/* Petit graphe à 8 nœuds du rappel MPNN (chapters/mpnn.py). */
const MPNN_POSITIONS = [[-1.0, 0.75], [-1.45, -0.35], [-0.35, 0.05], [0.45, 0.85], [1.2, 0.15], [0.75, -0.8], [-0.35, -0.95], [1.45, 1.05]];
export const MPNN_EDGES = [[0, 1], [0, 2], [1, 2], [2, 3], [2, 6], [3, 4], [3, 7], [4, 5], [5, 6], [4, 7]];

export function mpnnGraph(scale, [ox, oy]) {
  return MPNN_POSITIONS.map(([x, y]) => ({ x: ox + x * scale, y: oy - y * scale }));
}

export const neighbors = (i) => MPNN_EDGES.filter((e) => e.includes(i)).map(([a, b]) => (a === i ? b : a));

/** Couleurs d'embedding : mélanges des trois couleurs du thème, répartis par le nombre d'or. */
export function embeddingColors(count) {
  const base = ["blue", "green", "red"].map(theme);
  return Array.from({ length: count }, (_, i) => {
    const h = ((0.1 + i * 0.618) % 1) * 3;
    const k = Math.floor(h);
    const f = h - k;
    return mix([base[k], base[(k + 1) % 3]], [1 - f, f]);
  });
}

/* ——— Comparaison côte à côte : MPNN seul à gauche, MPNN + pooling à droite. ——— */
export const PANELS = [
  { x: 100, y: 215, w: 840, h: 745 },
  { x: 980, y: 215, w: 840, h: 745 },
].map((p) => ({ ...p, cx: p.x + p.w / 2, cy: p.y + p.h / 2 }));

/** Deux panneaux à bordure encre, avec titre et sous-titre en tête. */
export function versus(root, [left, right] = [["MPNN", ""], ["MPNN + pooling", ""]]) {
  return PANELS.map((p, i) => {
    const [name, note] = [left, right][i];
    const frame = div(root, "panel", { x: p.x, y: p.y, w: p.w, h: p.h });
    const head = div(root, "abs", {
      x: p.x + 40, y: p.y + 24,
      html: `<div style="font-size: 42px; line-height: 50px">${name}</div><div class="muted" style="font-size: 28px">${note}</div>`,
    });
    return { ...p, frame, head };
  });
}

/** Valeur scalaire dans [0, 1] → couleur : bleu, puis vert, puis rouge (couleurs du thème). */
export function valueColor(v) {
  const [blue, green, red] = ["blue", "green", "red"].map(theme);
  const u = Math.min(Math.max(v, 0), 1) * 2;
  return u <= 1 ? mix([blue, green], [1 - u, u]) : mix([green, red], [2 - u, u - 1]);
}

/** Remplace un texte par un autre en fondu croisé (étiquettes « K = … ») ; `to` est caché au départ. */
export function swap(tl, from, to, position) {
  gsap.set(to, { opacity: 0 });
  tl.to(from, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, position);
  tl.fromTo(to, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, "<0.2");
  return tl;
}

/** Distances en sauts depuis `source` (parcours en largeur). */
export function hops(count, links, source) {
  const near = Array.from({ length: count }, () => []);
  for (const [a, b] of links) near[a].push(b), near[b].push(a);
  const dist = Array(count).fill(Infinity);
  dist[source] = 0;
  const queue = [source];
  while (queue.length) {
    const u = queue.shift();
    for (const v of near[u]) if (dist[v] === Infinity) (dist[v] = dist[u] + 1), queue.push(v);
  }
  return dist;
}

/** Une couche d'agrégation moyenne avec boucle sur soi : x ← D̃⁻¹ Ã x. */
export function meanLayer(x, links) {
  const sum = [...x];
  const deg = x.map(() => 1);
  for (const [a, b] of links) (sum[a] += x[b]), (sum[b] += x[a]), deg[a]++, deg[b]++;
  return sum.map((s, i) => s / deg[i]);
}
