import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";

/** Page de titre : remplacer par la première idée visuelle de la présentation. */
export default function cover(root) {
  const heading = title(root, "{{title}}", 430);
  const rule = div(root, "abs", {
    x: 760, y: 540, w: 400, h: 3,
    style: { background: "var(--blue)", borderRadius: "2px" },
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.9 });
  tl.from(rule, { scaleX: 0, duration: 0.8, ease: "power3.inOut" }, "<0.2");
  pause(tl);
  return tl;
}
