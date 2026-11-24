/**
 * Home page of tools/serve.py: every presentation, with search, tags, stars, archives
 * and talk details. Thumbnails are the presentations themselves (iframe `?thumb`).
 */
import { LANGUAGES, addStrings, lang, setLang, t, translatePage } from "./i18n.js";

const VIEWS = [
  ["all", '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M12 16v3M8 19h8"/>'],
  ["upcoming", '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
  ["starred", '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6Z"/>'],
  ["archived", '<rect x="4" y="5" width="16" height="4" rx="1"/><path d="M5 9v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>'],
];
const LAYOUT_KEY = "deck-home-layout";
const icon = (paths, size = 18) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${paths}</svg>`;
const STAR = '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6Z"/>';

addStrings({
  en: {
    "home.new": "New presentation",
    "home.search": "Search a presentation, a tag…",
    "home.sort": "Sort",
    "home.sortModified": "Recently modified",
    "home.sortTitle": "Title",
    "home.sortYear": "Year",
    "home.layout": "Layout",
    "home.grid": "Grid",
    "home.list": "List",
    "home.fieldTitle": "Title",
    "home.titlePlaceholder": "Pooling on graphs",
    "home.folder": "Folder",
    "home.folderPlaceholder": "pooling_on_graphs",
    "home.cancel": "Cancel",
    "home.create": "Create and open",
    "home.details": "Details",
    "home.description": "Description",
    "home.descriptionPlaceholder": "Audience, goal, length…",
    "home.date": "Date of the talk",
    "home.venue": "Venue or event",
    "home.venuePlaceholder": "ML seminar, Paris",
    "home.save": "Save",
    "home.all": "All",
    "home.upcoming": "Upcoming",
    "home.starred": "Starred",
    "home.archived": "Archived",
    "home.tags": "Tags",
    "home.noTags": "Add tags from a card.",
    "home.noMatch": "No presentation matches “{query}”.",
    "home.noArchived": "No archived presentation.",
    "home.noStarred": "Click a presentation's star to find it here.",
    "home.empty": "No presentation yet: create one with “New presentation”.",
    "home.preview": "Preview",
    "home.star": "Star",
    "home.more": "More actions",
    "home.modified": "modified {when}",
    "home.feedback": "feedback",
    "home.archivedBadge": "archived",
    "home.removeTag": "Remove",
    "home.newTag": "new tag",
    "home.open": "Open",
    "home.openTab": "Open in a new tab",
    "home.edit": "Edit details…",
    "home.duplicate": "Duplicate",
    "home.copyCommand": "Copy the capture command",
    "home.archive": "Archive",
    "home.unarchive": "Unarchive",
    "home.archivedToast": "Presentation archived",
    "home.unarchivedToast": "Presentation unarchived",
    "home.duplicated": "Copy created: {path}",
    "home.copied": "Command copied",
    "home.saved": "Details saved",
    "home.today": "today",
    "home.tomorrow": "tomorrow",
    "home.inDays": "in {n} d",
    "home.past": "past",
    "home.justNow": "just now",
    "home.minutesAgo": "{n} min ago",
    "home.hoursAgo": "{n} h ago",
    "home.daysAgo": "{n} d ago",
    "home.onDate": "on {date}",
  },
  fr: {
    "home.new": "Nouvelle présentation",
    "home.search": "Rechercher une présentation, un tag…",
    "home.sort": "Trier",
    "home.sortModified": "Modifiées récemment",
    "home.sortTitle": "Titre",
    "home.sortYear": "Année",
    "home.layout": "Affichage",
    "home.grid": "Grille",
    "home.list": "Liste",
    "home.fieldTitle": "Titre",
    "home.titlePlaceholder": "Pooling sur graphes",
    "home.folder": "Dossier",
    "home.folderPlaceholder": "pooling_sur_graphes",
    "home.cancel": "Annuler",
    "home.create": "Créer et ouvrir",
    "home.details": "Informations",
    "home.description": "Description",
    "home.descriptionPlaceholder": "Public, objectif, durée…",
    "home.date": "Date de la présentation",
    "home.venue": "Lieu ou évènement",
    "home.venuePlaceholder": "Séminaire ML, Paris",
    "home.save": "Enregistrer",
    "home.all": "Toutes",
    "home.upcoming": "À venir",
    "home.starred": "Favoris",
    "home.archived": "Archivées",
    "home.tags": "Tags",
    "home.noTags": "Ajoutez des tags depuis une carte.",
    "home.noMatch": "Aucune présentation ne correspond à « {query} ».",
    "home.noArchived": "Aucune présentation archivée.",
    "home.noStarred": "Cliquez sur l'étoile d'une présentation pour la retrouver ici.",
    "home.empty": "Aucune présentation : créez-en une avec « Nouvelle présentation ».",
    "home.preview": "Aperçu",
    "home.star": "Favori",
    "home.more": "Plus d'actions",
    "home.modified": "modifiée {when}",
    "home.feedback": "retours",
    "home.archivedBadge": "archivée",
    "home.removeTag": "Retirer",
    "home.newTag": "nouveau tag",
    "home.open": "Ouvrir",
    "home.openTab": "Ouvrir dans un nouvel onglet",
    "home.edit": "Modifier les informations…",
    "home.duplicate": "Dupliquer",
    "home.copyCommand": "Copier la commande de capture",
    "home.archive": "Archiver",
    "home.unarchive": "Désarchiver",
    "home.archivedToast": "Présentation archivée",
    "home.unarchivedToast": "Présentation désarchivée",
    "home.duplicated": "Copie créée : {path}",
    "home.copied": "Commande copiée",
    "home.saved": "Informations enregistrées",
    "home.today": "aujourd'hui",
    "home.tomorrow": "demain",
    "home.inDays": "dans {n} j",
    "home.past": "passée",
    "home.justNow": "à l'instant",
    "home.minutesAgo": "il y a {n} min",
    "home.hoursAgo": "il y a {n} h",
    "home.daysAgo": "il y a {n} j",
    "home.onDate": "le {date}",
  },
});
translatePage();
const locale = () => (lang() === "fr" ? "fr-FR" : "en-GB");

const state = { items: [], view: "all", tag: null, query: "", sort: "modified", layout: "grid", menu: null };
try {
  state.layout = localStorage.getItem(LAYOUT_KEY) || "grid";
} catch {}

const $ = (selector) => document.querySelector(selector);
const cards = new Map();
const thumbs = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) target.style.setProperty("--scale", contentRect.width / 1920);
});

// ---------- data ----------

/** Reloads the list, but redraws nothing if it did not change (back on the tab). */
async function load() {
  const text = await (await fetch("/__library", { cache: "no-store" })).text();
  if (text === load.last) return;
  load.last = text;
  state.items = JSON.parse(text);
  render();
}

async function post(action, body) {
  const response = await fetch(`/__library/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || response.statusText);
  return data;
}

async function update(path, change) {
  try {
    const entry = await post("update", { path, ...change });
    state.items = state.items.map((item) => (item.path === path ? entry : item));
    render();
    return entry;
  } catch (error) {
    toast(error.message, true);
  }
}

// ---------- rendering ----------

function visible() {
  const query = state.query.toLowerCase();
  const list = state.items.filter((item) => {
    if (state.view === "archived" ? !item.archived : item.archived) return false;
    if (state.view === "starred" && !item.starred) return false;
    if (state.view === "upcoming" && !(item.date && item.date >= today())) return false;
    if (state.tag && !item.tags.includes(state.tag)) return false;
    const text = `${item.title} ${item.name} ${item.year} ${item.tags.join(" ")} ${item.description} ${item.venue}`.toLowerCase();
    return !query || query.split(/\s+/).every((word) => text.includes(word));
  });
  const by = {
    modified: (a, b) => b.modified - a.modified,
    title: (a, b) => a.title.localeCompare(b.title, lang()),
    year: (a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title, lang()),
  }[state.sort];
  // "Upcoming": closest talk first.
  if (state.view === "upcoming") return list.sort((a, b) => a.date.localeCompare(b.date));
  return list.sort((a, b) => b.starred - a.starred || by(a, b));
}

function render() {
  const active = state.items.filter((item) => !item.archived);
  const counts = { upcoming: active.filter((i) => i.date && i.date >= today()).length, all: active.length, starred: active.filter((i) => i.starred).length, archived: state.items.length - active.length };
  $(".hm-views").innerHTML = VIEWS.map(
    ([id, paths]) => `<button data-view="${id}" class="${state.view === id && !state.tag ? "on" : ""}">${icon(paths)}<span>${t(`home.${id}`)}</span><small>${counts[id]}</small></button>`,
  ).join("");

  const tags = new Map();
  for (const item of state.items) for (const tag of item.tags) tags.set(tag, (tags.get(tag) ?? 0) + (item.archived ? 0 : 1));
  $(".hm-tags").innerHTML =
    [...tags.entries()]
      .sort(([a], [b]) => a.localeCompare(b, lang()))
      .map(([tag, n]) => `<button data-tag="${escape(tag)}" class="${state.tag === tag ? "on" : ""}"><i style="background: ${tagColor(tag)}"></i><span>${escape(tag)}</span><small>${n}</small></button>`)
      .join("") || `<p class="hm-none">${t("home.noTags")}</p>`;

  const list = visible();
  const view = t(`home.${state.view}`);
  $(".hm-title").innerHTML = state.tag ? `<i style="background: ${tagColor(state.tag)}"></i>${escape(state.tag)}` : view;
  const container = $(".hm-cards");
  container.className = `hm-cards ${state.layout}`;
  document.querySelectorAll("[data-layout]").forEach((b) => b.classList.toggle("on", b.dataset.layout === state.layout));
  const shown = new Set(list.map((item) => item.path));
  for (const [path, card] of cards) card.hidden = !shown.has(path);
  // Cards never move in the DOM (moving an iframe reloads it):
  // the display order goes through the CSS `order` property.
  list.forEach((item, rank) => {
    const card = cardFor(item);
    fill(card, item);
    card.style.order = rank;
    if (card.parentNode !== container) container.appendChild(card);
  });
  const empty = $(".hm-empty");
  empty.hidden = list.length > 0;
  empty.textContent = state.query
    ? t("home.noMatch", { query: state.query })
    : state.view === "archived"
      ? t("home.noArchived")
      : state.view === "starred"
        ? t("home.noStarred")
        : t("home.empty");
}

/** One card per presentation, created once: its thumbnail (iframe) is never reloaded. */
function cardFor(item) {
  if (cards.has(item.path)) return cards.get(item.path);
  const card = document.createElement("article");
  card.className = "hm-card";
  card.dataset.path = item.path;
  card.innerHTML = `
    <a class="hm-thumb" href="/${item.path}/" tabindex="-1">
      <iframe src="/${item.path}/?thumb#/1/99" loading="lazy" tabindex="-1" title="${t("home.preview")}"></iframe>
    </a>
    <div class="hm-info">
      <div class="hm-head">
        <a class="hm-name" href="/${item.path}/"></a>
        <button class="hm-icon hm-star" data-action="star" title="${t("home.star")}">${icon(STAR)}</button>
        <button class="hm-icon" data-action="menu" title="${t("home.more")}">${icon('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>')}</button>
      </div>
      <div class="hm-when"></div>
      <p class="hm-desc"></p>
      <div class="hm-meta"></div>
      <div class="hm-chips"></div>
    </div>`;
  thumbs.observe(card.querySelector(".hm-thumb"));
  cards.set(item.path, card);
  return card;
}

function fill(card, item) {
  // The thumbnail is reloaded only if the presentation changed since.
  if (card.dataset.modified && Number(card.dataset.modified) !== item.modified) {
    card.querySelector("iframe").src = `/${item.path}/?thumb&v=${item.modified}#/1/99`;
  }
  card.dataset.modified = item.modified;
  card.classList.toggle("archived", item.archived);
  card.querySelector(".hm-name").textContent = item.title;
  card.querySelector(".hm-star").classList.toggle("on", item.starred);
  const meta = [item.year, `<code>${escape(item.name)}</code>`, t("home.modified", { when: ago(item.modified) })];
  if (item.feedback) meta.push(`<span class="hm-badge">${t("home.feedback")}</span>`);
  if (item.archived) meta.push(`<span class="hm-badge">${t("home.archivedBadge")}</span>`);
  card.querySelector(".hm-meta").innerHTML = meta.join('<span class="hm-dot">·</span>');
  const when = card.querySelector(".hm-when");
  when.hidden = !item.date && !item.venue;
  when.innerHTML = [
    item.date ? `<span class="hm-when-item">${icon('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', 15)}${longDate(item.date)}${soon(item.date)}</span>` : "",
    item.venue ? `<span class="hm-when-item">${icon('<path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/>', 15)}${escape(item.venue)}</span>` : "",
  ].join("");
  const desc = card.querySelector(".hm-desc");
  desc.hidden = !item.description;
  desc.textContent = item.description;
  const chips = card.querySelector(".hm-chips");
  if (chips.querySelector("input")) return;
  chips.innerHTML =
    item.tags.map((tag) => `<span class="hm-chip" style="--tag: ${tagColor(tag)}"><button data-tag="${escape(tag)}">${escape(tag)}</button><button data-untag="${escape(tag)}" title="${t("home.removeTag")}">×</button></span>`).join("") +
    `<button class="hm-addtag" data-action="tag">${icon('<path d="M12 6v12M6 12h12"/>', 14)}tag</button>`;
}

// ---------- tags ----------

function editTag(card) {
  const item = state.items.find((i) => i.path === card.dataset.path);
  const chips = card.querySelector(".hm-chips");
  const all = [...new Set(state.items.flatMap((i) => i.tags))].filter((t) => !item.tags.includes(t));
  chips.querySelector(".hm-addtag").outerHTML = `<input class="hm-taginput" list="hm-taglist" placeholder="${t("home.newTag")}" maxlength="40" /><datalist id="hm-taglist">${all.map((t) => `<option value="${escape(t)}">`).join("")}</datalist>`;
  const input = chips.querySelector("input");
  input.focus();
  let done = false;
  const finish = async (save) => {
    if (done) return;
    done = true;
    const value = input.value.trim();
    input.remove();
    if (save && value && !item.tags.includes(value)) await update(item.path, { tags: [...item.tags, value] });
    else render();
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
    event.stopPropagation();
  });
  input.addEventListener("blur", () => finish(true));
}

// ---------- context menu ----------

function openMenu(button, item) {
  const menu = $(".hm-menu");
  state.menu = item.path;
  menu.innerHTML = `
    <button data-menu="open">${icon('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>')}${t("home.open")}</button>
    <button data-menu="tab">${icon('<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16"/>')}${t("home.openTab")}</button>
    <button data-menu="edit">${icon('<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/>')}${t("home.edit")}</button>
    <button data-menu="duplicate">${icon('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>')}${t("home.duplicate")}</button>
    <button data-menu="command">${icon('<path d="m5 8 4 4-4 4M12 16h7"/>')}${t("home.copyCommand")}</button>
    <hr />
    <button data-menu="archive">${icon(VIEWS[2][2])}${item.archived ? t("home.unarchive") : t("home.archive")}</button>`;
  const box = button.getBoundingClientRect();
  menu.hidden = false;
  const width = menu.offsetWidth;
  Object.assign(menu.style, { top: `${box.bottom + 6}px`, left: `${Math.min(innerWidth - width - 12, box.right - width)}px` });
}

function closeMenu() {
  $(".hm-menu").hidden = true;
  state.menu = null;
}

async function menuAction(action) {
  const item = state.items.find((i) => i.path === state.menu);
  closeMenu();
  if (!item) return;
  if (action === "open") location.assign(`/${item.path}/`);
  else if (action === "edit") openEdit(item);
  else if (action === "tab") open(`/${item.path}/`, "_blank");
  else if (action === "archive") {
    await update(item.path, { archived: !item.archived });
    toast(item.archived ? t("home.unarchivedToast") : t("home.archivedToast"));
  } else if (action === "duplicate") {
    try {
      const { path } = await post("duplicate", { path: item.path });
      await load();
      toast(t("home.duplicated", { path }));
    } catch (error) {
      toast(error.message, true);
    }
  } else if (action === "command") {
    const command = `.venv/bin/python tools/capture.py ${item.path}`;
    try {
      await navigator.clipboard.writeText(command);
      toast(t("home.copied"));
    } catch {
      toast(command);
    }
  }
}

// ---------- new presentation and details ----------

const form = $(".hm-create .hm-dialog");
const editForm = $(".hm-edit .hm-dialog");
const closeModals = () => document.querySelectorAll(".hm-modal").forEach((m) => (m.hidden = true));

function openEdit(item) {
  editForm.dataset.path = item.path;
  editForm.title.value = item.title;
  editForm.description.value = item.description;
  editForm.date.value = item.date;
  editForm.venue.value = item.venue;
  editForm.querySelector(".hm-error").textContent = "";
  $(".hm-edit").hidden = false;
  editForm.title.focus();
}

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const change = { title: editForm.title.value, description: editForm.description.value, date: editForm.date.value, venue: editForm.venue.value };
  try {
    const entry = await post("update", { path: editForm.dataset.path, ...change });
    state.items = state.items.map((item) => (item.path === entry.path ? entry : item));
    closeModals();
    render();
    toast(t("home.saved"));
  } catch (error) {
    editForm.querySelector(".hm-error").textContent = error.message;
  }
});
let nameEdited = false;

function openModal() {
  form.reset();
  nameEdited = false;
  form.year.value = new Date().getFullYear();
  form.querySelector(".hm-error").textContent = "";
  previewPath();
  $(".hm-create").hidden = false;
  form.title.focus();
}

const slug = (text) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48);

function previewPath() {
  form.querySelector(".hm-path").innerHTML = `<code>presentations/${escape(form.year.value || "…")}/${escape(form.name.value || "…")}</code>`;
}

form.addEventListener("input", (event) => {
  if (event.target === form.name) nameEdited = true;
  if (event.target === form.title && !nameEdited) form.name.value = slug(form.title.value);
  previewPath();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const { path } = await post("new", { title: form.title.value, name: form.name.value, year: form.year.value });
    location.assign(`/${path}/`);
  } catch (error) {
    form.querySelector(".hm-error").textContent = error.message;
  }
});

// ---------- events ----------

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a");
  if (!event.target.closest(".hm-menu") && !target?.matches("[data-action='menu']")) closeMenu();
  if (event.target.classList.contains("hm-modal")) closeModals();
  if (!target) return;
  const card = target.closest(".hm-card");
  const item = card && state.items.find((i) => i.path === card.dataset.path);
  const { view, tag, untag, layout, action, menu } = target.dataset;
  if (view) (state.view = view), (state.tag = null), render();
  else if (tag !== undefined) (state.tag = state.tag === tag && !card ? null : tag), render();
  else if (untag !== undefined) update(item.path, { tags: item.tags.filter((t) => t !== untag) });
  else if (layout) {
    state.layout = layout;
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch {}
    render();
  } else if (menu) menuAction(menu);
  else if (action === "star") update(item.path, { starred: !item.starred });
  else if (action === "menu") state.menu === item.path ? closeMenu() : openMenu(target, item);
  else if (action === "tag") editTag(card);
  else if (action === "new") openModal();
  else if (action === "cancel") closeModals();
});

$(".hm-search input").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  render();
});

$(".hm-sort").addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeModals();
    if (document.activeElement === $(".hm-search input")) document.activeElement.blur();
  } else if (event.key === "/" && !event.target.closest("input")) {
    event.preventDefault();
    $(".hm-search input").focus();
  }
});

addEventListener("focus", load);

// Interface language (shared with the presentations' options window).
$(".hm-lang").innerHTML = Object.entries(LANGUAGES)
  .map(([code, label]) => `<button data-lang="${code}" class="${lang() === code ? "on" : ""}">${label}</button>`)
  .join("");
$(".hm-lang").addEventListener("click", (event) => {
  const code = event.target.closest("[data-lang]")?.dataset.lang;
  if (code && code !== lang()) setLang(code);
});

// ---------- helpers ----------

function toast(text, warn = false) {
  const node = $(".hm-toast");
  node.textContent = text;
  node.classList.toggle("warn", warn);
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (node.hidden = true), 2600);
}

function tagColor(tag) {
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 62% 52%)`;
}

const today = () => new Date().toLocaleDateString("sv-SE");

function longDate(iso) {
  return new Date(`${iso}T12:00`).toLocaleDateString(locale(), { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

/** Badge "in 5 d", "today" or "past". */
function soon(iso) {
  const days = Math.round((new Date(`${iso}T12:00`) - new Date(`${today()}T12:00`)) / 864e5);
  if (days === 0) return `<span class="hm-soon today">${t("home.today")}</span>`;
  if (days < 0) return `<span class="hm-soon past">${t("home.past")}</span>`;
  return `<span class="hm-soon">${days === 1 ? t("home.tomorrow") : t("home.inDays", { n: days })}</span>`;
}

function ago(seconds) {
  const minutes = (Date.now() / 1000 - seconds) / 60;
  if (minutes < 1) return t("home.justNow");
  if (minutes < 60) return t("home.minutesAgo", { n: Math.round(minutes) });
  if (minutes < 60 * 24) return t("home.hoursAgo", { n: Math.round(minutes / 60) });
  if (minutes < 60 * 24 * 7) return t("home.daysAgo", { n: Math.round(minutes / 1440) });
  return t("home.onDate", { date: new Date(seconds * 1000).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" }) });
}

function escape(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

load();
