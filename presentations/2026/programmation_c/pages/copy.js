import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { c, code, grid, layer, pointer, subtitle } from "../helpers.js";

const ROWS = [
  ["i", "4831836000", "3"],
  ["j", "4831836004", "6"],
  ["p1", "4831835984", ""],
  ["p2", "4831835992", ""],
];

/**
 * Two programs that only differ by their last line: `*p1=*p2` copies an integer,
 * `p1=p2` copies an address. Same table and same arrows in both.
 */
function example(root, last) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Exemple");
  const program = code(root, `
    int main(void)
    {
      int i=3,j=6;
      int *p1,*p2;
      p1=&i;
      p2=&j;
      ${last}
    }`, { x: 100, y: 260, w: 460, size: 32 });
  const table = grid(root, {
    x: 700, y: 280, cols: [130, 290, 290], size: 32, rowH: 80,
    head: ["obj", "adresse", "valeur"],
    rows: ROWS,
  });
  const svgLayer = layer(root);
  const R = table.right(2);
  const route = (from, to, dx, dy = 0) => [[R + 6, table.cy(from)], [R + dx, table.cy(from)], [R + dx, table.cy(to) + dy], [R + 10, table.cy(to) + dy]];
  const a1 = pointer(svgLayer, route(2, 0, 120));
  const a2 = pointer(svgLayer, route(3, 1, 60, -12));
  const tags = [
    div(root, "abs c-red", { x: R + 135, y: table.cy(0) - 20, html: "<span class='mono'>p1</span> pointe <span class='mono'>i</span>", style: { fontSize: "28px" } }),
    div(root, "abs c-red", { x: R + 130, y: table.cy(3) - 20, html: "<span class='mono'>p2</span> pointe <span class='mono'>j</span>", style: { fontSize: "28px" } }),
  ];
  return { heading, sub, program, table, a1, a2, tags, route, svgLayer };
}

/** Declarations, then p1=&i and p2=&j (common to both examples). */
function start(tl, { heading, sub, program, table, a1, a2, tags }) {
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(program.node, { opacity: 0, y: 20, duration: 0.6 }, "<0.2");
  tl.from(table.node, { opacity: 0, y: 20, duration: 0.6 }, "<0.1");
  program.focus(tl, 2, 3, ">-0.2");
  pause(tl);
  program.focus(tl, 4, 5);
  table.set(tl, 2, 2, "4831836000", "<0.2", { cls: "c-blue" });
  a1.draw(tl, ">-0.3");
  tl.from(tags[0], { opacity: 0, x: -10, duration: 0.4 }, "<0.3");
  table.set(tl, 3, 2, "4831836004", ">-0.2", { cls: "c-blue" });
  a2.draw(tl, ">-0.3");
  tl.from(tags[1], { opacity: 0, x: -10, duration: 0.4 }, "<0.3");
  pause(tl);
}

/** A copy of a value cell that slides onto another cell, then the target value is replaced. */
function carry(tl, root, table, from, to, html, position) {
  const ghost = div(root, "abs mono c-red", { x: table.cx(2), y: table.cy(from), html, style: { fontSize: "32px", fontWeight: 700 } });
  gsap.set(ghost, { xPercent: -50, yPercent: -50, opacity: 0 });
  tl.to(ghost, { opacity: 1, scale: 1.2, duration: 0.3 }, position);
  tl.to(ghost, { y: table.cy(to) - table.cy(from), duration: 0.8, ease: "power3.inOut" }, ">");
  tl.to(ghost, { opacity: 0, duration: 0.2 }, ">");
  table.set(tl, to, 2, html, "<");
}

export function copyValue(root) {
  const parts = example(root, "*p1=*p2;");
  const { program, table, tags } = parts;
  const lesson = div(root, "abs", { x: 700, y: 760, w: 1140, html: `${c("*p1=*p2")} : on copie <b>une valeur entière</b> (celle de ${c("j")} dans ${c("i")}).`, style: { fontSize: "34px", whiteSpace: "normal" } });
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  start(tl, parts);
  program.focus(tl, 6);
  tl.to([parts.a2.path, parts.a2.head, tags[1]], { opacity: 0.3, duration: 0.15, yoyo: true, repeat: 3 }, "<");
  carry(tl, root, table, 1, 0, "6", ">");
  tl.from(lesson, { opacity: 0, y: 16, duration: 0.6 }, ">0.1");
  pause(tl);
  return tl;
}

export function copyAddress(root) {
  const parts = example(root, "p1=p2;");
  const { program, table, tags, a1, route } = parts;
  const R = table.right(2);
  const lesson = div(root, "abs", { x: 700, y: 760, w: 1140, html: `${c("p1=p2")} : on copie <b>une adresse</b>, ${c("i")} et ${c("j")} sont inchangés.`, style: { fontSize: "34px", whiteSpace: "normal" } });
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  start(tl, parts);
  program.focus(tl, 6);
  carry(tl, root, table, 3, 2, "4831836004", ">0.1");
  a1.move(tl, route(2, 1, 120, 12), "<", 0.8);
  const moved = div(root, "abs c-red", { x: R + 135, y: table.cy(1) - 20, html: "<span class='mono'>p1</span> pointe <span class='mono'>j</span>", style: { fontSize: "28px" } });
  tl.to(tags[0], { opacity: 0, duration: 0.2 }, "<");
  tl.from(moved, { opacity: 0, duration: 0.4 }, ">0.3");
  pause(tl);
  tl.from(lesson, { opacity: 0, y: 16, duration: 0.6 });
  pause(tl);
  return tl;
}
