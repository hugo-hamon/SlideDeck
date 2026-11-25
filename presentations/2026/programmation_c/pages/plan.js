import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";

const SECTIONS = [
  "Généralités",
  "Les types de base",
  "Les constantes",
  "Les fonctions d'entrées-sorties classiques",
  "Les opérateurs en C",
  "Les instructions de contrôle",
  "Les types composés",
  "Les pointeurs",
  "La programmation modulaire et les fonctions",
  "La gestion des fichiers",
  "Les listes chaînées",
  "Les tables de hachage",
];
const TODAY = 7;
const X = 540;
const TOP = 172;
const GAP = 66;
const DIM = 0.28;

/** The twelve sections, with a band that marks the current one and a tick for the past ones. */
function layout(root) {
  const heading = title(root, "Plan");
  const band = div(root, "band", { x: X - 40, y: TOP - 8, w: 940, h: GAP - 6 });
  const rows = SECTIONS.map((name, i) => {
    const y = TOP + i * GAP;
    const row = div(root, "abs", { x: 0, y: 0 });
    div(row, "ball", { x: X, y: y + 6, w: 40, h: 40, html: `${i + 1}`, style: { fontSize: "22px" } });
    div(row, "abs", { x: X + 64, y, html: name, style: { fontSize: "36px", lineHeight: "52px" } });
    const tick = div(row, "abs ok", { x: X - 92, y, html: "✓", style: { fontSize: "40px", lineHeight: "52px", fontWeight: 700 } });
    return { row, tick };
  });
  return { heading, band, rows };
}

/** Moves the band onto section `k`, dims the others and ticks the sections already covered. */
function focus(tl, { band, rows }, k, position) {
  tl.to(band, { y: k * GAP, opacity: 1, duration: 0.6, ease: "power3.inOut" }, position);
  tl.to(rows.map((r) => r.row), { opacity: (i) => (i === k ? 1 : DIM), duration: 0.5, ease: "power2.inOut" }, "<");
  rows.forEach(({ tick }, i) => {
    if (i < k) tl.to(tick, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, "<0.05");
  });
}

/** Outline of the year, then a walk through the sections already covered up to today's one. */
export default function plan(root) {
  const parts = layout(root);
  gsap.set(parts.band, { opacity: 0 });
  gsap.set(parts.rows.map((r) => r.tick), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" });
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(parts.heading, { opacity: 0, duration: 0.5 });
  tl.from(parts.rows.map((r) => r.row), { opacity: 0, x: -30, duration: 0.6, stagger: 0.04 }, "<0.1");
  pause(tl);
  for (let k = 0; k <= TODAY; k++) {
    focus(tl, parts, k);
    pause(tl);
  }
  return tl;
}

/** What comes next: the covered sections are ticked and the band walks through the next four. */
export function upcoming(root) {
  const parts = layout(root);
  gsap.set(parts.rows.map((r) => r.tick), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" });
  parts.rows.forEach(({ row, tick }, i) => {
    gsap.set(row, { opacity: i === TODAY + 1 ? 1 : DIM });
    if (i <= TODAY) gsap.set(tick, { opacity: 1, scale: 1 });
  });
  gsap.set(parts.band, { y: (TODAY + 1) * GAP });
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(parts.heading, { opacity: 0, duration: 0.5 });
  tl.from([parts.band, ...parts.rows.map((r) => r.row)], { opacity: 0, duration: 0.6 }, "<0.1");
  pause(tl);
  for (let k = TODAY + 2; k < SECTIONS.length; k++) {
    focus(tl, parts, k);
    pause(tl);
  }
  return tl;
}
