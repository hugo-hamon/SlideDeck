import { gsap } from "gsap";
import { createReview } from "./review.js";

const STAGE = { width: 1920, height: 1080 };
const FADE = 0.35;
const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown", " "]);
const PREV_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp"]);

/** Marque la fin d'une étape : l'orateur s'arrête ici. */
export function pause(tl) {
  return tl.addLabel(`stop-${Object.keys(tl.labels).length}`);
}

/**
 * Associe à une slide un contexte affiché dans le pied de page (partie en cours, etc.).
 * Sans contexte, la zone reste vide : utile avant l'annonce du plan.
 */
export function section(slide, html) {
  const wrapped = (root) => slide(root);
  wrapped.context = html;
  wrapped.slideName = slide.slideName ?? slide.name;
  return wrapped;
}

/** Lance la présentation : chaque slide est une fonction (élément) => timeline GSAP. */
export function startDeck(slides, { footer } = {}) {
  const stage = document.querySelector(".stage");
  const footerNode = footer ? renderFooter(stage, footer) : null;
  const state = { index: -1, step: 0, current: null, tween: null };

  const review = createReview(stage, {
    names: slides.map((slide) => slide.slideName ?? slide.name ?? ""),
    goto: (index, step) => show(index, step, false),
    onLayout: () => fit(),
  });

  // En mode Édition, la scène laisse la place au panneau latéral.
  const fit = () => {
    const width = innerWidth - review.inset();
    const scale = Math.min(width / STAGE.width, innerHeight / STAGE.height);
    stage.style.left = `${width / 2}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  function mount(index) {
    const el = document.createElement("section");
    el.className = "slide";
    stage.insertBefore(el, footerNode);
    const tl = slides[index](el).pause(0);
    const times = Object.entries(tl.labels).filter(([name]) => name.startsWith("stop-")).map(([, t]) => t);
    const stops = [...new Set(times)].filter((t) => t > 0).sort((a, b) => a - b);
    if (!stops.length || stops.at(-1) < tl.duration() - 1e-6) stops.push(tl.duration());
    return { el, tl, stops };
  }

  function show(index, step, animate) {
    state.tween?.kill();
    let changed = false;
    if (index !== state.index) {
      const old = state.current;
      stage.querySelectorAll(".slide.leaving").forEach((el) => el.remove());
      old?.tl.kill();
      if (old && animate) {
        old.el.classList.add("leaving");
        gsap.to(old.el, { opacity: 0, duration: FADE, ease: "power2.in", onComplete: () => old.el.remove() });
      } else old?.el.remove();
      changed = Boolean(old);
      state.current = mount(index);
      state.index = index;
    }
    const { tl, stops } = state.current;
    const target = step < 0 ? stops.length - 1 : step;
    if (animate) {
      const from = target === 0 ? 0 : stops[target - 1];
      tl.seek(from);
      state.tween = tl.tweenFromTo(from, stops[target], { delay: changed ? FADE * 0.6 : 0 });
    } else tl.seek(stops[target]);
    state.step = target;
    if (footerNode) updateFooter(footerNode, index, slides[index].context ?? "", animate);
    review.update(index, target, stops.length);
    history.replaceState(null, "", `#/${index + 1}/${target + 1}`);
  }

  function next() {
    if (state.step < state.current.stops.length - 1) show(state.index, state.step + 1, true);
    else if (state.index < slides.length - 1) show(state.index + 1, 0, true);
  }

  function prev() {
    if (state.step > 0) show(state.index, state.step - 1, false);
    else if (state.index > 0) show(state.index - 1, -1, false);
  }

  function fromHash() {
    const match = location.hash.match(/^#\/(\d+)(?:\/(\d+))?/);
    if (!match) return false;
    const index = Math.min(Math.max(Number(match[1]) - 1, 0), slides.length - 1);
    show(index, 0, false);
    show(index, Math.min(Number(match[2] ?? 1) - 1, state.current.stops.length - 1), false);
    return true;
  }

  addEventListener("resize", fit);
  addEventListener("hashchange", fromHash);
  addEventListener("keydown", (event) => {
    if (event.target.closest?.("input, textarea, [contenteditable]")) return;
    if (review.handleKey(event)) return event.preventDefault();
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (NEXT_KEYS.has(event.key)) next();
    else if (PREV_KEYS.has(event.key)) prev();
    else if (event.key === "Home") show(0, 0, false);
    else if (event.key === "End") show(slides.length - 1, -1, false);
    else if (event.key === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    else return;
    event.preventDefault();
  });
  fit();
  if (!fromHash()) show(0, 0, true);
  liveReload();

  window.deck = {
    goto: (slide, step = 1) => show(slide - 1, step - 1, false),
    /** Fige l'animation de l'étape à une fraction de sa durée (0 = début, 1 = fin). */
    frame: (slide, step, fraction) => {
      show(slide - 1, step - 1, false);
      const { tl, stops } = state.current;
      const from = step === 1 ? 0 : stops[step - 2];
      tl.seek(from + (stops[step - 1] - from) * fraction);
    },
    /** Retours du mode Édition (touche `e`) : voir tools/review.py. */
    review: review.api,
    /** `stops` : fin de chaque étape, en secondes de timeline (export GIF). */
    info: () => ({
      slide: state.index + 1,
      step: state.step + 1,
      steps: state.current.stops.length,
      stops: [...state.current.stops],
      slides: slides.length,
    }),
  };
}

function renderFooter(stage, items) {
  const node = document.createElement("footer");
  node.className = "footer";
  const info = items.filter(Boolean).map((item) => `<span>${item}</span>`).join('<span class="sep">·</span>');
  node.innerHTML = `<div class="info">${info}</div><div class="where"><span class="context"></span><span class="page"></span></div>`;
  stage.appendChild(node);
  return node;
}

/** Numéro de page et contexte ; le contexte change en fondu quand on change de partie. */
function updateFooter(node, index, html, animate) {
  node.querySelector(".page").textContent = String(index + 1).padStart(2, "0");
  const context = node.querySelector(".context");
  if (context.dataset.html === html) return;
  context.dataset.html = html;
  gsap.killTweensOf(context);
  if (!animate) {
    context.innerHTML = html;
    gsap.set(context, { opacity: 1, x: 0 });
    return;
  }
  gsap.to(context, {
    opacity: 0, x: 8, duration: 0.2, ease: "power2.in",
    onComplete: () => {
      context.innerHTML = html;
      gsap.fromTo(context, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" });
    },
  });
}

/** Recharge la page quand deck/serve.py signale un fichier modifié ; ignoré ailleurs. */
function liveReload() {
  const source = new EventSource("/__reload");
  source.onmessage = () => location.reload();
  source.onerror = () => source.readyState === EventSource.CLOSED && source.close();
}
