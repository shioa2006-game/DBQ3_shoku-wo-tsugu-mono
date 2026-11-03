# 小岩ガニ（第6章の採石洞）

[修正版の4方向参照画](../../references/small-rock-crab-4dir-v2.png)から、石の甲羅・金色の目・赤褐色のハサミ・左右4本ずつの歩脚を[コードで描く](character.mjs)。甲羅の面と割れ目は同じ立体の頂点を投影し、右側3方向は反転する。通常姿勢Aとハサミを持ち上げる姿勢Bを、各128pxの8方向シートに書き出す。

Studioで `npm.cmd run export:crab` を実行して再生成する。[モンスター比較画面](../../compare/ch4-5/monsters/?c=small_rock_crab)で方向・姿勢を選び、「種類」で大岩ガニの拡大試作も確認できる。拡大率は比較用。
