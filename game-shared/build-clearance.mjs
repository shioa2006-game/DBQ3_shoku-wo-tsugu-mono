// 設計図のマスにブロックを置くとき、そこに立っている住民を近くへよけてもらう。
// 住民は設計図を知らずに歩き回り、持ち場で立ち止まると自分からは動かない。
// 「人や魔物がいる場所には置けません」で住民が動くのを待たせないための、両編共通の処理。

// 体（足元中心の箱）が、置こうとしているマスに掛かるか。各編の placeBlockedByEntity と同じ基準。
export function entityBlocksCell(e, cell, pos = e.pos) {
  return (
    Math.abs(pos.x - (cell.x + 0.5)) < e.halfW + 0.5 &&
    Math.abs(pos.z - (cell.z + 0.5)) < e.halfW + 0.5 &&
    pos.y < cell.y + 1 &&
    pos.y + e.height > cell.y
  );
}

// 置こうとしているマスをふさぐ相手を調べる（副作用なし）。
// 主人公と魔物はよけさせない（hard）。住民はよけてもらえる（villagers）。
// 住民が通り抜けられるブロック（たいまつ・ベッド・扉など）は、住民がいてもそのまま置ける。
export function buildCellBlockers(cell, { player, villagers, monsters, villagersPassThrough = false }) {
  const hard = [player, ...monsters].filter((e) => e && entityBlocksCell(e, cell));
  const blocking = villagersPassThrough ? [] : villagers.filter((v) => entityBlocksCell(v, cell));
  return { hard, villagers: blocking };
}

// 住民のよけ先: 近いマスの中央から順に、体が収まり・足もとに床があり・
// 置くマスに掛からず・危ない場所（水など）でない場所を探す。
// まだ埋まっていない設計図のマスに掛からない場所を優先し、無ければ置くマスだけを避ける。
export function findStepAside(e, cell, { world, reserved = () => false, unsafe = () => false, maxRadius = 4 }) {
  const baseX = Math.floor(e.pos.x);
  const baseZ = Math.floor(e.pos.z);
  const feet = Math.floor(e.pos.y + 0.05);
  const columns = [];
  for (let dx = -maxRadius; dx <= maxRadius; dx += 1) {
    for (let dz = -maxRadius; dz <= maxRadius; dz += 1) {
      const x = baseX + dx + 0.5;
      const z = baseZ + dz + 0.5;
      const d = Math.hypot(x - e.pos.x, z - e.pos.z);
      if (d <= maxRadius + 0.5) columns.push({ x, z, d });
    }
  }
  columns.sort((a, b) => a.d - b.d);
  let fallback = null;
  for (const { x, z } of columns) {
    for (const dy of [0, -1, 1]) {
      const spot = { x, y: feet + dy + 0.001, z };
      if (entityBlocksCell(e, cell, spot)) continue;
      if (e.collides(world, spot.x, spot.y, spot.z)) continue; // 体が収まらない
      if (!e.collides(world, spot.x, spot.y - 0.05, spot.z)) continue; // 足もとに床が無い
      const xi = Math.floor(spot.x);
      const yi = Math.floor(spot.y);
      const zi = Math.floor(spot.z);
      if (unsafe(xi, yi, zi)) continue;
      if (reserved(xi, yi, zi) || reserved(xi, yi + 1, zi)) {
        fallback ??= spot;
        continue;
      }
      return spot;
    }
  }
  return fallback;
}

// よけ先へ移し、歩きかけの目標を捨てる（次の思考で持ち場や徘徊先を選び直す）。
// 小さく跳ねさせて、ぶつかって押し出されたのではなく自分でよけたように見せる
//（倒れている住民は物理を止めているので跳ねさせない）。
export function stepAside(e, spot) {
  e.pos.set(spot.x, spot.y, spot.z);
  e.vel.set(0, e.down ? 0 : 3, 0);
  e.moveTarget = null;
  if ("detour" in e) e.detour = null;
  if ("detourT" in e) e.detourT = 0;
  if ("blockedT" in e) e.blockedT = 0;
  if ("dockRoute" in e) e.dockRoute = null;
}

// 置くマスに立つ住民を全員よけさせる。よけ先が1人でも見つからなければ、誰も動かさずに false。
export function clearVillagersFromCell(villagers, cell, options) {
  const moves = [];
  for (const v of villagers) {
    const spot = findStepAside(v, cell, options);
    if (!spot) return false;
    moves.push([v, spot]);
  }
  for (const [v, spot] of moves) stepAside(v, spot);
  return true;
}
