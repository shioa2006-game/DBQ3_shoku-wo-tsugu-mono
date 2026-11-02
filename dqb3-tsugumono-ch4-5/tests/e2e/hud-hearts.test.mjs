// HP changes must not change the heart glyph metrics or shift the HUD row.

import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page);
  await newGame(page);

  const state = await page.evaluate(() => {
    const g = window.__game;
    const measure = (hp) => {
      g.ui.setHp(hp, 12);
      const hearts = [...document.querySelectorAll(".hearts .heart")];
      const rects = hearts.map((heart) => heart.getBoundingClientRect());
      return {
        classes: hearts.map((heart) => heart.classList[1]),
        texts: hearts.map((heart) => heart.textContent),
        colors: hearts.map((heart) => getComputedStyle(heart).color),
        overlay: hearts.map(heart => ({color:getComputedStyle(heart,"::after").color,clip:getComputedStyle(heart,"::after").clipPath})),
        rects: rects.map((rect) => ({ left: rect.left, width: rect.width, height: rect.height })),
        gaps: rects.slice(1).map((rect, i) => rect.left - rects[i].right),
      };
    };

    const mixed = measure(6);
    const changed = measure(10);
    return { mixed, changed };
  });

  expect(state.mixed.classes.join(",") === "full,partial,empty", "full / partial / empty states are represented together");
  expect(new Set(state.mixed.texts).size === 1, "all HP states use the same heart glyph");
  expect(
    [...state.mixed.texts[0]].map((c) => c.codePointAt(0)).join(",") === "10084,65038",
    "heart uses the text-presentation variation selector",
  );
  expect(
    state.mixed.rects.every(({ width, height }) => width === 24 && height === 24),
    "every heart has a fixed 24px square",
  );
  expect(state.mixed.gaps.every((gap) => gap === 3), "heart spacing is fixed at 3px");
  expect(
    state.mixed.colors.join(",") === "rgb(247, 251, 255),rgb(40, 37, 54),rgb(40, 37, 54)",
    "full heart and partial/empty backgrounds use the intended colors",
  );
  expect(state.mixed.overlay[1].color === "rgb(247, 251, 255)" && state.mixed.overlay[1].clip === "inset(0px 50% 0px 0px)", "partial heart actually renders a white half-fill overlay");
  expect(state.mixed.rects[0].left === state.changed.rects[0].left, "HP changes do not shift the heart row");
  expect(state.changed.rects.every(({ width, height }) => width === 24 && height === 24), "heart metrics stay fixed after HP changes");

  console.log("hud-hearts.test: PASS");
} finally {
  await browser.close();
}
