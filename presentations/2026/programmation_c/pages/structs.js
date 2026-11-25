import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { box, c, code, layer, pointer, points, subtitle } from "../helpers.js";

/** A pointer to an array of two structures: p->toto, p[0].toto and (*p).toto name the same field. */
export default function structs(root) {
  const heading = title(root, "Les pointeurs");
  const sub = subtitle(root, "Pointeurs et structures");
  const items = points(root, [
    `Un pointeur peut désigner une structure ou le premier élément d'un <span class='alert'>tableau de structures</span>.`,
    `Pour accéder à un champ à travers un pointeur, on utilise l'opérateur ${c("->")}.`,
  ], { x: 80, y: 215, w: 1760, size: 31, gap: 4 });
  const program = code(root, `
    #include <stdio.h>
    #include <stdlib.h>
    struct MaStruct
    {
      int toto;
    };
    int main(void)
    {
      struct MaStruct *p;
      p = malloc(2 * sizeof *p);
      if (p == NULL)
        return 1;
      p[0].toto = 42;
      printf("%d\\n", p->toto);
      free(p);
      return 0;
    }`, { x: 80, y: 340, w: 700, size: 25, lh: 1.36, pad: 10 });

  const svgLayer = layer(root);
  const p = box(root, { x: 900, y: 400, w: 110, name: "p", value: "", color: "var(--red)" });
  const structures = [0, 1].map((k) => {
    const node = div(root, "abs", {
      x: 1150 + k * 330, y: 380, w: 310, h: 110,
      style: { boxSizing: "border-box", border: "3px dashed var(--green)", borderRadius: "10px", background: "var(--green-fill)" },
    });
    const name = div(root, "abs mono", { x: 1150 + k * 330, y: 336, w: 310, html: `p[${k}]`, style: { fontSize: "26px", textAlign: "center", color: "var(--green)" } });
    const field = div(node, "abs mono", {
      x: 20, y: 18, w: 264, h: 68,
      style: { boxSizing: "border-box", border: "2px solid var(--blue)", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: "26px" },
    });
    div(field, "", { html: "toto" });
    const value = div(field, "", { html: "?", style: { fontWeight: 700 } });
    return { node, name, field, value };
  });
  const arrow = pointer(svgLayer, [[1010, 432], [1146, 432]]);
  const answer = div(structures[0].field, "abs c-red", { x: 170, y: 0, w: 76, h: 64, html: "42", style: { display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: 700, background: "var(--paper)" } });

  const head = div(root, "abs", { x: 900, y: 540, html: "<b>Trois écritures équivalentes</b>", style: { fontSize: "32px" } });
  const forms = ["p->toto", "p[0].toto", "(*p).toto"].map((f, k) => div(root, "abs", { x: 960, y: 600 + k * 64, html: c(f), style: { fontSize: "38px" } }));
  const same = div(root, "abs", { x: 900, y: 810, w: 940, html: `Dans les trois cas, on accède au champ ${c("toto")} de la première structure.`, style: { fontSize: "29px", whiteSpace: "normal" } });
  const warning = div(root, "abs", { x: 900, y: 900, w: 940, html: `<span class='alert'>Attention :</span> les parenthèses de ${c("(*p).toto")} sont nécessaires.`, style: { fontSize: "29px", whiteSpace: "normal" } });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([heading, sub], { opacity: 0, duration: 0.5 });
  tl.from(items, { opacity: 0, x: -24, duration: 0.6, stagger: 0.12 }, "<0.2");
  pause(tl);
  tl.from(program.node, { opacity: 0, y: 16, duration: 0.6 });
  program.focus(tl, 9, 9, ">-0.2");
  tl.from([p.node, p.label], { opacity: 0, scale: 0.8, duration: 0.4, ease: "back.out(2)" }, "<0.2");
  tl.from(structures.flatMap((s) => [s.node, s.name]), { opacity: 0, x: 16, duration: 0.5, stagger: 0.08 }, ">-0.1");
  arrow.draw(tl, ">-0.2", 0.5);
  pause(tl);
  program.focus(tl, 12);
  tl.from(answer, { opacity: 0, scale: 0.4, duration: 0.5, ease: "back.out(2)" }, "<0.2");
  pause(tl);
  program.focus(tl, 13);
  tl.from(head, { opacity: 0, y: 10, duration: 0.5 }, "<");
  forms.forEach((f, k) => {
    tl.from(f, { opacity: 0, x: -20, duration: 0.5 }, k ? ">0.1" : ">-0.2");
    tl.fromTo(structures[0].field, { scale: 1 }, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, "<0.1");
  });
  tl.from(same, { opacity: 0, y: 10, duration: 0.5 }, ">0.1");
  pause(tl);
  tl.from(warning, { opacity: 0, y: 10, duration: 0.5 });
  pause(tl);
  return tl;
}
