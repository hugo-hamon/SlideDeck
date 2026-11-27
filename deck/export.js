/**
 * Self-contained HTML export, built in the browser: the page, its modules (slides, engine,
 * GSAP, KaTeX), stylesheets, fonts and images are gathered into a single file.
 *
 * Modules are rewritten to bare specifiers "@deck-export/N" and served by the import map
 * as data: URLs, which avoids any relative resolution outside the server.
 */
import { bibliography } from "./bib.js";
import { UI_STYLES } from "./ui.js";

const IMAGE = /\.(svg|png|jpe?g|gif|webp)$/i;
const IMPORTS = [
  /(\bimport\s*(?:[\w$*{}\s,]+?\s*from\s*)?)(["'])([^"'\n]+)\2/g,
  /(\bexport\s*(?:\*(?:\s*as\s+[\w$]+)?|\{[^}]*\})\s*from\s*)(["'])([^"'\n]+)\2/g,
  /(\bimport\s*\(\s*)(["'])([^"'\n]+)\2/g,
];
const FONT_SUBSETS = new Set(["latin", "latin-ext"]);

/** Exports the presentation (slides numbered from 1) and returns an HTML Blob. */
export async function exportHtml({ slides, onProgress = () => {} }) {
  const base = new URL(location.pathname, location.origin);
  const page = new DOMParser().parseFromString(await text(base), "text/html");
  const warnings = [];

  onProgress("Feuilles de style et polices…");
  for (const link of [...page.querySelectorAll('link[rel="stylesheet"]')]) {
    const href = new URL(link.getAttribute("href"), base);
    try {
      link.replaceWith(style(page, await inlineCss(await text(href), href)));
    } catch {
      warnings.push(`stylesheet not inlined: ${href}`);
    }
  }
  page.querySelectorAll('link[rel="preconnect"]').forEach((link) => link.remove());
  for (const link of page.querySelectorAll('link[rel="icon"]')) {
    try {
      link.href = await asDataUrl(new URL(link.getAttribute("href"), base));
    } catch {
      link.remove();
    }
  }
  for (const file of UI_STYLES) {
    const href = new URL(file, import.meta.url);
    try {
      const node = style(page, await inlineCss(await text(href), href));
      node.dataset.deckStyle = file;
      page.head.appendChild(node);
    } catch {}
  }

  onProgress("Modules…");
  const mapNode = page.querySelector('script[type="importmap"]');
  const imports = mapNode ? JSON.parse(mapNode.textContent).imports ?? {} : {};
  const bundle = new Bundle(imports, base, warnings);
  for (const script of page.querySelectorAll('script[type="module"]')) {
    script.textContent = await bundle.rewrite(script.textContent, base);
  }
  await bundle.done();
  const map = page.createElement("script");
  map.type = "importmap";
  map.textContent = JSON.stringify({ imports: bundle.map });
  mapNode ? mapNode.replaceWith(map) : page.head.prepend(map);

  // Tells the engine which slides are kept (original numbering preserved).
  const flag = page.createElement("script");
  let notes = {};
  try {
    notes = (await (await fetch(new URL("__notes", base), { cache: "no-store" })).json()).notes ?? {};
  } catch {}
  // The bibliography travels with the page: cite() and the `b` window read it offline.
  const { entries, cited, file, project } = bibliography();
  const safe = (data) => JSON.stringify(data).replace(/</g, "\\u003c");
  flag.textContent = [
    `window.__DECK_EXPORT__ = ${safe({ slides, date: new Date().toISOString() })};`,
    `window.__DECK_NOTES__ = ${safe(notes)};`,
    `window.__DECK_BIB__ = ${safe({ file, project, cited, usage: {}, entries: entries.filter((e) => cited.includes(e.key)) })};`,
  ].join("\n");
  page.head.prepend(flag);

  onProgress("Assemblage…");
  const html = `<!doctype html>\n${page.documentElement.outerHTML}`;
  return { blob: new Blob([html], { type: "text/html" }), warnings, size: html.length };
}

class Bundle {
  constructor(imports, base, warnings) {
    this.imports = imports;
    this.base = base;
    this.warnings = warnings;
    this.ids = new Map();
    this.pending = [];
    this.map = {};
  }

  /** Absolute URL of a specifier, through the page's import map for bare names. */
  resolve(specifier, from) {
    if (/^(\.{0,2}\/|[a-z][a-z0-9+.-]*:)/i.test(specifier)) return new URL(specifier, from).href;
    if (this.imports[specifier]) return new URL(this.imports[specifier], this.base).href;
    const prefix = Object.keys(this.imports)
      .filter((key) => key.endsWith("/") && specifier.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];
    if (prefix) return new URL(this.imports[prefix] + specifier.slice(prefix.length), this.base).href;
    return null;
  }

  /** Identifier of a module, which is fetched and rewritten only once. */
  id(url) {
    if (!this.ids.has(url)) {
      const name = `@deck-export/${this.ids.size}`;
      this.ids.set(url, name);
      this.pending.push(
        text(url)
          .then((source) => this.rewrite(source, url))
          .then((source) => (this.map[name] = dataUrl(source, "text/javascript")))
          .catch(() => {
            // Fallback: the module will be loaded online.
            this.warnings.push(`module not inlined: ${url}`);
            this.map[name] = url;
          }),
      );
    }
    return this.ids.get(url);
  }

  /** Waits for every module, including those discovered along the way. */
  async done() {
    for (let i = 0; i < this.pending.length; i++) await this.pending[i];
  }

  async rewrite(source, from) {
    let out = source;
    for (const pattern of IMPORTS) {
      out = out.replace(pattern, (all, head, quote, specifier) => {
        const url = this.resolve(specifier, from);
        return url ? `${head}${quote}${this.id(url)}${quote}` : all;
      });
    }
    return inlineImages(out, this.base, this.warnings);
  }
}

/** Replaces image paths written in the code (such as assets/x.svg) with data: URLs. */
async function inlineImages(source, base, warnings) {
  const pattern = /(["'`])((?:\.\/)?[\w./-]+\.(?:svg|png|jpe?g|gif|webp))\1/gi;
  const found = [...new Set([...source.matchAll(pattern)].map((m) => m[2]))];
  const urls = {};
  for (const path of found) {
    try {
      urls[path] = await asDataUrl(new URL(path, base));
    } catch {
      warnings.push(`image not inlined: ${path}`);
    }
  }
  return source.replace(pattern, (all, quote, path) => (urls[path] ? `${quote}${urls[path]}${quote}` : all));
}

/** Self-contained CSS: woff2 fonts and images as data: URLs, Latin subsets only. */
async function inlineCss(css, href) {
  let out = css;
  // Themes load their fonts with @import: the imported sheet is inlined in its place.
  for (const [all, , path] of [...out.matchAll(/@import\s+url\((["']?)([^)"']+)\1\)\s*;/g)]) {
    const url = new URL(path, href);
    try {
      out = out.replace(all, await inlineCss(await text(url), url));
    } catch {}
  }
  // Google Fonts: each block is preceded by its subset (/* latin */…).
  if (/\/\*\s*[\w-]+\s*\*\/\s*@font-face/.test(out)) {
    out = out.replace(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g, (all, subset) => (FONT_SUBSETS.has(subset) ? all : ""));
  }
  // KaTeX ships woff2, woff and ttf: the first one is enough for every recent browser.
  out = out.replace(/,\s*url\([^)]*\.(?:woff|ttf)\)\s*format\(["']?(?:woff|truetype)["']?\)/g, "");
  const urls = [...new Set([...out.matchAll(/url\((["']?)([^)"']+)\1\)/g)].map((m) => m[2]))].filter((u) => !u.startsWith("data:"));
  const inlined = {};
  await Promise.all(
    urls.map(async (u) => {
      try {
        inlined[u] = await asDataUrl(new URL(u, href));
      } catch {}
    }),
  );
  return out.replace(/url\((["']?)([^)"']+)\1\)/g, (all, quote, u) => (inlined[u] ? `url("${inlined[u]}")` : all));
}

function style(page, css) {
  const node = page.createElement("style");
  node.textContent = css;
  return node;
}

async function text(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function asDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const blob = await response.blob();
  const type = IMAGE.test(url.pathname) && url.pathname.endsWith(".svg") ? "image/svg+xml" : blob.type;
  return dataUrl(new Uint8Array(await blob.arrayBuffer()), type || "application/octet-stream");
}

function dataUrl(content, type) {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${type};base64,${btoa(binary)}`;
}
