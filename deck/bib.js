/**
 * Shared bibliography: the nearest `references.bib` above the presentation (usually
 * `presentations/references.bib`), parsed by tools/bib.py and served at `__bib`.
 * An HTML export carries it in `window.__DECK_BIB__`.
 *
 * The style is author-year: [Grattarola et al., 2022] in the slides, and the full
 * reference (APA-like) on the references slide. Formatting lives here, while the slide
 * components (`cite`, `citet`, `references`) are in components.js.
 */
import katex from "katex";
import { exported } from "./ui.js";

const EMPTY = { file: "", project: "", entries: [], cited: [], usage: {} };
const state = { ...EMPTY, byKey: new Map(), suffix: new Map(), served: false, loaded: false };
const warned = new Set();

/** Loads the bibliography once, before the first slide is built (startDeck waits for it). */
export async function loadBibliography() {
  let data = window.__DECK_BIB__ ?? null;
  state.served = !exported() && location.protocol.startsWith("http");
  if (!data && state.served) {
    try {
      const response = await fetch(new URL("__bib", location.href), { cache: "no-store" });
      if (response.ok) data = await response.json();
    } catch {}
  }
  setBibliography(data ?? EMPTY);
}

/** Replaces the data (after an addition from the `b` window, for instance). */
export function setBibliography(data) {
  Object.assign(state, EMPTY, data, { loaded: true });
  state.byKey = new Map(state.entries.map((entry) => [entry.key, entry]));
  // 2022a / 2022b: only among the works cited by this presentation.
  state.suffix = new Map();
  const groups = new Map();
  for (const key of state.cited) {
    const entry = state.byKey.get(key);
    if (!entry) continue;
    const id = `${names(entry)}|${entry.year}`;
    groups.set(id, [...(groups.get(id) ?? []), entry]);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    group.forEach((entry, i) => state.suffix.set(entry.key, String.fromCharCode(97 + i)));
  }
}

export const bibliography = () => state;
export const entryOf = (key) => state.byKey.get(key);
/** True when the page can add references (served by tools/serve.py). */
export const editable = () => state.served;

/** Logs an unknown key once: tools/capture.py reports it in report.json. */
export function warnMissing(key) {
  if (warned.has(key)) return;
  warned.add(key);
  if (!state.loaded) {
    console.warn(`cite("${key}") was called before the bibliography was loaded: call it inside the slide function, not at the top of the module`);
    return;
  }
  console.warn(`Unknown citation key "${key}" (not in ${state.file || "references.bib"})`);
}

// ---------- author-year labels ----------

const people = (entry) => entry.authors ?? entry.editors ?? [];

/** "Kipf", "Kipf & Welling", "Grattarola et al.", or the title for an anonymous work. */
export function names(entry) {
  const list = people(entry);
  const real = list.filter((p) => p.last !== "others");
  if (!real.length) return entry.title ? shorten(entry.title) : entry.key;
  if (real.length === 1) return real.length < list.length ? `${real[0].last} et al.` : real[0].last;
  if (list.length === 2) return `${real[0].last} & ${real[1].last}`;
  return `${real[0].last} et al.`;
}

/** { names, year } for a key, with the 2022a suffix, or null if the key is unknown. */
export function authorYear(key) {
  const entry = state.byKey.get(key);
  if (!entry) return null;
  return { names: escape(names(entry)), year: `${entry.year || "s. d."}${state.suffix.get(key) ?? ""}` };
}

/** Keys in the order of a reference list: first author, year, then title (unknown keys last). */
export function sortKeys(keys) {
  const sortName = (key) => {
    const entry = state.byKey.get(key);
    return [people(entry)[0]?.last ?? entry.title ?? key, authorYear(key).year, entry.title ?? ""];
  };
  return [...new Set(keys)].sort((a, b) => {
    const known = Number(state.byKey.has(b)) - Number(state.byKey.has(a));
    if (known || !state.byKey.has(a)) return known || a.localeCompare(b);
    const [x, y] = [sortName(a), sortName(b)];
    for (let i = 0; i < 3; i++) {
      const order = x[i].localeCompare(y[i], undefined, { sensitivity: "base" });
      if (order) return order;
    }
    return 0;
  });
}

// ---------- full reference ----------

/**
 * Full reference as HTML, e.g.
 * Grattarola, D., Zambon, D., Bianchi, F. M. & Alippi, C. (2024). Understanding pooling
 * in graph neural networks. <i>IEEE Transactions on Neural Networks…</i>, 35(2), 2708–2718.
 */
export function fullReference(key) {
  const entry = state.byKey.get(key);
  if (!entry) return `<span class="cite-missing">?${escape(key)}</span>`;
  const { year } = authorYear(key);
  const who = people(entry).length ? authorList(people(entry)) + (entry.authors ? "" : " (Ed.)") : "";
  const title = rich(entry.title ?? "");
  const pages = entry.pages ? entry.pages.replace(/-+/g, "–") : "";
  let body;
  switch (entry.type) {
    case "article": {
      const volume = entry.volume ? `, ${escape(entry.volume)}${entry.number ? `(${escape(entry.number)})` : ""}` : "";
      body = `${end(title)} <i>${rich(entry.journal ?? "")}</i>${volume}${pages ? `, ${pages}` : ""}.`;
      break;
    }
    case "inproceedings":
    case "incollection":
    case "conference":
      body = `${end(title)} In <i>${rich(entry.booktitle ?? "")}</i>${pages ? ` (pp. ${pages})` : ""}.`;
      break;
    case "book":
    case "booklet":
      body = `<i>${end(title)}</i> ${publisher(entry)}`;
      break;
    case "phdthesis":
    case "mastersthesis":
    case "thesis":
      body = `<i>${title}</i> [${entry.type === "mastersthesis" ? "Master's thesis" : "PhD thesis"}${entry.school ? `, ${rich(entry.school)}` : ""}].`;
      break;
    default: {
      const arxiv = entry.eprint && /arxiv/i.test(`${entry.archiveprefix ?? ""}${entry.eprinttype ?? ""}${entry.url ?? ""}`);
      const where = arxiv ? `arXiv:${escape(entry.eprint)}` : rich(entry.journal ?? entry.booktitle ?? entry.howpublished ?? entry.publisher ?? entry.institution ?? "");
      body = `${end(title)}${where ? ` <i>${where}</i>.` : ""}`;
    }
  }
  return `${who ? `${who} ` : ""}(${year}). ${body}`.replace(/\s+/g, " ").trim();
}

/** "Last, F. M., Last, F. & Last, F.": three names then "et al." beyond five. */
function authorList(list) {
  const real = list.filter((p) => p.last !== "others");
  const more = real.length < list.length || real.length > 5;
  const shown = (real.length > 5 ? real.slice(0, 3) : real).map((p) => escape(p.first ? `${p.last}, ${initials(p.first)}` : p.last));
  if (more) return `${shown.join(", ")} et al.`;
  return shown.length > 1 ? `${shown.slice(0, -1).join(", ")} & ${shown.at(-1)}` : shown[0];
}

/** "Jean-Pierre Marie" → "J.-P. M.", "Thomas N." → "T. N.". */
function initials(first) {
  return first
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.split("-").map((part) => (part.endsWith(".") ? part : `${part[0]}.`)).join("-"))
    .join(" ");
}

function publisher(entry) {
  const name = rich(entry.publisher ?? entry.organization ?? "");
  return name ? `${name}.` : "";
}

/** Adds a final period unless the text already ends with a punctuation mark. */
const end = (html) => (!html || /[.?!]$/.test(html) ? html : `${html}.`);

const shorten = (text) => (text.length > 40 ? `${text.slice(0, 38)}…` : text);

export function escape(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Escaped text, where $…$ is rendered by KaTeX. */
function rich(text) {
  return String(text)
    .split(/(\$[^$]+\$)/)
    .map((part) => {
      if (!/^\$[^$]+\$$/.test(part)) return escape(part);
      try {
        return katex.renderToString(part.slice(1, -1), { throwOnError: false, strict: "ignore" });
      } catch {
        return escape(part);
      }
    })
    .join("");
}
