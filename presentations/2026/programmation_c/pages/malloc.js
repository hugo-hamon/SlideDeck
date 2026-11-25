import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { box, c, captions, code, grid, layer, pointer, points, subtitle, terminal } from "../helpers.js";

/** malloc(1) for an int, without checking the result: two problems. */
export function mallocBug(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Allocation dynamique");
  const intro = points(root, ["Exemple : que pensez-vous du programme suivant ?"], { x: 80, y: 220, w: 1760, size: 34 });
  const program = code(root, `
    #include <stdio.h>
    #include <stdlib.h>

    int main(void)
    {
      int *p;
      p = malloc(1);
      *p = 3;
      printf("Valeur : %d\\n", *p);
      return 0;
    }`, { x: 80, y: 300, w: 760, size: 28 });
  const problems = points(root, [
    "<span class='alert'>Deux problèmes :</span>",
    `- La taille est fixée à 1 octet : est-ce suffisant pour un ${c("int")} ?`,
    `- Le résultat de ${c("malloc")} n'est pas testé : que se passe-t-il si l'allocation échoue ?`,
  ], { x: 80, y: 820, w: 1760, size: 32, gap: 10 });

  // The allocated byte, and the four bytes that *p = 3 writes.
  const cells = Array.from({ length: 4 }, (_, k) =>
    div(root, "abs mono", {
      x: 1050 + k * 150, y: 470, w: 150, h: 80,
      style: {
        boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px",
        border: k ? "2px dashed var(--ink-soft)" : "3px solid var(--blue)", background: k ? "transparent" : "var(--blue-fill)",
      },
    }),
  );
  const allocated = div(root, "abs c-blue", { x: 1050, y: 420, w: 150, html: "bloc alloué", style: { fontSize: "26px", textAlign: "center" } });
  const outside = div(root, "abs muted", { x: 1200, y: 420, w: 450, html: "hors du bloc", style: { fontSize: "26px", textAlign: "center" } });
  const write = div(root, "abs", {
    x: 1050, y: 570, w: 600, h: 80, html: `<span>${c("*p = 3")} écrit 4 octets</span>`,
    style: { boxSizing: "border-box", border: "3px solid var(--red)", background: "var(--red-fill)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" },
  });
  const nul = div(root, "abs", { x: 1050, y: 700, w: 600, html: `Si ${c("p == NULL")}, ${c("*p = 3")} écrit… nulle part ✗`, style: { fontSize: "30px", color: "var(--red)", textAlign: "center" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(intro, { opacity: 0, x: -24, duration: 0.6 }, "<0.2");
  tl.from(program.node, { opacity: 0, y: 20, duration: 0.6 }, "<0.2");
  pause(tl);
  tl.from(problems.slice(0, 2), { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 });
  program.focus(tl, 6, 6, "<");
  tl.from([cells[0], allocated], { opacity: 0, y: 12, duration: 0.5 }, "<0.3");
  pause(tl);
  program.focus(tl, 7);
  tl.from([...cells.slice(1), outside], { opacity: 0, y: 12, duration: 0.4, stagger: 0.05 }, "<0.2");
  tl.from(write, { opacity: 0, scaleX: 0.25, transformOrigin: "0% 50%", duration: 0.8, ease: "power3.out" }, ">");
  pause(tl);
  tl.from(problems[2], { opacity: 0, x: -24, duration: 0.6 });
  program.focus(tl, 6, 6, "<");
  tl.from(nul, { opacity: 0, y: 10, duration: 0.5 }, "<0.3");
  pause(tl);
  return tl;
}

/** The corrected program: each remark lights up the line it is about. */
export function mallocFix(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Allocation dynamique");
  const intro = points(root, [`Correction du programme précédent : réserver la bonne taille et vérifier le résultat de ${c("malloc")}.`], { x: 80, y: 220, w: 1760, size: 34 });
  const program = code(root, `
    #include <stdio.h>
    #include <stdlib.h>

    int main(void)
    {
      int *p;
      p = malloc(sizeof(int));

      if (p == NULL) {
        printf("Erreur d'allocation\\n");
        return 1;
      }

      *p = 3;
      printf("Valeur : %d\\n", *p);

      free(p);
      return 0;
    }`, { x: 80, y: 300, w: 900, size: 25, lh: 1.4 });
  const remarks = points(root, [
    `${c("sizeof(int)")} : taille d'un entier en octets.`,
    `${c("p == NULL")} : vérifie si l'allocation a échoué.`,
    `${c("free(p)")} : libère la mémoire allouée.`,
  ], { x: 1060, y: 380, w: 780, size: 34, gap: 90 });
  const lines = [[6, 6], [8, 11], [16, 16]];

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(intro, { opacity: 0, x: -24, duration: 0.6 }, "<0.2");
  tl.from(program.node, { opacity: 0, y: 20, duration: 0.6 }, "<0.2");
  pause(tl);
  remarks.forEach((item, k) => {
    program.focus(tl, ...lines[k]);
    tl.from(item, { opacity: 0, x: 24, duration: 0.6 }, "<0.1");
    pause(tl);
  });
  return tl;
}

/** What happens in the machine: p = NULL, malloc, *p = i, printf, free. */
export function mallocTrace(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Exemple d'allocation dynamique");
  const ask = div(root, "abs", { x: 80, y: 215, html: "Que se passe-t-il dans la machine ? <i class='muted'>(adresses fictives)</i>", style: { fontSize: "32px" } });
  const program = code(root, `
    #include <stdio.h>
    #include <stdlib.h>
    int main(void)
    {
      int i = 3;
      int *p = NULL;
      p = malloc(sizeof(int));
      if (p == NULL) {
        return 1;
      }
      *p = i;
      printf("*p = %d\\n", *p);
      free(p);
      return 0;
    }`, { x: 80, y: 285, w: 720, size: 24, lh: 1.38, pad: 12 });
  const term = terminal(root, { x: 80, y: 870, w: 720, h: 140, size: 24 });

  const locals = grid(root, {
    x: 900, y: 340, cols: [130, 180, 180, 160], size: 28, rowH: 60, caption: "<b>Variables locales</b>",
    head: ["objet", "adresse", "valeur", "type"],
    rows: [["i", "0x6000", "3", "int"], ["p", "0x6008", "NULL", "int *"]],
  });
  const heapCaption = div(root, "abs", { x: 900, y: 566, w: 654, html: "<b>Bloc dynamique</b>", style: { fontSize: "28px", textAlign: "center" } });
  const none = div(root, "abs muted", { x: 900, y: 640, w: 654, html: `<i>Aucun bloc alloué pour ${c("p")}.</i>`, style: { fontSize: "28px", textAlign: "center" } });
  const heap = grid(root, {
    x: 1000, y: 620, cols: [170, 220, 110], size: 28, rowH: 60,
    head: ["adresse", "contenu", "type"], rows: [["0x2000", "<i>indéterminé</i>", "int"]],
  });
  const svgLayer = layer(root);
  const arrow = pointer(svgLayer, [[locals.right(2) - 30, locals.cy(1) + 31], [locals.right(2) - 30, 548], [1700, 548], [1700, heap.cy(0)], [heap.right(2) + 6, heap.cy(0)]]);
  const steps = captions(root, [
    `<b class='c-red'>Étape 1 :</b> ${c("p")} vaut ${c("NULL")} : il ne pointe sur aucun objet.`,
    `<b class='c-red'>Étape 2 :</b> ${c("p")} reçoit l'adresse du bloc, qui n'est pas initialisé.`,
    `<b class='c-red'>Étape 3 :</b> ${c("*p = i")} écrit 3 à l'adresse ${c("0x2000")}.`,
    `<b class='c-red'>Étape 4 :</b> ${c("*p")} lit l'entier du bloc.`,
    `<b class='c-red'>Étape 5 :</b> ${c("free(p)")} libère le bloc : on ne doit plus y accéder.`,
  ], { x: 900, y: 860, w: 940, size: 30 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub, ask], { opacity: 0, duration: 0.5 });
  tl.from([program.node, term.node], { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, "<0.2");
  tl.from([locals.caption, locals.node, heapCaption, none], { opacity: 0, y: 16, duration: 0.5, stagger: 0.06 }, "<0.2");
  gsap.set(heap.node, { opacity: 0 });
  program.focus(tl, 4, 5, ">-0.2");
  steps.show(tl, 0, "<0.2");
  pause(tl);

  program.focus(tl, 6);
  tl.to(none, { opacity: 0, duration: 0.3 }, "<");
  tl.to(heap.node, { opacity: 1, duration: 0.5 }, ">");
  locals.set(tl, 1, 2, "0x2000", "<0.1");
  arrow.draw(tl, ">-0.2", 0.9);
  steps.show(tl, 1, "<");
  pause(tl);

  program.focus(tl, 10);
  const ghost = div(root, "abs mono c-red", { x: locals.cx(2), y: locals.cy(0), html: "3", style: { fontSize: "32px", fontWeight: 700 } });
  gsap.set(ghost, { xPercent: -50, yPercent: -50, opacity: 0 });
  tl.to(ghost, { opacity: 1, duration: 0.2 }, "<0.2");
  tl.to(ghost, { x: heap.cx(1) - locals.cx(2), y: heap.cy(0) - locals.cy(0), duration: 0.9, ease: "power3.inOut" }, ">");
  tl.to(ghost, { opacity: 0, duration: 0.2 }, ">");
  heap.set(tl, 0, 1, "3", "<");
  steps.show(tl, 2, "<");
  pause(tl);

  program.focus(tl, 11);
  term.print(tl, "*p = 3", ">0.1");
  steps.show(tl, 3, "<");
  pause(tl);

  program.focus(tl, 12);
  tl.to(heap.node, { opacity: 0.25, duration: 0.6, ease: "power2.inOut" }, "<0.2");
  tl.to([arrow.path, arrow.head], { opacity: 0.25, duration: 0.6 }, "<");
  steps.show(tl, 4, "<");
  pause(tl);
  return tl;
}
