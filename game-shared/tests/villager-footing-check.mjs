// 住民が家具（固体の設置物）の上に立たないことを、両編の e2e テストから確かめる。
// game-shared/villager-footing.mjs と各編の villagers.js の組み合わせを、実際のゲームで検査する。
// 描画ループに頼らず、ゲームと同じ文脈（villagerContext）で住民を1フレームずつ進める。

// furnitureIds: 家具のブロックID（各編の blocks.js から、prop かつ solid === true のもの）。
export function furnitureIdsOf(BLOCK_DEFS) {
  return Object.entries(BLOCK_DEFS)
    .filter(([, d]) => d?.prop && d.solid === true)
    .map(([id]) => Number(id));
}

// ids の住民を starts（{ id: [x, z] }）に置き、seconds 秒ぶん進める。meal なら食事の場面にする。
// 返り値: 住民ごとの { pos, onFurniture（最後に家具の上か）, furnitureFrames（家具の上にいたフレーム数）,
//   post（持ち場の寄せ先）, seat（食事の席）, atPost, atSeat }。
export async function stepVillagers(page, { ids, seconds, starts = {}, meal = false, furnitureIds }) {
  return page.evaluate(({ ids, seconds, starts, meal, furnitureIds }) => {
    const g = window.__game;
    const furniture = new Set(furnitureIds);
    const onFurniture = (v) => {
      const y = Math.floor(v.pos.y + 0.05) - 1;
      for (const x of [Math.floor(v.pos.x - v.halfW), Math.floor(v.pos.x + v.halfW)]) {
        for (const z of [Math.floor(v.pos.z - v.halfW), Math.floor(v.pos.z + v.halfW)]) {
          if (furniture.has(g.world.get(x, y, z))) return true;
        }
      }
      return false;
    };
    const vs = ids.map((id) => g.villager(id)).filter(Boolean);
    for (const v of vs) {
      const s = starts[v.id];
      if (s) v.pos.set(s[0], g.world.terrainSurfaceY(s[0], s[1]) + 0.001, s[1]);
      v.vel.set(0, 0, 0);
      v.moveTarget = null;
      v.mealSeat = null;
      v.postCache = null;
      v.detourT = 0;
      v.talkPause = 0;
      v.thinkTimer = 99; // 徘徊先の抽選を止め、持ち場・席への移動だけを見る
    }
    // 食事の場面かどうかを固定する（持ち場を見るときに、章の進行で始まった食事が続いていないように）。
    const mealTimer = g.cooking.mealTimer;
    g.cooking.mealTimer = meal ? seconds + 60 : 0;
    const ctx = g.villagerContext(0);
    const frames = Object.fromEntries(vs.map((v) => [v.id, 0]));
    for (let f = 0; f < seconds * 60; f += 1) {
      for (const v of vs) {
        v.update(1 / 60, ctx);
        if (v.onGround && onFurniture(v)) frames[v.id] += 1;
      }
    }
    g.cooking.mealTimer = meal ? 0 : mealTimer;
    const near = (v, p) => !!p && Math.hypot(v.pos.x - p.x, v.pos.z - p.z) < 0.2;
    return Object.fromEntries(vs.map((v) => [v.id, {
      pos: [v.pos.x, v.pos.y, v.pos.z].map((n) => +n.toFixed(2)),
      onFurniture: onFurniture(v),
      furnitureFrames: frames[v.id],
      post: v.postCache?.cell ? [v.postCache.cell.x, v.postCache.cell.y, v.postCache.cell.z] : null,
      seat: v.mealSeat ? [v.mealSeat.x, v.mealSeat.y, v.mealSeat.z] : null,
      atPost: near(v, v.postCache?.cell),
      atSeat: near(v, v.mealSeat),
    }]));
  }, { ids, seconds, starts, meal, furnitureIds });
}

// 食事の結果の検査（両編共通）: 全員が別々の席の床に着き、家具の上にいない。
export function mealSummary(result) {
  const list = Object.entries(result);
  const seats = list.map(([, r]) => r.seat && r.seat.join(","));
  return {
    allSeated: list.every(([, r]) => r.atSeat && !r.onFurniture),
    distinct: new Set(seats).size === seats.length && seats.every(Boolean),
    maxFurnitureFrames: Math.max(0, ...list.map(([, r]) => r.furnitureFrames)),
    detail: Object.fromEntries(list.map(([id, r]) => [id, `${r.pos.join(",")} seat=${r.seat?.join(",")} frames=${r.furnitureFrames}`])),
  };
}
