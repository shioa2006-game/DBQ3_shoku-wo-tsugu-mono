// Dedicated development-page test, using the repository's official browser helper.
// Start the Vite dev server separately; set PROTOTYPE_URL if not on port 5173.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { launchBrowser } from '../helpers.mjs';

export async function checkHumanoidPrototype({character,asset,verifyPose}) {
const root = new URL('../../',import.meta.url);
const png=PNG.sync.read(await readFile(new URL(`assets/humanoids/${asset}_body_8dir.png`,root)));
const raw=PNG.sync.read(await readFile(new URL(`art_src/${asset}_body_8dir.src.png`,root)));
assert.equal(png.width,512);assert.equal(png.height,256);
const solidCount=p=>{let n=0;for(let i=3;i<p.data.length;i+=4)if(p.data[i]>24)n++;return n;};
assert.equal(solidCount(png),solidCount(raw),'Normalization must not clip artwork');
const hashes=[];
for(let cell=0;cell<8;cell++){
  const ox=cell%4*128,oy=Math.floor(cell/4)*128;
  let top=128,bottom=-1,minX=128,maxX=-1,head=0,body=0; const pixels=[];
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const i=((oy+y)*512+ox+x)*4;pixels.push(...png.data.subarray(i,i+4));if(png.data[i+3]<=24)continue;
    top=Math.min(top,y);bottom=Math.max(bottom,y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    if(y<70){head++;assert.ok(x>=19&&x<=107,`head clipped at direction ${cell}: ${x},${y}`);}
    if(y>78){body++;assert.ok(x>=31&&x<=95,`torso clipped at direction ${cell}: ${x},${y}`);}
  }
  assert.ok(head>1000&&body>800,`visible head and torso in direction ${cell}`);
  assert.ok(top>=5&&bottom===121,`vertical anchoring in direction ${cell}`);
  assert.ok((minX+maxX)/2/128>=.46&&(minX+maxX)/2/128<=.53);
  hashes.push(createHash('sha256').update(Buffer.from(pixels)).digest('hex'));
}
assert.equal(new Set(hashes).size,8,'Every direction must have distinct pixels');
console.log('PASS: 8 distinct cells, head/body UV windows, fixed bottom and no normalization loss');

const url=process.env.PROTOTYPE_URL||`http://127.0.0.1:5173/builder_sprite_lab/prototypes/${character}/`;
const browser=await launchBrowser();
try{
  const page=await browser.newPage({viewport:{width:1120,height:980},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__heroPreview?.ready());
  const directions=['front','front_left','left','back_left','back','back_right','right','front_right'];
  const images=[];
  for(const direction of directions){
    await page.locator(`[data-direction="${direction}"]`).click();
    const image=await page.evaluate(()=>{
      const p=window.__heroPreview;p.setState({paused:true,action:'idle',tool:'',water:false});p.pose(0);
      return {state:p.snapshot(),data:p.renderer.domElement.toDataURL('image/png')};
    });
    assert.equal(image.state.character,character);
    assert.deepEqual(image.state.directions,[direction,direction]);
    assert.deepEqual(image.state.textureSizes,[[512,256],[512,256]]);
    if(verifyPose) assert.deepEqual(await page.evaluate(verifyPose),[],`${direction}: idle attachment`);
    images.push({direction,data:image.data});
    for(const action of ['walk','attack'])for(const tool of ['hammer_wood','sword_copper']){
      const valid=await page.evaluate(({action,tool})=>{
        const p=window.__heroPreview;p.setState({action,tool});p.pose(.18);
        return p.rigs.every(r=>r.toolKind===tool&&r.tool.position.toArray().every(Number.isFinite)&&r.headTexture.offset.toArray().every(Number.isFinite));
      },{action,tool});assert.ok(valid,`${direction}: ${action} / ${tool}`);
      if(verifyPose) {
        for(const phase of [.05,.18,.42,.7]) {
          await page.evaluate(time=>{
            const p=window.__heroPreview;p.pose(time);
            if(p.state.action==='attack'){
              p.rigs.forEach(r=>{r.attackT=1-time;r.update(0,false);});
              p.draw();
            }
          },phase);
          assert.deepEqual(await page.evaluate(verifyPose),[],`${direction}: ${action} / ${tool} / ${phase}`);
        }
      }
    }
  }
  await page.evaluate(()=>{const p=window.__heroPreview;p.setState({direction:'front',action:'idle',tool:'',water:true});p.pose(0);});
  assert.ok(await page.evaluate(()=>window.__heroPreview.rigs.every(r=>r._submersion===1)));
  await page.evaluate(()=>{const p=window.__heroPreview;p.setState({water:false});p.pose(0);});
  await page.screenshot({path:fileURLToPath(new URL(`prototypes/${character}/preview.png`,root)),fullPage:true});
  const board=await page.evaluate(async images=>{
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1200;const c=canvas.getContext('2d');
    c.fillStyle='#efeee6';c.fillRect(0,0,1200,1200);c.font='bold 24px sans-serif';c.fillStyle='#263f4e';c.fillText('EXISTING RIG / REFERENCE + CODE',30,40);
    for(let i=0;i<images.length;i++){
      const image=new Image();image.src=images[i].data;await image.decode();const x=i%2*600,y=70+Math.floor(i/2)*280;
      c.font='16px sans-serif';c.fillStyle='#263f4e';c.fillText(images[i].direction,x+24,y+18);
      c.drawImage(image,x+10,y+28,580,232);
    }return canvas.toDataURL('image/png').split(',')[1];
  },images);
  await writeFile(new URL(`prototypes/${character}/rig-8dir.png`,root),Buffer.from(board,'base64'));
  // Equal-size close-ups retain the actual reference/generated proportions.
  // Do not fit each head independently: that would conceal size differences.
  for(const [name,views] of [['profile',['left','right']],['front-quarter',['front_left','front_right']],['back-quarter',['back_left','back_right']]]) {
  const profiles=await page.evaluate(views=>{
    const p=window.__heroPreview,source=p.renderer.domElement;
    const board=document.createElement('canvas');board.width=720;board.height=820;
    const c=board.getContext('2d');c.fillStyle='#efeee6';c.fillRect(0,0,720,820);
    c.fillStyle='#263f4e';c.font='20px sans-serif';
    c.fillText('REFERENCE',24,30);c.fillText('CODE',384,30);
    for(const [row,direction] of views.entries()){
      p.setState({direction,paused:true,action:'idle',tool:'',water:false});p.pose(0);
      for(const [col,rig] of p.rigs.entries()){
        const center=rig.group.position.clone();center.y=.57;center.project(p.camera);
        // Each model is drawn in its own half of the canvas (one view per model).
        const sw=source.height*.50,sh=source.height*.60,half=source.width/2;
        c.drawImage(source,col*half+(center.x+1)/2*half-sw/2,(1-center.y)/2*source.height-sh/2,sw,sh,col*360+20,50+row*385,320,384);
      }
      c.fillText(direction,24,72+row*385);
    }
    return board.toDataURL('image/png').split(',')[1];
  },views);
  await writeFile(new URL(`prototypes/${character}/${name}-comparison.png`,root),Buffer.from(profiles,'base64'));
  }
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No mobile horizontal overflow');
  assert.deepEqual(errors,[],'No runtime or texture loading errors');
  console.log('PASS: 8 directions × idle/walk/attack; hammer/sword; water tint; mobile layout; no browser errors');
}finally{await browser.close();}

}
