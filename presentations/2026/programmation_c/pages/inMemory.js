import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { layer, pointer, subtitle } from "../helpers.js";
import { memoryColumn, variableFrame } from "./why.js";

const CELL = { x: 780, y: 290, w: 240, h: 66 };
const P = { y: 760, h: 110 };

/** A pointer is a variable too: p lives at 2000…2007 in the same memory and holds 1000, the address of i. */
export default function pointerInMemory(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Un pointeur est lui aussi une variable en mémoire");
  const caption = div(root, "abs", { x: CELL.x - 130, y: 220, w: CELL.w + 130, html: "<b>Une seule mémoire</b>", style: { fontSize: "30px", textAlign: "center" } });
  const columns = [
    div(root, "abs muted", { x: CELL.x - 140, y: 255, w: 120, html: "Adresse", style: { fontSize: "24px", textAlign: "right" } }),
    div(root, "abs muted", { x: CELL.x, y: 255, w: CELL.w, html: "Contenu", style: { fontSize: "24px", textAlign: "center" } }),
  ];
  const memory = memoryColumn(root, { ...CELL, values: ["78", "56", "34", "12", "'A'", "–"] });
  const dots = div(root, "abs muted", { x: CELL.x, y: memory.top(6) + 4, w: CELL.w, html: "⋮", style: { fontSize: "44px", textAlign: "center" } });
  const i = variableFrame(root, {
    x: CELL.x, y: memory.top(0), w: CELL.w, h: 4 * CELL.h, color: "var(--blue)",
    lines: ["<b class='mono'>int i</b>", "valeur : <span class='mono'>0x12345678</span>", "<span class='muted'>adresse : <span class='mono'>1000</span></span>"],
  });
  const ch = variableFrame(root, {
    x: CELL.x, y: memory.top(4), w: CELL.w, h: CELL.h, color: "var(--green)",
    lines: ["<b class='mono'>char c</b>", "<span class='muted'>adresse : <span class='mono'>1004</span></span>"],
  });

  // p: eight bytes drawn as one block, holding the address of i.
  const pCell = div(root, "abs mono", {
    x: CELL.x, y: P.y, w: CELL.w, h: P.h,
    style: { boxSizing: "border-box", border: "2px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", fontWeight: 700, color: "var(--red)" },
  });
  const pValue = div(pCell, "", { html: "1000" });
  const pAddress = div(root, "abs mono", { x: CELL.x - 250, y: P.y, w: 230, h: P.h, html: "2000 à 2007", style: { fontSize: "26px", lineHeight: `${P.h}px`, textAlign: "right" } });
  const p = variableFrame(root, {
    x: CELL.x, y: P.y, w: CELL.w, h: P.h, color: "var(--red)",
    lines: ["<b>pointeur sur entier <span class='mono'>p</span></b>", "<span class='muted'>adresse de <span class='mono'>p</span> : <span class='mono'>2000</span></span>", "<span class='value'>valeur de <span class='mono'>p</span> : <span class='mono'>1000</span></span>"],
  });
  const pValueLine = p.text.querySelector(".value");
  const pAddressLine = p.text.querySelectorAll("span.muted")[0];

  const svgLayer = layer(root);
  const right = CELL.x + CELL.w;
  const arrow = pointer(svgLayer, [
    [CELL.x + CELL.w / 2, P.y + P.h + 4], [CELL.x + CELL.w / 2, P.y + P.h + 50], [1640, P.y + P.h + 50], [1640, memory.top(0) + 30], [right + 8, memory.top(0) + 30],
  ], { width: 5 });
  const tag = div(root, "abs", { x: 1640, y: 560, html: "<b><span class='mono'>p</span> pointe <span class='mono'>i</span></b>", style: { fontSize: "32px", color: "var(--red)", background: "var(--paper)", padding: "6px 10px" } });
  gsap.set(tag, { xPercent: -50, yPercent: -50 });
  const foot = div(root, "abs muted", {
    x: 80, y: 960, w: 1760,
    html: "<i>Adresses fictives ; <span class='mono'>int</span> de 4 octets, pointeur de 8 octets. On affiche la valeur globale de <span class='mono'>p</span>, sans détailler ses huit octets. L'entier <span class='mono'>i</span> est représenté en little-endian.</i>",
    style: { fontSize: "24px", whiteSpace: "normal" },
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from([caption, ...columns, ...memory.cells, ...memory.addresses, dots], { opacity: 0, y: 12, duration: 0.5, stagger: 0.02 }, "<0.2");
  tl.from([i.frame, i.text, ch.frame, ch.text], { opacity: 0, x: -12, duration: 0.5, stagger: 0.08 }, "<0.3");
  tl.from(foot, { opacity: 0, duration: 0.5 }, "<0.2");
  pause(tl);

  gsap.set(pValueLine, { opacity: 0 });
  gsap.set(pValue, { opacity: 0 });
  tl.from([pCell, pAddress], { opacity: 0, y: 20, duration: 0.6 });
  tl.from(p.frame, { opacity: 0, scale: 1.05, duration: 0.5 }, "<0.2");
  tl.from(p.text, { opacity: 0, x: -12, duration: 0.5 }, "<0.1");
  pause(tl);

  tl.to(pValue, { opacity: 1, duration: 0.01 });
  tl.from(pValue, { scale: 0.4, duration: 0.6, ease: "back.out(2)" }, "<");
  arrow.draw(tl, ">-0.1", 1.1);
  tl.from(tag, { opacity: 0, scale: 0.7, duration: 0.5, ease: "back.out(2)" }, "<0.5");
  tl.to(i.frame, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.inOut" }, ">-0.1");
  pause(tl);

  // The key distinction: the address of p (2000) is not its value (1000).
  tl.to(pValueLine, { opacity: 1, duration: 0.5 });
  tl.to([pAddressLine, pAddress], { color: "var(--blue)", duration: 0.4 }, "<");
  tl.to(pAddressLine, { fontWeight: 700, duration: 0.01 }, "<");
  tl.fromTo(pValue, { scale: 1 }, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, "<0.2");
  pause(tl);
  return tl;
}
