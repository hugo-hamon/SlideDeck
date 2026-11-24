import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, canvas, label, svg, tex, title } from "deck/components.js";
import { line, mix, seeded, theme } from "../helpers.js";
import { EDGES, GROUPS, N, cite, drawGraph, formula, matrix, stepper, verdict } from "../methods.js";

const K = 3;
const CELL = { x: 770, y: 425, w: 66, h: 40 };
const FRAMES = [0, 0.25, 0.5, 0.75, 1];
const GAUGE = { x: 1180, y: 660, w: 560, h: 34 };
const SUPER_R = 34;
const fr = (v, d = 2) => v.toFixed(d).replace(".", ",");

/* Initial assignment (almost uniform, fixed seed) and learned assignment (crisp). */
const random = seeded(7);
const START = Array.from({ length: N }, () => {
  const logits = [0, 1, 2].map(() => 0.5 * random());
  const exp = logits.map(Math.exp);
  return exp.map((e) => e / exp.reduce((s, v) => s + v, 0));
});
const END = GROUPS.map((g) => [0, 1, 2].map((k) => (k === g ? 0.92 : 0.04)));
const blend = (t) => START.map((row, i) => row.map((v, k) => (1 - t) * v + t * END[i][k]));

/* Ã = D^{-1/2} A D^{-1/2}, as in the paper. */
const degree = Array.from({ length: N }, (_, i) => EDGES.filter((e) => e.includes(i)).length);
const NORMALIZED = EDGES.map(([a, b]) => 1 / Math.sqrt(degree[a] * degree[b]));

/** A′ = SᵀÃS (K × K matrix). */
function coarsen(S) {
  const out = Array.from({ length: K }, () => Array(K).fill(0));
  EDGES.forEach(([a, b], e) => {
    for (let k = 0; k < K; k++) for (let l = 0; l < K; l++) out[k][l] += NORMALIZED[e] * (S[a][k] * S[b][l] + S[b][k] * S[a][l]);
  });
  return out;
}

/** MinCutPool losses: cut ℒc = −Tr(SᵀÃS)/Tr(SᵀD̃S) and orthogonality ℒo. */
function losses(S) {
  const pooled = coarsen(S);
  const deg = Array(N).fill(0);
  EDGES.forEach(([a, b], e) => ((deg[a] += NORMALIZED[e]), (deg[b] += NORMALIZED[e])));
  let trace = 0;
  let volume = 0;
  for (let k = 0; k < K; k++) {
    trace += pooled[k][k];
    for (let i = 0; i < N; i++) volume += deg[i] * S[i][k] * S[i][k];
  }
  const gram = Array.from({ length: K }, (_, k) => Array.from({ length: K }, (_, l) => S.reduce((s, row) => s + row[k] * row[l], 0)));
  const norm = Math.sqrt(gram.flat().reduce((s, v) => s + v * v, 0));
  const ortho = Math.sqrt(gram.flat().reduce((s, v, idx) => s + (v / norm - (idx % (K + 1) === 0 ? 1 / Math.sqrt(K) : 0)) ** 2, 0));
  return -trace / volume + ortho;
}

const matrixTex = (m) => String.raw`\begin{bmatrix} ${m.map((r) => r.map((v) => fr(v, 1)).join(" & ")).join(String.raw` \\ `)} \end{bmatrix}`;

/** MinCutPool: S is learned through a minimum-cut loss, and A′ loses its self-loops before being normalised. */
export default function mincut(root) {
  const heading = title(root, "MinCutPool");
  const steps = stepper(root);
  const layer = canvas(root);
  const coarseLayer = svg(layer, "g");
  const graph = drawGraph(layer, { scale: 170, origin: [400, 600] });
  const { points } = graph;
  const ref = cite(root, "Bianchi, Grattarola, Alippi — <i>Spectral Clustering with Graph Neural Networks for Graph Pooling</i>, ICML 2020");
  const [blue, green, red, ink, paper] = ["blue", "green", "red", "ink-soft", "paper"].map(theme);

  // Membership ring of each node: mix of the group colours, weighted by its row of S.
  const ringColor = (row) => mix([blue, green, red, paper], [...row.map((v) => v * v), 0.15]);
  const rings = points.map(({ x, y }, i) => svg(layer, "circle", { cx: x, cy: y, r: 31, style: `fill: none; stroke: ${ringColor(START[i])}; stroke-width: 7` }));
  graph.groups.forEach((g) => layer.appendChild(g));
  const S = matrix(root, layer, { x: CELL.x, y: CELL.y, rows: N, cols: K, w: CELL.w, h: CELL.h });
  START.forEach((row, i) => row.forEach((v, k) => S.cells[i][k].setAttribute("fill-opacity", 0.9 * v)));
  const sName = label(root, tex(String.raw`S \in \mathbb{R}^{8 \times 3}`), CELL.x + (K * CELL.w) / 2 - 3, CELL.y + N * CELL.h + 34, 32);

  // Losses: formulas and gauge of the total loss.
  const lossTex = [
    label(root, `${tex(String.raw`\mathcal{L}_c = -\dfrac{\mathrm{Tr}(S^\top \tilde{A} S)}{\mathrm{Tr}(S^\top \tilde{D} S)}`)}<br><span class="muted" style="font-size: 26px">peu d’arêtes coupées entre groupes</span>`, 1460, 395, 30),
    label(root, `${tex(String.raw`\mathcal{L}_o = \Big\lVert \tfrac{S^\top S}{\lVert S^\top S \rVert_F} - \tfrac{I_K}{\sqrt{K}} \Big\rVert_F`)}<br><span class="muted" style="font-size: 26px">groupes distincts et équilibrés</span>`, 1460, 540, 30),
  ];
  lossTex.forEach((l) => (l.style.textAlign = "center"));
  const values = FRAMES.map((t) => losses(blend(t)));
  const width = (v) => Math.max(8, (GAUGE.w * (v - values.at(-1) + 0.08)) / (values[0] - values.at(-1) + 0.08));
  const gaugeBack = svg(layer, "rect", { x: GAUGE.x, y: GAUGE.y, width: GAUGE.w, height: GAUGE.h, rx: 6, style: `fill: var(--panel); stroke: var(--line); stroke-width: 2` });
  const gauge = svg(layer, "rect", { x: GAUGE.x, y: GAUGE.y, width: width(values[0]), height: GAUGE.h, rx: 6, style: `fill: ${red}` });
  const gaugeName = label(root, `${tex(String.raw`\mathcal{L}_c + \mathcal{L}_o`)}`, GAUGE.x - 70, GAUGE.y + GAUGE.h / 2, 30);
  const training = label(root, "entraînement →", GAUGE.x + GAUGE.w / 2, GAUGE.y + 70, 28, "abs muted");

  // Coarse graph: super-nodes at each group's centre, self-loops (diagonal of A′) and edges.
  const members = [0, 1, 2].map((c) => points.filter((_, i) => GROUPS[i] === c));
  const centers = members.map((ps) => ({ x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length }));
  const pairs = [[0, 1], [0, 2], [1, 2]];
  const finalA = coarsen(END);
  const coarseEdges = pairs.map(([a, b]) => line(coarseLayer, centers[a], centers[b], "stroke: var(--ink)", { "stroke-width": 2 + 4 * finalA[a][b], "stroke-opacity": 0.75 }));
  const loops = centers.map(({ x, y }) => svg(coarseLayer, "circle", { cx: x, cy: y - SUPER_R - 10, r: 20, style: "fill: none; stroke: var(--ink); stroke-width: 4" }));
  gsap.set(loops, { opacity: 0 });
  const supers = centers.map(({ x, y }, k) => svg(layer, "circle", { cx: x, cy: y, r: SUPER_R, style: `fill: ${COLORS[k]}; stroke: var(--paper); stroke-width: 4` }));
  gsap.set(supers, { scale: 0, transformOrigin: "50% 50%" });

  // The three CON stages on A′.
  const zero = finalA.map((r, k) => r.map((v, l) => (k === l ? 0 : v)));
  const d = zero.map((r) => r.reduce((s, v) => s + v, 0));
  const normalized = zero.map((r, k) => r.map((v, l) => v / Math.sqrt(d[k] * d[l])));
  const conSteps = [
    label(root, `${tex(String.raw`S^\top \tilde{A} S = ${matrixTex(finalA)}`)}<br><span class="muted" style="font-size: 26px">la diagonale compte les arêtes internes</span>`, 1460, 520, 30),
    label(root, `${tex(String.raw`\text{diag} \leftarrow 0 : ${matrixTex(zero)}`)}<br><span class="muted" style="font-size: 26px">pas de boucles : le message vient des autres groupes</span>`, 1460, 520, 30),
    label(root, `${tex(String.raw`A' = \tilde{D}^{-1/2} \hat{A} \tilde{D}^{-1/2} = ${matrixTex(normalized)}`)}<br><span class="muted" style="font-size: 26px">puis normalisation</span>`, 1460, 520, 30),
  ];
  conSteps.forEach((l) => (l.style.textAlign = "center"));
  gsap.set(conSteps, { opacity: 0 });

  const formulas = [
    formula(root, String.raw`S = \mathrm{softmax}\big(\mathrm{MLP}(X)\big)`),
    formula(root, String.raw`X' = S^\top X`),
    formula(root, String.raw`A' = \mathrm{CON}(S^\top \tilde{A} S)`),
  ];
  gsap.set(formulas, { opacity: 0 });
  const verdicts = verdict(root, "groupes guidés par la structure, tous les nœuds contribuent", "S dense, K fixé à l’avance");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const show = (node, position) => tl.fromTo(node, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, position);
  const hide = (node, position) => tl.to(node, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, position);

  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(steps.all, { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, "<0.2");
  tl.from(graph.groups, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, "<0.2");
  tl.from(graph.edges, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(ref, { opacity: 0, duration: 0.6 }, "<");
  pause(tl);

  // SEL (1): a simple MLP gives a soft assignment, blurry at first.
  tl.addLabel("sel");
  steps.focus(tl, 0, "sel");
  show(formulas[0], "sel+=0.2");
  tl.from(S.frame, { opacity: 0, duration: 0.4, stagger: 0.006 }, "sel+=0.3");
  tl.from(rings, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.05 }, "sel+=0.6");
  tl.from(sName, { opacity: 0, y: 10, duration: 0.5 }, "sel+=0.8");
  tl.from(lossTex, { opacity: 0, x: 20, duration: 0.6, stagger: 0.2 }, "sel+=1");
  tl.from([gaugeBack, gauge, gaugeName], { opacity: 0, duration: 0.5 }, "sel+=1.5");
  pause(tl);

  // SEL (2): training makes S crisp and the cut edges shrink to the bridges.
  tl.addLabel("train");
  tl.from(training, { opacity: 0, x: -20, duration: 0.5 }, "train");
  FRAMES.slice(1).forEach((t, f) => {
    const at = `train+=${0.3 + 0.75 * f}`;
    const S_t = blend(t);
    const opts = { duration: 0.75, ease: "none" };
    S_t.forEach((row, i) => {
      row.forEach((v, k) => tl.to(S.cells[i][k], { attr: { "fill-opacity": 0.9 * v }, ...opts }, at));
      tl.to(rings[i], { stroke: ringColor(row), ...opts }, at);
    });
    EDGES.forEach(([a, b], e) => {
      const cutProb = 1 - S_t[a].reduce((s, v, k) => s + v * S_t[b][k], 0);
      const crisp = Math.max(0, (cutProb - 0.6) / 0.4);
      tl.to(graph.edges[e], { stroke: mix([ink, red], [1 - crisp * t, crisp * t]), attr: { "stroke-width": 3 + 2 * crisp * t }, ...opts }, at);
    });
    tl.to(gauge, { attr: { width: width(values[f + 1]) }, ...opts }, at);
  });
  tl.to(training, { opacity: 0, duration: 0.4 }, ">");
  pause(tl);

  // RED: each group contracts into a super-node.
  tl.addLabel("red");
  steps.focus(tl, 1, "red");
  hide(formulas[0], "red");
  show(formulas[1], "red+=0.2");
  tl.to([...lossTex, gaugeBack, gauge, gaugeName], { opacity: 0, duration: 0.4 }, "red");
  tl.to(graph.edges, { attr: { "stroke-opacity": 0.3 }, duration: 0.4 }, "red+=0.2");
  points.forEach((p, i) => {
    const c = centers[GROUPS[i]];
    tl.to([graph.groups[i], rings[i]], { x: c.x - p.x, y: c.y - p.y, duration: 1, ease: "power3.inOut" }, "red+=0.4");
  });
  EDGES.forEach(([a, b], e) => {
    const [ca, cb] = [centers[GROUPS[a]], centers[GROUPS[b]]];
    tl.to(graph.edges[e], { attr: { x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }, duration: 1, ease: "power3.inOut" }, "red+=0.4");
  });
  tl.to(supers, { scale: 1, duration: 0.6, ease: "back.out(2)", stagger: 0.1 }, "red+=1.3");
  tl.to([...graph.groups, ...rings], { opacity: 0, duration: 0.3 }, "red+=1.4");
  pause(tl);

  // CON: SᵀÃS has strong self-loops, which MinCutPool removes before normalising.
  tl.addLabel("con");
  steps.focus(tl, 2, "con");
  hide(formulas[1], "con");
  show(formulas[2], "con+=0.2");
  tl.to(graph.edges, { opacity: 0, duration: 0.3 }, "con+=0.3");
  tl.from(coarseEdges, { attr: { "stroke-width": 0 }, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }, "con+=0.4");
  tl.fromTo(loops, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, transformOrigin: "50% 100%", duration: 0.6, ease: "back.out(2)", stagger: 0.1, immediateRender: false }, "con+=0.5");
  show(conSteps[0], "con+=0.6");
  pause(tl);

  tl.addLabel("diag");
  hide(conSteps[0], "diag");
  show(conSteps[1], "diag+=0.25");
  tl.to(loops, { opacity: 0, scale: 0.4, transformOrigin: "50% 100%", duration: 0.5, ease: "power2.in", stagger: 0.08 }, "diag+=0.4");
  pause(tl);

  tl.addLabel("norm");
  hide(conSteps[1], "norm");
  show(conSteps[2], "norm+=0.25");
  coarseEdges.forEach((edge, k) => {
    const [a, b] = pairs[k];
    tl.to(edge, { attr: { "stroke-width": 2 + 6 * normalized[a][b] }, duration: 0.6, ease: "power3.inOut" }, "norm+=0.5");
  });
  pause(tl);

  steps.focus(tl, -1, ">");
  tl.from(verdicts, { opacity: 0, y: 12, duration: 0.6, stagger: 0.15 }, "<0.1");
  pause(tl);
  return tl;
}
