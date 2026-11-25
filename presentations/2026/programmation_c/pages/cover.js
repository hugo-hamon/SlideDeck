import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { cover as page } from "deck/components.js";

/** Title page, as in the Beamer version: course, author, year, lecture number and logo. */
export default function cover(root) {
  const node = page(root, {
    title: "Programmation C",
    subtitle: "Cours 4",
    author: "Sébastien Adam",
    institute: "Cours de Licence 2 EEEA · 2025-2026",
  });
  const logo = document.createElement("img");
  logo.src = "assets/logo_ur.jpg";
  logo.alt = "Université de Rouen";
  logo.style.height = "96px";
  logo.style.marginTop = "28px";
  node.appendChild(logo);

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(node.children, { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 });
  pause(tl);
  return tl;
}
