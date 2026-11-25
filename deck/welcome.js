/**
 * Welcome window of the home page: what SlideDeck is, how to use it, its features, and a
 * guided tour of the page that continues inside a presentation (tour-deck.js).
 * It opens by itself on the first visit, then from the "?" button or the `?` key.
 */
import { LANGUAGES, addStrings, keyLabel, lang, setLang, t } from "./i18n.js";
import { startTour } from "./tour.js";
import { settings } from "./ui.js";

const SEEN_KEY = "deck-home-welcome";
const PAGES = 3;
const icon = (paths, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${paths}</svg>`;
const key = (action) => `<kbd>${keyLabel(settings.shortcuts[action]?.[0] ?? "—")}</kbd>`;
const PLAY = '<path d="M8 5.5v13l10-6.5Z" style="fill: currentColor"/>';

addStrings({
  en: {
    "home.help": "Help and guided tour",
    "welcome.close": "Close",
    "welcome.next": "Next",
    "welcome.back": "Back",
    "welcome.play": "Play the guided tour",
    "welcome.tourShort": "Guided tour",
    "welcome.p1.title": "Welcome to SlideDeck",
    "welcome.p1.body":
      "SlideDeck makes <b>animated scientific presentations</b> in plain HTML, SVG and JavaScript. The goal is to build these slides step by step while making use of animations (matrices that fill in, formulas that appear at the right moment, etc.).",
    "welcome.p1.more": "Each slide is a small JavaScript file. Save it and the slide reloads on the same step.",
    "welcome.pill1": "No build step",
    "welcome.pill2": "LaTeX formulas",
    "welcome.pill3": "Step-by-step animation",
    "welcome.pill4": "Made for AI agents",
    "welcome.p2.title": "How it works",
    "welcome.p2.create": "Create",
    "welcome.p2.createBody": "Click <b>New presentation</b> and pick one of the templates. A folder appears in <code>presentations/&lt;year&gt;/</code>.",
    "welcome.p2.write": "Write",
    "welcome.p2.writeBody": "One slide is one file in <code>pages/</code>. Write it yourself or ask an AI agent, guided by <code>AGENTS.md</code>. The preview reloads at each save.",
    "welcome.p2.present": "Present",
    "welcome.p2.presentBody": "Open the presentation and move forward with the arrows. Draw, point, show your notes, then export to HTML, PDF or GIF.",
    "welcome.p2.tip": "This page runs thanks to <code>python3 tools/serve.py</code>: keep it running while you work.",
    "welcome.p3.title": "Inside a presentation",
    "welcome.p3.body": "The objective is to use shortcut, so nothing clutters the slides.",
    "welcome.f.nav": "Step by step",
    "welcome.f.navBody": "forward and back",
    "welcome.f.overview": "Overview",
    "welcome.f.overviewBody": "every slide at a glance",
    "welcome.f.presenter": "Presenter view",
    "welcome.f.presenterBody": "notes, next step and timer",
    "welcome.f.pen": "Pen and laser",
    "welcome.f.penBody": "draw or point while you talk",
    "welcome.f.edit": "Edit mode",
    "welcome.f.editBody": "circle problems for the agent",
    "welcome.f.options": "Options",
    "welcome.f.optionsBody": "export, shortcuts, language...",
    "welcome.p3.tour": "The guided tour shows all of this in about two minutes.",
    "tour.home.new.title": "Create a presentation",
    "tour.home.new.body": "<p>Pick a title and a template: SlideDeck creates the folder with a first slide and opens it.</p>",
    "tour.home.views.title": "Views",
    "tour.home.views.body": "<p><b>Upcoming</b> lists the talks with a date, the closest first. Stars and archives have their own view.</p>",
    "tour.home.tags.title": "Tags",
    "tour.home.tags.body": "<p>Tags group your presentations by course or topic. Click one to filter the list.</p>",
    "tour.home.search.title": "Search",
    "tour.home.search.body": "<p>Search by title, tag, venue or description. Press <kbd>/</kbd> from anywhere on the page.</p>",
    "tour.home.layout.title": "Sort and layout",
    "tour.home.layout.body": "<p>Sort by date, title or year, and switch between grid and list.</p>",
    "tour.home.card.title": "A presentation",
    "tour.home.card.body": "<p>The thumbnail is the presentation itself, live. Click it to open the slides.</p><p>Add tags with <b>+ tag</b> at the bottom of the card.</p>",
    "tour.home.star.title": "Star and actions",
    "tour.home.star.body": "<p>The star keeps a presentation at the top. The <b>⋯</b> button opens its actions.</p>",
    "tour.home.menu.title": "Actions",
    "tour.home.menu.body": "<p>Edit the talk details (date, venue, description), duplicate it to start a variant, archive it or delete it.</p>",
    "tour.home.settings.title": "Options",
    "tour.home.settings.body": "<p>The interface language, keyboard shortcuts and pen colours. Inside a presentation, <kbd>{key}</kbd> opens the same window with the export tools too.</p>",
    "tour.home.help.title": "Help is here",
    "tour.home.help.body": "<p>This button opens the welcome window and the tour again, at any time.</p>",
    "tour.home.next.title": "Now, inside a presentation",
    "tour.home.next.body": "<p>The tour continues in <b>{title}</b>, with the keys to present, draw and export.</p>",
    "tour.home.open": "Continue",
    "tour.home.end.title": "You are ready",
    "tour.home.end.body": "<p>Create your first presentation with <b>New presentation</b>, then press <kbd>?</kbd> on this page to replay the tour.</p>",
  },
  fr: {
    "home.help": "Aide et tutoriel",
    "welcome.close": "Fermer",
    "welcome.next": "Suivant",
    "welcome.back": "Retour",
    "welcome.play": "Lancer le tutoriel",
    "welcome.tourShort": "Tutoriel",
    "welcome.p1.title": "Bienvenue dans SlideDeck",
    "welcome.p1.body":
      "SlideDeck crée des <b>présentations scientifiques animées</b> en HTML, SVG et JavaScript. L'objectif est de construire ces slides étape par étape tout en bénéficiant d'animations (matrices qui se remplissent, formules qui apparaissent au bon moment...).",
    "welcome.p1.more": "Chaque slide est un petit fichier JavaScript. Enregistrez-le et la slide se recharge sur la même étape.",
    "welcome.pill1": "Sans compilation",
    "welcome.pill2": "Formules LaTeX",
    "welcome.pill3": "Animation pas à pas",
    "welcome.pill4": "Pensé pour les agents IA",
    "welcome.p2.title": "Comment ça marche",
    "welcome.p2.create": "Créer",
    "welcome.p2.createBody": "Cliquez sur <b>Nouvelle présentation</b> et choisissez un modèle. Un dossier apparaît dans <code>presentations/&lt;année&gt;/</code>.",
    "welcome.p2.write": "Écrire",
    "welcome.p2.writeBody": "Une slide est un fichier dans <code>pages/</code>. Écrivez-la vous-même ou demandez à un agent IA, guidé par <code>AGENTS.md</code>. L'aperçu se recharge à chaque sauvegarde.",
    "welcome.p2.present": "Présenter",
    "welcome.p2.presentBody": "Ouvrez la présentation et avancez avec les flèches. Dessinez, pointez, affichez vos notes, puis exportez en HTML, PDF ou GIF.",
    "welcome.p2.tip": "Cette page tourne grace à <code>python3 tools/serve.py</code> : laissez-le tourner pendant que vous travaillez.",
    "welcome.p3.title": "Dans une présentation",
    "welcome.p3.body": "L'objectif est d'utiliser des raccourcis afin que rien n'encombre les slides.",
    "welcome.f.nav": "Pas à pas",
    "welcome.f.navBody": "avancer et revenir",
    "welcome.f.overview": "Vue d'ensemble",
    "welcome.f.overviewBody": "toutes les slides d'un coup d'œil",
    "welcome.f.presenter": "Vue présentateur",
    "welcome.f.presenterBody": "notes, étape suivante et chrono",
    "welcome.f.pen": "Stylo et laser",
    "welcome.f.penBody": "dessiner ou pointer en parlant",
    "welcome.f.edit": "Mode Édition",
    "welcome.f.editBody": "entourer les problèmes pour l'agent",
    "welcome.f.options": "Options",
    "welcome.f.optionsBody": "export, raccourcis, langue...",
    "welcome.p3.tour": "Le tutoriel montre tout cela en deux minutes environ.",
    "tour.home.new.title": "Créer une présentation",
    "tour.home.new.body": "<p>Choisissez un titre et un modèle : SlideDeck crée le dossier avec une première slide et l'ouvre.</p>",
    "tour.home.views.title": "Vues",
    "tour.home.views.body": "<p><b>À venir</b> liste les présentations datées, la plus proche en premier. Favoris et archives ont leur propre vue.</p>",
    "tour.home.tags.title": "Tags",
    "tour.home.tags.body": "<p>Les tags regroupent vos présentations par cours ou par thème. Cliquez sur l'un d'eux pour filtrer la liste.</p>",
    "tour.home.search.title": "Recherche",
    "tour.home.search.body": "<p>Cherchez par titre, tag, lieu ou description. Appuyez sur <kbd>/</kbd> depuis n'importe où sur la page.</p>",
    "tour.home.layout.title": "Tri et affichage",
    "tour.home.layout.body": "<p>Triez par date, titre ou année, et passez de la grille à la liste.</p>",
    "tour.home.card.title": "Une présentation",
    "tour.home.card.body": "<p>La miniature est la présentation elle-même, en direct. Cliquez dessus pour ouvrir les slides.</p><p>Ajoutez des tags avec <b>+ tag</b> en bas de la carte.</p>",
    "tour.home.star.title": "Favori et actions",
    "tour.home.star.body": "<p>L'étoile garde une présentation en tête de liste. Le bouton <b>⋯</b> ouvre ses actions.</p>",
    "tour.home.menu.title": "Actions",
    "tour.home.menu.body": "<p>Modifiez les informations de la présentation (date, lieu, description), dupliquez-la pour une variante, archivez-la ou supprimez-la.</p>",
    "tour.home.settings.title": "Options",
    "tour.home.settings.body": "<p>La langue de l'interface, les raccourcis clavier et les couleurs du stylo. Dans une présentation, <kbd>{key}</kbd> ouvre la même fenêtre, avec en plus l'export.</p>",
    "tour.home.help.title": "L'aide est ici",
    "tour.home.help.body": "<p>Ce bouton rouvre la fenêtre d'accueil et le tutoriel, à tout moment.</p>",
    "tour.home.next.title": "Maintenant, dans une présentation",
    "tour.home.next.body": "<p>Le tutoriel continue dans <b>{title}</b>, avec les touches pour présenter, dessiner et exporter.</p>",
    "tour.home.open": "Continuer",
    "tour.home.end.title": "Vous êtes prêt",
    "tour.home.end.body": "<p>Créez votre première présentation avec <b>Nouvelle présentation</b>, puis appuyez sur <kbd>?</kbd> sur cette page pour rejouer le tutoriel.</p>",
  },
});

const LOGO = `
  <svg viewBox="0 0 220 132" class="wl-art" aria-hidden="true">
    <rect x="10" y="8" width="200" height="112" rx="12" class="wl-frame" />
    <path d="M56 70 150 44M56 70l84 38M150 44l-10 64" class="wl-edge" />
    <circle cx="56" cy="70" r="15" class="wl-a" />
    <circle cx="150" cy="44" r="15" class="wl-b" />
    <circle cx="140" cy="108" r="11" class="wl-c" />
    <path d="M176 22h18M176 30h12" class="wl-ink" />
  </svg>`;

/**
 * Builds the welcome window. `home` gives access to the page:
 * `reset()` shows every presentation, `firstCard()` returns the first card shown,
 * `openMenu(card)` / `closeMenu()` drive its action menu.
 */
export function setupWelcome(home) {
  const modal = document.createElement("div");
  modal.className = "hm-modal hm-welcome";
  modal.hidden = true;
  modal.innerHTML = `<div class="hm-dialog wl-dialog" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(modal);
  const dialog = modal.firstElementChild;
  let page = 0;

  function pageHtml() {
    if (page === 0)
      return `
        <div class="wl-hero">${LOGO}</div>
        <h2>${t("welcome.p1.title")}</h2>
        <p>${t("welcome.p1.body")}</p>
        <p class="wl-muted">${t("welcome.p1.more")}</p>`;
    if (page === 1)
      return `
        <h2>${t("welcome.p2.title")}</h2>
        <ol class="wl-steps">
          ${[
            ["create", '<path d="M12 5v14M5 12h14"/>'],
            ["write", '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/><path d="m14 6 3 3"/>'],
            ["present", '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>'],
          ]
            .map(([id, paths], i) => `<li><span class="wl-num">${i + 1}</span><span class="wl-icon">${icon(paths)}</span><b>${t(`welcome.p2.${id}`)}</b><p>${t(`welcome.p2.${id}Body`)}</p></li>`)
            .join("")}
        </ol>
        <p class="wl-tip">${icon('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 18)}<span>${t("welcome.p2.tip")}</span></p>`;
    const features = [
      ["nav", `${key("prev")} ${key("next")}`, '<path d="M5 12h14M13 6l6 6-6 6"/>'],
      ["overview", key("overview"), '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'],
      ["presenter", key("presenter"), '<rect x="3" y="5" width="12" height="9" rx="1.5"/><rect x="17" y="8" width="4" height="6" rx="1"/><path d="M5 18h14"/>'],
      ["pen", `${key("pen")} ${key("laser")}`, '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/>'],
      ["edit", key("edit"), '<ellipse cx="12" cy="12" rx="8" ry="6"/><path d="M17 17l3 3"/>'],
      ["options", key("options"), '<path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/>'],
    ];
    return `
      <h2>${t("welcome.p3.title")}</h2>
      <p class="wl-muted">${t("welcome.p3.body")}</p>
      <div class="wl-features">
        ${features.map(([id, keys, paths]) => `<div class="wl-feature"><span class="wl-icon">${icon(paths)}</span><div><b>${t(`welcome.f.${id}`)}</b><small>${t(`welcome.f.${id}Body`)}</small></div><span class="wl-keys">${keys}</span></div>`).join("")}
      </div>
      <p class="wl-muted">${t("welcome.p3.tour")}</p>`;
  }

  function render() {
    const last = page === PAGES - 1;
    dialog.innerHTML = `
      <button class="wl-x" data-wl="close" aria-label="${t("welcome.close")}" title="${t("welcome.close")}">×</button>
      <div class="wl-page">${pageHtml()}</div>
      <div class="wl-foot">
        <div class="wl-lang">${Object.entries(LANGUAGES).map(([code, label]) => `<button data-lang="${code}" class="${lang() === code ? "on" : ""}">${label}</button>`).join("")}</div>
        <div class="wl-dots">${Array.from({ length: PAGES }, (_, i) => `<button data-page="${i}" class="${i === page ? "on" : ""}" aria-label="${i + 1}"></button>`).join("")}</div>
        <div class="hm-actions">
          ${page > 0 ? `<button data-wl="back">${t("welcome.back")}</button>` : `<button data-wl="tour" class="wl-ghost">${icon(PLAY, 16)}${t("welcome.tourShort")}</button>`}
          ${last ? `<button class="hm-primary" data-wl="tour">${icon(PLAY, 16)}${t("welcome.play")}</button>` : `<button class="hm-primary" data-wl="next">${t("welcome.next")}</button>`}
        </div>
      </div>`;
  }

  function open(at = 0) {
    page = at;
    render();
    modal.hidden = false;
    dialog.querySelector(".hm-primary").focus();
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  const close = () => (modal.hidden = true);

  dialog.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const { wl, page: to, lang: code } = button.dataset;
    if (wl === "close") close();
    else if (wl === "next") (page = Math.min(PAGES - 1, page + 1)), render();
    else if (wl === "back") (page = Math.max(0, page - 1)), render();
    else if (wl === "tour") close(), playTour(home);
    else if (to !== undefined) (page = Number(to)), render();
    else if (code && code !== lang()) {
      // The language reloads the page: the window comes back, in the new language.
      try {
        localStorage.removeItem(SEEN_KEY);
      } catch {}
      setLang(code);
    }
  });

  modal.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && page < PAGES - 1) (page += 1), render();
    else if (event.key === "ArrowLeft" && page > 0) (page -= 1), render();
  });

  let seen = false;
  try {
    seen = localStorage.getItem(SEEN_KEY) === "1";
  } catch {}
  if (!seen) open();
  return { open };
}

/** Guided tour of the home page, which ends by opening the first presentation in tour mode. */
function playTour(home) {
  home.reset();
  const card = home.firstCard();
  const title = card?.querySelector(".hm-name")?.textContent ?? "";
  const steps = [
    { target: ".hm-new", placement: "right", title: t("tour.home.new.title"), body: t("tour.home.new.body") },
    { target: ".hm-views", placement: "right", title: t("tour.home.views.title"), body: t("tour.home.views.body") },
    { target: () => [document.querySelector(".hm-side h3"), document.querySelector(".hm-tags")], placement: "right", title: t("tour.home.tags.title"), body: t("tour.home.tags.body") },
    { target: ".hm-search", placement: "bottom", title: t("tour.home.search.title"), body: t("tour.home.search.body") },
    { target: () => [document.querySelector(".hm-sort"), document.querySelector(".hm-segment")], placement: "bottom", title: t("tour.home.layout.title"), body: t("tour.home.layout.body") },
  ];
  if (card) {
    steps.push(
      { target: card, placement: "right", title: t("tour.home.card.title"), body: t("tour.home.card.body") },
      { target: [card.querySelector(".hm-star"), card.querySelector("[data-action='menu']")], placement: "bottom", padding: 4, title: t("tour.home.star.title"), body: t("tour.home.star.body") },
      { target: ".hm-menu", placement: "right", enter: () => home.openMenu(card), leave: home.closeMenu, title: t("tour.home.menu.title"), body: t("tour.home.menu.body") },
    );
  }
  steps.push(
    { target: ".hm-settings", placement: "right", title: t("tour.home.settings.title"), body: t("tour.home.settings.body", { key: keyLabel(settings.shortcuts.options[0] ?? "—") }) },
    { target: ".hm-help", placement: "right", title: t("tour.home.help.title"), body: t("tour.home.help.body") },
  );
  if (card) {
    const go = () => {
      tour.end(true);
      location.assign(`/${card.dataset.path}/?tour`);
    };
    steps.push({ target: card, placement: "right", title: t("tour.home.next.title"), body: t("tour.home.next.body", { title: escape(title) }), action: { label: `${t("tour.home.open")} →`, run: go } });
  } else steps.push({ title: t("tour.home.end.title"), body: t("tour.home.end.body") });
  const tour = startTour(steps);
}

function escape(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
