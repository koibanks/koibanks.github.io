/* In Spades reader: realistic page curl (StPageFlip, MIT) over the printed pages. */
(function () {
  "use strict";
  var NP = 100, AHEAD = 6;

  function $(id) { return document.getElementById(id); }

  function load(center) {
    var imgs = document.querySelectorAll(".page img");
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i], n = +im.getAttribute("data-n"), want = im.getAttribute("data-src");
      var near = n >= center - AHEAD && n <= center + AHEAD + 1;
      if (near && im.getAttribute("src") !== want) im.setAttribute("src", want);
      else if (!near && im.getAttribute("src") === want) im.setAttribute("src", "img/blank.png");
    }
  }

  function place(idx, instant) {
    // idx is the 0-based index of the left-most visible page
    var stage = $("stage"), sh = $("shadow");
    if (instant) stage.classList.add("now");
    var atFront = idx === 0, atBack = idx >= NP - 1;
    stage.classList.toggle("front", atFront);
    stage.classList.toggle("back", atBack);
    sh.style.left = atFront ? "576px" : "0px";
    sh.style.width = atFront || atBack ? "576px" : "1152px";
    var read = atFront ? 0 : Math.ceil(idx / 2), left = 50 - read;
    $("edgeL").style.width = (read / 50 * 7).toFixed(1) + "px";
    $("edgeR").style.width = (left / 50 * 7).toFixed(1) + "px";
    $("edgeL").style.opacity = read ? 1 : 0;
    $("edgeR").style.opacity = left ? 1 : 0;
    $("prev").disabled = atFront; $("next").disabled = atBack;
    if (instant) { void stage.offsetWidth; stage.classList.remove("now"); }
  }

  function start() {
    var pf = new window.St.PageFlip($("book"), {
      width: 576, height: 792, size: "fixed",
      showCover: true, usePortrait: false, drawShadow: true, maxShadowOpacity: 0.55,
      flippingTime: 900, mobileScrollSupport: false, showPageCorners: true,
      swipeDistance: 20, startPage: 0, autoSize: false
    });
    pf.loadFromHTML(document.querySelectorAll("#book .page"));

    var m = /p(\d+)/.exec(window.location.hash || "");
    var first = m ? Math.max(1, Math.min(NP, +m[1])) : 1;
    load(first);
    if (first > 1) pf.turnToPage(first - 1);
    place(pf.getCurrentPageIndex(), true);

    pf.on("flip", function (e) { load(e.data + 1); place(e.data, false); });
    pf.on("changeState", function (e) {
      if (e.data === "user_fold" || e.data === "flipping") load(pf.getCurrentPageIndex() + 1);
    });
    $("prev").addEventListener("click", function () { pf.flipPrev("top"); });
    $("next").addEventListener("click", function () { pf.flipNext("top"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); pf.flipNext("top"); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); pf.flipPrev("top"); }
    });
    window.addEventListener("hashchange", function () {
      var k = /p(\d+)/.exec(window.location.hash || "");
      if (k) { var n = Math.max(1, Math.min(NP, +k[1])); load(n); pf.turnToPage(n - 1); place(pf.getCurrentPageIndex(), true); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
