import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import { gameRoot, pages, pageUrl, PNG, normalize, launchBrowser } from './game.mjs';
const root=gameRoot,dirs=['front','front_left','left','back_left','back','back_right','right','front_right'];
function components(png,cell){
 const seen=new Set(),sizes=[],ox=cell%4*128,oy=Math.floor(cell/4)*128;
 const solid=(x,y)=>x>=0&&x<128&&y>=0&&y<128&&png.data[((oy+y)*512+ox+x)*4+3]>48;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const start=y*128+x;if(seen.has(start)||!solid(x,y))continue;
  const queue=[start];seen.add(start);
  for(let at=0;at<queue.length;at++){
   const n=queue[at],nx=n%128,ny=Math.floor(n/128);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
    const xx=nx+dx,yy=ny+dy,key=yy*128+xx;
    if(solid(xx,yy)&&!seen.has(key)){seen.add(key);queue.push(key);}
   }
  }
  sizes.push(queue.length);
 }
 return sizes.sort((a,b)=>b-a);
}
const bounds=[];
for(const f of ['a','b']){
 const png=PNG.sync.read(await readFile(new URL(`assets/nonhumanoids/field_rat_code_idle_${f}_8dir.png`,root))),raw=PNG.sync.read(await readFile(new URL(`art_src/field_rat_code_idle_${f}_8dir.src.png`,root)));
 assert.deepEqual([png.width,png.height],[512,256]);assert.deepEqual(png.data,normalize(raw).out.data);
 const count=p=>p.data.filter((v,i)=>i%4===3&&v>24).length;assert.equal(count(png),count(raw));const boxes=[];
 for(let cell=0;cell<8;cell++){
  const islands=components(png,cell);assert.ok(islands.slice(1).every(n=>n<8),`${f}/${dirs[cell]} detached parts: ${islands}`);
  let l=128,r=-1,t=128,b=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(png.data[((Math.floor(cell/4)*128+y)*512+cell%4*128+x)*4+3]>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  assert.ok(l>=3&&r<=124&&t>=3&&b===121,'Inside UV crop, fixed baseline');assert.ok(Math.abs((l+r)/2-63)<=.5);boxes.push({w:r-l+1,h:b-t+1});
 }bounds.push(boxes);
}
for(let i=0;i<8;i++){assert.ok(Math.abs(bounds[1][i].w-bounds[0][i].w)<12);assert.ok(bounds[1][i].h<bounds[0][i].h);}
console.log('PASS: 8 directions x 2 poses, lossless normalization, crouched B at fixed baseline');
const browser=await launchBrowser();
try{
 const page=await browser.newPage({viewport:{width:1120,height:980},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.PROTOTYPE_URL||pageUrl('field-rat'),{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__ratPreview?.ready());const images=[];
 for(const [index,d] of dirs.entries()){
  await page.locator(`[data-direction="${d}"]`).click();
  for(const frame of ['a','b']){
   await page.locator('#pose').selectOption(frame);
   const result=await page.evaluate(()=>{const p=window.__ratPreview;p.setState({paused:true,water:false});p.pose(0);return {rigs:p.rigs.map(r=>({direction:r.direction,a:r.usingA,selected:r.material.map===(p.state.pose==='a'?r.texA:r.texB),scale:r.mesh.scale.toArray(),y:r.mesh.position.y,size:[r.texA.image.width,r.texA.image.height],uv:[r.texA.offset.toArray(),r.texA.repeat.toArray()]})),data:p.renderer.domElement.toDataURL()};});
   assert.deepEqual(result.rigs[0],result.rigs[1]);const r=result.rigs[0];assert.equal(r.direction,d);assert.equal(r.a,frame==='a');assert.ok(r.selected);assert.deepEqual(r.scale,[.9,.9,.9]);assert.equal(r.y,.45);assert.deepEqual(r.size,[512,256]);
   assert.ok(Math.abs(r.uv[1][0]-.24)<1e-8&&Math.abs(r.uv[1][1]-.48)<1e-8);assert.ok(Math.abs(r.uv[0][0]-(index%4+.02)/4)<1e-8);assert.ok(Math.abs(r.uv[0][1]-(1-Math.floor(index/4)+.02)/2)<1e-8);images.push({direction:d,frame,data:result.data});
  }
 }
 const checks=await page.evaluate(()=>{const p=window.__ratPreview;const phases=[0,.379,.38,.759,.76].map(t=>{p.setState({pose:'auto',paused:true});p.pose(t);return p.rigs.map(r=>r.usingA);});p.setState({water:true});const water=p.rigs.map(r=>r.material.color.getHex());p.setState({water:false});return {phases,water,dry:p.rigs.map(r=>r.material.color.getHex())};});
 assert.deepEqual(checks.phases,[[true,true],[true,true],[false,false],[false,false],[true,true]]);assert.equal(checks.water[0],checks.water[1]);assert.notEqual(checks.water[0],0xffffff);assert.deepEqual(checks.dry,[0xffffff,0xffffff]);
 for(const f of ['a','b']){
  const data=await page.evaluate(async images=>{const c=document.createElement('canvas');c.width=1200;c.height=1200;const x=c.getContext('2d');x.fillStyle='#efeee6';x.fillRect(0,0,1200,1200);x.fillStyle='#263f4e';x.font='24px sans-serif';x.fillText('FIELD RAT / REFERENCE + CODE / '+images[0].frame.toUpperCase(),24,36);for(const [i,f] of images.entries()){const im=new Image();im.src=f.data;await im.decode();const ox=i%2*600,oy=60+Math.floor(i/2)*280;x.font='16px sans-serif';x.fillText(f.direction,ox+24,oy+20);x.drawImage(im,ox+10,oy+28,580,232);}return c.toDataURL().split(',')[1];},images.filter(i=>i.frame===f));
  await writeFile(new URL(`field-rat/rig-8dir-${f}.png`,pages),Buffer.from(data,'base64'));
 }
 await page.evaluate(()=>{const p=window.__ratPreview;p.setState({direction:'front',pose:'a',paused:true});p.pose(0);});await page.screenshot({path:fileURLToPath(new URL('field-rat/preview.png',pages)),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#rotate').click();assert.equal(await page.locator('#rotate').getAttribute('aria-pressed'),'true');await page.evaluate(()=>window.__ratPreview.setState({paused:false}));await page.waitForFunction(()=>window.__ratPreview.state.direction!=='front');assert.deepEqual(errors,[]);
 console.log('PASS: MonsterSprite UVs/scale, synchronized A/B, water tint, 8-direction rotation, mobile, no browser errors');
}finally{await browser.close();}
