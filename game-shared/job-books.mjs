// 書の説明・開始状態・進捗式は各編の定義、旧セーブからの復元は各編の JobManager が持つ。
export class JobBooks {
  constructor(game, books, sounds) {
    this.books = books;
    this.sounds = sounds;
    this.game = game;
    this.revived = new Set(Object.keys(this.books).filter((id) => this.books[id].startRevived));
  }

  isRevived(id) {
    return this.revived.has(id);
  }

  // 書の復活演出を再生して復活状態にする。二重復活は演出を飛ばして完了扱い。
  // 演出は書の復活のムービー（各編の movies に book-<id> があれば。M2）、流せないときは復活の窓。
  revive(id, onDone) {
    if (this.revived.has(id)) {
      if (onDone) onDone();
      return;
    }
    this.revived.add(id);
    this.sounds.book();
    const popup = (done) => this.game.ui.showBookRevival(this.books[id].name, done);
    const movies = this.game.movies;
    if (!movies) {
      popup(() => onDone?.());
      return;
    }
    movies.playOr(`book-${id}`, popup, () => onDone?.());
  }

  // 職業の書UI（showJobBook）用のデータ。JOBS の定義順に並ぶ。
  bookData() {
    return Object.entries(this.books).map(([id, def]) => {
      const revived = this.isRevived(id);
      return {
        name: def.name,
        desc: revived ? def.revivedDesc : def.lockedDesc,
        progress: revived ? 1 : def.progress(this.game),
        revived,
      };
    });
  }

  serialize() {
    return { revived: [...this.revived] };
  }
}
