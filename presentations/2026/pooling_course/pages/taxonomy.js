import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, div, label, tex, title } from "deck/components.js";

const COLUMNS = [250, 420, 250, 290, 170, 140, 110, 130];
const HEAD = ["Méthode", "SEL : comment former S", "RED", "CON", "Affectation", "Tous contribuent", "Creux", "K"];
const yes = `<span class="c-green">✓</span>`;
const no = `<span class="c-red">✗</span>`;
const t = (e) => tex(e);

/* family : 0 sélection de nœuds, 1 affectation souple, 2 affectation dure (regroupement). */
const ROWS = [
  {
    family: 0, studied: true, name: "Top-k", ref: "Gao &amp; Ji, 2019",
    cells: [`score ${t(String.raw`y = Xp / \lVert p \rVert`)}, garde les <i>k</i> meilleurs`, t(String.raw`(X \odot \tanh y)_{\text{idx}}`), t(String.raw`A_{\text{idx},\,\text{idx}}`), "dure, partielle", no, yes, t(String.raw`\lceil rN \rceil`)],
  },
  {
    family: 0, name: "SAGPool", ref: "Lee et al., 2019",
    cells: [`score ${t(String.raw`y = \mathrm{GNN}(X, A)`)}, garde les <i>k</i> meilleurs`, t(String.raw`(X \odot \tanh y)_{\text{idx}}`), t(String.raw`A_{\text{idx},\,\text{idx}}`), "dure, partielle", no, yes, t(String.raw`\lceil rN \rceil`)],
  },
  {
    family: 1, studied: true, name: "DiffPool", ref: "Ying et al., 2018",
    cells: [t(String.raw`S = \mathrm{softmax}(\mathrm{GNN}(X, A))`), t(String.raw`S^\top \mathrm{GNN}(X, A)`), t(String.raw`S^\top A S`), "souple", yes, no, "fixé"],
  },
  {
    family: 1, studied: true, name: "MinCutPool", ref: "Bianchi et al., 2020",
    cells: [`${t(String.raw`S = \mathrm{softmax}(\mathrm{MLP}(X))`)}<br>+ perte de coupe minimale`, t(String.raw`S^\top X`), `${t(String.raw`S^\top A S`)}, diagonale nulle, normalisée`, "souple", yes, no, "fixé"],
  },
  {
    family: 2, name: "Graclus", ref: "Dhillon et al., 2007",
    cells: ["appariement glouton des voisins (non appris)", "max ou moyenne de la paire", t(String.raw`S^\top A S`), "dure", yes, yes, t(String.raw`\approx N/2`)],
  },
  {
    family: 2, name: "EdgePool", ref: "Diehl, 2019",
    cells: ["score d’arête appris, contraction gloutonne", t(String.raw`s_{ij}\,(x_i + x_j)`), "voisinages fusionnés", "dure", yes, yes, t(String.raw`\approx N/2`)],
  },
  {
    family: 2, studied: true, name: "MIVSPool", ref: "Stanovic et al., 2022",
    cells: ["survivants = ensemble indépendant maximal (scores appris)", "agrégation de chaque groupe", "survivants reliés si groupes voisins", "dure", yes, yes, "adaptatif"],
  },
];
const FAMILIES = ["sélection de nœuds", "affectation souple", "affectation dure (regroupement)"];
const TABLE = { x: 80, y: 182 };

const grid = COLUMNS.map((w) => `${w}px`).join(" ");
function row(root, html, y, extra = {}) {
  return div(root, "abs", {
    x: TABLE.x, y, w: COLUMNS.reduce((s, w) => s + w, 0),
    html,
    style: { display: "grid", gridTemplateColumns: grid, alignItems: "center", whiteSpace: "normal", ...extra },
  });
}
const cell = (html, style = "") => `<div style="padding: 0 12px; line-height: 30px; ${style}">${html}</div>`;

/** Grand tableau : les méthodes de la littérature décrites dans le cadre SRC. */
export default function taxonomy(root) {
  const heading = title(root, "Toutes les méthodes rentrent dans le cadre SRC", 64);
  const head = row(root, HEAD.map((h, i) => cell(h, `font-weight: 600; ${i >= 4 ? "text-align: center" : ""}`)).join(""), TABLE.y, {
    fontSize: "25px", height: "70px", borderBottom: "3px solid var(--ink)",
  });
  let y = TABLE.y + 74;
  const rows = ROWS.map(({ family, name, ref, cells }) => {
    const height = 86;
    const html = [
      cell(`<div style="font-size: 30px; line-height: 34px; font-weight: 600">${name}</div><div class="muted" style="font-size: 24px">${ref}</div>`),
      ...cells.map((c, i) => cell(c, i >= 3 ? "text-align: center" : "")),
    ].join("");
    const node = row(root, html, y, {
      fontSize: "24px", height: `${height}px`, borderBottom: "1.5px solid var(--line)",
      borderLeft: `7px solid ${COLORS[family]}`, marginLeft: "-7px",
    });
    y += height;
    return node;
  });
  const legend = label(
    root,
    FAMILIES.map((f, k) => `<span style="display: inline-block; width: 18px; height: 18px; border-radius: 4px; background: ${COLORS[k]}; vertical-align: -2px"></span> ${f}`).join("&emsp;&emsp;"),
    960, y + 38, 26, "abs",
  );
  const note = label(
    root,
    "<i>Tous contribuent</i> : chaque nœud d’entrée influence au moins un super-nœud (Bianchi &amp; Lachi, NeurIPS 2023). Contribuer ≠ conserver sans perte.",
    960, y + 88, 24, "abs muted",
  );
  const next = label(root, `<span class="c-blue">→</span> détaillées ensuite : Top-k, DiffPool, MinCutPool, MIVSPool`, 960, y + 88, 30);
  gsap.set(next, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8 });
  tl.from(head, { opacity: 0, y: 12, duration: 0.7 }, "<0.2");
  tl.from(legend, { opacity: 0, duration: 0.6 }, "<0.2");
  pause(tl);

  // Une ligne par arrêt : la méthode entre dans le tableau.
  rows.forEach((node, i) => {
    tl.from(node, { opacity: 0, x: -30, duration: 0.7 });
    if (i === rows.length - 1) tl.from(note, { opacity: 0, duration: 0.6 }, "<0.3");
    pause(tl);
  });

  // Les quatre méthodes détaillées dans la suite.
  tl.to(rows.filter((_, i) => !ROWS[i].studied), { opacity: 0.3, duration: 0.6, ease: "power2.inOut" });
  tl.to(note, { opacity: 0, duration: 0.3, ease: "power2.in" }, "<");
  tl.fromTo(next, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, immediateRender: false }, "<0.3");
  pause(tl);
  return tl;
}
