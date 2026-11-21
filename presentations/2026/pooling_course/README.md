# Pooling sur graphes

Cours de Master 2 sur le pooling dans les GNN, porté depuis la version Manim.
Trois slides pour l'instant : plan du cours, pooling d'un graphe en communautés avec la
matrice S, architecture d'un GNN avec pooling.

```bash
python3 tools/serve.py presentations/2026/pooling_course
.venv/bin/python tools/capture.py presentations/2026/pooling_course
```

- `pages/plan.js` : le plan s'annonce puis se regroupe en trois parties, comme un pooling.
- `pages/pooling.js` : graphe à 21 nœuds → 3 super-nœuds, puis Sᵀ, X′ = SᵀX et A′ = SᵀAS.
- `pages/architecture.js` : figure façon article, blocs 3D construits de gauche à droite.
