import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {buildSlimeSheet,DIRECTIONS,LABELS} from './character.mjs';
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
    const svg=buildSlimeSheet({frame}),raw=await rasterize(svg),source=PNG.sync.read(raw);
    const {out,report}=normalize(source),bytes=PNG.sync.write(out);
    const count=p=>p.data.filter((v,i)=>i%4===3&&v>24).length;
    if(count(source)!==count(out))throw Error('Normalization clipped slime');
    const name=`slime_code_idle_${frame}_8dir`;
    await writeFile(here(`output/${name}.svg`),svg);
    await writeFile(here(`output/${name}.src.png`),raw);
    await writeFile(here(`output/${name}.png`),bytes);
    if(preview){await writeFile(game(`art_src/${name}.src.png`),raw);await writeFile(game(`assets/nonhumanoids/${name}.png`),bytes);}
    frames.push({frame,output:`${name}.png`,normalization:report,bytes,reference:await readFile(game(`assets/nonhumanoids/slime_idle_${frame}_8dir.png`))});
  }
  const uri=b=>`data:image/png;base64,${b.toString('base64')}`;
  const board=`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="790"><rect width="1160" height="790" fill="#eee9df"/><text x="30" y="42" font-size="25" font-family="sans-serif" fill="#263f4e">SLIME / 8 DIRECTIONS / TWO IDLE POSES</text>${frames.map((f,row)=>[f.reference,f.bytes].map((b,col)=>`<g transform="translate(${24+col*570} ${70+row*350})"><rect width="542" height="328" rx="15" fill="#d8e1df"/><text x="15" y="30" fill="#263f4e" font-size="17" font-family="sans-serif">${col?'CODE':'REFERENCE'} / ${f.frame.toUpperCase()}</text><image href="${uri(b)}" x="15" y="48" width="512" height="256"/></g>`).join('')).join('')}</svg>`;
  await writeFile(here('output/comparison.png'),await rasterize(board));
  await writeFile(here('output/manifest.json'),JSON.stringify({id:'slime',name:'スライム',version:1,status:'prototype',source:'../character.mjs',format:'game-monster-billboard',cellSize:128,columns:4,rows:2,directions:DIRECTIONS,labels:LABELS,anchor:{centerU:.494,bottomFromTop:.945},frames:frames.map(({bytes,reference,...f})=>f),runtime:{class:'MonsterSprite',scale:.9,tint:0xffffff,yOffset:0,interval:.38,uv:{uMin:.02,uMax:.98,vMin:.02,vMax:.98}},references:['slime_idle_a_8dir.png','slime_idle_b_8dir.png'].map(p=>`dqb3-tsugumono-ch1-3/assets/nonhumanoids/${p}`),futureTarget:{monsterId:'slime',sharedBy:'boss',note:'boss uses the same sheets with scale 2.6 and tint 0xff8f8f; not replaced in this prototype'}},null,2)+String.fromCharCode(10));
  console.log('Slime exported: 8 directions x 2 poses; no normalization loss; original game assets unchanged.');
}finally{await browser.close();}
