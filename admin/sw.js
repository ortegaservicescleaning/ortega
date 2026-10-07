/* Service worker · Ortega Service Cleaning
   Guarda la cáscara (íconos, logo, estilos) para que la app abra al instante.
   El portal (Google Apps Script) siempre se pide por internet: los datos nunca se guardan en el teléfono. */
var CACHE = "osc-admin-v1";
var ARCHIVOS = [ "./", "./index.html", "./offline.html", "./app.css", "./app.js", "./config.js", "./manifest.webmanifest", "./iconos/logo-navy.png", "./iconos/logo-blanco.png", "./iconos/favicon-64.png", "./iconos/admin-192.png", "./iconos/admin-512.png", "./iconos/admin-180.png" ];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;               // Google Apps Script: directo a internet
  if (e.request.mode === "navigate") {                          // páginas: primero internet, si no hay → copia guardada u offline
    e.respondWith(fetch(e.request).then(function (r) {
      var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copia); }); return r;
    }).catch(function () {
      return caches.match(e.request).then(function (r) { return r || caches.match("./offline.html"); });
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(function (r) {    // íconos y estilos: copia guardada, y se actualiza por detrás
    var red = fetch(e.request).then(function (n) { caches.open(CACHE).then(function (c) { c.put(e.request, n.clone()); }); return n; }).catch(function () { return r; });
    return r || red;
  }));
});
