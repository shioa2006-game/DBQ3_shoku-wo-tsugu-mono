// Renewed placed objects come from src/world/prop-models.js (exported from
// Storybook_Character_Studio/prototypes/props-3d/): each one builds in the real
// PropRenderer with black outlines, block-pattern textures and the parts the
// renderer animates (door hinge, flames, banner flag, crop sway), fences join
// their neighbours, and there are no console errors.

import { B } from "../../src/world/blocks.js";
import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const RENEWED = [
  "SCARECROW", "TORCH", "BED", "TORII", "DOOR", "WORKBENCH", "ALTAR", "SPIKES",
  "FENCE", "CHEST", "KAMADO", "TABLE", "HELM", "BANNER", "CROP1", "CROP2", "CROP3", "BUSH", "MUSHROOM",
  "MINE_LAMP", "KILN", "FORGE", "ANVIL", "TROUGH", "IRON_POT", "TAINT_STONE", "INCENSE_PLANT", "PRAYER_PILLAR",
  "FISH_SPOT",
].filter((n) => B[n] !== undefined);
const REQUIRED = {
  TORCH: { name: "flame", flag: "torch" }, DOOR: { name: "hinge", flag: "door" }, ALTAR: { name: "orb" },
  KAMADO: { name: "flame", flag: "torch" }, BANNER: { name: "flag", flag: "banner" },
  CROP1: { flag: "sway" }, CROP2: { flag: "sway" }, CROP3: { flag: "sway" },
  MINE_LAMP: { name: "flame", flag: "torch" }, KILN: { name: "flame", flag: "torch" }, FORGE: { name: "flame", flag: "torch" },
  IRON_POT: { name: "flame", flag: "torch" }, TAINT_STONE: { name: "flame", flag: "torch" },
  INCENSE_PLANT: { flag: "sway" }, PRAYER_PILLAR: { name: "orb" }, FISH_SPOT: { flag: "sway" },
};
// Thin plants are drawn without outlines on purpose.
const NO_OUTLINE = new Set(["CROP1", "CROP2", "CROP3", "BUSH", "FISH_SPOT"]);
// CH4-5 has every renewed prop except the scarecrow; nothing should fall back to legacy code.
const EXPECTED = B.SCARECROW !== undefined ? 20 : 28;

const errors = [];
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await openGame(page, { collectErrors: errors });
  await newGame(page);

  const report = await page.evaluate(({ renewed, ids }) => {
    const g = window.__game;
    const y = 20; // high in the air, away from terrain
    const out = {};
    renewed.forEach((name, i) => {
      const x = 4 + i * 2, z = 4;
      g.world.set(x, y, z, ids[name]);
      const prop = g.props.props.get(`${x},${y},${z}`);
      let meshes = 0, outlines = 0, textured = 0;
      prop?.traverse((o) => {
        if (!o.isMesh) return;
        meshes += 1;
        if (o.userData.outline) outlines += 1;
        if (o.material?.map) textured += 1;
      });
      out[name] = {
        built: !!prop,
        meshes,
        outlines,
        textured,
        names: ["flame", "hinge", "orb", "flag", "emblem"].filter((n) => prop?.getObjectByName(n)),
        flags: Object.keys(prop?.userData ?? {}),
      };
      g.world.set(x, y, z, 0);
    });
    // A fence gains rails when a neighbouring fence is placed (the renderer rebuilds it).
    const meshCount = (p) => { let n = 0; p.traverse((o) => o.isMesh && !o.userData.outline && (n += 1)); return n; };
    g.world.set(4, y, 10, ids.FENCE);
    const alone = meshCount(g.props.props.get(`4,${y},10`));
    g.world.set(5, y, 10, ids.FENCE);
    out.fenceRails = meshCount(g.props.props.get(`4,${y},10`)) - alone;
    g.world.set(4, y, 10, 0);
    g.world.set(5, y, 10, 0);
    // The water surface continues under a fish spot (no hole showing the sand bed).
    let fish = null;
    for (let fy = 0; fy < 32 && !fish; fy += 1) for (let fz = 0; fz < 112 && !fish; fz += 1) for (let fx = 0; fx < 64 && !fish; fx += 1) {
      if (g.world.get(fx, fy, fz) === ids.FISH_SPOT) fish = [fx, fy, fz];
    }
    out.fishSpot = fish;
    if (fish) {
      const [fx, fy, fz] = fish;
      let under = 0;
      for (const entry of g.chunks.meshes.values()) {
        const pos = entry.water?.geometry.attributes.position;
        if (!pos) continue;
        for (let i = 0; i < pos.count; i += 1) {
          const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
          if (vx >= fx && vx <= fx + 1 && vz >= fz && vz <= fz + 1 && Math.abs(vy - (fy - 0.12)) < 0.01) under += 1;
        }
      }
      out.waterUnderFish = under;
    }
    // The door opens toward a nearby player through the hinge, as before.
    const px = g.player.pos.x, pz = g.player.pos.z;
    const dx = Math.floor(px) + 1, dz = Math.floor(pz), dy = 20;
    g.world.set(dx, dy, dz, ids.DOOR);
    const door = g.props.props.get(`${dx},${dy},${dz}`);
    for (let i = 0; i < 30; i += 1) g.props.update(0.05, g.player.pos, false);
    out.doorOpened = door.getObjectByName("hinge").rotation.y < -1;
    g.world.set(dx, dy, dz, 0);
    return out;
  }, { renewed: RENEWED, ids: B });

  expect(RENEWED.length === EXPECTED, `all renewed props exist in this game (${RENEWED.length})`);
  for (const name of RENEWED) {
    const r = report[name];
    expect(r.built, `${name} is built by PropRenderer`);
    if (NO_OUTLINE.has(name)) expect(r.meshes > 4, `${name} has parts (${r.meshes})`);
    else expect(r.outlines > 0 && r.meshes > r.outlines, `${name} has outlined parts (${r.meshes - r.outlines} parts, ${r.outlines} outlines)`);
    const need = REQUIRED[name];
    if (need?.name) expect(r.names.includes(need.name), `${name} keeps "${need.name}"`);
    if (need?.flag) expect(r.flags.includes(need.flag), `${name} keeps userData.${need.flag}`);
  }
  expect(RENEWED.some((n) => report[n].textured > 0), "renewed props use block-pattern textures");
  expect(report.fishSpot && report.waterUnderFish >= 4, `water surface is drawn under a fish spot (${report.fishSpot}: ${report.waterUnderFish} vertices)`);
  expect(report.fenceRails === 2, `a fence adds two rails toward a new neighbour (${report.fenceRails})`);
  expect(report.doorOpened, "door hinge opens near the player");
  expect(errors.length === 0, `no console errors (${JSON.stringify(errors)})`);
} finally {
  await browser.close();
}
