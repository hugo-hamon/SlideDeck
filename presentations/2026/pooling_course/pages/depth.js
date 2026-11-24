import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, canvas, label, svg, tex, title } from "deck/components.js";

const AXIS = { x0: 260, x1: 1660, y: 640, max: 12 };
const BAND = { top: 330, bottom: 620 };
const NEEDED = { mpnn: 11, pooling: 3 }; // distances from the under-reaching slide
const kx = (k) => AXIS.x0 + ((AXIS.x1 - AXIS.x0) * k) / AXIS.max;

/** Cursor on the layer axis: vertical line, dot and label above. */
function cursor(root, layer, color, html, top) {
  const group = svg(layer, "g");
  svg(group, "line", { x1: kx(0), y1: top + 40, x2: kx(0), y2: AXIS.y, style: `stroke: ${color}; stroke-width: 4` });
  svg(group, "circle", { cx: kx(0), cy: AXIS.y, r: 15, style: `fill: ${color}; stroke: var(--paper); stroke-width: 4` });
  const text = label(root, html, kx(0), top, 34);
  return { group, text };
}

/** Summary: reach requires layers and layers have a cost, so pooling reduces the number needed. */
export default function depth(root) {
  const heading = title(root, "Résumé");
  const layer = canvas(root);

  // Gradient band: from "safe" (few layers) to "smoothing and squashing" (many).
  const defs = svg(layer, "defs");
  const gradient = svg(defs, "linearGradient", { id: "depth-band", x1: 0, x2: 1, y1: 0, y2: 0 });
  svg(gradient, "stop", { offset: "0", style: "stop-color: var(--green-fill)" });
  svg(gradient, "stop", { offset: "0.35", style: "stop-color: var(--paper)" });
  svg(gradient, "stop", { offset: "1", style: "stop-color: var(--red-fill)" });
  const band = svg(layer, "rect", {
    x: AXIS.x0, y: BAND.top, width: AXIS.x1 - AXIS.x0, height: BAND.bottom - BAND.top, rx: 14,
    style: "fill: url(#depth-band); stroke: var(--line); stroke-width: 2",
  });
  const axis = svg(layer, "line", { x1: AXIS.x0, y1: AXIS.y, x2: AXIS.x1 + 30, y2: AXIS.y, "marker-end": "url(#arrow-head)", style: "stroke: var(--ink); stroke-width: 3" });
  const ticks = Array.from({ length: AXIS.max + 1 }, (_, k) => {
    const mark = svg(layer, "line", { x1: kx(k), y1: AXIS.y - 8, x2: kx(k), y2: AXIS.y + 8, style: "stroke: var(--ink); stroke-width: 2" });
    return [mark, label(root, String(k), kx(k), AXIS.y + 36, 30, "abs muted")];
  }).flat();
  const axisName = label(root, `nombre de couches ${tex("K")} = portée en sauts`, (AXIS.x0 + AXIS.x1) / 2, AXIS.y + 92, 34);

  const risks = [
    label(root, "<span class='c-red'>oversmoothing ↑</span>", kx(8.4), BAND.top + 50, 34),
    label(root, "<span class='c-red'>oversquashing ↑</span>", kx(8.4), BAND.top + 100, 34),
  ];
  const safe = label(root, "<span class='c-green'>embeddings distincts et<br>des chemins courts</span>", kx(1.9), BAND.top + 75, 34);
  safe.style.textAlign = "center";

  const mpnn = cursor(root, layer, "var(--ink)", `MPNN : ${tex(String.raw`K \geq d(s, t) = 11`)}`, BAND.top - 50);
  const pooled = cursor(root, layer, COLORS[0], `<span class="c-blue">MPNN + pooling : ${tex("K = 3")}</span>`, BAND.top + 170);

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(axis, { attr: { x2: AXIS.x0 }, duration: 0.9, ease: "power3.inOut" }, "<0.2");
  tl.from(ticks, { opacity: 0, y: 8, duration: 0.4, stagger: 0.03 }, "<0.3");
  tl.from(axisName, { opacity: 0, y: 10, duration: 0.6 }, "<0.3");
  tl.from(band, { opacity: 0, duration: 0.8 }, "<");
  tl.from(safe, { opacity: 0, x: -14, duration: 0.6 }, "<0.3");
  tl.from(risks, { opacity: 0, x: 14, duration: 0.6, stagger: 0.12 }, "<0.1");
  pause(tl);

  // Without pooling, the reach requires many layers.
  tl.from([mpnn.group, mpnn.text], { opacity: 0, duration: 0.4 });
  tl.to([mpnn.group, mpnn.text], { x: kx(NEEDED.mpnn) - kx(0), duration: 1.6, ease: "power3.inOut" }, "<0.1");
  tl.to(risks, { scale: 1.12, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut", stagger: 0.1 }, ">-0.1");
  pause(tl);

  // With pooling, the same information is reached in 3 layers.
  tl.from([pooled.group, pooled.text], { opacity: 0, duration: 0.4 });
  tl.to([pooled.group, pooled.text], { x: kx(NEEDED.pooling) - kx(0), duration: 1.1, ease: "power3.inOut" }, "<0.1");
  tl.to(safe, { scale: 1.08, transformOrigin: "50% 50%", duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut" }, ">-0.1");

  pause(tl);
  return tl;
}
