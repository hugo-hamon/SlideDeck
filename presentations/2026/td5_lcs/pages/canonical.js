import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, tex, title } from "deck/components.js";
import { maxterm, minterm, narrator, pieces, rowsOf, showMarks, switcher, termTable, termsTex } from "../helpers.js";

const FORMS = {
  sop: {
    term: "min",
    keep: 1,
    color: 1,
    title: "Somme canonique de produits",
    op: "+",
    render: minterm,
    rule: (bits, latex) => `<b>Produit d'une ligne.</b> Sur la ligne ${bits.join("")}, on écrit le produit de toutes les variables, <b>complémentées si elles valent 0</b>&nbsp;:
      ${tex(latex)}. Ce produit vaut 1 sur cette ligne et 0 sur toutes les autres.`,
    build: (out) => `<b>Somme canonique.</b> On additionne les produits des lignes où ${tex(`${out} = 1`)}, surlignées en vert.
      La somme vaut 1 dès qu'un de ces produits vaut 1, donc exactement sur ces lignes.`,
  },
  pos: {
    term: "max",
    keep: 0,
    color: 2,
    title: "Produit canonique de sommes",
    op: "",
    render: maxterm,
    rule: (bits, latex) => `<b>Somme d'une ligne.</b> Sur la ligne ${bits.join("")}, on écrit la somme de toutes les variables, <b>complémentées si elles valent 1</b>&nbsp;:
      ${tex(latex)}. Cette somme vaut 0 sur cette ligne et 1 sur toutes les autres.`,
    build: (out) => `<b>Produit canonique.</b> On multiplie les sommes des lignes où ${tex(`${out} = 0`)}, surlignées en rouge.
      Le produit vaut 0 dès qu'une de ces sommes vaut 0, donc exactement sur ces lignes.`,
  },
};

/**
 * Canonical forms read off a truth table. `cols` are the function columns ([LaTeX head,
 * values]), the last one being the function `out`. `later` is the index of a column revealed
 * on its own step with the explanation `laterText`. Each form takes two steps: the rule on one
 * example row, then the selected rows and the formula written term by term.
 */
export function canonical(root, { heading, cols, out, forms, intro, later, laterText }) {
  const head = title(root, heading);
  const values = cols.at(-1)[1];
  const bits = rowsOf(3);
  const table = termTable(root, { x: 100, y: 165, cols, terms: forms.map((f) => FORMS[f].term) });
  const boxX = table.right + 60;
  const answers = forms.map((f, k) => {
    const form = FORMS[f];
    const rows = bits.flatMap((b, r) => (values[r] === form.keep ? [r] : []));
    const latex = termsTex(out, rows.map((r) => form.render(bits[r])), form.op);
    const node = box(root, {
      x: boxX, y: 165 + k * 280, w: 1820 - boxX, color: form.color,
      title: form.title,
      html: `<div class="tight">${tex(latex, true)}</div>`,
    });
    return { form, rows, node };
  });
  const bubble = { x: 100, y: table.bottom + 35, w: 1720 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  const focus = switcher(tl);
  const reveal = (cells, position) => tl.to(cells, { opacity: 1, duration: 0.4, stagger: 0.04 }, position);
  for (const j of Object.values(table.termCol)) gsap.set(table.column(j), { opacity: 0 });
  if (later !== undefined) gsap.set(table.column(3 + later), { opacity: 0 });
  tl.from(head, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(table.node, { opacity: 0, y: 20, duration: 0.7 }, "<0.2");
  say(intro, bubble);

  if (later !== undefined) {
    pause(tl);
    const j = 3 + later;
    reveal(table.column(j));
    focus([table.mark(0, 7, j, j, 0)], "<0.1");
    say(laterText, bubble);
  }

  for (const { form, rows, node } of answers) {
    const col = table.termCol[form.term];
    const example = rows[0];
    pause(tl);
    reveal(table.column(col));
    focus([table.mark(example, example, 0, col, 0)], "<0.2");
    say(form.rule(bits[example], form.render(bits[example])), bubble);
    pause(tl);
    focus([]);
    showMarks(tl, rows.map((r) => table.mark(r, r, col, col, form.color)), "<0.1", 0.12);
    tl.from(node, { opacity: 0, x: 30, duration: 0.7 }, "<0.1");
    tl.from(rows.map((_, i) => pieces(node, i)), { opacity: 0, duration: 0.4, stagger: 0.12 }, "<0.3");
    say(form.build(out), { ...bubble, color: form.color });
  }
  pause(tl);
  return tl;
}
