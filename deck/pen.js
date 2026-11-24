/**
 * Pen for remote teaching (`p` key): write over the slide, with no menu on screen.
 * Left click: draw · wheel: size · long press: colour wheel ·
 * right click: erase (wheel while right-clicking: eraser size).
 * Strokes are kept per slide, as vectors (redrawn on every slide change).
 */
import { settings, saveSettings } from "./ui.js";

const W = 1920;
const H = 1080;
const RATIO = 2;
const HOLD_MS = 450;
const HOLD_TOLERANCE = 6;
const WHEEL = { inner: 38, outer: 118 };
const LIMITS = { size: [2, 48], eraser: [12, 260] };

export function createPen(stage) {
  const canvas = document.createElement("canvas");
  canvas.className = "pen-layer";
  canvas.width = W * RATIO;
  canvas.height = H * RATIO;
  stage.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(RATIO, RATIO);

  const cursor = document.createElement("div");
  cursor.className = "pen-cursor";
  stage.appendChild(cursor);
  const wheel = buildWheel();
  document.body.appendChild(wheel.node);

  const state = { active: false, index: 0, stroke: null, hold: null, start: null, last: null, wheelOpen: false, erasing: false };
  const drawings = new Map();
  const strokes = () => {
    if (!drawings.has(state.index)) drawings.set(state.index, []);
    return drawings.get(state.index);
  };

  // ---------- drawing ----------

  function point(event) {
    const box = stage.getBoundingClientRect();
    return [((event.clientX - box.left) * W) / box.width, ((event.clientY - box.top) * H) / box.height];
  }

  function style(stroke) {
    ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  /** Smoothed segment: a curve between the midpoints of successive points. */
  function segment(points, i) {
    const [a, b, c] = [points[i - 2] ?? points[i - 1], points[i - 1], points[i]];
    ctx.beginPath();
    ctx.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ctx.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
    ctx.stroke();
  }

  function dot(stroke) {
    const [x, y] = stroke.points[0];
    ctx.beginPath();
    ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function paint(stroke) {
    style(stroke);
    if (stroke.points.length === 1) return dot(stroke);
    for (let i = 1; i < stroke.points.length; i++) segment(stroke.points, i);
    // Finish the stroke up to the last point.
    const [b, c] = stroke.points.slice(-2);
    ctx.beginPath();
    ctx.moveTo((b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
    ctx.lineTo(c[0], c[1]);
    ctx.stroke();
  }

  function redraw() {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    strokes().forEach(paint);
  }

  function begin(event, erase) {
    const p = point(event);
    state.stroke = { erase, color: settings.pen.color, size: erase ? settings.pen.eraser : settings.pen.size, points: [p], drawn: false };
    state.start = p;
  }

  function extend(event) {
    const stroke = state.stroke;
    const p = point(event);
    const last = stroke.points.at(-1);
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) return;
    stroke.points.push(p);
    if (!stroke.drawn) {
      // The stroke only starts once the mouse moves, so a long press is still possible.
      if (!stroke.erase && Math.hypot(p[0] - state.start[0], p[1] - state.start[1]) < HOLD_TOLERANCE) return;
      stroke.drawn = true;
      cancelHold();
      strokes().push(stroke);
      style(stroke);
      for (let i = 1; i < stroke.points.length; i++) segment(stroke.points, i);
      return;
    }
    style(stroke);
    segment(stroke.points, stroke.points.length - 1);
  }

  function finish() {
    const stroke = state.stroke;
    state.stroke = null;
    cancelHold();
    if (!stroke) return;
    if (!stroke.drawn) {
      strokes().push(stroke);
      stroke.drawn = true;
    }
    redraw();
  }

  // ---------- long press: colour wheel ----------

  function cancelHold() {
    clearTimeout(state.hold);
    state.hold = null;
  }

  function openWheel(event) {
    state.stroke = null;
    state.wheelOpen = true;
    wheel.open(event.clientX, event.clientY, settings.pen);
  }

  function closeWheel(event) {
    state.wheelOpen = false;
    const color = wheel.close(event?.clientX, event?.clientY);
    if (color) {
      settings.pen.color = color;
      saveSettings();
      updateCursor();
    }
  }

  // ---------- cursor (stroke or eraser size) ----------

  let lastEvent = null;
  function updateCursor(event = lastEvent) {
    if (!event) return;
    lastEvent = event;
    const [x, y] = point(event);
    // Ring at the stroke size, never smaller than 14 px so it stays visible.
    const size = Math.max(14, state.erasing ? settings.pen.eraser : settings.pen.size);
    Object.assign(cursor.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderColor: state.erasing ? "rgba(27, 42, 74, 0.7)" : settings.pen.color,
      color: state.erasing ? "rgba(27, 42, 74, 0.7)" : settings.pen.color,
    });
    cursor.classList.toggle("erasing", state.erasing);
  }

  function showSize() {
    cursor.dataset.size = `${Math.round(state.erasing ? settings.pen.eraser : settings.pen.size)} px`;
    cursor.classList.add("sizing");
    clearTimeout(showSize.timer);
    showSize.timer = setTimeout(() => cursor.classList.remove("sizing"), 700);
  }

  // ---------- events ----------

  canvas.addEventListener("pointerdown", (event) => {
    if (!state.active || state.wheelOpen) return;
    canvas.setPointerCapture(event.pointerId);
    if (event.button === 2) {
      state.erasing = true;
      begin(event, true);
      state.stroke.drawn = true;
      strokes().push(state.stroke);
      style(state.stroke);
      dot(state.stroke);
    } else if (event.button === 0) {
      begin(event, false);
      state.hold = setTimeout(() => openWheel(event), HOLD_MS);
    }
    updateCursor(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.active) return;
    if (state.wheelOpen) return wheel.hover(event.clientX, event.clientY);
    updateCursor(event);
    if (state.stroke) extend(event);
  });

  const release = (event) => {
    if (state.wheelOpen) return closeWheel(event);
    finish();
    state.erasing = false;
    updateCursor(event);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", () => cursor.classList.add("hidden"));
  canvas.addEventListener("pointerenter", () => cursor.classList.remove("hidden"));
  canvas.addEventListener("contextmenu", (event) => state.active && event.preventDefault());

  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!state.active) return;
      event.preventDefault();
      const key = state.erasing || event.shiftKey ? "eraser" : "size";
      const [min, max] = LIMITS[key];
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      settings.pen[key] = Math.min(max, Math.max(min, settings.pen[key] * factor));
      if (state.stroke) state.stroke.size = settings.pen[state.stroke.erase ? "eraser" : "size"];
      saveSettings();
      const wasErasing = state.erasing;
      state.erasing = key === "eraser";
      updateCursor(event);
      showSize();
      state.erasing = wasErasing;
    },
    { passive: false },
  );

  function toggle(on = !state.active) {
    state.active = on;
    canvas.classList.toggle("active", on);
    cursor.classList.toggle("on", on);
    if (!on) {
      cancelHold();
      if (state.wheelOpen) closeWheel();
      state.stroke = null;
    }
  }

  return {
    toggle,
    active: () => state.active,
    /** Slide change: each slide's strokes are kept. */
    setSlide(index) {
      if (index === state.index) return;
      finish();
      state.index = index;
      redraw();
    },
    undo() {
      strokes().pop();
      redraw();
    },
    clear(all = false) {
      if (all) drawings.clear();
      else drawings.set(state.index, []);
      redraw();
    },
    count: () => [...drawings.values()].reduce((n, list) => n + list.length, 0),
  };
}

/** Colour wheel: sectors around the pointer, picked by releasing over one. */
function buildWheel() {
  const node = document.createElement("div");
  node.className = "pen-wheel";
  let colors = [];
  let hovered = -1;
  let center = [0, 0];

  function render(pen) {
    colors = pen.palette;
    const n = colors.length;
    const { inner, outer } = WHEEL;
    const size = outer * 2 + 8;
    const c = size / 2;
    const arc = (k) => {
      const a0 = (k / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((k + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const p = (r, a) => `${c + r * Math.cos(a)} ${c + r * Math.sin(a)}`;
      return `M${p(inner, a0)} L${p(outer, a0)} A${outer} ${outer} 0 0 1 ${p(outer, a1)} L${p(inner, a1)} A${inner} ${inner} 0 0 0 ${p(inner, a0)} Z`;
    };
    node.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${colors.map((color, k) => `<path data-k="${k}" d="${arc(k)}" style="fill: ${color}"/>`).join("")}
      <circle cx="${c}" cy="${c}" r="${inner - 8}" class="pen-wheel-center" style="fill: ${pen.color}"/>
    </svg>`;
    node.style.width = node.style.height = `${size}px`;
  }

  return {
    node,
    open(x, y, pen) {
      render(pen);
      center = [x, y];
      hovered = -1;
      Object.assign(node.style, { left: `${x}px`, top: `${y}px` });
      node.classList.add("open");
    },
    hover(x, y) {
      const [dx, dy] = [x - center[0], y - center[1]];
      const r = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      hovered = r < WHEEL.inner * 0.8 ? -1 : Math.floor((angle / (Math.PI * 2)) * colors.length);
      node.querySelectorAll("path").forEach((p) => p.classList.toggle("hover", Number(p.dataset.k) === hovered));
      const middle = node.querySelector(".pen-wheel-center");
      if (hovered >= 0) middle.style.fill = colors[hovered];
    },
    close(x, y) {
      if (x !== undefined) this.hover(x, y);
      node.classList.remove("open");
      return hovered >= 0 ? colors[hovered] : null;
    },
  };
}
