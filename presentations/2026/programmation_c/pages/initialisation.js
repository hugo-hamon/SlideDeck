import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { box, c, code, layer, pointer, points, subtitle } from "../helpers.js";

/** Dereferencing an uninitialised pointer (undefined behaviour) next to a pointer set to &i. */
export function initialisation(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Initialisation des pointeurs");
  const intro = points(root, ["Avant de déréférencer un pointeur avec l'opérateur <b class='mono'>*</b>, celui-ci doit désigner un objet valide et accessible."], { x: 80, y: 220, w: 1760, size: 34 });
  const svgLayer = layer(root);

  // Wrong program: p1 holds an unknown address.
  const badTitle = div(root, "abs c-red", { x: 80, y: 320, w: 840, html: "<b>Programme incorrect</b>", style: { fontSize: "34px", textAlign: "center" } });
  const bad = code(root, `
    int main(void)
    {
      int *p1;
      *p1 = 3;
      return 0;
    }`, { x: 80, y: 380, w: 400, size: 28 });
  const badP = box(root, { x: 560, y: 440, name: "p1", value: "?", color: "var(--red)" });
  const unknown = box(root, { x: 560, y: 640, w: 300, value: "???", color: "var(--ink-soft)" });
  unknown.node.style.borderStyle = "dashed";
  const badArrow = pointer(svgLayer, [[635, 506], [635, 560], [710, 560], [710, 636]], { color: "var(--red)" });
  const crash = div(root, "abs c-red", { x: 870, y: 652, html: "✗", style: { fontSize: "48px", fontWeight: 700 } });
  const badPoints = points(root, [
    "<span class='alert'>Comportement indéfini !</span>",
    `${c("p1")} n'est pas initialisé.`,
    "Risque d'erreur de segmentation, mais ce n'est pas systématique.",
  ], { x: 80, y: 760, w: 840, size: 30, gap: 8 });

  // Right program: p1 = &i.
  const goodTitle = div(root, "abs ok", { x: 1000, y: 320, w: 840, html: "<b>Programme correct</b>", style: { fontSize: "34px", textAlign: "center" } });
  const good = code(root, `
    int main(void)
    {
      int i;
      int *p1 = &i;
      *p1 = 3;
      return 0;
    }`, { x: 1000, y: 380, w: 420, size: 28 });
  const goodP = box(root, { x: 1520, y: 440, name: "p1", value: "&amp;i", color: "var(--red)" });
  const goodI = box(root, { x: 1520, y: 640, name: "", value: "?", color: "var(--blue)" });
  const iName = div(root, "abs mono c-blue", { x: 1690, y: 650, html: "<b>i</b>", style: { fontSize: "30px" } });
  const goodArrow = pointer(svgLayer, [[1595, 506], [1595, 636]]);
  const goodPoints = points(root, [
    `${c("p1")} contient l'adresse de la variable ${c("i")}.`,
    `${c("*p1 = 3")} modifie la valeur de ${c("i")}.`,
  ], { x: 1000, y: 760, w: 840, size: 30, gap: 8 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(intro, { opacity: 0, x: -24, duration: 0.6 }, "<0.2");
  pause(tl);

  tl.from([badTitle, bad.node], { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 });
  bad.focus(tl, 2, 2, ">-0.2");
  tl.from([badP.node, badP.label], { opacity: 0, scale: 0.8, duration: 0.5, ease: "back.out(2)" }, "<0.1");
  pause(tl);
  bad.focus(tl, 3);
  badArrow.draw(tl, "<0.2");
  tl.from(unknown.node, { opacity: 0, duration: 0.4 }, "<0.3");
  tl.from(crash, { opacity: 0, scale: 0.3, duration: 0.5, ease: "back.out(3)" }, ">");
  tl.fromTo(unknown.node, { x: 0 }, { x: 8, duration: 0.06, repeat: 5, yoyo: true, ease: "none", immediateRender: false }, "<");
  tl.from(badPoints, { opacity: 0, x: -20, duration: 0.5, stagger: 0.12 }, ">0.1");
  pause(tl);

  tl.from([goodTitle, good.node], { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 });
  good.focus(tl, 2, 3, ">-0.2");
  tl.from([goodI.node, iName, goodP.node, goodP.label], { opacity: 0, scale: 0.8, duration: 0.5, stagger: 0.08, ease: "back.out(2)" }, "<0.1");
  goodArrow.draw(tl, ">-0.1");
  tl.from(goodPoints[0], { opacity: 0, x: -20, duration: 0.5 }, "<0.2");
  pause(tl);
  good.focus(tl, 4);
  const three = div(goodI.node, "abs", { x: 0, y: 0, w: 144, h: 58, html: "3", style: { display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", color: "var(--red)", fontWeight: 700 } });
  tl.from(three, { opacity: 0, scale: 0.5, duration: 0.5, ease: "back.out(2)" }, "<0.3");
  tl.from(goodPoints[1], { opacity: 0, x: -20, duration: 0.5 }, "<0.2");
  pause(tl);
  return tl;
}

/** Two ways to get a valid address, and the malloc prototype with a freshly allocated block. */
export function validAddress(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Initialisation des pointeurs");
  const items = points(root, [
    "Deux façons courantes d'obtenir une adresse valide :",
    `- Déclarer une variable, puis récupérer son adresse avec <b class='mono'>&amp;</b>.`,
    `- Allouer dynamiquement une zone mémoire avec la fonction ${c("malloc")}.`,
    `${c("malloc")} est déclarée dans ${c("stdlib.h")}. Elle permet de réserver un bloc mémoire dont la taille est exprimée en octets.`,
    `Prototype : <div style="margin: 14px 0 0 120px">${c("void *malloc(size_t taille);")}</div>`,
    `La fonction retourne l'adresse du bloc alloué, ou ${c("NULL")} en cas d'échec.`,
    "<span class='alert'>Attention :</span> le contenu de la mémoire allouée n'est pas initialisé.",
  ], { x: 80, y: 220, w: 1140, size: 34, gap: 22 });

  // p = malloc(8): a block of 8 bytes whose content is unknown.
  const svgLayer = layer(root);
  const call = div(root, "abs", { x: 1320, y: 400, html: c("p = malloc(8);"), style: { fontSize: "36px" } });
  const p = box(root, { x: 1320, y: 520, w: 170, name: "p", value: "0x2000", color: "var(--red)", size: 28 });
  const cells = Array.from({ length: 8 }, (_, k) =>
    div(root, "abs mono", {
      x: 1580, y: 480 + k * 56, w: 120, h: 56, html: "?",
      style: { boxSizing: "border-box", border: "2px solid var(--blue)", background: "var(--blue-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" },
    }),
  );
  const block = div(root, "abs muted", { x: 1580, y: 940, w: 120, html: "8 octets", style: { fontSize: "24px", textAlign: "center" } });
  const address = div(root, "abs mono muted", { x: 1710, y: 492, html: "0x2000", style: { fontSize: "24px" } });
  const arrow = pointer(svgLayer, [[1490, 552], [1530, 552], [1530, 508], [1578, 508]]);
  cells.forEach((cell) => (cell.innerHTML = "<span>?</span>"));

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items.slice(0, 3), { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, "<0.2");
  pause(tl);
  tl.from(items[3], { opacity: 0, x: -24, duration: 0.6 });
  tl.from(call, { opacity: 0, y: 10, duration: 0.5 }, "<0.2");
  tl.from([...cells, block, address], { opacity: 0, x: 16, duration: 0.4, stagger: 0.03 }, "<0.3");
  pause(tl);
  tl.from(items[4], { opacity: 0, x: -24, duration: 0.6 });
  pause(tl);
  tl.from(items[5], { opacity: 0, x: -24, duration: 0.6 });
  tl.from([p.node, p.label], { opacity: 0, scale: 0.8, duration: 0.5, ease: "back.out(2)" }, "<0.2");
  arrow.draw(tl, ">-0.1");
  pause(tl);
  tl.from(items[6], { opacity: 0, x: -24, duration: 0.6 });
  tl.to(cells.map((cell) => cell.firstChild), { color: "var(--red)", fontWeight: 700, duration: 0.3, stagger: 0.04 }, "<0.2");
  pause(tl);
  return tl;
}
