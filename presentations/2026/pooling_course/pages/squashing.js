import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { FILLS, canvas, label, svg, tex, title } from "deck/components.js";
import { hops, line, swap, theme, versus } from "../helpers.js";

/*
 * Arbre binaire accroché à t par une seule arête (le goulot) :
 * 0 = t, 1 = racine, 2–3 profondeur 1, 4–7 profondeur 2, 8–15 profondeur 3, 16–17 voisins de t.
 */
const parent = (i) => (i === 1 ? 0 : i < 4 ? 1 : i < 8 ? 2 + ((i - 4) >> 1) : 4 + ((i - 8) >> 1));
const TREE = Array.from({ length: 15 }, (_, k) => [parent(k + 1), k + 1]);
const LINKS = [...TREE, [0, 16], [0, 17], [16, 17]];
const N = 18;
const T = 0;
const LAYERS = 4;
const NODE_R = 13;
const SUPER_R = 40;
const HOP = 0.4;
/* Pooling : les deux sous-arbres, et la région de t. */
const CLUSTER = (i) => (i === 0 || i === 1 || i >= 16 ? 2 : [2, 4, 5, 8, 9, 10, 11].includes(i) ? 0 : 1);
const COARSE_LINKS = [[0, 2], [1, 2]];

function layout(panel) {
  const y = panel.y + 330;
  const depthX = [panel.cx + 240, panel.cx + 110, panel.cx - 20, panel.cx - 150, panel.cx - 280];
  const nodes = [{ x: depthX[0], y }, { x: depthX[1], y }];
  [-100, 100].forEach((dy) => nodes.push({ x: depthX[2], y: y + dy }));
  [-150, -50, 50, 150].forEach((dy) => nodes.push({ x: depthX[3], y: y + dy }));
  for (let j = 0; j < 8; j++) nodes.push({ x: depthX[4], y: y - 175 + 50 * j });
  nodes.push({ x: panel.cx + 330, y: y - 95 }, { x: panel.cx + 330, y: y + 95 });
  const groups = [0, 1, 2].map((c) => nodes.filter((_, i) => CLUSTER(i) === c));
  const mean = (g, key) => g.reduce((s, p) => s + p[key], 0) / g.length;
  const supers = groups.map((g) => ({ x: mean(g, "x"), y: mean(g, "y") }));
  const boxes = groups.map((g) => {
    const [xs, ys] = [g.map((p) => p.x), g.map((p) => p.y)];
    return {
      cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2,
      rx: (Math.max(...xs) - Math.min(...xs)) / 2 + 40, ry: (Math.max(...ys) - Math.min(...ys)) / 2 + 24,
    };
  });
  return { nodes, supers, boxes, y };
}

/** Oversquashing structurel : un voisinage qui double à chaque couche doit passer par une seule arête. */
export default function squashing(root) {
  const heading = title(root, "Oversquashing structurel");
  const panels = versus(root, [["MPNN", "graphe d’origine"], ["MPNN + pooling", "graphe réduit"]]);
  const layer = canvas(root);
  const [blue, red, ink] = ["blue", "red", "ink-soft"].map(theme);
  const dist = hops(N, LINKS, T);
  const geo = panels.map(layout);
  const [left, right] = geo;

  const hullLayer = svg(layer, "g");
  const haloLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const graphs = geo.map(({ nodes }) => {
    const group = svg(layer, "g");
    const edges = LINKS.map(([a, b]) => line(group, nodes[a], nodes[b], `stroke: ${ink}`, { "stroke-width": 2.5, "stroke-opacity": 0.7 }));
    const dots = nodes.map(({ x, y }, i) => svg(group, "circle", { cx: x, cy: y, r: NODE_R, style: `fill: ${i === T ? blue : ink}; stroke: var(--paper); stroke-width: 3` }));
    return { edges, dots };
  });
  const halos = left.nodes.map(({ x, y }) => svg(haloLayer, "circle", { cx: x, cy: y, r: NODE_R + 10, style: `fill: ${FILLS[0]}` }));
  const neck = line(layer, left.nodes[0], left.nodes[1], `stroke: ${red}`, { "stroke-width": 7, "stroke-linecap": "round" });
  gsap.set(neck, { opacity: 0 });
  const neckName = label(root, "goulot", (left.nodes[0].x + left.nodes[1].x) / 2, left.y - 40, 28, "abs c-red");
  const packets = svg(layer, "g");
  const rings = geo.map(({ nodes }) => svg(layer, "circle", { cx: nodes[T].x, cy: nodes[T].y, r: 24, style: "fill: none; stroke: var(--ink); stroke-width: 3.5" }));
  const tNames = geo.map(({ nodes }) => label(root, tex(String.raw`\htmlClass{c-blue}{t}`), nodes[T].x + 2, nodes[T].y + 56, 44));

  // Pooling : trois régions, puis trois super-nœuds (deux sous-arbres et la région de t).
  const hulls = right.boxes.map((b) => svg(hullLayer, "ellipse", { ...b, style: "fill: none; stroke: var(--ink-soft); stroke-width: 2; stroke-dasharray: 8 6" }));
  const coarseHalos = right.supers.map(({ x, y }) => svg(coarseLayer, "circle", { cx: x, cy: y, r: SUPER_R + 12, style: `fill: ${FILLS[0]}` }));
  const coarseEdges = COARSE_LINKS.map(([a, b]) => line(coarseLayer, right.supers[a], right.supers[b], `stroke: ${ink}`, { "stroke-width": 5, "stroke-opacity": 1 }));
  const supers = right.supers.map(({ x, y }, c) => svg(coarseLayer, "circle", { cx: x, cy: y, r: SUPER_R, style: `fill: ${c === 2 ? blue : ink}; stroke: var(--paper); stroke-width: 4` }));
  gsap.set(coarseLayer, { opacity: 0 });
  gsap.set([...halos, ...coarseHalos], { scale: 0, transformOrigin: "50% 50%" });

  // Compteurs : combien de nœuds doivent passer par la même arête pour atteindre t.
  const countY = left.y + 250;
  const through = Array.from({ length: LAYERS + 1 }, (_, k) => TREE.filter(([, v]) => dist[v] <= k).length);
  const counts = through.slice(1).map((n) =>
    label(root, `${tex(String(n))} nœud${n > 1 ? "s" : ""} à faire passer par <span class="c-red">1 arête</span>`, panels[0].cx, countY, 34),
  );
  const coarseCount = label(root, "chaque arête ne porte qu’un super-nœud", panels[1].cx, countY, 34);
  gsap.set([...counts, coarseCount], { opacity: 0 });
  const kTags = [
    Array.from({ length: LAYERS + 1 }, (_, k) => label(root, tex(`K = ${k}`), panels[0].x + panels[0].w - 110, panels[0].y + 58, 44)),
    [0, 1].map((k) => label(root, tex(`K = ${k}`), panels[1].x + panels[1].w - 110, panels[1].y + 58, 44)),
  ];
  const captions = [
    label(root, `<span class="c-red">✗</span> le nombre de voisins à agréger augmente et l'information <br>compressée à travers une seule arête devient trop importante`, panels[0].cx, 875, 32),
    label(root, `<span class="c-green">✓</span> en modifiant la topologie, le pooling peut<br>atténuer la compression structurelle`, panels[1].cx, 875, 32),
  ];
  captions.forEach((c) => (c.style.textAlign = "center"));
  gsap.set(captions, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const pop = { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" };

  // 1. Le même graphe des deux côtés : un arbre accroché à t.
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(panels.map((p) => p.frame), { opacity: 0, scale: 0.98, duration: 0.7, stagger: 0.1 }, "<0.1");
  tl.from(panels.map((p) => p.head), { opacity: 0, x: -16, duration: 0.6, stagger: 0.1 }, "<0.2");
  tl.from(graphs.flatMap((g) => g.dots), { ...pop, stagger: 0.01 }, "<0.2");
  tl.from(graphs.flatMap((g) => g.edges), { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(rings, { ...pop, stagger: 0.05 }, ">-0.2");
  tl.from([...tNames, ...kTags.map((t) => t[0])], { opacity: 0, y: 10, duration: 0.5, stagger: 0.05 }, "<0.1");
  pause(tl);

  // 2. À gauche, tout l'arbre n'atteint t que par une arête ; à droite, on poole.
  tl.addLabel("pool");
  tl.fromTo(neck, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, "pool");
  tl.to(neck, { attr: { "stroke-width": 11 }, duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut" }, "pool+=0.4");
  tl.from(neckName, { opacity: 0, y: 10, duration: 0.6 }, "pool+=0.3");
  tl.from(hulls, { opacity: 0, scale: 0.8, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.1 }, "pool");
  right.nodes.forEach((_, i) => {
    const target = right.supers[CLUSTER(i)];
    tl.to(graphs[1].dots[i], { attr: { cx: target.x, cy: target.y }, duration: 1, ease: "power3.inOut" }, "pool+=0.6");
  });
  LINKS.forEach(([a, b], k) => {
    const [p, q] = [right.supers[CLUSTER(a)], right.supers[CLUSTER(b)]];
    tl.to(graphs[1].edges[k], { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1, ease: "power3.inOut" }, "pool+=0.6");
  });
  tl.to(rings[1], { attr: { cx: right.supers[2].x, cy: right.supers[2].y, r: SUPER_R + 10 }, duration: 1, ease: "power3.inOut" }, "pool+=0.6");
  tl.to(tNames[1], { x: right.supers[2].x - right.nodes[T].x, y: 20, duration: 1, ease: "power3.inOut" }, "pool+=0.6");
  tl.to(hulls, { opacity: 0, duration: 0.8, ease: "power3.inOut" }, "pool+=0.8");
  tl.fromTo(coarseLayer, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, "pool+=1.4");
  tl.to([...graphs[1].dots, ...graphs[1].edges], { opacity: 0, duration: 0.3 }, "<");
  pause(tl);

  // 3–6. Chaque couche ajoute un niveau de l'arbre ; tous les messages convergent vers le goulot.
  const fine = graphs[0];
  const edgeOf = (a, b) => LINKS.findIndex(([p, q]) => (p === a && q === b) || (p === b && q === a));
  const towardT = (v) => (v >= 16 ? T : parent(v));
  for (let k = 1; k <= LAYERS; k++) {
    const at = (offset) => `k${k}+=${offset}`;
    tl.addLabel(`k${k}`);
    swap(tl, kTags[0][k - 1], kTags[0][k], `k${k}`);
    const frontier = dist.flatMap((d, v) => (d === k ? [v] : []));
    frontier.forEach((v) => {
      tl.to(halos[v], { scale: 1, duration: 0.5, ease: "back.out(2)" }, at(0.2));
      tl.to(fine.dots[v], { fill: blue, duration: 0.4 }, at(0.2));
      // Le message remonte vers t, un saut à la fois ; les messages se superposent aux embranchements.
      const dot = svg(packets, "circle", { cx: left.nodes[v].x, cy: left.nodes[v].y, r: 9, style: `fill: ${blue}; stroke: var(--ink); stroke-width: 2.5` });
      gsap.set(dot, { opacity: 0 });
      tl.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, at(0.5));
      let here = v;
      for (let step = 0; here !== T; step++) {
        const next = towardT(here);
        tl.to(dot, { attr: { cx: left.nodes[next].x, cy: left.nodes[next].y }, duration: HOP, ease: "power1.inOut" }, at(0.7 + step * HOP));
        tl.to(fine.edges[edgeOf(here, next)], { stroke: blue, attr: { "stroke-opacity": 1 }, duration: 0.3 }, at(0.7 + step * HOP));
        here = next;
      }
      tl.to(dot, { opacity: 0, duration: 0.2 }, at(0.7 + k * HOP));
    });
    // Passage du goulot : il porte d'autant plus de nœuds que K grandit.
    tl.to(neck, { attr: { "stroke-width": 7 + 2 * k }, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut" }, at(0.7 + (k - 1) * HOP));
    tl.to(rings[0], { scale: 1.2, transformOrigin: "50% 50%", duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }, at(0.7 + k * HOP));
    if (k === 1) tl.fromTo(counts[0], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, at(0.9 + k * HOP));
    else swap(tl, counts[k - 2], counts[k - 1], at(0.7 + k * HOP));

    if (k === 1) {
      // Graphe réduit : une couche suffit, chaque arête ne porte qu'un super-nœud.
      swap(tl, kTags[1][0], kTags[1][1], "k1");
      [0, 1].forEach((c) => {
        tl.to(coarseHalos[c], { scale: 1, duration: 0.5, ease: "back.out(2)" }, at(0.2));
        tl.to(supers[c], { fill: blue, duration: 0.4 }, at(0.2));
        const dot = svg(packets, "circle", { cx: right.supers[c].x, cy: right.supers[c].y, r: 14, style: `fill: ${blue}; stroke: var(--ink); stroke-width: 3` });
        gsap.set(dot, { opacity: 0 });
        tl.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, at(0.5));
        tl.to(dot, { attr: { cx: right.supers[2].x, cy: right.supers[2].y }, duration: 1, ease: "power3.inOut" }, at(0.7));
        tl.to(coarseEdges[c], { stroke: blue, duration: 0.4 }, at(0.9));
        tl.to(dot, { opacity: 0, duration: 0.2 }, at(1.7));
      });
      tl.to(rings[1], { scale: 1.15, transformOrigin: "50% 50%", duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut" }, at(1.7));
      tl.fromTo(coarseCount, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, immediateRender: false }, at(1.9));
    }
    if (k === LAYERS) tl.fromTo(captions, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, immediateRender: false }, at(1.4 + k * HOP));
    pause(tl);
  }
  return tl;
}
