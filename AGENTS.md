# 親リポジトリの共通作業ルール

- Gitの管理単位はこの親ディレクトリ1つ。接続先は `https://github.com/shioa2006-game/DBQ3_shoku-wo-tsugu-mono.git` のみ。
- CH1～3、CH4～5、Character Studioは通常の子フォルダ。子に `.git` を作らず、旧GitLab・Studio単体リポジトリへpull/pushしない。
- 最初にルートREADMEと対象フォルダの `AGENTS.md`・READMEを読む。過去のarchive・品質記録にある個別リポジトリ/GitLab手順は現行の運用指示ではない。
- 作業開始時に親で `git status --short --branch` を確認。他の未コミット変更を無断で破棄・上書き・まとめてコミットしない。
- 必要な変更と確認を終えて対象ファイルを指定してコミットする。pushはユーザーが依頼した範囲で行い、force push・共有履歴の改変は行わない。
- Git管理の統合と、ゲームの起動・セーブ領域の統合は別。各編の独立動作、既存セーブ、相対パスを維持する。
- コードを変更したゲームは `npm.cmd run test:ci`（ビルド含む）。章進行・戦闘・セーブ等へ影響するときは `test:e2e` も実行。Studio変更時は `npm.cmd test`。2ゲームのテストは同じ既定ポートを使うため順番に実行する。
- 画像原本はStudio、ゲームの原画は `art_src/`、読込画像は `assets/`。本編で使う画像・リグ設定を一緒に更新する。
- `node_modules/`、`dist/`、`work/`、比較テストのスクリーンショットはGit管理しない。Studioの `prototypes/*/output/` は制作成果物なので保持する。
- 既存サーバーやブラウザーを無断停止しない。ブラウザー確認は対象ゲームの公式testsまたは提供されたBrowser機能を使用する。
- 認証情報・秘密鍵・端末固有設定をコミットしない。GitHub認証情報を表示・ファイルへ平文保存しない。
- 運用手順は [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md)。統合前の履歴の参照方法は [docs/REPOSITORY_MIGRATION.md](docs/REPOSITORY_MIGRATION.md)。
