import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, canvas, tex, title } from "deck/components.js";
import { circuit, derivation, lightPath, narrator, no, rowsOf, showMarks, switcher, truthTable } from "../helpers.js";
import { canonical } from "./canonical.js";
import { line } from "./circuits.js";

const S = (a, b, c) => b | (a & c);
const NOR = no(`${no("b")}+${no("c")}`);

/** Q3: the truth tables of both circuits, built column by column. */
export function ex1Table(root) {
  const heading = title(root, "Exercice 1 — Q3 : tables de vérité");
  const columns = [
    ["a", (a) => a],
    ["b", (a, b) => b],
    ["c", (a, b, c) => c],
    ["a\\cdot c", (a, b, c) => a & c],
    ["a+b", (a, b) => a | b],
    ["b+c", (a, b, c) => b | c],
    ["b+a\\cdot c", (a, b, c) => b | (a & c)],
    ["(a+b)\\cdot c", (a, b, c) => (a | b) & c],
    ["s_1", (a, b, c) => b | (a & c) | ((a | b) & c)],
    ["(a+b)(b+c)", (a, b, c) => (a | b) & (b | c)],
    [NOR, (a, b, c) => b & c],
    ["s_2", (a, b, c) => ((a | b) & (b | c)) | (a & c) | (b & c)],
  ];
  const table = truthTable(root, {
    x: 215, y: 160, rowH: 54, headH: 72,
    head: columns.map(([h]) => h),
    rows: rowsOf(3).map((bits) => columns.map(([, f]) => f(...bits))),
    widths: [70, 70, 70, 120, 120, 120, 170, 170, 100, 230, 150, 100],
    seps: [3, 6, 9],
  });
  for (let j = 3; j < 12; j++) gsap.set(table.column(j), { opacity: 0 });
  const conclusion = box(root, {
    x: 215, y: 735, w: 1490, color: 1,
    title: "Réponse",
    html: `Les colonnes ${tex("s_1")} et ${tex("s_2")} sont identiques ligne par ligne&nbsp;:
      les deux circuits réalisent la même fonction logique, qui vaut 1 sur les lignes 010, 011, 101, 110 et 111.`,
  });
  const bubble = { x: 215, y: 735, w: 1490 };
  const span = (c0, c1) => table.mark(0, 7, c0, c1, 0);

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say, show } = narrator(root, tl);
  const focus = switcher(tl);
  const reveal = (cols, position) => tl.to(cols.map((j) => table.column(j)), { opacity: 1, duration: 0.4, stagger: 0.12 }, position);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(table.node, { opacity: 0, y: 20, duration: 0.7 }, "<0.2");
  focus([span(0, 2)], "<0.3");
  say(`<b>Les entrées.</b> Avec 3 variables il y a ${tex("2^3 = 8")} lignes, écrites dans l'ordre binaire de 000 à 111&nbsp;:
    ${tex("c")} change à chaque ligne, ${tex("b")} toutes les 2 lignes et ${tex("a")} toutes les 4.`, bubble);
  pause(tl);
  reveal([3, 4, 5]);
  focus([span(3, 5)], "<0.1");
  say(`<b>Signaux communs.</b> On calcule d'abord les colonnes utiles aux deux circuits. Un AND vaut 1 seulement si ses
    deux entrées valent 1, un OR vaut 0 seulement si ses deux entrées valent 0.`, bubble);
  pause(tl);
  reveal([6, 7]);
  focus([span(6, 7)], "<0.1");
  say(`<b>Circuit 1.</b> ${tex("b + a\\cdot c")} est le OR des colonnes ${tex("b")} et ${tex("a\\cdot c")}.
    ${tex("(a+b)\\cdot c")} est le AND des colonnes ${tex("a+b")} et ${tex("c")}.`, bubble);
  pause(tl);
  reveal([8]);
  focus([span(8, 8), table.mark(5, 5, 0, 8, 0)], "<0.1");
  say(`${tex("s_1")} est le OR des deux colonnes précédentes. Exemple sur la ligne 101&nbsp;:
    ${tex("b + a\\cdot c = 1")} et ${tex("(a+b)\\cdot c = 1")}, donc ${tex("s_1 = 1")}.`, bubble);
  pause(tl);
  reveal([9, 10]);
  focus([span(9, 10)], "<0.1");
  say(`<b>Circuit 2.</b> ${tex("(a+b)(b+c)")} est le AND des colonnes ${tex("a+b")} et ${tex("b+c")}.
    ${tex(NOR)} vaut 1 seulement si ${tex(`${no("b")} = ${no("c")} = 0`)}, c'est-à-dire si ${tex("b = c = 1")}.`, bubble);
  pause(tl);
  reveal([11]);
  focus([span(11, 11), table.mark(5, 5, 0, 11, 0)], "<0.1");
  say(`${tex("s_2")} est le OR de trois colonnes&nbsp;: ${tex("(a+b)(b+c)")}, ${tex("a\\cdot c")} et ${tex(NOR)}.
    Sur la ligne 101&nbsp;: ${tex("1 + 1 + 0 = 1")}.`, bubble);
  pause(tl);
  focus([]);
  showMarks(tl, [table.mark(0, 7, 8, 8, 1), table.mark(0, 7, 11, 11, 1)], "<0.1", 0.2);
  show([conclusion], "<0.2");
  pause(tl);
  return tl;
}

/** Q4: both equations reduce to b + a·c, one rule per step. */
export function ex1Algebra(root) {
  const heading = title(root, "Exercice 1 — Q4 : preuve algébrique");
  const first = derivation(root, (html) => box(root, { x: 100, y: 165, w: 840, color: 0, title: "Circuit 1", html }), [
    ["s_1", "= b + a\\cdot c + (a+b)\\cdot c", "\\text{(Q1)}"],
    ["", "= b + a\\cdot c + a\\cdot c + b\\cdot c", "\\text{distributivité}"],
    ["", "= b + b\\cdot c + a\\cdot c", "x + x = x"],
    ["", "= b + a\\cdot c", "b + b\\cdot c = b"],
  ], { size: 28 });
  const second = derivation(root, (html) => box(root, { x: 980, y: 165, w: 840, color: 0, title: "Circuit 2", html }), [
    [NOR, `= ${no(no("b"))}\\cdot${no(no("c"))} = b\\cdot c`, "\\text{De Morgan}"],
    ["(a+b)(b+c)", "= a\\cdot b + a\\cdot c + b\\cdot b + b\\cdot c", ""],
    ["", "= b + a\\cdot b + a\\cdot c + b\\cdot c", "b\\cdot b = b"],
    ["", "= b + a\\cdot c", "\\text{absorption}"],
    ["s_2", "= b + a\\cdot c + a\\cdot c + b\\cdot c", ""],
    ["", "= b + a\\cdot c", ""],
  ], { size: 28 });
  const conclusion = box(root, {
    x: 100, y: 745, w: 1720, color: 1,
    title: "Réponse : les deux circuits calculent la même fonction",
    html: tex("s_1 = s_2 = b + a\\cdot c", true),
  });
  const bubble = { x: 100, y: 745, w: 1720 };
  const steps = [
    [first, 0, `On part de l'équation de Q1. Le but est de la simplifier avec les règles des rappels.`],
    [first, 1, `On développe ${tex("(a+b)\\cdot c = a\\cdot c + b\\cdot c")}, comme en algèbre ordinaire.`],
    [first, 2, `${tex("a\\cdot c")} apparaît deux fois. Or ${tex("x + x = x")}, on n'en garde qu'un.`],
    [first, 3, `<b>Absorption</b>&nbsp;: ${tex("b + b\\cdot c = b")}. Si ${tex("b = 1")} les deux côtés valent 1, si ${tex("b = 0")} ils valent 0.`],
    [second, 0, `Circuit 2. On simplifie d'abord la sortie de la porte 8 avec De Morgan, ${tex(`${no("x+y")} = ${no("x")}\\cdot${no("y")}`)}, puis ${tex(`${no(no("x"))} = x`)}.`],
    [second, 1, `On développe la sortie de la porte 3, terme à terme.`],
    [second, 2, `${tex("b\\cdot b = b")}, et on place ${tex("b")} en tête pour voir les absorptions.`],
    [second, 3, `${tex("b")} absorbe tous les termes qui le contiennent&nbsp;: ${tex("b + a\\cdot b = b")} et ${tex("b + b\\cdot c = b")}.`],
    [second, 4, `On remplace chaque morceau de ${tex("s_2")} par sa forme simplifiée.`],
    [second, 5, `Comme pour ${tex("s_1")}&nbsp;: ${tex("a\\cdot c + a\\cdot c = a\\cdot c")}, puis ${tex("b + b\\cdot c = b")}.`],
  ];

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say, show } = narrator(root, tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(first.node, { opacity: 0, y: 30, duration: 0.8 }, "<0.2");
  steps.forEach(([d, i, text], k) => {
    if (k) pause(tl);
    const opensBox = d === second && i === 0;
    if (opensBox) tl.from(second.node, { opacity: 0, y: 30, duration: 0.8 });
    gsap.set(d.line(i), { opacity: 0 });
    tl.to(d.line(i), { opacity: 1, duration: 0.5 }, k === 0 ? "<0.4" : opensBox ? "<0.1" : undefined);
    say(text, bubble);
  });
  pause(tl);
  show([conclusion]);
  pause(tl);
  return tl;
}

/** Q5: canonical forms of s, from the truth table of Q3. */
export function ex1Canonical(root) {
  return canonical(root, {
    heading: "Exercice 1 — Q5 : formes canoniques",
    cols: [["s", rowsOf(3).map((b) => S(...b))]],
    out: "s",
    forms: ["sop", "pos"],
    intro: `On reprend la table de ${tex("s")} trouvée en Q3. À chaque ligne on associe un <b>produit</b> de toutes les variables, qui ne vaut 1 que sur
      cette ligne, et une <b>somme</b> de toutes les variables, qui ne vaut 0 que sur cette ligne.`,
  });
}

/** The minimal circuit b + a·c. */
function minimal(root, layer) {
  const c = circuit(root, layer, { x: 140, y: 250, s: 1.5 });
  const rails = [["a", 0], ["b", 60], ["c", 120]].map(([name, x]) => c.rail(name, x, 30, 320));
  const and = c.gate("AND", 230, 210);
  const or = c.gate("OR", 420, 140);
  const andWires = [c.dot(0, 190), c.wire([0, 190], and.in[0]), c.dot(120, 230), c.wire([120, 230], and.in[1])];
  const orWires = [c.dot(60, 120), c.wire([60, 120], or.in[0]), c.wire(and.out, [370, 210], [370, or.in[1][1]], or.in[1])];
  const out = c.output(or, "s");
  const signal = c.signal("a\\cdot c", 345, 238);
  return { c, rails, and, or, andWires, orWires, out, signal };
}

/** Q6: b + a·c needs one AND and one OR. */
export function ex1Minimal(root) {
  const heading = title(root, "Exercice 1 — Q6 : câblage minimal");
  const m = minimal(root, canvas(root));
  const start = box(root, { x: 1120, y: 180, w: 700, color: 0, title: "Point de départ (Q4)", html: tex("s = b + a\\cdot c", true) });
  const answer = box(root, {
    x: 1120, y: 470, w: 700, color: 1,
    title: "Réponse",
    html: `2 portes&nbsp;: un AND et un OR, contre 5 portes pour le circuit 1 et 9 pour le circuit 2.`,
  });
  const bubble = { x: 100, y: 830, w: 960 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  const focus = switcher(tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(start, { opacity: 0, x: 30, duration: 0.7 }, "<0.2");
  m.c.show(tl, m.rails, "<0.2");
  say(`La transformation algébrique est déjà faite en Q4&nbsp;: ${tex("s = b + a\\cdot c")}. Cette expression ne contient que
    deux opérations, il suffit de la câbler.`, bubble);
  pause(tl);
  m.c.show(tl, [m.and, ...m.andWires]);
  tl.from(m.signal, { opacity: 0, duration: 0.4 }, "<0.3");
  focus([m.c.glow(m.and, 0)], "<");
  say(`Le produit ${tex("a\\cdot c")} demande une porte <b>AND</b> reliée aux fils ${tex("a")} et ${tex("c")}.`, bubble);
  pause(tl);
  m.c.show(tl, [m.or, ...m.orWires, ...m.out]);
  focus([m.c.glow(m.or, 0)], "<");
  say(`On ajoute ${tex("b")} avec une porte <b>OR</b>. Sa sortie est ${tex("s = b + a\\cdot c")}.`, bubble);
  pause(tl);
  focus([]);
  tl.from(answer, { opacity: 0, x: 30, duration: 0.7 }, "<0.1");
  say(`<b>Pourquoi c'est minimal.</b> ${tex("s")} dépend des trois variables, et une porte à deux entrées n'en combine que deux.
    Il faut donc au moins deux portes.`, { ...bubble, color: 1 });
  pause(tl);
  return tl;
}

/** Q7: response time of the minimal circuit. */
export function ex1MinimalDelay(root) {
  const heading = title(root, "Exercice 1 — Q7 : temps de réponse du câblage minimal");
  const m = minimal(root, canvas(root));
  const panel = box(root, {
    x: 1120, y: 180, w: 700, color: 0,
    title: "Instant où la sortie est valide",
    html: `<div class="panel-small">${line("AND", `entrées ${tex("a, c")} valides à 0, donc ${tex("T")}`)}${line("OR", tex("\\max(0, T) + T = 2T"))}</div>`,
  });
  const answer = box(root, { x: 1120, y: 470, w: 700, color: 2, title: "Réponse", html: tex("t = 2T", true) });
  const times = [m.c.time(m.and, "T", 24), m.c.time(m.or, "2T", 24)];
  const bubble = { x: 100, y: 830, w: 960 };
  const lines = [...panel.querySelectorAll(".out-line")];

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  const focus = switcher(tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  m.c.reveal(tl, "<0.2");
  tl.from(m.signal, { opacity: 0, duration: 0.4 }, "<0.3");
  tl.from(panel, { opacity: 0, x: 30, duration: 0.7 }, "<0.2");
  say(`Même règle qu'en Q2&nbsp;: une porte donne une sortie valide ${tex("T")} après que toutes ses entrées sont valides.`, bubble);
  pause(tl);
  focus([m.c.glow(m.and, 0)]);
  tl.from([times[0], lines[0]], { opacity: 0, duration: 0.5, stagger: 0.1 }, "<0.2");
  say(`La porte AND ne dépend que des entrées ${tex("a")} et ${tex("c")}&nbsp;: sortie valide à ${tex("T")}.`, bubble);
  pause(tl);
  focus([m.c.glow(m.or, 0)]);
  tl.from([times[1], lines[1]], { opacity: 0, duration: 0.5, stagger: 0.1 }, "<0.2");
  say(`La porte OR attend la porte AND (${tex("T")}). L'entrée ${tex("b")} est prête dès 0 mais ne change rien. Sortie à ${tex("2T")}.`, bubble);
  pause(tl);
  focus([]);
  lightPath(tl, m.c, [m.andWires[1], m.and, m.orWires[2], m.or], "<0.1");
  tl.from(answer, { opacity: 0, x: 30, duration: 0.7 }, "<0.3");
  say(`Le chemin le plus long traverse 2 portes&nbsp;: ${tex("t = 2T")}. C'est plus rapide que le circuit 1 (${tex("3T")}) et que le circuit 2 (${tex("4T")}).`, { ...bubble, color: 2 });
  pause(tl);
  return tl;
}

/**
 * A single-gate-type wiring (Q8, Q9): the derivation is written line by line on the left,
 * then the circuit is built gate by gate on the right.
 */
function universal(root, { heading, lines, texts, build, steps, result, last }) {
  const head = title(root, heading);
  const proof = derivation(root, (html) => box(root, { x: 100, y: 170, w: 880, color: 0, title: "Transformation", html }), lines, { size: 28 });
  const built = build(root, canvas(root));
  const bilan = box(root, { x: 100, y: 640, w: 880, color: 1, title: "Réponse", html: result });
  const bubble = { x: 100, y: 830, w: 1720 };
  const lineCount = lines.length;

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  const focus = switcher(tl);
  tl.from(head, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(proof.node, { opacity: 0, y: 30, duration: 0.8 }, "<0.2");
  for (let i = 1; i < lineCount; i++) gsap.set(proof.line(i), { opacity: 0 });
  say(texts[0], bubble);
  for (let i = 1; i < lineCount; i++) {
    pause(tl);
    tl.to(proof.line(i), { opacity: 1, duration: 0.5 });
    say(texts[i], bubble);
  }
  steps(built).forEach((step, k) => {
    pause(tl);
    built.c.show(tl, [...(k ? [] : built.rails), ...step.parts]);
    focus(step.gates.map((g) => built.c.glow(g, 0)), "<");
    if (step.labels) tl.from(step.labels, { opacity: 0, duration: 0.4 }, "<0.3");
    say(step.text, bubble);
  });
  pause(tl);
  focus([]);
  tl.from(bilan, { opacity: 0, y: 30, duration: 0.7 });
  say(last, { ...bubble, color: 1 });
  pause(tl);
  return tl;
}

/** NAND-only circuit: NAND(b, b) = not b, NAND(a, c), then NAND of both. */
function nandCircuit(root, layer) {
  const c = circuit(root, layer, { x: 1080, y: 220, s: 1.15 });
  const rails = [["a", 0], ["b", 60], ["c", 120]].map(([name, x]) => c.rail(name, x, 30, 330));
  const n1 = c.gate("NAND", 230, 100);
  const n2 = c.gate("NAND", 230, 250);
  const n3 = c.gate("NAND", 440, 175);
  const p1 = [n1, c.dot(60, 100), c.wire([60, 100], [180, 100]), c.wire([180, n1.in[0][1]], [180, n1.in[1][1]]),
    c.wire([180, n1.in[0][1]], n1.in[0]), c.wire([180, n1.in[1][1]], n1.in[1]), c.dot(180, 100)];
  const p2 = [n2, c.dot(0, 230), c.wire([0, 230], n2.in[0]), c.dot(120, 270), c.wire([120, 270], n2.in[1])];
  const p3 = [n3, c.wire(n1.out, [390, 100], [390, n3.in[0][1]], n3.in[0]), c.wire(n2.out, [390, 250], [390, n3.in[1][1]], n3.in[1]), ...c.output(n3, "s")];
  return { c, rails, gates: [n1, n2, n3], parts: [p1, p2, p3], labels: [c.signal(no("b"), 355, 72), c.signal(no("a\\cdot c"), 350, 282)] };
}

/** Q8: NAND only. */
export function ex1Nand(root) {
  return universal(root, {
    heading: "Exercice 1 — Q8 : câblage uniquement en NAND",
    lines: [
      ["s", "= b + a\\cdot c", ""],
      ["", `= ${no(no("b + a\\cdot c"))}`, `${no(no("x"))} = x`],
      ["", `= ${no(`${no("b")}\\cdot ${no("a\\cdot c")}`)}`, "\\text{De Morgan}"],
      ["", `= \\text{NAND}\\big(${no("b")},\\ \\text{NAND}(a, c)\\big)`, ""],
      [no("b"), "= \\text{NAND}(b, b)", ""],
    ],
    texts: [
      `<b>Objectif.</b> Une porte NAND calcule ${tex(`${no("x\\cdot y")}`)}, un produit complémenté. On transforme ${tex("b + a\\cdot c")} pour ne faire apparaître que ce motif.`,
      `On complémente deux fois. Cela ne change rien, puisque ${tex(`${no(no("x"))} = x`)}, mais cela crée la barre extérieure d'un NAND.`,
      `De Morgan sur la barre intérieure&nbsp;: ${tex(`${no("X + Y")} = ${no("X")}\\cdot${no("Y")}`)}, avec ${tex("X = b")} et ${tex("Y = a\\cdot c")}. La somme devient un produit.`,
      `On reconnaît deux NAND&nbsp;: ${tex(`${no("a\\cdot c")} = \\text{NAND}(a, c)`)}, et la grande barre posée sur le produit de ${tex(no("b"))} et ${tex(no("a\\cdot c"))}.`,
      `Il reste ${tex(no("b"))}. Une NAND dont les deux entrées sont reliées à ${tex("b")} donne ${tex(`${no("b\\cdot b")} = ${no("b")}`)}, elle joue le rôle d'une porte NOT.`,
    ],
    build: nandCircuit,
    steps: (built) => [
      { parts: built.parts[0], gates: [built.gates[0]], labels: [built.labels[0]], text: `Porte 1&nbsp;: NAND aux deux entrées reliées à ${tex("b")}, elle donne ${tex(no("b"))}.` },
      { parts: built.parts[1], gates: [built.gates[1]], labels: [built.labels[1]], text: `Porte 2&nbsp;: ${tex("\\text{NAND}(a, c)")} donne ${tex(no("a\\cdot c"))}.` },
      { parts: built.parts[2], gates: [built.gates[2]], text: `Porte 3&nbsp;: la NAND des deux sorties précédentes donne ${tex("s")}.` },
    ],
    result: `3 portes NAND, chemin le plus long de 2 portes&nbsp;: ${tex("t = 2T")}.`,
    last: `Comme pour le câblage minimal, le temps de réponse est ${tex("2T")}. La porte 1 travaille en même temps que la porte 2.`,
  });
}

/** NOR-only circuit: NOR(a, b), NOR(b, c), then NOR of both. */
function norCircuit(root, layer) {
  const c = circuit(root, layer, { x: 1080, y: 220, s: 1.15 });
  const rails = [["a", 0], ["b", 60], ["c", 120]].map(([name, x]) => c.rail(name, x, 30, 330));
  const r1 = c.gate("NOR", 230, 100);
  const r2 = c.gate("NOR", 230, 250);
  const r3 = c.gate("NOR", 440, 175);
  const p1 = [r1, c.dot(0, 80), c.wire([0, 80], r1.in[0]), c.dot(60, 120), c.wire([60, 120], r1.in[1])];
  const p2 = [r2, c.dot(60, 230), c.wire([60, 230], r2.in[0]), c.dot(120, 270), c.wire([120, 270], r2.in[1])];
  const p3 = [r3, c.wire(r1.out, [390, 100], [390, r3.in[0][1]], r3.in[0]), c.wire(r2.out, [390, 250], [390, r3.in[1][1]], r3.in[1]), ...c.output(r3, "s")];
  return { c, rails, gates: [r1, r2, r3], parts: [p1, p2, p3], labels: [c.signal(no("a+b"), 370, 66), c.signal(no("b+c"), 370, 284)] };
}

/** Q9: NOR only. */
export function ex1Nor(root) {
  return universal(root, {
    heading: "Exercice 1 — Q9 : câblage uniquement en NOR",
    lines: [
      ["s", "= b + a\\cdot c", ""],
      ["", "= (a+b)(b+c)", "x + y\\,z = (x+y)(x+z)"],
      ["", `= ${no(no("(a+b)(b+c)"))}`, `${no(no("x"))} = x`],
      ["", `= ${no(`${no("a+b")} + ${no("b+c")}`)}`, "\\text{De Morgan}"],
      ["", "= \\text{NOR}\\big(\\text{NOR}(a, b),\\ \\text{NOR}(b, c)\\big)", ""],
    ],
    texts: [
      `<b>Objectif.</b> Une porte NOR calcule ${tex(no("x + y"))}, une somme complémentée. Il faut donc faire apparaître des sommes.`,
      `Distributivité de ${tex("+")} sur ${tex("\\cdot")}, vraie en algèbre de Boole&nbsp;: ${tex("b + a\\cdot c = (b + a)(b + c)")}. On obtient un produit de sommes.`,
      `On complémente deux fois, ce qui ne change rien mais crée la barre extérieure d'un NOR.`,
      `De Morgan sur la barre intérieure&nbsp;: ${tex(`${no("X\\cdot Y")} = ${no("X")} + ${no("Y")}`)}. Le produit devient une somme de sommes complémentées.`,
      `On reconnaît trois NOR&nbsp;: ${tex(`${no("a+b")} = \\text{NOR}(a, b)`)}, ${tex(`${no("b+c")} = \\text{NOR}(b, c)`)} et la grande barre. Aucune porte NOT n'est nécessaire.`,
    ],
    build: norCircuit,
    steps: (built) => [
        { parts: [...built.parts[0], ...built.parts[1]], gates: built.gates.slice(0, 2), labels: built.labels, text: `Portes 1 et 2&nbsp;: ${tex("\\text{NOR}(a, b)")} et ${tex("\\text{NOR}(b, c)")}, branchées sur les entrées.` },
      { parts: built.parts[2], gates: [built.gates[2]], text: `Porte 3&nbsp;: la NOR des deux sorties précédentes donne ${tex("s")}.` },
    ],
    result: `3 portes NOR, chemin le plus long de 2 portes&nbsp;: ${tex("t = 2T")}.`,
    last: `On retrouve la dualité&nbsp;: la forme somme de produits ${tex("b + a\\cdot c")} se câble en NAND, la forme produit de sommes ${tex("(a+b)(b+c)")} en NOR.`,
  });
}
