import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { c, code, grid, points, subtitle } from "../helpers.js";

const VALUES = [[1, 2, 3, 4], [4, 5, 6, 7], [7, 8, 9, 10]];
const CELL = 64;
const STRIP = { x: 1050, y: 880 };

/** int tab[3][4]: the 3 × 4 grid unrolls into one row of memory, row after row, and the addresses follow. */
export default function matrix2d(root) {
  const heading = title(root, "Les pointeurs : les tableaux à plusieurs dimensions");
  const sub = subtitle(root, "Un exemple pour mieux comprendre la suite");
  const items = points(root, [
    "Dans un tableau à deux dimensions, les éléments sont stockés <b>ligne par ligne</b>.",
    `On suppose ici ${c("sizeof(int) = 4")} et que ${c("tab")} commence à l'adresse ${c("0xbff115d0")}.`,
  ], { x: 80, y: 215, w: 1760, size: 30, gap: 4 });
  const program = code(root, `
    #include <stdio.h>
    int main(void)
    {
      int tab[3][4] = {{1,2,3,4},
        {4,5,6,7},
        {7,8,9,10}};
      printf("tab=%p\\n", (void *)tab);
      printf("tab[0]=%p\\n", (void *)tab[0]);
      printf("tab[1]=%p\\n", (void *)tab[1]);
      printf("tab[2]=%p\\n", (void *)tab[2]);
      printf("&tab[0][0]=%p\\n", (void *)&tab[0][0]);
      printf("&tab[1][1]=%p\\n", (void *)&tab[1][1]);
      printf("&tab[2][2]=%p\\n", (void *)&tab[2][2]);
      return 0;
    }`, { x: 80, y: 330, w: 890, size: 24, lh: 1.36, pad: 10 });
  const keep = div(root, "abs", {
    x: 80, y: 900, w: 890,
    html: `<span class='c-red'>À retenir :</span> ${c("tab")} et ${c("tab[0]")} donnent ici la même adresse, mais n'ont pas le même type après conversion en pointeur.`,
    style: { fontSize: "27px", whiteSpace: "normal", lineHeight: 1.3 },
  });

  const expressions = ["tab", "tab[0]", "tab[1]", "tab[2]", "&tab[0][0]", "&tab[1][1]", "&tab[2][2]"];
  const table = grid(root, {
    x: 1050, y: 360, cols: [250, 250], size: 27, rowH: 52, caption: "<b>Quelles adresses ?</b>",
    head: ["expression", "adresse"],
    rows: expressions.map((e, k) => [e, k ? "<span class='c-red'>?</span>" : "0xbff115d0"]),
  });
  const question = div(root, "abs muted", { x: 1050, y: 790, w: 790, html: "<i>Question : quelles sont les autres adresses affichées ?</i>", style: { fontSize: "26px" } });

  // The grid, then the same cells in one row of memory.
  const cells = VALUES.flatMap((row, i) =>
    row.map((v, j) =>
      div(root, "abs mono", {
        x: STRIP.x + j * CELL + i * 4 * CELL, y: STRIP.y, w: CELL, h: CELL, html: `${v}`,
        style: {
          boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px",
          border: "2px solid var(--blue)", background: ["var(--blue-fill)", "var(--green-fill)", "var(--red-fill)"][i],
        },
      }),
    ),
  );
  const starts = ["0xbff115d0", "0xbff115e0", "0xbff115f0"].map((a, i) =>
    div(root, "abs mono muted", { x: STRIP.x + i * 4 * CELL, y: STRIP.y + CELL + 6, html: a, style: { fontSize: "24px" } }),
  );
  const answers = [
    [1, "0xbff115d0", false], [2, "0xbff115e0", true], [3, "0xbff115f0", true], [4, "0xbff115d0", false],
  ];
  const later = [[5, "0xbff115e4", 5], [6, "0xbff115f8", 10]];

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items, { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, "<0.2");
  pause(tl);
  tl.from(program.node, { opacity: 0, y: 16, duration: 0.6 });
  tl.from([table.caption, table.node, question], { opacity: 0, y: 16, duration: 0.5, stagger: 0.08 }, "<0.2");
  pause(tl);

  // Grid view first (rows stacked), then each row slides to its place in memory.
  program.focus(tl, 3, 5);
  tl.to(question, { opacity: 0, duration: 0.3 }, "<");
  cells.forEach((cell, k) => {
    const i = Math.floor(k / 4);
    gsap.set(cell, { x: 1576 - STRIP.x - i * 4 * CELL, y: 420 + i * (CELL + 10) - STRIP.y });
  });
  tl.from(cells, { opacity: 0, scale: 0.6, duration: 0.4, stagger: 0.03, ease: "back.out(2)" }, "<0.2");
  tl.to(cells, { x: 0, y: 0, duration: 1, ease: "power3.inOut", stagger: { each: 0.15, from: "start", grid: [3, 4], axis: "y" } }, ">0.3");
  tl.from(starts, { opacity: 0, y: -8, duration: 0.4, stagger: 0.1 }, ">-0.2");
  pause(tl);

  program.focus(tl, 7, 11);
  answers.forEach(([r, address, red], k) => table.set(tl, r, 1, address, k ? "<0.1" : ">", { cls: red ? "c-red" : "" }));
  tl.to(starts.slice(1), { color: "var(--red)", duration: 0.4 }, "<");
  pause(tl);
  program.focus(tl, 12, 13);
  later.forEach(([r, address, index]) => {
    table.set(tl, r, 1, address, ">-0.3");
    tl.to(cells[index], { borderColor: "var(--red)", borderWidth: 4, color: "var(--red)", fontWeight: 700, duration: 0.4 }, "<");
  });
  pause(tl);
  program.unfocus(tl);
  tl.from(keep, { opacity: 0, y: 12, duration: 0.6 }, "<");
  pause(tl);
  return tl;
}
