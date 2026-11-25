/**
 * Guided tour engine: a card that walks through steps, either pointing at elements of the
 * page (spotlight, home page) or floating in a corner (inside a presentation).
 *
 *   const tour = startTour([{ target: ".hm-new", placement: "right", title, body }], { onEnd });
 *
 * A step may define `target` (selector, element, or function returning one or several
 * elements), `placement` (right, left, bottom, top), `enter` / `leave` hooks, an `action`
 * button `{ label, run }`, and `try` chips `[{ id, label }]` that `tour.done(id)` ticks.
 */
import { t } from "./i18n.js";
import { loadStyle } from "./ui.js";

loadStyle("tour.css");

export function startTour(steps, { start = 0, float = false, keys = true, onStep, onEnd } = {}) {
  const root = document.createElement("div");
  root.className = float ? "tour tour-float" : "tour";
  root.innerHTML = `<div class="tour-hole"></div><div class="tour-card" role="dialog" aria-live="polite"></div>`;
  document.body.appendChild(root);
  const hole = root.querySelector(".tour-hole");
  const card = root.querySelector(".tour-card");
  const done = new Set();
  let index = -1;
  let step = null;
  let ended = false;

  function targets() {
    const value = typeof step.target === "function" ? step.target() : step.target;
    const list = [value].flat().map((v) => (typeof v === "string" ? document.querySelector(v) : v));
    return list.filter((el) => el?.getClientRects().length);
  }

  function rect() {
    const boxes = targets().map((el) => el.getBoundingClientRect());
    if (!boxes.length) return null;
    const left = Math.min(...boxes.map((b) => b.left));
    const top = Math.min(...boxes.map((b) => b.top));
    const right = Math.max(...boxes.map((b) => b.right));
    const bottom = Math.max(...boxes.map((b) => b.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function go(next) {
    if (ended || next < 0 || next >= steps.length) return;
    step?.leave?.();
    index = next;
    step = steps[index];
    step.enter?.();
    onStep?.(index);
    render();
  }

  function render() {
    const last = index === steps.length - 1;
    const dots = steps.map((_, i) => `<i class="${i === index ? "on" : i < index ? "seen" : ""}"></i>`).join("");
    card.innerHTML = `
      <div class="tour-head">
        <span class="tour-count">${t("tour.count", { n: index + 1, total: steps.length })}</span>
        <button class="tour-x" data-tour="end" aria-label="${t("tour.close")}" title="${t("tour.close")}">×</button>
      </div>
      <h3>${step.title}</h3>
      <div class="tour-body">${step.body}</div>
      ${step.try ? `<div class="tour-try"><span>${t("tour.try")}</span>${step.try.map(({ id, label }) => `<kbd data-try="${id}" class="${done.has(id) ? "done" : ""}">${label}</kbd>`).join("")}</div>` : ""}
      <div class="tour-foot">
        <div class="tour-dots">${dots}</div>
        ${index > 0 ? `<button data-tour="prev">${t("tour.back")}</button>` : ""}
        ${step.action ? `<button class="tour-primary" data-tour="action">${step.action.label}</button>` : ""}
        <button class="${step.action ? "" : "tour-primary"}" data-tour="next">${last ? t("tour.finish") : t("tour.next")}</button>
      </div>`;
    card.classList.remove("tour-in");
    void card.offsetWidth;
    card.classList.add("tour-in");
    place(true);
  }

  function place(scroll = false) {
    if (ended || !step) return;
    if (scroll && !float) {
      const first = targets()[0];
      const box = first?.getBoundingClientRect();
      if (box && (box.top < 0 || box.bottom > innerHeight)) first.scrollIntoView({ block: "center" });
    }
    const box = float ? null : rect();
    const pad = step.padding ?? 6;
    if (box) {
      Object.assign(hole.style, {
        left: `${box.left - pad}px`,
        top: `${box.top - pad}px`,
        width: `${box.width + 2 * pad}px`,
        height: `${box.height + 2 * pad}px`,
      });
    } else Object.assign(hole.style, { left: `${innerWidth / 2}px`, top: `${innerHeight / 2}px`, width: "0px", height: "0px" });
    hole.classList.toggle("empty", !box);

    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const margin = 16;
    const gap = 16 + pad;
    let x = (innerWidth - w) / 2;
    let y = (innerHeight - h) / 2;
    if (float) {
      x = 24;
      y = innerHeight - h - 24;
    } else if (box) {
      let side = step.placement ?? "right";
      if (side === "right" && box.right + gap + w > innerWidth - margin) side = "left";
      if (side === "left" && box.left - gap - w < margin) side = "bottom";
      if (side === "bottom" && box.bottom + gap + h > innerHeight - margin) side = "top";
      if (side === "top" && box.top - gap - h < margin) side = "bottom";
      const midX = box.left + box.width / 2 - w / 2;
      const midY = box.top + box.height / 2 - h / 2;
      [x, y] = {
        right: [box.right + gap, midY],
        left: [box.left - gap - w, midY],
        bottom: [midX, box.bottom + gap],
        top: [midX, box.top - gap - h],
      }[side];
    }
    card.style.left = `${Math.max(margin, Math.min(innerWidth - w - margin, x))}px`;
    card.style.top = `${Math.max(margin, Math.min(innerHeight - h - margin, y))}px`;
  }

  function end(completed = false) {
    if (ended) return;
    step?.leave?.();
    ended = true;
    root.remove();
    sized.disconnect();
    removeEventListener("resize", onResize);
    removeEventListener("scroll", onResize, true);
    removeEventListener("keydown", onKey, true);
    onEnd?.(completed);
  }

  const next = () => (index === steps.length - 1 ? end(true) : go(index + 1));
  const onResize = () => place();

  function onKey(event) {
    if (event.target.closest?.("input, textarea, select")) return;
    const handler = { Escape: () => end(), ArrowRight: next, Enter: next, ArrowLeft: () => go(index - 1) }[event.key];
    if (!handler) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    handler();
  }

  // Buttons never take the focus: Space or Enter must keep driving the page, not the card.
  card.addEventListener("mousedown", (event) => event.target.closest("button") && event.preventDefault());
  card.addEventListener("click", (event) => {
    event.stopPropagation();
    const action = event.target.closest("[data-tour]")?.dataset.tour;
    if (action === "next") next();
    else if (action === "prev") go(index - 1);
    else if (action === "end") end();
    else if (action === "action") step.action.run();
  });
  addEventListener("resize", onResize);
  addEventListener("scroll", onResize, true);
  // Placed again whenever the card changes size (content, or tour.css arriving after the first render).
  const sized = new ResizeObserver(() => place());
  sized.observe(card);
  if (keys) addEventListener("keydown", onKey, true);
  go(Math.min(Math.max(0, start), steps.length - 1));

  return {
    next,
    end,
    /** Ticks the `try` chip `id` of the current step (and remembers it for later steps). */
    done(id) {
      if (done.has(id)) return;
      done.add(id);
      card.querySelector(`[data-try="${id}"]`)?.classList.add("done");
    },
    refresh: () => place(),
  };
}
