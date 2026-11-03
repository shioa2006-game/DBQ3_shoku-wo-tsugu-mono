// 通常のブロックと設計図の輪郭には、同じ高さから同じ距離だけ手が届く。
export function cellInReach(cell, playerPos, reach) {
  return Math.hypot(
    cell.x + 0.5 - playerPos.x,
    cell.y + 0.5 - (playerPos.y + 0.6),
    cell.z + 0.5 - playerPos.z,
  ) <= reach;
}

// 設計図の輪郭のうち、カーソルに重なり、プレイヤーの手が届く最前面のマスを返す。
// raycaster の向き、ブロックID、操作距離は呼び出すゲーム側で決める。
export function pickBlueprintCell({ cells, raycaster, world, blocks, playerPos, reach }) {
  const meshes = [];
  for (const cell of cells) {
    if (!cell.ghost.visible) continue;
    const current = world.get(cell.x, cell.y, cell.z);
    if (current !== blocks.AIR && current !== blocks.WATER) continue;
    cell.ghost.userData.cell = cell;
    meshes.push(cell.ghost);
  }

  if (!meshes.length) return null;
  // 輪郭線は子オブジェクト。マス本体だけをカメラに近い順に調べる。
  for (const { object } of raycaster.intersectObjects(meshes, false)) {
    const cell = object.userData.cell;
    if (cellInReach(cell, playerPos, reach)) return cell;
  }
  return null;
}
