/* ============================================================
   Мобильная навигация: гамбургер для шапок с длинным меню.
   Подключается на страницах, где .topnav не помещается в строку
   (index: 9 пунктов). Короткие меню (1–3 пункта) не трогаются —
   они и так помещаются, кнопка там была бы лишней.
   Разметку не правим: кнопка вставляется скриптом.
   ============================================================ */
(function () {
  "use strict";
  var BREAKPOINT = 860;                 // синхронно с медиазапросом в styles.css
  var topbar = document.querySelector(".topbar");
  if (!topbar) return;
  var nav = topbar.querySelector(".topnav");
  if (!nav) return;
  if (nav.querySelectorAll("a, select, .auth-slot").length < 4) return;

  topbar.classList.add("topbar--collapsible");
  if (!nav.id) nav.id = "topnav";

  var ru = false;
  try { ru = (localStorage.getItem("saa:v1:lang") || "en") === "ru"; } catch (e) {}

  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-toggle";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", nav.id);
  btn.setAttribute("aria-label", ru ? "Меню" : "Menu");
  btn.innerHTML = '<span class="bars" aria-hidden="true"></span>';
  topbar.insertBefore(btn, nav);

  function setOpen(open) {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!nav.classList.contains("open"));
  });
  // переход по пункту — закрыть панель (обработчики самих пунктов не трогаем)
  nav.addEventListener("click", function (e) {
    if (e.target && e.target.closest && e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", function (e) {
    if (!topbar.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "Esc") setOpen(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > BREAKPOINT) setOpen(false);
  });
  // смена языка в панели — обновить подпись кнопки
  var sel = nav.querySelector("#lang-select");
  if (sel) sel.addEventListener("change", function () {
    btn.setAttribute("aria-label", this.value === "ru" ? "Меню" : "Menu");
  });
})();
