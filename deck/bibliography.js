/**
 * Bibliography window (`b` key): the shared references.bib, searchable, with a button
 * that copies `cite("key")` for a slide, an Edit-mode note or a message to the agent.
 * References are added by pasting a DOI, an arXiv identifier or BibTeX (tools/bib.py).
 */
import { bibliography, editable, escape, fullReference, setBibliography, sortKeys } from "./bib.js";
import { t } from "./i18n.js";
import { actionFor } from "./ui.js";

export function createBibliography() {
  const state = { open: false, filter: "all", query: "", busy: false, flash: new Set() };

  const root = document.createElement("div");
  root.className = "opt-backdrop bib-backdrop";
  // Hidden until options.css is loaded (otherwise the window flashes on load).
  root.style.display = "none";
  root.innerHTML = `
    <div class="bib-window" role="dialog" aria-label="${t("bib.title")}">
      <header class="bib-head">
        <div><h2>${t("bib.title")}</h2><small class="bib-file"></small></div>
        <button class="opt-close" data-action="close" aria-label="${t("opt.close")}">×</button>
      </header>
      <form class="bib-add">
        <textarea rows="1" spellcheck="false" placeholder="${t("bib.addPlaceholder")}"></textarea>
        <button class="opt-primary" type="submit">${t("bib.add")}</button>
      </form>
      <p class="bib-status"></p>
      <div class="bib-tools">
        <input class="opt-range bib-search" type="search" spellcheck="false" placeholder="${t("bib.search")}" />
        <div class="opt-segment">
          <button data-filter="all">${t("bib.all")}</button><button data-filter="cited">${t("bib.cited")}</button>
        </div>
      </div>
      <ul class="bib-list"></ul>
      <footer class="bib-foot">${t("bib.hint")}</footer>
    </div>`;
  document.body.appendChild(root);
  const list = root.querySelector(".bib-list");
  const field = root.querySelector(".bib-add textarea");
  const search = root.querySelector(".bib-search");

  root.addEventListener("mousedown", (event) => {
    if (event.target === root) toggle(false);
  });
  root.addEventListener("click", onClick);
  root.querySelector(".bib-add").addEventListener("submit", (event) => {
    event.preventDefault();
    add();
  });
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !field.value.includes("@")) {
      event.preventDefault();
      add();
    }
  });
  field.addEventListener("input", () => {
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 220)}px`;
  });
  search.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    renderList();
  });

  // ---------- rendering ----------

  function render() {
    const { file, entries, cited } = bibliography();
    root.querySelector(".bib-file").textContent = file ? `${file} · ${t("bib.count", { n: entries.length })}` : t("bib.noFile");
    root.querySelector(".bib-add").hidden = !editable();
    root.querySelectorAll("[data-filter]").forEach((b) => b.classList.toggle("on", b.dataset.filter === state.filter));
    root.querySelector("[data-filter='cited']").textContent = `${t("bib.cited")} (${cited.length})`;
    if (!editable()) status(t("bib.readOnly"));
    renderList();
  }

  function renderList() {
    const { entries, cited, usage, project } = bibliography();
    const here = new Set(cited);
    const known = new Set(entries.map((e) => e.key));
    // Keys cited but missing from the file are listed too, tagged "unknown key".
    const keys = sortKeys(state.filter === "cited" ? cited : [...known, ...cited]).filter((key) => matches(key));
    list.innerHTML = keys.length
      ? keys.map((key) => item(key, here.has(key), known.has(key), (usage[key] ?? []).filter((u) => u.project !== project))).join("")
      : `<li class="bib-empty">${entries.length ? t("bib.noMatch") : t("bib.empty")}</li>`;
    list.querySelector(".flash")?.scrollIntoView({ block: "nearest" });
    state.flash.clear();
  }

  function matches(key) {
    if (!state.query) return true;
    const entry = bibliography().byKey.get(key);
    const text = [key, entry?.title, entry?.year, entry?.journal, entry?.booktitle, ...(entry?.authors ?? []).map((p) => `${p.first} ${p.last}`)].join(" ");
    return state.query.split(/\s+/).every((word) => text.toLowerCase().includes(word));
  }

  function item(key, citedHere, known, elsewhere) {
    const entry = bibliography().byKey.get(key);
    const link = entry?.doi ? `https://doi.org/${entry.doi}` : entry?.url;
    const tags = [
      citedHere ? `<span class="bib-tag">${t("bib.citedHere")}</span>` : "",
      known ? "" : `<span class="bib-tag warn">${t("bib.unknown")}</span>`,
      elsewhere.length ? `<span class="bib-used" title="${escape(elsewhere.map((u) => u.project).join("\n"))}">${t("bib.usedIn", { list: escape(elsewhere.map((u) => u.title).join(", ")) })}</span>` : "",
    ].join("");
    return `
      <li class="bib-item ${state.flash.has(key) ? "flash" : ""}">
        <div class="bib-ref">${fullReference(key)}</div>
        <div class="bib-meta">
          <code>${escape(key)}</code>${tags}
          <span class="bib-actions">
            ${link ? `<a href="${escape(link)}" target="_blank" rel="noopener">${t("bib.open")}</a>` : ""}
            ${known ? `<button data-bibtex="${escape(key)}">BibTeX</button>` : ""}
            <button class="bib-copy" data-copy="${escape(key)}">${t("bib.copy")}</button>
          </span>
        </div>
      </li>`;
  }

  function status(text, warn = false) {
    const node = root.querySelector(".bib-status");
    node.innerHTML = text;
    node.classList.toggle("warn", warn);
  }

  // ---------- actions ----------

  async function onClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    const { action, filter, copy, bibtex } = button.dataset;
    if (action === "close") toggle(false);
    else if (filter) (state.filter = filter), render();
    else if (copy) copyText(`cite("${copy}")`, button);
    else if (bibtex) copyText(bibliography().byKey.get(bibtex)?.bibtex ?? "", button);
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = Object.assign(document.createElement("textarea"), { value: text });
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    const label = button.textContent;
    button.textContent = t("bib.copied");
    button.classList.add("done");
    setTimeout(() => {
      button.textContent = label;
      button.classList.remove("done");
    }, 1200);
  }

  async function add() {
    const input = field.value.trim();
    if (!input || state.busy) return;
    state.busy = true;
    root.querySelector(".bib-add button").disabled = true;
    status(t("bib.adding"));
    try {
      const response = await fetch(new URL("__bib", location.href), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      setBibliography(result);
      const parts = [];
      if (result.added.length) parts.push(t("bib.added", { keys: result.added.map((k) => `<code>${escape(k)}</code>`).join(", ") }));
      if (result.present.length) parts.push(t("bib.present", { keys: result.present.map((k) => `<code>${escape(k)}</code>`).join(", ") }));
      parts.push(...result.errors.map(escape));
      status(parts.join("<br>"), result.errors.length > 0);
      if (!result.errors.length) (field.value = ""), (field.style.height = "auto");
      [...result.added, ...result.present].forEach((key) => state.flash.add(key));
      (state.query = ""), (search.value = ""), (state.filter = "all");
      render();
    } catch (error) {
      status(t("bib.failed", { message: escape(error.message) }), true);
    } finally {
      state.busy = false;
      root.querySelector(".bib-add button").disabled = false;
    }
  }

  // ---------- opening and keys ----------

  function toggle(on = !state.open) {
    state.open = on;
    root.classList.toggle("open", on);
    if (on) {
      status("");
      render();
      setTimeout(() => search.focus(), 50);
    } else document.activeElement?.blur?.();
  }

  /** Handles keys while the window is open and returns true when the key is consumed. */
  function handleKey(event) {
    if (!state.open) return false;
    if (event.key === "Escape") return toggle(false), true;
    if (event.target.closest?.("input, textarea")) return false;
    if (actionFor(event) === "bib") toggle(false);
    return true;
  }

  return { toggle, handleKey, isOpen: () => state.open };
}
