/**
 * Interface settings (shortcuts, pen, backdrop, language), shared by deck.js, pen.js,
 * options.js and the home page. They live in the browser (localStorage), not in the slides.
 */
const STORAGE_KEY = "deck-settings";

/** Interface stylesheets, loaded next to this file (or already inlined by the HTML export). */
export const UI_STYLES = ["review.css", "options.css"];

/** Keyboard actions and their default keys, with labels in i18n.js (`action.<name>`). */
export const ACTIONS = {
  next: ["ArrowRight", "ArrowDown", "PageDown", " "],
  prev: ["ArrowLeft", "ArrowUp", "PageUp"],
  first: ["Home"],
  last: ["End"],
  fullscreen: ["f"],
  options: ["o"],
  pen: ["p"],
  penUndo: ["Ctrl+z"],
  penClear: ["c"],
  edit: ["e"],
  home: ["h"],
  presenter: ["s"],
  overview: ["g"],
  laser: ["l"],
  bib: ["b"],
};

/** Backdrops around the stage, where "slide" reuses the paper colour (labels: `backdrop.<id>`). */
export const BACKDROPS = {
  slide: "var(--paper)",
  gray: "#e6ebf3",
  dark: "#14171d",
  black: "#000",
};

export const PEN_PALETTE = ["#1b2a4a", "#4a78d0", "#2f9e7f", "#d1605a", "#e39a2d", "#8a5cc7", "#f2c94c", "#ffffff"];

const DEFAULTS = {
  shortcuts: structuredClone(ACTIONS),
  pen: { color: PEN_PALETTE[3], size: 6, eraser: 48, palette: PEN_PALETTE },
  backdrop: "slide",
  lang: "en",
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

const stored = read();
export const settings = {
  shortcuts: { ...DEFAULTS.shortcuts, ...stored.shortcuts },
  pen: { ...DEFAULTS.pen, ...stored.pen },
  backdrop: stored.backdrop in BACKDROPS ? stored.backdrop : DEFAULTS.backdrop,
  lang: stored.lang ?? DEFAULTS.lang,
};
const listeners = new Set();

/** Saves the settings and notifies subscribers (backdrop, pen…). */
export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
  listeners.forEach((fn) => fn(settings));
}

export function onSettings(fn) {
  listeners.add(fn);
  fn(settings);
}

export function resetShortcuts() {
  settings.shortcuts = structuredClone(DEFAULTS.shortcuts);
  saveSettings();
}

export function resetPen() {
  settings.pen = structuredClone(DEFAULTS.pen);
  saveSettings();
}

/** Normalised key: "Ctrl+Shift+z", "ArrowRight", "f"… */
export function combo(event) {
  const mods = [event.ctrlKey || event.metaKey ? "Ctrl" : "", event.altKey ? "Alt" : "", event.shiftKey && event.key.length > 1 ? "Shift" : ""];
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return [...mods.filter(Boolean), key].join("+");
}

/** Name of the action bound to the key, or null. */
export function actionFor(event) {
  const pressed = combo(event);
  return Object.keys(settings.shortcuts).find((name) => settings.shortcuts[name].includes(pressed)) ?? null;
}

/** Adds an interface stylesheet, unless the HTML export already inlined it. */
export function loadStyle(file) {
  if (document.querySelector(`[data-deck-style="${file}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.deckStyle = file;
  link.href = new URL(file, import.meta.url);
  document.head.appendChild(link);
}

/** Home page of tools/serve.py, when the presentation is served by it. */
export const HOME_URL = "/";
export const hasHome = () => !exported() && location.protocol.startsWith("http");

/** Home page thumbnail (`?thumb`): no interface, no live reload. */
export const thumbnail = () => new URLSearchParams(location.search).has("thumb");

/** True in a self-contained HTML export (no server, no files next to it). */
export const exported = () => Boolean(window.__DECK_EXPORT__);

/** sessionStorage key of the guided tour in progress inside a presentation (tour-deck.js). */
export const TOUR_KEY = "deck-tour";

/** True when the guided tour should run here: `?tour`, or a tour in progress in this tab. */
export function tourPending() {
  if (exported() || thumbnail() || window.top !== window || new URLSearchParams(location.search).has("presenter")) return false;
  try {
    return new URLSearchParams(location.search).has("tour") || JSON.parse(sessionStorage.getItem(TOUR_KEY))?.path === location.pathname;
  } catch {
    return false;
  }
}
