import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { bullets, title } from "deck/components.js";

/** Outline: one item per part of the talk. */
export default function outline(root) {
  const heading = title(root, "Plan");
  const items = bullets(root, ["Contexte et motivation", "Définitions et notations", "Résultat principal", "Expériences et conclusion"], {
    x: 220, y: 300, w: 1480,
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(items, { opacity: 0, x: -30, duration: 0.7, stagger: 0.06 }, "<0.2");
  pause(tl);
  return tl;
}
