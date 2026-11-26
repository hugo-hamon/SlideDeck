import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, canvas, tex, title } from "deck/components.js";
import { circuit, lightPath, narrator, no, switcher } from "../helpers.js";

export const num = (n, small = false) => `<span class="num${small ? " sm" : ""}">${n}</span>`;
export const line = (n, html) => `<div class="out-line">${num(n)} ${html}</div>`;

/** Circuit 1 of the sheet, with numbered gates and the inputs of each gate. */
function circuit1(root, layer) {
  const c = circuit(root, layer, { x: 110, y: 185, s: 1.15 });
  for (const [name, x] of [["a", 0], ["b", 60], ["c", 120]]) c.rail(name, x, 30, 470);
  const g = [c.gate("AND", 230, 140), c.gate("OR", 420, 120), c.gate("OR", 230, 320), c.gate("AND", 420, 380), c.gate("OR", 640, 250)];
  const [g1, g2, g3, g4, g5] = g;
  c.dot(0, 120); const a1 = c.wire([0, 120], g1.in[0]);
  c.dot(120, 160); const c1 = c.wire([120, 160], g1.in[1]);
  c.dot(60, 60); const b2 = c.wire([60, 60], [385, 60], [385, g2.in[0][1]], g2.in[0]);
  const w12 = c.wire(g1.out, g2.in[1]);
  c.dot(0, 300); const a3 = c.wire([0, 300], g3.in[0]);
  c.dot(60, 340); const b3 = c.wire([60, 340], g3.in[1]);
  const w34 = c.wire(g3.out, [370, 320], [370, g4.in[0][1]], g4.in[0]);
  c.dot(120, 400); const c4 = c.wire([120, 400], g4.in[1]);
  const w25 = c.wire(g2.out, [575, 120], [575, g5.in[0][1]], g5.in[0]);
  const w45 = c.wire(g4.out, [575, 380], [575, g5.in[1][1]], g5.in[1]);
  c.output(g5, "s_1");
  const inputs = [[a1, c1], [b2, w12], [a3, b3], [w34, c4], [w25, w45]];
  const badges = g.map((gate, i) => c.badge(gate, i + 1));
  return { c, g, inputs, badges, path: [a3, g3, w34, g4, w45, g5] };
}

/** Circuit 2 of the sheet: gates 1–5 on top, inverters 6–7, NOR 8 and the output OR 9. */
function circuit2(root, layer) {
  const c = circuit(root, layer, { x: 110, y: 190, s: 0.98 });
  for (const [name, x] of [["a", 0], ["b", 60], ["c", 120]]) c.rail(name, x, 30, 560);
  const g = [
    c.gate("OR", 230, 80), c.gate("OR", 230, 200), c.gate("AND", 420, 140), c.gate("AND", 420, 300), c.gate("OR", 610, 220),
    c.gate("NOT", 230, 410), c.gate("NOT", 230, 500), c.gate("NOR", 420, 455), c.gate("OR", 790, 330),
  ];
  const [h1, h2, h3, h4, h5, nb, nc, h6, h7] = g;
  c.dot(0, 60); const a1 = c.wire([0, 60], h1.in[0]);
  c.dot(60, 100); const b1 = c.wire([60, 100], h1.in[1]);
  c.dot(60, 180); const b2 = c.wire([60, 180], h2.in[0]);
  c.dot(120, 220); const c2 = c.wire([120, 220], h2.in[1]);
  const w13 = c.wire(h1.out, [370, 80], [370, h3.in[0][1]], h3.in[0]);
  const w23 = c.wire(h2.out, [370, 200], [370, h3.in[1][1]], h3.in[1]);
  c.dot(0, 280); const a4 = c.wire([0, 280], h4.in[0]);
  c.dot(120, 320); const c4 = c.wire([120, 320], h4.in[1]);
  const w35 = c.wire(h3.out, [560, 140], [560, h5.in[0][1]], h5.in[0]);
  const w45 = c.wire(h4.out, [560, 300], [560, h5.in[1][1]], h5.in[1]);
  c.dot(60, 410); const b6 = c.wire([60, 410], nb.in[0]);
  c.dot(120, 500); const c7 = c.wire([120, 500], nc.in[0]);
  const w68 = c.wire(nb.out, [365, 410], [365, h6.in[0][1]], h6.in[0]);
  const w78 = c.wire(nc.out, [365, 500], [365, h6.in[1][1]], h6.in[1]);
  const w59 = c.wire(h5.out, [745, 220], [745, h7.in[0][1]], h7.in[0]);
  const w89 = c.wire(h6.out, [745, 455], [745, h7.in[1][1]], h7.in[1]);
  c.output(h7, "s_2");
  const inputs = [[a1, b1], [b2, c2], [w13, w23], [a4, c4], [w35, w45], [b6], [c7], [w68, w78], [w59, w89]];
  const badges = g.map((gate, i) => c.badge(gate, i + 1));
  return { c, g, inputs, badges, path: [a1, h1, w13, h3, w35, h5, w59, h7] };
}

/**
 * Walks through the circuit one step per entry of `steps`: the gates of the step and their
 * input wires light up in blue, then its labels, its lines in the panel and its explanation.
 */
function walk(tl, { built, panel, say, steps, bubble }) {
  const focus = switcher(tl);
  const lines = [...panel.querySelectorAll(".out-line")];
  let next = 0;
  for (const step of steps) {
    pause(tl);
    const glows = step.gates.flatMap((i) => [built.c.glow(built.g[i], 0), ...built.inputs[i].map((w) => built.c.glow(w, 0))]);
    focus(glows);
    if (step.labels?.length) tl.from(step.labels, { opacity: 0, y: 8, duration: 0.5, stagger: 0.1 }, "<0.2");
    const count = step.lines ?? step.gates.length;
    tl.from(lines.slice(next, next + count), { opacity: 0, x: 20, duration: 0.5, stagger: 0.12 }, "<0.1");
    next += count;
    say(step.text, bubble);
  }
  return focus;
}

/** Exercise 1, Q1 on circuit 1: the equation is read gate by gate. */
export function c1Equation(root) {
  const heading = title(root, "Exercice 1 — Q1 : équation du circuit 1");
  const built = circuit1(root, canvas(root));
  const { c } = built;
  const labels = [
    c.signal("a\\cdot c", 360, 172),
    c.signal("b+a\\cdot c", 650, 165),
    c.signal("a+b", 335, 290),
    c.signal("(a+b)\\cdot c", 660, 340),
  ];
  const panel = box(root, {
    x: 1130, y: 180, w: 690, color: 0,
    title: "Sortie de chaque porte",
    html: [
      line(1, `AND entre ${tex("a")} et ${tex("c")}&nbsp;: ${tex("a\\cdot c")}`),
      line(2, `OR entre ${tex("b")} et ${num(1, true)}&nbsp;: ${tex("b + a\\cdot c")}`),
      line(3, `OR entre ${tex("a")} et ${tex("b")}&nbsp;: ${tex("a + b")}`),
      line(4, `AND entre ${num(3, true)} et ${tex("c")}&nbsp;: ${tex("(a+b)\\cdot c")}`),
      line(5, `OR entre ${num(2, true)} et ${num(4, true)}&nbsp;: ${tex("s_1")}`),
    ].join(""),
  });
  const answer = box(root, {
    x: 1130, y: 640, w: 690, color: 1,
    title: "Réponse",
    html: tex("s_1 = (b + a\\cdot c) + (a+b)\\cdot c", true),
  });
  const bubble = { x: 100, y: 830, w: 960 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  c.reveal(tl, "<0.2");
  tl.from(built.badges, { opacity: 0, duration: 0.4, stagger: 0.06 }, "<0.4");
  tl.from(panel, { opacity: 0, x: 30, duration: 0.7 }, "<0.2");
  say(`<b>Méthode.</b> On lit le circuit de gauche à droite. Pour chaque porte, on regarde à quoi sont reliées
    ses entrées, puis on écrit sa sortie. Les portes sont numérotées de 1 à 5.`, bubble);
  walk(tl, {
    built, panel, say, bubble,
    steps: [
      { gates: [0], labels: [labels[0]], text: `La porte 1 est un <b>AND</b>. Ses deux entrées sont reliées aux fils ${tex("a")} et ${tex("c")}, donc elle calcule ${tex("a\\cdot c")}.` },
      { gates: [1], labels: [labels[1]], text: `La porte 2 est un <b>OR</b>. Une entrée vient directement de ${tex("b")}, l'autre est la sortie de la porte 1. Elle calcule ${tex("b + a\\cdot c")}.` },
      { gates: [2], labels: [labels[2]], text: `La porte 3 est un OR branché sur les fils ${tex("a")} et ${tex("b")}. Sa sortie vaut ${tex("a + b")}.` },
      { gates: [3], labels: [labels[3]], text: `La porte 4 est un AND entre la sortie de la porte 3 et le fil ${tex("c")}. Les parenthèses sont indispensables, car ${tex("(a+b)\\cdot c \\neq a + b\\cdot c")}.` },
      { gates: [4], text: `La porte 5 réunit les deux branches par un OR. Sa sortie est ${tex("s_1")}, ce qui donne l'équation du circuit.` },
    ],
  });
  tl.from(answer, { opacity: 0, y: 30, duration: 0.8 }, "<0.3");
  pause(tl);
  return tl;
}

/** Exercise 1, Q1 on circuit 2. */
export function c2Equation(root) {
  const heading = title(root, "Exercice 1 — Q1 : équation du circuit 2");
  const built = circuit2(root, canvas(root));
  const { c } = built;
  const nor = no(`${no("b")}+${no("c")}`);
  const labels = {
    l1: c.signal("a+b", 345, 52),
    l2: c.signal("b+c", 340, 232),
    l3: c.signal("(a+b)(b+c)", 610, 112),
    l4: c.signal("a\\cdot c", 605, 290),
    nb: c.signal(no("b"), 322, 384),
    nc: c.signal(no("c"), 322, 528),
    l8: c.signal(nor, 620, 490),
  };
  const panel = box(root, {
    x: 1090, y: 170, w: 730, color: 0,
    title: "Sortie de chaque porte",
    html: `<div class="panel-small">${[
      line(1, `OR&nbsp;: ${tex("a + b")}`),
      line(2, `OR&nbsp;: ${tex("b + c")}`),
      line(3, `AND de ${num(1, true)} et ${num(2, true)}&nbsp;: ${tex("(a+b)(b+c)")}`),
      line(4, `AND&nbsp;: ${tex("a\\cdot c")}`),
      line(5, `OR de ${num(3, true)} et ${num(4, true)}&nbsp;: ${tex("(a+b)(b+c) + a\\cdot c")}`),
      line(6, `NOT&nbsp;: ${tex(no("b"))}`),
      line(7, `NOT&nbsp;: ${tex(no("c"))}`),
      line(8, `NOR de ${num(6, true)} et ${num(7, true)}&nbsp;: ${tex(nor)}`),
      line(9, `OR de ${num(5, true)} et ${num(8, true)}&nbsp;: ${tex("s_2")}`),
    ].join("")}</div>`,
  });
  const answer = box(root, {
    x: 1090, y: 745, w: 730, color: 1,
    title: "Réponse",
    html: tex(`s_2 = (a+b)(b+c) + a\\cdot c + ${nor}`, true),
  });
  const bubble = { x: 100, y: 830, w: 940 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  c.reveal(tl, "<0.2");
  tl.from(built.badges, { opacity: 0, duration: 0.4, stagger: 0.05 }, "<0.4");
  tl.from(panel, { opacity: 0, x: 30, duration: 0.7 }, "<0.2");
  say(`<b>Même méthode</b> que pour le circuit 1, sur 9 portes dont deux portes NOT (6 et 7).
    On avance de gauche à droite, une porte à la fois.`, bubble);
  walk(tl, {
    built, panel, say, bubble,
    steps: [
      { gates: [0, 1], labels: [labels.l1, labels.l2], text: `Les portes 1 et 2 sont des OR branchés directement sur les entrées. Elles calculent ${tex("a + b")} et ${tex("b + c")}.` },
      { gates: [2], labels: [labels.l3], text: `La porte 3 est un AND entre les sorties des portes 1 et 2&nbsp;: ${tex("(a+b)(b+c)")}, en gardant les parenthèses.` },
      { gates: [3], labels: [labels.l4], text: `La porte 4 est un AND relié aux fils ${tex("a")} et ${tex("c")}&nbsp;: ${tex("a\\cdot c")}.` },
      { gates: [4], text: `La porte 5 additionne (OR) les sorties des portes 3 et 4. Sa sortie est ${tex("(a+b)(b+c) + a\\cdot c")}.` },
      { gates: [5, 6], labels: [labels.nb, labels.nc], text: `Les portes 6 et 7 sont des portes <b>NOT</b>&nbsp;: un triangle suivi d'un rond. Elles donnent ${tex(no("b"))} et ${tex(no("c"))}.` },
      { gates: [7], labels: [labels.l8], text: `La porte 8 est un OR suivi d'un rond, c'est-à-dire une porte <b>NOR</b>. Elle calcule le complément de ${tex(`${no("b")}+${no("c")}`)}.` },
      { gates: [8], text: `La porte 9 réunit les sorties des portes 5 et 8 par un OR, ce qui donne ${tex("s_2")}.` },
    ],
  });
  tl.from(answer, { opacity: 0, y: 30, duration: 0.8 }, "<0.3");
  pause(tl);
  return tl;
}

/**
 * Propagation times, level by level: each step writes the times inside its gates, a line in
 * the panel and an explanation, then the longest path lights up in red.
 */
function delays(root, { heading, built, panelLines, steps, answer, intro, last, bubble }) {
  const head = title(root, heading);
  const { c, g } = built;
  const panel = box(root, { x: 1130, y: 180, w: 690, color: 0, title: "Instant où la sortie est valide", html: `<div class="panel-small">${panelLines.join("")}</div>` });
  const result = box(root, answer);
  const times = steps.map((step) => step.times.map(([i, t]) => c.time(g[i], t, g[i].type === "NOT" ? 18 : 24)));

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say } = narrator(root, tl);
  tl.from(head, { opacity: 0, y: -16, duration: 0.7 });
  c.reveal(tl, "<0.2");
  tl.from(built.badges, { opacity: 0, duration: 0.4, stagger: 0.05 }, "<0.4");
  tl.from(panel, { opacity: 0, x: 30, duration: 0.7 }, "<0.2");
  say(intro, bubble);
  const focus = switcher(tl);
  const lines = [...panel.querySelectorAll(".out-line")];
  let next = 0;
  steps.forEach((step, k) => {
    pause(tl);
    focus(step.times.map(([i]) => c.glow(g[i], 0)));
    tl.from(times[k], { opacity: 0, scale: 0.5, duration: 0.5, ease: "back.out(2)", stagger: 0.08 }, "<0.2");
    tl.from(lines.slice(next, next + step.lines), { opacity: 0, x: 20, duration: 0.5, stagger: 0.12 }, "<0.1");
    next += step.lines;
    say(step.text, bubble);
  });
  pause(tl);
  focus([]);
  lightPath(tl, c, built.path, "<0.2");
  tl.from(result, { opacity: 0, y: 30, duration: 0.8 }, "<0.3");
  say(last, { ...bubble, color: 2 });
  pause(tl);
  return tl;
}

const RULE = `Chaque porte met un temps ${tex("T")} à réagir et les entrées ${tex("a, b, c")} sont fixées à l'instant 0.
  Une porte donne une sortie valide ${tex("T")} après que <b>toutes</b> ses entrées sont valides.`;

/** Exercise 1, Q2 on circuit 1. */
export function c1Delay(root) {
  return delays(root, {
    heading: "Exercice 1 — Q2 : temps de réponse du circuit 1",
    built: circuit1(root, canvas(root)),
    bubble: { x: 100, y: 830, w: 960 },
    intro: `<b>Règle.</b> ${RULE}`,
    panelLines: [
      line(1, `entrées ${tex("a, c")} valides à 0, donc ${tex("T")}`),
      line(3, `entrées ${tex("a, b")} valides à 0, donc ${tex("T")}`),
      line(2, tex("\\max(0, T) + T = 2T")),
      line(4, tex("\\max(T, 0) + T = 2T")),
      line(5, tex("\\max(2T, 2T) + T = 3T")),
    ],
    steps: [
      { times: [[0, "T"], [2, "T"]], lines: 2, text: `Les portes 1 et 3 ne sont reliées qu'aux entrées, valides dès l'instant 0. Leurs sorties sont valides à ${tex("T")}.` },
      { times: [[1, "2T"], [3, "2T"]], lines: 2, text: `La porte 2 attend la sortie de la porte 1, valide à ${tex("T")}, puis met ${tex("T")} de plus&nbsp;: ${tex("2T")}. De même, la porte 4 attend la porte 3.` },
      { times: [[4, "3T"]], lines: 1, text: `La porte 5 attend les portes 2 et 4, toutes deux valides à ${tex("2T")}. Sa sortie est valide à ${tex("3T")}.` },
    ],
    answer: { x: 1130, y: 600, w: 690, color: 2, title: "Réponse", html: tex("t_1 = 3T", true) },
    last: `Le temps de réponse est fixé par le <b>chemin le plus long</b> entre une entrée et la sortie, compté en nombre de portes.
      Ici tout chemin traverse 3 portes, par exemple ${tex("a")} → 3 → 4 → 5.`,
  });
}

/** Exercise 1, Q2 on circuit 2. */
export function c2Delay(root) {
  return delays(root, {
    heading: "Exercice 1 — Q2 : temps de réponse du circuit 2",
    built: circuit2(root, canvas(root)),
    bubble: { x: 100, y: 830, w: 940 },
    intro: `<b>Même règle</b> que pour le circuit 1. ${RULE} Les portes NOT comptent comme les autres.`,
    panelLines: [
      line("1 2 4 6 7", `entrées seulement, donc ${tex("T")}`),
      line(3, tex("\\max(T, T) + T = 2T")),
      line(8, tex("\\max(T, T) + T = 2T")),
      line(5, tex("\\max(2T, T) + T = 3T")),
      line(9, tex("\\max(3T, 2T) + T = 4T")),
    ],
    steps: [
      { times: [[0, "T"], [1, "T"], [3, "T"], [5, "T"], [6, "T"]], lines: 1, text: `Les portes 1, 2, 4, 6 et 7 ne dépendent que des entrées. Leurs sorties sont valides à ${tex("T")}, portes NOT comprises.` },
      { times: [[2, "2T"], [7, "2T"]], lines: 2, text: `La porte 3 attend les portes 1 et 2, la porte 8 attend les portes NOT 6 et 7. Toutes sont valides à ${tex("T")}, donc 3 et 8 le sont à ${tex("2T")}.` },
      { times: [[4, "3T"]], lines: 1, text: `La porte 5 attend la <b>plus lente</b> de ses entrées, la porte 3 (${tex("2T")}). La porte 4, prête à ${tex("T")}, ne change rien. Sortie à ${tex("3T")}.` },
      { times: [[8, "4T"]], lines: 1, text: `La porte 9 attend la porte 5 (${tex("3T")}) et la porte 8 (${tex("2T")}). Sa sortie est valide à ${tex("4T")}.` },
    ],
    answer: { x: 1130, y: 600, w: 690, color: 2, title: "Réponse", html: tex("t_2 = 4T", true) },
    last: `Le chemin le plus long, ${tex("a")} → 1 → 3 → 5 → 9, traverse 4 portes. Le circuit 2 est plus lent que le circuit 1 (${tex("3T")}),
      alors qu'il calcule la même fonction, comme le montrera la Q3.`,
  });
}
