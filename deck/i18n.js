/**
 * Interface language (English by default, French available in Options → Appearance).
 * Only the tool's interface is translated: slide content stays in its own language.
 *
 *   t("opt.export")                  → "Export" / "Exporter"
 *   t("pen.strokes", { n: 3 })       → "3 strokes in total"
 */
import { saveSettings, settings } from "./ui.js";

export const LANGUAGES = { en: "English", fr: "Français" };

const STRINGS = {
  en: {
    // keyboard actions (Options → Shortcuts)
    "action.next": "Next step",
    "action.prev": "Previous step",
    "action.first": "First slide",
    "action.last": "Last slide",
    "action.fullscreen": "Fullscreen",
    "action.options": "Options",
    "action.pen": "Pen",
    "action.penUndo": "Pen: undo last stroke",
    "action.penClear": "Pen: clear the slide",
    "action.edit": "Edit mode (feedback)",
    "action.home": "Home (all presentations)",
    "action.presenter": "Presenter view (second window)",
    "action.overview": "Slide overview",
    "action.laser": "Laser pointer",
    // key names
    "key.space": "Space",
    "key.escape": "Esc",
    "key.delete": "Del",
    "key.home": "Home",
    "key.end": "End",
    "key.enter": "Enter",
    // backdrops
    "backdrop.slide": "Same as the slide",
    "backdrop.gray": "Light grey",
    "backdrop.dark": "Dark",
    "backdrop.black": "Black",
    // options window
    "opt.title": "Options",
    "opt.export": "Export",
    "opt.keys": "Shortcuts",
    "opt.pen": "Pen",
    "opt.look": "Appearance",
    "opt.home": "All presentations",
    "opt.closeHint": "<kbd>O</kbd> or <kbd>Esc</kbd> to close",
    "opt.close": "Close",
    "opt.slides": "Slides",
    "opt.all": "All",
    "opt.none": "None",
    "opt.current": "Current slide",
    "opt.rangePlaceholder": "e.g. 1-5, 8, 12",
    "opt.pdfSteps": "One page per step (animations become successive pages)",
    "opt.pdfSlides": "One page per slide (final state)",
    "opt.pdfNote": "The browser's print dialog opens: choose <b>“Save as PDF”</b>. The PDF stays vector (selectable text and formulas).",
    "opt.pdfButton": "Create the PDF",
    "opt.htmlNote": "The <code>.html</code> file works offline: slides, engine, GSAP, KaTeX, fonts and images are included.",
    "opt.htmlButton": "Download the HTML",
    "opt.fps": "Frames / s",
    "opt.width": "Width",
    "opt.hold": "Pause per step",
    "opt.combined": "A single GIF chaining the slides (otherwise one per slide, zipped)",
    "opt.loop": "Loop",
    "opt.gifExported": "Not available in an exported page: open the presentation with <code>tools/serve.py</code>.",
    "opt.gifMissing": "The server cannot render GIFs: run <code>python3 tools/serve.py …</code> and install Playwright (<code>.venv</code>).",
    "opt.gifNote": "Rendered frame by frame by the local server: allow a few seconds per slide.",
    "opt.gifButton": "Create the GIF",
    "opt.downloaded": "Downloaded ({size} MB)",
    "opt.downloadedWarn": "Downloaded ({size} MB) · {n} resource(s) left online",
    "opt.exportFailed": "Export failed: {message}",
    "opt.failed": "Failed: {message}",
    "opt.rendering": "Rendering…",
    "opt.keysNote": "Click <b>+</b> then press the key you want. A key already in use is removed from the other action.",
    "opt.remove": "Remove",
    "opt.pressKey": "Press a key…",
    "opt.reset": "Reset",
    "opt.penToggle": "turn the pen on / off",
    "opt.leftClick": "left click",
    "opt.draw": "draw",
    "opt.wheel": "wheel",
    "opt.strokeSize": "stroke size",
    "opt.longPress": "long press",
    "opt.colorWheel": "colour wheel",
    "opt.rightClick": "right click",
    "opt.erase": "erase · wheel while right-clicking (or Shift + wheel): eraser size",
    "opt.undoStroke": "undo the last stroke",
    "opt.clearSlide": "clear the slide's drawings",
    "opt.wheelColors": "Wheel colours",
    "opt.penSize": "Stroke size",
    "opt.eraserSize": "Eraser size",
    "opt.strokes": "{n} stroke(s) in total",
    "opt.clearThis": "Clear this slide",
    "opt.clearAll": "Clear everything",
    "opt.backdrop": "Backdrop around the slide",
    "opt.backdropNote": "Visible when the screen is not 16:9. “Same as the slide” removes the borders.",
    "opt.language": "Interface language",
    "opt.languageNote": "Only the tool's interface changes.",
    // edit mode
    "review.title": "Edit mode",
    "review.pen": "Marker",
    "review.note": "Note",
    "review.erase": "Eraser",
    "review.undo": "Undo",
    "review.slideNote": "General note on the slide",
    "review.slideNotePlaceholder": "What is wrong with this slide, overall…",
    "review.items": "Annotations for this step",
    "review.empty": "Circle an element with the marker or click with the Note tool, then describe the problem.",
    "review.index": "Slides with feedback",
    "review.none": "None yet.",
    "review.quit": "Quit",
    "review.where": "slide {slide}/{slides} · step {step}/{steps}",
    "review.circled": "Circled element",
    "review.problem": "{kind}: what is the problem?",
    "review.delete": "Delete",
    "review.count": "{n} feedback item(s)",
    "review.saving": "Saving…",
    "review.saved": "Saved to feedback.json",
    "review.local": "Read-only server: feedback kept in this browser",
    // presenter view
    "presenter.title": "Presenter",
    "presenter.blocked": "The presenter window was blocked: allow pop-ups for this page.",
    "presenter.next": "Next",
    "presenter.end": "End of the presentation",
    "presenter.notes": "Notes",
    "presenter.smaller": "Smaller text",
    "presenter.larger": "Larger text",
    "presenter.notesPlaceholder": "Notes for this slide: only visible here, saved to notes.json.",
    "presenter.startPause": "Start / pause",
    "presenter.reset": "Reset",
    "presenter.step": "step {step} / {steps}",
    "presenter.nextStep": "· step {step}",
    "presenter.nextSlide": "· slide {slide}",
    "notes.saving": "Saving…",
    "notes.saved": "Saved to notes.json",
    "notes.local": "Kept in this browser (no server)",
    // overview, print
    "overview.title": "Overview",
    "overview.help": "{n} slides · arrows then Enter · Esc to close",
    "print.preparing": "Preparing: slide {slide} ({n}/{total})",
    "print.ready": "{n} page(s): choose “Save as PDF”",
    // guided tour
    "tour.count": "{n} of {total}",
    "tour.close": "Close the tour",
    "tour.back": "Back",
    "tour.next": "Next",
    "tour.finish": "Finish",
    "tour.try": "Try it:",
  },
  fr: {
    "action.next": "Étape suivante",
    "action.prev": "Étape précédente",
    "action.first": "Première slide",
    "action.last": "Dernière slide",
    "action.fullscreen": "Plein écran",
    "action.options": "Options",
    "action.pen": "Stylo",
    "action.penUndo": "Stylo : annuler le dernier trait",
    "action.penClear": "Stylo : effacer la slide",
    "action.edit": "Mode Édition (retours)",
    "action.home": "Accueil (toutes les présentations)",
    "action.presenter": "Vue présentateur (seconde fenêtre)",
    "action.overview": "Vue d'ensemble des slides",
    "action.laser": "Pointeur laser",
    "key.space": "Espace",
    "key.escape": "Échap",
    "key.delete": "Suppr",
    "key.home": "Début",
    "key.end": "Fin",
    "key.enter": "Entrée",
    "backdrop.slide": "Comme la slide",
    "backdrop.gray": "Gris clair",
    "backdrop.dark": "Sombre",
    "backdrop.black": "Noir",
    "opt.title": "Options",
    "opt.export": "Exporter",
    "opt.keys": "Raccourcis",
    "opt.pen": "Stylo",
    "opt.look": "Apparence",
    "opt.home": "Toutes les présentations",
    "opt.closeHint": "<kbd>O</kbd> ou <kbd>Échap</kbd> pour fermer",
    "opt.close": "Fermer",
    "opt.slides": "Slides",
    "opt.all": "Toutes",
    "opt.none": "Aucune",
    "opt.current": "Slide actuelle",
    "opt.rangePlaceholder": "ex. 1-5, 8, 12",
    "opt.pdfSteps": "Une page par étape (les animations deviennent des pages successives)",
    "opt.pdfSlides": "Une page par slide (état final)",
    "opt.pdfNote": "La fenêtre d'impression du navigateur s'ouvre : choisissez <b>« Enregistrer au format PDF »</b>. Le PDF reste vectoriel (texte et formules sélectionnables).",
    "opt.pdfButton": "Créer le PDF",
    "opt.htmlNote": "Le fichier <code>.html</code> fonctionne hors ligne : slides, moteur, GSAP, KaTeX, polices et images sont inclus.",
    "opt.htmlButton": "Télécharger le HTML",
    "opt.fps": "Images / s",
    "opt.width": "Largeur",
    "opt.hold": "Pause par étape",
    "opt.combined": "Une seule GIF enchaînant les slides (sinon une par slide, en .zip)",
    "opt.loop": "Lecture en boucle",
    "opt.gifExported": "Indisponible dans une page exportée : ouvrez la présentation avec <code>tools/serve.py</code>.",
    "opt.gifMissing": "Le serveur ne peut pas générer de GIF : lancez <code>python3 tools/serve.py …</code> et installez Playwright (<code>.venv</code>).",
    "opt.gifNote": "Rendu image par image par le serveur local, prévoir quelques secondes par slide.",
    "opt.gifButton": "Générer la GIF",
    "opt.downloaded": "Téléchargé ({size} Mo)",
    "opt.downloadedWarn": "Téléchargé ({size} Mo) · {n} ressource(s) restée(s) en ligne",
    "opt.exportFailed": "Échec de l'export : {message}",
    "opt.failed": "Échec : {message}",
    "opt.rendering": "Rendu en cours…",
    "opt.keysNote": "Cliquez sur <b>+</b> puis appuyez sur la touche voulue. Une touche déjà prise est retirée de l'autre action.",
    "opt.remove": "Retirer",
    "opt.pressKey": "Appuyez sur une touche…",
    "opt.reset": "Réinitialiser",
    "opt.penToggle": "activer / désactiver le stylo",
    "opt.leftClick": "clic gauche",
    "opt.draw": "dessiner",
    "opt.wheel": "molette",
    "opt.strokeSize": "taille du trait",
    "opt.longPress": "appui long",
    "opt.colorWheel": "roue des couleurs",
    "opt.rightClick": "clic droit",
    "opt.erase": "gommer · molette pendant le clic droit (ou Maj + molette) : taille de la gomme",
    "opt.undoStroke": "annuler le dernier trait",
    "opt.clearSlide": "effacer les dessins de la slide",
    "opt.wheelColors": "Couleurs de la roue",
    "opt.penSize": "Taille du trait",
    "opt.eraserSize": "Taille de la gomme",
    "opt.strokes": "{n} trait(s) au total",
    "opt.clearThis": "Effacer cette slide",
    "opt.clearAll": "Tout effacer",
    "opt.backdrop": "Fond autour de la slide",
    "opt.backdropNote": "Visible quand l'écran n'a pas le format 16:9. « Comme la slide » fait disparaître les bords.",
    "opt.language": "Langue de l'interface",
    "opt.languageNote": "Seule l'interface de l'outil change.",
    "review.title": "Mode Édition",
    "review.pen": "Feutre",
    "review.note": "Note",
    "review.erase": "Gomme",
    "review.undo": "Annuler",
    "review.slideNote": "Note générale sur la slide",
    "review.slideNotePlaceholder": "Ce qui ne va pas sur cette slide, dans l'ensemble…",
    "review.items": "Annotations de l'étape",
    "review.empty": "Entourez un élément au feutre ou cliquez avec l'outil Note, puis décrivez le problème.",
    "review.index": "Slides avec des retours",
    "review.none": "Aucun pour l'instant.",
    "review.quit": "Quitter",
    "review.where": "slide {slide}/{slides} · étape {step}/{steps}",
    "review.circled": "Élément entouré",
    "review.problem": "{kind} : quel problème ?",
    "review.delete": "Supprimer",
    "review.count": "{n} retour(s)",
    "review.saving": "Enregistrement…",
    "review.saved": "Enregistré dans feedback.json",
    "review.local": "Serveur en lecture seule : retours gardés dans ce navigateur",
    "presenter.title": "Présentateur",
    "presenter.blocked": "La fenêtre présentateur a été bloquée : autorisez les fenêtres surgissantes pour cette page.",
    "presenter.next": "Suivant",
    "presenter.end": "Fin de la présentation",
    "presenter.notes": "Notes",
    "presenter.smaller": "Texte plus petit",
    "presenter.larger": "Texte plus grand",
    "presenter.notesPlaceholder": "Notes pour cette slide : visibles seulement ici, enregistrées dans notes.json.",
    "presenter.startPause": "Démarrer / pause",
    "presenter.reset": "Remettre à zéro",
    "presenter.step": "étape {step} / {steps}",
    "presenter.nextStep": "· étape {step}",
    "presenter.nextSlide": "· slide {slide}",
    "notes.saving": "Enregistrement…",
    "notes.saved": "Enregistré dans notes.json",
    "notes.local": "Gardé dans ce navigateur (pas de serveur)",
    "overview.title": "Vue d'ensemble",
    "overview.help": "{n} slides · flèches puis Entrée · Échap pour fermer",
    "print.preparing": "Préparation : slide {slide} ({n}/{total})",
    "print.ready": "{n} page(s) : choisissez « Enregistrer au format PDF »",
    "tour.count": "{n} sur {total}",
    "tour.close": "Fermer le tutoriel",
    "tour.back": "Retour",
    "tour.next": "Suivant",
    "tour.finish": "Terminer",
    "tour.try": "Essayez :",
  },
};

/** Current interface language. */
export const lang = () => (settings.lang in LANGUAGES ? settings.lang : "en");

/** Translated string, where `{name}` placeholders are replaced by `vars` and unknown keys fall back to English. */
export function t(key, vars = {}) {
  const text = STRINGS[lang()][key] ?? STRINGS.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (all, name) => (name in vars ? vars[name] : all));
}

/** Registers extra strings (the home page has its own). */
export function addStrings(table) {
  for (const code of Object.keys(LANGUAGES)) Object.assign(STRINGS[code], table[code]);
}

const KEY_NAMES = { ArrowRight: "→", ArrowLeft: "←", ArrowUp: "↑", ArrowDown: "↓", PageDown: "Page ↓", PageUp: "Page ↑", Backspace: "⌫" };
const KEY_WORDS = { " ": "key.space", Escape: "key.escape", Delete: "key.delete", Home: "key.home", End: "key.end", Enter: "key.enter" };

/** Readable key name: "Ctrl + Z", "Space", "→"… */
export function keyLabel(key) {
  return key
    .split("+")
    .map((part) => KEY_NAMES[part] ?? (KEY_WORDS[part] ? t(KEY_WORDS[part]) : part.length === 1 ? part.toUpperCase() : part))
    .join(" + ");
}

/** Changes the language and reloads the page so every component is rebuilt. */
export function setLang(code) {
  settings.lang = code;
  saveSettings();
  location.reload();
}

/** Translates static markup: `data-i18n` (text or HTML) and `data-i18n-*` attributes. */
export function translatePage(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => (node.innerHTML = t(node.dataset.i18n)));
  root.querySelectorAll("*").forEach((node) => {
    for (const { name, value } of [...node.attributes]) {
      if (name.startsWith("data-i18n-")) node.setAttribute(name.slice(10), t(value));
    }
  });
  document.documentElement.lang = lang();
}
