// Water rendering must treat image sprites and procedural 3D parts consistently.

import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page);
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

    const fakeWater = {
      waterSurfaceY: () => 4,
      groundYBelow: () => 0,
    };
    const belk = g.spawnVillager("belk", 20, 20, 2.7);
    belk.inWater = false;
    belk.rootSync({ world: fakeWater, cameraYaw: 0 });
    const belkDry = belk.rig._submersion;
    belk.inWater = true;
    belk.syncVisual(1 / 60, 0, fakeWater);
    const belkPausedWet = belk.rig._submersion;

    const scorpion = g.monsters.spawn("iron_scorpion", 20, 2.7, 20);
    scorpion.inWater = true;
    scorpion.updateWaterAppearance(fakeWater);
    const scorpionWet = scorpion.sprite.material.color.getHex();

    const tainted = g.monsters.spawn("taint_dorotabo", 21, 2.7, 20);
    const hpBarColors = [];
    tainted.hpBar.traverse((o) => o.material?.color && hpBarColors.push(o.material.color.getHex()));
    tainted.inWater = true;
    tainted.updateWaterAppearance(fakeWater);
    const taintedWet = tainted.sprite.material.color.getHex();
    tainted.inWater = false;
    tainted.updateWaterAppearance(fakeWater);
    const taintedRestored = tainted.sprite.material.color.getHex();
    tainted.inWater = true;
    tainted.flashT = 0.15;
    tainted.updateWaterAppearance(fakeWater);
    const hitWet = tainted.sprite.material.color.getHex();
    tainted.inWater = false;
    tainted.updateWaterAppearance(fakeWater);
    const hitDry = tainted.sprite.material.color.getHex();
    tainted.inWater = true;
    tainted.syncVisual(0, 0, fakeWater);
    const hitPausedWet = tainted.sprite.material.color.getHex();
    const hpBarColorsAfter = [];
    tainted.hpBar.traverse((o) => o.material?.color && hpBarColorsAfter.push(o.material.color.getHex()));

    g.startGromBattle();
    const battle = g.gromBattle;
    const gromSurface = g.world.waterSurfaceY(battle.pos.x, battle.pos.z);
    let gromRangeDry = true;
    for (let x = 26; x <= 38; x += 1) {
      for (let z = 93; z <= 106; z += 1) {
        const surface = g.world.waterSurfaceY(x, z);
        if (surface != null && g.world.terrainSurfaceY(x, z) < surface) gromRangeDry = false;
      }
    }
    const gromOrders = [
      battle.rig.body.mesh.renderOrder,
      ...battle.rig.heads.map((head) => head.sprite.mesh.renderOrder),
      ...battle.rig.heads.flatMap((head) => head.neck.map((segment) => segment.renderOrder)),
      ...battle.rig.tail.map((segment) => segment.renderOrder),
    ];
    battle.rig.setHeadDead(0);

    return {
      waterOpacity: g.chunks.waterMaterial.opacity,
      waterOrder: [...g.chunks.meshes.values()].find((entry) => entry.water)?.water.renderOrder,
      headOrder: rig.head.children[0].renderOrder,
      bodyOrder: rig.body.children[0].renderOrder,
      monsterOrder: scorpion.sprite.mesh.renderOrder,
      rigTargetCount: rigTargets.length,
      toolTargetCount: rig._toolTint.length,
      allRigPartsTinted: wetColors.every((color, index) => color !== dryColors[index]),
      belkDry,
      belkPausedWet,
      scorpionWet,
      scorpionDry: scorpion.def.tint,
      taintedWet,
      taintedDry: tainted.def.tint,
      taintedRestored,
      hitWet,
      hitDry,
      hitPausedWet,
      hpBarUnchanged: hpBarColors.join(",") === hpBarColorsAfter.join(","),
      gromDry: gromSurface == null || battle.pos.y >= gromSurface,
      gromRangeDry,
      gromOrdersBelowWater: gromOrders.every((order) => order < 2),
      gromDeadHeadColor: battle.rig.heads[0].sprite.material.color.getHex(),
    };
  });

  expect(state.waterOpacity === 0.66, `water opacity is 0.66 (${state.waterOpacity})`);
  expect(state.waterOrder === 2, `water render order is 2 (${state.waterOrder})`);
  expect(state.bodyOrder < state.waterOrder && state.headOrder < state.waterOrder, "humanoid image faces render below water");
  expect(state.monsterOrder < state.waterOrder, "monster images render below water");
  expect(state.rigTargetCount > 8 && state.toolTargetCount > 0, "humanoid images, limbs and iron hammer are tint targets");
  expect(state.allRigPartsTinted, "humanoid images, limbs and iron hammer share the water tint");
  expect(state.belkDry === 0 && state.belkPausedWet > 0.9, "villager tint stays synchronized while paused");
  expect(state.scorpionWet !== state.scorpionDry, "standard monster image uses the shared water tint");
  expect(state.taintedWet !== state.taintedDry && state.taintedRestored === state.taintedDry, "monster-specific tint is restored after leaving water");
  expect(state.hitDry === 0xff4040 && state.hitWet !== state.hitDry, "hit flash is preserved and composed with the water tint");
  expect(state.hitPausedWet === state.hitWet, "monster tint stays synchronized while paused");
  expect(state.hpBarUnchanged, "water tint does not affect the monster HP bar");
  expect(state.gromDry && state.gromRangeDry, "Grom and its battle range remain above the water surface");
  expect(state.gromOrdersBelowWater, "Grom body, heads, necks and tail render below water");
  expect(state.gromDeadHeadColor === 0x777777, "Grom's destroyed-head color is preserved");

  console.log("underwater-visuals.test: PASS");
} finally {
  await browser.close();
}
