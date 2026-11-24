import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, tex, title } from "deck/components.js";

/** Content slide: a definition, then an example and a warning (the three theme colours). */
export default function content(root) {
  const heading = title(root, "Une idée par slide");
  const definition = box(root, {
    x: 140, y: 250, w: 800, color: 0,
    title: "Définition",
    html: `Une suite ${tex("(u_n)")} converge vers ${tex("\\ell")} si${tex("\\forall \\varepsilon > 0,\\ \\exists N,\\ \\forall n \\ge N,\\ |u_n - \\ell| \\le \\varepsilon.", true)}`,
  });
  const example = box(root, {
    x: 1010, y: 250, w: 770, color: 1,
    title: "Exemple",
    html: `La suite ${tex("u_n = 1/n")} converge vers ${tex("0")}.`,
  });
  const warning = box(root, {
    x: 1010, y: 560, w: 770, color: 2,
    title: "Attention",
    html: `Une suite bornée ne converge pas forcément&nbsp;: ${tex("(-1)^n")}.`,
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(definition, { opacity: 0, y: 30, duration: 0.8 }, "<0.2");
  pause(tl);
  tl.from(example, { opacity: 0, x: 30, duration: 0.8 });
  pause(tl);
  tl.from(warning, { opacity: 0, x: 30, duration: 0.8 });
  pause(tl);
  return tl;
}
