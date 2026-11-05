// 主人公シオンの新デザイン案（hero2）を、比較ページ compare/ch4-5/characters/?c=hero2 の3Dリグで確かめる。
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

  assert.deepEqual(errors, [], 'no page errors');
  console.log('hero2: 8 directions, walk and attack checked; screenshots saved to compare/ch4-5/characters/');
} finally { await browser.close(); }
