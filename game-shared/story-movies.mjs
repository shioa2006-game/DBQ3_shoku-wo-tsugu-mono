// SVGストーリームービーの再生。ムービーはStudioの story-movies/ で作る自己完結HTML
//（npm.cmd run sync:movies で各編の assets/movies/ へ写す）で、ゲームの上に全画面の iframe で重ねて流す。
// - 各編は名前 → URL の対応（src/content/movies.js）を渡す。読み込むのは再生するときだけ。
// - 再生中は open が true。各編の ui.modalOpen に含めて、入力と世界の時間を止める。
// - ムービーの操作（クリック・Space・Enter で次の場面、Esc・「スキップ」で終わり）はムービー側のまま。
// - 読み込めない・テストで無効にしたときは流さずに shown: false を返す。章末・導入はそのまま先へ進み
//  （文字の章末は2026-11-08に削除）、書の復活だけは playOr で復活の小窓を出す。
//   無効にする方法: window.__SHOKU_SKIP_MOVIES__ = true、または localStorage の shoku_movies を "off"。
const LOAD_TIMEOUT = 15000;  // 読み込みを待つ上限（ミリ秒）。その間は黒い画面
const SPARE_TIME = 20000;    // ムービーの長さを過ぎても終わらないときに閉じるまでの余裕

export class StoryMovies {
  constructor(urls, { loadTimeout = LOAD_TIMEOUT } = {}) {
    this.urls = urls;
    this.loadTimeout = loadTimeout;
    this.current = null;
  }

  get open() {
    return this.current !== null;
  }

  get enabled() {
    if (typeof document === "undefined") return false;
    if (globalThis.__SHOKU_SKIP_MOVIES__) return false;
    try {
      return globalThis.localStorage?.getItem("shoku_movies") !== "off";
    } catch {
      return true;
    }
  }

  has(id) {
    return Boolean(this.urls[id]);
  }

  // いま play(id) を呼べば流そうとするか（読み込みに失敗すれば流れないこともある）。
  willPlay(id) {
    return this.has(id) && this.enabled && !this.current;
  }

  // ムービーを流し、終わったら { shown, skipped } で解決する。
  // shown: 最後まで、またはスキップで閉じた（流せた）/ skipped: 途中でスキップした
  play(id) {
    const url = this.urls[id];
    if (!this.willPlay(id)) return Promise.resolve({ id, shown: false, skipped: false });
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "story-movie";
      overlay.dataset.movie = id;
      overlay.style.cssText = "position:fixed;inset:0;z-index:10000;background:#000";
      const frame = document.createElement("iframe");
      frame.title = "ストーリームービー";
      frame.src = `${url}${url.includes("?") ? "&" : "?"}autoplay=1`;
      frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:#000";
      overlay.append(frame);

      let timer = 0;
      let done = false;
      const finish = (shown, skipped) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener("keydown", onKey, true);
        overlay.remove();
        this.current = null;
        window.focus();
        resolve({ id, shown, skipped });
      };
      // iframe の外（親の画面）にフォーカスが残っていても、キーをゲームへ渡さずムービーを操作する。
      const onKey = (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (e.repeat) return;
        const player = this.current?.player;
        if (!player) return;
        if (e.key === "Escape") player.skip();
        else if (e.key === " " || e.key === "Enter") player.next();
      };
      window.addEventListener("keydown", onKey, true);
      timer = setTimeout(() => finish(false, false), this.loadTimeout);

      frame.addEventListener("load", () => {
        let root = null;
        let movie = null;
        try {
          const doc = frame.contentDocument;
          root = doc.getElementById("movie") ?? doc.getElementById("prologue");
          movie = root && (frame.contentWindow.ShokuMovie ?? frame.contentWindow.ShokuPrologue);
        } catch {
          root = null;
        }
        if (!root || !movie?.player) {
          finish(false, false);
          return;
        }
        this.current.player = movie.player;
        root.addEventListener("storyend", (e) => finish(true, Boolean(e.detail?.skipped)));
        clearTimeout(timer);
        const story = movie.story ?? {};
        const length = (story.scenes ?? []).reduce((sum, s) => sum + (s.duration ?? 0), 0) + (story.fadeIn ?? 0) + (story.finalFade ?? 0);
        timer = setTimeout(() => finish(true, false), length + SPARE_TIME);
        frame.focus();
        if (movie.player.state === "ended") finish(true, false);
      });
      frame.addEventListener("error", () => finish(false, false));

      this.current = { id, overlay, frame, player: null, finish };
      document.body.append(overlay);
    });
  }

  // ムービーを流し、流せなかったときは fallback(done) で代わりの演出を出す。どちらの後も done() を呼ぶ。
  playOr(id, fallback, done) {
    return this.play(id).then((result) => {
      if (result.shown) done?.(result);
      else if (fallback) fallback(() => done?.(result));
      else done?.(result);
      return result;
    });
  }

  // 再生中のムービーをスキップ扱いで閉じる（テスト・デバッグ用）。
  skip() {
    if (this.current?.player) this.current.player.skip();
    else this.current?.finish(false, false);
  }
}
