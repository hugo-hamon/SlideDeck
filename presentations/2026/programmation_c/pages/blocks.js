import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { box, c, code, layer, pointer, points, subtitle, terminal } from "../helpers.js";

/** A row of memory cells starting at (x, y); returns the cells and their value spans. */
function cells(root, { x, y, n, w = 110, h = 76, values = [], color = "var(--blue)" }) {
  return Array.from({ length: n }, (_, k) => {
    const cell = div(root, "abs mono", {
      x: x + k * w, y, w, h,
      style: { boxSizing: "border-box", border: `3px solid ${color}`, background: `color-mix(in srgb, ${color} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" },
    });
    const value = div(cell, "", { html: values[k] ?? "?" });
    return { cell, value };
  });
}

/** Writes `html` into a cell: the old value fades out, the new one pops in red. */
function write(tl, cell, html, position) {
  const next = div(cell.cell, "abs", { x: 0, y: 0, w: cell.cell.offsetWidth - 6, h: cell.cell.offsetHeight - 6, html, style: { display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", fontWeight: 700 } });
  gsap.set(next, { opacity: 0 });
  tl.to(cell.value, { opacity: 0, duration: 0.2 }, position);
  tl.fromTo(next, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)", immediateRender: false }, "<0.1");
  cell.value = next;
}

/** malloc for two contiguous ints: *p, *(p+1), and what the program prints. */
export function blockAlloc(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Allocation dynamique de blocs");
  const intro = points(root, [`${c("malloc")} permet d'allouer un bloc pour plusieurs objets contigus de même type.`], { x: 80, y: 220, w: 1760, size: 34 });
  const program = code(root, `
    #include <stdio.h>
    #include <stdlib.h>
    int main(void)
    {
      int i = 3, j = 6;
      int *p = malloc(2 * sizeof *p);
      if (p == NULL) return 1;
      *p = i;
      *(p + 1) = j;
      printf("p = %p\\n", (void *)p);
      printf("p+1 = %p\\n", (void *)(p+1));
      printf("*p = %d\\n", *p);
      printf("*(p+1) = %d\\n", *(p+1));

      free(p);
      return 0;
    }`, { x: 80, y: 300, w: 800, size: 25, lh: 1.38, pad: 12 });

  const svgLayer = layer(root);
  const p = box(root, { x: 980, y: 380, w: 130, name: "p", value: "?", color: "var(--red)" });
  const block = cells(root, { x: 1240, y: 374, n: 2, w: 210 });
  const names = [c("*p"), c("*(p+1)")].map((html, k) => div(root, "abs", { x: 1240 + k * 210, y: 330, w: 210, html, style: { fontSize: "24px", textAlign: "center" } }));
  const addresses = ["0x2000", "0x2004"].map((a, k) => div(root, "abs mono muted", { x: 1240 + k * 210, y: 460, w: 210, html: a, style: { fontSize: "24px", textAlign: "center" } }));
  const caption = div(root, "abs", { x: 1240, y: 500, w: 420, html: "<b>Bloc alloué : deux entiers</b>", style: { fontSize: "26px", textAlign: "center" } });
  const arrow = pointer(svgLayer, [[1110, 412], [1238, 412]]);
  const pValue = p.content;
  const term = terminal(root, { x: 980, y: 570, w: 860, h: 190, size: 24 });
  const notes = points(root, [
    `${c("p+1")} avance de ${c("sizeof(int)")} octets.`,
    `${c("p[1]")} et ${c("*(p+1)")} désignent le même entier.`,
    `${c("free(p)")} libère le bloc.`,
  ], { x: 980, y: 785, w: 860, size: 28, gap: 6 });
  const keep = div(root, "abs", { x: 980, y: 930, w: 860, html: "<b class='c-red'>À retenir :</b> le pointeur ne mémorise pas la taille du bloc, le programme doit la conserver.", style: { fontSize: "28px", whiteSpace: "normal" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from([intro, program.node], { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 }, "<0.2");
  pause(tl);

  program.focus(tl, 5);
  tl.from([p.node, p.label], { opacity: 0, scale: 0.8, duration: 0.4, ease: "back.out(2)" }, "<0.2");
  tl.from([...block.map((b) => b.cell), ...names, ...addresses, caption], { opacity: 0, x: 16, duration: 0.5, stagger: 0.05 }, ">-0.1");
  write(tl, { cell: p.node, value: pValue }, "0x2000", ">-0.1");
  arrow.draw(tl, ">-0.2");
  pause(tl);
  program.focus(tl, 7);
  write(tl, block[0], "3", ">0.1");
  pause(tl);
  program.focus(tl, 8);
  write(tl, block[1], "6", ">0.1");
  pause(tl);

  program.focus(tl, 9, 12);
  tl.from(term.node, { opacity: 0, y: 16, duration: 0.5 }, "<");
  ["p = 0x2000", "p+1 = 0x2004", "*p = 3", "*(p+1) = 6"].forEach((line) => term.print(tl, line, ">0.15"));
  tl.from(notes[0], { opacity: 0, x: -20, duration: 0.5 }, ">0.1");
  pause(tl);
  tl.from(notes[1], { opacity: 0, x: -20, duration: 0.5 });
  pause(tl);
  program.focus(tl, 14);
  tl.to([...block.map((b) => b.cell), ...names, ...addresses, caption, arrow.path, arrow.head], { opacity: 0.2, duration: 0.6 }, "<0.2");
  tl.from(notes[2], { opacity: 0, x: -20, duration: 0.5 }, "<");
  pause(tl);
  tl.from(keep, { opacity: 0, y: 12, duration: 0.6 });
  pause(tl);
  return tl;
}

/** calloc (zeros), realloc (bigger block, data kept, possibly moved) and free. */
export function callocRealloc(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Allocation dynamique de blocs");
  const items = points(root, [
    `<b>${c("calloc")}</b> : réserve un bloc pour plusieurs objets et <span class='alert'>initialise tous les octets à zéro</span>.<div style="margin: 10px 0 0 60px">${c("void *calloc(size_t nb, size_t taille);")}</div>`,
    `<b>${c("realloc")}</b> : modifie la taille d'un bloc déjà alloué. Il peut le déplacer, mais conserve les données existantes dans la limite de la nouvelle taille.<div style="margin: 10px 0 0 60px">${c("void *realloc(void *p, size_t taille);")}</div>`,
    `<b>${c("free(p)")}</b> : libère un bloc alloué dynamiquement. Il ne faut plus accéder à son contenu après la libération.`,
  ], { x: 80, y: 220, w: 1140, size: 31, gap: 26 });
  const warning = div(root, "abs", { x: 80, y: 790, w: 1140, html: `<span class='alert'><b>Attention :</b></span> si ${c("realloc")} échoue, elle retourne ${c("NULL")} et l'ancien bloc reste valide.`, style: { fontSize: "31px", whiteSpace: "normal" } });
  const snippet = code(root, `
    int *tmp = realloc(p, 10 * sizeof *p);
    if (tmp != NULL)
      p = tmp;`, { x: 140, y: 880, w: 760, size: 25, lh: 1.3, pad: 8 });

  // Right: the block of p, first zeroed by calloc, then moved and enlarged by realloc.
  const svgLayer = layer(root);
  const first = cells(root, { x: 1390, y: 300, n: 4, w: 100, values: ["0", "0", "0", "0"] });
  const firstCall = div(root, "abs", { x: 1250, y: 236, html: c("p = calloc(4, sizeof *p);"), style: { fontSize: "26px" } });
  const pLabel = div(root, "abs mono c-red", { x: 1270, y: 316, html: "<b>p</b>", style: { fontSize: "34px" } });
  const arrow = pointer(svgLayer, [[1300, 338], [1386, 338]]);
  const secondCall = div(root, "abs", { x: 1250, y: 470, html: c("p = realloc(p, 6 * sizeof *p);"), style: { fontSize: "26px" } });
  const second = cells(root, { x: 1290, y: 560, n: 6, w: 90, values: ["0", "0", "0", "0", "?", "?"], color: "var(--green)" });
  const moved = div(root, "abs muted", { x: 1290, y: 650, w: 540, html: "bloc déplacé : les 4 entiers sont copiés", style: { fontSize: "24px", textAlign: "center" } });
  const freed = div(root, "abs c-red", { x: 1290, y: 700, w: 540, html: `${c("free(p)")} : bloc libéré`, style: { fontSize: "26px", textAlign: "center" } });
  const ghosts = first.map((cell, k) => {
    const g = div(root, "abs mono", { x: 1390 + k * 100 + 50, y: 338, html: "0", style: { fontSize: "30px", color: "var(--red)", fontWeight: 700 } });
    gsap.set(g, { xPercent: -50, yPercent: -50, opacity: 0 });
    return g;
  });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items[0], { opacity: 0, x: -24, duration: 0.6 }, "<0.2");
  tl.from(firstCall, { opacity: 0, y: 10, duration: 0.5 }, "<0.2");
  tl.from(first.map((f) => f.cell), { opacity: 0, x: 16, duration: 0.4, stagger: 0.05 }, ">-0.2");
  tl.from(pLabel, { opacity: 0, duration: 0.3 }, "<");
  arrow.draw(tl, "<0.1", 0.4);
  pause(tl);

  tl.from(items[1], { opacity: 0, x: -24, duration: 0.6 });
  tl.from(secondCall, { opacity: 0, y: 10, duration: 0.5 }, "<0.2");
  tl.from(second.map((s) => s.cell), { opacity: 0, duration: 0.4, stagger: 0.04 }, ">-0.1");
  gsap.set(second.slice(0, 4).map((s) => s.value), { opacity: 0 });
  ghosts.forEach((g, k) => {
    tl.to(g, { opacity: 1, duration: 0.15 }, k ? "<0.08" : ">");
    tl.to(g, { x: 1290 + k * 90 + 45 - (1390 + k * 100 + 50), y: 598 - 338, duration: 0.7, ease: "power3.inOut" }, "<");
  });
  tl.to(ghosts, { opacity: 0, duration: 0.15 }, ">");
  tl.to(second.slice(0, 4).map((s) => s.value), { opacity: 1, duration: 0.15 }, "<");
  tl.to(first.map((f) => f.cell), { opacity: 0.15, duration: 0.5 }, "<");
  tl.to(pLabel, { x: -70, y: 260, duration: 0.6, ease: "power3.inOut" }, "<");
  arrow.move(tl, [[1240, 598], [1286, 598]], "<", 0.6);
  tl.from(moved, { opacity: 0, duration: 0.4 }, "<0.3");
  pause(tl);

  tl.from(items[2], { opacity: 0, x: -24, duration: 0.6 });
  tl.to([...second.map((s) => s.cell), arrow.path, arrow.head], { opacity: 0.15, duration: 0.6 }, "<0.2");
  tl.from(freed, { opacity: 0, y: 10, duration: 0.4 }, "<0.2");
  pause(tl);
  tl.from([warning, snippet.node], { opacity: 0, y: 12, duration: 0.6, stagger: 0.12 });
  pause(tl);
  return tl;
}

/** An array whose size is typed at run time, allocated with calloc. */
export function runtimeSize(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Exemple : tableau de taille choisie à l'exécution");
  const intro = points(root, [`Avec ${c("malloc")} ou ${c("calloc")}, on peut donc allouer un tableau dont le nombre d'éléments est saisi par l'utilisateur.`], { x: 80, y: 220, w: 1760, size: 32 });
  const program = code(root, `
    #include <stdio.h>
    #include <stdlib.h>
    int main(void)
    {
      int nb;
      printf("Nombre d'elements : ");
      if (scanf("%d", &nb) != 1 || nb <= 0)
        return 1;
      int *p = calloc((size_t)nb, sizeof *p);
      if (p == NULL) {
        printf("Erreur d'allocation\\n");
        return 1;
      }
      // Les entiers sont initialises a zero par calloc
      for (int i = 0; i < nb; i++)
        printf("%d ", p[i]);
      printf("\\n");
      free(p);
      return 0;
    }`, { x: 80, y: 315, w: 900, size: 24, lh: 1.32, pad: 10 });

  const term = terminal(root, { x: 1040, y: 315, w: 800, h: 150, size: 24 });
  const svgLayer = layer(root);
  const p = box(root, { x: 1070, y: 540, w: 70, name: "p", value: "", color: "var(--red)" });
  const block = cells(root, { x: 1240, y: 534, n: 4, w: 100, values: ["0", "0", "0", "0"] });
  const arrow = pointer(svgLayer, [[1140, 572], [1236, 572]]);
  const size = div(root, "abs muted", { x: 1240, y: 616, w: 400, html: `${c("nb")} = 4 entiers contigus`, style: { fontSize: "24px", textAlign: "center" } });
  const notes = points(root, [
    `La taille ${c("nb")} est choisie pendant l'exécution.`,
    `${c("calloc")} réserve ${c("nb")} entiers contigus, dont les octets sont initialisés à zéro.`,
    `Les éléments sont accessibles par ${c("p[i]")}.`,
    "On vérifie la saisie et l'allocation.",
    `${c("free(p)")} libère le bloc alloué.`,
  ], { x: 1040, y: 680, w: 800, size: 27, gap: 4 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from([intro, program.node], { opacity: 0, y: 16, duration: 0.6, stagger: 0.1 }, "<0.2");
  pause(tl);
  program.focus(tl, 5, 6);
  tl.from(term.node, { opacity: 0, y: 12, duration: 0.5 }, "<");
  term.print(tl, "Nombre d'elements : 4", ">0.1", { duration: 0.9 });
  tl.from(notes[0], { opacity: 0, x: -20, duration: 0.5 }, ">0.1");
  pause(tl);
  program.focus(tl, 8);
  tl.from([p.node, p.label], { opacity: 0, scale: 0.8, duration: 0.4, ease: "back.out(2)" }, "<0.2");
  tl.from(block.map((b) => b.cell), { opacity: 0, x: 16, duration: 0.4, stagger: 0.06 }, ">-0.1");
  arrow.draw(tl, ">-0.2", 0.4);
  tl.from(size, { opacity: 0, duration: 0.4 }, "<");
  tl.from(notes[1], { opacity: 0, x: -20, duration: 0.5 }, "<0.1");
  pause(tl);
  program.focus(tl, 14, 16);
  block.forEach((b, k) => tl.fromTo(b.cell, { scale: 1 }, { scale: 1.1, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, k ? ">" : ">0.1"));
  term.print(tl, "0 0 0 0 ", "<-0.4");
  tl.from(notes[2], { opacity: 0, x: -20, duration: 0.5 }, ">0.1");
  pause(tl);
  program.focus(tl, 6, 12);
  tl.from(notes[3], { opacity: 0, x: -20, duration: 0.5 }, "<0.1");
  pause(tl);
  program.focus(tl, 17);
  tl.to([...block.map((b) => b.cell), arrow.path, arrow.head, size], { opacity: 0.2, duration: 0.5 }, "<0.2");
  tl.from(notes[4], { opacity: 0, x: -20, duration: 0.5 }, "<");
  pause(tl);
  return tl;
}
