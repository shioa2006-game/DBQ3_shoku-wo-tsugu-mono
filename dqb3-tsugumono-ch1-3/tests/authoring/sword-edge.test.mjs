import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { launchBrowser } from '../helpers.mjs';

const base=process.env.PROTOTYPE_BASE||'http://127.0.0.1:5175/builder_sprite_lab/prototypes/';
const browser=await launchBrowser();
try {
  const page=await browser.newPage({viewport:{width:1120,height:980},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const character of ['adventurer','mina','pino','inaho','gonta','jinbei','watari']) {
    await page.goto(`${base}${character}/`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.__heroPreview?.ready());
    const result=await page.evaluate(async()=>{
      const THREE=await import('../../node_modules/three/build/three.module.js');
      const p=window.__heroPreview;
      const facing={front:[0,1],front_left:[-.707,.707],left:[-1,0],back_left:[-.707,-.707],back:[0,-1],back_right:[.707,-.707],right:[1,0],front_right:[.707,.707]};
      // Pre-fix grip-to-tip trajectory: only the blade's axial roll may change.
      const angles={front:-Math.PI/2,front_left:-Math.PI/4,left:0,back_left:0,back:-Math.PI/2,back_right:-Math.PI*3/4,right:Math.PI,front_right:-Math.PI*3/4};
      let checked=0;const failures=[];
      for(const [direction,[fx,fz]] of Object.entries(facing))for(const tool of ['sword_copper','sword_stone','hammer_wood','hammer_stone','club']){
        p.setState({direction,tool,paused:true,water:false});
        for(const action of ['idle','walk','attack'])for(const phase of action==='idle'?[0,.7]:Array.from({length:17},(_,i)=>i/16)){
          p.setState({action});p.pose(phase);
          if(action==='attack')p.rigs.forEach(r=>{r.attackT=1-phase;r.update(0,false);});
          p.scene.updateMatrixWorld(true);
          for(const [index,r] of p.rigs.entries()){
            const axis=new THREE.Vector3(-fz,0,fx).normalize();
            const original=new THREE.Quaternion().setFromEuler(new THREE.Euler(.08,0,angles[direction]));
            const chop=r.attackT>0?Math.sin((1-r.attackT)*Math.PI)*1.45:0;
            original.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,chop*.9));
            const lengthAxis=new THREE.Vector3(-1,0,0).applyQuaternion(r.tool.quaternion);
            const originalAxis=new THREE.Vector3(-1,0,0).applyQuaternion(original);
            if(lengthAxis.distanceTo(originalAxis)>1e-7)failures.push({direction,tool,action,phase,index,error:'tip trajectory changed'});
            if(r.tool.position.distanceTo(r.inner.worldToLocal(r.leftArm.userData.toolMount.getWorldPosition(new THREE.Vector3())))>1e-7)failures.push({direction,tool,action,phase,index,error:'grip changed'});
            const phaseSwing=action==='walk'?Math.sin(r.walkTime*11)*.5:Math.sin(r.animTime*2.2)*.05;
            const oldArm=new THREE.Quaternion().setFromAxisAngle(axis,r.attackT>0?chop:-phaseSwing);
            if(1-Math.abs(oldArm.dot(r.leftArm.quaternion))>1e-10)failures.push({direction,tool,action,phase,index,error:'arm swing changed'});
            if(tool.startsWith('sword_')){
              const tangent=new THREE.Vector3().crossVectors(axis,lengthAxis).normalize();
              const edge=new THREE.Vector3(0,1,0).applyQuaternion(r.tool.quaternion);
              if(Math.abs(edge.dot(tangent))<1-1e-7)failures.push({direction,tool,action,phase,index,error:'broad face leads swing'});
            }else if(1-Math.abs(original.dot(r.tool.quaternion))>1e-10){
              failures.push({direction,tool,action,phase,index,error:'non-sword orientation changed'});
            }
            checked++;
          }
        }
      }
      const canvas=document.createElement('canvas');canvas.width=1070;canvas.height=860;
      const c=canvas.getContext('2d');c.fillStyle='#efeee6';c.fillRect(0,0,1070,860);c.fillStyle='#263f4e';c.font='18px sans-serif';
      for(const [i,direction] of ['front','back'].entries()){
        p.setState({direction,tool:'sword_copper',action:'idle'});p.pose(0);
        c.drawImage(p.renderer.domElement,0,i*430+25,1070,405);
        c.fillText(`${direction} / REFERENCE + CODE / EDGE ALIGNED`,20,i*430+21);
      }
      return {checked,failures,image:canvas.toDataURL('image/png').split(',')[1]};
    });
    assert.deepEqual(result.failures,[],`${character}: blade roll / unchanged grip and swing`);
    await writeFile(new URL(`../../prototypes/${character}/sword-edge-preview.png`,import.meta.url),Buffer.from(result.image,'base64'));
    console.log(`PASS ${character}: ${result.checked} poses, cutting edge aligned; original hand, tip path and non-sword orientation preserved`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();}
