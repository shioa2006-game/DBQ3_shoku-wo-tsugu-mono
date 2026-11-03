// Renewed placed objects come from src/world/prop-models.js (exported from
// Storybook_Character_Studio/prototypes/props-3d/): each one builds in the real
// PropRenderer with black outlines, block-pattern textures and the parts the
// renderer animates (door hinge, torch flame), with no console errors.

import { B } from "../../src/world/blocks.js";
import { launchBrowser, openGame, newGame, expect } from "../helpers.mjs";

const RENEWED = ["SCARECROW", "TORCH", "BED", "TORII", "DOOR", "WORKBENCH", "ALTAR", "SPIKES"].filter((n) => B[n] !== undefined);
const REQUIRED = { TORCH: { name: "flame", flag: "torch" }, DOOR: { name: "hinge", flag: "door" }, ALTAR: { name: "orb" } };

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
        names: ["flame", "hinge", "orb"].filter((n) => prop?.getObjectByName(n)),
        flags: Object.keys(prop?.userData ?? {}),
      };
      g.world.set(x, y, z, 0);
    });
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

  for (const name of RENEWED) {
    const r = report[name];
    expect(r.built, `${name} is built by PropRenderer`);
    expect(r.outlines > 0 && r.meshes > r.outlines, `${name} has outlined parts (${r.meshes - r.outlines} parts, ${r.outlines} outlines)`);
    const need = REQUIRED[name];
    if (need?.name) expect(r.names.includes(need.name), `${name} keeps "${need.name}"`);
    if (need?.flag) expect(r.flags.includes(need.flag), `${name} keeps userData.${need.flag}`);
  }
  expect(RENEWED.some((n) => report[n].textured > 0), "renewed props use block-pattern textures");
  expect(report.doorOpened, "door hinge opens near the player");
  expect(errors.length === 0, `no console errors (${JSON.stringify(errors)})`);
} finally {
  await browser.close();
}
