import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, tex, title } from "deck/components.js";
import { no } from "../helpers.js";

/** Notations, simplification rules and De Morgan's laws used throughout the correction. */
export default function reminders(root) {
  const heading = title(root, "Rappels d'algèbre de Boole");
  const notations = box(root, {
    x: 100, y: 170, w: 840, color: 0,
    title: "Notations et formes canoniques",
    html: `${tex(no("a"))}&nbsp;: NOT a, &nbsp; ${tex("a\\cdot b")}&nbsp;: a AND b, &nbsp; ${tex("a+b")}&nbsp;: a OR b.
      <p style="margin: 14px 0 6px"><b>Somme de produits</b>&nbsp;: un produit par ligne où la fonction vaut 1,
      variables à 0 complémentées. Ligne ${tex("010")}&nbsp;: ${tex(`${no("a")}\\,b\\,${no("c")}`)}.</p>
      <p style="margin: 6px 0 0"><b>Produit de sommes</b>&nbsp;: une somme par ligne où la fonction vaut 0,
      variables à 1 complémentées. Ligne ${tex("010")}&nbsp;: ${tex(`(a+${no("b")}+c)`)}.</p>`,
  });
  const morgan = box(root, {
    x: 100, y: 720, w: 840, color: 2,
    title: "Lois de De Morgan",
    html: tex(`${no("x+y")} = ${no("x")}\\cdot${no("y")} \\qquad ${no("x\\cdot y")} = ${no("x")}+${no("y")}`, true),
  });
  const rules = box(root, {
    x: 1000, y: 170, w: 820, color: 1,
    title: "Simplifications (deux colonnes duales)",
    html: `<div class="tight">${tex(`\\begin{aligned}
      x + ${no("x")} &= 1 & x\\cdot ${no("x")} &= 0 \\\\
      x + x &= x & x\\cdot x &= x \\\\
      x + x\\,y &= x & x\\,(x+y) &= x \\\\
      x\\,y + x\\,${no("y")} &= x & (x+y)(x+${no("y")}) &= x \\\\
      x + ${no("x")}\\,y &= x + y & x\\,(${no("x")}+y) &= x\\,y
    \\end{aligned}`, true)}${tex("x\\,(y+z) = x\\,y + x\\,z \\qquad x + y\\,z = (x+y)(x+z)", true)}</div>`,
  });
  const gates = box(root, {
    x: 1000, y: 720, w: 820, color: 0,
    title: "NAND et NOR",
    html: `${tex(`\\text{NAND}(x,y) = ${no("x\\,y")}`)}, &nbsp; ${tex(`\\text{NOR}(x,y) = ${no("x+y")}`)}
      <p style="margin: 10px 0 0">Une porte NOT s'obtient en reliant les deux entrées&nbsp;: ${tex(`${no("x")} = \\text{NAND}(x,x) = \\text{NOR}(x,x)`)}.</p>`,
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(notations, { opacity: 0, y: 30, duration: 0.8 }, "<0.2");
  pause(tl);
  tl.from(rules, { opacity: 0, x: 30, duration: 0.8 });
  pause(tl);
  tl.from([morgan, gates], { opacity: 0, y: 30, duration: 0.8, stagger: 0.15 });
  pause(tl);
  return tl;
}
