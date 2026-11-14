import { aimAtCell } from "./aim-at-cell.mjs";

// 3編で同じ配置と実入力を使う。収納・会話の内部関数を直接呼んで成功扱いにしない。
export async function checkInteractions(page, { expect, waitForCond, dlg, blocks }) {
  await page.evaluate(({ CHEST, STONE }) => {
    const g = window.__game;
    g.quests.update = () => {}; // 物語・徘徊から独立した操作の試験場。
    g.blueprints.clear();
    for (const m of [...g.monsters.monsters]) g.monsters.remove(m);
    g.monsters.update = () => {};
    // カメラが後退しても既存の崖・洞窟の外壁に遮られない広さを確保する。
    for (let x = 16; x <= 48; x += 1) for (let z = 16; z <= 48; z += 1) {
      g.world.set(x, 11, z, STONE);
      for (let y = 12; y < 40; y += 1) if (g.world.inBounds(x, y, z)) g.world.set(x, y, z, 0);
    }
    for (const v of g.villagers) { v.root.visible = false; v.pos.set(10.5, 12, 10.5); }
    for (const [id, x] of [["mina", 31.5], ["gonta", 29.5]]) {
      const v = g.spawnVillager(id, x, 32.5, 12);
      v.pos.set(x, 12, 32.5); v.vel.set(0, 0, 0); v.root.visible = true;
      v.update = (dt, ctx) => v.syncVisual(dt, ctx.cameraYaw, ctx.world);
    }
    g.world.set(33, 12, 32, CHEST);
    g.player.pos.set(32.5, 12, 34.5); g.player.vel.set(0, 0, 0);
    g.player.faceToward(33.5, 32.5);
    g.cameraYaw = g.cameraYawTarget = 0;
  }, blocks);

  const waitTarget = (kind, key) => waitForCond(page, ({ kind, key }) => {
    const g = window.__game;
    return g.interactions[`${kind}Target`]?.key === key;
  }, { kind, key }, { label: `${kind} target ${key}` });
  const closeStorage = async () => {
    await page.keyboard.press("Escape");
    await waitForCond(page, () => !window.__game.ui.storageOpen);
  };
  const aimVillager = async (id, inReach = true) => {
    // 実際の頭の中央を投影。姿勢変更（倒れた状態）にも追従する。
    const point = await page.evaluate((id) => {
      const g = window.__game, v = g.villager(id);
      v.root.updateWorldMatrix(true, true);
      const p = v.rig.head.getWorldPosition(v.pos.clone()).project(g.camera);
      return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
    }, id);
    await page.mouse.move(point.x, point.y);
    if (inReach) await waitTarget("pointer", `villager:${id}`);
    else await waitForCond(page, () => !window.__game.interactions.pointerTarget);
  };

  // NPCが会話距離内にいても、各カメラ方向から箱を右クリックできる。
  for (let direction = 0; direction < 8; direction += 1) {
    await page.evaluate((yaw) => { window.__game.cameraYawTarget = yaw; }, direction * Math.PI / 4);
    await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
    await waitTarget("pointer", "prop:33,12,32");
    expect(await page.locator(".interaction-hint.pointer").innerText().then((t) => t.includes("収納箱を開く")), "箱の対象名と操作が表示される");
    await page.mouse.click(0, 0, { button: "right" }); // 押した地点でも照準を更新する（旧マウス位置を使わない）。
    await waitForCond(page, () => !window.__game.input.rawButtonPressed(2));
    expect(await page.evaluate(() => !window.__game.ui.storageOpen && !window.__game.ui.dialogue.open), "対象外のクリックは直前の箱や近くの住民を操作しない");
    await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
    await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
    await waitForCond(page, () => window.__game.ui.storageOpen);
    expect(await page.evaluate(() => !window.__game.ui.dialogue.open), `カメラ方向${direction}: 人の隣の箱を開ける`);
    expect(await page.locator(".interaction-hints").isHidden(), "収納を開いている間は操作案内を隠す");
    await closeStorage();
  }

  await page.evaluate(() => { window.__game.cameraYawTarget = 0; });
  await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
  // 武器を持っていても、NPC自身を指せばその人と話す。
  await page.evaluate(() => {
    const g = window.__game;
    const slot = g.inventory.slots.findIndex((s) => s?.id?.startsWith("sword"));
    if (slot >= 0) g.inventory.selected = slot;
  });
  await aimVillager("mina");
  expect((await page.locator(".interaction-hint.pointer").innerText()).includes("ミナと話す"), "人の対象名と操作が表示される");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => window.__game.ui.dialogue.open);
  expect(await page.evaluate(() => !window.__game.ui.storageOpen && window.__game.ui.dialogueName.textContent === "ミナ"), "人を指した右クリックでは会話だけが開く");
  await dlg(page);

  // Fはカーソルが箱にあっても、正面の人を選ぶ。
  await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
  await page.evaluate(() => window.__game.player.faceToward(31.5, 32.5));
  await waitTarget("facing", "villager:mina");
  expect((await page.locator(".interaction-hint.facing").innerText()).includes("ミナと話す"), "右クリックとFが違う対象なら両方の案内を出す");
  if (process.env.INTERACTION_SCREENSHOT) await page.screenshot({ path: process.env.INTERACTION_SCREENSHOT });
  await page.keyboard.press("f");
  await waitForCond(page, () => window.__game.ui.dialogue.open);
  expect(await page.evaluate(() => window.__game.ui.dialogueName.textContent === "ミナ" && !window.__game.ui.storageOpen), "Fはマウスが指す箱ではなく正面の人と話す");
  await dlg(page);

  // 逆に、人を指したままFで正面の箱を開ける。
  await page.evaluate(() => window.__game.player.faceToward(33.5, 32.5));
  await aimVillager("mina");
  await waitTarget("facing", "prop:33,12,32");
  await page.keyboard.press("f");
  await waitForCond(page, () => window.__game.ui.storageOpen);
  expect(await page.evaluate(() => !window.__game.ui.dialogue.open), "Fはマウスが指す人ではなく正面の箱を開く");
  await closeStorage();

  // 距離・壁越し・後方の相手を選ばない。
  await page.evaluate(() => window.__game.player.faceToward(32.5, 38));
  await waitForCond(page, () => !window.__game.interactions.facingTarget);
  await page.keyboard.press("f");
  await waitForCond(page, () => !window.__game.input.rawPressed("f"));
  expect(await page.evaluate(() => !window.__game.ui.dialogue.open && !window.__game.ui.storageOpen), "Fは後方の人や箱を操作しない");
  await page.evaluate(() => {
    const g = window.__game;
    g.player.pos.set(32.5, 12, 36.5); g.player.faceToward(31.5, 32.5);
  });
  await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
  await aimVillager("mina", false);
  await waitForCond(page, () => !window.__game.interactions.facingTarget);
  await page.keyboard.press("f");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => !window.__game.input.rawPressed("f") && !window.__game.input.rawButtonPressed(2));
  expect(await page.evaluate(() => !window.__game.ui.dialogue.open), "手が届かない人物には右クリックでもFでも話しかけない");
  await page.evaluate(() => { const g = window.__game; g.player.pos.set(32.5, 12, 34.5); g.player.faceToward(31.5, 32.5); });
  await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
  await aimVillager("mina");
  await page.evaluate((stone) => {
    const g = window.__game;
    for (let x = 30; x <= 34; x += 1) for (let y = 12; y <= 15; y += 1) g.world.set(x, y, 33, stone);
  }, blocks.STONE);
  await waitForCond(page, () => !window.__game.interactions.pointerTarget && !window.__game.interactions.facingTarget);
  await page.keyboard.press("f");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => !window.__game.input.rawPressed("f") && !window.__game.input.rawButtonPressed(2));
  expect(await page.evaluate(() => !window.__game.ui.dialogue.open && !window.__game.ui.storageOpen), "壁越しの会話や箱の操作をしない");
  await page.evaluate(() => {
    const g = window.__game;
    for (let x = 30; x <= 34; x += 1) for (let y = 12; y <= 15; y += 1) g.world.set(x, y, 33, 0);
    g.villager("mina").stayDown = true; g.villager("mina").setDown(true);
  });
  await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
  await aimVillager("mina");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => window.__game.ui.dialogue.open);
  expect(await page.evaluate(() => window.__game.ui.dialogueName.textContent === "ミナ"), "倒れた人物の姿をクリックしても話せる");
  await dlg(page);

  // 第5章の病人と同じく、ベッドのマスに横たわる人物も選べる。
  await page.evaluate(bed => window.__game.world.set(31, 12, 32, bed), blocks.BED);
  await aimVillager("mina");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => window.__game.ui.dialogue.open);
  expect(await page.evaluate(() => window.__game.ui.dialogueName.textContent === "ミナ"), "ベッドで寝ている人物を右クリックして話せる");
  await dlg(page);
  await page.evaluate(() => window.__game.player.faceToward(31.5, 32.5));
  await waitTarget("facing", "villager:mina");
  await page.keyboard.press("f");
  await waitForCond(page, () => window.__game.ui.dialogue.open);
  expect(await page.evaluate(() => window.__game.ui.dialogueName.textContent === "ミナ"), "ベッドで寝ている人物とFでも話せる");
  await dlg(page);
  await page.evaluate(() => window.__game.world.set(31, 12, 32, 0));

  // 別の住民の方が近くても、指した相手を選べる。
  await page.evaluate(() => {
    const g = window.__game;
    g.villager("mina").setDown(false);
    g.player.pos.set(30.5, 12, 33.8);
    g.villager("gonta").pos.set(29.7, 12, 33.8);
  });
  await aimAtCell(page, { x: 33, y: 12, z: 32 }, { target: "block" });
  await aimVillager("mina");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => window.__game.ui.dialogue.open);
  expect(await page.evaluate(() => window.__game.ui.dialogueName.textContent === "ミナ"), "手前に別の住民がいても、指したミナと話せる");
  await dlg(page);

  // 人物の名前の透明な余白がクリックを奪わない。
  const emptyLabel = await page.evaluate(() => {
    const g = window.__game, v = g.villager("mina");
    const p = v.nameLabel.getWorldPosition(v.pos.clone());
    const right = v.pos.clone().setFromMatrixColumn(g.camera.matrixWorld, 0);
    p.addScaledVector(right, v.nameLabel.scale.x * 0.45).project(g.camera);
    return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
  });
  await page.mouse.move(emptyLabel.x, emptyLabel.y);
  await waitForCond(page, () => window.__game.interactions.pointerTarget?.kind !== "villager");
  await page.mouse.down({ button: "right" }); await page.mouse.up({ button: "right" });
  await waitForCond(page, () => !window.__game.input.rawButtonPressed(2));
  expect(await page.evaluate(() => !window.__game.ui.dialogue.open), "名前の透明な余白をクリックしても会話を始めない");
}
