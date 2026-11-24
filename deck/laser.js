/**
 * Laser pointer (`l` key): a glowing red dot follows the mouse over the stage.
 * `onMove` receives its position (stage coordinates) for the presenter view.
 */
const W = 1920;
const H = 1080;

export function createLaser(stage, { onMove = () => {} } = {}) {
  const dot = document.createElement("div");
  dot.className = "laser-dot";
  stage.appendChild(dot);
  const state = { active: false };

  function place(x, y, visible) {
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.classList.toggle("on", visible);
  }

  addEventListener("pointermove", (event) => {
    if (!state.active) return;
    const box = stage.getBoundingClientRect();
    const x = ((event.clientX - box.left) * W) / box.width;
    const y = ((event.clientY - box.top) * H) / box.height;
    const inside = x >= 0 && y >= 0 && x <= W && y <= H;
    place(x, y, inside);
    onMove(x, y, inside);
  });
  document.addEventListener("pointerleave", () => {
    if (!state.active) return;
    place(0, 0, false);
    onMove(0, 0, false);
  });

  function toggle(on = !state.active) {
    state.active = on;
    document.body.classList.toggle("laser-on", on);
    if (!on) {
      place(0, 0, false);
      onMove(0, 0, false);
    }
  }

  return {
    toggle,
    active: () => state.active,
    /** Position sent by the other window (presenter ↔ audience). */
    remote: (x, y, visible) => place(x, y, visible),
  };
}
