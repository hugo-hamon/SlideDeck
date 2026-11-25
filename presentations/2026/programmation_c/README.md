# Programmation C, cours 4 : les pointeurs

Cours de Licence 2 EEEA (Sébastien Adam), porté depuis la version Beamer
(`~/Téléchargements/CM4/cours4.tex` et `Sec9_Pointeurs.tex`) avec le thème `madrid`.
Le texte reste celui des slides d'origine. Les figures TikZ et les tableaux mémoire sont
refaits en HTML pour être animés, et les programmes s'exécutent ligne par ligne (barre rouge
sur la ligne courante, tableaux mémoire mis à jour, sortie dans un terminal).

```bash
python3 tools/serve.py presentations/2026/programmation_c
.venv/bin/python tools/capture.py presentations/2026/programmation_c
```

| Slide | Fichier | Contenu (pages du PDF d'origine) |
|---|---|---|
| 01 | `pages/cover.js` | Titre (p. 1). |
| 02 | `pages/plan.js` | Plan, puis une étape par chapitre déjà vu jusqu'aux pointeurs (p. 2–10). |
| 03 | `pages/why.js` | Pourquoi des pointeurs : mémoire en octets, `int i` en little endian, `char c` (p. 11). |
| 04 | `pages/definition.js` | Définitions, et les parties de `int *pt;` annotées une à une (p. 12). |
| 05 | `pages/inMemory.js` | `p` dans la même mémoire, adresse 2000 contre valeur 1000 (p. 13). |
| 06 | `pages/operators.js` | `&` et `*`, puis le programme exécuté avec tableau et terminal (p. 14). |
| 07–08 | `pages/copy.js` | `*p1=*p2` copie une valeur, `p1=p2` copie une adresse (p. 15–18). |
| 09 | `pages/arithmetic.js` | Opérations permises, illustrées sur une colonne de `int` (p. 19). |
| 10 | `pages/arithmeticExamples.js` | `p1 + 1` avance de 4 octets (`int`) puis de 8 (`double`) (p. 20). |
| 11 | `pages/arrays.js` | Parcours d'un tableau avec `p++`, itération par itération (p. 21–26). |
| 12–13 | `pages/exercises.js` | Exercices : évolution de A, B, C, P1, P2 et arithmétique (p. 27–28). |
| 14–15 | `pages/initialisation.js` | Pointeur non initialisé contre `&i`, puis `malloc` (p. 29–30). |
| 16–18 | `pages/malloc.js` | `malloc(1)`, correction, puis exécution en mémoire (p. 31–35). |
| 19–21 | `pages/blocks.js` | Bloc de deux `int`, `calloc`/`realloc`/`free`, taille saisie (p. 36–38). |
| 22 | `pages/matrix.js` | `int tab[3][4]` déroulé ligne par ligne en mémoire, adresses (p. 39–40). |
| 23–24 | `pages/rows.js` | Allocation par lignes en deux étapes, programme complet et libération (p. 41–44). |
| 25 | `pages/structs.js` | `p->toto`, `p[0].toto`, `(*p).toto` (p. 45). |
| 26–28 | `pages/exercises.js` | Exercices : structures, `int **`, chaînes (p. 46–48). |
| 29 | `upcoming` de `pages/plan.js` | La suite du cours : les quatre chapitres suivants (p. 49–52). |

## Choix d'adaptation

- Exercices : énoncés seuls (la correction se fait en séance).
- Couleurs : bleu pour les données, vert pour un second objet (`char c`, `j`, lignes), rouge
  pour les pointeurs, les flèches et les valeurs qui viennent de changer.
- Code corrigé là où l'original ne compilait pas : `;` manquant après le premier `printf` et
  `#define N 5` ajouté dans « Pointeurs et tableaux ».
- Les adresses non données par l'original (sorties de `printf`, bloc de `calloc`) sont fictives.
- `helpers.js` : listing C coloré avec barre d'exécution (`code`), tableaux mémoire (`grid`),
  terminal (`terminal`), flèches de pointeur déplaçables (`pointer`), listes à deux niveaux
  (`points`), légendes successives (`captions`), petites cases mémoire (`box`).
- `style.css` : police JetBrains Mono (sans ligatures) et styles de ces composants.
- `notes.json` : les scripts oraux (`Speech/*.docx`) recalés sur les slides, visibles dans la
  vue présentateur (touche `s`).
