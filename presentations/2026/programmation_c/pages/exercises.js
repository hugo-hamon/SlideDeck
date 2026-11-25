import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, title } from "deck/components.js";
import { c, code, grid, subtitle } from "../helpers.js";

/** Common frame of an exercise: title band, block title and statement, then the listings. */
function exercise(root, heading, statement, listings, extra = []) {
  const band = title(root, "Les pointeurs");
  const sub = subtitle(root, heading);
  const text = statement ? div(root, "abs", { x: 80, y: 215, w: 1760, html: statement, style: { fontSize: "32px", whiteSpace: "normal", lineHeight: 1.3 } }) : null;
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from([band, sub], { opacity: 0, duration: 0.5 });
  if (text) tl.from(text, { opacity: 0, x: -20, duration: 0.6 }, "<0.2");
  tl.from(listings.map((l) => l.node ?? l), { opacity: 0, y: 20, duration: 0.6, stagger: 0.12 }, "<0.2");
  if (extra.length) tl.from(extra, { opacity: 0, y: 14, duration: 0.5, stagger: 0.08 }, ">-0.2");
  pause(tl);
  return tl;
}

export function exerciseTrace(root) {
  const program = code(root, `
    int main(void)
    {
      int A = 1;
      int B = 2;
      int C = 3;
      int *P1, *P2;
      P1=&A;
      P2=&C;
      *P1=(*P2)++;
      P1=P2;
      P2=&B;
      *P1-=*P2;
      ++*P2;
      *P1*=*P2;
      A=++*P2**P1;
      P1=&A;
      *P2=*P1/=*P2;
      return 0;
    }`, { x: 80, y: 300, w: 560, size: 26, lh: 1.38, pad: 12 });
  const rows = ["Init.", "P1=&A", "P2=&C", "*P1=(*P2)++", "P1=P2", "P2=&B", "*P1-=*P2", "++*P2", "*P1*=*P2", "A=++*P2**P1", "P1=&A", "*P2=*P1/=*P2"];
  const table = grid(root, {
    x: 740, y: 300, cols: [330, 140, 140, 140, 140, 140], size: 26, rowH: 54,
    head: ["", "A", "B", "C", "P1", "P2"],
    rows: rows.map((r) => [r, "", "", "", "", ""]),
  });
  return exercise(root, "Exercice", "Soit le programme suivant. Donnez un tableau d'évolution des variables A, B, C, P1 et P2.", [program, table]);
}

export function exerciseArithmetic(root) {
  const program = code(root, `
    #include <stdio.h>
    int main(void)
    {
      int A[] = {12, 23, 34, 45, 56, 67, 78, 89, 90};
      int *P = A;

      printf("1: P=%p  &P=%p  *P=%d\\n", (void *)P, (void *)&P, *P);
      printf("2: *P+2 = %d\\n", *P+2);
      printf("3: *(P+2) = %d\\n", *(P+2));
      printf("4: &P+1 = %p\\n", (void *)(&P+1));
      printf("5: &A[4]-3 = %p\\n", (void *)(&A[4]-3));
      printf("6: A+3 = %p\\n", (void *)(A+3));
      printf("7: &A[7]-P = %td\\n", &A[7]-P);
      printf("8: P+(*P-10) = %p\\n", (void *)(P+(*P-10)));
      printf("9: *(P+*(P+8)-A[7]) = %d\\n", *(P+*(P+8)-A[7]));
      return 0;
    }`, { x: 80, y: 310, w: 1200, size: 24, lh: 1.38, pad: 12 });
  const help = div(root, "abs", {
    x: 1330, y: 330, w: 510,
    html: `<i>Aides :</i><br>${c("*P = 12")}<br>${c("&A[7]-P = 7")}<br><br><span class='muted'>Le format ${c("%p")} affiche les adresses (représentation dépendante de l'implémentation).</span>`,
    style: { fontSize: "30px", whiteSpace: "normal", lineHeight: 1.45 },
  });
  return exercise(root, "Exercice : arithmétique des pointeurs",
    `Donner les affichages suivants. Pour les adresses, on suppose ${c("P = 0xbf90f9f8")}, ${c("&P = 0xbf90fa1c")}, ${c("sizeof(int) = sizeof(int*) = 4")}.`,
    [program], [help]);
}

export function exerciseStructs(root) {
  const head = (x, html) => div(root, "abs", { x, y: 275, html: `<b>${html}</b>`, style: { fontSize: "28px" } });
  const left = code(root, `
    #include <stdio.h>
    #include <stdlib.h>
    struct eleve { char nom[20]; int date; };
    int main(void)
    {
      int n, i;
      printf("Nombre d'eleves (1-100) : ");
      if (scanf("%d", &n) != 1 ||
        n < 1 || n > 100) return 1;
      struct eleve *tab =
        malloc((size_t)n * sizeof *tab);
      if (tab == NULL) return 1;
      for (i = 0; i < n; i++) {
        printf("Nom de l'eleve %d : ", i);
        if (scanf("%19s", ⟦?????⟧) != 1) {
          free(tab); return 1;
        }`, { x: 80, y: 320, w: 880, size: 24, lh: 1.38, pad: 12 });
  const right = code(root, `
        printf("Naissance (JJMMAA) : ");
        if (scanf("%d", ⟦?????⟧) != 1) {
          free(tab); return 1;
        }
      }
      printf("Numero a consulter : ");
      if (scanf("%d", &i) != 1 ||
        i < 0 || i >= n) {
        free(tab); return 1;
      }
      printf("Nom : %s\\n", ⟦?????⟧);
      printf("Date : %06d\\n", ⟦?????⟧);
      free(tab);
      return 0;
    }`, { x: 1000, y: 320, w: 840, size: 24, lh: 1.38, pad: 12 });
  const note = div(root, "abs muted", { x: 80, y: 950, w: 1760, html: `<i>Rappel :</i> ${c("%19s")} laisse une place pour ${c("\\0")} et ${c("%d")} dans ${c("scanf")} attend une adresse.`, style: { fontSize: "26px" } });
  return exercise(root, "Exercice : tableau dynamique de structures", `Compléter les arguments manquants (<span class='hole mono'>?????</span>) :`,
    [head(80, "Début du programme"), left, head(1000, "Suite du programme"), right], [note]);
}

export function exerciseRows(root) {
  const head = (x, html) => div(root, "abs", { x, y: 272, html: `<b>${html}</b>`, style: { fontSize: "28px" } });
  const left = code(root, `
    #include <stdio.h>
    #include <stdlib.h>
    int main(void)
    {
      int **tab, **p, i, j, k = 0;
      tab = malloc(4 * sizeof *tab);
      if (!tab) return 1;
      for (i = 0; i < 4; i++) {
        tab[i] = malloc((i+1) * sizeof *tab[i]);
        if (!tab[i]) {
          for (j = 0; j < i; j++) free(tab[j]);
          free(tab);
          return 1;
        }
        for (j = 0; j <= i; j++) tab[i][j] = k++;
      }
      printf("1:%d\\n", tab[0][0]);
      printf("2:%d\\n", tab[1][1]);
      printf("3:%d\\n", tab[2][2]);
      printf("4:%d\\n", tab[3][3]);`, { x: 80, y: 318, w: 1000, size: 24, lh: 1.33, pad: 10 });
  const right = code(root, `
      p = tab;
      printf("5:%d\\n", (*p++)[0]);
      printf("6:%d\\n", ++(**p));
      printf("7:%d\\n", (*(++p))[2]);
      printf("8:%d\\n", tab[2][1]-**p);
      printf("9:%td\\n", &tab[2][1]-*p);

      for (i = 0; i < 4; i++)
        free(tab[i]);
      free(tab);
      return 0;
    }`, { x: 1120, y: 318, w: 720, size: 24, lh: 1.33, pad: 10 });
  return exercise(root, "Exercice", "Donner l'affichage produit par le programme suivant :", [head(80, "Allocations et partie 1"), left, head(1120, "Partie 2 et libération"), right]);
}

export function exerciseStrings(root) {
  const program = code(root, `
    const char *tab[] = {
      "Wolfgang Amadeus Mozart",
      "Ludwig van Beethoven",
      "Hector Berlioz",
      "Nicolo Paganini"
    };

    const char **p = tab;`, { x: 80, y: 290, w: 760, size: 28, lh: 1.4 });
  const series = [
    ["Série 1", ["(*p++)[1]", "*p++[1]", "(*++p)[4]", "*++*p"]],
    ["Série 2", ["(*p++)[1]", "*p[1]++", "(*++p)[4]", "*++*p"]],
  ].map(([name, exprs], k) => {
    const x = 940 + k * 460;
    const node = div(root, "abs", { x, y: 290, w: 420, html: `<b>${name}</b>`, style: { fontSize: "30px" } });
    exprs.forEach((e, i) => div(node, "abs", { x: 0, y: 70 + i * 80, html: `${i + 1})&nbsp; ${c(e)} : <span class='muted'>…</span>`, style: { fontSize: "32px" } }));
    return node;
  });
  return exercise(root, "Exercice", "On considère les déclarations et initialisations suivantes. Donner la valeur des expressions suivantes, pour les deux séries.", [program, ...series]);
}
