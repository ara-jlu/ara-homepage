// <head> で同期に読み、最初の描画の前に <html> へ js のクラスを付ける。
// これで読み込みの幕や出現の演出の初期状態が最初から効き、中身が一瞬見えてから幕が下りるちらつきが起きない。
// 本体のスクリプトが動かなかったとき（読み込みの失敗や例外）に、透明な中身のまま止まらないよう、
// 4秒たっても本体が data-ready を付けていなければ js のクラスを外して、静的な中身をそのまま見せる。
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  setTimeout(function () {
    if (root.hasAttribute("data-ready")) return;
    root.classList.remove("js");
    if (document.body) document.body.classList.remove("loading");
  }, 4000);
})();
