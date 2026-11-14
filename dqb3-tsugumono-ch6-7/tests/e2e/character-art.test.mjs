// Studioのキャラクターが、頭胴の分離層・リグ設定で8方向・歩行・道具・A/B切替まで動くことを確かめる。
// 人物（9人）: 主人公（hero2）、旅の仲間のミナ・ゴンタ・ワタリ、招聘する旧友のピノ・ベルク、ダーマの住民のスズハ・アサギ・ガンゾウ。
// 魔物（7種）: 岩角ヤギ・小岩ガニ・ガーゴイル・岩砕きのガーゴイルは自分の画像、山ねずみ・洞窟こうもり・大岩ガニは色替え。
//   ガーゴイルは地上と飛行、岩砕きは地上・飛行・攻撃の絵を持ち、状態で切り替える。
// 三頭魔竜ヴァルガ: 設定がStudioの頭・開口頭・胴の画像を指し、どれも 512×256 の8方向シートで、戦いのリグがそれを使うこと。
// CHARACTER_ART_SCREENSHOTS=1 で work/character-migration/ に8方向の一覧画像を書き出す。
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {launchBrowser,openGame,newGame,waitForCond,pauseLoop} from '../helpers.mjs';
const villagers=['mina','gonta','watari','pino','belk','suzuha','asagi','ganzou'];
// 魔物の種類 → 絵の名前（main: 地上、flight: 飛行、attack: 攻撃）。
const monsterArt={
 rock_goat:{main:'rockhorn_goat'},
 mountain_rat:{main:'field_rat'},
 rock_crab:{main:'small_rock_crab'},
 cave_bat:{main:'night_bat'},
 great_rock_crab:{main:'small_rock_crab'},
 gargoyle:{main:'gargoyle_ground',flight:'gargoyle_flight'},
 gargoyle_crusher:{main:'gargoyle_heavy_ground',flight:'gargoyle_heavy_flight',attack:'gargoyle_heavy_attack'},
};
const monsters=Object.keys(monsterArt);
// 岩砕きの地上の絵は、Studioの静止姿勢でA・Bが同じ画像（prototypes/gargoyle-8dir/README.md）。
// 同じ内容の画像はビルドで1つにまとまるので、Bの読み込み先がAのファイルになる。A・Bが同じ絵なのは、これだけ。
const sameAB=[];
for(const art of new Set(Object.values(monsterArt).flatMap(Object.values))){
 const [a,b]=await Promise.all(['a','b'].map(k=>readFile(new URL(`../../assets/nonhumanoids/${art}_code_idle_${k}_8dir.png`,import.meta.url))));
 if(a.equals(b))sameAB.push(art);
}
assert.deepEqual(sameAB,['gargoyle_heavy_ground'],'A・Bが同じ絵なのは、岩砕きの地上（静止姿勢）だけ');
const scales={rock_goat:1.05,mountain_rat:.8,rock_crab:.95,cave_bat:.85,great_rock_crab:3,gargoyle:1,gargoyle_crusher:1.3};
// 色替えは、ほかの魔物と同じ画像に色を掛ける。それ以外は画像そのままの色。
const recolored=['mountain_rat','cave_bat','great_rock_crab'];
// この編で人物が手に持つ道具（鉄・石・木のハンマー、鉄・石の剣）。
const tools=['hammer_iron','sword_iron','hammer_wood','hammer_stone','sword_stone'];
const directions=['front','front_left','left','back_left','back','back_right','right','front_right'];
const profiles={};
for(const id of ['hero2',...villagers]) profiles[id]=(await import(`../../src/content/rig-profiles/${id}.mjs`))[`${id.toUpperCase()}_RIG_PROFILE`];
// 三頭魔竜ヴァルガ: 設定がStudioの頭・開口頭・胴の画像を指し、どれも 512×256 の8方向シートであること。
const {VARUGA_CONFIG}=await import('../../src/entities/dragon-configs.js');
const {PNG}=(await import('pngjs')).default;
const varugaSheets=[['headUrl','varuga_code_head_8dir'],['openHeadUrl','varuga_code_head_open_8dir'],['bodyUrl','varuga_code_body_8dir']];
for(const [key,name] of varugaSheets){
 assert.match(VARUGA_CONFIG[key],new RegExp(`${name}\\.png$`),`ヴァルガの ${key} はStudioのシート`);
 const png=PNG.sync.read(await readFile(new URL(VARUGA_CONFIG[key])));assert.deepEqual([png.width,png.height],[512,256]);
}
assert.equal(VARUGA_CONFIG.heads.length,3,'ヴァルガの頭は三つ');
const browser=await launchBrowser(),errors=[];
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await openGame(page,{collectErrors:errors});await newGame(page);
 await pauseLoop(page,true); // テストの間だけ: 姿勢を決まった値で確かめ、撮影の間に戦闘が起きないようにする。
 await page.evaluate(({villagers,monsters})=>{
  const g=window.__game;
  // 前庭に並べる（すでに島にいる人はそのまま使う）。
  villagers.forEach((id,i)=>g.spawnVillager(id,24.5+i*1.5,42.5));
  monsters.forEach((id,i)=>g.monsters.spawn(id,23.5+i*2.5,16.1,46.5));
 },{villagers,monsters});
 await waitForCond(page,({villagers,monsters})=>{
  const g=window.__game;
  const rigs=[g.player.rig,...villagers.map(id=>g.villager(id).rig)];
  return rigs.every(r=>[r.headTexture,r.bodyTexture].every(t=>t.image?.naturalWidth>0))&&monsters.every(id=>{
   const m=g.monsters.monsters.find(m=>m.type===id);
   return Object.values(m.sprites).every(s=>[s.texA,s.texB].every(t=>t.image?.naturalWidth>0));
  });
 },{villagers,monsters},{label:'all production character layers and A/B textures'});
 const result=await page.evaluate(({villagers,monsters,directions,tools})=>{
  const g=window.__game;
  const people=[g.player,...villagers.map(id=>g.villager(id))];
  const human=people.map((e,i)=>{
   const r=e.rig;
   const poses=directions.map(direction=>{
    r.setDirection(direction);r.animTime=0;r.update(0,false);
    const rest=r.head.position.y;
    r.walkTime=0;r.update(.1,true);const leg=r.leftLeg.quaternion.toArray();
    r.update(.1,true);const walks=r.leftLeg.quaternion.toArray().some((v,j)=>Math.abs(v-leg[j])>1e-6);
    const attacks=tools.map(tool=>{
     r.setTool(tool);r.startAttack();r.update(.05,false);
     const pose=r.tool.quaternion.toArray();r.update(.15,false);
     return r.attacking&&pose.some((v,j)=>Math.abs(v-r.tool.quaternion.toArray()[j])>1e-6)&&r.tool.position.toArray().every(Number.isFinite);
    });
    r.setTool(null);r.attackT=0;r.animTime=0;r.update(0,false);
    return {direction,rest,walks,attacks,headUV:[...r.headTexture.offset,...r.headTexture.repeat],bodyUV:[...r.bodyTexture.offset,...r.bodyTexture.repeat]};
   });
   return {id:i?villagers[i-1]:'hero2',tuning:r.tuning,head:r.headTexture.image.src,body:r.bodyTexture.image.src,size:[r.headTexture.image.width,r.headTexture.image.height],bodySize:[r.bodyTexture.image.width,r.bodyTexture.image.height],poses};
  });
  const mobs=monsters.map(id=>{
   const m=g.monsters.monsters.find(m=>m.type===id);
   const sheets=Object.keys(m.sprites).map(name=>{
    // 状態の絵へ切り替えると、その1枚だけが表示される。
    m.setSprite(name);const s=m.sprites[name];
    const shown=Object.keys(m.sprites).filter(n=>m.sprites[n].group.visible);
    const poses=directions.map(direction=>{
     s.direction=direction;s.applyWindow();s.flipTimer=0;s.usingA=true;s.material.map=s.texA;
     s.update(.38);const b=s.material.map===s.texB;s.update(.38);
     return {direction,uv:[...s.texA.offset,...s.texA.repeat],cycle:b&&s.material.map===s.texA};
    });
    return {name,current:m.sprite===s,shown,a:s.texA.image.src,b:s.texB.image.src,size:[s.texA.image.width,s.texA.image.height],scale:s.mesh.scale.x,tint:s.material.color.getHex(),poses};
   });
   m.setSprite('main');
   return {id,defTint:m.def.tint,sheets};
  });
  return {human,mobs};
 },{villagers,monsters,directions,tools});
 for(const h of result.human){
  assert.deepEqual(h.tuning,profiles[h.id],`${h.id}: Studioから写したリグ設定`);
  assert.match(h.head,new RegExp(`${h.id}_code_head_layer_8dir`));
  assert.match(h.body,new RegExp(`${h.id}_code_torso_layer_8dir`));
  assert.deepEqual(h.size,[512,256]);assert.deepEqual(h.bodySize,[512,256]);
  const base=h.poses[0].rest-(profiles[h.id].headLiftByDirection.front??0);
  for(const [i,p] of h.poses.entries()){
   assert.ok(Math.abs(p.rest-base-profiles[h.id].headLiftByDirection[p.direction])<1e-8,`${h.id}/${p.direction}: 頭の高さ`);
   assert.ok(p.walks&&p.attacks.every(Boolean),`${h.id}/${p.direction}: 歩行と道具の振り`);
   assert.ok(p.headUV.every(Number.isFinite)&&p.bodyUV.every(Number.isFinite));
   assert.ok(Math.abs(p.headUV[0]-(i%4+.494-.34)/4)<1e-8,`${h.id}/${p.direction}: 頭の向きのUV`);
   assert.ok(Math.abs(p.bodyUV[3]-.245)<1e-8,`${h.id}/${p.direction}: 胴の層は襟まで含む`);
  }
 }
 for(const m of result.mobs){
  assert.deepEqual(m.sheets.map(s=>s.name).sort(),Object.keys(monsterArt[m.id]).sort(),`${m.id}: 絵の種類`);
  for(const s of m.sheets){
   const art=monsterArt[m.id][s.name];
   assert.match(s.a,new RegExp(`/${art}_code_idle_a_8dir`),`${m.id}/${s.name}: 絵A`);
   assert.match(s.b,new RegExp(`/${art}_code_idle_${sameAB.includes(art)?'[ab]':'b'}_8dir`),`${m.id}/${s.name}: 絵B`);
   assert.deepEqual(s.size,[512,256]);
   assert.ok(s.current,`${m.id}/${s.name}: 絵を切り替えられる`);assert.deepEqual(s.shown,[s.name],`${m.id}/${s.name}: 表示するのは1枚だけ`);
   assert.equal(s.scale,scales[m.id]);assert.equal(s.tint,m.defTint);
   if(recolored.includes(m.id))assert.notEqual(s.tint,0xffffff,`${m.id}: 色替え`);else assert.equal(s.tint,0xffffff,`${m.id}: 画像そのままの色`);
   for(const [j,p] of s.poses.entries()){
    assert.ok(p.cycle,`${m.id}/${s.name}/${p.direction}: A→B→A`);assert.ok(Math.abs(p.uv[0]-(j%4+.02)/4)<1e-8);assert.ok(Math.abs(p.uv[1]-(1-Math.floor(j/4)+.02)/2)<1e-8);
   }
  }
 }
 // ヴァルガの戦いのリグが、三つの頭・開口頭・胴にStudioのシートを使う。
 await page.evaluate(()=>window.__game.startVaruga('final'));
 const varuga=await waitForCond(page,()=>{
  const rig=window.__game.varuga.rig;
  const images=[rig.body.texA.image,rig.openHeadTexture.image,...rig.heads.map(h=>h.sprite.texA.image)];
  if(!images.every(img=>img?.naturalWidth>0))return false;
  return {body:rig.body.texA.image.src,open:rig.openHeadTexture.image.src,heads:rig.heads.map(h=>h.sprite.texA.image.src),
   sizes:images.map(img=>[img.naturalWidth,img.naturalHeight]),necks:rig.heads.map(h=>h.neck.length),wings:rig.wings.length,
   scale:[rig.body.mesh.scale.x,...rig.heads.map(h=>h.sprite.mesh.scale.x)]};
 },undefined,{label:'Varuga head, open head and body sheets'});
 await page.evaluate(()=>window.__game.varuga.abort());
 assert.match(varuga.body,/\/varuga_code_body_8dir/);assert.match(varuga.open,/\/varuga_code_head_open_8dir/);
 assert.equal(varuga.heads.length,3);for(const src of varuga.heads)assert.match(src,/\/varuga_code_head_8dir/);
 for(const size of varuga.sizes)assert.deepEqual(size,[512,256]);
 assert.deepEqual(varuga.necks,[VARUGA_CONFIG.neckSegments,VARUGA_CONFIG.neckSegments,VARUGA_CONFIG.neckSegments]);assert.equal(varuga.wings,2);
 assert.deepEqual(varuga.scale,[VARUGA_CONFIG.bodyScale,VARUGA_CONFIG.headScale,VARUGA_CONFIG.headScale,VARUGA_CONFIG.headScale]);
 if(process.env.CHARACTER_ART_SCREENSHOTS==='1'){
  const out=new URL('../../work/character-migration/',import.meta.url);await mkdir(out,{recursive:true});
  for(const group of ['humans','monsters']){
   const data=await page.evaluate(({group,villagers,monsters,directions})=>{
    const g=window.__game,board=document.createElement('canvas');board.width=1600;board.height=1440;
    const ctx=board.getContext('2d');ctx.fillStyle='#e6e9e2';ctx.fillRect(0,0,board.width,board.height);
    g.renderer.setPixelRatio(1);g.renderer.setSize(1280,540,false);
    for(const [i,direction] of directions.entries()){
     const scene=new g.scene.constructor();scene.background=g.scene.background.clone().setHex(0xdce4de);
     scene.add(g.hemiLight.clone(),g.sunLight.clone());
     const ids=group==='humans'?['hero2',...villagers]:monsters;
     const spacing=group==='humans'?.85:1.9;
     for(const [j,id] of ids.entries()){
      const e=id==='hero2'?g.player:villagers.includes(id)?g.villager(id):g.monsters.monsters.find(m=>m.type===id);
      if(e.rig){e.rig.setDirection(direction);e.rig.setTool(null);e.rig.attackT=0;e.rig.animTime=0;e.rig.update(0,false);}
      else {e.sprite.direction=direction;e.sprite.applyWindow();e.sprite.material.map=e.sprite.texA;}
      const clone=e.root.clone(true);clone.position.set((j-(ids.length-1)/2)*spacing,0,0);clone.rotation.set(0,0,0);
      // 人物・魔物の実体はワールドのカメラの向きを持ったままなので、検査用のカメラ（Z向き）へ向け直す。
      const visual=clone.children[e.rig?0:e.root.children.indexOf(e.sprite.group)];visual.rotation.set(0,0,0);
      if(e.sprite)visual.children[0].rotation.set(0,0,0);
      if(e.nameLabel)clone.children[e.root.children.indexOf(e.nameLabel)].visible=false;
      if(e.marker)clone.children[e.root.children.indexOf(e.marker)].visible=false;
      scene.add(clone);
     }
     const camera=g.camera.clone(),distance=group==='humans'?8:11;
     camera.aspect=1280/540;camera.fov=32;camera.position.set(0,.5+distance*8.2/11.5,distance);camera.lookAt(0,.5,0);camera.updateProjectionMatrix();
     g.renderer.render(scene,camera);
     const x=i%2*800,y=Math.floor(i/2)*360;
     ctx.fillStyle='#263f4e';ctx.font='20px sans-serif';ctx.fillText(`${group} / ${direction}`,x+14,y+24);
     ctx.drawImage(g.renderer.domElement,x,y+30,800,330);
    }
    return board.toDataURL().split(',')[1];
   },{group,villagers,monsters,directions});
   await writeFile(new URL(`${group}-8dir.png`,out),Buffer.from(data,'base64'));
  }
 }
 assert.deepEqual(errors,[]);
 console.log('character-art.test: PASS (9 humans, 7 monsters incl. recolors and flight/attack sheets, Varuga heads/body; all directions, layers, profiles and animation)');
}finally{await browser.close();}
