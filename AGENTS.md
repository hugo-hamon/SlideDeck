# Instructions pour les agents — présentations web

Ce dépôt contient des présentations indépendantes en HTML + SVG + GSAP + KaTeX, sans
compilation. Priorité : **clarté pédagogique**, puis **qualité visuelle**, puis simplicité du
code et rapidité d'itération. Ces règles s'appliquent à Claude Code, Codex et autres agents.

## 1. Avant de coder

1. Lire le `README.md` de la présentation, puis `deck/components.js` et `deck/theme.css`.
2. Comprendre l'idée à communiquer, le public et la durée visée.
3. Découper en étapes visuelles : une étape = une idée, pas une phrase.
4. Modifier le minimum nécessaire, sans toucher aux autres présentations.

## 2. Structure

```text
SlideDeck/
├── deck/                 # moteur partagé : deck.js, components.js, theme.css, themes/*.css (modèles),
│                         # review.js (mode Édition),
│                         # options.js (touche o : export HTML/GIF, raccourcis), pen.js (stylo), export.js, ui.js,
│                         # home.* (page d'accueil de serve.py : liste, tags, archives),
│                         # welcome.* (fenêtre d'accueil), tour.* + tour-deck.js (tutoriel guidé),
│                         # presenter.js + notes.js (touche s), overview.js (g), laser.js (l), print.js (PDF), mount.js,
│                         # i18n.js (langue de l'interface : anglais par défaut, français),
│                         # bib.js + bibliography.js (citations, fenêtre b)
├── tools/                # serve.py (aperçu + accueil), library.py (accueil), capture.py (storyboard), review.py (retours), gif.py (export GIF), bib.py (bibliographie), new.py
├── templates/presentation/
├── examples/<nom>/        # exemple livré avec le dépôt (même structure, sans année)
└── presentations/        # ignoré par Git (dépôt privé à part)
    ├── references.bib    # bibliographie BibTeX commune à toutes les présentations
    └── <année>/<nom_en_snake_case>/
        ├── index.html        # ordre des slides, pied de page
        ├── pages/*.js        # une slide par fichier
        ├── assets/           # images, données (si nécessaire)
        ├── meta.json         # tags, archive, favori, description, date, lieu (page d'accueil)
        ├── notes.json        # notes de l'orateur (vue présentateur), clé « nomDeSlide#rang »
        └── README.md         # intention, public, commandes
```

- Nouvelle présentation : `python3 tools/new.py presentations/<année>/<nom> --title "…" [--theme madrid]`.
  Un modèle est une feuille `deck/themes/<id>.css` liée après `theme.css` : elle redéfinit les
  jetons (`--paper`, `--ink`, `--blue`…, `--serif`, `--display`) et restyle `title`, `cover`,
  `bullets`, `box` et le pied de page. Dans une présentation à thème, utiliser ces composants
  plutôt que des titres positionnés à la main, et appeler `title()` sans `top`.
- Fonction utile à une seule présentation : `helpers.js` dans son dossier.
- Fonction réutilisée par plusieurs présentations : `deck/components.js`.
  Chercher avant de créer, **réutiliser avant de dupliquer**, API courte et explicite.
- Les imports du moteur passent par l'alias `deck/` (`import { pause } from "deck/deck.js"`).
- **Langue : le code est en anglais.** Identifiants, commentaires, docstrings, messages
  de la ligne de commande, journaux et messages de commit s'écrivent en anglais, dans `deck/`,
  `tools/`, `templates/` comme dans les présentations.
  - Le texte de l'interface de l'outil ne s'écrit jamais en dur : il passe par `t("clé")` de
    `deck/i18n.js`, avec une entrée `en` et une entrée `fr` pour chaque clé.
  - Seul le **contenu des slides** (titres, textes, formules affichés) et le `README.md` d'une
    présentation suivent la langue de la présentation.
- **Style d'écriture : pas de point-virgule dans une phrase**, en français comme en anglais.
  Lier les idées par des transitions fluides (« et », « puis », « tandis que », « ce qui »,
  « avec », une virgule) ou couper en deux phrases. Cela vaut pour les textes des slides,
  l'interface, les README, les commentaires et les docstrings.

## 3. Contrat d'une slide

```js
export default function maSlide(root) {      // root : <section> vide, scène 1920×1080
  // 1. construire le DOM / SVG dans son état final, coordonnées en px
  // 2. décrire l'apparition avec une timeline GSAP
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(...);
  pause(tl);                                   // arrêt : l'orateur parle ici
  tl.from(...);
  pause(tl);
  return tl;
}
```

- Seuls les labels posés par `pause(tl)` sont des arrêts, les autres servent au placement.
- Tout l'état dépend **uniquement du temps de la timeline** : pas de `setTimeout`, pas de
  transition CSS, pas d'aléatoire non fixé. C'est ce qui rend `#/slide/étape`, le retour
  arrière et les captures exacts.
- Pas de `tl.set()` ni de tween de durée nulle placé exactement sur un arrêt : il est rendu
  à l'arrêt précédent. Utiliser un `fromTo` court avec `immediateRender: false`.
- Un élément cloné hérite de l'état `from` de l'original : le réinitialiser avec `gsap.set`.

### Citations

- La bibliographie est le `references.bib` le plus proche au-dessus de la présentation
  (en général `presentations/references.bib`, commun à toutes). Style auteur-année.
- Citer avec `cite("clé")` → [Kipf & Welling, 2017] ou `citet("clé")` → Kipf & Welling (2017),
  qui renvoient du HTML à placer dans un `label`, une puce ou une `box`. Plusieurs clés et une
  page : `cite("a", "b", { page: "p. 3" })`.
- Appeler `cite()` **dans la fonction de slide**, jamais au niveau du module (constante en haut
  du fichier) : la bibliographie n'est chargée qu'au démarrage. Dans une constante, utiliser une
  fonction fléchée `() => citet("clé")`. Écrire la clé en toutes lettres, sans variable, pour que
  `tools/bib.py` et `references()` la trouvent.
- Ne jamais inventer de clé. Vérifier avec `python3 tools/bib.py <présentation>`, qui liste les
  clés citées et signale les inconnues (affichées en rouge `[?clé]` et dans `report.json`).
  Pour une référence absente, l'ajouter avec `--add <DOI ou arXiv>` ou demander à l'utilisateur.
- Slide finale : `references(root)` liste toutes les clés citées dans les sources de la
  présentation, triées par auteur puis année, avec le style du thème. Elle renvoie
  `{ heading, items }` à animer. Liste longue : la répartir sur plusieurs slides avec
  `{ start, count }`, ou choisir les clés avec `{ keys }`.

## 4. Direction artistique

- Style « figure d'article » lumineux : fond papier `--paper`, traits bleu nuit `--ink`,
  serif EB Garamond partout, KaTeX pour les formules.
- Trois couleurs de catégorie `--blue`, `--green`, `--red`, chacune avec un `--*-fill`
  translucide : remplissage translucide + contour plein. Ne pas multiplier les teintes.
- Cartes arrondies à bordure fine, panneaux à bordure `--ink`, pointillés pour un groupe.
- Jamais de couleur en dur dans une slide : `COLORS`, `FILLS`, `var(--…)`,
  `\htmlClass{c-blue}{…}` dans KaTeX.
- **Chercher un concept visuel avant de coder** : un objet familier qui porte l'information
  et se construit au rythme de l'oral, plutôt qu'une liste de textes en fondu.
  Réutiliser les objets déjà vus (graphe, couleurs) pour garder la continuité.
- Marges ≥ 80 px, texte ≥ 24 px, contraste fort, aucun chevauchement ni élément hors cadre.

## 5. Mouvement

- Arrivée : `expo.out`, ou `back.out(2)` pour un petit objet qui « pop ».
  Déplacement d'un objet existant : `power3.inOut`. Sortie : `power2.in`, plus courte.
- Décalages : 20–60 ms entre éléments d'une liste, 100–150 ms entre groupes.
- Étape de 0,6 à 1,5 s, en démarrant l'élément suivant avant la fin du précédent (`"<0.2"`).
- Préserver l'identité des objets : ils se déplacent et se transforment (copie qui glisse,
  nœuds qui convergent) plutôt que de disparaître puis réapparaître.

## 6. Cycle de travail

1. Lancer l'aperçu : `python3 tools/serve.py presentations/<année>/<nom>`.
   Chaque sauvegarde recharge la page sur la même étape.
2. Modifier une slide dans `pages/`.
3. Inspecter : `.venv/bin/python tools/capture.py presentations/<année>/<nom> [--slide N]`,
   puis ouvrir **uniquement** `.inspection/storyboard.jpg` et lire `report.json`
   (erreurs console, éléments hors cadre). `--frames 2` ajoute des images en cours
   d'animation pour juger le mouvement.
4. Corriger de façon ciblée, recapturer seulement la slide concernée.

## 7. Retours de l'utilisateur (mode Édition)

L'utilisateur annote les slides dans le navigateur (touche `e`) : zones entourées au feutre,
notes ponctuelles, note générale par slide. Tout est dans `<présentation>/feedback.json`.

1. `.venv/bin/python tools/review.py presentations/<année>/<nom>` : affiche le résumé
   (`.inspection/review/review.md`) et produit une capture annotée par étape (`sNN-eNN.png`).
   Ouvrir ces captures : les numéros des annotations y correspondent au résumé.
2. Chaque annotation donne la slide, l'étape, le commentaire, la zone en px de la scène et
   les éléments visés (balise, classe, texte ou LaTeX, boîte) pour retrouver le code.
   Le nom de la fonction de slide (`plan()`) indique le fichier dans `pages/`.
3. Traiter **tous** les retours, recapturer les slides touchées avec `capture.py`.
4. Archiver avant de modifier les slides : `tools/review.py … --clear` (la page rechargée
   repart alors de retours vides). Résumer à l'utilisateur ce qui a été fait pour chaque
   retour, et ce qui ne l'a pas été.

## 8. Avant de livrer

- Le storyboard a été **réellement inspecté** et `report.json` ne signale ni erreur ni hors-cadre.
- Chaque étape a un début, une fin et un temps d'observation pertinent.
- Si `deck/` change, recapturer au moins une autre présentation qui l'utilise.
- Python : `ruff format .` et `ruff check .`.
- Mettre à jour le `README.md` de la présentation si son contenu ou ses commandes changent.
- Résumer : fichiers modifiés, captures vérifiées, limites éventuelles.

## 9. Quand demander une précision

Seulement si la réponse change le fond ou l'expérience : public, notion à démontrer,
nombre d'étapes, format de livraison. Pour le reste, choisir simplement et l'expliquer.
