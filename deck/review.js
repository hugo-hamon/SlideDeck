/**
 * Edit mode (`e` key): circle things with a marker, drop notes and write a general note
 * per slide. Feedback is saved to `feedback.json` next to `index.html` (through
 * tools/serve.py), then read by tools/review.py.
 */
import { keyLabel, t } from "./i18n.js";
import { exported, loadStyle, settings } from "./ui.js";

const NS = "http://www.w3.org/2000/svg";
const PANEL_WIDTH = 380;
const SAVE_DELAY = 300;
const MIN_STEP = 4;
const MAX_TARGETS = 6;
const TOOLS = { p: "pen", n: "note", x: "erase" };
const ACTIVE_KEY = "deck-review-active";

export function createReview(stage, { names, goto, onLayout }) {
  const url = new URL("__feedback", location.href);
  const localKey = `deck-feedback:${url.pathname}`;
  const state = { active: false, overlay: false, tool: "pen", index: 0, step: 0, steps: 1 };
  let data = empty();
  let history = [];
  let saveTimer = null;
  let live = null;

  loadStyle("review.css");

  const layer = svgNode("svg", { class: "review-layer", viewBox: "0 0 1920 1080" });
  stage.appendChild(layer);
  const panel = buildPanel();
  document.body.appendChild(panel);

  // ---------- data ----------

  function empty() {
    return { version: 1, slides: {} };
  }

  function entry(create = false) {
    const key = String(state.index + 1);
    if (!data.slides[key] && create) data.slides[key] = { name: names[state.index] || "", note: "", steps: {} };
    return data.slides[key];
  }

  function items(create = false) {
    const slide = entry(create);
    if (!slide) return [];
    const key = String(state.step + 1);
    if (!slide.steps[key] && create) slide.steps[key] = [];
    return slide.steps[key] ?? [];
  }

  function prune() {
    for (const [key, slide] of Object.entries(data.slides)) {
      for (const [step, list] of Object.entries(slide.steps)) if (!list.length) delete slide.steps[step];
      if (!Object.keys(slide.steps).length && !slide.note.trim()) delete data.slides[key];
    }
  }

  function snapshot() {
    history.push(JSON.stringify(data));
    if (history.length > 100) history.shift();
  }

  function undo() {
    if (!history.length) return;
    data = JSON.parse(history.pop());
    save();
    render();
  }

  function add(annotation) {
    snapshot();
    items(true).push(annotation);
    save();
    render();
    panel.querySelector(".rv-list li:last-child input")?.focus();
  }

  function remove(i) {
    snapshot();
    items().splice(i, 1);
    save();
    render();
  }

  async function load() {
    // Exported page (file://, no server): only the browser's own feedback exists.
    const served = !exported() && location.protocol.startsWith("http");
    try {
      if (!served) throw new Error("no server");
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        data = { ...empty(), ...(await response.json()) };
        return;
      }
    } catch {}
    try {
      const raw = localStorage.getItem(localKey);
      data = raw ? { ...empty(), ...JSON.parse(raw) } : empty();
    } catch {}
  }

  function serialize() {
    prune();
    return JSON.stringify({ ...data, updated: new Date().toISOString() }, null, 2);
  }

  function save() {
    clearTimeout(saveTimer);
    setStatus(t("review.saving"));
    saveTimer = setTimeout(flush, SAVE_DELAY);
  }

  /** Writes to disk, and the browser keeps a copy only if the server refuses. */
  async function flush() {
    saveTimer = null;
    const body = serialize();
    try {
      if (exported() || !location.protocol.startsWith("http")) throw new Error("no server");
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!response.ok) throw new Error(response.statusText);
      localStorage.removeItem(localKey);
      setStatus(t("review.saved"));
    } catch {
      try {
        localStorage.setItem(localKey, body);
      } catch {}
      setStatus(t("review.local"), true);
    }
  }

  addEventListener("pagehide", () => {
    if (saveTimer === null) return;
    clearTimeout(saveTimer);
    if (!exported() && location.protocol.startsWith("http")) navigator.sendBeacon(url, new Blob([serialize()], { type: "application/json" }));
    else flush();
  });

  // ---------- locating the targeted elements ----------

  function currentSlide() {
    return [...stage.querySelectorAll(".slide:not(.leaving)")].at(-1);
  }

  function toStage(clientX, clientY) {
    const rect = stage.getBoundingClientRect();
    const scale = rect.width / 1920;
    return [(clientX - rect.left) / scale, (clientY - rect.top) / scale];
  }

  function toClient(x, y) {
    const rect = stage.getBoundingClientRect();
    const scale = rect.width / 1920;
    return [rect.left + x * scale, rect.top + y * scale];
  }

  function stageBox(el) {
    const r = el.getBoundingClientRect();
    const [x, y] = toStage(r.left, r.top);
    const scale = stage.getBoundingClientRect().width / 1920;
    return { x, y, w: r.width / scale, h: r.height / scale };
  }

  function visible(el, slide) {
    for (let node = el; node && node !== slide; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) return false;
    }
    return true;
  }

  const insideFormula = (el) => Boolean(el.parentElement?.closest(".katex")) || Boolean(el.closest("defs"));

  /** Visible elements inside the circled area, keeping only the outermost ones. */
  function boxTargets(box) {
    const slide = currentSlide();
    if (!slide) return [];
    const zone = (box.w + 1) * (box.h + 1);
    const hits = [...slide.querySelectorAll("*")]
      .filter((el) => !insideFormula(el))
      .map((el) => [el, stageBox(el)])
      .filter(([el, b]) => {
        const area = (b.w + 1) * (b.h + 1);
        return (b.w || b.h) && area <= zone * 1.2 && overlap(b, box) >= 0.7 * area && visible(el, slide);
      });
    const chosen = new Set(hits.map(([el]) => el));
    if (!hits.length) return pointTargets(...toClient(box.x + box.w / 2, box.y + box.h / 2));
    return hits
      .filter(([el]) => {
        for (let node = el.parentElement; node && node !== slide; node = node.parentElement) if (chosen.has(node)) return false;
        return true;
      })
      .sort(([, a], [, b]) => b.w * b.h - a.w * a.h)
      .slice(0, MAX_TARGETS)
      .map(([el, b]) => describe(el, b));
  }

  /** Elements under the point, from the deepest to the widest. */
  function pointTargets(clientX, clientY) {
    const slide = currentSlide();
    if (!slide) return [];
    const seen = new Set();
    for (let el of document.elementsFromPoint(clientX, clientY)) {
      el = el.closest(".katex") ?? el;
      if (el === slide || !slide.contains(el) || insideFormula(el) || !visible(el, slide)) continue;
      const box = stageBox(el);
      if (box.w * box.h < 0.4 * 1920 * 1080) seen.add(el);
    }
    return [...seen].slice(0, 3).map((el) => describe(el, stageBox(el)));
  }

  // ---------- drawing ----------

  function render() {
    renderLayer();
    renderPanel();
  }

  function renderLayer() {
    layer.replaceChildren();
    layer.classList.toggle("on", state.active || state.overlay);
    layer.classList.toggle("editing", state.active);
    layer.dataset.tool = state.tool;
    if (!state.active && !state.overlay) return;
    const slide = entry();
    if (slide && state.active) {
      for (const [key, list] of Object.entries(slide.steps)) {
        if (Number(key) - 1 < state.step) list.forEach((a, i) => drawItem(a, `${key}.${i + 1}`, -1));
      }
    }
    items().forEach((a, i) => drawItem(a, String(i + 1), i));
  }

  function drawItem(annotation, text, index) {
    const group = svgNode("g", { class: index < 0 ? "rv-item faded" : "rv-item" }, layer);
    if (index >= 0) group.dataset.index = index;
    if (annotation.kind === "stroke") {
      const points = parsePoints(annotation.points);
      const d = pathData(points);
      svgNode("path", { d, class: "rv-hit" }, group);
      svgNode("path", { d, class: "rv-ink" }, group);
      marker(group, points[0], text, 17);
    } else marker(group, annotation.at, text, 24);
  }

  function marker(group, [x, y], text, r) {
    svgNode("circle", { cx: x, cy: y, r, class: "rv-badge" }, group);
    const label = svgNode("text", { x, y: y + 1, class: "rv-badge-text", style: `font-size: ${r * (text.length > 2 ? 0.8 : 1.15)}px` }, group);
    label.textContent = text;
  }

  layer.addEventListener("pointerdown", (event) => {
    if (!state.active || event.button !== 0) return;
    event.preventDefault();
    const point = toStage(event.clientX, event.clientY);
    if (state.tool === "pen") {
      layer.setPointerCapture(event.pointerId);
      live = { points: [point], path: svgNode("path", { class: "rv-ink", d: pathData([point]) }, layer) };
    } else if (state.tool === "note") {
      add({ kind: "note", at: point.map(Math.round), note: "", targets: pointTargets(event.clientX, event.clientY) });
    } else {
      const item = event.target.closest?.(".rv-item[data-index]");
      if (item) remove(Number(item.dataset.index));
    }
  });

  layer.addEventListener("pointermove", (event) => {
    if (!live) return;
    const point = toStage(event.clientX, event.clientY);
    const last = live.points.at(-1);
    if (Math.hypot(point[0] - last[0], point[1] - last[1]) < MIN_STEP) return;
    live.points.push(point);
    live.path.setAttribute("d", pathData(live.points));
  });

  const endStroke = () => {
    if (!live) return;
    const points = live.points.map((p) => p.map(Math.round));
    live = null;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    if (points.length < 3 || Math.max(box.w, box.h) < 12) return renderLayer();
    add({ kind: "stroke", points: points.map((p) => p.join(",")).join(" "), box: [box.x, box.y, box.w, box.h], note: "", targets: boxTargets(box) });
  };
  layer.addEventListener("pointerup", endStroke);
  layer.addEventListener("pointercancel", endStroke);

  // ---------- panel ----------

  function buildPanel() {
    const node = document.createElement("aside");
    node.className = "review-panel";
    // Hidden until review.css is loaded.
    node.style.display = "none";
    node.innerHTML = `
      <header><strong>${t("review.title")}</strong><span class="rv-where"></span></header>
      <div class="rv-name"></div>
      <div class="rv-tools">
        ${Object.entries(TOOLS).map(([key, tool]) => `<button data-tool="${tool}">${t(`review.${tool}`)} <kbd>${key.toUpperCase()}</kbd></button>`).join("")}
        <button data-action="undo">${t("review.undo")} <kbd>Ctrl Z</kbd></button>
      </div>
      <label for="rv-note">${t("review.slideNote")}</label>
      <textarea id="rv-note" class="rv-note" rows="4" placeholder="${t("review.slideNotePlaceholder")}"></textarea>
      <label>${t("review.items")}</label>
      <ol class="rv-list"></ol>
      <p class="rv-empty">${t("review.empty")}</p>
      <label>${t("review.index")}</label>
      <div class="rv-index"></div>
      <footer>
        <span class="rv-status"></span>
        <button data-action="close">${t("review.quit")} <kbd>${keyLabel(settings.shortcuts.edit[0] ?? "e")}</kbd></button>
      </footer>`;
    node.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    node.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.tool) setTool(button.dataset.tool);
      else if (button.dataset.action === "undo") undo();
      else if (button.dataset.action === "close") toggle(false);
      else if (button.dataset.remove) remove(Number(button.dataset.remove));
      else if (button.dataset.goto) {
        const [slide, step] = button.dataset.goto.split(".").map(Number);
        goto(slide - 1, step - 1);
      }
    });
    node.addEventListener("focusin", (event) => {
      if (event.target.matches("input, textarea")) snapshot();
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Escape" || (event.key === "Enter" && event.target.matches("input"))) event.target.blur();
    });
    node.addEventListener("input", (event) => {
      const target = event.target;
      if (target.matches(".rv-note")) entry(true).note = target.value;
      else if (target.dataset.item !== undefined) items()[Number(target.dataset.item)].note = target.value;
      else return;
      save();
      renderIndex();
    });
    return node;
  }

  function renderPanel() {
    document.body.classList.toggle("reviewing", state.active);
    if (!state.active) return;
    panel.querySelector(".rv-where").textContent = t("review.where", { slide: state.index + 1, slides: names.length, step: state.step + 1, steps: state.steps });
    panel.querySelector(".rv-name").textContent = names[state.index] ? `${names[state.index]}()` : "";
    panel.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === state.tool));
    const note = panel.querySelector(".rv-note");
    if (document.activeElement !== note) note.value = entry()?.note ?? "";
    const list = items();
    panel.querySelector(".rv-list").innerHTML = list
      .map((a, i) => `<li><span class="rv-num">${i + 1}</span><input data-item="${i}" value="${escape(a.note)}" placeholder="${t("review.problem", { kind: a.kind === "stroke" ? t("review.circled") : t("review.note") })}" /><button data-remove="${i}" title="${t("review.delete")}">×</button></li>`)
      .join("");
    panel.querySelector(".rv-empty").hidden = list.length > 0;
    renderIndex();
  }

  function renderIndex() {
    const chips = Object.entries(data.slides)
      .filter(([, s]) => s.note.trim() || Object.values(s.steps).some((l) => l.length))
      .sort(([a], [b]) => a - b)
      .map(([key, s]) => {
        const steps = Object.keys(s.steps).filter((k) => s.steps[k].length).map(Number).sort((a, b) => a - b);
        const count = steps.reduce((n, k) => n + s.steps[k].length, 0) + (s.note.trim() ? 1 : 0);
        const here = Number(key) === state.index + 1 ? " here" : "";
        const title = t("review.count", { n: count });
        return `<button class="rv-chip${here}" data-goto="${key}.${steps[0] ?? 1}" title="${title}">Slide ${key}<small>${count}</small></button>`;
      });
    panel.querySelector(".rv-index").innerHTML = chips.join("") || `<span class="rv-none">${t("review.none")}</span>`;
  }

  function setStatus(text, warn = false) {
    const node = panel.querySelector(".rv-status");
    node.textContent = text;
    node.classList.toggle("warn", warn);
  }

  function setTool(tool) {
    state.tool = tool;
    render();
  }

  async function toggle(on = !state.active) {
    state.active = on;
    try {
      on ? sessionStorage.setItem(ACTIVE_KEY, "1") : sessionStorage.removeItem(ACTIVE_KEY);
    } catch {}
    if (on && saveTimer === null) await load();
    render();
    onLayout();
  }

  const ready = load().then(() => {
    let resume = false;
    try {
      resume = sessionStorage.getItem(ACTIVE_KEY) === "1";
    } catch {}
    return resume ? toggle(true) : render();
  });

  return {
    /** Enters or leaves edit mode (configurable key, `e` by default). */
    toggle: (on) => toggle(on),
    active: () => state.active,
    /** Width reserved for the panel, removed from the stage area. */
    inset: () => (state.active ? PANEL_WIDTH : 0),
    update(index, step, steps) {
      Object.assign(state, { index, step, steps });
      live = null;
      render();
    },
    /** Handles edit-mode keys and returns true when the key is consumed. */
    handleKey(event) {
      const key = event.key.toLowerCase();
      if (event.ctrlKey || event.metaKey) {
        if (state.active && key === "z") return undo(), true;
        return false;
      }
      if (event.altKey || !state.active) return false;
      if (key === "escape") return toggle(false), true;
      if (TOOLS[key]) return setTool(TOOLS[key]), true;
      return false;
    },
    api: {
      ready,
      /** Shows the annotations without the panel (tools/review.py captures). */
      overlay(on = true) {
        state.overlay = on;
        renderLayer();
      },
      data: () => data,
    },
  };
}

function svgNode(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.appendChild(node);
  return node;
}

/** Strokes are stored as a compact string "x,y x,y …". */
function parsePoints(text) {
  return text.split(" ").map((pair) => pair.split(",").map(Number));
}

function pathData(points) {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (points.length === 1 ? " l0.1 0" : "");
}

function overlap(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w >= 0 && h >= 0 ? (w + 1) * (h + 1) : 0;
}

function escape(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/** Short description of an element: tag, classes, text (LaTeX for formulas), box. */
function describe(el, box) {
  const result = { tag: el.tagName.toLowerCase() };
  const className = el.getAttribute("class");
  if (el.id) result.id = el.id;
  if (className) result.class = className;
  const text = readable(el);
  if (text) result.text = text;
  result.box = [box.x, box.y, box.w, box.h].map(Math.round);
  return result;
}

function readable(el) {
  const tex = (node) => node.querySelector("annotation[encoding='application/x-tex']")?.textContent ?? "";
  if (el.classList.contains("katex")) return `$${tex(el)}$`;
  const clone = el.cloneNode(true);
  clone.querySelectorAll(".katex").forEach((k) => k.replaceWith(`$${tex(k)}$`));
  return clone.textContent.replace(/\s+/g, " ").trim().slice(0, 80);
}
