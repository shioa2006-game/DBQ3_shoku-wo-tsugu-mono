# 親リポジトリの共通作業ルール

- ユーザーへの返答・質問・作業報告・終了時の要約や選択ボタン・コミットメッセージ・PRの説明は日本語で書く。コード中の識別子やコマンドはそのままでよい。
- Gitの管理単位はこの親ディレクトリ1つ。接続先は `https://github.com/shioa2006-game/DBQ3_shoku-wo-tsugu-mono.git` のみ。
- CH1～3、CH4～5、CH6～7、Character Studioは通常の子フォルダ。子に `.git` を作らず、旧GitLab・Studio単体リポジトリへpull/pushしない。
- 最初にルートREADMEと対象フォルダの `AGENTS.md`・READMEを読む。過去のarchive・品質記録にある個別リポジトリ/GitLab手順は現行の運用指示ではない。
- ストーリー資料の入口は [docs/story/README.md](docs/story/README.md)。第1～7章は現在の実装を基準にする（第6～7章は2026-11-14に実装。`docs/story/planned/` は制作時の計画で、実装と違えば実装を優先する）。旧企画書・脚本の移転案内やarchiveへ現行仕様を追記しない。実装間の不整合は [一覧](docs/story/inconsistencies.md) に記録し、文書整理だけでゲーム内の台詞を変更しない。
- 作業開始時に親で `git status --short --branch` を確認。他の未コミット変更を無断で破棄・上書き・まとめてコミットしない。
- 必要な変更と確認を終えて対象ファイルを指定してコミットする。pushはユーザーが依頼した範囲で行い、force push・共有履歴の改変は行わない。
- Git管理の統合と、ゲームの起動・セーブ領域の統合は別。各編の独立動作、既存セーブ、相対パスを維持する。
- コードを変更したゲームは `npm.cmd run test:ci`（ビルド含む）。章進行・戦闘・セーブ等へ影響するときは `test:e2e` も実行。Studio変更時は `npm.cmd test`。第1～3章と第4～5章のテストは同じ既定ポート（4174）を使うため順番に実行する（第6～7章は4176）。
- 画像原本はStudio、ゲームの原画は `art_src/`、読込画像は `assets/`。本編で使う画像・リグ設定を一緒に更新する。
- `node_modules/`、`dist/`、`work/`、比較テストのスクリーンショットはGit管理しない。Studioの `prototypes/*/output/` は制作成果物なので保持する。
- 既存サーバーやブラウザーを無断停止しない。ブラウザー確認は対象ゲームの公式testsまたは提供されたBrowser機能を使用する。
- 認証情報・秘密鍵・端末固有設定をコミットしない。GitHub認証情報を表示・ファイルへ平文保存しない。
- 運用手順は [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md)。統合前の履歴の参照方法は [docs/REPOSITORY_MIGRATION.md](docs/REPOSITORY_MIGRATION.md)。
