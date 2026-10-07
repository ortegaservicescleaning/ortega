/* Cáscara PWA · abre el portal de Google Apps Script a pantalla completa. */
(function () {
  var C = window.OSC_CONFIG || {};
  var modo = document.body.getAttribute("data-modo");          // "limpiadora" | "admin" | "reservar"
  var frame = document.getElementById("portal");
  var carga = document.getElementById("carga");
  var sinred = document.getElementById("sinred");

  // 1) Service worker (ícono, pantalla de carga y aviso sin conexión)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(function () {});
  }

  // 2) Abrir el portal correcto
  if (frame && C.PORTAL) {
    var url = C.PORTAL + "?" + C.RUTA;
    var listo = false;
    var quitar = function () { if (listo) return; listo = true; carga.classList.add("fuera"); setTimeout(function () { carga.remove(); }, 600); };
    var pedido = false;                                          // ignora el "load" del iframe vacío (about:blank)
    frame.addEventListener("load", function () { if (pedido) setTimeout(quitar, 350); });
    setTimeout(quitar, 9000);                                    // por si Google tarda: no dejar la pantalla de carga para siempre
    if (navigator.onLine === false) { sinred.classList.add("si"); }
    pedido = true; frame.src = url;
  }

  // 3) Pantalla completa exacta en iPhone instalado (el iPhone calcula mal el alto con la barra translúcida)
  function ajustarAlto() {
    if (!frame || window.navigator.standalone !== true) return;          // solo iPhone/iPad desde la pantalla de inicio
    var sa = document.getElementById("sa"), arriba = sa ? sa.offsetHeight : 0;
    var horizontal = window.innerWidth > window.innerHeight;
    var alto = horizontal ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    if (horizontal) arriba = 0;
    frame.style.top = arriba + "px";
    frame.style.bottom = "auto";
    frame.style.height = Math.max(alto - arriba, window.innerHeight - arriba) + "px";
  }
  ajustarAlto();
  window.addEventListener("resize", ajustarAlto);
  window.addEventListener("orientationchange", function () { setTimeout(ajustarAlto, 300); });

  // 4) Aviso cuando se va el internet; al volver, recarga el portal
  function red() {
    if (!sinred) return;
    if (navigator.onLine) {
      if (sinred.classList.contains("si")) { sinred.classList.remove("si"); if (frame) frame.src = frame.src; }
    } else { sinred.classList.add("si"); }
  }
  window.addEventListener("online", red);
  window.addEventListener("offline", red);
})();
