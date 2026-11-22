import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, FILLS, canvas, div, label, svg, tex, title } from "deck/components.js";
import { bounds, line, theme } from "../helpers.js";
import { EDGES, GROUPS, cite, drawGraph, matrix } from "../methods.js";

const K = 3;
const CARD = { x: 1080, w: 720, h: 178, ys: [252, 450, 648] };
const MATRIX = { x: 840, y: 430, w: 56, h: 38 };
const SUPER_R = 34;

/** Carte d'une étape : sigle à gauche, rôle et formule à droite. */
function card(root, y, short, role, formula) {
  return div(root, "abs", {
    x: CARD.x, y, w: CARD.w, h: CARD.h,
    html: `<div style="display: flex; align-items: center; gap: 30px; height: 100%; padding: 0 34px; box-sizing: border-box">
      <div style="font-size: 54px; font-weight: 600; min-width: 120px">${short}</div>
      <div style="white-space: normal"><div style="font-size: 32px; line-height: 40px">${role}</div>
      <div style="font-size: 30px; margin-top: 10px">${formula}</div></div></div>`,
    style: { border: "2px solid var(--line)", borderRadius: "18px", background: "var(--panel)", boxSizing: "border-box" },
  });
}

/** Le cadre SRC : tout pooling = sélection (S), réduction (X′) et connexion (A′). */
export default function src(root) {
  const heading = title(root, "Le cadre SRC");
  const layer = canvas(root);
  const hullLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const graph = drawGraph(layer, { scale: 205, origin: [430, 585] });
  const { points } = graph;

  // Régions, super-nœuds et arêtes du graphe réduit.
  const members = [0, 1, 2].map((c) => points.map((_, i) => i).filter((i) => GROUPS[i] === c));
  const centers = members.map((ids) => ({ x: ids.reduce((s, i) => s + points[i].x, 0) / ids.length, y: ids.reduce((s, i) => s + points[i].y, 0) / ids.length }));
  const hulls = members.map((ids, c) => {
    const box = bounds(ids.map((i) => points[i]), 44);
    return svg(hullLayer, "ellipse", {
      cx: box.x, cy: box.y, rx: box.w / 2 + 10, ry: box.h / 2 + 6,
      style: `fill: ${FILLS[c]}; stroke: ${COLORS[c]}; stroke-width: 2.5; stroke-dasharray: 9 7`,
    });
  });
  const pairs = [[0, 1], [0, 2], [1, 2]];
  const coarseEdges = pairs.map(([a, b]) => line(coarseLayer, centers[a], centers[b], "stroke: var(--ink)", { "stroke-width": 5, "stroke-opacity": 0.75 }));
  const supers = centers.map(({ x, y }, c) =>
    svg(layer, "circle", { cx: x, cy: y, r: SUPER_R, style: `fill: ${COLORS[c]}; stroke: var(--paper); stroke-width: 4` }),
  );
  gsap.set(supers, { scale: 0, transformOrigin: "50% 50%" });

  // Matrice d'affectation S (8 × 3), ici une affectation dure.
  const S = matrix(root, layer, { x: MATRIX.x, y: MATRIX.y, rows: 8, cols: K, w: MATRIX.w, h: MATRIX.h });
  const sName = label(root, tex(String.raw`S`), MATRIX.x + (K * MATRIX.w) / 2 - 3, MATRIX.y + 8 * MATRIX.h + 34, 36);
  const graphName = label(root, tex(String.raw`\mathcal{G} = (X, A)`), 430, 850, 36);
  const coarseName = label(root, tex(String.raw`\mathcal{G}' = (X', A')`), 430, 850, 36);
  gsap.set(coarseName, { opacity: 0 });

  const cards = [
    card(root, CARD.ys[0], "SEL", "regroupe les <i>N</i> nœuds en <i>K</i> super-nœuds", `${tex(String.raw`S = \mathrm{SEL}(\mathcal{G}) \in \mathbb{R}^{N \times K}`)} <span class="muted" style="font-size: 26px">dure ou souple</span>`),
    card(root, CARD.ys[1], "RED", "calcule les attributs des super-nœuds", `${tex(String.raw`X' = \mathrm{RED}(\mathcal{G}, S)`)} <span class="muted" style="font-size: 26px">ex.</span> ${tex(String.raw`S^\top X`)}`),
    card(root, CARD.ys[2], "CON", "relie les super-nœuds entre eux", `${tex(String.raw`A' = \mathrm{CON}(\mathcal{G}, S)`)} <span class="muted" style="font-size: 26px">ex.</span> ${tex(String.raw`S^\top A S`)}`),
  ];
  const summary = label(root, "Toute méthode de pooling se décrit par un choix de SEL, RED et CON", 960, 905, 34);
  const ref = cite(root, "Grattarola, Zambon, Bianchi, Alippi — <i>Understanding Pooling in Graph Neural Networks</i>, IEEE TNNLS (arXiv:2110.05292)");
  const [blue, lineColor, soft, panel] = ["blue", "line", "blue-soft", "panel"].map(theme);
  const focus = (tl, k, position) =>
    tl.to(cards, {
      borderColor: (i) => (i === k ? blue : lineColor),
      backgroundColor: (i) => (i === k ? soft : panel),
      duration: 0.5, ease: "power2.inOut",
    }, position);

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  // 1. Le graphe d'entrée et la question : comment le réduire ?
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(graph.groups, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, "<0.2");
  tl.from(graph.edges, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(graphName, { opacity: 0, y: 10, duration: 0.6 }, "<0.2");
  tl.from(ref, { opacity: 0, duration: 0.6 }, "<");
  pause(tl);

  // 2. SEL : chaque nœud est affecté à un super-nœud, ligne par ligne dans S.
  tl.addLabel("sel");
  tl.from(cards[0], { opacity: 0, x: 30, duration: 0.7 }, "sel");
  focus(tl, 0, "sel");
  tl.from(hulls, { opacity: 0, scale: 0.8, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.12 }, "sel+=0.3");
  tl.from(S.frame, { opacity: 0, duration: 0.4, stagger: 0.008 }, "sel+=0.4");
  GROUPS.forEach((c, i) => {
    const at = `sel+=${1 + 0.18 * i}`;
    tl.to(graph.groups[i], { scale: 1.2, svgOrigin: `${points[i].x} ${points[i].y}`, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.inOut" }, at);
    tl.to(S.cells[i][c], { attr: { "fill-opacity": 0.85 }, duration: 0.3 }, at);
  });
  tl.from(sName, { opacity: 0, y: 10, duration: 0.5 }, "sel+=1.2");
  pause(tl);

  // 3. RED : les nœuds de chaque région se fondent en un super-nœud (moyenne des attributs).
  tl.addLabel("red");
  tl.from(cards[1], { opacity: 0, x: 30, duration: 0.7 }, "red");
  focus(tl, 1, "red");
  // Les arêtes suivent leurs extrémités, estompées : la connexion reste à décider.
  tl.to(graph.edges, { attr: { "stroke-opacity": 0.3 }, duration: 0.4 }, "red+=0.2");
  points.forEach((p, i) => {
    const c = centers[GROUPS[i]];
    tl.to(graph.groups[i], { x: c.x - p.x, y: c.y - p.y, duration: 1, ease: "power3.inOut" }, "red+=0.4");
  });
  EDGES.forEach(([a, b], e) => {
    const [ca, cb] = [centers[GROUPS[a]], centers[GROUPS[b]]];
    tl.to(graph.edges[e], { attr: { x1: ca.x, y1: ca.y, x2: cb.x, y2: cb.y }, duration: 1, ease: "power3.inOut" }, "red+=0.4");
  });
  tl.to(supers, { scale: 1, duration: 0.6, ease: "back.out(2)", stagger: 0.1 }, "red+=1.3");
  tl.to(graph.groups, { opacity: 0, duration: 0.3 }, "red+=1.4");
  tl.to(hulls, { opacity: 0, duration: 0.6 }, "red+=1.4");
  pause(tl);

  // 4. CON : les arêtes entre régions deviennent les arêtes du graphe réduit.
  tl.addLabel("con");
  tl.from(cards[2], { opacity: 0, x: 30, duration: 0.7 }, "con");
  focus(tl, 2, "con");
  // Chaque arête entre deux régions compte pour 1 dans A′ ; les arêtes internes vont sur la diagonale.
  tl.from(coarseEdges, { attr: { "stroke-width": 0 }, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 }, "con+=0.5");
  tl.to(graph.edges, { opacity: 0, duration: 0.3 }, "con+=0.9");
  tl.to(graphName, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, "con+=1.2");
  tl.fromTo(coarseName, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, "con+=1.5");
  pause(tl);

  // 5. Le cadre général.
  focus(tl, -1, ">");
  tl.from(summary, { opacity: 0, y: 12, duration: 0.7 }, "<0.2");
  tl.to(ref, { color: theme("ink"), duration: 0.6 }, "<0.3");
  pause(tl);
  return tl;
}
