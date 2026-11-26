import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { cover } from "deck/components.js";

/** Title page. */
export default function title(root) {
  const page = cover(root, {
    title: "TD 5 — Fonctions logiques combinatoires",
    subtitle: "Corrigé",
    institute: "L1 Informatique – EEEA · Logique Combinatoire et Séquentielle",
    date: "26/11/2026",
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(page.children, { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 });
  pause(tl);
  return tl;
}
