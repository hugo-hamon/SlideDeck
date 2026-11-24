import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { canvas, label, svg, tex, title } from "deck/components.js";
import { LINKS, drawNetwork, hull, meanLayer, network, swap, theme, valueColor, versus } from "../helpers.js";

const CELL = { w: 24, h: 62, gap: 4 };
const BIG = { w: 150, gap: 30 };
const STEPS = [0, 2, 5, 16, 64];

/** Initial scalar embedding: it depends on the community, with a small per-node offset. */
const INITIAL = Array.from({ length: 21 }, (_, i) => Math.floor(i / 7) / 2 + 0.06 * (((i * 0.618) % 1) - 0.5));

/** Embeddings after k mean-aggregation layers, actually computed. */
function layers(max) {
  const out = [INITIAL];
  for (let k = 1; k <= max; k++) out.push(meanLayer(out.at(-1), LINKS));
  return out;
}

/** Oversmoothing: with enough layers every embedding converges, whereas pooling avoids stacking them. */
export default function smoothing(root) {
  const heading = title(root, "Oversmoothing");
  const panels = versus(root, [["MPNN", "on empile les couches"], ["MPNN + pooling", "2 couches, puis pooling"]]);
  const layer = canvas(root);
  const ink = theme("ink-soft");
  const X = layers(64);
  const nets = panels.map((p) => network(105, [p.cx, p.y + 290]));

  const hullLayer = svg(layer, "g");
  const coarseLayer = svg(layer, "g");
  const graphs = nets.map((net) => {
    const g = drawNetwork(svg(layer, "g"), net, { r: 13 });
    g.edges.forEach((e) => e.setAttribute("style", `stroke: ${ink}`));
    g.nodes.forEach((n, i) => gsap.set(n, { fill: valueColor(INITIAL[i]) }));
    return g;
  });
  const cellY = panels[0].y + 585;
  const rows = panels.map((p) => {
    const width = 21 * (CELL.w + CELL.gap) - CELL.gap;
    return INITIAL.map((v, i) =>
      svg(layer, "rect", {
        x: p.cx - width / 2 + i * (CELL.w + CELL.gap), y: cellY - CELL.h / 2, width: CELL.w, height: CELL.h, rx: 3,
        style: `fill: ${valueColor(v)}; stroke: var(--paper); stroke-width: 1`,
      }),
    );
  });

  // Pooling side: regions, super-nodes, and three cells (one per community).
  const right = nets[1];
  const hulls = [0, 1, 2].map((c) => hull(hullLayer, right, c, 30));
  hulls.forEach((h) => h.setAttribute("style", "fill: none; stroke: var(--ink-soft); stroke-width: 2; stroke-dasharray: 8 6"));
  const pooled = [0, 1, 2].map((c) => X[2].slice(7 * c, 7 * c + 7).reduce((s, v) => s + v, 0) / 7);
  const coarseEdges = [[0, 1], [0, 2], [1, 2]].map(([a, b]) =>
    svg(coarseLayer, "line", { x1: right.centroids[a].x, y1: right.centroids[a].y, x2: right.centroids[b].x, y2: right.centroids[b].y, style: `stroke: ${ink}; stroke-width: 5` }),
  );
  const supers = right.centroids.map(({ x, y }, c) =>
    svg(coarseLayer, "circle", { cx: x, cy: y, r: 36, style: `fill: ${valueColor(pooled[c])}; stroke: var(--paper); stroke-width: 4` }),
  );
  gsap.set(coarseLayer, { opacity: 0 });
  const bigWidth = 3 * BIG.w + 2 * BIG.gap;
  const bigX = (c) => panels[1].cx - bigWidth / 2 + c * (BIG.w + BIG.gap);
  const big = pooled.map((v, c) =>
    svg(layer, "rect", { x: bigX(c), y: cellY - CELL.h / 2, width: BIG.w, height: CELL.h, rx: 4, style: `fill: ${valueColor(v)}; stroke: var(--paper); stroke-width: 1` }),
  );
  gsap.set(big, { opacity: 0 });

  const cellLabels = [
    label(root, "21 embeddings de nœuds", panels[0].cx, cellY - 62, 28, "abs muted"),
    label(root, "21 embeddings de nœuds", panels[1].cx, cellY - 62, 28, "abs muted"),
  ];
  const pooledLabel = label(root, "3 embeddings de communautés", panels[1].cx, cellY - 62, 28, "abs muted");
  gsap.set(pooledLabel, { opacity: 0 });
  const kTags = [
    STEPS.map((k) => label(root, tex(`K = ${k}`), panels[0].x + panels[0].w - 110, panels[0].y + 58, 44)),
    [0, 2].map((k) => label(root, tex(`K = ${k}`), panels[1].x + panels[1].w - 110, panels[1].y + 58, 44)),
  ];
  const poolTag = label(root, `${tex("K = 2")} + pooling`, panels[1].x + panels[1].w - 175, panels[1].y + 58, 40);
  const captionY = 885;
  const captions = {
    reach: label(root, `${tex("K = 5")} : la portée couvre tout le graphe`, panels[0].cx, captionY, 32),
    reachPool: label(root, "graphe réduit : chaque communauté voit les autres en 1 saut", panels[1].cx, captionY, 32),
    lost: label(root, `<span class="c-red">✗</span> les embeddings deviennent indiscernables`, panels[0].cx, captionY, 32),
    kept: label(root, `<span class="c-green">✓</span> les communautés restent distinctes`, panels[1].cx, captionY, 32),
  };
  gsap.set(Object.values(captions), { opacity: 0 });

  /** Colours a panel's nodes and cells from the embeddings after k layers. */
  const recolor = (side, k, position, duration = 1) => {
    graphs[side].nodes.forEach((n, i) => tl.to(n, { fill: valueColor(X[k][i]), duration, ease: "power2.inOut" }, position));
    rows[side].forEach((r, i) => tl.to(r, { fill: valueColor(X[k][i]), duration, ease: "power2.inOut" }, position));
  };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(panels.map((p) => p.frame), { opacity: 0, scale: 0.98, duration: 0.7, stagger: 0.1 }, "<0.1");
  tl.from(graphs.flatMap((g) => g.nodes), { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)", stagger: 0.01 }, "<0.2");
  tl.from(graphs.flatMap((g) => g.edges), { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from([...rows.flat(), ...cellLabels], { opacity: 0, duration: 0.4, stagger: 0.01 }, "<0.2");
  tl.from(kTags.map((t) => t[0]), { opacity: 0, y: 10, duration: 0.5 }, "<");
  gsap.set([...kTags[0].slice(1), kTags[1][1], poolTag], { opacity: 0 });
  pause(tl);

  // 2 layers on both sides: the communities start to mix.
  tl.addLabel("two");
  swap(tl, kTags[0][0], kTags[0][1], "two");
  swap(tl, kTags[1][0], kTags[1][1], "two");
  recolor(0, 2, "two+=0.2", 1.2);
  recolor(1, 2, "two+=0.2", 1.2);
  pause(tl);

  // To see everything, the MPNN goes on (5 layers); on the right, we pool.
  tl.addLabel("pool");
  swap(tl, kTags[0][1], kTags[0][2], "pool");
  recolor(0, 5, "pool+=0.2", 1.2);
  swap(tl, kTags[1][1], poolTag, "pool");
  tl.from(hulls, { opacity: 0, scale: 0.7, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.1 }, "pool");
  right.nodes.forEach((node, i) => {
    const { x, y } = right.centroids[node.c];
    tl.to(graphs[1].nodes[i], { attr: { cx: x, cy: y }, duration: 1, ease: "power3.inOut" }, "pool+=0.6");
  });
  graphs[1].edges.forEach((edge, k) => {
    const [a, b] = LINKS[k].map((n) => right.centroids[right.nodes[n].c]);
    tl.to(edge, { attr: { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, duration: 1, ease: "power3.inOut" }, "pool+=0.6");
  });
  tl.to(hulls, { opacity: 0, duration: 0.6 }, "pool+=1");
  tl.fromTo(coarseLayer, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, "pool+=1.45");
  tl.to([...graphs[1].nodes, ...graphs[1].edges], { opacity: 0, duration: 0.3 }, "<");
  rows[1].forEach((r, i) => {
    const c = Math.floor(i / 7);
    const dx = bigX(c) + BIG.w / 2 - (+r.getAttribute("x") + CELL.w / 2);
    tl.to(r, { x: dx, duration: 0.9, ease: "power3.inOut" }, `pool+=${0.6 + 0.02 * i}`);
  });
  tl.fromTo(big, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.08, immediateRender: false }, "pool+=1.4");
  tl.to(rows[1], { opacity: 0, duration: 0.3 }, "pool+=1.5");
  swap(tl, cellLabels[1], pooledLabel, "pool+=1.3");
  tl.fromTo([captions.reach, captions.reachPool], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, immediateRender: false }, "pool+=1.8");
  pause(tl);

  // Even more layers: everything converges to the same value.
  tl.addLabel("deep");
  swap(tl, kTags[0][2], kTags[0][3], "deep");
  recolor(0, 16, "deep+=0.2", 1.2);
  swap(tl, kTags[0][3], kTags[0][4], "deep+=1.5");
  recolor(0, 64, "deep+=1.7", 1.2);
  tl.to([captions.reach, captions.reachPool], { opacity: 0, duration: 0.3 }, "deep+=2.6");
  tl.fromTo([captions.lost, captions.kept], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, immediateRender: false }, "deep+=2.9");
  tl.to(supers, { scale: 1.15, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut", stagger: 0.08 }, "deep+=3");
  pause(tl);
  return tl;
}
