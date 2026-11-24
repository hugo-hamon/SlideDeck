import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { cover } from "deck/components.js";

/** Title page: its look comes from the theme (deck/themes/). */
export default function title(root) {
  const page = cover(root, {
    title: "{{title}}",
    subtitle: "Sous-titre de la présentation",
    author: "{{author}}",
    institute: "Université, laboratoire",
    date: "{{date}}",
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(page.children, { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 });
  pause(tl);
  return tl;
}
