/**
 * Options window (`o` key): HTML / GIF / PDF export, shortcuts, pen and appearance.
 * It floats above the slides, and Esc or `o` closes it.
 */
import { LANGUAGES, keyLabel, lang, setLang, t } from "./i18n.js";
import { ACTIONS, BACKDROPS, HOME_URL, actionFor, combo, exported, hasHome, resetPen, resetShortcuts, saveSettings, settings } from "./ui.js";

const TABS = [
  ["export", '<path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/>'],
  ["keys", '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>'],
  ["pen", '<path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z"/><path d="m14 6 3 3"/>'],
  ["look", '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16Z" style="fill: currentColor"/>'],
];
const icon = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const megabytes = (blob) => (blob.size / 1e6).toFixed(1);

export function createOptions({ names, current, pen, onBackdrop, printPdf }) {
  const base = new URL("./", location.href);
  const project = decodeURIComponent(location.pathname.split("/").filter(Boolean).at(-1) || "presentation");
  const state = { open: false, tab: "export", format: "html", picked: new Set(), anchor: null, capture: null, busy: false, gif: null };

  const root = document.createElement("div");
  root.className = "opt-backdrop";
  // Hidden until options.css is loaded (otherwise the window flashes on load).
  root.style.display = "none";
  root.innerHTML = `
    <div class="opt-window" role="dialog" aria-label="${t("opt.title")}">
      <nav class="opt-nav">
        <div class="opt-brand">${t("opt.title")}</div>
        ${TABS.map(([id, paths]) => `<button data-tab="${id}">${icon(paths)}<span>${t(`opt.${id}`)}</span></button>`).join("")}
        ${hasHome() ? `<a class="opt-home" href="${HOME_URL}">${icon('<path d="M15 18l-6-6 6-6"/>')}<span>${t("opt.home")}</span></a>` : ""}
        <div class="opt-hint">${t("opt.closeHint")}</div>
      </nav>
      <section class="opt-body"></section>
      <button class="opt-close" data-action="close" aria-label="${t("opt.close")}">×</button>
    </div>`;
  document.body.appendChild(root);
  const body = root.querySelector(".opt-body");

  root.addEventListener("mousedown", (event) => {
    if (event.target === root) toggle(false);
  });
  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onInput);

  // ---------- rendering ----------

  function render() {
    root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === state.tab));
    body.innerHTML = { export: exportTab, keys: keysTab, pen: penTab, look: lookTab }[state.tab]();
    if (state.tab === "export") renderPicked();
  }

  function exportTab() {
    const gifNote = exported() ? t("opt.gifExported") : state.gif === false ? t("opt.gifMissing") : t("opt.gifNote");
    const format = (id, label) => `<button data-format="${id}" class="${state.format === id ? "on" : ""}">${label}</button>`;
    return `
      <h2>${t("opt.export")}</h2>
      <div class="opt-segment">${format("html", "HTML")}${format("gif", "GIF")}${format("pdf", "PDF")}</div>
      <h3>${t("opt.slides")} <span class="opt-count"></span></h3>
      <div class="opt-row">
        <button data-pick="all">${t("opt.all")}</button><button data-pick="none">${t("opt.none")}</button><button data-pick="here">${t("opt.current")}</button>
        <input class="opt-range" placeholder="${t("opt.rangePlaceholder")}" spellcheck="false" />
      </div>
      <div class="opt-slides">
        ${names.map((name, i) => `<button class="opt-slide" data-slide="${i + 1}" title="${name}()"><b>${i + 1}</b><small>${name || "—"}</small></button>`).join("")}
      </div>
      ${state.format === "pdf" ? `
        <div class="opt-grid">
          <label class="opt-check"><input type="radio" name="opt-pdf" data-pdf="steps" checked /> ${t("opt.pdfSteps")}</label>
          <label class="opt-check"><input type="radio" name="opt-pdf" data-pdf="slides" /> ${t("opt.pdfSlides")}</label>
        </div>
        <p class="opt-note">${t("opt.pdfNote")}</p>
        <div class="opt-actions"><span class="opt-status"></span><button class="opt-primary" data-action="pdf">${t("opt.pdfButton")}</button></div>`
      : state.format === "html" ? `
        <p class="opt-note">${t("opt.htmlNote")}</p>
        <div class="opt-actions"><span class="opt-status"></span><button class="opt-primary" data-action="html">${t("opt.htmlButton")}</button></div>`
      : `
        <div class="opt-grid">
          <label>${t("opt.fps")}<select data-gif="fps">${[12, 15, 25, 30].map((v) => `<option ${v === 25 ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <label>${t("opt.width")}<select data-gif="width">${[640, 960, 1280, 1920].map((v) => `<option ${v === 960 ? "selected" : ""} value="${v}">${v} px</option>`).join("")}</select></label>
          <label>${t("opt.hold")}<input data-gif="hold" type="number" min="0" max="10" step="0.5" value="1.5" /> s</label>
          <label class="opt-check"><input data-gif="combined" type="checkbox" /> ${t("opt.combined")}</label>
          <label class="opt-check"><input data-gif="loop" type="checkbox" checked /> ${t("opt.loop")}</label>
        </div>
        <p class="opt-note">${gifNote}</p>
        <div class="opt-progress" hidden><div></div></div>
        <div class="opt-actions"><span class="opt-status"></span><button class="opt-primary" data-action="gif" ${exported() || state.gif === false ? "disabled" : ""}>${t("opt.gifButton")}</button></div>`}`;
  }

  function keysTab() {
    return `
      <h2>${t("opt.keys")}</h2>
      <p class="opt-note">${t("opt.keysNote")}</p>
      <div class="opt-keys">
        ${Object.keys(ACTIONS).map((name) => `
          <div class="opt-key-row"><span>${t(`action.${name}`)}</span><div>
            ${settings.shortcuts[name].map((key, k) => `<span class="opt-kbd">${keyLabel(key)}<button data-unbind="${name}:${k}" title="${t("opt.remove")}">×</button></span>`).join("")}
            <button class="opt-add ${state.capture === name ? "listening" : ""}" data-bind="${name}">${state.capture === name ? t("opt.pressKey") : "+"}</button>
          </div></div>`).join("")}
      </div>
      <div class="opt-actions"><span class="opt-status"></span><button data-action="reset-keys">${t("opt.reset")}</button></div>`;
  }

  function penTab() {
    const key = (name) => settings.shortcuts[name].map(keyLabel).join(", ") || "—";
    return `
      <h2>${t("opt.pen")}</h2>
      <div class="opt-help">
        <div><kbd>${key("pen")}</kbd><span>${t("opt.penToggle")}</span></div>
        <div><kbd>${t("opt.leftClick")}</kbd><span>${t("opt.draw")}</span></div>
        <div><kbd>${t("opt.wheel")}</kbd><span>${t("opt.strokeSize")}</span></div>
        <div><kbd>${t("opt.longPress")}</kbd><span>${t("opt.colorWheel")}</span></div>
        <div><kbd>${t("opt.rightClick")}</kbd><span>${t("opt.erase")}</span></div>
        <div><kbd>${key("penUndo")}</kbd><span>${t("opt.undoStroke")}</span></div>
        <div><kbd>${key("penClear")}</kbd><span>${t("opt.clearSlide")}</span></div>
      </div>
      <h3>${t("opt.wheelColors")}</h3>
      <div class="opt-palette">
        ${settings.pen.palette.map((c, k) => `<label class="opt-swatch ${c === settings.pen.color ? "on" : ""}"><input type="color" data-palette="${k}" value="${c}" /></label>`).join("")}
      </div>
      <div class="opt-grid">
        <label>${t("opt.penSize")}<input type="range" data-pen="size" min="2" max="48" value="${settings.pen.size}" /><output>${Math.round(settings.pen.size)} px</output></label>
        <label>${t("opt.eraserSize")}<input type="range" data-pen="eraser" min="12" max="260" value="${settings.pen.eraser}" /><output>${Math.round(settings.pen.eraser)} px</output></label>
      </div>
      <div class="opt-actions">
        <span class="opt-status">${t("opt.strokes", { n: pen.count() })}</span>
        <button data-action="pen-reset">${t("opt.reset")}</button>
        <button data-action="pen-clear">${t("opt.clearThis")}</button>
        <button data-action="pen-clear-all">${t("opt.clearAll")}</button>
      </div>`;
  }

  function lookTab() {
    return `
      <h2>${t("opt.look")}</h2>
      <h3>${t("opt.language")}</h3>
      <div class="opt-segment">
        ${Object.entries(LANGUAGES).map(([code, label]) => `<button data-lang="${code}" class="${lang() === code ? "on" : ""}">${label}</button>`).join("")}
      </div>
      <p class="opt-note">${t("opt.languageNote")}</p>
      <h3>${t("opt.backdrop")}</h3>
      <p class="opt-note">${t("opt.backdropNote")}</p>
      <div class="opt-backdrops">
        ${Object.entries(BACKDROPS).map(([id, value]) => `
          <button data-backdrop="${id}" class="${settings.backdrop === id ? "on" : ""}">
            <span class="opt-preview" style="background: ${value}"><span></span></span>${t(`backdrop.${id}`)}
          </button>`).join("")}
      </div>`;
  }

  // ---------- slide selection ----------

  function renderPicked() {
    body.querySelectorAll(".opt-slide").forEach((b) => b.classList.toggle("on", state.picked.has(Number(b.dataset.slide))));
    const count = body.querySelector(".opt-count");
    if (count) count.textContent = `${state.picked.size} / ${names.length}`;
    body.querySelectorAll("[data-action='html'], [data-action='gif'], [data-action='pdf']").forEach((b) => {
      b.disabled = state.busy || !state.picked.size || (b.dataset.action === "gif" && (exported() || state.gif === false));
    });
  }

  function parseRange(text) {
    const picked = new Set();
    for (const part of text.split(/[,;\s]+/).filter(Boolean)) {
      const [a, b = a] = part.split("-").map(Number);
      for (let i = Math.max(1, Math.min(a, b)); i <= Math.min(names.length, Math.max(a, b)); i++) picked.add(i);
    }
    return picked;
  }

  // ---------- events ----------

  async function onClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    const { tab, format, pick, slide, action, bind, unbind, backdrop } = button.dataset;
    if (tab) (state.tab = tab), (state.capture = null), render();
    else if (format) (state.format = format), render();
    else if (pick) {
      state.picked = pick === "all" ? new Set(names.map((_, i) => i + 1)) : pick === "here" ? new Set([current() + 1]) : new Set();
      renderPicked();
    } else if (slide) {
      const n = Number(slide);
      if (event.shiftKey && state.anchor) {
        const [a, b] = [Math.min(state.anchor, n), Math.max(state.anchor, n)];
        for (let i = a; i <= b; i++) state.picked.add(i);
      } else state.picked.has(n) ? state.picked.delete(n) : state.picked.add(n);
      state.anchor = n;
      renderPicked();
    } else if (bind) (state.capture = state.capture === bind ? null : bind), render();
    else if (unbind) {
      const [name, k] = unbind.split(":");
      settings.shortcuts[name].splice(Number(k), 1);
      saveSettings();
      render();
    } else if (backdrop) {
      settings.backdrop = backdrop;
      saveSettings();
      onBackdrop?.();
      render();
    } else if (button.dataset.lang && button.dataset.lang !== lang()) setLang(button.dataset.lang);
    else if (action === "close") toggle(false);
    else if (action === "html") exportHtmlFile();
    else if (action === "gif") exportGif();
    else if (action === "pdf") exportPdf();
    else if (action === "reset-keys") resetShortcuts(), render();
    else if (action === "pen-reset") resetPen(), render();
    else if (action === "pen-clear") pen.clear(), render();
    else if (action === "pen-clear-all") pen.clear(true), render();
  }

  function onInput(event) {
    const target = event.target;
    if (target.matches(".opt-range")) {
      state.picked = parseRange(target.value);
      renderPicked();
    } else if (target.dataset.palette !== undefined) {
      const k = Number(target.dataset.palette);
      const wasCurrent = settings.pen.palette[k] === settings.pen.color;
      settings.pen.palette = settings.pen.palette.map((c, i) => (i === k ? target.value : c));
      if (wasCurrent) settings.pen.color = target.value;
      saveSettings();
    } else if (target.dataset.pen) {
      settings.pen[target.dataset.pen] = Number(target.value);
      target.nextElementSibling.textContent = `${target.value} px`;
      saveSettings();
    }
  }

  function status(text, warn = false) {
    const node = body.querySelector(".opt-status");
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("warn", warn);
  }

  // ---------- exports ----------

  const selection = () => [...state.picked].sort((a, b) => a - b);

  async function exportHtmlFile() {
    state.busy = true;
    renderPicked();
    try {
      const { exportHtml } = await import("./export.js");
      const { blob, warnings } = await exportHtml({ slides: selection(), onProgress: (text) => status(text) });
      download(blob, `${project}.html`);
      const size = megabytes(blob);
      status(warnings.length ? t("opt.downloadedWarn", { size, n: warnings.length }) : t("opt.downloaded", { size }), warnings.length > 0);
      if (warnings.length) console.warn("HTML export:", warnings);
    } catch (error) {
      status(t("opt.exportFailed", { message: error.message }), true);
    } finally {
      state.busy = false;
      renderPicked();
    }
  }

  async function exportPdf() {
    const perStep = body.querySelector("[data-pdf='steps']").checked;
    state.busy = true;
    renderPicked();
    try {
      toggle(false);
      await printPdf({ picked: selection().map((n) => n - 1), perStep, onProgress: (text) => status(text) });
    } catch (error) {
      toggle(true);
      status(t("opt.failed", { message: error.message }), true);
    } finally {
      state.busy = false;
      renderPicked();
    }
  }

  async function exportGif() {
    const read = (name) => body.querySelector(`[data-gif="${name}"]`);
    const options = {
      slides: selection(),
      fps: Number(read("fps").value),
      width: Number(read("width").value),
      hold: Number(read("hold").value),
      combined: read("combined").checked,
      loop: read("loop").checked,
    };
    state.busy = true;
    renderPicked();
    const bar = body.querySelector(".opt-progress");
    bar.hidden = false;
    const setBar = (f) => (bar.firstElementChild.style.width = `${Math.round(f * 100)}%`);
    setBar(0);
    try {
      const start = await fetch(new URL("__export/gif", base), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(options) });
      if (!start.ok) throw new Error(await start.text());
      const { job } = await start.json();
      for (;;) {
        await new Promise((r) => setTimeout(r, 500));
        const info = await (await fetch(new URL(`__export/status?job=${job}`, base))).json();
        if (info.error) throw new Error(info.error);
        setBar(info.progress);
        status(info.message || t("opt.rendering"));
        if (info.done) break;
      }
      const file = await fetch(new URL(`__export/file?job=${job}`, base));
      if (!file.ok) throw new Error(file.statusText);
      const blob = await file.blob();
      const name = options.combined || options.slides.length === 1 ? `${project}.gif` : `${project}-gif.zip`;
      download(blob, name);
      status(t("opt.downloaded", { size: megabytes(blob) }));
    } catch (error) {
      status(t("opt.failed", { message: error.message }), true);
    } finally {
      state.busy = false;
      renderPicked();
    }
  }

  async function probeGif() {
    if (exported()) return (state.gif = false);
    try {
      const response = await fetch(new URL("__export/ping", base));
      state.gif = response.ok && (await response.json()).gif === true;
    } catch {
      state.gif = false;
    }
    if (state.open && state.tab === "export") render();
  }

  // ---------- opening and keys ----------

  function toggle(on = !state.open) {
    state.open = on;
    state.capture = null;
    root.classList.toggle("open", on);
    if (on) {
      if (!state.picked.size) state.picked = new Set([current() + 1]);
      if (state.gif === null) probeGif();
      render();
    }
  }

  /** Handles keys while the window is open and returns true when the key is consumed. */
  function handleKey(event) {
    if (!state.open) return false;
    if (state.capture) {
      if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return true;
      if (event.key !== "Escape") {
        const key = combo(event);
        for (const list of Object.values(settings.shortcuts)) {
          const at = list.indexOf(key);
          if (at >= 0) list.splice(at, 1);
        }
        settings.shortcuts[state.capture].push(key);
        saveSettings();
      }
      state.capture = null;
      render();
      return true;
    }
    if (event.target.closest?.("input, select")) return event.key === "Escape" ? (event.target.blur(), true) : false;
    if (event.key === "Escape" || actionFor(event) === "options") toggle(false);
    return true;
  }

  return { toggle, handleKey, isOpen: () => state.open };
}

function download(blob, name) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}
