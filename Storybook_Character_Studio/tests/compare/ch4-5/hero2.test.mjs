// 主人公シオンの新デザイン案（hero2、試作03）を、比較ページ compare/ch4-5/characters/?c=hero2 の3Dリグで確かめる。
// ?c=hero2v02 では、保存した試作02と並べる。
// 8方向と待機・歩行・攻撃で、Studioの頭・胴の分離画像が読み込まれ、向きと道具が切り替わることを検査し、
// 確認用のスクリーンショットを compare/ch4-5/characters/ に保存する（Git管理しない）。
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS, LABELS } from '../../../prototypes/shared/sheet-format.mjs';

const out = name => new URL(`../../../compare/ch4-5/characters/${name}`, import.meta.url);
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(new URL('compare/ch4-5/characters/?c=hero2', process.env.STUDIO_URL || 'http://127.0.0.1:8081/').href);
  await page.waitForFunction(() => window.__heroPreview?.ready());
  const sheets = await page.evaluate(() => window.__heroPreview.rigs.map(r => [r.headTexture.image.src, r.bodyTexture.image.src]));
  assert.ok(sheets[1][0].endsWith('/prototypes/hero2-8dir/output/hero2_code_head_layer_8dir.png'), 'head layer from the Studio output');
  assert.ok(sheets[1][1].endsWith('/prototypes/hero2-8dir/output/hero2_code_torso_layer_8dir.png'), 'torso layer from the Studio output');
  assert.ok(sheets[0][0].endsWith('/assets/humanoids/adventurer_code_body_8dir.png'), 'left side is the current hero');

  // Freeze the animation clock and zoom in; each shot renders one pose of both rigs.
  const shot = (direction, action, time = 0, tool = '') => page.evaluate(({ direction, action, time, tool }) => {
    const h = window.__heroPreview;
    h.state.paused = true; h.camera.zoom = 1.9; h.camera.updateProjectionMatrix();
    h.setState({ direction, action, tool, auto: false });
    h.pose(time);
    const snap = h.snapshot();
    return { url: h.renderer.domElement.toDataURL('image/png'), snap };
  }, { direction, action, time, tool });

  // Compose: crop the generated (right) half of every shot onto one board.
  const board = async (file, shots, title) => {
    const data = await page.evaluate(async ({ shots, title }) => {
      const imgs = await Promise.all(shots.map(async s => { const i = new Image(); i.src = s.url; await i.decode(); return i; }));
      const w = imgs[0].width / 2, h = imgs[0].height, cols = Math.min(4, shots.length), rows = Math.ceil(shots.length / cols);
      const cw = w * .62, ch = h * .92, c = document.createElement('canvas');
      c.width = cols * cw + 40; c.height = rows * (ch + 46) + 80;
      const g = c.getContext('2d'); g.fillStyle = '#eee9df'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#203344'; g.font = 'bold 30px sans-serif'; g.fillText(title, 24, 46);
      imgs.forEach((img, i) => {
        const x = 20 + (i % cols) * cw, y = 70 + Math.floor(i / cols) * (ch + 46);
        g.drawImage(img, w + (w - cw) / 2, h * .02, cw, ch, x, y, cw, ch);
        g.font = '24px sans-serif'; g.fillText(shots[i].label, x + 10, y + ch + 32);
      });
      return c.toDataURL('image/png').split(',')[1];
    }, { shots, title });
    await writeFile(out(file), Buffer.from(data, 'base64'));
  };

  const all = [];
  for (const [i, direction] of DIRECTIONS.entries()) {
    const { url, snap } = await shot(direction, 'idle');
    assert.deepEqual(snap.directions, [direction, direction], `both rigs face ${direction}`);
    all.push({ url, label: LABELS[i] });
  }
  await board('hero2-rig-8dir.png', all, 'シオン新デザイン案 / 3Dリグ・待機の8方向');

  const actions = [];
  for (const [direction, label] of [['front', '正面'], ['left', '左'], ['back', '背面'], ['front_right', '右斜め前']]) {
    for (const [action, time, tool, name] of [['walk', .35, '', '歩行'], ['walk', .95, '', '歩行（反対の足）'], ['attack', 0, 'sword_iron', '攻撃・鉄の剣']]) {
      const { url, snap } = await shot(direction, action, time, tool);
      if (tool) assert.deepEqual(snap.tools, [tool, tool], 'sword equipped on both rigs');
      actions.push({ url, label: `${label}・${name}` });
    }
  }
  await board('hero2-rig-actions.png', actions.slice(0, 12), 'シオン新デザイン案 / 3Dリグ・歩行と攻撃');

  // Old and new hero side by side (front, left, back).
  const sideBySide = [];
  for (const direction of ['front', 'left', 'back']) sideBySide.push(await shot(direction, 'idle'));
  const data = await page.evaluate(async shots => {
    const imgs = await Promise.all(shots.map(async s => { const i = new Image(); i.src = s.url; await i.decode(); return i; }));
    const w = imgs[0].width, h = imgs[0].height, c = document.createElement('canvas');
    c.width = w; c.height = h * shots.length;
    const g = c.getContext('2d'); imgs.forEach((img, i) => g.drawImage(img, 0, i * h));
    return c.toDataURL('image/png').split(',')[1];
  }, sideBySide);
  await writeFile(out('hero2-rig-old-new.png'), Buffer.from(data, 'base64'));

  // 8 directions at once (the grid below the stage): one rig per direction, the same action and tool,
  // switched with the page's own buttons.
  const gridShot = async (action, time, tool) => page.evaluate(({ action, time, tool }) => {
    const h = window.__heroPreview; h.state.paused = true;
    h.setState({ action, tool, auto: false }); h.pose(time);
    return { url: h.grid.renderer.domElement.toDataURL('image/png'), grid: h.grid.snapshot() };
  }, { action, time, tool });
  await page.click('#grid-bar [data-action="walk"]');
  assert.equal(await page.evaluate(() => window.__heroPreview.state.action), 'walk', 'grid buttons switch the action');
  assert.deepEqual(await page.$$eval('[data-action="walk"]', bs => bs.map(b => b.getAttribute('aria-pressed'))), ['true', 'true'], 'both button rows show the action');
  await page.selectOption('#grid-tool', 'sword_iron');
  assert.equal(await page.$eval('#tool', s => s.value), 'sword_iron', 'grid tool follows the page tool');
  for (const [action, time, tool, file] of [['idle', 0, '', 'hero2-rig-grid-idle.png'], ['walk', .35, '', 'hero2-rig-grid-walk.png'], ['attack', 0, 'sword_iron', 'hero2-rig-grid-attack.png']]) {
    const { url, grid } = await gridShot(action, time, tool);
    assert.deepEqual(grid.directions, DIRECTIONS, `grid shows the 8 directions (${action})`);
    assert.equal(grid.side, 'generated');
    assert.deepEqual(grid.tools, DIRECTIONS.map(() => tool || null), `grid tools (${action})`);
    await writeFile(out(file), Buffer.from(url.split(',')[1], 'base64'));
  }
  await page.click('[data-grid-side="original"]');
  const original = await page.evaluate(() => { const h = window.__heroPreview; return { side: h.grid.side, sheet: h.grid.sets.original[0].bodyTexture.image.src }; });
  assert.equal(original.side, 'original', 'grid switches to the current hero');
  assert.ok(original.sheet.endsWith('/assets/humanoids/adventurer_code_body_8dir.png'), 'current hero in the grid');
  await page.click('[data-grid-side="generated"]');

  // Front-right swing (tuning.toolOverHead): the near hand's tool crosses the face, so while attacking
  // it is drawn over the flat head card (then the head's depth is written again). Other directions, the
  // idle pose and the current hero keep the normal order; the swing path is the same on both rigs.
  const overHead = await page.evaluate(() => {
    const h = window.__heroPreview, [hero, rig] = h.rigs, state = [];
    h.state.paused = true;
    for (const [direction, attackT] of [['front_right', .56], ['front_right', 0], ['front_left', .56], ['front', .56]]) {
      h.setState({ direction, action: 'attack', tool: 'hammer_stone', auto: false });
      for (const r of h.rigs) { r.attackT = attackT; r.update(0, false); }
      const orders = []; rig.tool.traverse(o => { if (o.isMesh) orders.push(o.renderOrder); });
      const heroTip = new hero.tool.position.constructor(), rigTip = heroTip.clone();
      hero.tool.getWorldPosition(heroTip); rig.tool.getWorldPosition(rigTip);
      state.push({ direction, attackT, over: orders.every(o => o >= 1.4), depthCopy: rig._headDepthCopy.visible,
        headDepthWrite: rig._headFrontMaterial.depthWrite, heroPlain: !hero._headDepthCopy, sameGrip: heroTip.distanceTo(rigTip) < .05 });
    }
    for (const r of h.rigs) r.attackT = 0;
    return state;
  });
  const expect = { 'front_right/0.56': true, 'front_right/0': false, 'front_left/0.56': false, 'front/0.56': false };
  for (const s of overHead) {
    const want = expect[`${s.direction}/${s.attackT}`];
    assert.equal(s.over, want, `tool drawn over the head: ${s.direction} attackT ${s.attackT}`);
    assert.equal(s.depthCopy, want, `head depth copy: ${s.direction} attackT ${s.attackT}`);
    assert.equal(s.headDepthWrite, !want, `head depth write: ${s.direction} attackT ${s.attackT}`);
    assert.ok(s.heroPlain, 'the current hero keeps the normal order');
    assert.ok(s.sameGrip, `same grip as the current hero: ${s.direction}`);
  }
  const swing = [];
  for (const t of [.92, .8, .68, .56, .44, .3]) swing.push({ ...(await page.evaluate(t => {
    const h = window.__heroPreview, r = h.renderer;
    h.state.paused = true; h.camera.zoom = 1.9; h.camera.updateProjectionMatrix();
    h.setState({ direction: 'front_right', action: 'attack', tool: 'hammer_stone', auto: false });
    for (const x of h.rigs) { x.walkTime = 0; x.animTime = 0; x.attackT = t; x.update(0, false); }
    const v = { x: 0, y: 0, set(a, b) { this.x = a; this.y = b; return this; } }; r.getSize(v);
    r.setScissorTest(true);
    h.rigs.forEach((x, i) => { h.rigs.forEach((y, j) => { y.group.visible = y.shadow.visible = i === j; });
      r.setViewport(i * v.x / 2, 0, v.x / 2, v.y); r.setScissor(i * v.x / 2, 0, v.x / 2, v.y); r.render(h.scene, h.camera); });
    r.setScissorTest(false); h.rigs.forEach(y => { y.group.visible = y.shadow.visible = true; });
    for (const x of h.rigs) x.attackT = 0;
    return { url: r.domElement.toDataURL('image/png') };
  }, t)), label: `振り上げ ${t}` });
  const swingBoard = await page.evaluate(async shots => {
    const imgs = await Promise.all(shots.map(async s => { const i = new Image(); i.src = s.url; await i.decode(); return i; }));
    const W = imgs[0].width / 2, H = imgs[0].height, cw = W * .5, ch = H * .72;
    const c = document.createElement('canvas'); c.width = cw * imgs.length; c.height = ch * 2 + 110; const g = c.getContext('2d');
    g.fillStyle = '#eee9df'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#203344'; g.font = 'bold 28px sans-serif'; g.fillText('右斜め前・石のハンマーの攻撃（上：以前の主人公　下：シオン）', 20, 42);
    imgs.forEach((img, i) => { for (const half of [0, 1]) g.drawImage(img, half * W + (W - cw) / 2, H * .02, cw, ch, i * cw, 60 + half * ch, cw, ch);
      g.font = '22px sans-serif'; g.fillText(shots[i].label, i * cw + 12, 60 + ch * 2 + 34); });
    return c.toDataURL('image/png').split(',')[1];
  }, swing);
  await writeFile(out('hero2-rig-swing-front-right.png'), Buffer.from(swingBoard, 'base64'));

  // Prototype 02 (saved in prototypes/hero2-8dir/v02/) and prototype 03 side by side on the same rig:
  // the 8 directions at rest, and walking / attacking from the front and the side.
  await page.goto(new URL('compare/ch4-5/characters/?c=hero2v02', process.env.STUDIO_URL || 'http://127.0.0.1:8081/').href);
  await page.waitForFunction(() => window.__heroPreview?.ready());
  const versions = await page.evaluate(() => window.__heroPreview.rigs.map(r => [r.headTexture.image.src, r.bodyTexture.image.src]));
  assert.ok(versions[0][0].endsWith('/prototypes/hero2-8dir/v02/hero2_code_head_layer_8dir.png'), 'left: prototype 02 head');
  assert.ok(versions[0][1].endsWith('/prototypes/hero2-8dir/v02/hero2_code_torso_layer_8dir.png'), 'left: prototype 02 torso');
  assert.ok(versions[1][1].endsWith('/prototypes/hero2-8dir/output/hero2_code_torso_layer_8dir.png'), 'right: prototype 03 torso');
  const pairs = [];
  for (const [i, direction] of DIRECTIONS.entries()) pairs.push({ ...(await shot(direction, 'idle')), label: `${LABELS[i]}（左：試作02　右：試作03）` });
  for (const [direction, label] of [['front', '正面'], ['left', '左']]) {
    pairs.push({ ...(await shot(direction, 'walk', .35)), label: `${label}・歩行（左：02　右：03）` });
    pairs.push({ ...(await shot(direction, 'attack', 0, 'sword_iron')), label: `${label}・攻撃（左：02　右：03）` });
  }
  const pairBoard = await page.evaluate(async shots => {
    const imgs = await Promise.all(shots.map(async s => { const i = new Image(); i.src = s.url; await i.decode(); return i; }));
    const k = .5, w = imgs[0].width * k, h = imgs[0].height * .86 * k, cols = 4, rows = Math.ceil(imgs.length / cols);
    const c = document.createElement('canvas'); c.width = cols * w + 40; c.height = rows * (h + 40) + 80;
    const g = c.getContext('2d'); g.fillStyle = '#eee9df'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#203344'; g.font = 'bold 30px sans-serif'; g.fillText('シオン新デザイン案 / 試作02と試作03・同じ3Dリグ', 24, 48);
    imgs.forEach((img, i) => { const x = 20 + (i % cols) * w, y = 70 + Math.floor(i / cols) * (h + 40);
      g.drawImage(img, 0, img.height * .06, img.width, img.height * .86, x, y, w, h);
      g.font = '22px sans-serif'; g.fillText(shots[i].label, x + 10, y + h + 28); });
    return c.toDataURL('image/png').split(',')[1];
  }, pairs);
  await writeFile(out('hero2-rig-v02-v03.png'), Buffer.from(pairBoard, 'base64'));

  assert.deepEqual(errors, [], 'no page errors');
  console.log('hero2: 8 directions, walk, attack, the 8-direction grid and prototype 02/03 checked; screenshots saved to compare/ch4-5/characters/');
} finally { await browser.close(); }
