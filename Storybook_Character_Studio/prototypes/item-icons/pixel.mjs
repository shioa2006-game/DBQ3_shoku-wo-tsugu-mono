// 16×16ドット絵アイコンの描画部品。ブラウザとNode.jsの両方で動く（依存なし）。
// RGBA配列へ直接描き、最後に輪郭線を自動で付ける。

export const ICON_SIZE = 16;

const hex = (value) => {
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw Error(`Invalid color: ${value}`);
  return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
};

export class PixelIcon {
  constructor(size = ICON_SIZE) {
    this.size = size;
    this.data = new Uint8ClampedArray(size * size * 4);
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  px(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inside(x, y)) throw Error(`Pixel out of icon: ${x},${y}`);
    const i = (y * this.size + x) * 4;
    const [r, g, b] = hex(color);
    this.data.set([r, g, b, 255], i);
  }

  opaque(x, y) {
    return this.inside(x, y) && this.data[(y * this.size + x) * 4 + 3] > 0;
  }

  rect(x, y, w, h, color) {
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) this.px(x + i, y + j, color);
  }

  // 1文字1画素の文字列で描く。'.' は透明。palette は文字→色。
  grid(rows, palette, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const color = palette[ch];
        if (!color) throw Error(`Unknown palette key "${ch}" at ${x},${y}`);
        this.px(ox + x, oy + y, color);
      });
    });
  }

  // 太さを変えられる直線（rは半径、端点ごとに指定）。
  stroke(x0, y0, x1, y1, r0, r1, color) {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3));
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const cx = x0 + (x1 - x0) * t;
      const cy = y0 + (y1 - y0) * t;
      const r = r0 + (r1 - r0) * t;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
          if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.05) this.px(x, y, color);
        }
      }
    }
  }

  ellipse(cx, cy, rx, ry, color) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.02) this.px(x, y, color);
      }
    }
  }

  // 多角形の塗り（画素の中心が内側なら塗る）。points: [[x, y], ...]
  polygon(points, color) {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y += 1) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x += 1) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
          const [xi, yi] = points[i], [xj, yj] = points[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.px(x, y, color);
      }
    }
  }

  // 1画素幅の線（ブレゼンハム）。
  line(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // 絵の外側に1画素の輪郭線を付ける。絵は四辺から1画素あける。
  // 外から届かない囲まれた隙間（柵の横木の間など）は透明のまま残す。
  outline(color) {
    const n = this.size;
    for (let i = 0; i < n; i += 1) {
      for (const [x, y] of [[i, 0], [i, n - 1], [0, i], [n - 1, i]]) {
        if (this.opaque(x, y)) throw Error(`Drawing touches the icon edge at ${x},${y}; leave room for the outline`);
      }
    }
    const outside = new Uint8Array(n * n);
    const queue = [[0, 0]];
    outside[0] = 1;
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!this.inside(nx, ny) || outside[ny * n + nx] || this.opaque(nx, ny)) continue;
        outside[ny * n + nx] = 1;
        queue.push([nx, ny]);
      }
    }
    const edge = [];
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (!outside[y * n + x]) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.opaque(x + dx, y + dy))) edge.push([x, y]);
      }
    }
    for (const [x, y] of edge) this.px(x, y, color);
  }
}
