import { gsap } from "gsap";
import { createLaser } from "./laser.js";
import { mountSlide, renderFooter } from "./mount.js";
import { createNotes, noteKeys } from "./notes.js";
import { createOptions } from "./options.js";
import { createOverview } from "./overview.js";
import { createPen } from "./pen.js";
import { createPresenter } from "./presenter.js";
import { createReview } from "./review.js";
import { BACKDROPS, HOME_URL, actionFor, exported, hasHome, loadStyle, onSettings, thumbnail } from "./ui.js";

const STAGE = { width: 1920, height: 1080 };
const FADE = 0.35;

/** Marks the end of a step: the speaker stops here. */
export function pause(tl) {
  return tl.addLabel(`stop-${Object.keys(tl.labels).length}`);
}

/**
 * Attaches a context shown in the footer to a slide (current part, etc.).
 * Without context the area stays empty: useful before the outline is announced.
 */
export function section(slide, html) {
  const wrapped = (root) => slide(root);
  wrapped.context = html;
  wrapped.slideName = slide.slideName ?? slide.name;
  return wrapped;
}

/** Starts the presentation: each slide is a function (element) => GSAP timeline. */
export function startDeck(allSlides, { footer } = {}) {
  // HTML export: only the chosen slides are kept, with their original numbers.
  const kept = window.__DECK_EXPORT__?.slides?.filter((n) => n >= 1 && n <= allSlides.length);
  const numbers = kept?.length ? kept : allSlides.map((_, i) => i + 1);
  const slides = numbers.map((n) => allSlides[n - 1]);
  const stage = document.querySelector(".stage");
  const footerNode = footer ? renderFooter(stage, footer) : null;
  const state = { index: -1, step: 0, current: null, tween: null };
  loadStyle("options.css");
  onSettings((settings) => document.documentElement.style.setProperty("--backdrop", BACKDROPS[settings.backdrop]));

  const names = slides.map((slide) => slide.slideName ?? slide.name ?? "");
  const review = createReview(stage, {
    names,
    goto: (index, step) => show(index, step, false),
    onLayout: () => fit(),
  });
  const pen = createPen(stage);
  const printPdf = async ({ picked, perStep, onProgress }) =>
    (await import("./print.js")).printSlides({ slides, numbers, footer, picked, perStep, onProgress });
  const options = createOptions({ names, current: () => state.index, pen, printPdf });
  const notes = createNotes(noteKeys(names));
  const overview = createOverview({ slides, numbers, names, current: () => state.index, onPick: (index) => go(index, 0, false) });
  // Navigation received from the other window (presenter ↔ audience): applied without echoing it.
  const apply = {
    current: () => ({ index: state.index, step: state.step, animate: false }),
    to(index, step, animate) {
      if (index === state.index && step === state.step) return;
      state.remote = true;
      show(index, step, animate);
      state.remote = false;
    },
  };
  const laser = createLaser(stage, { onMove: (x, y, visible) => presenter.laser(x, y, visible) });
  const presenter = createPresenter({ slides, numbers, names, notes, footer, apply, onLaser: laser.remote });

  // The stage fills the window, minus the edit-mode panel or the presenter view.
  const fit = () => {
    const area = presenter.area() ?? { x: 0, y: 0, w: innerWidth - review.inset(), h: innerHeight };
    const scale = Math.min(area.w / STAGE.width, area.h / STAGE.height);
    stage.style.left = `${area.x + area.w / 2}px`;
    stage.style.top = `${area.y + area.h / 2}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  const mount = (index) => mountSlide(slides[index], stage, footerNode);

  /** User navigation in this window. */
  const go = (index, step, animate) => show(index, step, animate);

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
    pen.setSlide(index);
    if (footerNode) updateFooter(footerNode, numbers[index], slides[index].context ?? "", animate);
    review.update(index, target, stops.length);
    if (state.remote) presenter.refresh(index, target, stops.length);
    else presenter.notify(index, target, animate, stops.length);
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
  // Shortcuts are configured in the options window (o key); see ACTIONS in ui.js.
  const actions = {
    next,
    prev,
    first: () => show(0, 0, false),
    last: () => show(slides.length - 1, -1, false),
    fullscreen: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()),
    options: () => options.toggle(),
    pen: () => {
      if (review.active()) return;
      laser.toggle(false);
      pen.toggle();
    },
    penUndo: () => pen.undo(),
    penClear: () => pen.clear(),
    edit: () => {
      pen.toggle(false);
      review.toggle();
    },
    home: () => hasHome() && location.assign(HOME_URL),
    presenter: () => presenter.open(),
    overview: () => overview.toggle(),
    laser: () => {
      pen.toggle(false);
      laser.toggle();
    },
  };
  addEventListener("keydown", (event) => {
    if (thumbnail()) return;
    if (options.handleKey(event)) return event.preventDefault();
    if (overview.handleKey(event, actionFor(event))) return event.preventDefault();
    if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
    if (review.handleKey(event)) return event.preventDefault();
    if (event.key === "Escape" && pen.active()) return pen.toggle(false), event.preventDefault();
    if (event.key === "Escape" && laser.active()) return laser.toggle(false), event.preventDefault();
    const action = actionFor(event);
    if (!action) return;
    actions[action]();
    event.preventDefault();
  });
  fit();
  if (!fromHash()) show(0, 0, true);
  liveReload();

  window.deck = {
    goto: (slide, step = 1) => show(slide - 1, step - 1, false),
    /** Freezes the step's animation at a fraction of its duration (0 = start, 1 = end). */
    frame: (slide, step, fraction) => {
      show(slide - 1, step - 1, false);
      const { tl, stops } = state.current;
      const from = step === 1 ? 0 : stops[step - 2];
      tl.seek(from + (stops[step - 1] - from) * fraction);
    },
    /** Edit-mode feedback (`e` key): see tools/review.py. */
    review: review.api,
    /** `stops`: end of each step, in timeline seconds (GIF export). */
    info: () => ({
      slide: state.index + 1,
      step: state.step + 1,
      steps: state.current.stops.length,
      stops: [...state.current.stops],
      /** Repeating timelines (e.g. a welcome loop): the GIF export keeps a single cycle. */
      loops: state.current.tl
        .getChildren(false, false, true)
        .filter((child) => child.repeat() !== 0)
        .map((child) => ({ start: child.startTime(), cycle: child.duration(), end: child.endTime() })),
      slides: slides.length,
    }),
  };
}

/** Page number and context, which cross-fades when the part changes. */
function updateFooter(node, number, html, animate) {
  node.querySelector(".page").textContent = String(number).padStart(2, "0");
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

/** Reloads the page when tools/serve.py reports a changed file (ignored elsewhere). */
function liveReload() {
  if (exported() || thumbnail() || location.protocol === "file:") return;
  const source = new EventSource("/__reload");
  source.onmessage = () => location.reload();
  source.onerror = () => source.readyState === EventSource.CLOSED && source.close();
}
