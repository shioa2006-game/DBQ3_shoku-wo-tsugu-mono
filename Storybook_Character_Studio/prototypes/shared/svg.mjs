export const path = (d, fill, stroke = 'var(--ink)', w = 1.25, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
export const ellipse = (x, y, rx, ry, fill, stroke = 'var(--ink)', w = 1.2, extra = '') =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
export const line = (d, color = 'var(--ink)', w = 1) => path(d, 'none', color, w);
export const grad = name => `url(#${name})`;
