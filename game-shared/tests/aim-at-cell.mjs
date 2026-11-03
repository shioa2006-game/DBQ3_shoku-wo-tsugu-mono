// 描画負荷でカメラの追従時間が変わる。移動が収まってから実マウスを合わせ、
// ゲームの照準が指定マスを捉えるまで現在のカメラで再投影する。
export async function aimAtCell(page, cell, { target = "ghost", allowOverlap = false } = {}) {
  let previous;
  let stable = 0;
  const settleBy = Date.now() + 20_000;
  while (stable < 3) {
    if (Date.now() > settleBy) throw new Error("設計図の照準前にカメラが静止しませんでした");
    const position = await page.evaluate(() => window.__game.camera.position.toArray());
    stable = previous && position.every((v, i) => Math.abs(v - previous[i]) < 0.002) ? stable + 1 : 0;
    previous = position;
    if (stable < 3) await page.waitForTimeout(100);
  }

  const aimBy = Date.now() + 20_000;
  while (Date.now() < aimBy) {
    const point = await page.evaluate(({ x, y, z }) => {
      const g = window.__game;
      const p = g.player.pos.clone().set(x + 0.5, y + 0.7, z + 0.5).project(g.camera);
      return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
    }, cell);
    await page.mouse.move(point.x, point.y);
    const ready = await page.evaluate(({ cell, target, allowOverlap }) => {
      const g = window.__game;
      g.updateAim();
      const hit = target === "block" ? g.aim?.cell : g.aimGhost;
      return !!hit && (allowOverlap || (hit.x === cell.x && hit.y === cell.y && hit.z === cell.z));
    }, { cell, target, allowOverlap });
    if (ready) return point;
    await page.waitForTimeout(100);
  }
  throw new Error(`照準が対象マスに合いませんでした: ${JSON.stringify(cell)} (${target})`);
}
