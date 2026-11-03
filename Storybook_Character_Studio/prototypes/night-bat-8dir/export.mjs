import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {buildBatSheet,DIRECTIONS,LABELS} from './character.mjs';
import {launchBrowser} from '../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';
import {normalize} from '../../../dqb3-tsugumono-ch1-3/tools/normalize_sheet.mjs';
const require=createRequire(new URL('../../../dqb3-tsugumono-ch1-3/package.json',import.meta.url));
const {PNG}=require('pngjs');
const here=p=>new URL(p,import.meta.url),game=p=>new URL(`../../../dqb3-tsugumono-ch1-3/${p}`,import.meta.url);
const preview=process.argv.includes('--preview-game');
if(process.argv.slice(2).some(a=>a!=='--preview-game'))throw Error('Unknown argument');
await mkdir(here('output/'),{recursive:true});
const browser=await launchBrowser();
try{
  const page=await browser.newPage();
  const rasterize=async svg=>Buffer.from(await page.evaluate(async svg=>{
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.toDataURL().split(',')[1];}finally{URL.revokeObjectURL(url);}
  },svg),'base64');
  const frames=[];
  for(const frame of ['a','b']){
    const svg=buildBatSheet({frame}),raw=await rasterize(svg),source=PNG.sync.read(raw);
    const {out,report}=normalize(source);
    // Keep the source game's airborne framing: a uniform 14px lift after
    // official normalization, never a per-direction rig correction.
    for(let row=0;row<2;row++){
      const start=row*128*out.width*4,end=(row+1)*128*out.width*4,shift=14*out.width*4;
      out.data.copyWithin(start,start+shift,end);out.data.fill(0,end-shift,end);
    }
    const bytes=PNG.sync.write(out);
    const count=p=>p.data.filter((v,i)=>i%4===3&&v>24).length;
    if(count(source)!==count(out))throw Error('Normalization clipped bat');
    const name=`night_bat_code_idle_${frame}_8dir`;
    await writeFile(here(`output/${name}.svg`),svg);
    await writeFile(here(`output/${name}.src.png`),raw);
    await writeFile(here(`output/${name}.png`),bytes);
    if(preview){await writeFile(game(`art_src/${name}.src.png`),raw);await writeFile(game(`assets/nonhumanoids/${name}.png`),bytes);}
    frames.push({frame,output:`${name}.png`,normalization:report,bytes,reference:await readFile(here(`../../references/nonhumanoids/night_bat_idle_${frame}_8dir.png`))});
  }
  const uri=b=>`data:image/png;base64,${b.toString('base64')}`;
  const board=`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="790"><rect width="1160" height="790" fill="#eee9df"/><text x="30" y="42" font-size="25" font-family="sans-serif" fill="#263f4e">NIGHT BAT / 8 DIRECTIONS / TWO IDLE POSES</text>${frames.map((f,row)=>[f.reference,f.bytes].map((b,col)=>`<g transform="translate(${24+col*570} ${70+row*350})"><rect width="542" height="328" rx="15" fill="#d8e1df"/><text x="15" y="30" fill="#263f4e" font-size="17" font-family="sans-serif">${col?'CODE':'REFERENCE'} / ${f.frame.toUpperCase()}</text><image href="${uri(b)}" x="15" y="48" width="512" height="256"/></g>`).join('')).join('')}</svg>`;
  await writeFile(here('output/comparison.png'),await rasterize(board));
  await writeFile(here('output/manifest.json'),JSON.stringify({id:'bat',name:'おおこうもり',version:1,status:'prototype',source:'../character.mjs',format:'game-monster-billboard',cellSize:128,columns:4,rows:2,directions:DIRECTIONS,labels:LABELS,anchor:{centerU:.494,bottomFromTop:107/128,flightShiftPixels:-14},frames:frames.map(({bytes,reference,...f})=>f),runtime:{class:'MonsterSprite',scale:.85,tint:0xffffff,yOffset:.4,interval:.38,previewMotion:{amplitude:.06,period:.76,phase:'negative-sine',fixedPoses:'stationary',note:'Preview only; reconcile with Monster.updateBat flight AI at migration'},uv:{uMin:.02,uMax:.98,vMin:.02,vMax:.98}},references:['night_bat_idle_a_8dir.png','night_bat_idle_b_8dir.png'].map(p=>`references/nonhumanoids/${p}`),futureTarget:{monsterId:'bat',chapter:1,note:'Flying monster; original sheets and monster definition are not replaced'}},null,2)+String.fromCharCode(10));
  console.log('Night bat exported: 8 directions x 2 poses; no normalization loss; original game assets unchanged.');
}finally{await browser.close();}
