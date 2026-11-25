import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { c, points, subtitle } from "../helpers.js";

const BIG = { x: 1330, y: 540, size: 72 };
const CH = BIG.size * 0.6;

/** A brace under (or over) characters `from`…`to` of the big declaration, with a label. */
function annotate(root, from, to, { color, html, below = true, drop = 40 }) {
  const x = BIG.x + from * CH;
  const w = (to - from + 1) * CH;
  const y = below ? BIG.y + BIG.size * 1.25 : BIG.y - 14;
  const brace = div(root, "abs", {
    x, y, w, h: drop,
    style: { boxSizing: "border-box", border: `4px solid ${color}`, [below ? "borderTop" : "borderBottom"]: "none", borderRadius: below ? "0 0 10px 10px" : "10px 10px 0 0" },
  });
  if (!below) gsap.set(brace, { y: -drop });
  const text = div(root, "abs", { x: x + w / 2, y: below ? y + drop + 8 : y - drop - 50, html, style: { fontSize: "30px", color } });
  gsap.set(text, { xPercent: -50 });
  return [brace, text];
}

/** Definition of a pointer, with the parts of `int *pt;` labelled one by one. */
export default function definition(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Définitions");
  const items = points(root, [
    "<span class='alert'>Un pointeur est une variable dont la valeur est une adresse</span>",
    "La valeur d'un pointeur peut donc être l'adresse d'un autre objet : l'objet pointé.",
    `Comme toute variable, il doit être déclaré : ${c("type *NomDuPointeur;")}`,
    `Exemple : ${c("int *pt;")} &nbsp; ${c("char *pt;")} &nbsp; ${c("struct etudiant *pt;")}`,
    "Pour la première déclaration :",
    `- ${c("int")} désigne le type de l'objet pointé`,
    `- ${c("pt")} est l'identificateur du pointeur`,
    `- ${c("pt")} est de type ${c("int *")}`,
    "<span class='alert'>Attention : les pointeurs sont typés. Le type pointé détermine notamment les déplacements effectués lors de l'arithmétique des pointeurs.</span>",
  ], { x: 80, y: 230, w: 1120, size: 34, gap: 20 });

  const big = div(root, "abs mono", { x: BIG.x, y: BIG.y, html: "int *pt;", style: { fontSize: `${BIG.size}px`, lineHeight: `${BIG.size * 1.2}px`, fontWeight: 700 } });
  const type = annotate(root, 0, 2, { color: "var(--blue)", html: "type de l'objet pointé" });
  const name = annotate(root, 5, 6, { color: "var(--green)", html: "identificateur", drop: 120 });
  const kind = annotate(root, 0, 4, { color: "var(--red)", html: `type de ${c("pt")} : ${c("int *")}`, below: false });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items[0], { opacity: 0, x: -24, duration: 0.6 }, "<0.2");
  pause(tl);
  tl.from(items[1], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  tl.from(items.slice(2, 4), { opacity: 0, x: -24, duration: 0.6, stagger: 0.15 });
  pause(tl);
  tl.from(items[4], { opacity: 0, x: -24, duration: 0.6 });
  tl.from(big, { opacity: 0, scale: 0.8, duration: 0.7, ease: "back.out(2)" }, "<0.1");
  [type, name, kind].forEach(([brace, text], k) => {
    pause(tl);
    tl.from(items[5 + k], { opacity: 0, x: -24, duration: 0.6 });
    tl.from(brace, { opacity: 0, scaleY: 0, transformOrigin: k === 2 ? "50% 100%" : "50% 0%", duration: 0.5 }, "<0.1");
    tl.from(text, { opacity: 0, y: k === 2 ? 10 : -10, duration: 0.5 }, "<0.2");
  });
  pause(tl);
  tl.from(items[8], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  return tl;
}
