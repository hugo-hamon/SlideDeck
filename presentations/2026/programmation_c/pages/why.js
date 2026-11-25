import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { points, subtitle } from "../helpers.js";

const CELL = { x: 1340, y: 300, w: 170, h: 74 };
const BYTES = ["78", "56", "34", "12", "'A'", ""];

/** Memory as a column of bytes with their addresses: int i (4 bytes, little endian) and char c. */
export function memoryColumn(root, { x = CELL.x, y = CELL.y, w = CELL.w, h = CELL.h, values = BYTES, from = 1000 } = {}) {
  const cells = values.map((_, i) =>
    div(root, "abs mono", {
      x, y: y + i * h, w, h,
      style: { boxSizing: "border-box", border: "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" },
    }),
  );
  const contents = cells.map((cell, i) => div(cell, "", { html: values[i] }));
  const addresses = values.map((_, i) =>
    div(root, "abs mono muted", { x: x - 110, y: y + i * h, w: 90, h, html: `${from + i}`, style: { fontSize: "26px", lineHeight: `${h}px`, textAlign: "right" } }),
  );
  return { cells, values: contents, addresses, top: (i) => y + i * h };
}

/** A variable drawn as a coloured frame over its bytes, with its name and details on the right. */
export function variableFrame(root, { x, y, w, h, color, lines }) {
  const frame = div(root, "abs", {
    x: x - 3, y: y - 3, w: w + 6, h: h + 6,
    style: { boxSizing: "border-box", border: `4px solid ${color}`, background: `color-mix(in srgb, ${color} 12%, transparent)`, borderRadius: "4px" },
  });
  const text = div(root, "abs", { x: x + w + 24, y: y + h / 2, html: lines.join("<br>"), style: { fontSize: "26px", lineHeight: "34px", color } });
  gsap.set(text, { yPercent: -50 });
  return { frame, text };
}

/** Why pointers: memory is a sequence of addressed bytes, and a variable sits at an address. */
export default function whyPointers(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Pourquoi des pointeurs ?");
  const items = points(root, [
    "En C, les variables peuvent être stockées en mémoire centrale.",
    "- Mémoire centrale : suite d'octets.",
    "- Chaque octet a une adresse.",
    "- Une variable peut occuper un ou plusieurs octets, selon son type. Son adresse correspond au début de la zone mémoire qu'elle occupe.",
    "- Remarque : <b>little</b> vs. big endian : une histoire d'œuf à la coque dans les « voyages de Gulliver ».",
    "- Le compilateur traduit les identificateurs des variables en emplacement en mémoire.",
    "On peut exploiter l'adresse des données, grâce aux pointeurs.",
  ], { x: 80, y: 235, w: 1040, size: 34, gap: 22 });

  const caption = div(root, "abs", { x: CELL.x - 110, y: CELL.y - 60, w: 280 + 110, html: "<b>Exemple de mémoire</b>", style: { fontSize: "28px", textAlign: "center" } });
  const memory = memoryColumn(root);
  const i = variableFrame(root, {
    x: CELL.x, y: memory.top(0), w: CELL.w, h: 4 * CELL.h, color: "var(--blue)",
    lines: ["<span class='mono'><b>int i</b></span>", "valeur : <span class='mono'>0x123456<span class='low'>78</span></span>", "adresse : <span class='mono'>1000</span>"],
  });
  const c = variableFrame(root, {
    x: CELL.x, y: memory.top(4), w: CELL.w, h: CELL.h, color: "var(--green)",
    lines: ["<span class='mono'><b>char c</b></span>", "valeur : <span class='mono'>'A'</span>", "adresse : <span class='mono'>1004</span>"],
  });
  const note = div(root, "abs", {
    x: CELL.x - 110, y: memory.top(6) + 24, w: 520,
    html: "<span class='c-blue mono'>i</span> occupe ici 4 octets.<br>Son adresse est celle du <b>premier octet</b>.",
    style: { fontSize: "26px", whiteSpace: "normal" },
  });
  const low = i.text.querySelector(".low");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items.slice(0, 2), { opacity: 0, x: -24, duration: 0.6, stagger: 0.1 }, "<0.2");
  tl.from([caption, ...memory.cells], { opacity: 0, y: 14, duration: 0.5, stagger: 0.05 }, "<0.2");
  gsap.set(memory.values, { opacity: 0 });
  pause(tl);

  tl.from(items[2], { opacity: 0, x: -24, duration: 0.6 });
  tl.from(memory.addresses, { opacity: 0, x: 16, duration: 0.4, stagger: 0.05 }, "<0.1");
  pause(tl);

  tl.from(items[3], { opacity: 0, x: -24, duration: 0.6 });
  tl.to(memory.values.slice(0, 4), { opacity: 1, duration: 0.3, stagger: 0.08 }, "<0.2");
  tl.from(i.frame, { opacity: 0, scale: 1.06, duration: 0.5 }, "<0.2");
  tl.from(i.text, { opacity: 0, x: -16, duration: 0.5 }, "<0.1");
  tl.to(memory.values[4], { opacity: 1, duration: 0.3 }, ">0.2");
  tl.from(c.frame, { opacity: 0, scale: 1.06, duration: 0.5 }, "<0.1");
  tl.from(c.text, { opacity: 0, x: -16, duration: 0.5 }, "<0.1");
  tl.from(note, { opacity: 0, y: 12, duration: 0.5 }, "<0.2");
  pause(tl);

  // Little endian: the low-order byte (78) is stored at the lowest address (1000).
  tl.from(items[4], { opacity: 0, x: -24, duration: 0.6 });
  tl.to([low, memory.values[0]], { color: "var(--red)", fontWeight: 700, duration: 0.3 }, "<0.3");
  tl.fromTo(memory.cells[0], { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, "<");
  pause(tl);

  tl.from(items[5], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  tl.from(items[6], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  return tl;
}
