import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { arrow, canvas, growArrow, label, svg, tex, title } from "deck/components.js";
import { BRIDGES, INTERNAL, drawCoarse, drawNetwork, network } from "../helpers.js";

const FINE = network(120, [480, 470]);
const COARSE = network(120, [1440, 470]);
const TEXT_Y = 770;

/** Le pooling rend abordable un modèle 3-WL : 21³ triplets avant, 3³ après. */
export default function motivation(root) {
  const heading = title(root, "Pourquoi le pooling dans ma thèse ?");
  const layer = canvas(root);
  const fine = drawNetwork(svg(layer, "g"), FINE, { r: 12 });
  const coarseLayer = svg(layer, "g");
  const coarse = drawCoarse(coarseLayer, COARSE, { r: 34 });
  // Copie du graphe fin qui glisse à droite et se contracte en communautés.
  const ghost = drawNetwork(svg(layer, "g"), FINE, { r: 12 });
  gsap.set([...ghost.nodes, ...ghost.edges], { opacity: 0 });

  const text = (x, lines) => lines.map(([html, size, cls], k) => label(root, html, x, TEXT_Y + k * 62, size, cls));
  const fineText = text(FINE.centroids[2].x, [
    [`Modèle 3-WL sur ${tex("n = 21")} nœuds`, 38, "abs"],
    [tex(String.raw`\htmlClass{c-green}{21^3 = 9\,261}`) + `<span class="c-green"> triplets</span>`, 44, "abs"],
  ]);
  const coarseText = text(COARSE.centroids[2].x, [
    [`Après pooling : ${tex("m = 3")} nœuds`, 38, "abs"],
    [tex(String.raw`\htmlClass{c-green}{3^3 = 27}`) + `<span class="c-green"> triplets</span>`, 44, "abs"],
  ]);
  const link = arrow(layer, 860, 450, 1080, 450);
  const linkLabel = label(root, "pooling", 970, 405, 34, "abs muted");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(fine.nodes, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.2)", stagger: 0.02 }, "<0.2");
  tl.from(fine.edges, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(fineText, { opacity: 0, y: 14, duration: 0.7, stagger: 0.12 }, "<0.2");
  pause(tl);

  tl.addLabel("pool");
  growArrow(tl, link, { duration: 0.6 }, "pool");
  tl.from(linkLabel, { opacity: 0, y: 10, duration: 0.5 }, "pool+=0.2");
  tl.fromTo([...ghost.nodes, ...ghost.edges], { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, "pool");
  ghost.nodes.forEach((node, i) => {
    const { x, y } = COARSE.centroids[FINE.nodes[i].c];
    tl.to(node, { attr: { cx: x, cy: y }, duration: 1.3, ease: "power3.inOut" }, `pool+=${0.1 + 0.01 * i}`);
  });
  [...INTERNAL, ...BRIDGES].forEach(([a, b], k) => {
    const [p, q] = [a, b].map((n) => COARSE.centroids[FINE.nodes[n].c]);
    tl.to(ghost.edges[k], { attr: { x1: p.x, y1: p.y, x2: q.x, y2: q.y }, duration: 1.3, ease: "power3.inOut" }, "pool+=0.1");
  });
  tl.from(coarse.supers, { scale: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.8)", stagger: 0.08 }, "pool+=1.1");
  tl.from(coarse.edges, { opacity: 0, duration: 0.5 }, "pool+=1.3");
  tl.to([...ghost.nodes, ...ghost.edges], { opacity: 0, duration: 0.25 }, "pool+=1.35");
  tl.from(coarseText, { opacity: 0, y: 14, duration: 0.7, stagger: 0.12 }, "pool+=1.4");
  pause(tl);
  return tl;
}
