/**
 * Presenter view (`s` key): a second window with the current slide, the next one, the
 * (editable) notes, a timer and the clock. Both windows stay in sync in both directions
 * (navigation, laser pointer) through postMessage, which also works with an exported page
 * opened from disk.
 */
import { t } from "./i18n.js";
import { freeze, miniStage } from "./mount.js";

const PING_MS = 1500;
const BAR = 76;
const FONT_KEY = "deck-presenter-font";
const isPresenter = () => new URLSearchParams(location.search).has("presenter");

export function createPresenter({ slides, numbers, names, notes, footer, apply, onLaser }) {
  const peers = new Set();
  const role = isPresenter() ? "presenter" : "audience";
  let view = null;

  addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object" || !data.deck) return;
    if (data.deck === "hello" && role === "audience") {
      peers.add(event.source);
      event.source.postMessage({ deck: "state", ...apply.current() }, "*");
    } else if (data.deck === "goto" || data.deck === "state") apply.to(data.index, data.step, data.animate);
    else if (data.deck === "laser") onLaser(data.x, data.y, data.visible);
  });

  function post(message) {
    if (role === "presenter") {
      try {
        window.opener?.postMessage(message, "*");
      } catch {}
      return;
    }
    for (const peer of peers) {
      try {
        if (peer.closed) peers.delete(peer);
        else peer.postMessage(message, "*");
      } catch {
        peers.delete(peer);
      }
    }
  }

  if (role === "presenter") {
    view = buildView({ slides, numbers, names, notes, footer });
    // Regular announcement: the audience window may have been reloaded in the meantime.
    const hello = () => window.opener && !window.opener.closed && post({ deck: "hello" });
    hello();
    setInterval(hello, PING_MS);
  }

  return {
    role,
    /** Opens the presenter window from the audience window. */
    open() {
      if (role === "presenter") return;
      const url = new URL(location.href);
      url.searchParams.set("presenter", "");
      const win = window.open(url, "deck-presenter", "popup,width=1440,height=900");
      if (win) peers.add(win);
      else alert(t("presenter.blocked"));
    },
    /** Local navigation: the other window follows. */
    notify(index, step, animate, count) {
      post({ deck: role === "presenter" ? "goto" : "state", index, step, animate });
      view?.update(index, step, count);
    },
    /** Updates the interface without notifying the other window (received navigation). */
    refresh: (index, step, count) => view?.update(index, step, count),
    laser: (x, y, visible) => post({ deck: "laser", x, y, visible }),
    /** Stage area in the window (null: the whole window). */
    area: () => (view ? view.area() : null),
  };
}

/** Presenter window interface, around the main stage. */
function buildView({ slides, numbers, names, notes, footer }) {
  document.body.classList.add("presenter");
  document.documentElement.style.setProperty("--backdrop", "#15181e");
  document.title = `${t("presenter.title")} · ${document.title}`;
  const panel = document.createElement("aside");
  panel.className = "pr-panel";
  panel.style.display = "none"; // until options.css is loaded
  panel.innerHTML = `
    <section class="pr-next"><h3>${t("presenter.next")} <span class="pr-next-label"></span></h3><div class="pr-thumb"></div><p class="pr-end" hidden>${t("presenter.end")}</p></section>
    <section class="pr-notes">
      <h3>${t("presenter.notes")} <span class="pr-status"></span>
        <span class="pr-tools"><button data-font="-1" title="${t("presenter.smaller")}">A−</button><button data-font="1" title="${t("presenter.larger")}">A+</button></span></h3>
      <textarea spellcheck="true" placeholder="${t("presenter.notesPlaceholder")}"></textarea>
    </section>`;
  const bar = document.createElement("footer");
  bar.className = "pr-bar";
  bar.style.display = "none";
  bar.innerHTML = `
    <div class="pr-where"><b class="pr-slide"></b><span class="pr-step"></span><span class="pr-name"></span></div>
    <div class="pr-progress"><div></div></div>
    <div class="pr-timer"><button data-timer="toggle" title="${t("presenter.startPause")}">▶</button><span class="pr-elapsed">0:00</span><button data-timer="reset" title="${t("presenter.reset")}">↺</button></div>
    <div class="pr-clock"></div>`;
  document.body.append(panel, bar);

  const thumb = miniStage(panel.querySelector(".pr-thumb"));
  const textarea = panel.querySelector("textarea");
  const status = panel.querySelector(".pr-status");
  const state = { index: 0, step: 0, started: null, elapsed: 0, running: false };
  let font = 26;
  try {
    font = Number(localStorage.getItem(FONT_KEY)) || 26;
  } catch {}
  textarea.style.fontSize = `${font}px`;

  textarea.addEventListener("input", () => notes.set(state.index, textarea.value, (text) => (status.textContent = text)));
  textarea.addEventListener("keydown", (event) => event.key === "Escape" && textarea.blur());
  notes.onLoad(() => document.activeElement !== textarea && (textarea.value = notes.get(state.index)));

  panel.addEventListener("click", (event) => {
    const step = Number(event.target.closest("[data-font]")?.dataset.font);
    if (!step) return;
    font = Math.min(48, Math.max(16, font + 2 * step));
    textarea.style.fontSize = `${font}px`;
    try {
      localStorage.setItem(FONT_KEY, font);
    } catch {}
  });

  // Timer: starts at the first step forward, or with the button.
  const elapsed = () => state.elapsed + (state.running ? Date.now() - state.started : 0);
  const format = (ms) => {
    const s = Math.floor(ms / 1000);
    const [h, m, sec] = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60];
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
  };
  function setRunning(on) {
    if (on === state.running) return;
    if (on) state.started = Date.now();
    else state.elapsed = elapsed();
    state.running = on;
    bar.querySelector("[data-timer='toggle']").textContent = on ? "❚❚" : "▶";
  }
  bar.addEventListener("click", (event) => {
    const action = event.target.closest("[data-timer]")?.dataset.timer;
    if (action === "toggle") setRunning(!state.running);
    if (action === "reset") {
      state.elapsed = 0;
      state.started = Date.now();
    }
  });
  const tick = () => {
    bar.querySelector(".pr-elapsed").textContent = format(elapsed());
    bar.querySelector(".pr-clock").textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 500);

  let first = true;
  return {
    area: () => ({ x: 20, y: 20, w: Math.round(innerWidth * 0.64) - 30, h: innerHeight - BAR - 30 }),
    update(index, step, count) {
      if (!first && (index > state.index || step > state.step) && !state.running && state.elapsed === 0) setRunning(true);
      first = false;
      const changed = index !== state.index || !textarea.value;
      Object.assign(state, { index, step });
      bar.querySelector(".pr-slide").textContent = `${numbers[index]} / ${numbers.at(-1)}`;
      bar.querySelector(".pr-step").textContent = t("presenter.step", { step: step + 1, steps: count });
      bar.querySelector(".pr-name").textContent = names[index] ? `${names[index]}()` : "";
      bar.querySelector(".pr-progress div").style.width = `${((index + (step + 1) / count) / slides.length) * 100}%`;
      if (changed && document.activeElement !== textarea) textarea.value = notes.get(index);
      status.textContent = "";

      // Next: the next step of the same slide, or the first step of the next slide.
      const [ni, ns] = step + 1 < count ? [index, step + 1] : [index + 1, 0];
      const end = ni >= slides.length;
      panel.querySelector(".pr-end").hidden = !end;
      panel.querySelector(".pr-thumb").hidden = end;
      panel.querySelector(".pr-next-label").textContent = end ? "" : ni === index ? t("presenter.nextStep", { step: ns + 1 }) : t("presenter.nextSlide", { slide: numbers[ni] });
      if (!end) freeze(slides[ni], thumb, ns, footer ? { items: footer, number: numbers[ni] } : null);
    },
  };
}
