# Pooling sur graphes

Cours de Master 2 sur le pooling dans les GNN, porté depuis la version Manim
(`~/Bureau/Manim/2026/pooling_course`) avec le style clair de SlideDeck. Même ordre et
mêmes arrêts que `PoolingCourse` : accueil, exemple, plan, présentation, motivation,
rappel du plan, MPNN.

```bash
python3 tools/serve.py presentations/2026/pooling_course
.venv/bin/python tools/capture.py presentations/2026/pooling_course
```

| Slide | Fichier | Contenu |
|---|---|---|
| 01 | `pages/intro.js` | Titre + graphe à 21 nœuds qui flotte et se regroupe en 3 super-nœuds, en boucle (16 s × 40). → passe à la suite. |
| 02 | `pages/example.js` | Le même graphe glisse à gauche ; chaque voisinage à 1 saut passe dans le GNN (le premier en 3 arrêts), puis communautés, contraction, passage des 3 communautés, comparaison finale avec zoom sur le super-nœud bleu. |
| 03 | `pages/plan.js` | Cinq étapes sur une frise, puis « poolées » en trois parties. |
| 04 | `pages/thesis.js` | « Ma thèse » : voisinage à 1 saut de l’orateur (LITIS, GrapHiX, encadrants). |
| 05 | `pages/motivation.js` | 3-WL : 21³ = 9 261 triplets ; une copie du graphe se contracte → 3³ = 27. |
| 06 | `recap(0)` de `pages/plan.js` | Plan regroupé, tout estompé sauf « Rappel des MPNN ». Réutiliser `recap(step)` avant chaque partie. |
| 07 | `pages/mpnn.js` | MPNN vu comme une boîte : nœuds, matrice des arêtes (chaque case (i, j) combine la ligne i et la colonne j), readout. |
| 08 | `pages/layer.js` | Repart de l’état final de 07 (`buildMacro`) et zoome dans la boîte, puis une couche : message, agrégation, mise à jour, tous les nœuds, K = 1 et 2 ; puis GCN, GINE, GAT. |
| 09 | `recap(1)` | Plan regroupé, focus sur « Limites des MPNN ». |
| 10 | `pages/underreach.js` | Chaîne de 4 communautés : d(s, t) = 11 sauts contre 3 après pooling ; la portée de t s'étend d'un saut par couche, des deux côtés en même temps (K = 1, 2, 3). |
| 11 | `pages/smoothing.js` | Embedding scalaire (couleur) et agrégation moyenne réellement calculée sur le graphe à 21 nœuds : K = 0 → 64 à gauche, 2 couches + pooling à droite. |
| 12 | `pages/squashing.js` | Oversquashing **structurel** : arbre binaire relié à t par une seule arête ; à chaque couche (K = 1…4) les messages du nouveau niveau convergent vers ce goulot (1, 3, 7, 15 nœuds). À droite, le pooling change la topologie : 3 super-nœuds, chaque arête ne porte qu'un super-nœud. La compression d'information propre au pooling est gardée pour les limites du pooling. |
| 13 | `pages/depth.js` | Bilan : axe du nombre de couches K ; sans pooling K = 11 (zone lissage / écrasement), avec pooling K = 3. |
| 14 | `recap(2)` | Plan regroupé, focus sur « Pooling et cadre SRC ». |
| 15 | `pages/src.js` | Cadre SRC (Grattarola et al.) sur le graphe à 8 nœuds : SEL remplit S ligne par ligne, RED contracte chaque région en super-nœud, CON relie les super-nœuds ; une carte par étape. |
| 16 | `pages/taxonomy.js` | Tableau des méthodes dans le cadre SRC (Top-k, SAGPool, DiffPool, MinCutPool, Graclus, EdgePool, MIVSPool) : SEL, RED, CON, affectation, « tous contribuent », creux, K. Une ligne par arrêt, puis focus sur les 4 méthodes détaillées. |
| 17 | `recap(3)` | Plan regroupé, focus sur « Comparaison des méthodes ». |
| 18 | `pages/topk.js` | Scores triés, seuil k = ⌈rN⌉, pondération tanh(y), sous-graphe induit déconnecté. |
| 19 | `pages/diffpool.js` | S souple (8 × 3), chaque nœud envoie une part S_ik à chaque super-nœud, A′ = SᵀAS dense (calculée), pertes auxiliaires. |
| 20 | `pages/mincut.js` | S floue → nette pendant l'entraînement (pertes ℒc + ℒo calculées), arêtes coupées en rouge ; contraction ; A′ : diagonale annulée puis normalisée. |
| 21 | `pages/mivs.js` | Mêmes scores que Top-k : MIVS glouton (survivants, voisins retirés), rattachement au survivant voisin, contraction sur place, graphe réduit connexe. |

## Pied de page

À partir du plan (slide 03), le pied de page indique la partie en cours : mini-graphe des
trois parties (la partie courante est pleine, dans sa couleur), titre de la partie et étape.
Dans `index.html`, chaque slide est enveloppée par `section(slide, where(step))` ;
`where()` sans argument affiche « Introduction ». `section` vient de `deck/deck.js`.

`methods.js` regroupe ce qui est commun aux slides 15–21 : graphe à 8 nœuds numéroté,
scores partagés (Top-k, MIVSPool), communautés, bandeau SEL → RED → CON, référence, bilan ✓/✗,
matrice S.

`helpers.js` regroupe les graphes (21 nœuds, 8 nœuds du MPNN), le flottement, les
voisinages, les « flashs » le long des arêtes et les mélanges de couleurs, ainsi que les outils des slides de comparaison
(`versus`, `valueColor`, `swap`, `hops`, `meanLayer`).

## Choix d’adaptation

- Couleurs : bleu / vert / rouge du thème à la place de la palette Manim
  (cyan, orange, violet). s en bleu, voisins v en vert, messages en rouge.
- Exemple : les cases des 21 nœuds sont des nuances d’encre (une par classe de voisinage,
  signature simple) ; les 3 cases poolées prennent la couleur de leur communauté.
- MPNN : les couleurs d’embedding sont des mélanges des trois couleurs du thème.
- Boucle d’accueil : la timeline répète un cycle de 16 s ; `CYCLE`, `LOOPS` et
  `AMPLITUDE` (px) se règlent en tête de `pages/intro.js`. Les trajectoires sont fixées
  par une graine, donc seek et captures restent exacts.
- `assets/eyes.svg` provient de Twemoji (jdecked/twemoji 15.1.0, CC-BY 4.0).

`pages/pooling.js` (matrice S, X′ = SᵀX, A′ = SᵀAS) et `pages/architecture.js`
(architecture GNN + pooling) viennent du prototype : ils ne sont plus dans le deck
(remplacés par les slides 15–21).
