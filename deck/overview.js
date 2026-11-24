/**
 * Overview (`g` key): every slide in a grid, in its final state.
 * Arrows to move, Enter or a click to go there, Esc or `g` to close.
 */
import { t } from "./i18n.js";
import { freeze, miniStage } from "./mount.js";

export function createOverview({ slides, numbers, names, current, onPick }) {
  const state = { open: false, built: false, selected: 0 };
  const root = document.createElement("div");
  root.className = "ov-backdrop";
  root.style.display = "none"; // until options.css is loaded
  root.innerHTML = `
    <header class="ov-head"><strong>${t("overview.title")}</strong><span>${t("overview.help", { n: slides.length })}</span></header>
    <div class="ov-grid">
      ${slides.map((_, i) => `<button class="ov-card" data-index="${i}"><div class="ov-thumb"></div><span><b>${numbers[i]}</b>${names[i] || ""}</span></button>`).join("")}
    </div>`;
  document.body.appendChild(root);
  const cards = [...root.querySelectorAll(".ov-card")];

  root.addEventListener("click", (event) => {
    const card = event.target.closest(".ov-card");
    if (card) pick(Number(card.dataset.index));
    else if (event.target === root) toggle(false);
  });

  /** Thumbnails are built once, in small batches so the page does not freeze. */
  function build() {
    state.built = true;
    let i = 0;
    const batch = () => {
      const end = Math.min(i + 3, slides.length);
      for (; i < end; i++) {
        try {
          freeze(slides[i], miniStage(cards[i].querySelector(".ov-thumb")));
        } catch (error) {
          console.warn(`Overview: slide ${numbers[i]}`, error);
        }
      }
      if (i < slides.length) requestAnimationFrame(batch);
    };
    batch();
  }

  function select(index) {
    state.selected = Math.max(0, Math.min(slides.length - 1, index));
    cards.forEach((card, i) => card.classList.toggle("selected", i === state.selected));
    cards[state.selected].scrollIntoView({ block: "nearest" });
  }

  function pick(index) {
    toggle(false);
    onPick(index);
  }

  function toggle(on = !state.open) {
    state.open = on;
    root.classList.toggle("open", on);
    if (!on) return;
    if (!state.built) build();
    cards.forEach((card, i) => card.classList.toggle("current", i === current()));
    select(current());
  }

  function columns() {
    const tops = cards.map((card) => card.offsetTop);
    return Math.max(1, tops.filter((top) => top === tops[0]).length);
  }

  /** Handles keys while the overview is open and returns true when the key is consumed. */
  function handleKey(event, action) {
    if (!state.open) return false;
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns(), ArrowUp: -columns() };
    if (moves[event.key]) select(state.selected + moves[event.key]);
    else if (event.key === "Enter" || event.key === " ") pick(state.selected);
    else if (event.key === "Home") select(0);
    else if (event.key === "End") select(slides.length - 1);
    else if (event.key === "Escape" || action === "overview") toggle(false);
    return true;
  }

  return { toggle, handleKey, isOpen: () => state.open };
}
