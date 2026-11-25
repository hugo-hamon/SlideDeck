import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, tex, title } from "deck/components.js";
import { c, layer, pointer, points, subtitle } from "../helpers.js";

const COL = { x: 1430, y: 250, w: 190, h: 112 };
const ADDR = ["0x1000", "0x1004", "0x1008", "0x100C", "0x1010", "0x1014"];

/** An int array as a column of 4-byte elements, and pointers drawn as labelled arrows on its right. */
function strip(root, svgLayer) {
  const cells = ADDR.map((address, k) => {
    const last = k === ADDR.length - 1;
    const cell = div(root, "abs mono", {
      x: COL.x, y: COL.y + k * COL.h, w: COL.w, h: COL.h,
      html: last ? "" : `tab[${k}]`,
      style: {
        boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
        border: last ? "2px dashed var(--ink-soft)" : "2px solid var(--blue)", background: last ? "transparent" : "var(--blue-fill)",
      },
    });
    for (let b = 1; b < 4; b++) {
      div(cell, "abs", { x: 0, y: (b * COL.h) / 4, w: 14, h: 0, style: { borderTop: "2px solid var(--blue)", opacity: last ? 0 : 0.6 } });
    }
    const label = div(root, "abs mono muted", { x: COL.x - 150, y: COL.y + k * COL.h - 14, w: 130, html: address, style: { fontSize: "24px", textAlign: "right" } });
    return { cell, label };
  });
  const y = (k) => COL.y + (k + 0.5) * COL.h;
  const tip = COL.x + COL.w + 4;
  /** Pointer `name` at element k: a label and a short arrow; returns { node, arrow, to(tl, k) }. */
  const make = (name, k, color = "var(--red)") => {
    const arrow = pointer(svgLayer, [[tip + 70, y(k)], [tip, y(k)]], { color });
    const node = div(root, "abs mono", { x: tip + 82, y: y(k) - 20, html: name, style: { fontSize: "32px", fontWeight: 700, color } });
    let at = k;
    return {
      node,
      arrow,
      to(tl, j, position, html) {
        arrow.move(tl, [[tip + 70, y(j)], [tip, y(j)]], position, 0.7);
        tl.to(node, { y: (j - k) * COL.h, duration: 0.7, ease: "power3.inOut" }, "<");
        if (html) {
          const next = div(node, "abs", { x: 0, y: 0, html, style: { background: "var(--paper)" } });
          tl.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, "<0.3");
        }
        at = j;
        return tl;
      },
      show(tl, position) {
        tl.from(node, { opacity: 0, x: 16, duration: 0.4 }, position);
        arrow.draw(tl, "<", 0.4);
      },
      get at() { return at; },
    };
  };
  return { cells, make, y };
}

/** Allowed operations on pointers, illustrated on an int array: p + i, p++, q − p, and the bounds. */
export default function arithmetic(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Arithmétique des pointeurs : quelles opérations sur les pointeurs ?");
  const items = points(root, [
    "Les pointeurs ne sont pas des entiers, mais certaines opérations arithmétiques leur sont applicables.",
    "Les opérations autorisées sont :",
    `- L'addition ou la soustraction d'un entier à un pointeur. <span class='alert'>Ces opérations tiennent compte de la taille du type pointé.</span> Si on fait ${c("p = p + i")}, le pointeur avance de ${c("i")} éléments, soit : ${tex("p \\leftarrow p + i \\times \\texttt{sizeof}(*p)", true)}`,
    "- L'incrémentation et la décrémentation (même principe).",
    "- La différence de deux pointeurs situés dans un même tableau ou juste après sa fin. Le résultat est le nombre d'éléments qui les séparent.",
    "- La somme de deux pointeurs n'est pas autorisée.",
    "<span class='alert'>Attention : les déplacements doivent rester dans les limites du tableau (ou juste après son dernier élément).</span>",
  ], { x: 80, y: 225, w: 1180, size: 35, gap: 20 });
  items[2].querySelector(".katex-display").style.margin = "6px 0";

  const svgLayer = layer(root);
  const column = strip(root, svgLayer);
  const p = column.make("p", 0);
  const p2 = column.make("p + 2", 2);
  const q = column.make("q", 4, "var(--green)");
  const hop = div(root, "abs", { x: COL.x + COL.w + 86, y: column.y(2) + 22, html: "+ 2 × 4 octets", style: { fontSize: "26px", color: "var(--red)" } });
  const inc = div(root, "abs", { x: COL.x + COL.w + 86, y: column.y(1) + 22, html: `${c("p++")} : + 4 octets`, style: { fontSize: "26px", color: "var(--red)" } });
  const diff = div(root, "abs", { x: COL.x + COL.w + 60, y: column.y(2) + 40, html: `${c("q - p")} = 3`, style: { fontSize: "32px", color: "var(--green)" } });
  const sum = div(root, "abs", { x: COL.x + COL.w + 60, y: column.y(2) + 100, html: `<s>${c("p + q")}</s> interdit`, style: { fontSize: "34px", color: "var(--red)" } });
  const after = div(root, "abs", { x: COL.x - 10, y: COL.y + 6 * COL.h + 10, w: COL.w + 20, html: "juste après la fin", style: { fontSize: "24px", textAlign: "center", color: "var(--ink-soft)" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items.slice(0, 2), { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, "<0.2");
  tl.from(column.cells.flatMap((e) => [e.cell, e.label]), { opacity: 0, y: 14, duration: 0.5, stagger: 0.03 }, "<0.2");
  tl.from(after, { opacity: 0, duration: 0.4 }, "<0.2");
  p.show(tl, ">-0.2");
  pause(tl);

  // p + 2: two elements further, i.e. 2 × sizeof(int) bytes.
  tl.from(items[2], { opacity: 0, x: -24, duration: 0.6 });
  p2.show(tl, ">0.1");
  tl.from(hop, { opacity: 0, x: 10, duration: 0.4 }, "<0.3");
  pause(tl);

  tl.from(items[3], { opacity: 0, x: -24, duration: 0.6 });
  tl.to([hop, p2.node, p2.arrow.path, p2.arrow.head], { opacity: 0, duration: 0.3 }, "<");
  p.to(tl, 1, ">");
  tl.from(inc, { opacity: 0, x: 10, duration: 0.4 }, "<0.3");
  pause(tl);

  tl.from(items[4], { opacity: 0, x: -24, duration: 0.6 });
  tl.to(inc, { opacity: 0, duration: 0.3 }, "<");
  q.show(tl, "<0.2");
  tl.from(diff, { opacity: 0, y: 10, duration: 0.5 }, ">0.1");
  pause(tl);

  tl.from(items[5], { opacity: 0, x: -24, duration: 0.6 });
  tl.from(sum, { opacity: 0, scale: 0.7, duration: 0.5, ease: "back.out(2)" }, "<0.2");
  pause(tl);

  tl.from(items[6], { opacity: 0, x: -24, duration: 0.6 });
  q.to(tl, 5, "<0.2", "q + 1");
  tl.to(after, { color: "var(--red)", duration: 0.4 }, "<0.3");
  tl.to(column.cells[5].cell, { borderColor: "var(--red)", duration: 0.4 }, "<");
  tl.to(diff, { opacity: 0, duration: 0.3 }, "<");
  pause(tl);
  return tl;
}
