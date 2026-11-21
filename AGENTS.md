# Instructions pour les agents — présentations web

Ce dépôt contient des présentations indépendantes en HTML + SVG + GSAP + KaTeX, sans
compilation. Priorité : **clarté pédagogique**, puis **qualité visuelle**, puis simplicité du
code et rapidité d'itération. Ces règles s'appliquent à Claude Code, Codex et autres agents.

## 1. Avant de coder

1. Lire le `README.md` de la présentation, puis `deck/components.js` et `deck/theme.css`.
2. Comprendre l'idée à communiquer, le public et la durée visée.
3. Découper en étapes visuelles : une étape = une idée, pas une phrase.
4. Modifier le minimum nécessaire ; ne pas toucher aux autres présentations.

## 2. Structure

```text
SlideDeck/
├── deck/                 # moteur partagé : deck.js, components.js, theme.css
├── tools/                # serve.py (aperçu), capture.py (storyboard), new.py (création)
├── templates/presentation/
└── presentations/<année>/<nom_en_snake_case>/
    ├── index.html        # ordre des slides, pied de page
    ├── pages/*.js        # une slide par fichier
    ├── assets/           # images, données (si nécessaire)
    └── README.md         # intention, public, commandes
```

- Nouvelle présentation : `python3 tools/new.py presentations/<année>/<nom> --title "…"`.
- Fonction utile à une seule présentation : `helpers.js` dans son dossier.
- Fonction réutilisée par plusieurs présentations : `deck/components.js`.
  Chercher avant de créer, **réutiliser avant de dupliquer**, API courte et explicite.
- Les imports du moteur passent par l'alias `deck/` (`import { pause } from "deck/deck.js"`).

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

- Seuls les labels posés par `pause(tl)` sont des arrêts ; les autres labels servent au placement.
- Tout l'état dépend **uniquement du temps de la timeline** : pas de `setTimeout`, pas de
  transition CSS, pas d'aléatoire non fixé. C'est ce qui rend `#/slide/étape`, le retour
  arrière et les captures exacts.
- Pas de `tl.set()` ni de tween de durée nulle placé exactement sur un arrêt : il est rendu
  à l'arrêt précédent. Utiliser un `fromTo` court avec `immediateRender: false`.
- Un élément cloné hérite de l'état `from` de l'original : le réinitialiser avec `gsap.set`.

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
- Étape de 0,6 à 1,5 s ; démarrer l'élément suivant avant la fin du précédent (`"<0.2"`).
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

## 7. Avant de livrer

- Le storyboard a été **réellement inspecté** ; `report.json` ne signale ni erreur ni hors-cadre.
- Chaque étape a un début, une fin et un temps d'observation pertinent.
- Si `deck/` change, recapturer au moins une autre présentation qui l'utilise.
- Python : `ruff format .` et `ruff check .`.
- Mettre à jour le `README.md` de la présentation si son contenu ou ses commandes changent.
- Résumer : fichiers modifiés, captures vérifiées, limites éventuelles.

## 8. Quand demander une précision

Seulement si la réponse change le fond ou l'expérience : public, notion à démontrer,
nombre d'étapes, format de livraison. Pour le reste, choisir simplement et l'expliquer.
