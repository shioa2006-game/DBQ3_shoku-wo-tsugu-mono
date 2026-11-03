// 第4～5章のモンスター用の描画部品。細長い体・しっぽ・脚を、中心線と太さの列から
// 1本の輪郭（チューブ）として作る。輪郭がつながるので、部品の継ぎ目が出ない。
const f = n => n.toFixed(1);

// Catmull-Rom で中心線をなめらかに補間した点列。
export function spline(points, steps = 8) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(points.at(-1));
  return out;
}
// 中心線（points）と各点の半径（radii）から、閉じた輪郭を作る。両端は丸く閉じる。
export function tube(points, radii, steps = 8) {
  const c = spline(points, steps), r = spline(radii.map((v, i) => [i, v]), steps).map(p => p[1]);
  const left = [], right = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    left.push([p[0] + nx * r[i], p[1] + ny * r[i]]); right.push([p[0] - nx * r[i], p[1] - ny * r[i]]);
  });
  // Round caps: a half circle around each end, bulging away from the tube.
  const cap = (end, toward) => {
    const [cx, cy] = c[end], [ax, ay] = c[toward], rad = Math.max(.4, r[end]);
    const back = Math.atan2(cy - ay, cx - ax), pts = [];
    for (let k = 1; k < 8; k++) { const a = back + Math.PI / 2 - Math.PI * k / 8; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); }
    return pts;
  };
  const last = c.length - 1;
  const outline = [...left, ...cap(last, last - 1), ...right.reverse(), ...cap(0, 1)];
  return `M${outline.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')}Z`;
}
// 溶岩のひび: 範囲内に少しずらした格子点を置き、隣どうしを線でつなぐ網目（輪郭で切り抜いて使う）。
export function crackNet([x0, y0, x1, y1], step, seed = 1, keep = .72) {
  const j = (i, k) => { const v = Math.sin((i * 12.9898 + k * 78.233 + seed) * 43.7) * 43758.5453; return v - Math.floor(v); };
  const pts = [];
  for (let y = y0, r = 0; y <= y1; y += step, r++) for (let x = x0 + (r % 2) * step / 2, c = 0; x <= x1; x += step, c++)
    pts.push({ r, c, x: x + (j(r, c) - .5) * step * .6, y: y + (j(c, r) - .5) * step * .6 });
  const at = (r, c) => pts.find(p => p.r === r && p.c === c);
  let d = '';
  for (const p of pts) for (const [dr, dc] of [[0, 1], [1, 0], [1, -1]]) {
    const q = at(p.r + dr, p.c + dc);
    if (q && j(p.r * 3 + dr, p.c * 5 + dc) < keep) d += `M${f(p.x)} ${f(p.y)} L${f(q.x)} ${f(q.y)}`;
  }
  return d;
}
// 中心線そのもの（模様の線を体に沿わせるため）。
export const spinePath = (points, steps = 8) => `M${spline(points, steps).map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')}`;
// 中心線上の位置（0～1）の点と、そこでの進行方向。
export function along(points, t, steps = 8) {
  const c = spline(points, steps), i = Math.min(c.length - 2, Math.max(0, Math.round(t * (c.length - 1))));
  const [x, y] = c[i], [x2, y2] = c[i + 1];
  return { x, y, dx: x2 - x, dy: y2 - y };
}
