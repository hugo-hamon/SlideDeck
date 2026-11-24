/**
 * Mounting a slide outside the main stage: the overview, the presenter view (next slide)
 * and PDF printing all use a 1920×1080 "mini stage".
 */

/** Mounts a slide in `parent`; returns the element, the (paused) timeline and the step ends. */
export function mountSlide(slide, parent, before = null) {
  const el = document.createElement("section");
  el.className = "slide";
  parent.insertBefore(el, before);
  const tl = slide(el).pause(0);
  const times = Object.entries(tl.labels).filter(([name]) => name.startsWith("stop-")).map(([, t]) => t);
  const stops = [...new Set(times)].filter((t) => t > 0).sort((a, b) => a - b);
  if (!stops.length || stops.at(-1) < tl.duration() - 1e-6) stops.push(tl.duration());
  return { el, tl, stops };
}

/** Scaled-down 1920×1080 stage (`.stage.mini`), fitted to its container. */
export function miniStage(parent) {
  const stage = document.createElement("div");
  stage.className = "stage mini";
  parent.appendChild(stage);
  const observer = new ResizeObserver(([entry]) => stage.style.setProperty("--scale", entry.contentRect.width / 1920));
  observer.observe(parent);
  return stage;
}

/**
 * Frozen picture of a slide at a step (−1: the last one) in a given stage.
 * The timeline is then killed: the DOM keeps the step's state.
 */
export function freeze(slide, stage, step = -1, footer = null) {
  stage.replaceChildren();
  const { tl, stops } = mountSlide(slide, stage);
  const k = step < 0 || step >= stops.length ? stops.length - 1 : step;
  tl.seek(stops[k], false);
  tl.kill();
  if (footer) staticFooter(stage, footer.items, footer.number, slide.context ?? "");
  return stops.length;
}

/** Presentation footer, built inside the stage. */
export function renderFooter(stage, items) {
  const node = document.createElement("footer");
  node.className = "footer";
  const info = items.filter(Boolean).map((item) => `<span>${item}</span>`).join('<span class="sep">·</span>');
  node.innerHTML = `<div class="info">${info}</div><div class="where"><span class="context"></span><span class="page"></span></div>`;
  stage.appendChild(node);
  return node;
}

/** Static footer (printing): number and context without animation. */
export function staticFooter(stage, items, number, context) {
  const node = renderFooter(stage, items);
  node.querySelector(".page").textContent = String(number).padStart(2, "0");
  node.querySelector(".context").innerHTML = context;
  return node;
}
