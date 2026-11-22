import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { canvas, div } from "deck/components.js";
import { BRIDGES, INTERNAL, drawNetwork, follow, network, seeded, smooth } from "../helpers.js";

/** Graphe partagé avec la slide suivante, qui le reprend exactement à cette place. */
export const INTRO_GRAPH = { scale: 160, origin: [1350, 520] };
const CYCLE = 16; // s : flottement, regroupement en communautés, retour
const LOOPS = 40; // ≈ 10 min d'attente avant le début du cours
const AMPLITUDE = 18; // px : borne du déplacement dû au flottement
const NODE_R = 12;
const SUPER_R = 34;

/** Pooled entre 3 et 7 s, maintenu jusqu'à 10 s, déplié de 10 à 14 s (comme la version Manim). */
function blend(p) {
  const t = p * CYCLE;
  if (t < 7) return smooth((t - 3) / 4);
  if (t < 10) return 1;
  return 1 - smooth((t - 10) / 4);
}

/** Page d'accueil en boucle : le graphe flotte et se regroupe périodiquement en trois super-nœuds. */
export default function intro(root) {
  const heading = div(root, "abs", {
    x: 150, y: 300,
    html: "Pooling<br>sur graphes",
    style: { fontSize: "124px", lineHeight: "128px", fontWeight: 500 },
  });
  const rule = div(root, "abs", { x: 154, y: 588, w: 550, h: 3, style: { background: "var(--blue)", borderRadius: "2px" } });
  const subtitle = div(root, "abs muted", { x: 154, y: 616, html: "Machine Learning on Graphs", style: { fontSize: "46px" } });

  const net = network(INTRO_GRAPH.scale, INTRO_GRAPH.origin);
  const graph = drawNetwork(canvas(root), net, { r: NODE_R });

  // Trajectoires fixées par une graine : seek, retour arrière et captures restent exacts.
  const random = seeded(18);
  const waves = net.nodes.map(() => ({
    phase: [random() * 2 * Math.PI, random() * 2 * Math.PI],
    freq: [1 + Math.floor(random() * 2), 1 + Math.floor(random() * 2)],
    strength: 0.65 + 0.35 * random(),
  }));
  const drift = (i, k, p) => {
    const { phase, freq, strength } = waves[i];
    return ((AMPLITUDE * strength) / (2 * Math.SQRT2)) * (Math.sin(2 * Math.PI * freq[k] * p + phase[k]) - Math.sin(phase[k]));
  };
  const leader = (i) => 7 * net.nodes[i].c;
  const position = (i, p) => {
    const b = blend(p);
    const node = net.nodes[i];
    const target = net.centroids[node.c];
    const offset = [0, 1].map((k) => (1 - b) * drift(i, k, p) + b * drift(leader(i), k, p));
    return { x: node.x + (target.x - node.x) * b + offset[0], y: node.y + (target.y - node.y) * b + offset[1] };
  };

  const cycle = gsap.timeline({ repeat: LOOPS - 1 });
  graph.nodes.forEach((node, i) => {
    follow(cycle, node, "cx", (p) => position(i, p).x, CYCLE, 0);
    follow(cycle, node, "cy", (p) => position(i, p).y, CYCLE, 0);
    follow(cycle, node, "r", (p) => NODE_R + (SUPER_R - NODE_R) * blend(p), CYCLE, 0);
  });
  const ends = [...INTERNAL, ...BRIDGES];
  graph.edges.forEach((edge, k) => {
    const [a, b] = ends[k];
    follow(cycle, edge, "x1", (p) => position(a, p).x, CYCLE, 0);
    follow(cycle, edge, "y1", (p) => position(a, p).y, CYCLE, 0);
    follow(cycle, edge, "x2", (p) => position(b, p).x, CYCLE, 0);
    follow(cycle, edge, "y2", (p) => position(b, p).y, CYCLE, 0);
  });
  graph.internal.forEach((edge) => follow(cycle, edge, "stroke-opacity", (p) => 0.55 * (1 - blend(p)), CYCLE, 0));
  // Une seule arête par paire de communautés survit, épaissie selon le nombre de ponts.
  const seen = new Set();
  graph.bridges.forEach((edge, k) => {
    const [a, b] = BRIDGES[k].map((n) => net.nodes[n].c);
    const pair = `${a}-${b}`;
    const kept = !seen.has(pair);
    seen.add(pair);
    const weight = BRIDGES.filter(([u, v]) => net.nodes[u].c === a && net.nodes[v].c === b).length;
    follow(cycle, edge, "stroke-opacity", (p) => 0.4 + ((kept ? 0.75 : 0) - 0.4) * blend(p), CYCLE, 0);
    follow(cycle, edge, "stroke-width", (p) => 2 + ((kept ? weight * 2.4 : 2) - 2) * blend(p), CYCLE, 0);
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.add(cycle, 0);
  tl.from(heading, { opacity: 0, y: 24, duration: 0.9 }, 0);
  tl.from(rule, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.8, ease: "power3.inOut" }, 0.2);
  tl.from(subtitle, { opacity: 0, y: 12, duration: 0.8 }, 0.35);
  pause(tl);
  return tl;
}
