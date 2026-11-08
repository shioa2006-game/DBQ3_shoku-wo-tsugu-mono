// SVGストーリームービー（Studioの story-movies/ で作り、Studioの npm.cmd run sync:movies で assets/movies/ へ写す）。
// 再生は game-shared/story-movies.mjs。ファイルは再生するときに読み込む。
export const MOVIES = {
  "ch4-arrival": new URL("../../assets/movies/ch4-arrival.html", import.meta.url).href, // 「はじめから」の後、第4章の導入会話の前
  "ch5-return": new URL("../../assets/movies/ch5-return.html", import.meta.url).href, // 火山島編の結び（第5章の結末）
  "book-blacksmith": new URL("../../assets/movies/book-blacksmith.html", import.meta.url).href, // 書の復活（鍛冶屋）
  "book-priest": new URL("../../assets/movies/book-priest.html", import.meta.url).href, // 書の復活（神官）
};
