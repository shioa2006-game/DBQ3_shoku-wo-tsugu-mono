"""SVGストーリームービーの共通部品：画面の骨組み（HTML）・見た目（CSS）・再生エンジン（StoryPlayer）と、1ページへの組み立て。

各ムービー（story-movies/<フォルダ>/src/build.py）は、場面のSVG・ストーリーデータ（表示時間・字幕・カメラ・キュー）・
パネルの文言だけを用意し、page() で自己完結の index.html を書き出す。プロローグ（2026-11-08の試作）の再生処理を
そのまま共通化したもので、作品ごとに違うのはルート要素の id・クラス名（__ROOT__）、ストーリーデータの定数名
（__STORY__）、確認用に window へ出す名前（__GLOBAL__）だけ。

再生の仕様（プロローグと同じ）:
  - 開始パネル → 黒からフェードして各場面を自動で進める。クリック・タップ・Space・Enter で次の場面へ
    （stop: true のキューまでは時間を進めるだけ）。スキップ・Esc で終了パネルへ。もう一度見る。
  - 16:9 のステージを画面に収める。スマートフォンの縦画面では字幕を絵の下へ出す。
  - モーション軽減（OS設定・?reduced=1）ではカメラと .mv の位置の動きを止める。
  - URLパラメータ：?autoplay=1 ?from=N ?still=N&t=ミリ秒 ?reduced=1
"""
from helpers import SPARK

# 職業の書の紋（開いた本）。開始パネルの紋章にも使う。
EMBLEM_BOOK = "M-18,8 Q-9,1 0,5 Q9,1 18,8 L18,-4 Q9,-11 0,-7 Q-9,-11 -18,-4Z"

CSS_TEMPLATE = r"""
:root{
  /* 共通トップ（portal/styles.css）とゲーム（src/style.css）と同じ書体。Macはヒラギノ丸ゴ、WindowsはBIZ UDゴシック */
  --font:"Hiragino Maru Gothic ProN","BIZ UDGothic","Yu Gothic UI","Meiryo",system-ui,sans-serif;
  --gold:#f2cf7c; --gold-deep:#c9913f; --paper:#f6efe1; --night:#0a0a22;
  --sx:0px; --sy:0px; --sw:100vw; --sh:56.25vw; --vh:100vh;
  --overscan:1.12;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#000;overflow:hidden}
.__ROOT__{position:fixed;inset:0;background:#000;color:var(--paper);font-family:var(--font);
  -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;outline:none}
.__ROOT__[data-state="playing"],.__ROOT__[data-state="finishing"]{cursor:pointer}

/* ---- ステージ（16:9固定、JSで配置） ---- */
.stage{position:absolute;left:var(--sx);top:var(--sy);width:var(--sw);height:var(--sh);overflow:hidden;background:#000;contain:strict}
.scenes{position:absolute;inset:0}
.scene{position:absolute;inset:0;opacity:0}
.scene-cam{position:absolute;left:calc((1 - var(--overscan)) * 50%);top:calc((1 - var(--overscan)) * 50%);
  width:calc(var(--overscan) * 100%);height:calc(var(--overscan) * 100%);
  transform:scale(calc(1 / var(--overscan)));transform-origin:50% 50%;will-change:transform}
.scene-art{display:block;width:100%;height:100%}
.grain{position:absolute;inset:0;pointer-events:none;opacity:.13;mix-blend-mode:overlay;background-size:240px 240px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='.33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 0 1'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 75% 70% at 50% 46%,transparent 58%,rgba(0,0,0,.5) 100%)}
.caption-shade{position:absolute;left:0;right:0;bottom:0;height:34%;pointer-events:none;opacity:0;transition:opacity .9s ease;
  background:linear-gradient(to top,rgba(3,2,10,.78),rgba(3,2,10,.38) 48%,rgba(3,2,10,0))}
.has-caption .caption-shade{opacity:1}
.is-portrait .caption-shade{display:none}

/* ---- タイトル ---- */
.title-card{position:absolute;left:0;right:0;top:15%;text-align:center;pointer-events:none;opacity:0;transition:opacity 1.6s ease}
.title-card.is-shown{opacity:1}
/* 共通トップのタイトルと同じ見た目（黄色・極太・茶色の影）。影の大きさは文字の大きさに比例させる */
.title-main{margin:0;font-weight:900;font-size:calc(var(--sw) * .072);line-height:1.3;letter-spacing:.3em;padding-left:.3em;
  color:#ffd94a;text-shadow:0 .048em 0 #8a5a00,0 .095em .286em rgba(0,0,0,.8);
  transition:letter-spacing 2.6s cubic-bezier(.2,.7,.2,1),padding-left 2.6s cubic-bezier(.2,.7,.2,1)}
.title-card.is-shown .title-main{letter-spacing:.04em;padding-left:.04em}
.title-orn{display:flex;align-items:center;justify-content:center;gap:calc(var(--sw) * .012);margin:calc(var(--sw) * .012) auto 0;
  width:calc(var(--sw) * .3);color:var(--gold);opacity:.9}
.title-orn span{flex:1;height:1px;background:linear-gradient(90deg,transparent,currentColor)}
.title-orn span:last-child{background:linear-gradient(270deg,transparent,currentColor)}
.title-orn svg{width:calc(var(--sw) * .02);height:calc(var(--sw) * .02);fill:currentColor}
.no-anim,.no-anim *{transition:none !important}
.is-still .caption-line,.is-still .caption-shade,.is-still .title-card,.is-still .title-main,.is-still .panel{transition:none !important}

/* ---- 字幕 ---- */
.captions{position:absolute;z-index:5;display:grid;pointer-events:none;
  left:calc(var(--sx) + var(--sw) * .07);width:calc(var(--sw) * .86);
  bottom:calc(var(--vh) - var(--sy) - var(--sh) + var(--sh) * .07);
  font-size:clamp(14px,calc(var(--sw) * .0265),34px)}
.is-portrait .captions{left:18px;width:calc(100% - 36px);bottom:auto;top:calc(var(--sy) + var(--sh) + 26px);
  font-size:clamp(15px,4.5vw,22px)}
.caption-group{grid-area:1/1;align-self:end;text-align:center}
.is-portrait .caption-group{align-self:start}
.caption-line{margin:0;line-height:1.6;letter-spacing:.06em;font-weight:700;color:#f8f1e2;
  word-break:keep-all;overflow-wrap:anywhere;
  text-shadow:0 0 .6em rgba(0,0,0,.95),0 .06em .14em rgba(0,0,0,.95);
  opacity:0;transform:translateY(.3em);transition:opacity .7s ease,transform 1s cubic-bezier(.2,.7,.2,1)}
.caption-line.is-shown{opacity:1;transform:none}
.is-portrait .caption-line + .caption-line{margin-top:.55em}

/* ---- HUD ---- */
.hud{position:absolute;z-index:8;pointer-events:none;left:var(--sx);top:var(--sy);width:var(--sw);height:var(--sh);
  opacity:0;transition:opacity .6s ease}
.is-portrait .hud{left:0;top:0;width:100%;height:100%}
.__ROOT__[data-state="playing"] .hud{opacity:1}
.pips{position:absolute;margin:0;padding:0;list-style:none;display:flex;align-items:center;gap:10px;
  top:max(16px,env(safe-area-inset-top));left:max(18px,env(safe-area-inset-left))}
.pips li{width:9px;height:9px;transform:rotate(45deg);border:1px solid rgba(242,207,124,.65);transition:background .5s,border-color .5s,box-shadow .5s}
.pips li.is-done{background:rgba(242,207,124,.45);border-color:transparent}
.pips li.is-current{background:var(--gold);border-color:var(--gold);box-shadow:0 0 10px rgba(242,207,124,.8)}
.skip-btn{pointer-events:auto;position:absolute;top:max(10px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));
  font:inherit;font-size:14px;letter-spacing:.12em;color:rgba(246,239,225,.82);background:rgba(8,8,20,.35);
  border:1px solid rgba(246,239,225,.28);border-radius:999px;padding:9px 16px 9px 18px;min-height:40px;cursor:pointer;
  -webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);transition:color .3s,border-color .3s,background .3s}
@media (pointer:coarse){.skip-btn{min-height:46px;min-width:96px;font-size:15px}.skip-btn kbd{display:none}}
.skip-btn:hover{color:#fff;border-color:rgba(242,207,124,.8);background:rgba(20,16,30,.55)}
.skip-btn kbd{font:inherit;font-size:11px;opacity:.6;margin-left:6px}
.skip-btn:focus-visible,.btn:focus-visible{outline:2px solid var(--gold);outline-offset:3px}

/* ---- 開始・終了パネル ---- */
.panel{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:22px;padding:24px;text-align:center;opacity:0;visibility:hidden;transition:opacity .6s ease,visibility 0s .6s;
  background:radial-gradient(ellipse 60% 55% at 50% 52%,rgba(52,38,112,.42),rgba(0,0,0,0) 70%),#000}
.__ROOT__[data-state="idle"] .start-panel,.__ROOT__[data-state="ended"] .end-panel{opacity:1;visibility:visible;transition:opacity 1s ease}
.emblem{width:min(120px,26vw);height:auto;overflow:visible}
.__ROOT__[data-state="idle"] .emblem .glow{animation:emb 3.2s ease-in-out infinite}
@keyframes emb{0%,100%{opacity:.55}50%{opacity:1}}
.panel-kicker{margin:0;font-size:clamp(15px,2.2vw,19px);font-weight:700;letter-spacing:.6em;padding-left:.6em;color:rgba(242,207,124,.85)}
.end-title{margin:0;font-size:clamp(40px,8vw,76px);font-weight:900;line-height:1.3;letter-spacing:.04em;padding-left:.04em;
  color:#ffd94a;text-shadow:0 .048em 0 #8a5a00,0 .095em .286em rgba(0,0,0,.8)}
.end-note{margin:0;font-size:clamp(13px,1.8vw,15px);letter-spacing:.08em;color:rgba(246,239,225,.55);line-height:1.8}
.btn{font:inherit;font-weight:700;font-size:clamp(16px,2.4vw,20px);letter-spacing:.16em;padding:14px 34px 14px calc(34px + .16em);
  color:#fff6e0;cursor:pointer;border-radius:2px;border:1px solid rgba(242,207,124,.75);
  background:linear-gradient(180deg,rgba(60,44,110,.55),rgba(20,14,40,.7));
  box-shadow:0 0 0 4px rgba(0,0,0,.6),0 0 0 5px rgba(242,207,124,.22),0 0 26px rgba(160,120,255,.25);
  transition:box-shadow .4s,background .4s,transform .2s}
.btn:hover{background:linear-gradient(180deg,rgba(84,62,150,.7),rgba(28,20,56,.8));
  box-shadow:0 0 0 4px rgba(0,0,0,.6),0 0 0 5px rgba(242,207,124,.5),0 0 34px rgba(242,207,124,.35)}
.btn:active{transform:translateY(1px)}
.hint{margin:0;font-size:clamp(12px,1.7vw,14px);letter-spacing:.06em;color:rgba(246,239,225,.5);line-height:1.9}

/* ---- モーション軽減 ---- */
@media (prefers-reduced-motion: reduce){
  .scene .mv{animation:none !important}
  .__ROOT__ .emblem .glow{animation:none}
  .caption-line{transform:none}
}
.is-reduced .scene .mv{animation:none !important}
"""

JS_TEMPLATE = r"""
(function () {
  'use strict';

  /* =========================================================================
   * 1. ストーリーデータ
   *    演出（表示時間・字幕・カメラ・キュー）と、SVGアセットの参照だけを持つ。
   *    将来は章ごとに prologue.story.js / chapter1.story.js などへ分離できる。
   *    camera: s=倍率（1=全景）、x/y=ステージ幅・高さに対する移動量（%）
   *    captions: in/out はシーン開始からの時刻（ミリ秒）。group が違う字幕は同じ場所に重ねて表示する
   *              （前の組が消えてから次の組を出す。3行を一度に並べないため）。
   * ======================================================================= */
  const __STORY__ = __STORY_DATA__;

  /* =========================================================================
   * 2. 再生エンジン（ストーリーに依存しない汎用部分）
   *    将来は story-player.js として共通モジュール化する想定。
   * ======================================================================= */
  const reducedQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  // 既定のアセット解決：<template id="..."> を複製する。
  // 章ごとに .svg ファイルを fetch して文字列で渡す方式にも差し替え可能。
  function templateAsset(scene) {
    if (scene.markup) {
      const wrap = document.createElement('div');
      wrap.innerHTML = scene.markup;
      const frag = document.createDocumentFragment();
      while (wrap.firstChild) frag.appendChild(wrap.firstChild);
      return frag;
    }
    const tpl = document.getElementById(scene.asset);
    if (!tpl) throw new Error('SVGアセットが見つかりません: ' + scene.asset);
    return tpl.content.cloneNode(true);
  }

  class StoryPlayer {
    constructor(root, story, options) {
      this.root = root;
      this.story = story;
      this.opts = Object.assign({
        overscan: 1.12,
        resolveAsset: templateAsset,
        forceReducedMotion: false,
        onSceneChange: null,
        onComplete: null
      }, options || {});
      this.el = {
        scenes: root.querySelector('[data-role="scenes"]'),
        captions: root.querySelector('[data-role="captions"]'),
        title: root.querySelector('[data-role="title"]'),
        pips: root.querySelector('[data-role="pips"]'),
        stage: root.querySelector('.stage')
      };
      this.state = 'idle';
      this.index = -1;
      this.current = null;
      this.live = [];             // DOM上に存在するシーン（クロスフェード中は2つ）
      this.timers = new Set();
      this.anims = new Set();     // プレイヤー全体のWeb Animations
      this.raf = 0;
      this.lastNext = 0;
      this._tick = this._tick.bind(this);
      root.style.setProperty('--overscan', String(this.opts.overscan));
      this._buildPips();
      this._updateReduced();
      if (reducedQuery && reducedQuery.addEventListener) {
        reducedQuery.addEventListener('change', () => this._updateReduced());
      }
    }

    get isPlaying() { return this.state === 'playing' || this.state === 'finishing'; }

    /* ---------- 公開API ---------- */
    // from: 始めるシーンの番号（0始まり。確認用に途中から再生できる）
    play(from) {
      if (this.isPlaying) return;
      this._cleanup();
      this._setState('playing');
      this._enter(Math.max(0, Math.min(this.story.scenes.length - 1, from | 0)), this.story.fadeIn);
      this.raf = requestAnimationFrame(this._tick);
    }

    // 確認・撮影用：シーン i を時刻 t（ミリ秒）の状態で止めて表示する（字幕・タイトル・カメラ・絵の動きを含む）。
    still(i, t) {
      this._cleanup();
      this._setState('still');
      const data = this.story.scenes[i];
      this._enter(i, 0);
      const s = this.current;
      const at = Math.max(0, Math.min(t, data.duration));
      this.root.classList.add('is-still');
      s.anims.concat(s.el.getAnimations({ subtree: true })).forEach(a => { a.pause(); a.currentTime = at; });
      while (s.ev < s.events.length && s.events[s.ev].at <= at) this._fire(s, s.events[s.ev++]);
      return { scene: data.id, t: at };
    }

    next() {
      if (this.state === 'finishing') { this._complete(false); return; }
      if (this.state !== 'playing' || !this.current) return;
      const now = performance.now();
      if (now - this.lastNext < 320) return;
      this.lastNext = now;
      const s = this.current;
      const t = now - s.start;
      const stop = s.events.find(e => e.type === 'cue' && e.cue.stop && e.at > t);
      if (stop) { s.start = now - stop.at; return; }   // 停止点まで時間を進める
      this._advance(this.story.quickCrossfade);
    }

    skip() {
      if (!this.isPlaying) return;
      this._setState('skipping');
      cancelAnimationFrame(this.raf);
      this._track(this.el.stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' }));
      this._later(380, () => this._complete(true));
    }

    destroy() { this._cleanup(); this._setState('idle'); }

    /* ---------- 内部処理 ---------- */
    _enter(i, transitionMs) {
      const data = this.story.scenes[i];
      const prev = this.current;
      const el = document.createElement('div');
      el.className = 'scene';
      el.dataset.scene = data.id;
      const cam = document.createElement('div');
      cam.className = 'scene-cam';
      cam.appendChild(this.opts.resolveAsset(data));
      el.appendChild(cam);
      this.el.scenes.appendChild(el);

      const s = {
        data, el, cam, anims: [], ev: 0, start: performance.now(),
        events: this._buildEvents(data), groups: [], lines: []
      };
      this._buildCaptions(s);

      void el.offsetWidth;                 // 初期状態を確定させてからアニメーション開始
      el.classList.add('is-active');       // SVG内のCSSアニメーションはこのクラスで動き出す
      s.anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: transitionMs, easing: 'ease-out', fill: 'forwards' }));
      const cf = this._camKey(data.camera && data.camera.from);
      if (this.reduced || !data.camera) {
        // モーション軽減時はカメラを動かさず、移動の中間位置で固定する
        const a = (data.camera && data.camera.from) || {}, b = (data.camera && data.camera.to) || a;
        const mid = k => (((a[k] != null ? a[k] : (k === 's' ? 1 : 0)) + (b[k] != null ? b[k] : (k === 's' ? 1 : 0))) / 2);
        cam.style.transform = this._camKey({ s: mid('s'), x: mid('x'), y: mid('y') });
      } else {
        s.anims.push(cam.animate([{ transform: cf }, { transform: this._camKey(data.camera.to) }], {
          duration: data.duration + this.story.crossfade, easing: data.camera.easing || 'cubic-bezier(.4,0,.6,1)', fill: 'forwards'
        }));
      }

      this.live.push(s);
      this.current = s;
      this.index = i;
      if (prev) {
        prev.lines.forEach(l => l.classList.remove('is-shown'));
        this._later(transitionMs + 80, () => this._dispose(prev));
      }
      this._updatePips();
      this._updateCaptionShade();
      if (this.opts.onSceneChange) this.opts.onSceneChange(i, data);
      this.root.dispatchEvent(new CustomEvent('storyscene', { detail: { story: this.story.id, index: i, scene: data.id } }));
    }

    _advance(ms) {
      if (this.index + 1 < this.story.scenes.length) this._enter(this.index + 1, ms);
      else this._finish();
    }

    _finish() {
      this._setState('finishing');
      cancelAnimationFrame(this.raf);
      this._track(this.el.stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: this.story.finalFade, easing: 'ease-in', fill: 'forwards' }));
      this._later(this.story.finalFade, () => this._complete(false));
    }

    _complete(skipped) {
      this._cleanup();
      this._setState('ended');
      if (this.opts.onComplete) this.opts.onComplete({ skipped });
      this.root.dispatchEvent(new CustomEvent('storyend', { detail: { story: this.story.id, skipped } }));
    }

    _cleanup() {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.timers.forEach(id => clearTimeout(id));
      this.timers.clear();
      this.live.slice().forEach(s => this._dispose(s));
      this.live = [];
      this.current = null;
      this.index = -1;
      this.anims.forEach(a => a.cancel());
      this.anims.clear();
      this.el.captions.textContent = '';
      this.root.classList.remove('has-caption', 'is-still');
      const t = this.el.title;
      t.classList.add('no-anim');
      t.classList.remove('is-shown');
      void t.offsetWidth;
      t.classList.remove('no-anim');
      this._updatePips();
    }

    _dispose(s) {
      s.anims.forEach(a => a.cancel());
      s.anims.length = 0;
      s.el.remove();
      s.groups.forEach(g => g.remove());
      this.live = this.live.filter(x => x !== s);
    }

    _tick() {
      if (this.state !== 'playing') return;
      const s = this.current;
      const t = performance.now() - s.start;
      while (s.ev < s.events.length && s.events[s.ev].at <= t) this._fire(s, s.events[s.ev++]);
      if (t >= s.data.duration) this._advance(this.story.crossfade);
      if (this.state === 'playing') this.raf = requestAnimationFrame(this._tick);
    }

    _buildEvents(data) {
      const ev = [];
      (data.captions || []).forEach((c, i) => {
        ev.push({ at: c.in, type: 'caption-in', i });
        ev.push({ at: c.out, type: 'caption-out', i });
      });
      (data.cues || []).forEach(c => ev.push({ at: c.at, type: 'cue', cue: c }));
      return ev.sort((a, b) => a.at - b.at);
    }

    _fire(s, e) {
      if (e.type === 'caption-in') s.lines[e.i].classList.add('is-shown');
      else if (e.type === 'caption-out') s.lines[e.i].classList.remove('is-shown');
      else if (e.type === 'cue' && e.cue.action === 'title') this.el.title.classList.add('is-shown');
      this._updateCaptionShade();
    }

    _buildCaptions(s) {
      const groups = [];
      (s.data.captions || []).forEach(c => {
        const k = c.group || 0;
        if (!groups[k]) {
          groups[k] = document.createElement('div');
          groups[k].className = 'caption-group';
        }
        const p = document.createElement('p');
        p.className = 'caption-line';
        // 読点の後ろで折り返せるようにする（スマートフォン縦画面用）
        c.text.replace(/、/g, '、\u0000').split('\u0000').forEach((part, k, arr) => {
          p.appendChild(document.createTextNode(part));
          if (k < arr.length - 1) p.appendChild(document.createElement('wbr'));
        });
        groups[k].appendChild(p);
        s.lines.push(p);
      });
      groups.filter(Boolean).forEach(g => { this.el.captions.appendChild(g); s.groups.push(g); });
    }

    _updateCaptionShade() {
      const on = !!(this.current && this.current.lines.some(l => l.classList.contains('is-shown')));
      this.root.classList.toggle('has-caption', on);
    }

    _buildPips() {
      this.el.pips.innerHTML = '';
      this.story.scenes.forEach((sc, i) => {
        const li = document.createElement('li');
        li.setAttribute('aria-label', (i + 1) + '：' + sc.label);
        this.el.pips.appendChild(li);
      });
    }

    _updatePips() {
      Array.from(this.el.pips.children).forEach((li, i) => {
        li.classList.toggle('is-done', i < this.index);
        li.classList.toggle('is-current', i === this.index);
        if (i === this.index) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
    }

    // カメラ：ステージ基準の値を、オーバースキャンしたレイヤーの transform に変換する。
    // 画面端が見えないよう、移動量は倍率に応じて自動的に制限する。
    _camKey(c) {
      const os = this.opts.overscan;
      const s = Math.max(1, (c && c.s) || 1);
      const lim = (s - 1) / 2 * 100;
      const x = Math.max(-lim, Math.min(lim, (c && c.x) || 0));
      const y = Math.max(-lim, Math.min(lim, (c && c.y) || 0));
      return 'translate(' + (x / os).toFixed(3) + '%,' + (y / os).toFixed(3) + '%) scale(' + (s / os).toFixed(4) + ')';
    }

    _updateReduced() {
      this.reduced = this.opts.forceReducedMotion || !!(reducedQuery && reducedQuery.matches);
      this.root.classList.toggle('is-reduced', this.reduced);
    }

    _setState(st) { this.state = st; this.root.dataset.state = st; }
    _track(a) { this.anims.add(a); return a; }
    _later(ms, fn) {
      const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
      this.timers.add(id);
      return id;
    }
  }

  /* =========================================================================
   * 3. レイアウト（16:9を維持して画面に収める）
   * ======================================================================= */
  function layout(root) {
    const vw = window.innerWidth, vh = window.innerHeight;
    let sw = vw, sh = vw * 9 / 16;
    if (sh > vh) { sh = vh; sw = vh * 16 / 9; }
    const portrait = vh > vw * 1.1 && (vh - sh) > 220;
    const sx = (vw - sw) / 2;
    const sy = portrait ? Math.max(0, (vh - sh) * 0.4) : (vh - sh) / 2;
    const st = root.style;
    st.setProperty('--sw', sw + 'px');
    st.setProperty('--sh', sh + 'px');
    st.setProperty('--sx', sx + 'px');
    st.setProperty('--sy', sy + 'px');
    st.setProperty('--vh', vh + 'px');
    root.classList.toggle('is-portrait', portrait);
  }

  /* =========================================================================
   * 4. 起動と入力
   * ======================================================================= */
  const root = document.getElementById('__ROOT__');
  const params = new URLSearchParams(location.search);
  const player = new StoryPlayer(root, __STORY__, {
    forceReducedMotion: params.get('reduced') === '1',
    onComplete: function () {
      const btn = root.querySelector('[data-action="replay"]');
      if (btn) btn.focus({ preventScroll: true });
    }
  });

  layout(root);
  window.addEventListener('resize', () => layout(root));
  window.addEventListener('orientationchange', () => setTimeout(() => layout(root), 120));

  function start(fromScene) {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    root.focus({ preventScroll: true });
    player.play(fromScene || 0);
  }

  root.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (action) {
      e.stopPropagation();
      const a = action.dataset.action;
      if (a === 'play' || a === 'replay') start();
      else if (a === 'skip') player.skip();
      return;
    }
    if (player.isPlaying) player.next();
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'Escape') {
      if (player.isPlaying) { e.preventDefault(); player.skip(); }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target.closest && e.target.closest('button')) return;   // ボタン自身の操作を優先
      e.preventDefault();
      if (player.isPlaying) player.next();
      else if (player.state === 'idle') start();
    }
  });

  // ゲーム組み込み・デバッグ用
  //   ?autoplay=1          ボタンなしで再生
  //   ?from=4              第4場面から再生（確認用）
  //   ?still=4&t=3500      第4場面の3.5秒の状態で止める（撮影・静止画の確認用）
  window.__GLOBAL__ = { player, story: __STORY__, StoryPlayer };
  const from = Math.max(0, (parseInt(params.get('from'), 10) || 1) - 1);
  if (params.has('still')) player.still(Math.max(0, Math.min(__STORY__.scenes.length - 1, (parseInt(params.get('still'), 10) || 1) - 1)),
    parseInt(params.get('t'), 10) || 0);
  else if (params.get('autoplay') === '1' || params.has('from')) start(from);
})();
"""


def emblem_svg():
    return f"""<svg class="emblem" viewBox="-60 -60 120 120" aria-hidden="true">
<defs><radialGradient id="emb-g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".9"/>
<stop offset="1" stop-color="#f2cf7c" stop-opacity="0"/></radialGradient></defs>
<circle class="glow" r="58" fill="url(#emb-g)"/>
<circle r="40" fill="none" stroke="#f2cf7c" stroke-width="1.5" opacity=".8"/>
<circle r="34" fill="none" stroke="#f2cf7c" stroke-width=".8" opacity=".5"/>
<path d="{EMBLEM_BOOK}" fill="#f2cf7c" transform="translate(0 9) scale(1.25)"/>
<path d="{SPARK}" fill="#fff1c8" transform="translate(0 -12) scale(1.05)"/>
</svg>"""


def title_ornament():
    """タイトルの下の飾り線（両側の線と中央の星）。"""
    return f'<div class="title-orn"><span></span><svg viewBox="-10 -10 20 20"><path d="{SPARK}"/></svg><span></span></div>'


def body(root, *, title_html, progress_label, start_label, kicker, play_label, end_label, end_title, end_note,
         hint="クリック・タップ・Space・Enter で次の場面へ<br>Esc でスキップ", replay_label="もう一度見る"):
    """ステージ（場面・タイトル・字幕の影・粒子・周辺減光）、字幕、HUD（進行の印・スキップ）、開始・終了パネル。
    title_html はタイトルカードの中身（行頭の字下げ・改行を含む）。"""
    return f"""
<div id="{root}" class="{root}" data-state="idle" tabindex="-1">
  <div class="stage">
    <div class="scenes" data-role="scenes"></div>
    <div class="title-card" data-role="title" aria-hidden="true">
{title_html}
    </div>
    <div class="caption-shade"></div>
    <div class="grain" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>
  </div>
  <div class="captions" data-role="captions" aria-live="polite"></div>
  <div class="hud">
    <ol class="pips" data-role="pips" aria-label="{progress_label}"></ol>
    <button type="button" class="skip-btn" data-action="skip">スキップ<kbd>Esc</kbd></button>
  </div>
  <section class="panel start-panel" aria-label="{start_label}">
    {emblem_svg()}
    <p class="panel-kicker">{kicker}</p>
    <button type="button" class="btn" data-action="play">{play_label}</button>
    <p class="hint">{hint}</p>
  </section>
  <section class="panel end-panel" aria-label="{end_label}">
    <p class="end-title">{end_title}</p>
    <p class="end-note">{end_note}</p>
    <button type="button" class="btn" data-action="replay">{replay_label}</button>
  </section>
</div>
"""


def page(path, *, root, story_const, global_name, story_data, title, comment, body_html, scenes, extra_css=""):
    """自己完結の index.html を書き出し、文字数を返す。
    story_data はストーリーデータの JavaScript オブジェクト（文字列。注釈を書ける）。scenes は場面のSVG（順番どおり）。
    comment は先頭の注釈（各行2文字下げ）。改行は実行環境によらずLFにする。"""
    css = CSS_TEMPLATE.replace("__ROOT__", root) + extra_css
    js = (JS_TEMPLATE.replace("__STORY_DATA__", story_data).replace("__STORY__", story_const)
          .replace("__GLOBAL__", global_name).replace("__ROOT__", root))
    tpls = "\n".join(f'<template id="tpl-scene-{i + 1}">\n{svg}\n</template>' for i, svg in enumerate(scenes))
    html = f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<link rel="icon" href="data:,">
<!--
{comment}
-->
<style>{css}</style>
</head>
<body>
{body_html}
<!-- ===================== SVGアセット（シーンごとに自己完結：defs・style込み） ===================== -->
{tpls}
<script>{js}</script>
</body>
</html>
"""
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    return len(html)
