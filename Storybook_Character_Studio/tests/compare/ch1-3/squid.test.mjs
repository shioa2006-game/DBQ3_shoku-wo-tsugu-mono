import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import { gameRoot, pages, pageUrl, PNG, normalize, launchBrowser } from './game.mjs';
const root=gameRoot,dirs=['front','front_left','left','back_left','back','back_right','right','front_right'];
// Large disconnected alpha islands indicate a arm detached from the torso.
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
 const png=PNG.sync.read(await readFile(new URL(`assets/nonhumanoids/squid_code_idle_${f}_8dir.png`,root))),raw=PNG.sync.read(await readFile(new URL(`art_src/squid_code_idle_${f}_8dir.src.png`,root)));
 assert.deepEqual([png.width,png.height],[512,256]);const expected=normalize(raw).out;
 for(let row=0;row<2;row++){const start=row*128*512*4,end=(row+1)*128*512*4,shift=9*512*4;expected.data.copyWithin(start,start+shift,end);expected.data.fill(0,end-shift,end);}
 assert.deepEqual(png.data,expected.data);
 const count=p=>p.data.filter((v,i)=>i%4===3&&v>24).length;assert.equal(count(png),count(raw));const boxes=[];
 for(let cell=0;cell<8;cell++){
  const islands=components(png,cell);assert.ok(islands.slice(1).every(n=>n<8),`${f}/${dirs[cell]} detached parts: ${islands}`);
  let l=128,r=-1,t=128,b=-1;
  for(let y=0;y<128;y++)for(let x=0;x<128;x++)if(png.data[((Math.floor(cell/4)*128+y)*512+cell%4*128+x)*4+3]>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  assert.ok(l>=3&&r<=124&&t>=3&&b===112,'Inside UV crop, fixed airborne anchor');assert.ok(Math.abs((l+r)/2-63)<=.5);boxes.push({w:r-l+1,h:b-t+1});
 }bounds.push(boxes);
}
// Arms change without rescaling the body; silhouettes retain size and anchor.
for(let i=0;i<8;i++){assert.ok(Math.abs(bounds[1][i].w-bounds[0][i].w)<14);assert.ok(Math.abs(bounds[1][i].h-bounds[0][i].h)<=2);}
const a=PNG.sync.read(await readFile(new URL('assets/nonhumanoids/squid_code_idle_a_8dir.png',root))),b=PNG.sync.read(await readFile(new URL('assets/nonhumanoids/squid_code_idle_b_8dir.png',root)));
for(let i=0;i<8;i++){let changes=0;for(let y=0;y<128;y++)for(let x=0;x<128;x++){const at=((Math.floor(i/4)*128+y)*512+i%4*128+x)*4;if(!a.data.subarray(at,at+4).equals(b.data.subarray(at,at+4)))changes++;}assert.ok(changes>30,'Each view has a visible arm beat');}
console.log('PASS: 8 directions x 2 poses, lossless normalization, arm beat B at fixed airborne anchor');
const browser=await launchBrowser();
try{
 const page=await browser.newPage({viewport:{width:1120,height:980},deviceScaleFactor:1}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto(process.env.PROTOTYPE_URL||pageUrl('squid'),{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__squidPreview?.ready());const images=[];
 for(const [index,d] of dirs.entries()){
  await page.locator(`[data-direction="${d}"]`).click();
  for(const frame of ['a','b']){
   await page.locator('#pose').selectOption(frame);
   const result=await page.evaluate(()=>{const p=window.__squidPreview;p.setState({paused:true,water:false});p.pose(0);return {rigs:p.rigs.map(r=>({direction:r.direction,a:r.usingA,selected:r.material.map===(p.state.pose==='a'?r.texA:r.texB),scale:r.mesh.scale.toArray(),y:r.mesh.position.y,size:[r.texA.image.width,r.texA.image.height],uv:[r.texA.offset.toArray(),r.texA.repeat.toArray()]})),data:p.renderer.domElement.toDataURL()};});
   assert.deepEqual(result.rigs[0],result.rigs[1]);const r=result.rigs[0];assert.equal(r.direction,d);assert.equal(r.a,frame==='a');assert.ok(r.selected);assert.deepEqual(r.scale,[.95,.95,.95]);assert.ok(Math.abs(r.y-.875)<1e-9);assert.deepEqual(r.size,[512,256]);
   assert.ok(Math.abs(r.uv[1][0]-.24)<1e-8&&Math.abs(r.uv[1][1]-.48)<1e-8);assert.ok(Math.abs(r.uv[0][0]-(index%4+.02)/4)<1e-8);assert.ok(Math.abs(r.uv[0][1]-(1-Math.floor(index/4)+.02)/2)<1e-8);images.push({direction:d,frame,data:result.data});
  }
 }
 const checks=await page.evaluate(()=>{const p=window.__squidPreview;const phases=[0,.379,.38,.759,.76].map(t=>{p.setState({pose:'auto',paused:true});p.pose(t);return p.rigs.map(r=>r.usingA);});p.setState({water:true});const water=p.rigs.map(r=>r.material.color.getHex());p.setState({water:false});return {phases,water,dry:p.rigs.map(r=>r.material.color.getHex())};});
 assert.deepEqual(checks.phases,[[true,true],[true,true],[false,false],[false,false],[true,true]]);assert.equal(checks.water[0],checks.water[1]);assert.notEqual(checks.water[0],0xffffff);assert.deepEqual(checks.dry,[0xffffff,0xffffff]);
 // Check every direction across a complete pulse; changing direction cannot accumulate height.
 const flight=await page.evaluate(dirs=>{
  const p=window.__squidPreview;
  return dirs.map(direction=>{
   p.setState({direction,pose:'auto',paused:true});
   const samples=[0,.19,.38,.57,.76,7.6].map(t=>{p.pose(t);return p.rigs.map(r=>r.group.position.y);});
   p.pose(.38-1e-5);const before=p.rigs[1].group.position.y;p.pose(.38+1e-5);const after=p.rigs[1].group.position.y;
   p.setState({pose:'b'});p.pose(.57);const fixed=p.rigs.map(r=>r.group.position.y);
   const shadows=p.scene.children.filter(m=>m.geometry?.type==='CircleGeometry').map(m=>m.position.y);
   return {samples,before,after,fixed,shadows};
  });
 },dirs);
 for(const f of flight){
  f.samples.forEach((pair,i)=>{assert.equal(pair[0],pair[1]);assert.ok(Math.abs(pair[0]-[0, .045,0,-.045,0,0][i])<1e-8);});
  assert.ok(Math.abs(f.before-f.after)<.0001,'Smooth at frame switch');assert.deepEqual(f.fixed,[0,0]);assert.deepEqual(f.shadows,[.002,.002]);
 }
 console.log('PASS: connected arms in all 16 cells; synchronized continuous bob, stationary fixed poses and ground shadows');
 for(const f of ['a','b']){
  const data=await page.evaluate(async images=>{const c=document.createElement('canvas');c.width=1200;c.height=1200;const x=c.getContext('2d');x.fillStyle='#efeee6';x.fillRect(0,0,1200,1200);x.fillStyle='#263f4e';x.font='24px sans-serif';x.fillText('SQUID / REFERENCE + CODE / '+images[0].frame.toUpperCase(),24,36);for(const [i,f] of images.entries()){const im=new Image();im.src=f.data;await im.decode();const ox=i%2*600,oy=60+Math.floor(i/2)*280;x.font='16px sans-serif';x.fillText(f.direction,ox+24,oy+20);x.drawImage(im,ox+10,oy+28,580,232);}return c.toDataURL().split(',')[1];},images.filter(i=>i.frame===f));
  await writeFile(new URL(`squid/rig-8dir-${f}.png`,pages),Buffer.from(data,'base64'));
 }
 await page.evaluate(()=>{const p=window.__squidPreview;p.setState({direction:'front',pose:'a',paused:true});p.pose(0);});await page.screenshot({path:fileURLToPath(new URL('squid/preview.png',pages)),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#rotate').click();assert.equal(await page.locator('#rotate').getAttribute('aria-pressed'),'true');await page.evaluate(()=>window.__squidPreview.setState({paused:false}));await page.waitForFunction(()=>window.__squidPreview.state.direction!=='front');await page.locator('#pose').selectOption('auto');const startY=await page.evaluate(()=>window.__squidPreview.rigs[1].group.position.y);await page.waitForFunction(y=>Math.abs(window.__squidPreview.rigs[1].group.position.y-y)>.02,startY);assert.deepEqual(errors,[]);
 console.log('PASS: MonsterSprite UVs/scale, synchronized A/B, water tint, 8-direction rotation, mobile, no browser errors');
}finally{await browser.close();}
