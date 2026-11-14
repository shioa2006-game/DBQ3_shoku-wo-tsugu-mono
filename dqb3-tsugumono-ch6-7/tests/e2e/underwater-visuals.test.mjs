// 水中の見た目の回帰テスト。画像の面（頭・胴・魔物）と、コードで作った3Dの部品（手足・道具）を
// 同じ決まりで水の色に寄せる。
// - 水面は半透明（0.66）で、人物・魔物の画像はその下の順番で描く
// - 人物の画像・手足・持っている道具は、沈むと同じ水の色になる。会話やメニューで世界が止まっていても追従する
// - 魔物は、色替え（山ねずみ）の色を保ったまま水の色を重ね、水から出れば元へ戻る。被弾の赤も水の色と重なる
// - 三頭魔竜ヴァルガは水の色を付けないので、戦いの場（前庭）に水が無いことと、描く順番が水面より下であることを確かめる

import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const browser = await launchBrowser();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const state = await page.evaluate(() => {
    const g = window.__game;
    const rig = g.player.rig;
    rig.setTool("hammer_iron");
    rig.setSubmersion(0);
    const rigTargets = [...rig._tint, ...rig._toolTint];
    const dryColors = rigTargets.map(({ m }) => m.color.getHex());
    rig.setSubmersion(1);
    const wetColors = rigTargets.map(({ m }) => m.color.getHex());
    rig.setSubmersion(0);
    const backToDry = rigTargets.map(({ m }) => m.color.getHex());

    // 水面が y=4 の浅瀬に見立てた世界（住民・魔物の見た目の同期へ渡す）。
    const fakeWater = {
      waterSurfaceY: () => 4,
      groundYBelow: () => 0,
    };
    // 住民: 桟橋の東の海（浜のすぐ沖）。
    const asagi = g.spawnVillager("asagi", 40.5, 106.5, 2.7);
    asagi.inWater = false;
    asagi.rootSync({ world: fakeWater, cameraYaw: 0 });
    const villagerDry = asagi.rig._submersion;
    asagi.inWater = true;
    asagi.syncVisual(1 / 60, 0, fakeWater);
    const villagerPausedWet = asagi.rig._submersion;

    // 画像そのままの色の魔物（小岩ガニ）。
    const crab = g.monsters.spawn("rock_crab", 42.5, 2.7, 106.5);
    crab.inWater = true;
    crab.updateWaterAppearance(fakeWater);
    const crabWet = crab.sprite.material.color.getHex();

    // 色替えの魔物（山ねずみ）。
    const rat = g.monsters.spawn("mountain_rat", 43.5, 2.7, 106.5);
    const hpBarColors = [];
    rat.hpBar.traverse((o) => o.material?.color && hpBarColors.push(o.material.color.getHex()));
    rat.inWater = true;
    rat.updateWaterAppearance(fakeWater);
    const ratWet = rat.sprite.material.color.getHex();
    rat.inWater = false;
    rat.updateWaterAppearance(fakeWater);
    const ratRestored = rat.sprite.material.color.getHex();
    rat.inWater = true;
    rat.flashT = 0.15;
    rat.updateWaterAppearance(fakeWater);
    const hitWet = rat.sprite.material.color.getHex();
    rat.inWater = false;
    rat.updateWaterAppearance(fakeWater);
    const hitDry = rat.sprite.material.color.getHex();
    rat.inWater = true;
    rat.syncVisual(0, 0, fakeWater);
    const hitPausedWet = rat.sprite.material.color.getHex();
    const hpBarColorsAfter = [];
    rat.hpBar.traverse((o) => o.material?.color && hpBarColorsAfter.push(o.material.color.getHex()));
    const monsterOrder = crab.sprite.mesh.renderOrder;
    g.monsters.remove(crab);
    g.monsters.remove(rat);

    // 三頭魔竜ヴァルガ（最終決戦）。空から来て、前庭へ降りて戦う。
    g.startVaruga("final");
    const battle = g.varuga;
    // 地上で動ける範囲（前庭）と、その上の空を回る範囲に、水が無いこと。
    let arenaDry = true;
    for (let x = 21; x <= 44; x += 1) {
      for (let z = 38; z <= 50; z += 1) {
        const surface = g.world.waterSurfaceY(x, z);
        if (surface != null && g.world.terrainSurfaceY(x, z) < surface) arenaDry = false;
      }
    }
    const startSurface = g.world.waterSurfaceY(battle.pos.x, battle.pos.z);
    const varugaOrders = [
      battle.rig.body.mesh.renderOrder,
      ...battle.rig.heads.map((head) => head.sprite.mesh.renderOrder),
      ...battle.rig.heads.flatMap((head) => head.neck.map((segment) => segment.renderOrder)),
      ...battle.rig.tail.map((segment) => segment.renderOrder),
    ];
    const wingOrders = [];
    for (const wing of battle.rig.wings) wing.mesh.traverse((o) => o.isMesh && wingOrders.push(o.renderOrder));
    // 倒した頭の色は、被弾の色の切り替えが毎フレーム走っても保つ。
    battle.rig.setHeadDead(0);
    battle.rig.setHeadFlash(0, true);
    battle.rig.setHeadFlash(0, false);
    const deadHeadColor = battle.rig.heads[0].sprite.material.color.getHex();
    const result = {
      waterOpacity: g.chunks.waterMaterial.opacity,
      waterOrder: [...g.chunks.meshes.values()].find((entry) => entry.water)?.water.renderOrder,
      headOrder: rig.head.children[0].renderOrder,
      bodyOrder: rig.body.children[0].renderOrder,
      monsterOrder,
      rigTargetCount: rigTargets.length,
      toolTargetCount: rig._toolTint.length,
      allRigPartsTinted: wetColors.every((color, index) => color !== dryColors[index]),
      rigRestored: backToDry.every((color, index) => color === dryColors[index]),
      villagerDry,
      villagerPausedWet,
      crabWet,
      crabDry: crab.def.tint,
      ratWet,
      ratDry: rat.def.tint,
      ratRestored,
      hitWet,
      hitDry,
      hitPausedWet,
      hpBarUnchanged: hpBarColors.join(",") === hpBarColorsAfter.join(","),
      varugaDry: startSurface == null || battle.pos.y >= startSurface,
      arenaDry,
      varugaParts: varugaOrders.length,
      heads: battle.rig.heads.length,
      varugaOrdersBelowWater: varugaOrders.every((order) => order < 2),
      wingParts: wingOrders.length,
      wingOrdersBelowWater: wingOrders.every((order) => order < 2),
      deadHeadColor,
    };
    battle.abort(); // 確かめ終えたら、戦いを決着なしで片づける
    result.cleaned = !battle.active && !g.monsters.monsters.some((m) => m.isDragonHead);
    return result;
  });

  expect(state.waterOpacity === 0.66, `水面の不透明度は 0.66 (${state.waterOpacity})`);
  expect(state.waterOrder === 2, `水面を描く順番は 2 (${state.waterOrder})`);
  expect(state.bodyOrder < state.waterOrder && state.headOrder < state.waterOrder, "人物の画像の面は 水面より下の順番で描く");
  expect(state.monsterOrder < state.waterOrder, "魔物の画像は 水面より下の順番で描く");
  expect(state.rigTargetCount > 8 && state.toolTargetCount > 0, `人物の画像・手足と 鉄のハンマーが 水の色を付ける対象になる (${state.rigTargetCount}・道具${state.toolTargetCount})`);
  expect(state.allRigPartsTinted, "人物の画像・手足・鉄のハンマーは 沈むと同じ水の色になる");
  expect(state.rigRestored, "水から出ると 元の色へ戻る");
  expect(state.villagerDry === 0 && state.villagerPausedWet > 0.9, `世界が止まっていても 住民の水の色は追従する (${state.villagerDry}→${state.villagerPausedWet})`);
  expect(state.crabDry === 0xffffff && state.crabWet !== state.crabDry, "画像そのままの色の魔物（小岩ガニ）も 同じ水の色になる");
  expect(state.ratDry !== 0xffffff && state.ratWet !== state.ratDry && state.ratRestored === state.ratDry, "色替えの魔物（山ねずみ）は 水から出ると元の色へ戻る");
  expect(state.hitDry === 0xff4040 && state.hitWet !== state.hitDry, "被弾の赤は保たれ、水の色と重なる");
  expect(state.hitPausedWet === state.hitWet, "世界が止まっていても 魔物の水の色は追従する");
  expect(state.hpBarUnchanged, "水の色は 魔物のHPバーには付かない");
  expect(state.varugaDry && state.arenaDry, "ヴァルガの現れる空と、戦いの場（前庭）に水は無い");
  expect(state.heads === 3 && state.varugaParts > 20 && state.varugaOrdersBelowWater, `ヴァルガの胴・三つの頭・首・尾は 水面より下の順番で描く (${state.varugaParts}部品)`);
  expect(state.wingParts > 0 && state.wingOrdersBelowWater, `ヴァルガの翼も 水面より下の順番で描く (${state.wingParts}部品)`);
  expect(state.deadHeadColor === 0x777777, "倒した頭の色（灰色）は保たれる");
  expect(state.cleaned, "確かめた後、戦いを片づけられる");
  expect(errors.length === 0, `コンソールエラーゼロ (${JSON.stringify(errors.slice(0, 5))})`);

  console.log("underwater-visuals.test: PASS");
} finally {
  await browser.close();
}
