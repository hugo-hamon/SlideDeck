import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, canvas, div, drawIn, svg, title } from "deck/components.js";

const ROOT = { x: 960, y: 520 };
const LAB = { x: 690, y: 300 };
const THESIS = { x: 1200, y: 300 };
const SUPERVISORS = [["Sébastien Adam", 470], ["Maxime Berar", 960], ["Florian Yger", 1450]];
const SUPERVISOR_Y = 800;
const NODE_R = 17;

/** Arête du graphe ego, arrêtée avant les deux nœuds. */
function edge(parent, a, b, gap = 30) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const [ux, uy] = [(b.x - a.x) / d, (b.y - a.y) / d];
  return svg(parent, "line", {
    x1: a.x + ux * gap, y1: a.y + uy * gap, x2: b.x - ux * gap, y2: b.y - uy * gap,
    style: "stroke: var(--ink-soft); stroke-width: 2.5",
  });
}

const node = (parent, { x, y }, color) =>
  svg(parent, "circle", { cx: x, cy: y, r: NODE_R, style: `fill: ${color}; stroke: var(--paper); stroke-width: 3` });

/** L'orateur est la racine de son voisinage à un saut : laboratoire, thèse, encadrants. */
export default function thesis(root) {
  const heading = title(root, `Ma thèse <img src="assets/eyes.svg" alt="" style="height: 0.8em; vertical-align: -0.08em">`);
  const layer = canvas(root);
  const edges = svg(layer, "g");

  const me = svg(layer, "circle", { cx: ROOT.x, cy: ROOT.y, r: 20, style: "fill: var(--ink)" });
  const ring = svg(layer, "circle", { cx: ROOT.x, cy: ROOT.y, r: 38, style: "fill: none; stroke: var(--ink); stroke-width: 3" });
  const name = div(root, "abs", { x: ROOT.x + 70, y: ROOT.y - 34, html: "Moi !", style: { fontSize: "56px", lineHeight: "64px" } });

  const lab = node(layer, LAB, COLORS[2]);
  const labText = div(root, "abs", {
    x: LAB.x - 40, y: LAB.y - 66,
    html: `<div class="muted" style="font-size: 28px">Laboratoire</div><div style="font-size: 60px; line-height: 64px; color: ${COLORS[2]}">LITIS</div>`,
    style: { textAlign: "right" },
  });
  gsap.set(labText, { xPercent: -100 });

  const thesisNode = node(layer, THESIS, COLORS[0]);
  const thesisText = div(root, "abs", {
    x: THESIS.x + 40, y: THESIS.y - 66,
    html: `<div class="muted" style="font-size: 28px">Thèse</div>
           <div style="font-size: 60px; line-height: 64px; color: ${COLORS[0]}">GrapHiX</div>
           <div style="font-size: 34px; line-height: 42px">Graph Learning: toward<br>High eXpressivity of GNNs</div>`,
  });

  const people = SUPERVISORS.map(([person, x]) => ({
    dot: node(layer, { x, y: SUPERVISOR_Y }, COLORS[1]),
    text: div(root, "abs", { x, y: SUPERVISOR_Y + 34, html: person, style: { fontSize: "38px" } }),
    link: edge(edges, ROOT, { x, y: SUPERVISOR_Y }),
  }));
  people.forEach((p) => gsap.set(p.text, { xPercent: -50 }));
  const caption = div(root, "abs muted", { x: SUPERVISORS[0][1] - 40, y: SUPERVISOR_Y - 20, html: "Encadrement", style: { fontSize: "28px" } });
  gsap.set(caption, { xPercent: -100 });

  const pop = { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.5)" };
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(me, pop, "<0.2");
  drawIn(tl, ring, { duration: 0.7 }, "<0.1");
  tl.from(name, { opacity: 0, x: -20, duration: 0.7 }, "<0.2");
  pause(tl);

  for (const [target, text, at] of [[lab, labText, LAB], [thesisNode, thesisText, THESIS]]) {
    drawIn(tl, edge(edges, ROOT, at), { duration: 0.5 });
    tl.from(target, pop, ">-0.1");
    tl.from(text, { opacity: 0, y: 14, duration: 0.7 }, "<0.1");
    pause(tl);
  }

  drawIn(tl, people.map((p) => p.link), { duration: 0.5, stagger: 0.06 });
  tl.from(people.map((p) => p.dot), { ...pop, stagger: 0.06 }, ">-0.1");
  tl.from(people.map((p) => p.text), { opacity: 0, y: 14, duration: 0.6, stagger: 0.06 }, "<0.1");
  tl.from(caption, { opacity: 0, duration: 0.6 }, "<0.2");
  pause(tl);
  return tl;
}
