import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { FILLS, canvas, label, svg, tex, title } from "deck/components.js";
import { flash, hops, line, swap, theme, versus } from "../helpers.js";

/* Chaîne de 4 communautés en losange : e (entrée), t, b, o (sortie). s = e₀ à gauche, t = o₃ à droite. */
const CLUSTERS = 4;
const LINKS = [];
for (let c = 0; c < CLUSTERS; c++) {
  const [e, t, b, o] = [0, 1, 2, 3].map((k) => 4 * c + k);
  LINKS.push([e, t], [e, b], [t, o], [b, o], [t, b]);
  if (c < CLUSTERS - 1) LINKS.push([o, 4 * (c + 1)]);
}
const COARSE_LINKS = [[0, 1], [1, 2], [2, 3]];
const S = 0;
const U = 4 * CLUSTERS - 1;
const LAYERS = 3;
const NODE_R = 14;
const SUPER_R = 30;

function layout(panel) {
  const y = panel.y + 300;
  const left = (c) => panel.x + 68 + c * 193;
  const nodes = [];
  for (let c = 0; c < CLUSTERS; c++) {
    const x0 = left(c);
    nodes.push({ x: x0, y, c }, { x: x0 + 60, y: y - 78, c }, { x: x0 + 60, y: y + 78, c }, { x: x0 + 120, y, c });
  }
  const supers = Array.from({ length: CLUSTERS }, (_, c) => ({ x: left(c) + 60, y }));
  return { nodes, supers, y };
}

/** Graphe fin : arêtes, halos de portée (cachés), nœuds. */
function drawChain(layer, { nodes }) {
  const halos = svg(layer, "g");
  const edgeLayer = svg(layer, "g");
  const edges = LINKS.map(([a, b]) => line(edgeLayer, nodes[a], nodes[b], `stroke: ${theme("ink-soft")}`, { "stroke-width": 2.5, "stroke-opacity": 0.7 }));
  const halo = nodes.map(({ x, y }) => svg(halos, "circle", { cx: x, cy: y, r: NODE_R + 11, style: `fill: ${FILLS[0]}` }));
  const dots = nodes.map(({ x, y }) => svg(layer, "circle", { cx: x, cy: y, r: NODE_R, style: `fill: ${theme("ink-soft")}; stroke: var(--paper); stroke-width: 3` }));
  return { edges, halo, dots };
}

/** Règle de mesure sous le graphe, avec la distance en sauts. */
function ruler(root, layer, a, b, y, html) {
  const group = svg(layer, "g");
  const style = "stroke: var(--ink); stroke-width: 2";
  svg(group, "line", { x1: a, y1: y, x2: b, y2: y, style });
  svg(group, "line", { x1: a, y1: y - 10, x2: a, y2: y + 10, style });
  svg(group, "line", { x1: b, y1: y - 10, x2: b, y2: y + 10, style });
  return { group, text: label(root, html, (a + b) / 2, y + 40, 36) };
}

/** Under-reaching : avec K couches, s ne voit que K sauts ; le graphe réduit raccourcit les distances. */
export default function underreach(root) {
  const heading = title(root, "Under-reaching");
  const panels = versus(root, [["MPNN", "graphe d’origine"], ["MPNN + pooling", "graphe réduit"]]);
  const layer = canvas(root);
  const [blue, red, green, ink] = ["blue", "red", "green", "ink-soft"].map(theme);

  const geo = panels.map(layout);
  const hullLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const graphs = geo.map((g) => drawChain(layer, g));
  const flashes = svg(layer, "g");

  // Graphe réduit du panneau droit : quatre super-nœuds en chaîne.
  const right = geo[1];
  const hulls = right.supers.map(({ x, y }) =>
    svg(hullLayer, "ellipse", { cx: x, cy: y, rx: 96, ry: 112, style: `fill: ${FILLS[0]}; fill-opacity: 0.4; stroke: var(--ink-soft); stroke-width: 2; stroke-dasharray: 8 6` }),
  );
  const coarseHalo = right.supers.map(({ x, y }) => svg(coarseLayer, "circle", { cx: x, cy: y, r: SUPER_R + 13, style: `fill: ${FILLS[0]}` }));
  const coarseEdges = COARSE_LINKS.map(([a, b]) => line(coarseLayer, right.supers[a], right.supers[b], `stroke: ${ink}`, { "stroke-width": 4, "stroke-opacity": 1 }));
  const supers = right.supers.map(({ x, y }) => svg(coarseLayer, "circle", { cx: x, cy: y, r: SUPER_R, style: `fill: ${ink}; stroke: var(--paper); stroke-width: 4` }));

  // s et u : anneaux et étiquettes, sur les deux panneaux.
  const marks = geo.map(({ nodes }) => ({
    sRing: svg(layer, "circle", { cx: nodes[S].x, cy: nodes[S].y, r: 22, style: `fill: none; stroke: ${red}; stroke-width: 3.5` }),
    uRing: svg(layer, "circle", { cx: nodes[U].x, cy: nodes[U].y, r: 22, style: `fill: none; stroke: ${blue}; stroke-width: 3.5` }),
    sName: label(root, tex("s"), nodes[S].x, nodes[S].y - 50, 44, "abs c-red"),
    uName: label(root, tex("t"), nodes[U].x, nodes[U].y - 48, 44, "abs c-blue"),
  }));
  const legend = label(root, `${tex(String.raw`\htmlClass{c-blue}{t}`)} : nœud mis à jour · sa portée s’étend d’un saut par couche · ${tex(String.raw`\htmlClass{c-red}{s}`)} : source à atteindre`, 960, 188, 30, "abs muted");

  const fineDist = hops(4 * CLUSTERS, LINKS, U);
  const coarseDist = hops(CLUSTERS, COARSE_LINKS, CLUSTERS - 1);
  const rulerY = right.y + 175;
  const rulers = [
    ruler(root, layer, geo[0].nodes[S].x, geo[0].nodes[U].x, rulerY, `${tex("d(s, t) = " + fineDist[S])} sauts`),
    ruler(root, layer, right.supers[0].x, right.supers[3].x, rulerY, `${tex("d = " + coarseDist[0])} sauts`),
  ];
  const kTags = panels.map((p) => [0, 1, 2, 3].map((k) => label(root, tex(`K = ${k}`), p.x + p.w - 100, p.y + 58, 44)));
  const outcomes = [
    label(root, `<span class="c-red">✗</span> après ${tex("K = 3")} : ${tex("s")} est hors de portée de ${tex("t")}. Il faudrait 11 couches <br>de message passing afin de propager l'information`, panels[0].cx, 860, 32),
    label(root, `<span class="c-green">✓</span> ${tex("s")} atteint en 3 couches`, panels[1].cx, 860, 32),
  ];

  const pop = { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" };
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  gsap.set([...graphs.flatMap((g) => g.halo), ...coarseHalo], { scale: 0, transformOrigin: "50% 50%" });
  gsap.set(coarseLayer, { opacity: 0 });

  // 1. Deux copies du même graphe en chaîne ; s et u aux extrémités.
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(panels.map((p) => p.frame), { opacity: 0, scale: 0.98, duration: 0.7, stagger: 0.1 }, "<0.1");
  tl.from(panels.map((p) => p.head), { opacity: 0, x: -16, duration: 0.6, stagger: 0.1 }, "<0.2");
  tl.from(graphs.flatMap((g) => g.dots), { ...pop, stagger: 0.015 }, "<0.2");
  tl.from(graphs.flatMap((g) => g.edges), { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(marks.flatMap((m) => [m.sRing, m.uRing]), { ...pop, stagger: 0.05 }, ">-0.2");
  tl.from([...marks.flatMap((m) => [m.sName, m.uName]), legend, ...kTags.map((t) => t[0])], { opacity: 0, y: 10, duration: 0.5, stagger: 0.04 }, "<0.1");
  pause(tl);

  // 2. Mesure des distances ; à droite, chaque communauté devient un super-nœud.
  tl.addLabel("pool");
  tl.from(rulers[0].group, { opacity: 0, scaleX: 0, transformOrigin: "100% 50%", duration: 0.8, ease: "power3.inOut" }, "pool");
  tl.from(rulers[0].text, { opacity: 0, y: 10, duration: 0.6 }, "pool+=0.5");
  tl.from(hulls, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.1 }, "pool");
  const fine = graphs[1];
  right.nodes.forEach((node, i) => {
    const target = right.supers[node.c];
    tl.to(fine.dots[i], { attr: { cx: target.x, cy: target.y }, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  });
  LINKS.forEach(([a, b], k) => {
    const [p, q] = [right.supers[right.nodes[a].c], right.supers[right.nodes[b].c]];
    tl.to(fine.edges[k], { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  });
  tl.to(marks[1].sRing, { attr: { cx: right.supers[0].x, r: SUPER_R + 9 }, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  tl.to(marks[1].uRing, { attr: { cx: right.supers[3].x, r: SUPER_R + 9 }, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  tl.to(marks[1].sName, { x: right.supers[0].x - right.nodes[S].x, y: -20, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  tl.to(marks[1].uName, { x: right.supers[3].x - right.nodes[U].x, y: -20, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  tl.to(hulls, { attr: { rx: SUPER_R, ry: SUPER_R }, opacity: 0, duration: 1, ease: "power3.inOut" }, "pool+=0.7");
  tl.fromTo(coarseLayer, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, "pool+=1.45");
  tl.to([...fine.dots, ...fine.edges], { opacity: 0, duration: 0.3 }, "<");
  tl.from(rulers[1].group, { opacity: 0, scaleX: 0, transformOrigin: "100% 50%", duration: 0.8, ease: "power3.inOut" }, "pool+=1.6");
  tl.from(rulers[1].text, { opacity: 0, y: 10, duration: 0.6 }, "pool+=2.1");
  pause(tl);

  // 3–5. Chaque couche élargit la portée d'un saut, sur les deux graphes en même temps.
  const sides = [
    { dist: fineDist, links: LINKS, points: geo[0].nodes, halo: graphs[0].halo, dots: graphs[0].dots, edges: graphs[0].edges },
    { dist: coarseDist, links: COARSE_LINKS, points: right.supers, halo: coarseHalo, dots: supers, edges: coarseEdges },
  ];
  for (let k = 1; k <= LAYERS; k++) {
    tl.addLabel(`k${k}`);
    if (k === 1) {
      // La couche 0 : t lui-même.
      sides.forEach(({ halo, dots }, i) => {
        const first = i === 0 ? U : CLUSTERS - 1;
        tl.to(halo[first], { scale: 1, duration: 0.5, ease: "back.out(2)" }, "k1");
        tl.to(dots[first], { fill: blue, duration: 0.4 }, "k1");
      });
    }
    panels.forEach((_, i) => swap(tl, kTags[i][k - 1], kTags[i][k], `k${k}`));
    sides.forEach(({ dist, links, points, halo, dots, edges }) => {
      links.forEach(([a, b], e) => {
        const [near, far] = dist[a] < dist[b] ? [a, b] : [b, a];
        if (dist[far] !== k || dist[near] !== k - 1) return;
        // La portée de t avance : le trait part du nœud déjà atteint.
        flash(flashes, points[near], points[far], blue, tl, `k${k}+=0.2`, 0.7);
        tl.to(edges[e], { stroke: blue, attr: { "stroke-opacity": 1 }, duration: 0.4 }, `k${k}+=0.6`);
      });
      dist.forEach((d, i) => {
        if (d !== k) return;
        tl.to(halo[i], { scale: 1, duration: 0.5, ease: "back.out(2)" }, `k${k}+=0.75`);
        tl.to(dots[i], { fill: blue, duration: 0.4 }, "<");
      });
    });
    if (k < LAYERS) pause(tl);
  }
  tl.to(marks[1].sRing, { stroke: green, attr: { "stroke-width": 5 }, duration: 0.5 }, `k${LAYERS}+=1.1`);
  tl.to(marks[0].sRing, { scale: 1.25, transformOrigin: "50% 50%", duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut" }, "<");
  tl.from(outcomes, { opacity: 0, y: 12, duration: 0.6, stagger: 0.15 }, "<0.2");
  pause(tl);
  return tl;
}
