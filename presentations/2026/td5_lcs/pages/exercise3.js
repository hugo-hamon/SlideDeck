import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, tex, title } from "deck/components.js";
import { narrator, no, rowsOf, showMarks, switcher, truthTable } from "../helpers.js";

const X = '<span class="x">X</span>';
const ROWS = rowsOf(4);

/** Case of a row: 2 when exactly one input is 0 (undetermined), 0 when a = b, 1 otherwise. */
function caseOf([a, b, c, d]) {
  if (a + b + c + d === 3) return 2;
  return a === b ? 0 : 1;
}

/** f, with null for an undetermined output. */
function f(bits) {
  const [a, , c, d] = bits;
  const kind = caseOf(bits);
  if (kind === 2) return null;
  return kind === 0 ? c | d : (1 - a) | (c & d);
}
const f1 = ([a, b, c, d]) => ((1 - a) | (b & c)) & (b | c | d);
const f2 = ([a, b, c, d]) => ((1 - a) & (b | c | d)) | (c & d);
const show = (v) => (v === null ? X : v);
const F1 = `(${no("a")} + b\\,c)(b + c + d)`;
const F2 = `${no("a")}(b + c + d) + c\\,d`;

/** The 16 rows split in two tables of 8 (a = 0, then a = 1), with `each(table, r, bits)`. */
function halves(root, { x, gap, y, head, widths, row, rowH = 66 }) {
  const width = widths.reduce((s, w) => s + w, 0);
  const tables = [0, 1].map((half) =>
    truthTable(root, {
      x: x + half * (width + gap), y, rowH, headH: 72, head, widths,
      rows: ROWS.slice(8 * half, 8 * half + 8).map(row),
      seps: [4],
    }));
  const each = (fn) => tables.flatMap((table, half) => ROWS.slice(8 * half, 8 * half + 8).flatMap((bits, r) => fn(table, r, bits)));
  return { tables, each };
}

/** Q1: the truth table, filled case by case following the statement. */
export function ex3Q1(root) {
  const heading = title(root, "Exercice 3 — Q1 : table de vérité");
  const CASES = ["a = b : c + d", `a \\neq b : ${no("a")} + c\\,d`, "\\text{un seul } 0"];
  const { tables, each } = halves(root, {
    x: 100, gap: 50, y: 165,
    head: ["a", "b", "c", "d", "\\text{cas}", "f"],
    widths: [56, 56, 56, 56, 290, 70],
    row: (bits) => [...bits, tex(CASES[caseOf(bits)]), show(f(bits))],
  });
  const COLORS_OF = [0, 1, 2];
  const groups = [0, 1, 2].map((kind) => ({
    cells: each((t, r, bits) => (caseOf(bits) === kind ? [t.cells[r][4], t.cells[r][5]] : [])),
    marks: each((t, r, bits) => (caseOf(bits) === kind ? [t.mark(r, r, 4, 5, COLORS_OF[kind])] : [])),
  }));
  for (const g of groups) gsap.set(g.cells, { opacity: 0 });
  const rules = [
    box(root, { x: 1360, y: 165, w: 460, color: 2, title: "1. Un seul 0", html: `${tex("f")} est indéterminée (X).` }),
    box(root, { x: 1360, y: 375, w: 460, color: 0, title: "2. Sinon, si a = b", html: tex("f = c + d") }),
    box(root, { x: 1360, y: 565, w: 460, color: 1, title: "3. Cas restants", html: tex(`f = ${no("a")} + c\\,d`) }),
  ];
  const bubble = { x: 100, y: 800, w: 1720 };
  const steps = [
    [2, 0, `<b>Règle 1.</b> Une seule variable vaut 0 sur exactement 4 lignes&nbsp;: 0111, 1011, 1101 et 1110.
      ${tex("f")} y est <b>indéterminée</b>, notée X&nbsp;: on pourra choisir 0 ou 1 librement.`],
    [0, 1, `<b>Règle 2.</b> Parmi les lignes restantes, celles où ${tex("a = b")} donnent ${tex("f = c + d")}.
      Par exemple 0000 donne ${tex("0 + 0 = 0")} et 1111 donne ${tex("1 + 1 = 1")}.`],
    [1, 2, `<b>Règle 3.</b> Il reste les lignes où ${tex("a \\neq b")}, avec ${tex(`f = ${no("a")} + c\\,d`)}.
      Si ${tex("a = 0")}, alors ${tex(`${no("a")} = 1`)} et ${tex("f = 1")}. Si ${tex("a = 1")}, ${tex("f = c\\,d")}, qui vaut 0 sur ces lignes.`],
  ];

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(tables.map((t) => t.node), { opacity: 0, y: 20, duration: 0.7, stagger: 0.12 }, "<0.2");
  say(`Avec 4 variables il y a ${tex("2^4 = 16")} lignes, coupées ici en deux tables (${tex("a = 0")} puis ${tex("a = 1")}).
    On applique les règles de l'énoncé <b>dans l'ordre</b>&nbsp;: la première qui s'applique décide de ${tex("f")}.`, bubble);
  for (const [kind, n, text] of steps) {
    pause(tl);
    tl.from(rules[n], { opacity: 0, x: 30, duration: 0.7 });
    showMarks(tl, groups[kind].marks, "<0.2");
    tl.to(groups[kind].cells, { opacity: 1, duration: 0.4, stagger: 0.02 }, "<0.1");
    say(text, { ...bubble, color: [0, 1, 2][kind] });
  }
  pause(tl);
  return tl;
}

/** Shared layout of Q2: f, f1, f2 side by side on the 16 rows. */
function compareTables(root) {
  return halves(root, {
    x: 100, gap: 40, y: 165,
    head: ["a", "b", "c", "d", "f", "f_1", "f_2"],
    widths: [56, 56, 56, 56, 80, 80, 80],
    row: (bits) => [...bits, show(f(bits)), f1(bits), f2(bits)],
  });
}

/** Q2, first part: f1 and f2 agree with f wherever f is defined. */
export function ex3Q2a(root) {
  const heading = title(root, `<span>Exercice 3 — Q2 : ${tex("f_1")} et ${tex("f_2")} sont conformes à ${tex("f")}</span>`);
  const { tables, each } = compareTables(root);
  const col = (j) => tables.flatMap((t) => t.column(j));
  gsap.set([...col(5), ...col(6)], { opacity: 0 });
  const formulas = box(root, {
    x: 1120, y: 165, w: 700, color: 0,
    title: "Les deux expressions",
    html: `${tex(`f_1 = ${F1}`, true)}${tex(`f_2 = ${F2}`, true)}`,
  });
  const marks1 = each((t, r, bits) => (f(bits) !== null ? [t.mark(r, r, 4, 5, 1)] : []));
  const marks2 = each((t, r, bits) => (f(bits) !== null ? [t.mark(r, r, 4, 6, 1)] : []));
  const answer = box(root, {
    x: 1120, y: 470, w: 700, color: 1,
    title: "Réponse",
    html: `Sur les 12 lignes où ${tex("f")} est définie, <span style="white-space: nowrap">${tex("f_1 = f_2 = f")}</span>.
      Les deux fonctions sont donc conformes à la définition.`,
  });
  const bubble = { x: 1120, y: 470, w: 700 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say, show: showNodes } = narrator(root, tl);
  const focus = switcher(tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(tables.map((t) => t.node), { opacity: 0, y: 20, duration: 0.7, stagger: 0.12 }, "<0.2");
  tl.from(formulas, { opacity: 0, x: 30, duration: 0.7 }, "<0.2");
  say(`Une fonction est <b>conforme</b> à ${tex("f")} si elle prend la même valeur que ${tex("f")} sur toutes les lignes où ${tex("f")} est définie.
    Sur les X, n'importe quelle valeur convient.`, bubble);
  pause(tl);
  tl.to(col(5), { opacity: 1, duration: 0.4, stagger: 0.02 });
  focus(tables.map((t) => t.mark(0, 7, 5, 5, 0)), "<0.1");
  say(`On calcule ${tex(`f_1 = ${F1}`)} ligne par ligne. Par exemple sur 0000, ${tex("b + c + d = 0")} donc ${tex("f_1 = 0")}.
    Sur 1110, ${tex(`${no("a")} + b\\,c = 1`)} et ${tex("b + c + d = 1")} donc ${tex("f_1 = 1")}.`, bubble);
  pause(tl);
  focus([]);
  showMarks(tl, marks1, "<0.1", 0.02);
  say(`On compare ${tex("f_1")} à ${tex("f")} sur les lignes définies (en vert)&nbsp;: les valeurs coïncident partout.
    ${tex("f_1")} est conforme.`, { ...bubble, color: 1 });
  pause(tl);
  tl.to(marks1, { opacity: 0, duration: 0.3 });
  tl.to(col(6), { opacity: 1, duration: 0.4, stagger: 0.02 }, "<");
  focus(tables.map((t) => t.mark(0, 7, 6, 6, 0)), "<0.1");
  say(`On calcule ${tex(`f_2 = ${F2}`)}. Par exemple sur 1011, ${tex(`${no("a")} = 0`)} mais ${tex("c\\,d = 1")}, donc ${tex("f_2 = 1")}.`, bubble);
  pause(tl);
  focus([]);
  showMarks(tl, marks2, "<0.1", 0.02);
  showNodes([answer], "<0.2");
  pause(tl);
  return tl;
}

/** Q2, second part: f1 and f2 differ on two undetermined rows. */
export function ex3Q2b(root) {
  const heading = title(root, `<span>Exercice 3 — Q2 : ${tex("f_1 \\neq f_2")}</span>`);
  const { tables, each } = compareTables(root);
  const differ = each((t, r, bits) => (f1(bits) !== f2(bits) ? [t.mark(r, r, 5, 6, 2)] : []));
  const algebra = box(root, {
    x: 1120, y: 165, w: 700, color: 0,
    title: "En développant",
    html: tex(`\\begin{aligned}
      f_1 &= ${no("a")}(b+c+d) + b\\,c\\,(b+c+d) \\\\
          &= ${no("a")}(b+c+d) + \\htmlClass{c-red}{b\\,c} \\\\
      f_2 &= ${no("a")}(b+c+d) + \\htmlClass{c-red}{c\\,d}
    \\end{aligned}`, true),
  });
  const answer = box(root, {
    x: 1120, y: 640, w: 700, color: 2,
    title: "Réponse",
    html: `${tex("f_1(1,0,1,1) = 0")} alors que ${tex("f_2(1,0,1,1) = 1")}, donc ${tex("f_1 \\neq f_2")}, bien que les deux soient conformes à ${tex("f")}.`,
  });
  const bubble = { x: 1120, y: 640, w: 700 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say, show: showNodes } = narrator(root, tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(tables.map((t) => t.node), { opacity: 0, y: 20, duration: 0.7, stagger: 0.12 }, "<0.2");
  say(`Deux fonctions sont <b>égales</b> si elles ont la même valeur sur les 16 lignes, X compris.
    Il suffit donc d'une ligne où elles diffèrent.`, { ...bubble, y: 165 });
  pause(tl);
  showMarks(tl, differ, undefined, 0.2);
  say(`Sur 1011, ${tex("f_1 = 0")} et ${tex("f_2 = 1")}. Sur 1110, ${tex("f_1 = 1")} et ${tex("f_2 = 0")}.
    Ce sont deux lignes où ${tex("f")} vaut X&nbsp;: chaque fonction y a fait un choix différent.`, { ...bubble, y: 165, color: 2 });
  pause(tl);
  tl.from(algebra, { opacity: 0, x: 30, duration: 0.7 });
  say(`Le calcul l'explique&nbsp;: les deux fonctions ont le terme ${tex(`${no("a")}(b+c+d)`)} en commun, puis ${tex("f_1")} ajoute ${tex("b\\,c")} et ${tex("f_2")} ajoute ${tex("c\\,d")}.
    Avec ${tex("a = 1")}, elles diffèrent dès que ${tex("b\\,c \\neq c\\,d")}.`, bubble);
  pause(tl);
  showNodes([answer]);
  pause(tl);
  return tl;
}
