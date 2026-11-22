import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { COLORS, FILLS, canvas, div, drawIn, svg, title } from "deck/components.js";

const STEPS = [
  ["Rappel des MPNN", "message passing · tâches · readout"],
  ["Limites des MPNN", "under-reaching · oversmoothing · oversquashing"],
  ["Pooling et cadre SRC", "sélection · réduction · connexion"],
  ["Comparaison des méthodes", "Top-k · DiffPool · MinCutPool · MIVSPool"],
  ["Synthèse", "retour à l’exemple et à la tâche"],
];
const PARTS = [
  ["Pourquoi changer d’échelle ?", [0, 1]],
  ["Comment réduire un graphe ?", [2, 3]],
  ["Que conserver pour la tâche ?", [4]],
];
const SPINE_X = 360;
const ROW_YS = [300, 410, 565, 675, 830];
const FRAME = { left: SPINE_X - 44, right: 1000, pad: 26 };
const SUPER_X = 1130;
const DIM = 0.22;

/**
 * Contexte du pied de page : les trois parties en mini-graphe (la partie en cours est pleine),
 * puis son titre et l'étape. `step` absent : introduction, avant la première partie.
 */
export function where(step) {
  const part = step === undefined ? -1 : PARTS.findIndex(([, members]) => members.includes(step));
  const dots = PARTS.map((_, p) => {
    const x = 9 + p * 24;
    const style = p === part ? `fill: ${COLORS[p]}` : "fill: var(--paper); stroke: var(--line); stroke-width: 2";
    return `<circle cx="${x}" cy="10" r="${p === part ? 7 : 5.5}" style="${style}"/>`;
  }).join("");
  const graph = `<svg width="66" height="20" viewBox="0 0 66 20" style="overflow: visible">
    <line x1="9" y1="10" x2="57" y2="10" style="stroke: var(--line); stroke-width: 2"/>${dots}</svg>`;
  if (part < 0) return `${graph}<span>Introduction</span>`;
  return `${graph}<span style="color: ${COLORS[part]}">${PARTS[part][0]}</span><span class="sep">·</span><span>${STEPS[step][0]}</span>`;
}

/** Construit le plan dans son état final regroupé : frise, étapes, cadres, super-nœuds. */
function layout(root) {
  const heading = title(root, "Plan du cours");
  const layer = canvas(root);
  const frames = svg(layer, "g");
  const links = svg(layer, "g");
  const spine = svg(layer, "line", {
    x1: SPINE_X, y1: ROW_YS[0], x2: SPINE_X, y2: ROW_YS.at(-1),
    style: "stroke: var(--line); stroke-width: 3",
  });
  const tokens = svg(layer, "g");
  const rows = STEPS.map(([name, details], i) => ({
    dot: svg(layer, "circle", { cx: SPINE_X, cy: ROW_YS[i], r: 11, style: "fill: var(--ink)" }),
    text: div(root, "abs", {
      x: SPINE_X + 42,
      y: ROW_YS[i] - 26,
      html: `<div style="font-size: 44px; line-height: 52px">${name}</div>
             <div class="muted" style="font-size: 27px; line-height: 34px">${details}</div>`,
    }),
  }));
  const parts = PARTS.map(([name, members], p) => {
    const ys = members.map((m) => ROW_YS[m]);
    const top = ys[0] - 26 - FRAME.pad;
    const height = ys.at(-1) + 60 + FRAME.pad - top;
    const centerY = top + height / 2;
    return {
      members,
      centerY,
      frame: svg(frames, "rect", {
        x: FRAME.left, y: top, width: FRAME.right - FRAME.left, height, rx: 18,
        style: `fill: ${FILLS[p]}; fill-opacity: 0.55; stroke: ${COLORS[p]}; stroke-width: 2.5; stroke-dasharray: 10 8`,
      }),
      hub: svg(layer, "circle", { cx: SUPER_X, cy: centerY, r: 26, style: `fill: ${COLORS[p]}; stroke: var(--paper); stroke-width: 4` }),
      caption: div(root, "abs", {
        x: SUPER_X + 50, y: centerY - 26, html: name,
        style: { fontSize: "40px", lineHeight: "52px", color: COLORS[p] },
      }),
      flying: members.map((m) => svg(tokens, "circle", { cx: SPINE_X, cy: ROW_YS[m], r: 11, style: `fill: ${COLORS[p]}` })),
    };
  });
  const chain = parts.slice(1).map((part, i) =>
    svg(links, "line", { x1: SUPER_X, y1: parts[i].centerY, x2: SUPER_X, y2: part.centerY, style: "stroke: var(--ink); stroke-width: 3" }),
  );
  return { heading, spine, rows, parts, chain };
}

/** Le plan s'annonce étape par étape, puis se regroupe en trois parties comme un pooling. */
export default function plan(root) {
  const { heading, spine, rows, parts, chain } = layout(root);
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" });
  drawIn(tl, spine, { duration: 1 }, "<0.2");
  rows.forEach(({ dot, text }, i) => {
    if (i > 0) pause(tl);
    tl.from(dot, { scale: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2.5)" }, i ? ">" : "<0.3");
    tl.from(text, { x: -36, opacity: 0, duration: 0.7 }, "<0.05");
  });
  pause(tl);

  tl.addLabel("group");
  parts.forEach(({ members, centerY, frame, hub, caption, flying }, p) => {
    tl.from(frame, { opacity: 0, scaleX: 0.96, transformOrigin: "0% 50%", duration: 0.7 }, `group+=${p * 0.12}`);
    tl.to(members.map((m) => rows[m].dot), { fill: COLORS[p], duration: 0.4 }, "<");
    tl.from(flying, { opacity: 0, duration: 0.01 }, "group+=0.6");
    tl.to(flying, { attr: { cx: SUPER_X, cy: centerY }, duration: 1, ease: "power3.inOut", stagger: 0.06 }, `group+=${0.6 + p * 0.1}`);
    tl.to(flying, { opacity: 0, duration: 0.2 }, ">-0.15");
    tl.from(hub, { scale: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(2)" }, "<-0.1");
    tl.from(caption, { x: -30, opacity: 0, duration: 0.7 }, "<0.15");
  });
  drawIn(tl, chain, { duration: 0.6, stagger: 0.15 }, ">-0.3");
  pause(tl);
  return tl;
}

/** Rappel du plan regroupé avant une nouvelle partie : tout s'estompe sauf l'étape `step`. */
export function recap(step) {
  return function planRecap(root) {
    const { heading, spine, rows, parts, chain } = layout(root);
    const part = parts.findIndex((p) => p.members.includes(step));
    parts.forEach(({ members, flying }, p) => {
      members.forEach((m) => gsap.set(rows[m].dot, { fill: COLORS[p] }));
      gsap.set(flying, { opacity: 0 });
    });
    const everything = [spine, ...chain, ...rows.flatMap((r) => [r.dot, r.text]), ...parts.flatMap((p) => [p.frame, p.hub, p.caption])];
    const focus = new Set([rows[step].dot, rows[step].text, parts[part].frame, parts[part].hub, parts[part].caption]);

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(heading, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" });
    tl.from(everything, { opacity: 0, duration: 0.6 }, "<0.1");
    tl.to(everything.filter((e) => !focus.has(e)), { opacity: DIM, duration: 0.8, ease: "power2.inOut" }, ">0.2");
    tl.to(rows[step].text, { scale: 1.08, transformOrigin: "0% 50%", duration: 0.8, ease: "power3.inOut" }, "<");
    pause(tl);
    return tl;
  };
}
