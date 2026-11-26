# TD 5 — Fonctions logiques combinatoires (corrigé)

Corrigé du TD 5 de Logique Combinatoire et Séquentielle (L1 Informatique – EEEA), pensé pour
un étudiant qui le lit **seul**, sans enseignant. Chaque question a sa slide, et la solution se
construit pas à pas : une bulle d'explication accompagne chaque étape, la partie concernée
(porte, colonne, ligne de calcul) est mise en évidence en bleu, puis la réponse apparaît en vert.

- Rappels : notations, mintermes et maxtermes, simplifications, De Morgan, NAND et NOR.
- Exercice 1 (11 slides) : équation de chaque circuit porte par porte (portes numérotées), temps
  de réponse niveau par niveau et chemin critique, tables de vérité colonne par colonne, preuve
  algébrique règle par règle, formes canoniques, câblage minimal et son temps, versions NAND et NOR.
- Exercice 2 (8 slides) : formes canoniques de f et de son complément, terme par terme, puis
  passages par De Morgan et simplifications ligne par ligne.
- Exercice 3 (3 slides) : table de vérité remplie règle par règle, conformité de f₁ et f₂,
  puis f₁ ≠ f₂.

```bash
python3 tools/serve.py presentations/2026/td5_lcs
.venv/bin/python tools/capture.py presentations/2026/td5_lcs
```

- `pages/*.js` contient les slides, et `index.html` fixe l'ordre et le pied de page.
- `helpers.js` fournit les portes logiques, les fils, les tables de vérité, les dérivations
  révélées ligne par ligne et les bulles d'explication (`narrator`), `style.css` les met en forme.
- `pages/canonical.js` est le gabarit commun des formes canoniques (ex. 1 Q5, ex. 2 Q1 à Q4).
- Le thème `madrid` vient de `deck/themes/madrid.css`.
- `td5_corrige.pdf` est l'export à distribuer, avec **une page par étape** pour garder la
  progression. Pour le régénérer, utiliser l'export PDF du menu (touche `o`), une page par étape.
