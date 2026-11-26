import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { box, tex, title } from "deck/components.js";
import { derivation, narrator, no } from "../helpers.js";
import { canonical } from "./canonical.js";

const F = [1, 1, 0, 1, 0, 0, 0, 1];
const NF = F.map((v) => 1 - v);
const [A, B, C] = ["a", "b", "c"].map(no);
const SOP_F = `${A}\\,${B}\\,${C} + ${A}\\,${B}\\,c + ${A}\\,b\\,c + a\\,b\\,c`;
const POS_F = `(a+${B}+c)(${A}+b+c)(${A}+b+${C})(${A}+${B}+c)`;
const SOP_NF = `${A}\\,b\\,${C} + a\\,${B}\\,${C} + a\\,${B}\\,c + a\\,b\\,${C}`;
const POS_NF = `(a+b+c)(a+b+${C})(a+${B}+${C})(${A}+${B}+${C})`;
const blue = (x) => `\\htmlClass{c-blue}{${x}}`;
const green = (x) => `\\htmlClass{c-green}{${x}}`;
const READ = `On lit la table de vérité de l'énoncé. À chaque ligne on associe un <b>produit</b> de toutes les variables, qui ne vaut 1 que sur
      cette ligne, et une <b>somme</b> de toutes les variables, qui ne vaut 0 que sur cette ligne.`;

/** Q1: sum of products of f. */
export function ex2Q1(root) {
  return canonical(root, { heading: `<span>Exercice 2 — Q1 : somme canonique de produits de ${tex("f")}</span>`, cols: [["f", F]], out: "f", forms: ["sop"], intro: READ });
}

/** Q2: product of sums of f. */
export function ex2Q2(root) {
  return canonical(root, { heading: `<span>Exercice 2 — Q2 : produit canonique de sommes de ${tex("f")}</span>`, cols: [["f", F]], out: "f", forms: ["pos"], intro: READ });
}

/** Q3: sum of products of the complement, whose column is built first. */
export function ex2Q3(root) {
  return canonical(root, {
    heading: `<span>Exercice 2 — Q3 : somme canonique de produits de ${tex(no("f"))}</span>`,
    cols: [["f", F], [no("f"), NF]],
    out: no("f"),
    forms: ["sop"],
    intro: `Même méthode, appliquée cette fois à ${tex(no("f"))}. Il faut d'abord sa table de vérité.`,
    later: 1,
    laterText: `La colonne de ${tex(no("f"))} s'obtient en inversant celle de ${tex("f")}&nbsp;: 1 devient 0 et 0 devient 1.`,
  });
}

/** Q4: product of sums of the complement. */
export function ex2Q4(root) {
  return canonical(root, {
    heading: `<span>Exercice 2 — Q4 : produit canonique de sommes de ${tex(no("f"))}</span>`,
    cols: [["f", F], [no("f"), NF]],
    out: no("f"),
    forms: ["pos"],
    intro: `On reprend la colonne de ${tex(no("f"))} construite en Q3, et on écrit cette fois la somme associée à chaque ligne.`,
  });
}

/**
 * A derivation written line by line, one explanation per line, then the answer replaces the
 * explanation.
 */
function proof(root, { heading, boxTitle, lines, texts, answer, size = 32 }) {
  const head = title(root, heading);
  const work = derivation(root, (html) => box(root, { x: 100, y: 170, w: 1720, color: 0, title: boxTitle, html }), lines, { size });
  const result = box(root, { x: 100, y: 690, w: 1720, color: 1, title: "Réponse", html: answer });
  const bubble = { x: 100, y: 690, w: 1720 };

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  const { say, show } = narrator(root, tl);
  tl.from(head, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(work.node, { opacity: 0, y: 30, duration: 0.8 }, "<0.2");
  for (let i = 1; i < lines.length; i++) gsap.set(work.line(i), { opacity: 0 });
  say(texts[0], bubble);
  for (let i = 1; i < lines.length; i++) {
    pause(tl);
    tl.to(work.line(i), { opacity: 1, duration: 0.5 });
    say(texts[i], bubble);
  }
  pause(tl);
  show([result]);
  pause(tl);
  return tl;
}

/** Q5: complementing the sum of products of the complement gives Q2. */
export function ex2Q5(root) {
  return proof(root, {
    heading: `<span>Exercice 2 — Q5 : complément du résultat de Q3</span>`,
    boxTitle: `En partant de la somme de produits de ${tex(no("f"))}`,
    lines: [
      ["f", `= ${no(no("f"))}`, `${no(no("x"))} = x`],
      ["", `= ${no(SOP_NF)}`, "\\text{(Q3)}"],
      ["", `= ${no(`${A}\\,b\\,${C}`)}\\cdot${no(`a\\,${B}\\,${C}`)}\\cdot${no(`a\\,${B}\\,c`)}\\cdot${no(`a\\,b\\,${C}`)}`, "\\text{De Morgan sur la somme}"],
      ["", `= ${POS_F}`, "\\text{De Morgan sur chaque produit}"],
    ],
    texts: [
      `On part de ${tex(`f = ${no(no("f"))}`)}&nbsp;: complémenter deux fois ne change rien.`,
      `On remplace ${tex(no("f"))} par sa somme canonique de produits, trouvée en Q3.`,
      `<b>De Morgan sur la grande barre.</b> Le complément d'une somme est le produit des compléments&nbsp;:
        ${tex(`${no("X + Y + Z + W")} = ${no("X")}\\cdot${no("Y")}\\cdot${no("Z")}\\cdot${no("W")}`)}.`,
      `<b>De Morgan sur chaque produit.</b> Par exemple ${tex(`${no(`${A}\\,b\\,${C}`)} = a + ${B} + c`)}&nbsp;:
        chaque variable change de complément et le produit devient une somme.`,
    ],
    answer: `${tex(`f = ${POS_F}`, true)}On retrouve exactement le produit canonique de sommes de la Q2.`,
  });
}

/** Q6: complementing the product of sums of the complement gives Q1. */
export function ex2Q6(root) {
  return proof(root, {
    heading: `<span>Exercice 2 — Q6 : complément du résultat de Q4</span>`,
    boxTitle: `En partant du produit de sommes de ${tex(no("f"))}`,
    lines: [
      ["f", `= ${no(no("f"))}`, `${no(no("x"))} = x`],
      ["", `= ${no(POS_NF)}`, "\\text{(Q4)}"],
      ["", `= ${no("a+b+c")} + ${no(`a+b+${C}`)} + ${no(`a+${B}+${C}`)} + ${no(`${A}+${B}+${C}`)}`, "\\text{De Morgan sur le produit}"],
      ["", `= ${SOP_F}`, "\\text{De Morgan sur chaque somme}"],
    ],
    texts: [
      `Même démarche qu'en Q5, en partant cette fois du produit de sommes de ${tex(no("f"))}.`,
      `On remplace ${tex(no("f"))} par son produit canonique de sommes, trouvé en Q4.`,
      `<b>De Morgan sur la grande barre.</b> Le complément d'un produit est la somme des compléments&nbsp;:
        ${tex(`${no("X\\cdot Y\\cdot Z\\cdot W")} = ${no("X")} + ${no("Y")} + ${no("Z")} + ${no("W")}`)}.`,
      `<b>De Morgan sur chaque somme.</b> Par exemple ${tex(`${no("a+b+c")} = ${A}\\,${B}\\,${C}`)}&nbsp;:
        chaque variable change de complément et la somme devient un produit.`,
    ],
    answer: `${tex(`f = ${SOP_F}`, true)}On retrouve exactement la somme canonique de produits de la Q1.`,
  });
}

/** Q7: simplification of the sum of products. */
export function ex2Q7(root) {
  return proof(root, {
    heading: "Exercice 2 — Q7 : simplification de la somme de produits",
    boxTitle: "En partant du résultat de Q1",
    lines: [
      ["f", `= ${SOP_F}`, "\\text{(Q1)}"],
      ["", `= ${blue(`${A}\\,${B}\\,${C} + ${A}\\,${B}\\,c`)} + ${green(`${A}\\,b\\,c + a\\,b\\,c`)}`, "\\text{regroupement}"],
      ["", `= ${blue(`${A}\\,${B}\\,(${C} + c)`)} + ${green(`b\\,c\\,(${A} + a)`)}`, "\\text{mise en facteur}"],
      ["", `= ${A}\\cdot${B} + b\\cdot c`, `x + ${no("x")} = 1`],
    ],
    texts: [
      `On part de la somme canonique de produits trouvée en Q1.`,
      `On regroupe les termes qui ne diffèrent que par <b>une seule variable</b>&nbsp;: ${tex(`${A}\\,${B}\\,${C}`)} et ${tex(`${A}\\,${B}\\,c`)}
        ne diffèrent que par ${tex("c")}, ${tex(`${A}\\,b\\,c`)} et ${tex("a\\,b\\,c")} que par ${tex("a")}.`,
      `On met en facteur la partie commune de chaque paire.`,
      `${tex(`${C} + c = 1`)} et ${tex(`${A} + a = 1`)}&nbsp;: la variable qui changeait disparaît.`,
    ],
    answer: `${tex(`f = ${A}\\cdot${B} + b\\cdot c`, true)}C'est bien l'expression demandée par l'énoncé.`,
  });
}

/** Q8: simplification of the product of sums. */
export function ex2Q8(root) {
  return proof(root, {
    heading: "Exercice 2 — Q8 : simplification du produit de sommes",
    boxTitle: "En partant du résultat de Q2",
    lines: [
      ["f", `= ${POS_F}`, "\\text{(Q2)}"],
      ["", `= ${blue(`(a+${B}+c)(${A}+${B}+c)`)}\\cdot${green(`(${A}+b+c)(${A}+b+${C})`)}`, "\\text{regroupement}"],
      ["", `= ${blue(`(${B}+c+a\\,${A})`)}\\cdot${green(`(${A}+b+c\\,${C})`)}`, "(x+y)(x+z) = x + y\\,z"],
      ["", `= (${B}+c)\\cdot(${A}+b)`, `x\\,${no("x")} = 0`],
    ],
    texts: [
      `On part du produit canonique de sommes trouvé en Q2.`,
      `On regroupe les facteurs qui ne diffèrent que par une variable&nbsp;: ${tex(`(a+${B}+c)`)} et ${tex(`(${A}+${B}+c)`)} ne diffèrent que par ${tex("a")},
        ${tex(`(${A}+b+c)`)} et ${tex(`(${A}+b+${C})`)} que par ${tex("c")}. L'ordre des facteurs ne compte pas.`,
      `Distributivité de ${tex("+")} sur ${tex("\\cdot")}, lue à l'envers&nbsp;: ${tex("(x + y)(x + z) = x + y\\,z")}, avec ${tex(`x = ${B} + c`)} pour la première paire.`,
      `${tex(`a\\,${A} = 0`)} et ${tex(`c\\,${C} = 0`)}, puis ${tex("x + 0 = x")}.`,
    ],
    answer: `${tex(`f = (${B}+c)\\cdot(${A}+b)`, true)}C'est bien l'expression demandée par l'énoncé.`,
  });
}
