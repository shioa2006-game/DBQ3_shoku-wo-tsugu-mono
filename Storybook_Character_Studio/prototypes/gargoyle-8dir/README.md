# ガーゴイル（第7章の神殿防衛）

[飛行4方向画](../../references/gargoyle-flight-4dir-v1.png)と[着地修正版](../../references/gargoyle-landed-v2.png)を基に、[作画コード](character.mjs)で同じ石の体、角、牙と翼を描く。飛行のA/Bは翼を上げる・下ろす動き。地上のA/Bは翼を左右の肩から腰へ畳んだまま、左右の足を踏み替える動き。着地時に飛行用の2枚から地上用の2枚へ切り替える想定。

Studioで `npm.cmd run export:gargoyle` を実行すると、`output/` に飛行・地上それぞれのA/BのSVG・原画PNG・正規化PNG、比較画像、マニフェストを生成する。各シートは128pxセルを4列×2行で配置する。飛行の高さは表示時のオフセット0.4で表現する。

[比較画面](../../compare/ch4-5/monsters/?c=gargoyle)で飛行・地上、8方向、ポーズを選べる。地上の参照画は左斜め前の1枚を固定表示する。
