import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, FILLS, canvas, div, label, svg, tex, title } from "deck/components.js";
import { bounds, line, theme } from "../helpers.js";
import { EDGES, GROUPS, SCORES, cite, drawGraph, formula, neighborsOf, stepper, verdict } from "../methods.js";

const LIST = { x: 1060, y: 380, w: 210, h: 52 };
const SUPER_R = 34;
const STEP = 1.3;
const fr = (v) => v.toFixed(2).replace(".", ",");

/** Ensemble indépendant maximal glouton : le meilleur candidat survit, ses voisins sont retirés. */
function mivs() {
  const order = [...SCORES.keys()].sort((a, b) => SCORES[b] - SCORES[a]);
  const candidate = new Set(order);
  const rounds = [];
  for (const v of order) {
    if (!candidate.has(v)) continue;
    const removed = neighborsOf(v).filter((u) => candidate.has(u));
    candidate.delete(v);
    removed.forEach((u) => candidate.delete(u));
    rounds.push({ survivor: v, removed });
  }
  return { order, rounds, survivors: rounds.map((r) => r.survivor) };
}

/** MIVSPool : survivants = ensemble indépendant maximal ; chaque autre nœud rejoint un survivant voisin. */
export default function mivsPool(root) {
  const heading = title(root, "MIVSPool");
  const steps = stepper(root);
  const layer = canvas(root);
  const hullLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const graph = drawGraph(layer, { scale: 200, origin: [500, 600] });
  const { points } = graph;
  const ref = cite(root, "Stanovic, Gaüzère, Brun — <i>Maximal Independent Vertex Set applied to Graph Pooling</i>, S+SSPR 2022");
  const [red, lineColor, panel] = ["red", "line", "panel"].map(theme);

  const { order, rounds, survivors } = mivs();
  // Chaque survivant prend la couleur de sa communauté, comme sur les autres slides.
  const color = (v) => GROUPS[v];
  // Chaque non-survivant rejoint le survivant voisin de plus haut score.
  const owner = SCORES.map((_, v) => (survivors.includes(v) ? v : neighborsOf(v).filter((u) => survivors.includes(u)).sort((a, b) => SCORES[b] - SCORES[a])[0]));

  // Scores près des nœuds et liste triée des candidats.
  const scoreTags = points.map(({ x, y }, i) => label(root, fr(SCORES[i]), x, y - 46, 26, "abs muted"));
  const chips = order.map((v, r) =>
    div(root, "abs", {
      x: LIST.x, y: LIST.y + r * LIST.h, w: LIST.w, h: LIST.h - 10,
      html: `<div style="display: flex; align-items: center; gap: 14px; height: 100%; padding: 0 16px; font-size: 28px">
        <span style="width: 18px; height: 18px; border-radius: 50%; background: ${graph.colors[v]}"></span>
        <b>${v + 1}</b><span style="margin-left: auto">${fr(SCORES[v])}</span></div>`,
      style: { border: `2px solid ${lineColor}`, borderRadius: "10px", background: panel, boxSizing: "border-box" },
    }),
  );
  const strikes = order.map((_, r) => svg(layer, "line", { x1: LIST.x + 10, y1: LIST.y + r * LIST.h + 21, x2: LIST.x + LIST.w - 10, y2: LIST.y + r * LIST.h + 21, style: `stroke: ${red}; stroke-width: 3` }));
  gsap.set(strikes, { scaleX: 0, transformOrigin: "0% 50%" });
  const listName = label(root, "candidats, par score", LIST.x + LIST.w / 2, LIST.y - 34, 28, "abs muted");
  const rules = div(root, "abs", {
    x: 1340, y: 410, w: 470,
    html: `<div style="font-size: 30px; line-height: 44px; white-space: normal">
      <div>1. le meilleur candidat <b>survit</b></div>
      <div>2. ses voisins sont <span class="c-red">retirés</span></div>
      <div>3. on recommence</div></div>`,
  });
  const properties = div(root, "abs", {
    x: 1340, y: 600, w: 470,
    html: `<div style="font-size: 28px; line-height: 38px; white-space: normal">
      <div><b>indépendant</b> : deux survivants ne sont jamais voisins</div>
      <div style="margin-top: 12px"><b>maximal</b> : tout nœud est survivant ou voisin d’un survivant</div></div>`,
  });

  const rings = survivors.map((v) => svg(layer, "circle", { cx: points[v].x, cy: points[v].y, r: 33, style: `fill: none; stroke: ${COLORS[color(v)]}; stroke-width: 6` }));
  const windows = survivors.map((s) => {
    const k = color(s);
    const box = bounds(points.filter((_, v) => owner[v] === s), 46);
    return svg(hullLayer, "ellipse", { cx: box.x, cy: box.y, rx: box.w / 2 + 8, ry: box.h / 2 + 4, style: `fill: ${FILLS[k]}; stroke: ${COLORS[k]}; stroke-width: 2.5; stroke-dasharray: 9 7` });
  });
  const supers = survivors.map((s) => svg(layer, "circle", { cx: points[s].x, cy: points[s].y, r: SUPER_R, style: `fill: ${COLORS[color(s)]}; stroke: var(--paper); stroke-width: 4` }));
  gsap.set(supers, { scale: 0, transformOrigin: "50% 50%" });
  const pairs = [];
  EDGES.forEach(([a, b]) => {
    const [p, q] = [owner[a], owner[b]].sort();
    if (p !== q && !pairs.some(([x, y]) => x === p && y === q)) pairs.push([p, q]);
  });
  const coarseEdges = pairs.map(([p, q]) => line(coarseLayer, points[p], points[q], "stroke: var(--ink)", { "stroke-width": 5, "stroke-opacity": 0.8 }));
  const kNote = label(root, `${tex(`K = ${survivors.length}`)} : fixé par le graphe, pas à l’avance`, 500, 860, 30);
  const connected = label(root, "groupes voisins ⇒ survivants reliés : le graphe réduit reste connexe", 1440, 560, 28);
  connected.style.whiteSpace = "normal";
  connected.style.width = "620px";
  connected.style.textAlign = "center";
  gsap.set([kNote, connected], { opacity: 0 });

  const formulas = [
    formula(root, String.raw`s_i = \mathrm{score}(x_i) \;\; \text{(appris)}`),
    formula(root, String.raw`x'_s = \mathrm{agrégation}\{\, x_v : v \text{ rattaché à } s \,\}`),
    formula(root, String.raw`A'_{st} = 1 \iff \text{une arête relie les groupes de } s \text{ et } t`),
  ];
  gsap.set(formulas, { opacity: 0 });
  const verdicts = verdict(root, "affectation dure, tous contribuent, graphe réduit connexe", "taux de réduction non contrôlé");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const show = (node, position) => tl.fromTo(node, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, position);
  const hide = (node, position) => tl.to(node, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, position);

  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(steps.all, { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, "<0.2");
  tl.from(graph.groups, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, "<0.2");
  tl.from(graph.edges, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(ref, { opacity: 0, duration: 0.6 }, "<");
  pause(tl);

  // SEL (1) : un score par nœud, les candidats sont triés.
  tl.addLabel("score");
  steps.focus(tl, 0, "score");
  show(formulas[0], "score+=0.2");
  tl.from(scoreTags, { opacity: 0, y: 8, duration: 0.5, stagger: 0.05 }, "score+=0.4");
  tl.from(listName, { opacity: 0, duration: 0.5 }, "score+=0.6");
  tl.from(chips, { opacity: 0, x: -20, duration: 0.5, stagger: 0.06 }, "score+=0.7");
  tl.from(rules, { opacity: 0, x: 20, duration: 0.6 }, "score+=1.1");
  pause(tl);

  // SEL (2) : survivants gloutons ; les voisins d'un survivant sont retirés.
  tl.addLabel("mivs");
  rounds.forEach(({ survivor, removed }, r) => {
    const at = (offset) => `mivs+=${r * STEP + offset}`;
    const chip = chips[order.indexOf(survivor)];
    const k = color(survivor);
    tl.to(chip, { borderColor: theme(["blue", "green", "red"][k]), backgroundColor: theme(["blue-soft", "green-fill", "red-fill"][k]), duration: 0.4 }, at(0));
    tl.from(rings[r], { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" }, at(0.1));
    removed.forEach((u) => {
      const row = order.indexOf(u);
      tl.to(strikes[row], { scaleX: 1, duration: 0.4, ease: "power3.out" }, at(0.6));
      tl.to(chips[row], { opacity: 0.35, duration: 0.4 }, at(0.6));
      tl.to(graph.groups[u], { opacity: 0.35, duration: 0.4 }, at(0.6));
      const e = EDGES.findIndex(([a, b]) => (a === survivor && b === u) || (b === survivor && a === u));
      tl.to(graph.edges[e], { attr: { "stroke-width": 6 }, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }, at(0.5));
    });
  });
  tl.to(rules, { opacity: 0, duration: 0.3 }, `mivs+=${rounds.length * STEP}`);
  tl.from(properties, { opacity: 0, x: 20, duration: 0.6 }, `mivs+=${rounds.length * STEP + 0.2}`);
  pause(tl);

  // SEL (3) : chaque nœud retiré rejoint son survivant voisin de plus haut score.
  tl.addLabel("assign");
  tl.to([...chips, ...strikes, listName, properties, ...scoreTags], { opacity: 0, duration: 0.4 }, "assign");
  tl.to(graph.groups, { opacity: 1, duration: 0.4 }, "assign+=0.2");
  SCORES.forEach((_, v) => {
    if (owner[v] === v) return;
    const e = EDGES.findIndex(([a, b]) => (a === v && b === owner[v]) || (b === v && a === owner[v]));
    tl.to(graph.edges[e], { stroke: theme(["blue", "green", "red"][color(owner[v])]), attr: { "stroke-width": 6, "stroke-opacity": 1 }, duration: 0.4 }, `assign+=${0.5 + 0.1 * v}`);
  });
  tl.from(windows, { opacity: 0, scale: 0.85, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.12 }, "assign+=1.3");
  show(kNote, "assign+=1.6");
  pause(tl);

  // RED : les nœuds rattachés se fondent dans leur survivant, qui garde sa place.
  tl.addLabel("red");
  steps.focus(tl, 1, "red");
  hide(formulas[0], "red");
  show(formulas[1], "red+=0.2");
  tl.to(graph.edges, { attr: { "stroke-opacity": 0.3, "stroke-width": 3 }, stroke: theme("ink-soft"), duration: 0.4 }, "red+=0.2");
  points.forEach((p, v) => {
    const s = points[owner[v]];
    tl.to(graph.groups[v], { x: s.x - p.x, y: s.y - p.y, duration: 1, ease: "power3.inOut" }, "red+=0.4");
  });
  EDGES.forEach(([a, b], e) => {
    const [p, q] = [points[owner[a]], points[owner[b]]];
    tl.to(graph.edges[e], { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1, ease: "power3.inOut" }, "red+=0.4");
  });
  tl.to(windows, { opacity: 0, duration: 0.6 }, "red+=0.9");
  tl.to(supers, { scale: 1, duration: 0.6, ease: "back.out(2)", stagger: 0.1 }, "red+=1.3");
  tl.to([...graph.groups, ...rings], { opacity: 0, duration: 0.3 }, "red+=1.4");
  pause(tl);

  // CON : deux survivants sont reliés si leurs groupes se touchent.
  tl.addLabel("con");
  steps.focus(tl, 2, "con");
  hide(formulas[1], "con");
  show(formulas[2], "con+=0.2");
  tl.to(graph.edges, { opacity: 0, duration: 0.3 }, "con+=0.5");
  tl.from(coarseEdges, { attr: { "stroke-width": 0 }, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }, "con+=0.4");
  show(connected, "con+=1");
  pause(tl);

  steps.focus(tl, -1, ">");
  tl.from(verdicts, { opacity: 0, y: 12, duration: 0.6, stagger: 0.15 }, "<0.1");
  pause(tl);
  return tl;
}
