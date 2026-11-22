import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { canvas, label, svg, tex, title } from "deck/components.js";
import { mix, theme } from "../helpers.js";
import { EDGES, N, SCORES, cite, drawGraph, formula, stepper, verdict } from "../methods.js";

const RATIO = 0.5;
const KEEP = Math.ceil(RATIO * N);
const BARS = { x: 1000, slot: 100, w: 62, base: 760, max: 330 };
const fr = (v) => v.toFixed(2).replace(".", ",");

/** Top-k : un score par nœud, on garde les k meilleurs et le sous-graphe qu'ils induisent. */
export default function topk(root) {
  const heading = title(root, "Top-k");
  const steps = stepper(root);
  const layer = canvas(root);
  const graph = drawGraph(layer, { origin: [430, 600] });
  const { points, colors } = graph;
  const ref = cite(root, "Gao &amp; Ji — <i>Graph U-Nets</i>, ICML 2019 (gPool)");

  const ranking = [...SCORES.keys()].sort((a, b) => SCORES[b] - SCORES[a]);
  const rank = SCORES.map((_, i) => ranking.indexOf(i));
  const kept = new Set(ranking.slice(0, KEEP));
  const dropped = [...SCORES.keys()].filter((i) => !kept.has(i));

  // Diagramme des scores : une barre par nœud, dans l'ordre des nœuds puis triée.
  const barX = (slot) => BARS.x + slot * BARS.slot;
  const bars = SCORES.map((s, i) => {
    const group = svg(layer, "g");
    const h = BARS.max * s;
    svg(group, "rect", { x: barX(i), y: BARS.base - h, width: BARS.w, height: h, rx: 5, style: `fill: ${colors[i]}` });
    const value = svg(group, "text", { x: barX(i) + BARS.w / 2, y: BARS.base - h - 14, "text-anchor": "middle", style: "fill: var(--ink); font: 26px var(--serif)" });
    value.textContent = fr(s);
    const name = svg(group, "text", { x: barX(i) + BARS.w / 2, y: BARS.base + 36, "text-anchor": "middle", style: "fill: var(--ink-soft); font: 600 28px var(--serif)" });
    name.textContent = i + 1;
    return group;
  });
  const axis = svg(layer, "line", { x1: BARS.x - 20, y1: BARS.base, x2: barX(N) - 10, y2: BARS.base, style: "stroke: var(--ink); stroke-width: 2" });
  const cutX = barX(KEEP) - (BARS.slot - BARS.w) / 2;
  const cut = svg(layer, "line", { x1: cutX, y1: BARS.base - BARS.max - 40, x2: cutX, y2: BARS.base + 10, style: "stroke: var(--red); stroke-width: 3; stroke-dasharray: 10 8" });
  const cutName = label(root, `${tex(String.raw`k = \lceil r N \rceil = ${KEEP}`)} <span class="muted">(r = ½)</span>`, cutX, BARS.base - BARS.max - 70, 30);
  const keepName = label(root, "gardés", (BARS.x + cutX) / 2, BARS.base + 80, 28, "abs c-blue");
  const dropName = label(root, "écartés", (cutX + barX(N)) / 2, BARS.base + 80, 28, "abs c-red");

  // Pondération des attributs gardés par tanh(y), puis anneaux et étiquettes du graphe réduit.
  const paper = theme("paper");
  const gates = [...kept].map((i) => label(root, tex(String.raw`\times ${fr(Math.tanh(SCORES[i]))}`), points[i].x, points[i].y - 46, 26));
  const rings = [...kept].map((i) => svg(layer, "circle", { cx: points[i].x, cy: points[i].y, r: 31, style: "fill: none; stroke: var(--ink); stroke-width: 3" }));
  const isolated = [...kept].filter((i) => !EDGES.some(([a, b]) => (a === i && kept.has(b)) || (b === i && kept.has(a))));
  const alone = isolated.map((i) => svg(layer, "circle", { cx: points[i].x, cy: points[i].y, r: 40, style: "fill: none; stroke: var(--red); stroke-width: 3; stroke-dasharray: 8 6" }));
  const lost = label(root, `<span class="c-red">${dropped.length} nœuds écartés : leur information est perdue</span>`, 430, 850, 30);
  const broken = label(root, `<span class="c-red">nœuds ${isolated.map((i) => i + 1).sort((a, b) => a - b).join(" et ")} isolés : graphe réduit déconnecté</span>`, 430, 850, 30);
  gsap.set([lost, broken, ...alone], { opacity: 0 });

  const formulas = [
    formula(root, String.raw`y = X\,p \,/\, \lVert p \rVert`),
    formula(root, String.raw`X' = \big(X \odot \tanh(y)\big)_{\text{idx}}`),
    formula(root, String.raw`A' = A_{\text{idx},\,\text{idx}}`),
  ];
  gsap.set(formulas, { opacity: 0 });
  const verdicts = verdict(root, "creux et rapide, K contrôlé par r", "nœuds écartés perdus, connectivité fragile");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const show = (node, position) => tl.fromTo(node, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, position);
  const hide = (node, position) => tl.to(node, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, position);

  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(steps.all, { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, "<0.2");
  tl.from(graph.groups, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, "<0.2");
  tl.from(graph.edges, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(ref, { opacity: 0, duration: 0.6 }, "<");
  pause(tl);

  // SEL : un score appris par projection, puis tri et seuil.
  tl.addLabel("sel");
  steps.focus(tl, 0, "sel");
  show(formulas[0], "sel+=0.2");
  tl.from(axis, { attr: { x2: BARS.x - 20 }, duration: 0.6, ease: "power3.inOut" }, "sel+=0.3");
  tl.from(bars, { scaleY: 0, transformOrigin: "50% 100%", opacity: 0, duration: 0.6, stagger: 0.08 }, "sel+=0.5");
  tl.to(bars, { x: (i) => barX(rank[i]) - barX(i), duration: 1, ease: "power3.inOut" }, "sel+=1.6");
  tl.from(cut, { attr: { y1: BARS.base }, opacity: 0, duration: 0.6, ease: "power3.out" }, "sel+=2.7");
  tl.from([cutName, keepName, dropName], { opacity: 0, y: 10, duration: 0.5, stagger: 0.08 }, "sel+=2.9");
  tl.to(dropped.map((i) => bars[i]), { opacity: 0.35, duration: 0.5 }, "sel+=3");
  tl.from(rings, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.06 }, "sel+=3.1");
  pause(tl);

  // RED : les nœuds écartés disparaissent ; les gardés sont pondérés par tanh(y).
  tl.addLabel("red");
  steps.focus(tl, 1, "red");
  hide(formulas[0], "red");
  show(formulas[1], "red+=0.2");
  tl.to(dropped.map((i) => graph.groups[i]), { opacity: 0.15, duration: 0.8, ease: "power2.inOut" }, "red+=0.3");
  show(lost, "red+=0.6");
  tl.from(gates, { opacity: 0, y: 10, duration: 0.5, stagger: 0.08 }, "red+=0.9");
  [...kept].forEach((i) => {
    tl.to(graph.dots[i], { fill: mix([colors[i], paper], [Math.tanh(SCORES[i]), 1 - Math.tanh(SCORES[i])]), duration: 0.8, ease: "power2.inOut" }, "red+=1.3");
  });
  pause(tl);

  // CON : on garde seulement les arêtes entre nœuds gardés.
  tl.addLabel("con");
  steps.focus(tl, 2, "con");
  hide(formulas[1], "con");
  show(formulas[2], "con+=0.2");
  tl.to(gates, { opacity: 0, duration: 0.3 }, "con");
  EDGES.forEach(([a, b], e) => {
    if (kept.has(a) && kept.has(b)) tl.to(graph.edges[e], { attr: { "stroke-width": 5, "stroke-opacity": 1 }, duration: 0.5 }, "con+=0.4");
    else {
      tl.to(graph.edges[e], { stroke: theme("red"), duration: 0.3 }, "con+=0.4");
      tl.to(graph.edges[e], { opacity: 0, duration: 0.5 }, "con+=0.9");
    }
  });
  hide(lost, "con+=1.2");
  show(broken, "con+=1.5");
  tl.to(alone, { opacity: 1, duration: 0.4 }, "con+=1.4");
  tl.from(alone, { scale: 1.4, transformOrigin: "50% 50%", duration: 0.6 }, "<");
  pause(tl);

  steps.focus(tl, -1, ">");
  tl.from(verdicts, { opacity: 0, y: 12, duration: 0.6, stagger: 0.15 }, "<0.1");
  pause(tl);
  return tl;
}
