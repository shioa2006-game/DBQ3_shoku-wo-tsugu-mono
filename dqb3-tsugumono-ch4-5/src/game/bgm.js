// BGM（音声ファイル）。効果音（sfx.js の WebAudio 合成）とは別系統で、
// HTMLAudioElement をループ再生する。曲の切り替えはクロスフェードで行い、
// 場面が変わるたびに音がブツ切りになるのを防ぐ。
//
// 曲は2種類だけ:
//   field … 通常時（探索・建築・会話・エンディング）
//   boss  … 防衛戦のあいだ（開始から終了まで。ザコの波も含む）

const SOURCES = {
  field: new URL("../../assets/bgm/bgm_field.mp3", import.meta.url).href,
  boss: new URL("../../assets/bgm/bgm_boss.mp3", import.meta.url).href,
};

// 効果音より十分に控えめな固定音量（会話・採掘音を邪魔しない）。
const VOLUME = 0.2;
const FADE_MS = 1200;
const TICK_MS = 50;

class BgmPlayer {
  constructor() {
    this.els = new Map(); // id -> HTMLAudioElement | null（生成失敗時）
    this.current = null; // 鳴らしたい曲。null は停止
    this.muted = false;
    this.timer = null;
  }

  // 音声要素は初回再生時に作る。タイトル画面では読み込みを始めない
  //（1曲あたり約1.4MBあるため、遊び始めるまで取りに行かない）。
  el(id) {
    if (!this.els.has(id)) {
      let a = null;
      try {
        a = new Audio(SOURCES[id]);
        a.loop = true;
        a.preload = "auto";
        a.volume = 0;
      } catch {
        a = null; // Audio 非対応環境（テスト環境など）でも遊びは続けられる
      }
      this.els.set(id, a);
    }
    return this.els.get(id);
  }

  // 指定の曲へ切り替える（null で停止）。同じ曲なら何もしない。
  // ブラウザの自動再生制限により、最初の再生はユーザー操作（タイトルの
  // ボタン押下）より後である必要がある。拒否された場合は次の切り替えで再挑戦する。
  play(id) {
    if (this.current === id) return;
    this.current = id;
    this.start(id);
    this.fade();
  }

  stop() {
    this.play(null);
  }

  setMuted(v) {
    this.muted = v;
    if (!v) this.start(this.current);
    this.fade();
  }

  // 止まっている曲を先頭から鳴らし始める（音量0のままフェードで上げる）。
  start(id) {
    if (!id || this.muted) return;
    const a = this.el(id);
    if (!a || !a.paused) return;
    try {
      a.currentTime = 0;
    } catch {
      /* 読み込み前は指定できない。そのまま再生する */
    }
    a.play().catch(() => {
      /* 自動再生が拒否された。次の切り替えで再挑戦する */
    });
  }

  // 各曲の音量を目標値へ寄せるクロスフェード。全て到達したら止まる。
  fade() {
    if (this.timer) return;
    const step = VOLUME / (FADE_MS / TICK_MS);
    this.timer = setInterval(() => {
      let moving = false;
      for (const [id, a] of this.els) {
        if (!a) continue;
        const target = !this.muted && id === this.current ? VOLUME : 0;
        if (a.volume < target) {
          a.volume = Math.min(target, a.volume + step);
          moving = true;
        } else if (a.volume > target) {
          a.volume = Math.max(target, a.volume - step);
          moving = true;
        }
        if (a.volume === 0 && !a.paused) a.pause();
      }
      if (!moving) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, TICK_MS);
  }
}

export const BGM = new BgmPlayer();
