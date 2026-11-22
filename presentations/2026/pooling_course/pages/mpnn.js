import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { arrow, canvas, div, growArrow, label, svg, tex, title } from "deck/components.js";
import { MPNN_EDGES, embeddingColors, mix, mpnnGraph, theme } from "../helpers.js";

const POINTS = mpnnGraph(150, [330, 545]);
export const BOX = { x: 790, y: 545, w: 256, h: 270 };
const OUT_X = 1284;
const LABEL_X = 1470;
const CELL = 30;
const GAP = 4;
const ROWS = { nodes: 280, readout: 372, graph: 462, edges: 770 };
const ZOOM = 20; // assez pour que le contour de la boîte sorte du cadre avant la fin du zoom

function graphShape(parent, colors, r = 16) {
  const group = svg(parent, "g");
  const edges = MPNN_EDGES.map(([a, b]) =>
    svg(group, "line", { x1: POINTS[a].x, y1: POINTS[a].y, x2: POINTS[b].x, y2: POINTS[b].y, style: "stroke: var(--ink-soft); stroke-width: 2.5" }),
  );
  const nodes = POINTS.map(({ x, y }, i) => svg(group, "circle", { cx: x, cy: y, r, style: `fill: ${colors[i]}; stroke: var(--paper); stroke-width: 3` }));
  return { group, edges, nodes };
}

const square = (parent, x, y, color, side = CELL, faint = false) =>
  svg(parent, "rect", {
    x: x - side / 2, y: y - side / 2, width: side, height: side, rx: 3, "fill-opacity": 0,
    style: `fill: ${color}; stroke: ${color}; stroke-width: 1.5; stroke-opacity: ${faint ? 0.35 : 0.9}`,
  });

/** Nom d'une sortie et tâche typique associée, alignés à gauche. */
function outputLabel(root, name, task, y) {
  return div(root, "abs", {
    x: LABEL_X, y: y - 40,
    html: `<div style="font-size: 40px; line-height: 44px">${name}</div><div class="muted" style="font-size: 28px">${task}</div>`,
  });
}

/**
 * Construit la vue d'ensemble. `done` : état final de la slide 07 (cases remplies, readout
 * visible), point de départ du zoom au début de la slide 08.
 */
export function buildMacro(root, { done = false } = {}) {
  const colors = embeddingColors(8);
  const heading = title(root, "Rappel : MPNN");
  const layer = canvas(root);
  // Deux groupes : `camera` se recentre sur la boîte, `world` s'agrandit autour d'elle.
  const camera = svg(layer, "g");
  const world = svg(camera, "g");
  const graph = graphShape(world, colors);
  const packet = graphShape(world, colors);
  gsap.set(packet.group, { opacity: 0 });

  const box = svg(world, "rect", {
    x: BOX.x - BOX.w / 2, y: BOX.y - BOX.h / 2, width: BOX.w, height: BOX.h, rx: 14,
    // Couleur résolue : GSAP peut ensuite la faire glisser vers celle du fond pendant le zoom.
    style: `fill: ${theme("panel")}; stroke: var(--ink); stroke-width: 3; vector-effect: non-scaling-stroke`,
  });
  const boxText = label(root, "MPNN", BOX.x, BOX.y, 56);

  const rowX = (i) => OUT_X + (i - 3.5) * (CELL + GAP);
  const rowY = (i) => ROWS.edges + (i - 3.5) * (CELL + GAP);
  const nodeCells = colors.map((c, i) => square(world, rowX(i), ROWS.nodes, c));
  const link = arrow(world, BOX.x + 60, BOX.y - BOX.h / 2 - 8, rowX(0) - CELL, ROWS.nodes + 8);
  const nodeText = outputLabel(root, "Nœuds", "classification de nœuds", ROWS.nodes);

  const linked = (i, j) => MPNN_EDGES.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
  const matrix = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      matrix.push(square(world, rowX(j), rowY(i), linked(i, j) ? mix([colors[i], colors[j]]) : "var(--ink-soft)", CELL, !linked(i, j)));
    }
  }
  const matrixTop = ROWS.edges - 4 * (CELL + GAP);
  const rowCopies = colors.map((c, i) => square(world, rowX(0) - CELL - GAP - 10, rowY(i), c));
  const colCopies = colors.map((c, i) => square(world, rowX(i), matrixTop - CELL / 2 - 10, c));
  [...rowCopies, ...colCopies].forEach((cell) => cell.setAttribute("fill-opacity", 0.9));
  const edgeText = outputLabel(root, "Arêtes", "prédiction de liens", ROWS.edges);

  const graphCell = square(world, OUT_X, ROWS.graph, mix(colors), 54);
  graphCell.setAttribute("style", `fill: ${mix(colors)}; stroke: var(--ink); stroke-width: 2.5`);
  graphCell.setAttribute("fill-opacity", 0.9);
  const readout = label(root, tex(String.raw`h_G = \bigoplus_{i \in V} h_i`), OUT_X, ROWS.readout, 34);
  const readoutName = label(root, "readout", OUT_X - 200, ROWS.readout, 28, "abs muted");
  const graphText = outputLabel(root, "Graphe", "classification de graphes", ROWS.graph);

  // Paires (ligne, colonne) reliées, dans l'ordre de lecture de la matrice.
  const pairs = [];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (linked(i, j)) pairs.push([i, j]);

  if (done) {
    [...nodeCells, ...pairs.map(([i, j]) => matrix[8 * i + j])].forEach((cell) => cell.setAttribute("fill-opacity", 0.9));
  }
  return {
    colors, heading, camera, world, graph, packet, box, boxText, nodeCells, link, nodeText, matrix, matrixTop,
    rowCopies, colCopies, edgeText, graphCell, readout, readoutName, graphText, pairs, rowX, rowY,
    texts: [heading, nodeText, edgeText, graphText, readout, readoutName],
  };
}

/** Zoom : la caméra entre dans la boîte ; le nom « MPNN » garde sa taille et s'efface. */
export function zoomIn(tl, { camera, world, box, boxText, texts }, position) {
  tl.addLabel("zoom", position);
  tl.to(texts, { opacity: 0, duration: 0.4, ease: "power2.in" }, "zoom");
  tl.to(boxText, { opacity: 0, duration: 0.5, ease: "power2.in" }, "zoom");
  // La boîte se recentre vite, puis l'agrandissement accélère : ses bords sortent du cadre avant la fin.
  tl.to(camera, { x: 960 - BOX.x, y: 540 - BOX.y, duration: 1.2, ease: "power2.inOut" }, "zoom");
  tl.to(world, { scale: ZOOM, svgOrigin: `${BOX.x} ${BOX.y}`, duration: 1.6, ease: "power3.in" }, "zoom");
  tl.to(box, { fill: theme("paper"), duration: 1.4, ease: "power2.inOut" }, "zoom+=0.1");
  // Le contour reste visible : il sort du cadre de lui-même à la fin de l'agrandissement.
  // Hors cadre après l'agrandissement : on masque chaque élément pour l'inspection.
  tl.to([camera, ...camera.querySelectorAll("*")], { opacity: 0, duration: 0.05 }, ">");
  return tl;
}

/** Le MPNN comme une boîte : embeddings de nœuds, d'arêtes, puis de graphe. */
export default function mpnn(root) {
  const m = buildMacro(root);
  const { graph, packet, box, boxText, nodeCells, link, nodeText, matrix, rowCopies, colCopies, edgeText, rowX, rowY } = m;
  const ghosts = svg(m.world, "g");
  const pooled = m.colors.map((c, i) => square(m.world, rowX(i), ROWS.nodes, c));
  pooled.forEach((cell) => cell.setAttribute("fill-opacity", 0.9));
  gsap.set(pooled, { opacity: 0 });
  // Les copies ligne / colonne n'existent qu'à partir de l'étape des arêtes.
  gsap.set([...rowCopies, ...colCopies], { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(m.heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(graph.nodes, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.2)", stagger: 0.04 }, "<0.2");
  tl.from(graph.edges, { opacity: 0, duration: 0.6 }, "<0.2");
  tl.from([box, boxText], { opacity: 0, scale: 0.9, transformOrigin: "50% 50%", duration: 0.6 }, "<0.2");
  pause(tl);

  // Le graphe entre dans la boîte, qui rend un embedding par nœud.
  tl.fromTo(packet.group, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false });
  tl.to(packet.group, { x: BOX.x - 330, y: 0, scale: 0.42, svgOrigin: "330 545", duration: 1.1, ease: "power3.inOut" }, "<");
  tl.to(packet.group, { opacity: 0, duration: 0.1 }, ">");
  growArrow(tl, link, { duration: 0.6 }, ">-0.1");
  tl.from(nodeCells, { opacity: 0, duration: 0.3, stagger: 0.03 }, "<0.2");
  tl.from(nodeText, { opacity: 0, x: -16, duration: 0.6 }, "<");
  nodeCells.forEach((cell, i) => {
    const at = `>${i === 0 ? 0 : -0.25}`;
    tl.to(cell, { attr: { "fill-opacity": 0.9 }, duration: 0.35, ease: "power2.out" }, at);
    tl.to(graph.nodes[i], { scale: 1.6, transformOrigin: "50% 50%", duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }, "<");
  });
  pause(tl);

  // Les embeddings se recopient en tête de lignes et de colonnes, puis chaque arête (i, j)
  // combine la case de la ligne i et celle de la colonne j.
  tl.fromTo([...rowCopies, ...colCopies], { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false });
  tl.from(rowCopies, { x: (i) => rowX(i) - rowX(0) + CELL + GAP + 10, y: (i) => ROWS.nodes - rowY(i), duration: 1, ease: "power3.inOut" }, "<");
  tl.from(colCopies, { y: ROWS.nodes - m.matrixTop + CELL / 2 + 10, duration: 1, ease: "power3.inOut" }, "<");
  tl.from(matrix, { opacity: 0, duration: 0.5 }, "<0.6");
  tl.from(edgeText, { opacity: 0, x: -16, duration: 0.6 }, "<");
  tl.addLabel("pairs", ">");
  m.pairs.forEach(([i, j], k) => {
    const at = `pairs+=${k * 0.24}`;
    const cell = matrix[8 * i + j];
    const target = { x: rowX(j), y: rowY(i) };
    const fromRow = { x: rowX(0) - CELL - GAP - 10, y: rowY(i) };
    const fromCol = { x: rowX(j), y: m.matrixTop - CELL / 2 - 10 };
    const pieces = [[fromRow, m.colors[i]], [fromCol, m.colors[j]]].map(([p, c]) => {
      const piece = square(ghosts, p.x, p.y, c, CELL * 0.8);
      piece.setAttribute("fill-opacity", 0.9);
      gsap.set(piece, { opacity: 0 });
      return { piece, p };
    });
    const edge = MPNN_EDGES.findIndex(([a, b]) => (a === i && b === j) || (a === j && b === i));
    tl.to([rowCopies[i], colCopies[j]], { scale: 1.3, transformOrigin: "50% 50%", duration: 0.15, yoyo: true, repeat: 1, ease: "power2.inOut" }, at);
    tl.to(graph.edges[edge], { attr: { "stroke-width": 6 }, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }, at);
    pieces.forEach(({ piece, p }) => {
      tl.fromTo(piece, { opacity: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, at);
      tl.to(piece, { x: target.x - p.x, y: target.y - p.y, duration: 0.45, ease: "power3.inOut" }, at);
      tl.to(piece, { opacity: 0, duration: 0.12 }, `${at}+=0.42`);
    });
    tl.to(cell, { attr: { "fill-opacity": 0.9 }, duration: 0.2, ease: "power2.out" }, `${at}+=0.4`);
  });
  pause(tl);

  // Readout : tous les embeddings de nœuds s'agrègent en un seul.
  tl.from([m.readout, m.readoutName], { opacity: 0, y: 12, duration: 0.7, stagger: 0.1 });
  tl.from(m.graphText, { opacity: 0, x: -16, duration: 0.6 }, "<0.1");
  tl.fromTo(pooled, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, ">");
  tl.to(pooled, { x: (i) => OUT_X - rowX(i), y: ROWS.graph - ROWS.nodes, duration: 1, ease: "power3.inOut", stagger: 0.04 }, "<");
  tl.to(pooled, { opacity: 0, duration: 0.2 }, ">-0.15");
  tl.from(m.graphCell, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" }, "<");
  pause(tl);
  return tl;
}
