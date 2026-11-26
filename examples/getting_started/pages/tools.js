import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";

const KEYS = [
  ["s", "Presenter view", "next step, notes, timer"],
  ["g", "Overview", "every slide at a glance"],
  ["p", "Pen", "draw over the slide, l for a laser"],
  ["e", "Edit mode", "annotate slides for your AI agent"],
  ["o", "Options", "export to HTML, PDF or GIF, shortcuts"],
  ["h", "Home page", "edit, duplicate or delete this example"],
];
const MONO = "ui-monospace, 'DejaVu Sans Mono', Menlo, monospace";

/** Everything around the slides, one key each. */
export default function tools(root) {
  const heading = title(root, "Around the slides");
  const tiles = KEYS.map(([key, name, hint], i) => {
    const tile = div(root, "panel", { x: 140 + (i % 3) * 560, y: 250 + Math.floor(i / 3) * 290, w: 520, h: 250 });
    const cap = div(tile, "abs", {
      x: 36, y: 36, w: 84, h: 84, html: key,
      style: {
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontSize: "44px", border: "3px solid var(--ink)", borderRadius: "14px",
        background: "var(--paper)", boxShadow: "0 6px 0 var(--line)",
      },
    });
    div(tile, "abs", { x: 150, y: 50, html: name, style: { fontSize: "40px", fontWeight: "600" } });
    div(tile, "abs", { x: 36, y: 150, w: 450, html: hint, style: { fontSize: "30px", whiteSpace: "normal", color: "var(--ink-soft)" } });
    return { tile, cap };
  });
  const next = div(root, "abs", {
    x: 0, y: 860, w: 1920, html: "Your turn: <b>New presentation</b> on the home page, or duplicate this one.",
    style: { textAlign: "center", fontSize: "36px" },
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(tiles.map((t) => t.tile), { opacity: 0, y: 30, duration: 0.7, stagger: 0.05 }, "<0.2");
  tl.from(tiles.map((t) => t.cap), { scale: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.05 }, "<0.3");
  pause(tl);

  tl.from(next, { opacity: 0, y: 16, duration: 0.7 });
  pause(tl);
  return tl;
}
