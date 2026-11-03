# Storybook Character Studio

「職をつぐ者」の8方向キャラクターをコードで制作するフォルダです。現在は人型7人（主人公・ミナ・ピノ・イナホ・ゴンタ・ジンベエ・ワタリ）とスライム・おおこうもり・おおねずみ・どろたぼう・イカを管理しています。人型は頭・胴の画像と3D手足、モンスターは全身画像2枚の切り替えで確認します。

- [制作一覧と移植対象](prototypes/README.md)
- [制作ガイド：これまでの指摘と再発防止](docs/CHARACTER_AUTHORING.md)
- [今回の整理内容](docs/CLEANUP.md)

Git管理は[親リポジトリ](../README.md)に統合しました。Studio単体へのpushは行いません。

## 開く

`start-studio.bat` をダブルクリックするか、`npm.cmd start` を実行します。通常は http://127.0.0.1:8081/ で主人公・ミナ・ピノ・イナホ・ゴンタ・ジンベエ・ワタリ・スライム・おおこうもり・おおねずみ・どろたぼう・イカの最新画像・比較画像・ダウンロードを開けます。既存の同じフォルダのサーバーを再利用します。起動機能はNode.js 18以上で動き、インストールは不要です。

3D比較（ゲーム側の `prototypes/` の比較ページ）も、このStudioのサーバーから開けます。サーバーは `/games/ch1-3/`・`/games/ch4-5/` でゲームのフォルダを読み取り専用で配り、比較ページは `three` をゲームの `node_modules` から読むので、ゲームの開発サーバーは不要です（各ゲームで `npm.cmd install` 済みであること）。例: 第4～5章の新しい人型 http://127.0.0.1:8081/games/ch4-5/prototypes/characters/ 、第1～3章のワタリ http://127.0.0.1:8081/games/ch1-3/prototypes/watari/ 。トップページの「3D比較を開く」から各ページへ移れます。起動ツールは、同じフォルダでも古いコードのまま動いているサーバーは再利用せず、次の空きポート（8082など）で新しく起動します。古いサーバーは止めないので、開いたURLは起動時の表示を見てください。ゲームのVite開発サーバー上でも同じページが動きます。

## 再生成する

Studioルートで実行します。同じ親フォルダに `dqb3-tsugumono-ch1-3` とそのインストール済み依存関係、ゲームの公式テストヘルパーが利用できるブラウザーが必要です。描画ライブラリや画像生成サービスへの接続は不要ですが、PNG生成はStudio単独では完結しません。

```powershell
npm.cmd run export:hero
npm.cmd run export:mina
npm.cmd run export:pino
npm.cmd run export:inaho
npm.cmd run export:gonta
npm.cmd run export:jinbei
npm.cmd run export:watari
npm.cmd run export:slime
npm.cmd run export:bat
npm.cmd run export:rat
npm.cmd run export:dorotabo
npm.cmd run export:squid
# 全員を制作フォルダ内へ出力
npm.cmd run export:all
```

`export-characters.bat` でも人型7人とモンスター5体を再生成できます。既存の最新生成物は上書きされます。コードが原本です。

ゲームの専用比較画像も更新する場合だけ、次を使います。旧参照画像やNPC設定は上書きしません。ただし、移植後の本編はこのコマンドが更新する `_code_` 画像を使用します。リグ設定を変更したときは、ゲームの `src/content/rig-profiles/` にも同期してください。

```powershell
npm.cmd run export:hero -- --preview-game
npm.cmd run export:mina -- --preview-game
npm.cmd run export:pino -- --preview-game
npm.cmd run export:inaho -- --preview-game
npm.cmd run export:gonta -- --preview-game
npm.cmd run export:jinbei -- --preview-game
npm.cmd run export:watari -- --preview-game
npm.cmd run export:slime -- --preview-game
npm.cmd run export:bat -- --preview-game
npm.cmd run export:rat -- --preview-game
npm.cmd run export:dorotabo -- --preview-game
npm.cmd run export:squid -- --preview-game
```

`--preview-game` が書くのは第1～3章だけです。`prototypes/shared/game-targets.mjs` で両編を書き出し先にしたキャラクター（主人公・ミナ・ゴンタ・ワタリ・おおこうもり・どろたぼう）は、書き出しの後に次で第4～5章にも同じ画像・原画・リグ設定を写します。`npm.cmd test` は、書き出し先のゲームがStudioの出力と違うと失敗します。

```powershell
npm.cmd run sync:games            # すべて
npm.cmd run sync:games -- mina    # 指定したキャラクターだけ
```

ミナ・ピノ・イナホ・ゴンタ・ジンベエ・ワタリは頭と胴を別々に読み込みます。比較用合成PNGだけを持ち出さず、2枚のPNGと `rig-profile.mjs` を一緒に扱ってください。主人公は従来の一枚シート方式ですが、方向別の頭の高さを指定する `rig-profile.mjs` も必要です。

## 構成

| 場所 | 役割 |
|---|---|
| `prototypes/adventurer-8dir/` | 主人公の作画コード・再生成・最新出力 |
| `prototypes/mina-8dir/` | ミナの作画コード・頭胴分離出力・リグ設定 |
| `prototypes/pino-8dir/` | ピノの作画コード・頭胴分離出力・リグ設定 |
| `prototypes/inaho-8dir/` | イナホの作画コード・頭胴分離出力・リグ設定 |
| `prototypes/gonta-8dir/` | ゴンタの作画コード・頭胴分離出力・リグ設定 |
| `prototypes/jinbei-8dir/` | ジンベエの作画コード・頭胴分離出力・リグ設定 |
| `prototypes/watari-8dir/` | ワタリの作画コード・頭胴分離出力・リグ設定 |
| `prototypes/slime-8dir/` | スライムの全身作画・2ポーズ出力・再生成 |
| `prototypes/night-bat-8dir/` | おおこうもりの全身作画・羽ばたき2ポーズ・再生成 |
| `prototypes/field-rat-8dir/` | おおねずみの全身作画・通常／かがむ2ポーズ・再生成 |
| `prototypes/dorotabo-8dir/` | どろたぼうの全身作画・泥が沈む2ポーズ・再生成 |
| `prototypes/squid-8dir/` | イカの全身作画・触腕2ポーズ・再生成 |
| `prototypes/shared/` | 目・鼻・SVG部品・方向順、各キャラクターの書き出し先のゲーム（`game-targets.mjs`） |
| `docs/` | 制作上の知見と整理記録 |
| `index.html` | 人型7人とモンスター5体の制作入口 |
| `tools/` | 起動とローカル静的配信 |
| `tests/node/` | 起動、作画維持、リンク・参照の検査 |

## 確認する

```powershell
npm.cmd test
```

PNGの再生成後は、ゲーム側の公式 `tests/authoring/adventurer.test.mjs`、`tests/authoring/mina.test.mjs`、`tests/authoring/pino.test.mjs`、`tests/authoring/inaho.test.mjs`、`tests/authoring/gonta.test.mjs`、`tests/authoring/jinbei.test.mjs`、`tests/authoring/watari.test.mjs` で実際のリグ表示を確認します。ゲームのコードを変更した場合はゲームの `AGENTS.md` に従ってビルド・回帰テストを実行してください。

2026-11-02、CH1～CH3の人型7人・基本モンスター5種を本編へ移植しました。作画原本は引き続きここで管理します。移植先と確認項目は [制作一覧](prototypes/README.md) を参照してください。

第4～5章のキャラクターも同じ方法で作り直します（[第4～5章の移植記録](../dqb3-tsugumono-ch4-5/docs/CHARACTER_ART.md)）。各キャラクターの書き出し先のゲームは `prototypes/shared/game-targets.mjs` に書き、`tests/node/game-targets.test.mjs` が、書き出し先のゲームの画像・原画・リグ設定がこのフォルダの出力と同じであること、両編の `rig.js` が同じであることを確かめます。

スライムは `tests/authoring/slime.test.mjs` で8方向・2ポーズの境界と切り替え・水中色・狭い画面を確認します。詳しくは [スライムの制作手順](prototypes/slime-8dir/README.md) を参照してください。

おおこうもりは [制作手順](prototypes/night-bat-8dir/README.md) と [比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/night-bat/) を参照。ゲーム側の `tests/authoring/night-bat.test.mjs` で8方向と飛行用の配置、羽ばたきを確認します。今後はCH1～3の制作・調整を優先し、残りの対象は [制作一覧](prototypes/README.md) で管理します。

おおねずみは [制作手順](prototypes/field-rat-8dir/README.md) と [比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/field-rat/) を参照。ゲーム側の `tests/authoring/field-rat.test.mjs` で8方向・2ポーズ・部品接続・接地位置を確認します。

どろたぼうは [制作手順](prototypes/dorotabo-8dir/README.md) と [比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/dorotabo/) を参照。ゲーム側の `tests/authoring/dorotabo.test.mjs` で8方向・2ポーズ・泥と草の接続・接地位置を確認します。

イカは [制作手順](prototypes/squid-8dir/README.md) と [比較ページ](http://127.0.0.1:5175/builder_sprite_lab/prototypes/squid/) を参照。ゲーム側の `tests/authoring/squid.test.mjs` で触腕の接続・浮遊・8方向・2ポーズを確認します。CH1～3の人型7人と基本モンスター5種は本編へ移植済みです。ボス3体も共用画像を切り替えています。
