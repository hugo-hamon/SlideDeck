import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { canvas, div, label, svg, title } from "deck/components.js";

const CODE = [
  "export default function demo(root) {",
  "  const dot = circle(root);",
  "  const box = square(root);",
  "  const tl = gsap.timeline();",
  "  tl.from(dot, { scale: 0 });",
  "  pause(tl);",
  "  tl.from(box, { x: -300 });",
  "  pause(tl);",
  "  return tl;",
  "}",
];
const PANEL = { x: 120, y: 250, w: 860, h: 600 };
const PAD = 50;
const LINE = 50;
const lineY = (i) => PANEL.y + PAD + i * LINE;
const MONO = "ui-monospace, 'DejaVu Sans Mono', Menlo, monospace";

/** A slide is a function: it draws its content, then a GSAP timeline where pause(tl) marks each click. */
export default function timeline(root) {
  const heading = title(root, "One slide, one timeline");
  const code = div(root, "panel", PANEL);
  const highlight = div(root, "abs", {
    x: PANEL.x + 12, y: lineY(4) - 6, w: PANEL.w - 24, h: LINE,
    style: { background: "var(--blue-fill)", borderLeft: "5px solid var(--blue)", borderRadius: "6px" },
  });
  const lines = CODE.map((text, i) =>
    div(root, "abs", {
      x: PANEL.x + PAD, y: lineY(i), html: text.replace(/ /g, "&nbsp;"),
      style: { fontFamily: MONO, fontSize: "28px", lineHeight: "38px" },
    }),
  );
  const clicks = [5, 7].map((i) => label(root, "← one click", PANEL.x + 520, lineY(i) + 19, 28, "abs c-red"));

  // What the audience sees: the stage, where the two objects appear one click at a time.
  const screen = div(root, "panel", { x: 1060, y: 250, w: 740, h: 600 });
  const caption = label(root, "what the audience sees", 1430, 800, 28, "abs muted");
  const layer = canvas(root);
  const dot = svg(layer, "circle", { cx: 1260, cy: 520, r: 100, style: "fill: var(--blue-fill); stroke: var(--blue); stroke-width: 4" });
  const box = svg(layer, "rect", { x: 1500, y: 420, width: 200, height: 200, rx: 12, style: "fill: var(--green-fill); stroke: var(--green); stroke-width: 4" });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from([code, screen], { opacity: 0, y: 30, duration: 0.8, stagger: 0.12 }, "<0.2");
  tl.from(lines, { opacity: 0, x: -20, duration: 0.6, stagger: 0.04 }, "<0.2");
  tl.from(caption, { opacity: 0, duration: 0.6 }, "<0.3");
  tl.from(highlight, { opacity: 0, duration: 0.5 }, "<");
  pause(tl);

  tl.from(dot, { scale: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "back.out(2)" });
  pause(tl);

  tl.to(highlight, { y: 2 * LINE, duration: 0.6, ease: "power3.inOut" });
  tl.from(box, { x: -300, opacity: 0, duration: 0.9 }, "<0.3");
  pause(tl);

  tl.to(highlight, { opacity: 0, duration: 0.3, ease: "power2.in" });
  tl.from(clicks, { opacity: 0, x: 20, duration: 0.6, stagger: 0.12 }, "<0.1");
  pause(tl);
  return tl;
}
