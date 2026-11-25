import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { c, code, grid, layer, pointer, points, subtitle, terminal } from "../helpers.js";

const VALUES = [1, 2, 6, 0, 7];
const ADDRESSES = ["0xcc18", "0xcc1C", "0xcc20", "0xcc24", "0xcc28", "0xcc2C"];

/** Walking through an array with a pointer: p = tab, then *p and p++ at each iteration. */
export default function arrays(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Pointeurs et tableaux");
  const items = points(root, [
    `Le nom d'un tableau est, dans la plupart des expressions, automatiquement converti en <span class='alert'>pointeur vers son premier élément</span>.`,
    `On peut donc utiliser l'arithmétique des pointeurs pour parcourir un tableau. Ainsi, ${c("p = tab;")} est équivalent à ${c("p = &tab[0];")}.`,
  ], { x: 80, y: 210, w: 1760, size: 29, gap: 8 });

  const program = code(root, `
    #include <stdio.h>
    #define N 5
    int main(void)
    {
      int tab[N] = {1,2,6,0,7};
      int *p;

      for (int i=0; i<N; i++)
        printf("%d\\n", tab[i]);

      p = tab;

      while(p<tab+N){
        printf("%d\\n", *p);
        p++;
      }
      return 0;
    }`, { x: 80, y: 372, w: 620, size: 24, lh: 1.4, pad: 10 });

  const vars = grid(root, {
    x: 760, y: 440, cols: [90, 160, 160], size: 26, rowH: 50, caption: "Variables",
    head: ["obj", "adresse", "valeur"], rows: [["p", "0xcc2c", "?"]],
  });
  const array = grid(root, {
    x: 760, y: 610, cols: [90, 160, 160], size: 26, rowH: 50, caption: "Tableau",
    head: ["obj", "adresse", "type"], rows: [["tab", "0xcc18", "int[5]"]],
  });
  const memory = grid(root, {
    x: 1380, y: 440, cols: [190, 190], size: 26, rowH: 62, caption: "Mémoire",
    head: ["adresse", "contenu"], rows: ADDRESSES.map((a, k) => [a, k < 5 ? `${VALUES[k]}` : "?"]),
  });
  const term = terminal(root, { x: 760, y: 760, w: 560, h: 260, size: 22, command: "./tableau" });

  // p's arrow, from its value cell to the memory row it points to, and a red frame on that row.
  const svgLayer = layer(root);
  const route = (k) => [[vars.right(2) + 4, vars.cy(0)], [1320, vars.cy(0)], [1320, memory.cy(k)], [memory.left(0) - 4, memory.cy(k)]];
  const arrow = pointer(svgLayer, route(0));
  const cursor = div(root, "abs", {
    x: memory.left(0) - 2, y: memory.cy(0) - 31, w: 384, h: 62,
    style: { boxSizing: "border-box", border: "4px solid var(--red)", borderRadius: "4px" },
  });
  const contents = memory.cells.map((row) => row[1].current);

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items[0], { opacity: 0, x: -24, duration: 0.6 }, "<0.2");
  pause(tl);
  tl.from(items[1], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  tl.from(program.node, { opacity: 0, y: 20, duration: 0.6 });
  tl.from([vars.caption, vars.node, array.caption, array.node, memory.caption, memory.node, term.node], { opacity: 0, y: 16, duration: 0.5, stagger: 0.06 }, "<0.2");
  pause(tl);

  // The usual loop with an index.
  program.focus(tl, 7, 8);
  VALUES.forEach((v, k) => {
    tl.to(contents[k], { color: "var(--blue)", fontWeight: 700, duration: 0.15 }, k ? ">0.05" : ">");
    term.print(tl, `${v}`, "<");
    tl.to(contents[k], { color: "var(--ink)", fontWeight: 400, duration: 0.3 }, ">0.1");
  });
  pause(tl);

  // p = tab.
  program.focus(tl, 10);
  vars.set(tl, 0, 2, "0xcc18", "<0.2");
  arrow.draw(tl, ">-0.2");
  tl.from(cursor, { opacity: 0, scale: 1.08, duration: 0.4 }, ">-0.1");
  tl.to(contents[0], { color: "var(--red)", fontWeight: 700, duration: 0.3 }, "<");
  pause(tl);

  // Each iteration: print *p, then p++ moves on by sizeof(int) = 4 bytes.
  VALUES.forEach((v, k) => {
    program.focus(tl, 13);
    term.print(tl, `${v}`, ">0.1");
    program.focus(tl, 14, 14, ">0.2");
    vars.set(tl, 0, 2, ADDRESSES[k + 1].toLowerCase().replace("0xcc1c", "0xcc1C"), "<0.1");
    arrow.move(tl, route(k + 1), "<", 0.6);
    tl.to(cursor, { y: memory.cy(k + 1) - memory.cy(0), duration: 0.6, ease: "power3.inOut" }, "<");
    tl.to(contents[k], { color: "var(--ink)", fontWeight: 400, duration: 0.3 }, "<");
    if (k < 4) tl.to(contents[k + 1], { color: "var(--red)", fontWeight: 700, duration: 0.3 }, "<0.3");
    pause(tl);
  });

  // p == tab + N: the loop stops, and this address is never dereferenced.
  program.focus(tl, 12);
  const end = div(root, "abs c-red", { x: 1380, y: memory.cy(5) + 50, w: 384, html: `${c("p == tab+N")} : fin de la boucle`, style: { fontSize: "26px", textAlign: "center" } });
  tl.from(end, { opacity: 0, y: 10, duration: 0.5 }, "<0.2");
  pause(tl);
  return tl;
}
