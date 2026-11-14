// SVGストーリームービー（Studioの story-movies/ で作り、Studioの npm.cmd run sync:movies で assets/movies/ へ写す）。
// 再生は game-shared/story-movies.mjs。ファイルは再生するときに読み込む。入る場所は docs/DESIGN.md の「10. ムービーと会話」。
export const MOVIES = {
  "ch6-arrival": new URL("../../assets/movies/ch6-arrival.html", import.meta.url).href, // M10 「はじめから」の後、第6章の導入会話の前
  "ch6-roof-light": new URL("../../assets/movies/ch6-roof-light.html", import.meta.url).href, // M11 第6章の結び（最初の授職の後）
  "ch7-three-heads": new URL("../../assets/movies/ch7-three-heads.html", import.meta.url).href, // M12 ヴァルガの初襲来の直前（名乗り）
  "ch7-flame-holds": new URL("../../assets/movies/ch7-flame-holds.html", import.meta.url).href, // M13 最終決戦の決着
  "ch7-unseen-books": new URL("../../assets/movies/ch7-unseen-books.html", import.meta.url).href, // M14 ダーマ再興編・完（最後の出航）
};
