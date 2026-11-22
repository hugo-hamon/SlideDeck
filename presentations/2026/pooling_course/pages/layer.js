import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, canvas, div, drawIn, label, svg, tex, title } from "deck/components.js";
import { MPNN_EDGES, embeddingColors, flash, mix, mpnnGraph, neighbors, theme } from "../helpers.js";
import { buildMacro, zoomIn } from "./mpnn.js";

const POINTS = mpnnGraph(270, [515, 590]);
const NODE_R = 23;
const RING_R = 40;
const TARGET = 3;
const NEAR = neighbors(TARGET);
const EQ_X = 1090;
// Directions libres de toute arête pour les étiquettes s, v₁, v₂, v₃.
const LABEL_SIDES = { 3: [0, -1], 2: [0.85, 0.6], 4: [1, 0.15], 7: [1, 0.2] };
const MODELS = [
  ["GCN", "Kipf & Welling, 2017", 0, [String.raw`h_s^{(k+1)} = \sigma\Big(\sum_{v \in \mathcal{N}(s) \cup \{s\}} \frac{1}{\sqrt{\hat d_s \hat d_v}} \, W^{(k)} h_v^{(k)}\Big)`]],
  ["GINE", "Hu et al., 2020 · GIN avec attributs d’arêtes", 1, [
    String.raw`h_s^{(k+1)} = \mathrm{MLP}^{(k)}\Big((1+\epsilon)\, h_s^{(k)}`,
    String.raw`\qquad + \sum_{v \in \mathcal{N}(s)} \mathrm{ReLU}\big(h_v^{(k)} + e_{vs}\big)\Big)`,
  ]],
  ["GAT", "Veličković et al., 2018", 2, [
    String.raw`h_s^{(k+1)} = \sigma\Big(\sum_{v \in \mathcal{N}(s) \cup \{s\}} \alpha_{sv} \, W^{(k)} h_v^{(k)}\Big)`,
    String.raw`\alpha_{sv} = \mathrm{softmax}_{v}\Big(\mathrm{LeakyReLU}\big(a^\top [\, W h_s \,\|\, W h_v \,]\big)\Big)`,
  ]],
];

/** Code couleur des formules : s en bleu, voisins v en vert, arêtes en rouge. */
const colorize = (expression) =>
  expression
    .replaceAll("h_s^{(k)}", String.raw`\htmlClass{c-blue}{h_s^{(k)}}`)
    .replaceAll("h_v^{(k)}", String.raw`\htmlClass{c-green}{h_v^{(k)}}`)
    .replaceAll("e_{vs}", String.raw`\htmlClass{c-red}{e_{vs}}`);

/** Étape d'une couche : nom au-dessus, équation alignée à gauche. */
function equation(root, name, expression, y) {
  return div(root, "abs", {
    x: EQ_X, y,
    html: `<div class="muted" style="font-size: 30px; line-height: 40px">${name}</div><div style="font-size: 44px">${tex(expression)}</div>`,
  });
}

const ring = (parent, i, color) =>
  svg(parent, "circle", { cx: POINTS[i].x, cy: POINTS[i].y, r: RING_R, style: `fill: none; stroke: ${color}; stroke-width: 3.5` });

function nameTag(root, i, html, color) {
  const [dx, dy] = LABEL_SIDES[i];
  const d = Math.hypot(dx, dy);
  return label(root, html, POINTS[i].x + (dx / d) * (RING_R + 30), POINTS[i].y + (dy / d) * (RING_R + 26), 40, `abs ${color}`);
}

/** Une couche de message passing, synchronisée avec ses équations, puis trois MPNN classiques. */
export default function layer(root) {
  // On repart de l'état final de la slide 07 pour entrer dans la boîte sans couture.
  const macro = buildMacro(root, { done: true });
  const colors = embeddingColors(8);
  const [blue, green, red] = ["blue", "green", "red"].map(theme);
  const heading = title(root, "Dans le MPNN : une couche");
  const modelsHeading = title(root, "Trois MPNN classiques");
  const stage = canvas(root);
  const edgeLayer = svg(stage, "g");
  const flashLayer = svg(stage, "g");
  const ringLayer = svg(stage, "g");
  const nodeLayer = svg(stage, "g");
  const tokenLayer = svg(stage, "g");

  const edges = MPNN_EDGES.map(([a, b]) =>
    svg(edgeLayer, "line", { x1: POINTS[a].x, y1: POINTS[a].y, x2: POINTS[b].x, y2: POINTS[b].y, "stroke-width": 3, style: `stroke: ${theme("ink-soft")}` }),
  );
  const nodes = POINTS.map(({ x, y }, i) => svg(nodeLayer, "circle", { cx: x, cy: y, r: NODE_R, style: `fill: ${colors[i]}; stroke: var(--paper); stroke-width: 4` }));
  const graph = [...edges, ...nodes];

  const sRing = ring(ringLayer, TARGET, COLORS[0]);
  const vRings = NEAR.map((u) => ring(ringLayer, u, COLORS[1]));
  const sName = nameTag(root, TARGET, tex("s"), "c-blue");
  const vNames = NEAR.map((u, k) => nameTag(root, u, tex(`v_${k + 1}`), "c-green"));
  const incident = MPNN_EDGES.map((e, k) => (e.includes(TARGET) ? edges[k] : null)).filter(Boolean);

  const notation = div(root, "abs", { x: EQ_X, y: 880, html: `${tex(String.raw`h_s^{(k)}`)} <span class="muted">: embedding de s après k couches</span>`, style: { fontSize: "32px" } });
  const parallel = div(root, "abs muted", { x: EQ_X, y: 885, html: "Tous les nœuds, en parallèle", style: { fontSize: "32px" } });
  const hopNote = div(root, "abs muted", { x: EQ_X, y: 885, html: "K couches → voisinage à K sauts", style: { fontSize: "32px" } });

  const message = equation(root, "1. Message", String.raw`\htmlClass{q-m}{m_{v \to s}} = \htmlClass{q-psi}{\psi}\big(\htmlClass{q-hs}{h_s^{(k)}}, \htmlClass{c-green}{h_v^{(k)}}\big)`, 230);
  const aggregation = equation(root, "2. Agrégation", String.raw`\htmlClass{c-red}{m_s} = \htmlClass{q-sum}{\bigoplus_{v \in \mathcal{N}(s)}} \htmlClass{c-red}{m_{v \to s}}`, 420);
  const note = div(root, "abs muted", { x: EQ_X, y: 610, html: "⊕ : somme, moyenne ou max", style: { fontSize: "28px" } });
  const update = equation(root, "3. Mise à jour", String.raw`\htmlClass{q-new}{h_s^{(k+1)}} = \phi\big(\htmlClass{c-blue}{h_s^{(k)}}, \htmlClass{c-red}{m_s}\big)`, 680);
  const part = (node, name) => node.querySelector(`.${name}`);

  // Messages : un carré par voisin, de la couleur de son embedding.
  const sPoint = POINTS[TARGET];
  const SIDE = 34;
  const tokens = NEAR.map((u) =>
    svg(tokenLayer, "rect", {
      x: POINTS[u].x - SIDE / 2, y: POINTS[u].y - SIDE / 2, width: SIDE, height: SIDE, rx: 4,
      style: `fill: ${colors[u]}; stroke: ${red}; stroke-width: 0`,
    }),
  );
  const sent = NEAR.map((u) => mix([colors[u], colors[TARGET]]));
  const gathered = mix(sent);
  const meet = { x: sPoint.x - 115, y: sPoint.y + 30 };
  const fresh = mix([colors[TARGET], gathered], [0.4, 0.6]);
  const mixed = colors.map((c, i) => mix([c, mix(neighbors(i).map((u) => colors[u]))], [0.55, 0.45]));
  mixed[TARGET] = mix([fresh, mix(NEAR.map((u) => colors[u]))], [0.55, 0.45]);

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  zoomIn(tl, macro, 0);
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 }, ">-0.2");
  tl.from(graph, { x: -320, opacity: 0, duration: 1.2, ease: "power3.out" }, "<0.1");
  pause(tl);

  // s et ses voisins.
  drawIn(tl, sRing, { duration: 0.6 });
  tl.from([sName, notation], { opacity: 0, y: 10, duration: 0.6, stagger: 0.1 }, "<0.1");
  drawIn(tl, vRings, { duration: 0.6, stagger: 0.08 }, ">-0.1");
  tl.from(vNames, { opacity: 0, y: 10, duration: 0.5, stagger: 0.08 }, "<0.1");
  tl.to(incident, { stroke: green, attr: { "stroke-width": 5 }, duration: 0.6, ease: "power2.inOut" }, "<");
  pause(tl);

  // 1. Message : chaque voisin envoie un message vers s.
  tl.from(message, { opacity: 0, y: 14, duration: 0.8 });
  tl.from(tokens, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.5)", stagger: 0.08 }, "<0.3");
  tokens.forEach((token, k) => {
    const p = POINTS[NEAR[k]];
    tl.to(token, { x: 0.62 * (sPoint.x - p.x), y: 0.62 * (sPoint.y - p.y), fill: sent[k], strokeWidth: 3.5, duration: 1.2, ease: "power3.inOut" }, k ? "<0.05" : ">0.1");
  });
  tl.to(part(message, "q-hs"), { color: blue, duration: 0.5, ease: "power2.inOut" }, "<0.2");
  tl.to([part(message, "q-psi"), part(message, "q-m")], { color: red, duration: 0.5, ease: "power2.inOut" }, "<0.2");
  pause(tl);

  // 2. Agrégation : les messages fusionnent.
  tl.from(aggregation, { opacity: 0, y: 14, duration: 0.8 });
  tokens.forEach((token, k) => {
    const p = POINTS[NEAR[k]];
    tl.to(token, { x: meet.x - p.x, y: meet.y - p.y, fill: gathered, duration: 1.1, ease: "power3.inOut" }, k ? "<" : ">-0.3");
  });
  tl.to(part(aggregation, "q-sum"), { scale: 1.15, transformOrigin: "50% 50%", color: red, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut" }, "<0.4");
  tl.from(note, { opacity: 0, y: 10, duration: 0.6 }, "<0.2");
  pause(tl);

  // 3. Mise à jour : le message agrégé rejoint s, dont l'embedding change.
  tl.from(update, { opacity: 0, y: 14, duration: 0.8 });
  tokens.forEach((token, k) => {
    const p = POINTS[NEAR[k]];
    tl.to(token, { x: sPoint.x - p.x, y: sPoint.y - p.y, scale: 0.4, transformOrigin: "50% 50%", duration: 0.9, ease: "power3.inOut" }, k ? "<" : ">-0.3");
  });
  tl.to(tokens, { opacity: 0, duration: 0.2 }, ">-0.15");
  tl.to(nodes[TARGET], { fill: fresh, scale: 1.3, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2)" }, "<");
  tl.to(part(update, "q-new"), { color: blue, duration: 0.5 }, "<");
  pause(tl);

  // Tous les nœuds en parallèle.
  tl.addLabel("parallel");
  tl.to([...vRings, ...vNames, notation], { opacity: 0, duration: 0.4, ease: "power2.in" }, "parallel");
  tl.to(incident, { stroke: theme("ink-soft"), attr: { "stroke-width": 3 }, duration: 0.6, ease: "power2.inOut" }, "parallel");
  tl.to(nodes[TARGET], { scale: 1, duration: 0.6, ease: "power3.inOut" }, "parallel");
  tl.from(parallel, { opacity: 0, y: 10, duration: 0.6 }, "parallel+=0.3");
  MPNN_EDGES.forEach(([a, b]) => {
    flash(flashLayer, POINTS[a], POINTS[b], red, tl, "parallel+=0.6", 1.1);
    flash(flashLayer, POINTS[b], POINTS[a], red, tl, "parallel+=0.6", 1.1);
  });
  nodes.forEach((node, i) => tl.to(node, { fill: mixed[i], duration: 0.8, ease: "power2.inOut" }, "parallel+=1.5"));
  tl.to(part(update, "q-new"), { scale: 1.12, transformOrigin: "0% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut" }, "parallel+=1.5");
  pause(tl);

  // K couches : le voisinage atteint s'élargit d'un saut par couche.
  const hops = [NEAR, POINTS.map((_, i) => i).filter((i) => i !== TARGET && !NEAR.includes(i))];
  const reached = new Set([TARGET]);
  const hopMarks = [];
  tl.to(parallel, { opacity: 0, duration: 0.3 });
  tl.from(hopNote, { opacity: 0, y: 10, duration: 0.5 }, "<0.2");
  hops.forEach((hop, k) => {
    const color = [COLORS[1], COLORS[2]][k];
    if (k > 0) pause(tl);
    tl.addLabel(`hop${k}`);
    for (const a of hop) {
      for (const b of neighbors(a)) if (reached.has(b)) flash(flashLayer, POINTS[a], POINTS[b], [green, red][k], tl, `hop${k}`, 1);
    }
    const rings = hop.map((a) => ring(ringLayer, a, color));
    const tag = label(root, tex(`K = ${k + 1}`), 190, 250 + 60 * k, 44, `abs ${["c-green", "c-red"][k]}`);
    drawIn(tl, rings, { duration: 0.6, stagger: 0.05 }, `hop${k}+=0.8`);
    tl.from(tag, { opacity: 0, x: -14, duration: 0.6 }, "<");
    hopMarks.push(...rings, tag);
    hop.forEach((a) => reached.add(a));
  });
  pause(tl);

  // Trois MPNN classiques, un par arrêt.
  const models = div(root, "abs", { x: EQ_X - 110, y: 215 });
  const blocks = MODELS.map(([name, reference, color, lines]) => {
    const block = div(models, "", {
      html: `<div style="font-size: 42px; line-height: 50px"><span style="color: ${COLORS[color]}">${name}</span>
             <span class="muted" style="font-size: 27px; margin-left: 14px">${reference}</span></div>
             ${lines.map((l) => `<div style="font-size: 33px; margin-top: 6px">${tex(colorize(l))}</div>`).join("")}`,
      style: { marginBottom: "34px" },
    });
    block.style.position = "relative";
    return block;
  });
  tl.addLabel("models");
  tl.to([message, aggregation, note, update, hopNote, ...hopMarks, heading], { opacity: 0, duration: 0.5, ease: "power2.in" }, "models");
  tl.from(modelsHeading, { opacity: 0, y: 24, duration: 0.8 }, "models+=0.3");
  blocks.forEach((block, i) => {
    if (i > 0) pause(tl);
    tl.from(block, { opacity: 0, x: -24, duration: 0.8 }, i ? ">" : "models+=0.6");
  });
  pause(tl);
  return tl;
}
