# 親リポジトリのGitHub運用

2026-11-02以降の接続先は `https://github.com/shioa2006-game/DBQ3_shoku-wo-tsugu-mono.git`。CH1～3、CH4～5、Character Studioをこの1つにまとめます。元の各リポジトリとの自動同期は行いません。

## 日常の操作

親ディレクトリで実行します。

```powershell
git status --short --branch
git remote -v
# 作業ツリーが整理済みで、GitHubの更新を取り込む場合
git pull --ff-only origin main

# 対象フォルダでビルド・テスト後、変更したファイルを指定
git add -- <変更したファイル>
git diff --cached --check
git diff --cached --stat
git commit -m "変更内容"
git push origin main
```

新しい開発環境では親リポジトリをcloneし、ルートREADMEに従い2ゲームの依存関係をインストールします。子フォルダごとのcloneやremote設定は不要です。GitHubの認証は端末の既存の認証機構を利用し、トークンをURLや設定ファイルへ埋め込まないでください。

## 管理するもの

- ゲームのコード、テスト、package.json・package-lock.json、原画・本編画像。
- Studioの作画コード、リグ設定、生成済みSVG・PNG・manifest、比較ページのHTML/JS。
- 企画、制作・移植・運用ドキュメント、過去の修正メモ。

依存ライブラリ、ビルド結果、キャッシュ、ログ、端末固有設定は親の `.gitignore` で除外します。CH1～3の `prototypes/**/*.png` は確認用の生成画像なので、テストが再生成してもコミットしません。旧画像は比較用に使っているため `assets/` から削除しません。

## ビルドと公開

通常のビルド・テストは各ゲームのローカルURLパスを使用します。相対URLで出力する必要がある場合だけ、対象ゲームのフォルダで次を実行します。

```powershell
$env:RELATIVE_ASSET_PATHS='1'
npm.cmd run build
Remove-Item Env:RELATIVE_ASSET_PATHS
```

GitLab CI設定は廃止しました。現在は [GitHub Actions](../.github/workflows/pages.yml) が、`main` の共通トップ・両ゲーム・公開処理に関するpushを受けてGitHub Pagesへ自動公開します。`tools/build-portal.mjs` が相対URLで両ゲームを専用フォルダへビルドし、共通トップとまとめて配信します。Studioは公開対象外です。PagesのSourceは「GitHub Actions」に設定します。手動実行や確認方法は [共通トップのREADME](../portal/README.md) を参照してください。

## 履歴

このリポジトリは統合時点の状態から履歴を開始します。統合以前の各履歴は外部のGit bundleへ保管しました。[統合記録](REPOSITORY_MIGRATION.md)に復元方法を記載しています。過去のメモ内のGitLab手順・旧コミットIDは歴史的な記録として扱ってください。
