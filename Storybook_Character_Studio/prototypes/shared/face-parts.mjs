import { path, ellipse, line, grad } from './svg.mjs';

// Canonical eye: nose is on +X. Each view has its own upper/lower eyelid shape.
export const EYE_OPENINGS = {
  front: 'M-6.9 4.9 C-7.4-.4-5.2-8.1-.7-8.3 C3.2-8.5 5.9-4.4 6.1-.6 L6.1 6 Q.5 7-6.1 5.5Z',
  near: 'M-7 4.8 C-7.5-1-4.8-8.2-.2-8.3 C3.8-8.3 6.2-3.8 6.2 .2 L5.9 5.8 Q.2 6.9-6.2 5.4Z',
  far: 'M-6.3 4.7 C-6.7-.8-4.8-7.8-.4-8 C3.3-7.9 5.5-3.8 5.7 .4 L5.6 5.7 Q.4 6.4-5.7 5.2Z',
  side: 'M-6.5 4.6 C-6.8-.8-4.1-7.9 .2-8 C3.7-7.8 5.7-3.4 5.8 .6 L5.5 5.7 Q.2 6.6-5.7 5.2Z',
};

export function eye(x, y, { width = 1, nose = 1, view = 'front', size = .92, irisStroke = '#164378', pupil = '#102a4c', glint = '#42b4e8' } = {}) {
  const opening = EYE_OPENINGS[view];
  // Iris occupies ~7.4 / 13 px of the frontal opening and is shifted 1.8 px
  // toward the nose. It meets the lids; there is no white halo underneath.
  return `<g transform="translate(${x} ${y}) scale(${width*nose*size} ${size})">`
    + path(opening, '#fff8e9', '#aa754c', .45)
    + `<g clip-path="url(#eye-${view})">`
    + path('M-1.9-9 Q1.8-10 5.5-8.3 L5.5 3.8 Q5.2 7.8 1.8 7.8 Q-1.7 7.4-1.9 4Z', grad('iris'), irisStroke, .65)
    + path('M.2-7 Q1.8-8 3.6-6.8 L3.5 3 Q1.9 6 .3 3Z', pupil, 'none')
    + path('M-.4 4.9 Q1.8 6.4 4.1 4.8', 'none', glint, .75)
    + ellipse(.15, -4.4, .9, 1.45, '#e3f4ff', 'none')
    + path('M-8-6 Q0-11 8-5 L8-3 Q0-7-8-3Z', '#3a3345', 'none', 0, 'opacity=".18"')
    + '</g>'
    + line('M-6.8 1 C-6.5-3.9-4.3-8.4-.5-8.4 Q3.9-8.4 5.8-2.7', '#302322', 1.45)
    + line('M-5.8 5.5 Q.3 6.8 5.7 6', '#b67e50', .45) + '</g>';
}

// Small rounded tip and warm underside; three-quarter views can mirror the tip.
export function nose(x, y, facing = 1) {
  return `<g transform="translate(${x} ${y}) scale(${facing} 1)">`
    + path('M-.5-2.1 C1.2-2.3 2.1-.2 1.3 1 Q.2 1.9-1.1 1.1 Q.4 .5-.5-2.1Z', '#f2b379', 'none')
    + line('M1.25-.2 Q1.8 1.4-.8 1.2', '#cf8550', .85)
    + ellipse(-.1, -.8, .55, .7, '#ffe0a9', 'none')
    + '</g>';
}
