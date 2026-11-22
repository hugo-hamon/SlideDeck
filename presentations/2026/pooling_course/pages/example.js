import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, FILLS, canvas, label, svg, title } from "deck/components.js";
import { BRIDGES, INTERNAL, LINKS, cluster, drawCoarse, drawNetwork, ego, fit, hull, line, network } from "../helpers.js";
import { INTRO_GRAPH } from "./intro.js";

const NET = network(115, [380, 560]);
const START = network(INTRO_GRAPH.scale, INTRO_GRAPH.origin);
const BOX = { x: 960, y: 520, w: 240, h: 260 };
const NEAR = { x: 720, y: 520, w: 170 };
const EXIT = { x: 1085, y: 520 };
const CELL = { w: 24, h: 62, gap: 3 };
const FINE = { x: 1500, y: 430 };
const REDUCED = { x: 1500, y: 680 };
const FINAL = { fine: { x: 488, y: 360 }, reduced: { x: 1432, y: 360 }, egoY: 590, captionY: 800 };
const SUPER_R = 34;

/** Classes de voisinages enracinés (signature simple) : une nuance d'encre par classe. */
function shades() {
  const keys = NET.nodes.map((_, i) => {
    const near = new Set([i]);
    for (const [a, b] of LINKS) if (a === i || b === i) near.add(a === i ? b : a);
    const inside = LINKS.filter(([a, b]) => near.has(a) && near.has(b));
    const degrees = [...near].filter((n) => n !== i).map((n) => inside.filter((e) => e.includes(n)).length).sort();
    return `${near.size}|${inside.length}|${degrees}`;
  });
  const classes = [...new Set(keys)];
  return keys.map((k) => 0.3 + 0.6 * ((0.5 + classes.indexOf(k) * 0.618) % 1));
}

function cells(parent, count, center, colors) {
  const group = svg(parent, "g");
  const width = count * (CELL.w + CELL.gap) - CELL.gap;
  const rects = Array.from({ length: count }, (_, i) =>
    svg(group, "rect", {
      x: center.x - width / 2 + i * (CELL.w + CELL.gap), y: center.y - CELL.h / 2, width: CELL.w, height: CELL.h, rx: 3,
      "fill-opacity": 0,
      style: `fill: ${colors[i]}; stroke: ${colors[i]}; stroke-width: 1.5; stroke-opacity: 0.6`,
    }),
  );
  return { group, rects };
}

const cellCenter = (rect) => ({ x: +rect.getAttribute("x") + CELL.w / 2, y: +rect.getAttribute("y") + CELL.h / 2 });

/** Un voisinage entre dans le GNN, une pastille en sort et remplit la case de son embedding. */
function pass(tl, { packet, box, cell, opacity, token, at, speed = 1, near = true }) {
  const d = (s) => s * speed;
  const nearVars = fit(box, NEAR);
  const inVars = fit(box, { ...BOX, w: NEAR.w * 0.7 });
  tl.from(packet, { opacity: 0, duration: d(0.5), ease: "power2.out" }, at);
  if (near) {
    if (at === undefined) pause(tl);
    tl.to(packet, { ...nearVars, duration: d(0.9), ease: "power3.inOut" }, at === undefined ? ">" : ">-0.1");
    if (at === undefined) pause(tl);
  }
  tl.to(packet, { ...(near ? { x: inVars.x, y: inVars.y, scale: inVars.scale } : inVars), duration: d(0.7), ease: "power3.inOut" }, at === undefined ? ">" : ">-0.1");
  // Une fois dans la boîte, le voisinage disparaît : rien ne s'accumule derrière le GNN.
  tl.to(packet, { opacity: 0, duration: d(0.1) }, ">");
  tl.to(token, { scale: 1, duration: d(0.35), ease: "back.out(2.5)" }, ">-0.05");
  const target = cellCenter(cell);
  tl.to(token, { attr: { cx: target.x, cy: target.y }, duration: d(0.6), ease: "power3.inOut" }, ">-0.05");
  tl.to(cell, { attr: { "fill-opacity": opacity }, duration: d(0.3), ease: "power2.out" }, ">-0.15");
  tl.to(token, { opacity: 0, duration: d(0.2) }, "<");
}

/** Même GNN, deux échelles : voisinages de personnes, puis communautés poolées. */
export default function example(root) {
  const heading = title(root, "Différence de représentation avant et après pooling");
  const layer = canvas(root);
  const hullLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const graphLayer = svg(layer, "g");
  const packets = svg(layer, "g");
  const boxLayer = svg(layer, "g");
  const tokens = svg(layer, "g");
  const outputs = svg(layer, "g");
  const finale = svg(layer, "g");

  const graph = drawNetwork(graphLayer, NET, { r: 12 });
  const hulls = [0, 1, 2].map((c) => hull(hullLayer, NET, c, 30));
  const coarse = drawCoarse(coarseLayer, NET, { r: SUPER_R });

  const box = svg(boxLayer, "g");
  svg(box, "rect", { x: BOX.x - BOX.w / 2, y: BOX.y - BOX.h / 2, width: BOX.w, height: BOX.h, rx: 14, style: "fill: var(--panel); stroke: var(--ink); stroke-width: 3" });
  const boxText = svg(box, "text", { x: BOX.x, y: BOX.y + 4, "text-anchor": "middle", "dominant-baseline": "middle", style: "fill: var(--ink); font: 500 54px var(--serif)" });
  boxText.textContent = "GNN";
  const hint = label(root, "Voisinage à 1 saut", NET.centroids[2].x - 10, 840, 32, "abs muted");

  const fine = cells(outputs, 21, FINE, Array(21).fill("var(--ink)"));
  const fineLabel = label(root, "21 nœuds → 21 embeddings", FINE.x, FINE.y - 72, 32);
  const reduced = cells(outputs, 3, REDUCED, COLORS);
  const reducedLabel = label(root, "3 communautés → 3 embeddings", REDUCED.x, REDUCED.y - 72, 32);
  const caption = label(root, "1 case = l’embedding d’un nœud (schéma)", 960, 960, 28, "abs muted");
  const opacity = shades();

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  // 1. Le graphe de l'accueil glisse à gauche.
  tl.addLabel("move");
  graph.nodes.forEach((node, i) => {
    tl.from(node, { attr: { cx: START.nodes[i].x, cy: START.nodes[i].y }, duration: 1.3, ease: "power3.inOut" }, "move");
  });
  [...INTERNAL, ...BRIDGES].forEach(([a, b], k) => {
    const [p, q] = [START.nodes[a], START.nodes[b]];
    tl.from(graph.edges[k], { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1.3, ease: "power3.inOut" }, "move");
  });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 }, "move+=0.5");
  pause(tl);

  // 2–5. Chaque voisinage à un saut passe dans le GNN ; le premier lentement.
  tl.from(box, { opacity: 0, scale: 0.9, transformOrigin: "50% 50%", duration: 0.6 });
  tl.from([hint, fineLabel, caption], { opacity: 0, y: 12, duration: 0.6, stagger: 0.08 }, "<0.1");
  tl.from(fine.rects, { opacity: 0, duration: 0.3, stagger: 0.02 }, "<0.1");
  NET.nodes.forEach((_, i) => {
    const { group, box: frame } = ego(packets, NET, i);
    const token = svg(tokens, "circle", { cx: EXIT.x, cy: EXIT.y, r: 11, style: "fill: var(--ink)" });
    gsap.set(token, { scale: 0, transformOrigin: "50% 50%" });
    if (i === 0) {
      pass(tl, { packet: group, box: frame, cell: fine.rects[i], opacity: opacity[i], token });
      pause(tl);
      tl.addLabel("rest");
      return;
    }
    const at = `rest+=${(i - 1) * 0.32}`;
    pass(tl, { packet: group, box: frame, cell: fine.rects[i], opacity: opacity[i], token, at, speed: 0.55, near: false });
  });
  pause(tl);

  // 6. Trois communautés apparaissent, de gauche à droite.
  tl.from([0, 2, 1].map((c) => hulls[c]), { scale: 0.7, opacity: 0, transformOrigin: "50% 50%", duration: 0.8, stagger: 0.35 });
  pause(tl);

  // 7. Chaque communauté se contracte en un super-nœud.
  tl.addLabel("collapse");
  graph.nodes.forEach((node, i) => {
    const { x, y } = NET.centroids[NET.nodes[i].c];
    tl.to(node, { attr: { cx: x, cy: y }, duration: 1.1, ease: "power3.inOut" }, `collapse+=${0.012 * i}`);
  });
  graph.internal.forEach((edge, k) => {
    const { x, y } = NET.centroids[NET.nodes[INTERNAL[k][0]].c];
    tl.to(edge, { attr: { x1: x, y1: y, x2: x, y2: y }, duration: 1.1, ease: "power3.inOut" }, "collapse");
  });
  graph.bridges.forEach((edge, k) => {
    const [p, q] = BRIDGES[k].map((n) => NET.centroids[NET.nodes[n].c]);
    tl.to(edge, { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1.1, ease: "power3.inOut" }, "collapse");
  });
  tl.to(hulls, { attr: { r: SUPER_R }, opacity: 0, duration: 1.1, ease: "power3.inOut" }, "collapse");
  tl.from(coarse.supers, { scale: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.8)", stagger: 0.08 }, "collapse+=0.8");
  tl.from(coarse.edges, { opacity: 0, duration: 0.5 }, "collapse+=1");
  tl.to([...graph.nodes, ...graph.edges], { opacity: 0, duration: 0.2 }, "collapse+=1.1");
  pause(tl);

  // 8. Même GNN sur le graphe réduit : chaque super-nœud porte le contenu de sa communauté.
  tl.from(reducedLabel, { opacity: 0, y: 12, duration: 0.5 });
  tl.from(reduced.rects, { opacity: 0, duration: 0.3, stagger: 0.05 }, "<");
  tl.addLabel("coarse");
  [0, 1, 2].forEach((c) => {
    const { group, box: frame } = cluster(packets, NET, c);
    const token = svg(tokens, "circle", { cx: EXIT.x, cy: EXIT.y, r: 13, style: `fill: ${COLORS[c]}` });
    gsap.set(token, { scale: 0, transformOrigin: "50% 50%" });
    const at = `coarse+=${c * 1.1}`;
    const { x, y } = NET.centroids[c];
    tl.from(group, { scale: 0.3, svgOrigin: `${x} ${y}`, duration: 0.6 }, at);
    pass(tl, { packet: group, box: frame, cell: reduced.rects[c], opacity: 0.85, token, at, near: false, speed: 0.9 });
  });
  pause(tl);

  // 9. Deux échelles côte à côte ; le super-nœud bleu révèle son contenu.
  const fineShift = { x: FINAL.fine.x - FINE.x, y: FINAL.fine.y - FINE.y };
  const reducedShift = { x: FINAL.reduced.x - REDUCED.x, y: FINAL.reduced.y - REDUCED.y };
  const fineEgo = ego(finale, NET, 0);
  gsap.set(fineEgo.group, fit(fineEgo.box, { x: FINAL.fine.x, y: FINAL.egoY, h: 230 }));
  const blue = { x: FINAL.reduced.x - 100, y: FINAL.egoY };
  const others = [{ x: FINAL.reduced.x + 190, y: FINAL.egoY - 95 }, { x: FINAL.reduced.x + 190, y: FINAL.egoY + 95 }];
  const ZOOM_R = 112;
  // Point du bord du cercle zoomé, dans la direction de p.
  const toward = (p, r) => {
    const d = Math.hypot(p.x - blue.x, p.y - blue.y);
    return { x1: blue.x + ((p.x - blue.x) * r) / d, y1: blue.y + ((p.y - blue.y) * r) / d };
  };
  const linkStyle = "stroke: var(--ink-soft); stroke-width: 3";
  const egoLinks = [...others.map((p) => line(finale, blue, p, linkStyle)), line(finale, others[0], others[1], linkStyle)];
  const halo = svg(finale, "circle", { cx: blue.x, cy: blue.y, r: 22, style: `fill: ${FILLS[0]}; stroke: ${COLORS[0]}; stroke-width: 3` });
  const dot = svg(finale, "circle", { cx: blue.x, cy: blue.y, r: 22, style: `fill: ${COLORS[0]}; stroke: var(--paper); stroke-width: 3` });
  others.forEach((p, k) => svg(finale, "circle", { cx: p.x, cy: p.y, r: 22, style: `fill: ${COLORS[k + 1]}; stroke: var(--paper); stroke-width: 3` }));
  const inside = cluster(finale, NET, 0);
  gsap.set(inside.group, fit(inside.box, { x: blue.x, y: blue.y, w: 150 }));
  const [fineCell, reducedCell] = [cellCenter(fine.rects[0]), cellCenter(reduced.rects[0])];
  const highlight = (center, shift) =>
    svg(finale, "rect", {
      x: center.x + shift.x - CELL.w / 2 - 6, y: center.y + shift.y - CELL.h / 2 - 6, width: CELL.w + 12, height: CELL.h + 12, rx: 6,
      style: "fill: none; stroke: var(--ink); stroke-width: 3",
    });
  const highlights = [highlight(fineCell, fineShift), highlight(reducedCell, reducedShift)];
  const captions = [
    label(root, "Relations entre personnes", FINAL.fine.x, FINAL.captionY, 36),
    label(root, "Relations entre communautés", FINAL.reduced.x, FINAL.captionY, 36),
  ];

  tl.addLabel("final");
  tl.to([coarseLayer, box, hint], { opacity: 0, duration: 0.4, ease: "power2.in" }, "final");
  tl.to(fine.group, { ...fineShift, duration: 1, ease: "power3.inOut" }, "final+=0.2");
  tl.to(reduced.group, { ...reducedShift, duration: 1, ease: "power3.inOut" }, "<");
  tl.to(fineLabel, { x: fineShift.x, y: fineShift.y - 4, duration: 1, ease: "power3.inOut" }, "<");
  tl.to(reducedLabel, { x: reducedShift.x, y: reducedShift.y - 4, duration: 1, ease: "power3.inOut" }, "<");
  tl.from(finale, { opacity: 0, duration: 0.6 }, ">-0.2");
  tl.from(highlights, { opacity: 0, scale: 1.4, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.1 }, "<");
  tl.from(captions, { opacity: 0, y: 12, duration: 0.6, stagger: 0.1 }, "<0.1");
  tl.addLabel("zoom", ">0.2");
  tl.to(halo, { attr: { r: ZOOM_R }, duration: 1.1, ease: "power3.inOut" }, "zoom");
  tl.to(dot, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "power2.in" }, "zoom");
  egoLinks.slice(0, 2).forEach((link, k) => {
    const end = toward(others[k], ZOOM_R + 4);
    tl.to(link, { attr: end, duration: 1.1, ease: "power3.inOut" }, "zoom");
  });
  tl.from(inside.group, { opacity: 0, duration: 0.6 }, "zoom+=0.5");
  pause(tl);
  return tl;
}
