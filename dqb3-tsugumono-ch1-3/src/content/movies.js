// SVGストーリームービー（Studioの story-movies/ で作り、Studioの npm.cmd run sync:movies で assets/movies/ へ写す）。
// 再生は game-shared/story-movies.mjs。ファイルは再生するときに読み込む。
export const MOVIES = {
  prologue: new URL("../../assets/movies/prologue.html", import.meta.url).href, // 「はじめから」の後、導入会話の前
  "ch1-shrine": new URL("../../assets/movies/ch1-shrine.html", import.meta.url).href, // 第1章の結び（社で祈った後）
  "ch2-harvest": new URL("../../assets/movies/ch2-harvest.html", import.meta.url).href, // 第2章の結び（田んぼ防衛戦の勝利会話の後）
  "ch3-departure": new URL("../../assets/movies/ch3-departure.html", import.meta.url).href, // 旅立ち（ワタリに旅立ちを告げた後）
  "book-farmer": new URL("../../assets/movies/book-farmer.html", import.meta.url).href, // 書の復活（農民）
  "book-cook": new URL("../../assets/movies/book-cook.html", import.meta.url).href, // 書の復活（料理人）
  "book-sailor": new URL("../../assets/movies/book-sailor.html", import.meta.url).href, // 書の復活（船乗り）
};
