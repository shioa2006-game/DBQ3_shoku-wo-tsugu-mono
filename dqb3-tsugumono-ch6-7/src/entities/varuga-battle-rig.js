import { VarugaRig } from "./varuga-rig.js";

// 戦闘用のヴァルガのリグ。Studio から写した VarugaRig（varuga-rig.js）は変えずに、
// ゲームの戦いで要る動きだけをここで足す:
//   - 頭ごとの追加の姿勢（初襲来で、噛みつきに首を低く降ろす）
//   - 倒した頭は、噛みつき・火炎の動作をしない（垂れたまま）
//   - 霧へ崩れる演出（全体を縮めて暗くする）
export class VarugaBattleRig extends VarugaRig {
  constructor(config) {
    super(config);
    // 頭ごとの追加の姿勢 { forward, down, side }（ワールド単位）。
    this.extra = config.heads.map(() => ({ forward: 0, down: 0, side: 0 }));
    this.fade = 0; // 0 = 通常、1 = 霧へ崩れきった
  }

  headWorldPos(i, origin) {
    const target = super.headWorldPos(i, origin);
    const { fx, fz, rx, rz } = this.basis();
    const pose = this.poseState;
    // 倒した頭は動作の分を打ち消す（Studio のリグが足した forward・down を戻す）。
    if (this.heads[i].dead && pose) {
      const action = pose.heads[i];
      target.x -= fx * action.forward;
      target.z -= fz * action.forward;
      target.y += action.down;
      return target;
    }
    const e = this.extra[i];
    target.x += fx * e.forward + rx * e.side;
    target.z += fz * e.forward + rz * e.side;
    target.y -= e.down;
    return target;
  }

  update(dt, origin, cameraYaw, moving) {
    super.update(dt, origin, cameraYaw, moving);
    if (this.fade > 0) {
      const s = Math.max(0.05, 1 - this.fade * 0.85);
      this.group.scale.setScalar(s);
      // 縮めても足もとの位置が動かないよう、原点のずれを戻す。
      this.group.position.set(origin.x * (1 - s), (origin.y - this.config.hover) * (1 - s), origin.z * (1 - s));
    }
  }

  // 被弾の色（頭 i を赤く／元へ）。倒した頭は灰色のまま。
  setHeadFlash(i, on) {
    const h = this.heads[i];
    if (h.dead) return;
    h.sprite.material.color.setHex(on ? 0xff5050 : (this.config.tint ?? 0xffffff));
  }

  // 霧へ崩れる（0..1）。全体を黒くする。
  setFade(t) {
    this.fade = Math.max(0, Math.min(1, t));
    const c = Math.round(255 * (1 - this.fade * 0.9));
    const hex = (c << 16) | (c << 8) | c;
    this.body.material.color.setHex(hex);
    for (const h of this.heads) h.sprite.material.color.setHex(h.dead ? Math.min(hex, 0x777777) : hex);
  }
}
