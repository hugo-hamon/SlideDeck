/**
 * Bibliography view of the home page: every reference of presentations/references.bib,
 * where it is cited (presentation and slide numbers), with addition, editing and deletion
 * through tools/serve.py (`/__bib`, tools/bib.py).
 */
import { bibliography, escape, fullReference, setBibliography, sortKeys } from "./bib.js";
import { t } from "./i18n.js";

const FILTERS = ["all", "cited", "unused", "missing"];
const icon = (paths) => `<svg viewBox="0 0 24 24" width="17" height="17">${paths}</svg>`;
const ICONS = {
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  edit: '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/><path d="m14 6 3 3"/>',
  delete: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"/>',
  link: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
/** Key written in a BibTeX entry: `@article{key,` → key. */
const keyOf = (bibtex) => bibtex.match(/@\s*\w+\s*[{(]\s*([^,\s]+)/)?.[1] ?? "";

export function createHomeBib({ section, toast, onChange }) {
  const state = { filter: "all", query: "", flash: new Set(), editing: null, deleting: null };
  section.innerHTML = `
    <div class="hm-bib-head">
      <p class="hm-bib-file"></p>
      <div class="hm-segment hm-segment-text hm-bib-filter"></div>
    </div>
    <form class="hm-bib-add">
      <textarea rows="1" spellcheck="false" placeholder="${t("bib.addPlaceholder")}"></textarea>
      <button type="submit" class="hm-primary">${t("bib.add")}</button>
    </form>
    <p class="hm-bib-status"></p>
    <div class="hm-bib-list"></div>`;
  const field = section.querySelector(".hm-bib-add textarea");
  const editForm = document.querySelector(".hm-bibedit .hm-dialog");
  const deleteForm = document.querySelector(".hm-bibdelete .hm-dialog");

  // ---------- data ----------

  async function load() {
    try {
      const response = await fetch("/__bib", { cache: "no-store" });
      if (response.ok) setBibliography(await response.json());
    } catch {}
    onChange();
  }

  async function post(action, body) {
    const response = await fetch(`/__bib/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || response.statusText);
    setBibliography(data);
    return data;
  }

  /** Keys of each filter: known entries, and cited keys missing from the file. */
  function groups() {
    const { entries, usage } = bibliography();
    const known = entries.map((e) => e.key);
    const cited = new Set(Object.keys(usage));
    return {
      all: [...new Set([...known, ...cited])],
      cited: known.filter((key) => cited.has(key)),
      unused: known.filter((key) => !cited.has(key)),
      missing: [...cited].filter((key) => !known.includes(key)),
    };
  }

  // ---------- rendering ----------

  function render(query = state.query) {
    state.query = query.toLowerCase();
    const { file, entries } = bibliography();
    const lists = groups();
    section.querySelector(".hm-bib-file").innerHTML = `<code>${escape(file || "presentations/references.bib")}</code> · ${t("bib.count", { n: entries.length })}`;
    section.querySelector(".hm-bib-filter").innerHTML = FILTERS.map(
      (id) => `<button data-bibfilter="${id}" class="${state.filter === id ? "on" : ""} ${id === "missing" && lists.missing.length ? "warn" : ""}">${t(`bib.filter.${id}`)} <small>${lists[id].length}</small></button>`,
    ).join("");
    const keys = sortKeys(lists[state.filter]).filter(matches);
    const list = section.querySelector(".hm-bib-list");
    list.innerHTML = keys.length ? keys.map(row).join("") : `<p class="hm-empty">${entries.length ? t("bib.noMatch") : t("bib.empty")}</p>`;
    list.querySelector(".flash")?.scrollIntoView({ block: "nearest" });
    state.flash.clear();
  }

  function matches(key) {
    if (!state.query) return true;
    const { byKey, usage } = bibliography();
    const entry = byKey.get(key);
    const text = [key, entry?.title, entry?.year, entry?.journal, entry?.booktitle, ...(entry?.authors ?? []).map((p) => `${p.first} ${p.last}`), ...(usage[key] ?? []).map((u) => u.title)].join(" ");
    return state.query.split(/\s+/).every((word) => text.toLowerCase().includes(word));
  }

  function row(key) {
    const entry = bibliography().byKey.get(key);
    const link = entry?.doi ? `https://doi.org/${entry.doi}` : entry?.url;
    return `
      <article class="hm-ref ${entry ? "" : "missing"} ${state.flash.has(key) ? "flash" : ""}" data-key="${escape(key)}">
        <div class="hm-ref-body">
          <div class="hm-ref-text">${entry ? fullReference(key) : `<span class="cite-missing">?${escape(key)}</span> ${t("bib.missingHint")}`}</div>
          <div class="hm-ref-meta">
            <code>${escape(key)}</code>
            ${entry ? `<span class="hm-ref-type">${escape(entry.type)}</span>` : ""}
            ${link ? `<a href="${escape(link)}" target="_blank" rel="noopener">${icon(ICONS.link)}${entry.doi ? "DOI" : "URL"}</a>` : ""}
          </div>
        </div>
        <div class="hm-ref-usage">${usageOf(key)}</div>
        <div class="hm-ref-actions">
          <button class="hm-icon" data-bibcopy="${escape(key)}" title="${t("bib.copy")}">${icon(ICONS.copy)}</button>
          ${entry ? `<button class="hm-icon" data-bibedit="${escape(key)}" title="${t("bib.edit")}">${icon(ICONS.edit)}</button>
          <button class="hm-icon hm-icon-danger" data-bibdelete="${escape(key)}" title="${t("bib.delete")}">${icon(ICONS.delete)}</button>` : ""}
        </div>
      </article>`;
  }

  /** "TD 5 · slides 3 4", each number opening the slide, or "not cited". */
  function usageOf(key) {
    const uses = bibliography().usage[key] ?? [];
    if (!uses.length) return `<span class="hm-none">${t("bib.notCited")}</span>`;
    return uses
      .map(
        (use) => `
        <div class="hm-use">
          <a class="hm-use-title" href="/${escape(use.project)}/" title="${escape(use.project)}">${escape(use.title)}</a>
          <span class="hm-use-slides">
            ${use.slides.map((n) => `<a href="/${escape(use.project)}/#/${n}/1" title="${t("bib.openSlide", { n })}">${n}</a>`).join("")}
            ${use.files.map((file) => `<code title="${t("bib.inFile")}">${escape(file)}</code>`).join("")}
          </span>
        </div>`,
      )
      .join("");
  }

  function status(html, warn = false) {
    const node = section.querySelector(".hm-bib-status");
    node.innerHTML = html;
    node.classList.toggle("warn", warn);
  }

  // ---------- actions ----------

  section.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const { bibfilter, bibcopy, bibedit, bibdelete } = button.dataset;
    if (bibfilter) (state.filter = bibfilter), render();
    else if (bibcopy) copy(`cite("${bibcopy}")`);
    else if (bibedit) openEdit(bibedit);
    else if (bibdelete) openDelete(bibdelete);
  });

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("bib.copiedToast", { text }));
    } catch {
      toast(text);
    }
  }

  section.querySelector(".hm-bib-add").addEventListener("submit", (event) => {
    event.preventDefault();
    add();
  });
  field.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !field.value.includes("@")) {
      event.preventDefault();
      add();
    }
    event.stopPropagation();
  });
  field.addEventListener("input", () => {
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, 260)}px`;
  });

  async function add() {
    const input = field.value.trim();
    const button = section.querySelector(".hm-bib-add button");
    if (!input || button.disabled) return;
    button.disabled = true;
    status(t("bib.adding"));
    try {
      const result = await post("add", { input });
      const codes = (keys) => keys.map((k) => `<code>${escape(k)}</code>`).join(", ");
      const parts = [];
      if (result.added.length) parts.push(t("bib.added", { keys: codes(result.added) }));
      if (result.present.length) parts.push(t("bib.present", { keys: codes(result.present) }));
      parts.push(...result.errors.map(escape));
      status(parts.join("<br>"), result.errors.length > 0);
      if (!result.errors.length) (field.value = ""), (field.style.height = "auto");
      [...result.added, ...result.present].forEach((key) => state.flash.add(key));
      state.filter = "all";
      onChange();
    } catch (error) {
      status(t("bib.failed", { message: escape(error.message) }), true);
    } finally {
      button.disabled = false;
    }
  }

  // ---------- edit ----------

  function openEdit(key) {
    state.editing = key;
    editForm.bibtex.value = bibliography().byKey.get(key)?.bibtex ?? "";
    editForm.querySelector(".hm-error").textContent = "";
    updateRename();
    document.querySelector(".hm-bibedit").hidden = false;
    editForm.bibtex.focus();
  }

  /** The checkbox "rename in the slides" only shows when a cited key changes. */
  function updateRename() {
    const uses = bibliography().usage[state.editing] ?? [];
    const changed = keyOf(editForm.bibtex.value) !== state.editing;
    const label = editForm.querySelector(".hm-check");
    label.hidden = !changed || !uses.length;
    label.querySelector("span").innerHTML = t("bib.renameIn", { old: `<code>${escape(state.editing)}</code>`, n: uses.length });
  }

  editForm.bibtex.addEventListener("input", updateRename);
  editForm.bibtex.addEventListener("keydown", (event) => event.key !== "Escape" && event.stopPropagation());

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const rename = !editForm.querySelector(".hm-check").hidden && editForm.rename.checked;
    try {
      const result = await post("edit", { key: state.editing, bibtex: editForm.bibtex.value, rename });
      document.querySelector(".hm-bibedit").hidden = true;
      state.flash.add(result.key);
      toast(result.renamed.length ? t("bib.renamedToast", { n: result.renamed.length }) : t("bib.savedToast"));
      onChange();
    } catch (error) {
      editForm.querySelector(".hm-error").textContent = error.message;
    }
  });

  // ---------- delete ----------

  function openDelete(key) {
    state.deleting = key;
    const uses = bibliography().usage[key] ?? [];
    deleteForm.querySelector(".hm-bibdelete-ref").innerHTML = fullReference(key);
    const warning = deleteForm.querySelector(".hm-warning");
    warning.classList.toggle("hm-info", !uses.length);
    warning.innerHTML = uses.length
      ? t("bib.deleteUsed", { n: uses.length, list: uses.map((u) => escape(u.title)).join(", "), key: `<code>?${escape(key)}</code>` })
      : t("bib.deleteUnused");
    deleteForm.querySelector(".hm-error").textContent = "";
    document.querySelector(".hm-bibdelete").hidden = false;
    deleteForm.querySelector("[data-action='cancel']").focus();
  }

  deleteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await post("delete", { key: state.deleting });
      document.querySelector(".hm-bibdelete").hidden = true;
      toast(t("bib.deletedToast", { key: state.deleting }));
      onChange();
    } catch (error) {
      deleteForm.querySelector(".hm-error").textContent = error.message;
    }
  });

  return { load, render, count: () => bibliography().entries.length, missing: () => groups().missing.length };
}
