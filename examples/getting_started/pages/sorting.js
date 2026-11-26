import { gsap } from "gsap";
import { pause } from "deck/deck.js";
import { div, label, title } from "deck/components.js";

const VALUES = [5, 2, 7, 1, 6, 3, 4];
const SIZE = 150;
const SLOT = 200;
const Y = 440;
const slotX = (i) => 960 + (i - (VALUES.length - 1) / 2) * SLOT - SIZE / 2;

/** Objects keep their identity: the cards slide to their sorted place instead of being redrawn. */
export default function sorting(root) {
  const heading = title(root, "Objects move, they do not vanish");
  const cards = VALUES.map((value, i) =>
    div(root, "card", {
      x: slotX(i), y: Y, w: SIZE, h: SIZE, html: String(value),
      style: { display: "flex", alignItems: "center", justifyContent: "center", fontSize: "76px" },
    }),
  );
  const rank = VALUES.map((v) => [...VALUES].sort((a, b) => a - b).indexOf(v));
  const before = label(root, "seven cards in any order", 960, 720, 34, "abs muted");
  const after = label(root, "the same seven cards, sorted: the eye follows each one", 960, 720, 34, "abs muted");
  gsap.set(after, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(heading, { opacity: 0, y: -16, duration: 0.7 });
  tl.from(cards, { scale: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.05 }, "<0.2");
  tl.from(before, { opacity: 0, y: 10, duration: 0.6 }, "<0.3");
  pause(tl);

  // Cards moving right pass above, cards moving left pass below, so none overlap.
  tl.addLabel("sort");
  cards.forEach((card, i) => {
    const shift = slotX(rank[i]) - slotX(i);
    tl.to(card, { x: shift, duration: 1.2, ease: "power3.inOut" }, "sort");
    tl.to(card, { keyframes: { y: [0, -Math.sign(shift) * 110, 0] }, duration: 1.2, ease: "sine.inOut" }, "sort");
  });
  tl.to(before, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, "sort");
  tl.fromTo(after, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, immediateRender: false }, "sort+=1");
  pause(tl);
  return tl;
}
