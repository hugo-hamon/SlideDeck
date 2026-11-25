import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, svg, title } from "deck/components.js";
import { c, code, layer, subtitle } from "../helpers.js";

const BYTE = 44;

/** Bytes from 0x1000 as a row of small cells, grouped by `size` (one group = one pointed object). */
function bytes(root, svgLayer, { x, y, count, size, color }) {
  const groups = [];
  for (let g = 0; g < count / size; g++) {
    const box = div(root, "abs", {
      x: x + g * size * BYTE, y, w: size * BYTE, h: 64,
      style: { boxSizing: "border-box", border: `3px solid ${color}`, background: `color-mix(in srgb, ${color} 10%, transparent)` },
    });
    for (let b = 1; b < size; b++) div(box, "abs", { x: b * BYTE - 1, y: 0, w: 0, h: 58, style: { borderLeft: "1px solid var(--line)" } });
    const address = div(root, "abs mono muted", { x: x + g * size * BYTE, y: y + 72, html: `0x${(0x1000 + g * size).toString(16).toUpperCase().replace("X", "x")}`, style: { fontSize: "24px" } });
    groups.push({ box, address });
  }
  const at = (g) => x + g * size * BYTE + 4;
  const arrows = [0, 1].map((g) =>
    svg(svgLayer, "line", { x1: at(g), y1: y - 60, x2: at(g), y2: y - 8, "marker-end": "url(#ex-head)", style: "stroke: var(--red); stroke-width: 4" }),
  );
  const names = [
    div(root, "abs mono c-red", { x: at(0) - 4, y: y - 104, html: "p1", style: { fontSize: "30px", fontWeight: 700 } }),
    div(root, "abs mono c-red", { x: at(1) - 4, y: y - 104, html: "p2", style: { fontSize: "30px", fontWeight: 700 } }),
  ];
  const jump = svg(svgLayer, "path", {
    d: `M${at(0) + 44},${y - 70} Q${(at(0) + at(1)) / 2},${y - 150} ${at(1) - 20},${y - 70}`,
    style: "fill: none; stroke: var(--red); stroke-width: 3; stroke-dasharray: 8 6",
  });
  const step = div(root, "abs c-red", { x: (at(0) + at(1)) / 2, y: y - 168, html: `+ ${size} octets`, style: { fontSize: "26px" } });
  gsap.set(step, { xPercent: -50 });
  return { groups, arrows, names, jump, step };
}

/** Same program twice, int then double: p1 + 1 moves 4 bytes, then 8 bytes. */
export default function arithmeticExamples(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Exemples");
  const svgLayer = layer(root);
  const marker = svg(svg(svgLayer, "defs"), "marker", { id: "ex-head", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: "auto" });
  svg(marker, "path", { d: "M0,0 L10,5 L0,10 z", style: "fill: var(--red)" });

  const columns = [
    { type: "int", size: 4, color: "var(--blue)", x: 80, count: 12 },
    { type: "double", size: 8, color: "var(--green)", x: 990, count: 16 },
  ].map(({ type, size, color, x, count }, k) => {
    const name = div(root, "abs", { x, y: 215, html: `<b>Exemple ${k + 1} : pointeur sur un ${type}</b>`, style: { fontSize: "30px" } });
    const program = code(root, `
      #include <stdio.h>
      int main(void)
      {
        ${type} i = 3;
        ${type} *p1, *p2;
        p1 = &i;
        p2 = p1 + 1;
        printf("p1 = %p \\t p2 = %p\\n",(void *)p1, (void *)p2);
        return 0;
      }`, { x, y: 268, w: 860, size: 24, lh: 1.4 });
    const question = div(root, "abs", {
      x, y: 656, w: 860,
      html: `On suppose que ${c("p1")} contient l'adresse ${c("0x1000")} et que ${c(`sizeof(${type}) = ${size}`)}. Quelle adresse contiendra ${c("p2")} ?`,
      style: { fontSize: "26px", whiteSpace: "normal", lineHeight: 1.3 },
    });
    const row = bytes(root, svgLayer, { x, y: 900, count, size, color });
    const answer = div(root, "abs mono c-red", { x: x + size * BYTE + 58, y: 796, html: `= 0x${(0x1000 + size).toString(16)}`, style: { fontSize: "30px", fontWeight: 700 } });
    return { name, program, question, row, answer };
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  columns.forEach(({ name, program, question, row, answer }, k) => {
    if (k) pause(tl);
    tl.from([name, program.node], { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, k ? ">" : "<0.2");
    program.focus(tl, 6, 6, ">-0.2");
    tl.from(question, { opacity: 0, y: 10, duration: 0.5 }, "<");
    pause(tl);
    tl.from(row.groups.flatMap((g) => [g.box, g.address]), { opacity: 0, y: 10, duration: 0.4, stagger: 0.03 });
    tl.from([row.arrows[0], row.names[0]], { opacity: 0, y: -10, duration: 0.4 }, "<0.2");
    tl.from([row.jump, row.step], { opacity: 0, duration: 0.5 }, ">");
    tl.from([row.arrows[1], row.names[1]], { opacity: 0, y: -10, duration: 0.4 }, ">-0.1");
    tl.from(answer, { opacity: 0, x: -10, duration: 0.5 }, "<0.2");
  });
  pause(tl);
  return tl;
}
