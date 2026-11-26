import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { canvas, drawIn, label, svg, tex, title } from "deck/components.js";

// Right triangle 3-4-5, 60 px per unit: right angle at P, leg a = PR (vertical), leg b = PQ.
const P = [640, 680];
const Q = [880, 680];
const R = [640, 500];
const N = [180, -240]; // outward normal of the hypotenuse, as long as it
const points = (list) => list.map(([x, y]) => `${x},${y}`).join(" ");
const center = (list) => list.reduce(([sx, sy], [x, y]) => [sx + x / list.length, sy + y / list.length], [0, 0]);

/** A formula grows with its figure: each term appears with the square it measures. */
export default function pythagoras(root) {
  const heading = title(root, "Formulas grow with the figure");
  const layer = canvas(root);

  const squares = [
    [R, P, [P[0] - 180, P[1]], [R[0] - 180, R[1]]],
    [P, Q, [Q[0], Q[1] + 240], [P[0], P[1] + 240]],
    [R, Q, [Q[0] + N[0], Q[1] + N[1]], [R[0] + N[0], R[1] + N[1]]],
  ];
  const tones = ["blue", "green", "red"];
  const shapes = squares.map((corners, i) =>
    svg(layer, "polygon", { points: points(corners), style: `fill: var(--${tones[i]}-fill); stroke: var(--${tones[i]}); stroke-width: 3; stroke-linejoin: round` }),
  );
  const triangle = svg(layer, "polygon", { points: points([P, Q, R]), style: "fill: var(--panel); stroke: var(--ink); stroke-width: 4; stroke-linejoin: round" });
  const corner = svg(layer, "polyline", { points: points([[P[0], P[1] - 26], [P[0] + 26, P[1] - 26], [P[0] + 26, P[1]]]), style: "fill: none; stroke: var(--ink); stroke-width: 2" });

  const letters = [
    label(root, tex("a"), R[0] - 30, 590, 40),
    label(root, tex("b"), 760, Q[1] + 36, 40),
    label(root, tex("c"), 780, 565, 40),
  ];
  const areas = ["a^2", "b^2", "c^2"].map((t, i) => {
    const [x, y] = center(squares[i]);
    return label(root, tex(`\\htmlClass{c-${tones[i]}}{${t}}`), x, y, 44);
  });

  const formula = label(root, tex("\\htmlClass{c-blue}{a^2} + \\htmlClass{c-green}{b^2} = \\htmlClass{c-red}{c^2}", true), 1460, 520, 64);
  const parts = [formula.querySelector(".c-blue"), formula.querySelector(".mbin"), formula.querySelector(".c-green"), formula.querySelector(".mrel"), formula.querySelector(".c-red")];
  const numbers = label(root, tex("3^2 + 4^2 = 9 + 16 = 25 = 5^2"), 1460, 640, 40, "abs muted");

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  drawIn(tl, triangle, { duration: 1 }, "<0.2");
  tl.from(corner, { opacity: 0, duration: 0.4 }, "<0.6");
  tl.from(letters, { opacity: 0, scale: 0.6, duration: 0.5, ease: "back.out(2)", stagger: 0.08 }, "<0.1");
  pause(tl);

  // The two legs: their squares unfold, and the first terms appear in the same colours.
  tl.to(letters.slice(0, 2), { opacity: 0, duration: 0.3, ease: "power2.in" });
  tl.from(shapes.slice(0, 2), { scale: 0, transformOrigin: "50% 50%", duration: 0.8, stagger: 0.15 }, "<0.1");
  tl.from(areas.slice(0, 2), { opacity: 0, duration: 0.5, stagger: 0.15 }, "<0.3");
  tl.from(parts.slice(0, 3), { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, "<0.2");
  pause(tl);

  // The hypotenuse: its square completes the formula, then a numerical check.
  tl.to(letters[2], { opacity: 0, duration: 0.3, ease: "power2.in" });
  tl.from(shapes[2], { scale: 0, transformOrigin: "50% 50%", duration: 0.8 }, "<0.1");
  tl.from(areas[2], { opacity: 0, duration: 0.5 }, "<0.3");
  tl.from(parts.slice(3), { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, "<0.2");
  tl.from(numbers, { opacity: 0, y: 12, duration: 0.6 }, "<0.4");
  pause(tl);
  return tl;
}
