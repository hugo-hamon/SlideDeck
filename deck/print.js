/**
 * PDF export through the browser's print dialog: each step (or each slide, in its final
 * state) becomes a 1920×1080 page. The output stays vector: text and formulas can be
 * selected in the PDF. Choose "Save as PDF" in the print dialog.
 */
import { t } from "./i18n.js";
import { freeze, mountSlide } from "./mount.js";

/**
 * @param picked indices (from 0) of the slides to print
 * @param perStep one page per step (otherwise one page per slide, final state)
 */
export async function printSlides({ slides, numbers, footer, picked, perStep, onProgress = () => {} }) {
  document.querySelector(".print-root")?.remove();
  const root = document.createElement("div");
  root.className = "print-root";
  document.body.appendChild(root);
  let pages = 0;
  for (const [n, index] of picked.entries()) {
    onProgress(t("print.preparing", { slide: numbers[index], n: n + 1, total: picked.length }));
    const count = perStep ? countSteps(slides[index]) : 1;
    for (let step = 0; step < count; step++) {
      const page = document.createElement("div");
      page.className = "stage print-page";
      root.appendChild(page);
      freeze(slides[index], page, perStep ? step : -1, footer ? { items: footer, number: numbers[index] } : null);
      pages++;
    }
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  await document.fonts.ready;
  await new Promise((resolve) => setTimeout(resolve, 150));
  document.body.classList.add("printing");
  const cleanup = () => {
    document.body.classList.remove("printing");
    root.remove();
    removeEventListener("afterprint", cleanup);
  };
  addEventListener("afterprint", cleanup);
  onProgress(t("print.ready", { n: pages }));
  window.print();
  return pages;
}

function countSteps(slide) {
  const scratch = document.createElement("div");
  scratch.className = "stage mini";
  scratch.style.visibility = "hidden";
  document.body.appendChild(scratch);
  const { tl, stops } = mountSlide(slide, scratch);
  tl.kill();
  scratch.remove();
  return stops.length;
}
