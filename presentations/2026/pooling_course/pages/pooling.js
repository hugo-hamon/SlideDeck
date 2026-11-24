import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, FILLS, canvas, div, drawIn, label, svg, tex, title } from "deck/components.js";

const CENTERS = [[-1.25, 0.7], [1.25, 0.65], [0, -1.15]];
const OFFSETS = [[-0.8, 0.15], [-0.35, 0.75], [0.45, 0.6], [0.9, -0.1], [0.4, -0.65], [-0.5, -0.55], [0.05, 0.05]];
const COMMUNITY_EDGES = [
  [0, 1, 2, 3, 4, 5, 6].map((i) => [i, (i + 1) % 7]),
  [0, 1, 2, 3, 4, 5].map((i) => [6, i]),
  [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 6], [6, 3]],
];
const BRIDGES = [[2, 7], [3, 12], [6, 7], [4, 15], [5, 14], [6, 16], [11, 16], [12, 17]];
const SCALE = 150;
const ORIGIN = [560, 585];
const SUPER_R = 34;
const CELL = 26;
const MATH_X = 1110;

const NODES = CENTERS.flatMap(([cx, cy], c) =>
  OFFSETS.map(([dx, dy], j) => ({
    c,
    x: ORIGIN[0] + (cx + dx * (1 - c * 0.08)) * SCALE,
    y: ORIGIN[1] - (cy + dy + (j % 2 === c ? 0.12 : 0)) * SCALE,
  })),
);
const INTERNAL = COMMUNITY_EDGES.flatMap((edges, c) => edges.map(([a, b]) => [7 * c + a, 7 * c + b]));
const CENTROIDS = [0, 1, 2].map((c) => {
  const members = NODES.filter((n) => n.c === c);
  return {
    x: members.reduce((s, n) => s + n.x, 0) / 7,
    y: members.reduce((s, n) => s + n.y, 0) / 7,
  };
});
const COARSE = [[0, 1], [0, 2], [1, 2]].map(([a, b]) => ({
  a, b,
  weight: BRIDGES.filter(([u, v]) => NODES[u].c === a && NODES[v].c === b).length,
}));
const ADJACENCY = String.raw`\begin{bmatrix}
  \htmlClass{c-blue}{14} & 3 & 3 \\ 3 & \htmlClass{c-green}{12} & 2 \\ 3 & 2 & \htmlClass{c-red}{16}
\end{bmatrix}`;

const line = (parent, a, b, style) => svg(parent, "line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, style });

/** The fine graph is summarised into three communities, and the matrix S writes the same operation. */
export default function pooling(root) {
  const heading = title(root, "Pooling : changer d’échelle");
  const layer = canvas(root);
  const hullLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const edgeLayer = svg(layer, "g");
  const nodeLayer = svg(layer, "g");
  const superLayer = svg(layer, "g");

  const hulls = CENTROIDS.map((center, c) => {
    const reach = Math.max(...NODES.filter((n) => n.c === c).map((n) => Math.hypot(n.x - center.x, n.y - center.y)));
    return svg(hullLayer, "circle", {
      cx: center.x, cy: center.y, r: reach + 36,
      style: `fill: ${FILLS[c]}; stroke: ${COLORS[c]}; stroke-width: 2.5; stroke-dasharray: 9 7`,
    });
  });
  const internal = INTERNAL.map(([a, b]) =>
    line(edgeLayer, NODES[a], NODES[b], `stroke: ${COLORS[NODES[a].c]}; stroke-width: 2.5; stroke-opacity: 0.55`),
  );
  const bridges = BRIDGES.map(([a, b]) =>
    line(edgeLayer, NODES[a], NODES[b], "stroke: var(--ink); stroke-width: 2; stroke-opacity: 0.4"),
  );
  const nodes = NODES.map(({ x, y, c }) =>
    svg(nodeLayer, "circle", { cx: x, cy: y, r: 13, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 3` }),
  );
  const supers = CENTROIDS.map(({ x, y }, c) =>
    svg(superLayer, "circle", { cx: x, cy: y, r: SUPER_R, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 4` }),
  );
  const coarse = COARSE.map(({ a, b, weight }) => {
    const [p, q] = [CENTROIDS[a], CENTROIDS[b]];
    const edge = line(coarseLayer, p, q, `stroke: var(--ink); stroke-width: ${weight * 2.2}; stroke-opacity: 0.7`);
    const tag = svg(coarseLayer, "g");
    const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    svg(tag, "circle", { cx: mid.x, cy: mid.y, r: 21, style: "fill: var(--paper); stroke: var(--ink); stroke-width: 2" });
    const value = svg(tag, "text", {
      x: mid.x, y: mid.y + 2, "text-anchor": "middle", "dominant-baseline": "middle",
      style: "fill: var(--ink); font: 26px var(--serif)",
    });
    value.textContent = weight;
    return { edge, tag };
  });

  const sLabel = label(root, tex(String.raw`S^\top \in \{0,1\}^{3 \times 21}`), MATH_X + (21 * CELL) / 2, 305, 40);
  const grid = svg(layer, "g");
  const gridTop = 350;
  const empty = [];
  const filled = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 21; col++) {
      const x = MATH_X + col * CELL;
      const y = gridTop + row * CELL;
      empty.push(svg(grid, "rect", { x, y, width: CELL, height: CELL, style: "fill: var(--panel); stroke: var(--line); stroke-width: 1.5" }));
      if (NODES[col].c === row) {
        filled.push(svg(grid, "rect", { x: x + 4, y: y + 4, width: CELL - 8, height: CELL - 8, rx: 3, style: `fill: ${COLORS[row]}` }));
      }
    }
  }
  const nodeCaption = label(root, "21 nœuds", MATH_X + (21 * CELL) / 2, gridTop + 3 * CELL + 34, 28, "abs muted");
  const features = div(root, "abs", { x: MATH_X, y: 540, html: tex(String.raw`X' = S^\top X \in \mathbb{R}^{3 \times d}`), style: { fontSize: "46px" } });
  const adjacency = div(root, "abs", { x: MATH_X, y: 650, html: tex(String.raw`A' = S^\top A\, S = ${ADJACENCY}`), style: { fontSize: "46px" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" });
  tl.from(nodes, { scale: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(2.2)", stagger: 0.03 }, "<0.2");
  drawIn(tl, [...internal, ...bridges], { duration: 0.9, stagger: 0.012 }, "<0.4");
  pause(tl);

  tl.from(hulls, { scale: 0.7, opacity: 0, transformOrigin: "50% 50%", duration: 0.8, stagger: 0.15 });
  tl.from(sLabel, { opacity: 0, y: 16, duration: 0.6 }, "<0.1");
  tl.from(empty, { opacity: 0, duration: 0.4, stagger: { each: 0.004, from: "start" } }, "<0.1");
  tl.from(filled, { scale: 0, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2)", stagger: (i) => 0.15 * Math.floor(i / 7) + 0.02 * i }, "<0.2");
  tl.from(nodeCaption, { opacity: 0, duration: 0.5 }, "<0.3");
  pause(tl);

  tl.addLabel("collapse");
  nodes.forEach((node, i) => {
    const { x, y } = CENTROIDS[NODES[i].c];
    tl.to(node, { attr: { cx: x, cy: y }, duration: 1, ease: "power3.inOut" }, `collapse+=${0.015 * i}`);
  });
  internal.forEach((edge, i) => {
    const { x, y } = CENTROIDS[NODES[INTERNAL[i][0]].c];
    tl.to(edge, { attr: { x1: x, y1: y, x2: x, y2: y }, duration: 1, ease: "power3.inOut" }, "collapse");
  });
  bridges.forEach((edge, i) => {
    const [p, q] = BRIDGES[i].map((n) => CENTROIDS[NODES[n].c]);
    tl.to(edge, { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1, ease: "power3.inOut" }, "collapse");
  });
  tl.to(hulls, { attr: { r: SUPER_R }, opacity: 0, duration: 1, ease: "power3.inOut" }, "collapse");
  tl.from(supers, { scale: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.8)", stagger: 0.08 }, "collapse+=0.75");
  tl.to([...nodes, ...internal, ...bridges], { opacity: 0, duration: 0.2 }, "collapse+=1.05");
  tl.from(coarse.map((c) => c.edge), { opacity: 0, duration: 0.5 }, "collapse+=0.95");
  tl.from(coarse.map((c) => c.tag), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.5)", stagger: 0.1 }, "collapse+=1.15");
  tl.to(nodeCaption, { opacity: 0, duration: 0.3 }, "collapse");
  tl.to(filled, { scaleX: 1.15, transformOrigin: "50% 50%", duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut" }, "collapse+=0.2");
  pause(tl);

  tl.from(features, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(adjacency, { opacity: 0, y: 24, duration: 0.8 }, "<0.35");
  tl.to(coarse.map((c) => c.tag), { scale: 1.25, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut", stagger: 0.08 }, "<0.5");
  pause(tl);
  return tl;
}
