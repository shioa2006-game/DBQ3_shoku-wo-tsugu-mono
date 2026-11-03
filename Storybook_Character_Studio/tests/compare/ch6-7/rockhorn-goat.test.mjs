import assert from 'node:assert/strict';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  await page.goto(new URL('/compare/ch6-7/rockhorn-goat/', process.env.STUDIO_URL).href, { waitUntil: 'networkidle' });
  const drawings = new Set();
  for (const direction of DIRECTIONS) {
    await page.selectOption('#direction',direction);
    for (const pose of ['a','b']) {
      await page.selectOption('#pose',pose);
      // 描画直後のWebGLバッファから、実際に表示されたセルの画素を読む。
      const pixels = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
        const canvas = document.querySelector('#sprite');
        const gl = canvas.getContext('webgl2');
        const rgba = new Uint8Array(canvas.width*canvas.height*4);
        gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
        let count = 0, hash = 0;
        for (let i=0;i<rgba.length;i+=4) {
          if (rgba[i+3]>32) count++;
          hash = (Math.imul(hash,31) + rgba[i] + rgba[i+3]) | 0;
        }
        resolve({ count, hash });
      })));
      assert.ok(pixels.count > 1000, `${direction}/${pose} の表示が空です`);
      drawings.add(pixels.hash);
    }
  }
  assert.equal(drawings.size,16,'8方向の各姿勢が個別に表示される');
} finally { await browser.close(); }
