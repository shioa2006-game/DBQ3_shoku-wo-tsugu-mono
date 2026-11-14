import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { launchBrowser } from '../../../../dqb3-tsugumono-ch4-5/tests/helpers.mjs';
import { DIRECTIONS } from '../../../prototypes/shared/sheet-format.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({viewport:{width:1200,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(new URL('/',process.env.STUDIO_URL).href);
  await page.getByRole('link',{name:'通常型と静止造形を比較'}).click();
  await page.waitForFunction(()=>window.__monsterPreview?.ready());
  assert.equal(await page.locator('#pose').isDisabled(),true);
  assert.equal(await page.locator('#code-b').isVisible(),false);
  const renders=new Set();
  await mkdir(new URL('../../../work/gargoyle-heavy/',import.meta.url),{recursive:true});
  for(const direction of DIRECTIONS) {
    await page.click(`[data-direction="${direction}"]`);
    const result=await page.evaluate(()=>{
      const p=window.__monsterPreview;
      p.setState({paused:true});
      p.pose(0);
      const canvas=document.querySelector('#scene');
      const before=canvas.toDataURL();
      p.pose(3.42);
      return {before,after:canvas.toDataURL(),directions:p.rigs.map(r=>r.direction),
        urls:p.rigs.map(r=>r.material.map.image.src),scales:p.rigs.map(r=>r.mesh.scale.toArray())};
    });
    assert.equal(result.before,result.after,'時間が進んでも両側の静止姿勢を維持');
    assert.deepEqual(result.directions,[direction,direction]);
    assert.ok(result.urls[0].endsWith('gargoyle_ground_code_idle_a_8dir.png'));
    assert.ok(result.urls[1].endsWith('gargoyle_heavy_ground_code_idle_a_8dir.png'));
    for(const axis of [0,1]) assert.ok(Math.abs(result.scales[1][axis]/result.scales[0][axis]-1.3)<1e-9,'重装型は通常型の1.3倍');
    renders.add(result.after);
    if(['front','front_left','left','back_left','back','back_right'].includes(direction)) {
      await page.locator('.stage').screenshot({path:new URL(`../../../work/gargoyle-heavy/${direction}.png`,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
    }
  }
  assert.equal(renders.size,8,'8方向すべてで表示が変わる');
  await page.setViewportSize({width:390,height:844});
  await page.click('[data-direction="front_left"]');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('link',{name:'ガーゴイル',exact:true}).click();
  await page.waitForFunction(()=>window.__monsterPreview?.ready());
  assert.equal(await page.locator('#pose').isDisabled(),false,'通常型のポーズ選択は維持');
  assert.deepEqual(errors,[]);
} finally { await browser.close(); }
