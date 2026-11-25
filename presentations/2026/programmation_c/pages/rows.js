import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { box, c, captions, code, layer, pointer, points, subtitle } from "../helpers.js";

const K = 5;
/** Horizontal shift of each row: the rows are separate blocks, not contiguous. */
const JITTER = [0, 90, 30, 120, 50];

/** The pointer column (tab[0…4]) and the rows (i+1 ints each), with their arrows. */
function rowsDiagram(root, svgLayer, { px, py, pw, ph, gap, rx, cw, labels = true }) {
  const pointers = Array.from({ length: K }, (_, i) => {
    const y = py + i * gap;
    const cell = div(root, "abs", {
      x: px, y, w: pw, h: ph,
      style: { boxSizing: "border-box", border: "2px solid var(--blue)", background: "var(--blue-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
    });
    const unknown = div(cell, "abs muted", { x: 0, y: 0, w: pw - 4, h: ph - 4, html: "?", style: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" } });
    const known = div(cell, "abs c-blue", { x: 0, y: 0, w: pw - 4, h: ph - 4, html: labels ? `adr. ligne ${i}` : `${c(`tab[${i}]`)}`, style: { display: "flex", alignItems: "center", justifyContent: "center" } });
    const name = labels ? div(root, "abs mono", { x: px - 130, y: y + ph / 2 - 17, w: 115, html: `tab[${i}]`, style: { fontSize: "24px", textAlign: "right" } }) : null;
    return { cell, unknown, known, name, y };
  });
  const rows = pointers.map(({ y }, i) => {
    const x0 = rx + (labels ? JITTER[i] : 0);
    const cells = Array.from({ length: i + 1 }, (_, j) =>
      div(root, "abs mono", {
        x: x0 + j * cw, y, w: cw, h: ph,
        style: { boxSizing: "border-box", border: "2px solid var(--green)", background: "var(--green-fill)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" },
      }),
    );
    const arrow = pointer(svgLayer, [[px + pw + 2, y + ph / 2], [x0 - 4, y + ph / 2]], { color: "var(--blue)", width: 3 });
    return { cells, arrow };
  });
  return { pointers, rows };
}

/** Row-by-row allocation: a block of k pointers first, then one block per row. */
export function rowsAlloc(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Tableaux dynamiques : allocation par lignes");
  const items = points(root, [
    `Une autre façon de gérer les tableaux à plusieurs dimensions : utiliser un <span class='alert'>tableau de pointeurs</span>.`,
    "Chaque pointeur donne accès à une ligne allouée séparément.",
  ], { x: 80, y: 215, w: 1760, size: 31, gap: 4 });
  const steps = captions(root, [
    `<b>Étape 1 :</b> réserver un bloc de ${c("k")} pointeurs. &nbsp; ${c("int **tab = malloc(k * sizeof *tab);")}`,
    `<b>Étape 2 :</b> allouer séparément les entiers de chaque ligne. &nbsp; ${c("tab[i] = malloc((i+1) * sizeof *tab[i]);")}`,
  ], { x: 80, y: 335, w: 1760, size: 30 });

  const headers = ["Variable <span class='mono'>tab</span>", "Tableau de pointeurs", "Lignes indépendantes"].map((html, k) =>
    div(root, "abs muted", { x: [80, 540, 1100][k], y: 410, w: [300, 300, 600][k], html: `<b>${html}</b>`, style: { fontSize: "28px", textAlign: "center" } }),
  );
  const svgLayer = layer(root);
  const tab = box(root, { x: 120, y: 640, w: 200, h: 80, name: "", value: "adr. du bloc", color: "var(--red)", size: 22 });
  const tabName = div(root, "abs mono c-red", { x: 120, y: 590, w: 200, html: "<b>tab</b>", style: { fontSize: "30px", textAlign: "center" } });
  const { pointers, rows } = rowsDiagram(root, svgLayer, { px: 560, py: 470, pw: 260, ph: 66, gap: 82, rx: 1110, cw: 84 });
  const tabArrow = pointer(svgLayer, [[320, 680], [420, 680], [420, 455], [690, 455], [690, 466]]);
  const block = div(root, "abs", { x: 556, y: 466, w: 268, h: 4 * 82 + 74, style: { boxSizing: "border-box", border: "3px solid var(--blue)", borderRadius: "4px" } });

  const notes = captions(root, [
    `<b>Important :</b> le premier ${c("malloc")} ne réserve que les pointeurs. Les lignes n'existent pas encore.`,
    `Chaque ${c("tab[i]")} reçoit l'adresse d'un nouveau bloc. Les lignes ne sont pas nécessairement contiguës en mémoire.`,
    `${c("tab[i]")} contient l'adresse de la ligne ${c("i")}, et ${c("tab[i][j]")} désigne l'entier de colonne ${c("j")} dans cette ligne.`,
  ], { x: 80, y: 900, w: 1760, size: 29 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items, { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, "<0.2");
  pause(tl);

  steps.show(tl, 0);
  tl.from(headers.slice(0, 2), { opacity: 0, y: 10, duration: 0.5, stagger: 0.08 }, "<0.2");
  tl.from([tab.node, tabName], { opacity: 0, scale: 0.8, duration: 0.4, ease: "back.out(2)" }, "<0.2");
  tl.from([block, ...pointers.flatMap((p) => [p.cell, p.name])], { opacity: 0, x: 16, duration: 0.4, stagger: 0.03 }, ">-0.1");
  gsap.set(pointers.map((p) => p.known), { opacity: 0 });
  tabArrow.draw(tl, ">-0.1", 0.8);
  notes.show(tl, 0, "<0.2");
  pause(tl);

  steps.show(tl, 1);
  tl.from(headers[2], { opacity: 0, y: 10, duration: 0.5 }, "<");
  rows.forEach(({ cells, arrow }, i) => {
    tl.from(cells, { opacity: 0, x: 16, duration: 0.35, stagger: 0.04 }, i ? ">-0.15" : ">");
    tl.to(pointers[i].unknown, { opacity: 0, duration: 0.2 }, "<");
    tl.to(pointers[i].known, { opacity: 1, duration: 0.3 }, ">");
    arrow.draw(tl, "<", 0.35);
  });
  notes.show(tl, 1, ">-0.2");
  pause(tl);

  // tab[3] then tab[3][1].
  tl.to(pointers[3].cell, { borderColor: "var(--red)", borderWidth: 4, duration: 0.4 });
  tl.to([rows[3].arrow.path], { stroke: "var(--red)", duration: 0.4 }, "<");
  tl.to([rows[3].arrow.head], { fill: "var(--red)", duration: 0.4 }, "<");
  tl.to(rows[3].cells[1], { background: "var(--red-fill)", borderColor: "var(--red)", borderWidth: 4, duration: 0.4 }, ">0.2");
  const tag = div(root, "abs c-red", { x: 1110 + JITTER[3] + 4 * 84 + 20, y: pointers[3].y + 14, html: `← ${c("tab[3][1]")}`, style: { fontSize: "26px" } });
  tl.from(tag, { opacity: 0, y: 8, duration: 0.4 }, "<0.2");
  notes.show(tl, 2, "<");
  pause(tl);
  return tl;
}

/** The complete program: allocation, tab[3][1] = 42, then freeing every row and the pointers. */
export function rowsExample(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Exemple : un tableau dynamique de cinq lignes");
  const program = code(root, `
    #include <stdlib.h>
    int main(void)
    {
      int k = 5, i, j;
      int **tab = malloc(k * sizeof *tab);
      if (tab == NULL) return 1;

      for (i = 0; i < k; i++) {
        tab[i] = malloc((i+1) * sizeof *tab[i]);
        if (tab[i] == NULL) {
          for (j = 0; j < i; j++) free(tab[j]);
          free(tab);
          return 1;
        }
      }

      tab[3][1] = 42;

      for (i = 0; i < k; i++) free(tab[i]);
      free(tab);
      return 0;
    }`, { x: 80, y: 215, w: 920, size: 24, lh: 1.3, pad: 10 });

  const svgLayer = layer(root);
  const header = div(root, "abs", { x: 1060, y: 220, w: 780, html: "<b>Un tableau de 5 lignes</b>", style: { fontSize: "30px", textAlign: "center" } });
  const { pointers, rows } = rowsDiagram(root, svgLayer, { px: 1080, py: 290, pw: 150, ph: 60, gap: 76, rx: 1320, cw: 90, labels: false });
  gsap.set(pointers.map((p) => p.unknown), { opacity: 0 });
  const answer = div(rows[3].cells[1], "abs", { x: 0, y: 0, w: 86, h: 56, html: "42", style: { display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", fontWeight: 700 } });
  const notes = points(root, [
    `${c("tab[3][1] = 42")} écrit dans le deuxième entier de la ligne 3.`,
    "À la fin : <b>libérer chaque ligne</b>, puis le tableau de pointeurs.",
  ], { x: 1060, y: 700, w: 780, size: 28, gap: 10 });
  const keep = div(root, "abs", { x: 1060, y: 930, w: 780, html: `<b>À retenir :</b> ${c("int **tab")} n'est pas le type d'un tableau déclaré ${c("int tab[3][4]")}.`, style: { fontSize: "26px", whiteSpace: "normal" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(program.node, { opacity: 0, y: 16, duration: 0.6 }, "<0.2");
  tl.from(header, { opacity: 0, duration: 0.5 }, "<0.2");
  pause(tl);
  program.focus(tl, 4, 5);
  tl.from(pointers.map((p) => p.cell), { opacity: 0, x: 16, duration: 0.4, stagger: 0.05 }, "<0.2");
  pause(tl);
  program.focus(tl, 7, 15);
  rows.forEach(({ cells, arrow }, i) => {
    tl.from(cells, { opacity: 0, x: 16, duration: 0.3, stagger: 0.03 }, i ? ">-0.1" : ">");
    arrow.draw(tl, "<", 0.3);
  });
  pause(tl);
  program.focus(tl, 17);
  tl.to(rows[3].cells[1], { background: "var(--red-fill)", borderColor: "var(--red)", duration: 0.4 }, "<0.2");
  tl.from(answer, { opacity: 0, scale: 0.4, duration: 0.5, ease: "back.out(2)" }, "<0.1");
  tl.from(notes[0], { opacity: 0, x: -20, duration: 0.5 }, "<0.1");
  pause(tl);
  program.focus(tl, 19);
  rows.forEach(({ cells, arrow }) => tl.to([...cells, arrow.path, arrow.head], { opacity: 0.12, duration: 0.3 }, ">-0.05"));
  program.focus(tl, 20, 20, ">0.1");
  tl.to(pointers.map((p) => p.cell), { opacity: 0.12, duration: 0.4 }, ">");
  tl.from(notes[1], { opacity: 0, x: -20, duration: 0.5 }, "<0.1");
  pause(tl);
  tl.from(keep, { opacity: 0, y: 12, duration: 0.6 });
  pause(tl);
  return tl;
}
