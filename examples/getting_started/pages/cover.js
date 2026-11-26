import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { cover } from "deck/components.js";

/** Title page: its look comes from the theme (deck/themes/). */
export default function title(root) {
  const page = cover(root, {
    title: "SlideDeck in five slides",
    subtitle: "Animated presentations in plain HTML, SVG and JavaScript",
    author: "A short tour of what the tool can do",
    institute: "Press → or Space to move to the next step",
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(page.children, { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 });
  pause(tl);
  return tl;
}
