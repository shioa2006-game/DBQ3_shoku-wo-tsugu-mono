import { cellKey } from "../core/utils.js";
import { B, BLOCK_DEFS } from "../world/blocks.js";
import { PLACES } from "../world/world.js";
import { SFX } from "../game/sfx.js";

// 戦闘システム: ダメージの適用（モンスター／プレイヤー／住民／旗／ブロック）、
// 回復支援、プレイヤー戦闘不能時のリスポーン。
// モンスターAI・住民AIからは Game のファサード(ctx)経由で呼ばれる。

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.playerDowned = false;
  }

  hurtMonster(m, dmg, fromPos, attack = null) {
    if (m.dead) return;
    // 章ボス（クラーケン）は触手を全て折るまで無敵。
    if (m.shielded) {
      m.onHit();
      this.game.throttledToast("krakenGuard", "🛡️ 触手を先に 断ち切れ！");
      return;
    }
    // 潜航移動中のクラーケン本体には攻撃が届かない。
    if (m.diving) {
      this.game.throttledToast("krakenDive", "🌊 潜った！ 浮上を待って叩け！");
      return;
    }
    if (!m.takeDamage(dmg, fromPos, m.def.boss ? 1.2 : 6, attack)) return;
    m.onHit();
    SFX.hitMonster();
    if (m.hp <= 0) {
      m.dead = true;
      m.deathT = 0;
      SFX.kill();
      for (const [item, min, max] of m.def.drops) {
        const n = min + Math.floor(Math.random() * (max - min + 1));
        for (let i = 0; i < n; i += 1) {
          this.game.spawnDrop(item, 1, m.pos.x, m.pos.y + 0.4, m.pos.z);
        }
      }
    }
  }

  attackEntity(e, dmg, fromPos) {
    const g = this.game;
    if (e.isBanner) {
      g.defense.damageBanner(dmg);
      return;
    }
    // 会話・メニューを閉じた直後の被弾猶予（main.graceT）。世界停止が解けた瞬間に
    // 隣まで来ていた敵から一方的に殴られるのを防ぐ（プレイヤー・住民とも）。
    if (g.graceT > 0) return;
    if (e === g.player) {
      const actual = Math.max(1, dmg - g.player.defense());
      if (g.player.takeDamage(actual, fromPos)) {
        SFX.hurt();
        if (g.player.hp <= 0) this.playerDown();
      }
      return;
    }
    // Villager.
    if (e.takeDamage(dmg, fromPos)) {
      if (e.hp <= 0) {
        e.setDown(true);
        g.ui.toast(`💫 ${e.def.name}が たおれた！`);
      }
    }
  }

  healAlliesNear(pos, radius, amount) {
    for (const e of [this.game.player, ...this.game.villagers]) {
      if (e.down || e.dead) continue;
      if (e.pos.distanceTo(pos) < radius && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + amount);
      }
    }
  }

  async playerDown() {
    if (this.playerDowned) return;
    this.playerDowned = true;
    const g = this.game;
    g.ui.toast("💀 目の前が 真っ暗になった……");
    await g.ui.fade(true, 800);
    const b = g.bannerEntity.pos;
    if (b.lengthSq() > 0) g.player.pos.set(b.x, g.world.terrainSurfaceY(b.x, b.z) + 0.1, b.z + 1);
    else g.player.pos.set(PLACES.spawn.x + 0.5, g.world.terrainSurfaceY(PLACES.spawn.x, PLACES.spawn.z) + 0.1, PLACES.spawn.z + 0.5);
    g.player.hp = g.player.maxHp;
    g.player.vel.set(0, 0, 0);
    await g.ui.fade(false, 800);
    this.playerDowned = false;
  }

  // 防衛戦でモンスターが柵などの raidTarget ブロックを壊す処理。
  damageBlock(x, y, z, amount) {
    const g = this.game;
    const key = cellKey(x, y, z);
    const id = g.world.get(x, y, z);
    const def = BLOCK_DEFS[id];
    if (!def?.raidTarget) return;
    const total = (g.world.blockDamage.get(key) ?? 0) + amount;
    if (total >= def.hp) {
      g.world.blockDamage.delete(key);
      g.world.set(x, y, z, B.AIR);
      SFX.breakBlock();
      g.throttledToast("break", `💥 ${def.name}が こわされた！`);
    } else {
      g.world.blockDamage.set(key, total);
    }
  }
}
