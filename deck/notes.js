/**
 * Speaker notes, written in the presenter view and saved to `notes.json` next to
 * `index.html` (through tools/serve.py). Without a server (exported page), they are read
 * from the export and edits stay in the browser.
 *
 * A note's key is the slide function's name and its occurrence (`planRecap#2`), so it
 * follows its slide when other slides are inserted before it.
 */
import { t } from "./i18n.js";
import { exported } from "./ui.js";

const SAVE_DELAY = 500;

export function noteKeys(names) {
  const seen = {};
  return names.map((name, i) => {
    if (!name) return `slide-${i + 1}`;
    seen[name] = (seen[name] ?? 0) + 1;
    return `${name}#${seen[name]}`;
  });
}

export function createNotes(keys) {
  const url = new URL("__notes", location.href);
  const localKey = `deck-notes:${url.pathname}`;
  const served = !exported() && location.protocol.startsWith("http");
  let notes = {};
  let timer = null;
  const listeners = new Set();

  const ready = (async () => {
    try {
      if (served) {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) notes = (await response.json()).notes ?? {};
      } else notes = { ...(window.__DECK_NOTES__ ?? {}) };
    } catch {}
    try {
      Object.assign(notes, JSON.parse(localStorage.getItem(localKey)) ?? {});
    } catch {}
    listeners.forEach((fn) => fn());
  })();

  async function flush(onStatus) {
    timer = null;
    const body = JSON.stringify({ version: 1, notes, updated: new Date().toISOString() }, null, 2);
    try {
      if (!served) throw new Error("no server");
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!response.ok) throw new Error(response.statusText);
      localStorage.removeItem(localKey);
      onStatus?.(t("notes.saved"));
    } catch {
      try {
        localStorage.setItem(localKey, JSON.stringify(notes));
      } catch {}
      onStatus?.(t("notes.local"));
    }
  }

  return {
    ready,
    onLoad: (fn) => listeners.add(fn),
    get: (index) => notes[keys[index]] ?? "",
    set(index, text, onStatus) {
      if (text.trim()) notes[keys[index]] = text;
      else delete notes[keys[index]];
      clearTimeout(timer);
      onStatus?.(t("notes.saving"));
      timer = setTimeout(() => flush(onStatus), SAVE_DELAY);
    },
    all: () => ({ ...notes }),
  };
}
