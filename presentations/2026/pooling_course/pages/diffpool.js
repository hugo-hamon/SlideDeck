import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, canvas, label, svg, tex, title } from "deck/components.js";
import { line, theme } from "../helpers.js";
import { EDGES, N, cite, drawGraph, formula, matrix, stepper, verdict } from "../methods.js";

/** Soft assignment, as a pooling GNN could produce it (rows sum to 1). */
export const SOFT = [
  [0.8, 0.12, 0.08], [0.84, 0.08, 0.08], [0.55, 0.2, 0.25], [0.22, 0.63, 0.15],
  [0.1, 0.72, 0.18], [0.08, 0.32, 0.6], [0.24, 0.08, 0.68], [0.1, 0.8, 0.1],
];
const K = 3;
const CELL = { x: 770, y: 425, w: 66, h: 40 };
const SUPERS = [{ x: 1170, y: 470 }, { x: 1450, y: 470 }, { x: 1310, y: 700 }];
const SUPER_R = 36;
const fr = (v, d = 2) => v.toFixed(d).replace(".", ",");

/** A′ = SᵀAS for an assignment S (A symmetric, no self-loops). */
export function coarsen(S) {
  const out = Array.from({ length: K }, () => Array(K).fill(0));
  for (const [a, b] of EDGES) {
    for (let k = 0; k < K; k++) for (let l = 0; l < K; l++) out[k][l] += S[a][k] * S[b][l] + S[b][k] * S[a][l];
  }
  return out;
}

/** DiffPool: a GNN produces a soft assignment S, so every node contributes to every super-node. */
export default function diffpool(root) {
  const heading = title(root, "DiffPool");
  const steps = stepper(root);
  const layer = canvas(root);
  const coarseLayer = svg(layer, "g");
  const graph = drawGraph(layer, { scale: 170, origin: [400, 600] });
  const { points, colors } = graph;
  const ref = cite(root, "Ying et al. — <i>Hierarchical Graph Representation Learning with Differentiable Pooling</i>, NeurIPS 2018");

  const S = matrix(root, layer, { x: CELL.x, y: CELL.y, rows: N, cols: K, w: CELL.w, h: CELL.h });
  const values = SOFT.map((row, i) =>
    row.map((v, k) => {
      const text = svg(layer, "text", { x: CELL.x + k * CELL.w + (CELL.w - 6) / 2, y: CELL.y + i * CELL.h + (CELL.h - 6) / 2 + 1, "text-anchor": "middle", "dominant-baseline": "middle", style: "fill: var(--ink); font: 24px var(--serif)" });
      text.textContent = fr(v, 1).replace(/^0/, "");
      return text;
    }),
  );
  const sName = label(root, tex(String.raw`S \in \mathbb{R}^{8 \times 3}`), CELL.x + (K * CELL.w) / 2 - 3, CELL.y + N * CELL.h + 34, 32);

  // Coarse graph: super-nodes and edges weighted by A′ = SᵀAS.
  const coarse = coarsen(SOFT);
  const pairs = [[0, 1], [0, 2], [1, 2]];
  const coarseEdges = pairs.map(([a, b]) => line(coarseLayer, SUPERS[a], SUPERS[b], "stroke: var(--ink)", { "stroke-width": 2 + 3 * coarse[a][b], "stroke-opacity": 0.75 }));
  const weights = pairs.map(([a, b]) => label(root, fr(coarse[a][b], 1), (SUPERS[a].x + SUPERS[b].x) / 2 + (b === 2 ? (a === 0 ? -34 : 34) : 0), (SUPERS[a].y + SUPERS[b].y) / 2 - (b === 2 ? 0 : 30), 28));
  const supers = SUPERS.map(({ x, y }, k) => svg(layer, "circle", { cx: x, cy: y, r: SUPER_R, style: `fill: ${COLORS[k]}; stroke: var(--paper); stroke-width: 4` }));
  gsap.set(supers, { scale: 0, transformOrigin: "50% 50%" });
  const aPrime = label(root, tex(String.raw`A' = \begin{bmatrix} ${coarse.map((r) => r.map((v) => fr(v, 1)).join(" & ")).join(String.raw` \\ `)} \end{bmatrix}`), 1680, 590, 30);
  const dense = label(root, "toutes les paires sont reliées : A′ est dense", 1310, 820, 28, "abs muted");

  // Packets: each node sends each super-node a share S_ik of its attribute.
  const packetLayer = svg(layer, "g");
  const packets = SOFT.map((row, i) =>
    row.map((s) => svg(packetLayer, "circle", { cx: points[i].x, cy: points[i].y, r: 5 + 13 * s, style: `fill: ${colors[i]}; stroke: var(--paper); stroke-width: 2` })),
  );
  gsap.set(packets.flat(), { opacity: 0 });

  const formulas = [
    formula(root, String.raw`S = \mathrm{softmax}\big(\mathrm{GNN}_{\text{pool}}(X, A)\big)`),
    formula(root, String.raw`X' = S^\top Z, \quad Z = \mathrm{GNN}_{\text{emb}}(X, A)`),
    formula(root, String.raw`A' = S^\top A\, S`),
    formula(root, String.raw`\mathcal{L}_{\text{LP}} = \lVert A - S S^\top \rVert_F \qquad \mathcal{L}_{\text{E}} = \tfrac{1}{N} \textstyle\sum_i H(S_{i\cdot})`),
  ];
  gsap.set(formulas, { opacity: 0 });
  const lossNote = label(root, "pertes auxiliaires : voisins dans le même groupe, affectations peu ambiguës", 960, 345, 26, "abs muted");
  gsap.set(lossNote, { opacity: 0 });
  const verdicts = verdict(root, "appris de bout en bout, tous les nœuds contribuent", "S et A′ denses : coûteux, K fixé à l’avance");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const show = (node, position) => tl.fromTo(node, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, position);
  const hide = (node, position) => tl.to(node, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, position);

  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(steps.all, { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, "<0.2");
  tl.from(graph.groups, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, "<0.2");
  tl.from(graph.edges, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(ref, { opacity: 0, duration: 0.6 }, "<");
  pause(tl);

  // SEL: one row of S per node, each node being split across the three super-nodes.
  tl.addLabel("sel");
  steps.focus(tl, 0, "sel");
  show(formulas[0], "sel+=0.2");
  tl.from(S.frame, { opacity: 0, duration: 0.4, stagger: 0.006 }, "sel+=0.3");
  SOFT.forEach((row, i) => {
    const at = `sel+=${0.9 + 0.22 * i}`;
    tl.to(graph.groups[i], { scale: 1.2, svgOrigin: `${points[i].x} ${points[i].y}`, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }, at);
    row.forEach((v, k) => tl.to(S.cells[i][k], { attr: { "fill-opacity": 0.9 * v }, duration: 0.35 }, at));
    tl.from(values[i], { opacity: 0, duration: 0.3 }, at);
  });
  tl.from(sName, { opacity: 0, y: 10, duration: 0.5 }, "sel+=1.2");
  pause(tl);

  // RED: each super-node receives a share of every node (column k of S).
  tl.addLabel("red");
  steps.focus(tl, 1, "red");
  hide(formulas[0], "red");
  show(formulas[1], "red+=0.2");
  for (let k = 0; k < K; k++) {
    const at = (offset) => `red+=${0.4 + 0.9 * k + offset}`;
    const column = S.cells.map((r) => r[k]);
    tl.to(column, { attr: { "stroke-width": 4 }, stroke: theme("ink"), duration: 0.3 }, at(0));
    tl.to(column, { attr: { "stroke-width": 1.5 }, stroke: theme("line"), duration: 0.3 }, at(1.1));
    SOFT.forEach((row, i) => {
      const packet = packets[i][k];
      tl.fromTo(packet, { opacity: 0 }, { opacity: 0.4 + 0.6 * row[k], duration: 0.2, immediateRender: false }, at(0.1));
      tl.to(packet, { attr: { cx: SUPERS[k].x, cy: SUPERS[k].y }, duration: 0.9, ease: "power3.inOut" }, at(0.2 + 0.02 * i));
      tl.to(packet, { opacity: 0, duration: 0.2 }, at(1.1));
    });
    tl.to(supers[k], { scale: 1, duration: 0.5, ease: "back.out(2)" }, at(1));
  }
  pause(tl);

  // CON: A′ = SᵀAS links every pair of super-nodes.
  tl.addLabel("con");
  steps.focus(tl, 2, "con");
  hide(formulas[1], "con");
  show(formulas[2], "con+=0.2");
  tl.to(graph.edges, { attr: { "stroke-width": 5 }, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut", stagger: 0.04 }, "con+=0.3");
  tl.from(coarseEdges, { attr: { "stroke-width": 0 }, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 }, "con+=0.9");
  tl.from(weights, { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(2)", stagger: 0.15 }, "con+=1.2");
  tl.from(aPrime, { opacity: 0, x: 20, duration: 0.6 }, "con+=1.4");
  tl.from(dense, { opacity: 0, y: 10, duration: 0.5 }, "con+=1.8");
  pause(tl);

  // Auxiliary losses and verdict.
  tl.addLabel("end");
  steps.focus(tl, -1, "end");
  hide(formulas[2], "end");
  show(formulas[3], "end+=0.2");
  show(lossNote, "end+=0.5");
  tl.from(verdicts, { opacity: 0, y: 12, duration: 0.6, stagger: 0.15 }, "end+=0.8");
  pause(tl);
  return tl;
}
