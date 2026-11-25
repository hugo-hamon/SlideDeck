import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { code, grid, layer, pointer, points, subtitle, terminal } from "../helpers.js";

/** The & and * operators, then the example program run line by line. */
export default function operators(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Manipulation des pointeurs");
  const items = points(root, [
    "Deux opérateurs sont disponibles pour la manipulation des pointeurs :",
    "- L'opérateur <b class='mono'>&amp;</b> permet d'obtenir l'adresse d'une variable.",
    "- L'opérateur <b class='mono'>*</b>, appelé <b>opérateur de déréférencement</b>, permet d'accéder à l'objet situé à l'adresse contenue dans un pointeur.",
  ], { x: 80, y: 220, w: 1760, size: 32, gap: 14 });

  const program = code(root, `
    #include <stdio.h>
    int main(void)
    {
      int i = 3;
      int *p ;
      p = &i;
      printf("Adresse contenue dans p : %p\\n", (void *)p);
      printf("Valeur de l'entier pointe : %d\\n", *p);
      return 0;
    }`, { x: 80, y: 470, w: 1010, size: 25 });

  const question = div(root, "abs", {
    x: 1150, y: 470, w: 690,
    html: "On suppose les variables <span class='mono'>i</span> et <span class='mono'>p</span> stockées respectivement aux adresses <span class='mono'>0x1000</span> et <span class='mono'>0x2000</span>. Qu'affiche ce programme ?",
    style: { fontSize: "28px", whiteSpace: "normal", lineHeight: 1.3 },
  });
  const table = grid(root, {
    x: 1150, y: 640, cols: [110, 200, 200], size: 26, rowH: 50,
    head: ["obj", "adresse", "valeur"],
    rows: [["i", "0x1000", ""], ["p", "0x2000", ""]],
  });
  const svgLayer = layer(root);
  const R = table.right(2);
  const arrow = pointer(svgLayer, [[R + 6, table.cy(1)], [R + 60, table.cy(1)], [R + 60, table.cy(0)], [R + 10, table.cy(0)]]);
  const term = terminal(root, { x: 1150, y: 830, w: 690, h: 180, size: 22 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items.slice(0, 2), { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, "<0.2");
  pause(tl);
  tl.from(items[2], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  tl.from(program.node, { opacity: 0, y: 20, duration: 0.7 });
  tl.from(question, { opacity: 0, x: 20, duration: 0.6 }, "<0.2");
  pause(tl);

  // Execution.
  tl.from([table.node, term.node], { opacity: 0, y: 16, duration: 0.5, stagger: 0.1 });
  program.focus(tl, 3, 3, "<");
  table.set(tl, 0, 2, "3", "<0.3");
  pause(tl);
  program.focus(tl, 4);
  table.set(tl, 1, 2, "?", "<0.2", { cls: "muted" });
  pause(tl);
  program.focus(tl, 5);
  table.set(tl, 1, 2, "0x1000", "<0.2");
  arrow.draw(tl, ">-0.2");
  pause(tl);
  program.focus(tl, 6);
  tl.to(table.cells[1][2], { backgroundColor: "var(--blue-soft)", duration: 0.3 }, "<");
  term.print(tl, "Adresse contenue dans p : 0x1000", ">0.1");
  tl.to(table.cells[1][2], { backgroundColor: "transparent", duration: 0.4 }, ">0.2");
  pause(tl);
  program.focus(tl, 7);
  tl.to([arrow.path, arrow.head], { opacity: 0.25, duration: 0.15, yoyo: true, repeat: 3 }, "<");
  tl.to(table.cells[0][2], { backgroundColor: "var(--blue-soft)", duration: 0.3 }, ">");
  term.print(tl, "Valeur de l'entier pointe : 3", ">0.1");
  tl.to(table.cells[0][2], { backgroundColor: "transparent", duration: 0.4 }, ">0.2");
  pause(tl);
  return tl;
}
