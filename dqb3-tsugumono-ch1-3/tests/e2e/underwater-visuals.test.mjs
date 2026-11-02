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
    rig.setTool("hammer_wood");
    rig.setSubmersion(0);
    const rigTargets = [...rig._tint, ...rig._toolTint];
    const dryColors = rigTargets.map(({ m }) => m.color.getHex());
    rig.setSubmersion(1);
    const wetColors = rigTargets.map(({ m }) => m.color.getHex());

    const fakeWater = {
      waterSurfaceY: () => 4,
      groundYBelow: () => 0,
    };
    const villager = g.spawnVillager("pino", 20, 20, 2.7);
    villager.inWater = true;
    villager.rootSync({ world: fakeWater, cameraYaw: 0 });

    const rat = g.monsters.spawn("field_rat", 20, 2.7, 20);
    rat.inWater = true;
    const ratDry = rat.def.tint;
    rat.updateWaterAppearance(fakeWater);

    const tentacle = g.monsters.spawn("kraken_arm", 21, 2.7, 20);
    tentacle.inWater = true;
    const tentacleDry = tentacle.def.tint;
    tentacle.updateWaterAppearance(fakeWater);

    return {
      waterOpacity: g.chunks.waterMaterial.opacity,
      waterOrder: [...g.chunks.meshes.values()].find((entry) => entry.water)?.water.renderOrder,
      headOrder: rig.head.children[0].renderOrder,
      bodyOrder: rig.body.children[0].renderOrder,
      monsterOrder: rat.sprite.mesh.renderOrder,
      rigTargetCount: rigTargets.length,
      allRigPartsTinted: wetColors.every((color, index) => color !== dryColors[index]),
      villagerSubmersion: villager.rig._submersion,
      ratTinted: rat.sprite.material.color.getHex() !== ratDry,
      tentacleTinted: tentacle.tentacle.material.color.getHex() !== tentacleDry,
    };
  });

  expect(state.waterOpacity >= 0.6 && state.waterOpacity <= 0.7, `readable water opacity (${state.waterOpacity})`);
  expect(state.bodyOrder < state.waterOrder && state.headOrder < state.waterOrder, "humanoid image faces render below water");
  expect(state.monsterOrder < state.waterOrder, "monster images render below water");
  expect(state.rigTargetCount > 8 && state.allRigPartsTinted, "humanoid images, limbs and equipment share the water tint");
  expect(state.villagerSubmersion > 0.9, `villager water tint (${state.villagerSubmersion})`);
  expect(state.ratTinted, "non-humanoid image uses the shared water tint");
  expect(state.tentacleTinted, "3D monster uses the shared water tint");

  console.log("underwater-visuals.test: PASS");
} finally {
  await browser.close();
}
