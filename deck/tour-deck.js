/**
 * Second half of the guided tour, inside a presentation (opened from the home page with
 * `?tour`). A floating card presents each key and ticks it when the user tries it.
 * The current step is kept in sessionStorage, so a live reload resumes the tour.
 */
import { addStrings, keyLabel, t } from "./i18n.js";
import { startTour } from "./tour.js";
import { HOME_URL, TOUR_KEY, actionFor, hasHome, settings } from "./ui.js";

addStrings({
  en: {
    "tour.deck.nav.title": "A presentation, step by step",
    "tour.deck.nav.body": "<p>Each slide builds up in several steps, the moments where you speak. Move forward and back with the arrows, <kbd>Space</kbd> or the clicker.</p><p>The address <code>#/slide/step</code> points to an exact step.</p>",
    "tour.deck.overview.title": "Overview",
    "tour.deck.overview.body": "<p>Every slide in its final state. Use the arrows then <kbd>Enter</kbd>, or click, to jump to a slide.</p>",
    "tour.deck.presenter.title": "Presenter view",
    "tour.deck.presenter.body": "<p>A second window for your own screen: current slide, next step, speaker notes, timer and clock. Both windows stay in sync.</p><p>Notes are saved to <code>notes.json</code>.</p>",
    "tour.deck.pen.title": "Pen and laser pointer",
    "tour.deck.pen.body": "<ul><li><b>left click</b> draws and the <b>wheel</b> sets the size</li><li>a <b>long press</b> opens the colour wheel</li><li><b>right click</b> erases</li></ul><p>The laser turns the cursor into a red dot, also shown on the presenter window.</p>",
    "tour.deck.edit.title": "Edit mode: feedback",
    "tour.deck.edit.body": "<p>Circle what is wrong with the marker, drop numbered notes, write a note per slide. Everything goes to <code>feedback.json</code>, ready to be read by an AI agent.</p>",
    "tour.deck.options.title": "Options and export",
    "tour.deck.options.body": "<ul><li><b>Export</b> to one offline HTML file, a vector PDF or animated GIFs</li><li>rebind every <b>shortcut</b></li><li>pick the <b>interface language</b> in <b>Appearance</b></li></ul>",
    "tour.deck.end.title": "That's it",
    "tour.deck.end.body": "<p>Press <kbd>{home}</kbd> to go back to all your presentations. The <b>?</b> button at the bottom left of the home page plays this tour again.</p>",
    "tour.deck.home": "Back to the home page",
  },
  fr: {
    "tour.deck.nav.title": "Une présentation, pas à pas",
    "tour.deck.nav.body": "<p>Chaque slide se construit en plusieurs étapes, les moments où vous parlez. Avancez et revenez avec les flèches, <kbd>Espace</kbd> ou la télécommande.</p><p>L'adresse <code>#/slide/étape</code> pointe vers une étape précise.</p>",
    "tour.deck.overview.title": "Vue d'ensemble",
    "tour.deck.overview.body": "<p>Toutes les slides dans leur état final. Flèches puis <kbd>Entrée</kbd>, ou un clic, pour aller à une slide.</p>",
    "tour.deck.presenter.title": "Vue présentateur",
    "tour.deck.presenter.body": "<p>Une seconde fenêtre pour votre écran : slide actuelle, étape suivante, notes, chrono et horloge. Les deux fenêtres restent synchronisées.</p><p>Les notes sont enregistrées dans <code>notes.json</code>.</p>",
    "tour.deck.pen.title": "Stylo et pointeur laser",
    "tour.deck.pen.body": "<ul><li><b>clic gauche</b> pour dessiner et <b>molette</b> pour la taille</li><li>un <b>appui long</b> ouvre la roue des couleurs</li><li><b>clic droit</b> pour gommer</li></ul><p>Le laser transforme le curseur en point rouge, visible aussi dans la vue présentateur.</p>",
    "tour.deck.edit.title": "Mode Édition : les retours",
    "tour.deck.edit.body": "<p>Entourez ce qui ne va pas au feutre, posez des notes numérotées, écrivez une note par slide. Tout va dans <code>feedback.json</code>, prêt à être lu par un agent IA.</p>",
    "tour.deck.options.title": "Options et export",
    "tour.deck.options.body": "<ul><li><b>Exportez</b> en un fichier HTML hors ligne, un PDF vectoriel ou des GIF animées</li><li>changez chaque <b>raccourci</b></li><li>choisissez la <b>langue de l'interface</b> dans <b>Apparence</b></li></ul>",
    "tour.deck.end.title": "C'est tout",
    "tour.deck.end.body": "<p>Appuyez sur <kbd>{home}</kbd> pour revenir à toutes vos présentations. Le bouton <b>?</b> en bas à gauche de la page d'accueil relance ce tutoriel.</p>",
    "tour.deck.home": "Retour à l'accueil",
  },
});

const label = (action) => keyLabel(settings.shortcuts[action]?.[0] ?? "—");
const chip = (action) => ({ id: action, label: label(action) });

export function startDeckTour() {
  let start = 0;
  try {
    const url = new URL(location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      history.replaceState(history.state, "", url);
    } else start = JSON.parse(sessionStorage.getItem(TOUR_KEY))?.step ?? 0;
  } catch {}
  const save = (step) => {
    try {
      sessionStorage.setItem(TOUR_KEY, JSON.stringify({ path: location.pathname, step }));
    } catch {}
  };
  const step = (id, keys) => ({ title: t(`tour.deck.${id}.title`), body: t(`tour.deck.${id}.body`), try: keys.map(chip) });
  const last = { title: t("tour.deck.end.title"), body: t("tour.deck.end.body", { home: label("home") }) };
  if (hasHome()) last.action = { label: t("tour.deck.home"), run: () => (tour.end(true), location.assign(HOME_URL)) };
  const steps = [
    step("nav", ["next", "prev"]),
    step("overview", ["overview"]),
    step("presenter", ["presenter"]),
    step("pen", ["pen", "laser"]),
    step("edit", ["edit"]),
    step("options", ["options"]),
    last,
  ];
  // The keys keep their usual effect: the tour only watches them.
  const onKey = (event) => {
    if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const action = actionFor(event);
    if (action) tour.done(action);
  };
  const tour = startTour(steps, {
    start,
    float: true,
    keys: false,
    onStep: save,
    onEnd() {
      removeEventListener("keydown", onKey, true);
      try {
        sessionStorage.removeItem(TOUR_KEY);
      } catch {}
    },
  });
  addEventListener("keydown", onKey, true);
}
