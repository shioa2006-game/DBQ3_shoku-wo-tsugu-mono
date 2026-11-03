export class WaveDefense {
  constructor(monsterManager, world, spawnRaider, sounds) {
    this.spawnRaider = spawnRaider;
    this.sounds = sounds;
    this.monsters = monsterManager;
    this.world = world;
    this.active = false;
    this.wave = 0;
    this.bannerHp = 100;
    this.bannerMaxHp = 100;
    this.interWave = 0;
    this.onEnd = null;
    this.boss = null;
    this.cfg = null;
    // 守る対象（isBanner 付きの仮想エンティティ）。null のままなら main が
    // bannerEntity（職業の旗）を使う。
    this.targetEntity = null;
  }

  start(config) {
    this.cfg = config;
    // pos は {x,y,z} のプレーンオブジェクトで足りる（distanceTo の引数側と
    // 座標参照にしか使われない）。
    this.targetEntity = this.cfg.target
      ? { pos: { x: this.cfg.target.x, y: this.cfg.target.y, z: this.cfg.target.z }, halfW: this.cfg.target.halfW, dead: false, isBanner: true }
      : null;
    this.active = true;
    this.wave = 0;
    this.bannerMaxHp = this.cfg.targetHp ?? 100; // 守る対象のHP（章ごとに可変）
    this.bannerHp = this.bannerMaxHp;
    this.interWave = 2.5;
    this.boss = null;
    this.sounds.raidHorn();
  }

  spawnWave(index) {
    const def = this.cfg.waves[index];
    let gateIndex = 0;
    for (const [type, count] of def.spawns) {
      for (let i = 0; i < count; i += 1) {
        // 章専用の出現位置を持つ敵（例：船の周りの触手）は通常の湧き口を消費しない。
        if (this.spawnSpecial?.(type, i)) continue;
        const gate = this.cfg.gates[gateIndex % this.cfg.gates.length];
        gateIndex += 1;
        const monster = this.spawnRaider(this.monsters, this.world, type, gate);
        if (monster.def.boss) this.boss = monster;
      }
    }
    return def.label;
  }

  damageBanner(amount) {
    if (!this.active) return;
    this.bannerHp = Math.max(0, this.bannerHp - amount);
    this.sounds.hurt();
    if (this.bannerHp <= 0) this.finish(false);
  }

  update(dt, ui) {
    if (!this.active) return;
    if (this.interWave > 0) {
      // 合図を待つ防衛では、許可された波だけ予告のカウントダウンを進める。
      if (this.cfg?.canStartWave?.(this.wave) === false) return;
      this.interWave -= dt;
      if (this.interWave <= 0) {
        const label = this.spawnWave(this.wave);
        ui.toast(`⚔️ ${label}が やってきた！`);
        this.sounds.raidHorn();
      }
      return;
    }
    this.onWaveUpdate?.(ui);
    if (this.monsters.count(true) === 0) {
      this.wave += 1;
      if (this.wave >= this.cfg.waves.length) {
        this.finish(true);
      } else {
        this.interWave = 4;
        ui.toast(`🛡️ ${this.cfg.waves[this.wave].label}が せまっている……！`);
      }
    }
  }

  finish(win) {
    this.active = false;
    this.targetEntity = null;
    // Clear any leftover raiders.
    for (const m of [...this.monsters.monsters]) {
      if (m.raid) this.monsters.remove(m);
    }
    this.boss = null;
    if (this.onEnd) this.onEnd(win);
  }
}
