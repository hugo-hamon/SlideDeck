import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, FILLS, arrow, badge, block, canvas, div, growArrow, label, svg, tex, title } from "deck/components.js";

const MID_Y = 520;
const DX = 60;
const DY = -48;
const W = 50;
const BLOCKS = [
  { x: 430, h: 300, dims: "N \\times d", name: "GNN", stage: 1 },
  { x: 610, h: 300, dims: "N \\times d", name: "GNN", stage: 1 },
  { x: 830, h: 150, dims: "K \\times d", name: "Pooling", stage: 2 },
  { x: 1010, h: 150, dims: "K \\times d", name: "GNN", stage: 1 },
  { x: 1210, h: 46, dims: "1 \\times d", name: "Readout", stage: 3 },
];
const GRAPH = {
  center: [255, MID_Y],
  points: [[-60, -40], [0, -75], [62, -35], [55, 45], [-5, 78], [-65, 38], [0, 0]],
  edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [6, 0], [6, 2], [6, 4]],
};
const CARD = { x: 1400, y: 395, w: 330, h: 255 };
const PROBABILITIES = [0.3, 0.85, 0.42];
const LEGEND = ["Message passing", "Pooling", "Readout", "Prédiction"];

/** Architecture panel in the style of a paper figure, built from left to right. */
export default function architecture(root) {
  const panel = div(root, "panel", { x: 100, y: 150, w: 1720, h: 830 });
  const heading = title(root, "Architecture d’un GNN avec pooling", 175);
  const layer = canvas(root);

  const graph = svg(layer, "g");
  const [gx, gy] = GRAPH.center;
  for (const [a, b] of GRAPH.edges) {
    const [p, q] = [GRAPH.points[a], GRAPH.points[b]];
    svg(graph, "line", { x1: gx + p[0], y1: gy + p[1], x2: gx + q[0], y2: gy + q[1], style: "stroke: var(--blue); stroke-width: 2.5; stroke-opacity: 0.6" });
  }
  const graphNodes = GRAPH.points.map(([x, y]) =>
    svg(graph, "circle", { cx: gx + x, cy: gy + y, r: 11, style: "fill: var(--blue); stroke: var(--panel); stroke-width: 3" }),
  );
  const graphCaption = label(root, "Graphe d’entrée", gx, MID_Y + 135, 28);

  const blocks = BLOCKS.map((spec, i) => {
    const shape = block(layer, { x: spec.x, y: MID_Y, w: W, h: spec.h, dx: DX, dy: DY });
    const centerX = spec.x + (W + DX) / 2;
    const tag = badge(layer, spec.x + W / 2 + DX / 2, MID_Y - spec.h / 2 + DY / 2, spec.stage, 17);
    const caption = label(root, `${tex(spec.dims)}<div>${spec.name}</div>`, centerX, MID_Y + spec.h / 2 + 52, 28);
    caption.style.textAlign = "center";
    const previousRight = i === 0 ? gx + 95 : BLOCKS[i - 1].x + W + DX + 8;
    const link = arrow(layer, previousRight, MID_Y, spec.x - 10, MID_Y);
    return { shape, tag, caption, link };
  });

  const card = div(root, "card", { x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h });
  const output = svg(layer, "g");
  const base = CARD.y + 175;
  const left = CARD.x + 45;
  svg(output, "path", {
    d: `M${left},${CARD.y + 30} L${left},${base} L${CARD.x + CARD.w - 30},${base}`,
    "marker-start": "url(#arrow-head)",
    "marker-end": "url(#arrow-head)",
    style: "fill: none; stroke: var(--ink); stroke-width: 2.5",
  });
  const bars = PROBABILITIES.map((p, c) =>
    svg(output, "rect", {
      x: left + 30 + c * 80, y: base - p * 130, width: 52, height: p * 130, rx: 4,
      style: `fill: ${COLORS[c]}; fill-opacity: 0.35; stroke: ${COLORS[c]}; stroke-width: 2`,
    }),
  );
  const outputLink = arrow(layer, BLOCKS.at(-1).x + W + DX + 8, MID_Y, CARD.x - 12, MID_Y);
  const cardCaption = label(root, tex(String.raw`p(y \mid G)`), CARD.x + CARD.w / 2, CARD.y + 215, 32);
  const cardTag = badge(layer, CARD.x + CARD.w, CARD.y, 4, 17);

  const rule = svg(layer, "line", { x1: 300, y1: 860, x2: 1620, y2: 860, style: "stroke: var(--line); stroke-width: 2" });
  const legend = LEGEND.map((name, i) => {
    const x = 400 + i * 330;
    const item = badge(layer, x, 912, i + 1, 17);
    const text = label(root, name, x + 32, 912, 30);
    gsap.set(text, { xPercent: 0 });
    return [item, text];
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(panel, { opacity: 0, scale: 0.98, duration: 0.8, ease: "power3.out" });
  tl.from(heading, { opacity: 0, y: 20, duration: 0.8 }, "<0.15");
  tl.from(graph, { opacity: 0, duration: 0.5 }, "<0.3");
  tl.from(graphNodes, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.2)", stagger: 0.05 }, "<");
  tl.from(graphCaption, { opacity: 0, y: 10, duration: 0.6 }, "<0.3");
  drawRule(tl, rule);
  pause(tl);

  revealBlocks(tl, blocks.slice(0, 2));
  tl.from(legend[0], { opacity: 0, x: -16, duration: 0.6 }, "<");
  pause(tl);

  squash(tl, blocks[1], blocks[2], BLOCKS[1], BLOCKS[2], layer);
  revealBlocks(tl, blocks.slice(3, 4), ">-0.1");
  tl.from(legend[1], { opacity: 0, x: -16, duration: 0.6 }, "<");
  pause(tl);

  squash(tl, blocks[3], blocks[4], BLOCKS[3], BLOCKS[4], layer);
  growArrow(tl, outputLink, {}, ">-0.1");
  tl.from(card, { opacity: 0, y: 20, duration: 0.6 }, "<0.1");
  tl.from([output, cardTag], { opacity: 0, duration: 0.4 }, "<0.1");
  tl.from(bars, { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, stagger: 0.1 }, "<0.1");
  tl.from(cardCaption, { opacity: 0, duration: 0.5 }, "<0.2");
  tl.from([...legend[2], ...legend[3]], { opacity: 0, x: -16, duration: 0.6, stagger: 0.1 }, "<");
  pause(tl);
  return tl;
}

function drawRule(tl, rule) {
  tl.from(rule, { attr: { x2: 300 }, duration: 0.8, ease: "power2.inOut" }, "<");
}

function revealBlocks(tl, items, position = ">") {
  items.forEach(({ shape, tag, caption, link }, i) => {
    const at = i === 0 ? position : "<0.25";
    growArrow(tl, link, {}, at);
    tl.from(shape, { opacity: 0, x: -24, duration: 0.7 }, "<0.15");
    tl.from(tag, { scale: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "back.out(2.5)" }, "<0.3");
    tl.from(caption, { opacity: 0, y: 10, duration: 0.5 }, "<");
  });
}

/** A copy of the previous block slides and squashes down to the size of the reduced block. */
function squash(tl, source, target, from, to, layer) {
  const ghost = source.shape.cloneNode(true);
  layer.appendChild(ghost);
  // The clone inherits the block's "from" state: reset it, visible only after the stop.
  gsap.set(ghost, { opacity: 0, x: 0 });
  growArrow(tl, target.link);
  tl.fromTo(ghost, { opacity: 0 }, { opacity: 1, duration: 0.05, immediateRender: false }, "<");
  tl.to(ghost, { x: to.x - from.x, scaleY: to.h / from.h, transformOrigin: "0% 50%", duration: 0.9, ease: "power3.inOut" }, "<");
  tl.from(target.shape, { opacity: 0, duration: 0.3 }, ">-0.2");
  tl.to(ghost, { opacity: 0, duration: 0.3 }, "<");
  tl.from(target.tag, { scale: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "back.out(2.5)" }, "<0.1");
  tl.from(target.caption, { opacity: 0, y: 10, duration: 0.5 }, "<");
}
