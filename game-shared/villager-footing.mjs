// 住民が家具（かまど・ちゃぶ台・鉄鍋・炉・金床など、固体の設置物）の上に立たないための、両編共通の処理。
// 住民は行き先へ直進し、ぶつかると高さ1までは跳び乗る。家具の当たり判定は見た目に関係なく
// 1マスの箱なので、跳び乗ると宙に浮いて見える。また、行き先の手前で止まると体の端が
// 隣の家具に掛かったまま上に残る。そこで、
// - 決まった立ち位置は「足もとが床で家具でない」マスの中央に寄せ、中央まで歩き切らせる。
// - 家具には跳び乗らせず、押し付けたら各編の迂回で回り込ませる。
//
// opts: { furniture(id) 家具なら true, unsafe(world, x, y, z) 立たせない場所（水など）なら true }

// (xi, yi, zi) のマスに足を置いて立てるか: 体（2マス）が収まり、足もとが固い床で家具ではない。
export function isStandCell(world, xi, yi, zi, opts) {
  if (world.isSolidAt(xi, yi, zi, "villager") || world.isSolidAt(xi, yi + 1, zi, "villager")) return false;
  if (!world.isSolidAt(xi, yi - 1, zi, "villager")) return false;
  if (opts.furniture(world.get(xi, yi - 1, zi))) return false;
  return !opts.unsafe?.(world, xi, yi, zi);
}

// 列 (xi, zi) で、基準の高さ y に近い順（上下2段まで）に立てる高さを探す。無ければ null。
function standYAt(world, xi, zi, y, opts) {
  const base = Math.floor(y + 0.05);
  for (const dy of [0, -1, 1, -2, 2]) {
    if (isStandCell(world, xi, base + dy, zi, opts)) return base + dy;
  }
  return null;
}

// (x, z) に近い、立てるマスの中央 { x, y, z }（y は足もとの高さ）。半径 maxRadius に無ければ null。
export function findStandCell(world, x, z, y, opts, maxRadius = 3) {
  const bx = Math.floor(x);
  const bz = Math.floor(z);
  const columns = [];
  for (let dx = -maxRadius; dx <= maxRadius; dx += 1) {
    for (let dz = -maxRadius; dz <= maxRadius; dz += 1) {
      const d = Math.hypot(bx + dx + 0.5 - x, bz + dz + 0.5 - z);
      if (d <= maxRadius + 0.5) columns.push({ xi: bx + dx, zi: bz + dz, d });
    }
  }
  columns.sort((a, b) => a.d - b.d);
  for (const { xi, zi } of columns) {
    const yi = standYAt(world, xi, zi, y, opts);
    if (yi != null) return { x: xi + 0.5, y: yi, z: zi + 0.5 };
  }
  return null;
}

// 食事の席の候補: 中心（ちゃぶ台）のまわり radius マス以内で、ちゃぶ台と同じ高さの床に立てるマスを
// 近い順に並べる（切り株や壁の上を席にしない）。たいまつ・ベッドなど通り抜けられる設置物の
// マスは後回しにする（住民が火の中に立って見えないように）。
export function seatsAround(world, center, y, opts, radius = 2) {
  const cx = Math.floor(center.x);
  const cz = Math.floor(center.z);
  const yi = Math.floor(y + 0.05);
  const seats = [];
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dz = -radius; dz <= radius; dz += 1) {
      if (!dx && !dz) continue;
      if (!isStandCell(world, cx + dx, yi, cz + dz, opts)) continue;
      const x = cx + dx + 0.5;
      const z = cz + dz + 0.5;
      const prop = opts.isProp?.(world.get(cx + dx, yi, cz + dz)) ? 1 : 0;
      seats.push({ x, z, prop, d: Math.hypot(x - center.x, z - center.z), a: Math.atan2(dz, dx) });
    }
  }
  seats.sort((p, q) => p.prop - q.prop || p.d - q.d || p.a - q.a);
  return seats.map(({ x, z }) => ({ x, y: yi, z }));
}

// 進む向きのすぐ前（足もとの高さ）に、跳び乗ってはいけない家具があるか。
export function furnitureAhead(world, e, dirX, dirZ, noJump) {
  const len = Math.hypot(dirX, dirZ);
  if (!len) return false;
  const ux = dirX / len;
  const uz = dirZ / len;
  const y = Math.floor(e.pos.y + 0.05);
  const reach = e.halfW + 0.25;
  for (const side of [-1, 0, 1]) {
    const px = e.pos.x + ux * reach - uz * e.halfW * side;
    const pz = e.pos.z + uz * reach + ux * e.halfW * side;
    if (noJump(world.get(Math.floor(px), y, Math.floor(pz)))) return true;
  }
  return false;
}

// 家具の天板へ歩いて渡らないよう、次の位置が家具の上になる向きの速度を止める（毎フレーム、移動の前に呼ぶ）。
// 片方の軸だけなら天板に掛からないときは、その軸へ滑らせる（切り株の上から横へ降りられるように）。
// すでに家具の上にいるときは止めない。2秒以上止まり続けたら、閉じ込められないよう1.5秒だけ渡ってよい。
// 止めたら true（各編はこれを壁に当たったのと同じく迂回の判断に数える）。
export function guardFurnitureTop(world, e, dt, furniture) {
  e.ledgeGraceT = Math.max(0, (e.ledgeGraceT ?? 0) - dt);
  let blocked = false;
  if (e.ledgeGraceT <= 0 && e.onGround && (e.vel.x || e.vel.z)) {
    const over = (x, z) => furnitureUnder(world, e, x, z, furniture);
    const nx = e.pos.x + e.vel.x * dt;
    const nz = e.pos.z + e.vel.z * dt;
    if (!over(e.pos.x, e.pos.z) && over(nx, nz)) {
      blocked = true;
      if (!over(nx, e.pos.z)) e.vel.z = 0;
      else if (!over(e.pos.x, nz)) e.vel.x = 0;
      else {
        e.vel.x = 0;
        e.vel.z = 0;
      }
    }
  }
  e.ledgeT = blocked ? (e.ledgeT ?? 0) + dt : 0;
  if (e.ledgeT > 2) {
    e.ledgeT = 0;
    e.ledgeGraceT = 1.5;
  }
  return blocked;
}

// 体を (x, z) に置いたとき、体のどこかの下（足もとの1段下）に家具があるか。
// 今の位置で調べれば「家具の上に立っているか」、次の位置で調べれば「家具の天板へ渡るか」。
export function furnitureUnder(world, e, x, z, furniture) {
  const y = Math.floor(e.pos.y + 0.05) - 1;
  for (const cx of [Math.floor(x - e.halfW), Math.floor(x + e.halfW)]) {
    for (const cz of [Math.floor(z - e.halfW), Math.floor(z + e.halfW)]) {
      if (furniture(world.get(cx, y, cz))) return true;
    }
  }
  return false;
}
