# AI開発指示（Codex / Claude Code 共通）

このフォルダは、Vite + three.js + WebGLで実装したブラウザゲーム
「職をつぐ者 ～ジパング復興編～」の第1～3章です。

この`AGENTS.md`をAI開発指示の正本とします。Codexはこのファイルを直接読み、
Claude Codeは`CLAUDE.md`からこのファイルを読み込みます。

## 最初に確認するもの

- ゲーム全体、操作方法、構成は`README.md`を確認する。
- 実装前に`package.json`のscriptsと、変更対象に対応する`tests/e2e/*.test.mjs`を確認する。

## 最優先ルール

- ユーザーから「コード修正しないでください」と指示された場合、コード・アセット・設定を変更しない。
- ユーザーが提示したスクリーンショットや動作結果は一次情報として扱う。
- 既知の不具合を最初から調べ直さず、提示された事実と現在のコードから原因を絞る。
- 指示にない大規模リファクタリング、依存関係の更新、セーブ形式の破壊的変更を行わない。
- 秘密鍵、パスフレーズ、アクセストークン、個人情報をコミットしない。

## 開発コマンド

WindowsではPowerShellの実行ポリシーの影響を避けるため、原則`npm.cmd`を使う。

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run test:ci
npm.cmd run test:e2e
```

- 通常の起動は`start-dev.bat`または`npm.cmd run dev`を使う。
- `dist/`と`node_modules/`は生成物なのでコミットしない。
- `http://localhost:5173/`ですでにdev serverが動いている場合は再利用する。
- dev serverは常駐させ、撮影用コマンドの中だけで一時起動しない。
- 既存のdev serverやブラウザプロセスを無断で停止しない。

## テストと完了条件

- コード変更後は、最低でも`npm.cmd run test:ci`と`npm.cmd run build`を実行する。
- ストーリー、セーブ、ワールド生成、NPC経路、戦闘などに影響する変更では
  `npm.cmd run test:e2e`も実行する。
- 新機能や不具合修正には、可能な限り対応する回帰テストを追加する。
- テストを実行できない場合は、未確認項目と理由を完了報告に明記する。

### 回帰テストの役割

- `tests/e2e/story.test.mjs`：第1章ストーリー全体の通し回帰。
- `tests/e2e/blueprint.test.mjs`：設計図のオートスナップ、破壊優先、障害物。
- `tests/e2e/saveload.test.mjs`：セーブ・ロード、設計図`baseY`、旧形式互換。
- `tests/e2e/jobs.test.mjs`：職業の書の進捗、復活、セーブ保持、旧セーブ互換。
- `tests/e2e/worldversion.test.mjs`：ワールド生成バージョンの記録と不一致時の警告。
- `tests/e2e/chapter2.test.mjs`：橋、見えない壁、料理、田んぼ防衛を含む第2章の通し回帰。
- `tests/e2e/chapter3.test.mjs`：桟橋、灯台、船、授職の儀、クラーケン、出航を含む第3章の通し回帰。
- `tests/e2e/trees.test.mjs`：伐採跡の木の再生と建築跡での不再生。
- `tests/e2e/routing.test.mjs`：住民が島を移動するとき海を泳がず橋を経由すること。
- `tests/e2e/pause.test.mjs`：会話・メニュー中の世界停止と、閉じた直後の被弾猶予。
- `tests/e2e/smoke.test.mjs`：サブシステム、ワールド寸法、ニューゲームの起動スモーク。
- `tests/e2e/sheets.test.mjs`：8方向スプライトシートの境界と中心位置。
- `tests/e2e/item-icons.test.mjs`：全アイテムがStudio製アイコン画像を使い、ホットバーとドロップに表示されること。

### ヘッドレステストの注意

- ソフトウェアレンダリングではゲーム内時間が実時間より遅く進み、重い通しテストが
  ランナー負荷で不安定になりやすい。
- 固定`waitForTimeout`の直後に判定せず、`tests/helpers.mjs`の`advanceToStage`、
  `waitForStage`、`waitForCond`で状態変化をポーリングする。
- 高速確認は`npm.cmd run test:ci`（sheets・smoke・underwater-visuals・item-icons）、全回帰は
  `npm.cmd run test:e2e`とする。新しい重い通しテストは全回帰へ追加し、
  常に守るべき不変条件だけを`tests/run.mjs`の`FAST`セットへ追加する。

## ブラウザ確認

使用してよいもの：

- リポジトリの公式`tests/`。
- CodexのPreview / Browser機能。
- ユーザーが提示したスクリーンショットと動作報告。

禁止するもの：

- Edge / ChromeをPowerShellから直接起動する独自自動化。
- `msedge --headless --screenshot`による一発撮影。
- DevTools Protocol / CDPを自作したスクリーンショット取得。
- `file:///dist/index.html`を開くWebGL確認。
- remote debugging portやdev serverのポート番号の総当たり。
- 既存のブラウザプロセスやdev serverの無断終了。
- 起動、撮影、キー入力を1つのPowerShellコマンドへ詰め込むこと。

### プレビューが止まった場合

プレビュータブがhiddenになると`requestAnimationFrame`が止まり、撮影がタイムアウトしたり、
キー入力でキャラクターが動かなくなったりすることがある。この場合、代替のブラウザ自動化は作らない。

1. 実画面を確認できない、または描画ループが止まっていることを明示する。
2. Previewの評価機能が使える場合は、メッシュの位置・寸法・回転などを数値で検証する。
3. 一時的なデバッグハンドル（例：`window.__char`）を追加した場合、確認後に必ず削除する。
4. ユーザーのスクリーンショット、動作報告、コード読解を併用して原因を絞る。
5. 修正後はユーザーに確認してほしい箇所と期待結果を具体的に伝える。

## セーブと互換性

- localStorageの既存セーブを壊さない。
- セーブ形式やワールド生成バージョンを変更する場合、旧データの互換性と警告処理を確認する。
- 章進行の変更では第1～3章の通しテストを確認する。

## アセットの生成と正規化

- 手描き原画は`art_src/`、ゲーム読込用画像は`assets/`に置く。
- 8方向キャラクターシートを追加・変更するときは、既存の正規化手順を使う。

```powershell
node tools/normalize_sheet.mjs art_src/<name>_body_8dir.src.png assets/humanoids/<name>_body_8dir.png
```

- 原画は`art_src/*_body_8dir.src.png`、ゲーム読込用は
  `assets/humanoids/*_body_8dir.png`とする。原画を`assets/`へ置かない。
- リグは各セル中央（目安`u ≈ 0.494`）にキャラクターがある前提で切り出す。
  生画像を`assets/humanoids/`へ直接置くと方向ごとに中心がずれるため、必ず正規化する。
- `tests/e2e/sheets.test.mjs`では、セル境界からのはみ出しがないことと、
  `assets/humanoids/`の中心が目安`u = 0.46～0.53`に収まることを確認する。
- リグ側へ方向別`artCenters`などの個別補正を足して回避しない。
  頭と胴で中心が分かれ、描画崩れの原因になる。

## 親リポジトリのGitHub運用

- Git管理は親 `DBQ3_shoku-wo-tsugu-mono` の1つだけ。[親のAGENTS.md](../AGENTS.md)と[運用手順](../docs/GITHUB_WORKFLOW.md)に従う。
- このフォルダに `.git` を作らず、旧GitLabへ同期・pushしない。GitHub Pagesの自動公開は未設定。
- 変更対象を指定して親でコミットする。既存の未コミット変更は無断で破棄しない。
- `vite.config.js` の既定baseは従来のローカルURLを維持する。相対URLでの出力は `RELATIVE_ASSET_PATHS=1` を指定する。
- baseや公開設定を変える場合、ローカルのビルド・テストと相対URL出力の両方を確認する。

## 実装方針

- Preview確認に時間を使いすぎず、使えない場合は数値検証、実装、設計、ユーザー確認へ戻る。
- キャラクター調整は原則として`src/main.js`冒頭のパラメータで行い、
  ジオメトリ生成ロジックは必要な場合だけ変更する。

## 作業完了時

- 変更内容、実行した確認、残る未確認事項を短く報告する。
- ユーザー側で画面確認が必要な場合、確認してほしい場所と期待結果を具体的に示す。
