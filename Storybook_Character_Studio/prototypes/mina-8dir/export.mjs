import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { buildMinaSheet, DIRECTIONS, LABELS } from './character.mjs';
import { MINA_RIG_PROFILE } from './rig-profile.mjs';
import { launchBrowser } from '../../../dqb3-tsugumono-ch1-3/tests/helpers.mjs';
import { normalize } from '../../../dqb3-tsugumono-ch1-3/tools/normalize_sheet.mjs';

const require=createRequire(new URL('../../../dqb3-tsugumono-ch1-3/package.json',import.meta.url));
const {PNG}=require('pngjs');
const here=name=>new URL(name,import.meta.url);
const game=name=>new URL(`../../../dqb3-tsugumono-ch1-3/${name}`,import.meta.url);
const previewGame=process.argv.includes('--preview-game');
const unknown=process.argv.slice(2).filter(arg=>arg!=='--preview-game');
if(unknown.length)throw Error(`Unknown arguments: ${unknown.join(', ')}`);
await mkdir(here('output/'),{recursive:true});
const svg=buildMinaSheet();
const browser=await launchBrowser();
try {
  const page=await browser.newPage();
  const rasterize=async source=>Buffer.from(await page.evaluate(async svg=>{
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try {
      const image=new Image();image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      canvas.getContext('2d').drawImage(image,0,0);
      return canvas.toDataURL('image/png').split(',')[1];
    } finally {URL.revokeObjectURL(url);}
  },source),'base64');
  const raw=await rasterize(svg);
  const {out,report}=normalize(PNG.sync.read(raw));
  const normalized=PNG.sync.write(out);
  // Reuse the combined sheet's normalization for every part. Normalizing a head
  // on its own would align its chin/hair hem to the belt baseline and separate it.
  const parts={};
  for(const part of ['head','torso']) {
    const partSvg=buildMinaSheet({part});
    const partRaw=await rasterize(partSvg),source=PNG.sync.read(partRaw);
    const target=new PNG({width:512,height:256});
    for(const {row,col,dx,dy} of report) {
      for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
        const si=((row*128+y)*512+col*128+x)*4;
        if(source.data[si+3]<=24)continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||nx>=128||ny<0||ny>=128)throw Error(`${part}: normalization clips artwork`);
        const di=((row*128+ny)*512+col*128+nx)*4;
        source.data.copy(target.data,di,si,si+4);
      }
    }
    const name=`mina_code_${part}_layer_8dir`;
    parts[part]=`${name}.png`;
    await writeFile(here(`output/${name}.svg`),partSvg);
    await writeFile(here(`output/${name}.src.png`),partRaw);
    const bytes=PNG.sync.write(target);
    await writeFile(here(`output/${name}.png`),bytes);
    if(previewGame) {
      await writeFile(game(`art_src/${name}.src.png`),partRaw);
      await writeFile(game(`assets/humanoids/${name}.png`),bytes);
    }
  }
  const reference=await readFile(game('assets/humanoids/village_girl_body_8dir.png'));
  await writeFile(here('output/mina-code.svg'),svg);
  await writeFile(here('output/mina_code_body_8dir.src.png'),raw);
  await writeFile(here('output/mina_code_body_8dir.png'),normalized);
  const uri=bytes=>`data:image/png;base64,${bytes.toString('base64')}`;
  const board=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="920" viewBox="0 0 1200 920">
    <rect width="1200" height="920" rx="24" fill="#eee9df"/>
    <text x="48" y="55" font-family="sans-serif" font-size="27" font-weight="700" fill="#203344">MINA / FARM VILLAGER / 8 DIRECTIONS</text>
    <text x="48" y="86" font-family="sans-serif" font-size="16" fill="#60717b">Chestnut bob · brown eyes · ivory collar · teal blouse · brass buttons</text>
    ${[reference,normalized].map((bytes,i)=>`<g transform="translate(${40+i*570} 112)"><rect width="550" height="322" rx="16" fill="#d8e1df"/><text x="24" y="33" font-family="sans-serif" font-size="18" fill="#203344">${i?'CODE / PROTOTYPE 05':'REFERENCE / VILLAGE GIRL'}</text><image href="${uri(bytes)}" x="19" y="50" width="512" height="256"/></g>`).join('')}
    <text x="48" y="478" font-family="sans-serif" font-size="18" fill="#203344">GENERATED / ENLARGED</text>
    <image href="${uri(normalized)}" x="200" y="502" width="800" height="400"/>
    </svg>`;
  await writeFile(here('output/comparison.png'),await rasterize(board));
  await writeFile(here('output/manifest.json'),JSON.stringify({
    id:'mina',name:'ミナ',role:'農家の少女',version:5,status:'prototype',
    source:'../character.mjs',reference:'dqb3-tsugumono-ch1-3/assets/humanoids/village_girl_body_8dir.png',
    format:'game-humanoid-bust',cellSize:128,columns:4,rows:2,directions:DIRECTIONS,labels:LABELS,
    anchor:{centerU:.494,bottomFromTop:.945},normalization:report,
    output:'mina_code_body_8dir.png',runtime:'HumanoidRig with separate headSheetUrl/bodySheetUrl; limbs and equipment supplied by the game',
    runtimeSheets:{headSheetUrl:parts.head,bodySheetUrl:parts.torso},
    rigColors:{sleeve:0x2f6f6d,hand:0xeec39a,pants:0x8a5a33,boot:0x5a3a24,headBack:0x8a5a33,bodyBack:0x265755},
    rigTuning:MINA_RIG_PROFILE,rigProfile:'../rig-profile.mjs',
    futureTarget:{npcId:'mina',sheet:'assets/humanoids/village_girl_body_8dir.png'},
  },null,2)+'\n');
  if(previewGame) {
    await mkdir(game('prototypes/mina/'),{recursive:true});
    await writeFile(game('prototypes/mina/rig-profile.mjs'),await readFile(here('rig-profile.mjs')));
    await writeFile(game('art_src/mina_code_body_8dir.src.png'),raw);
    await writeFile(game('assets/humanoids/mina_code_body_8dir.png'),normalized);
  }
  console.log(`Mina exported to Studio${previewGame?' and isolated game preview':''}. Original NPC asset unchanged.`);
  console.log(JSON.stringify(report));
} finally {await browser.close();}
