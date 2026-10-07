# Ortega Service Cleaning · App (PWA)

Este repositorio es el **frontend instalable** (PWA) del sistema. El **backend es Google Apps Script**: ahí viven la lógica, las APIs, las automatizaciones y los datos (Google Sheets). No hay una segunda base de datos ni una segunda copia del sistema.

## Arquitectura

```
 Teléfono (app instalada)
   └─ PWA · GitHub Pages  ←  este repo: ícono, pantalla de carga, modo app, aviso sin internet
        └─ abre en vivo →  Apps Script /exec?limpiadora=1 | ?admin=1 | ?reservar=1
                              └─ lógica, API, Kindred, iCloud, notificaciones, fotos, estados
                                   └─ Google Sheets (única base de datos)

 Apps Script ──(cada 15 min, clasp)──► ortega-backend (privado): copia del código + versión publicada
                                         └─ si hay versión nueva → actualiza backend-version.json aquí
                                              └─ GitHub Actions: genera, verifica y publica la PWA
```

- **Reservas, clientes, limpiadoras, administrador, estados, cancelaciones, fotos y notificaciones** se leen y escriben siempre en Apps Script, en tiempo real. La PWA no guarda datos.
- **Un cambio en Apps Script se ve en la app apenas lo publicas** como nueva versión de la misma implementación; no hay que reconstruir nada. La sincronización solo registra la versión y refresca la cáscara.
- **Se edita en un solo lugar:** la lógica y las pantallas del portal en Apps Script; la cáscara de la app (íconos, nombres, colores) aquí, en `frontend/`.

## Carpetas

| Ruta | Qué es | ¿Se edita? |
|---|---|---|
| `frontend/config.json` | URL `/exec` del backend | Solo si cambia la implementación |
| `frontend/apps.json` | Las 3 apps: nombre, ruta, colores, ícono | Sí |
| `frontend/shell.html`, `landing.html`, `app.css`, `app.js`, `sw.js`, `offline.html` | Plantillas únicas de la cáscara | Sí |
| `frontend/iconos/` | Íconos y logos | Sí |
| `backend-version.json` | Versión publicada en Apps Script | **No**: lo escribe ortega-backend |
| `scripts/build.mjs` | Genera `dist/` (las 3 apps + página de inicio) | No hace falta |
| `scripts/verify.mjs` | Revisa archivos, backend y sitio publicado | No hace falta |
| `.github/workflows/deploy-pwa.yml` | Genera → verifica → publica → comprueba | No hace falta |

`dist/` no se guarda en el repo: GitHub Actions lo genera en cada publicación.

## Cuándo se publica

- Al cambiar algo en `frontend/`, `scripts/` o `backend-version.json`.
- A mano: pestaña **Actions → Publicar PWA → Run workflow**.
- Una vez al día, como revisión de que el backend responde (te llega un correo de GitHub si algo falla).

Cada publicación lleva su número (`App v7.58 · build abc1234`), visible en la pantalla de carga, y cambia la caché del service worker para que los teléfonos tomen la cáscara nueva.

## Enlaces

- Limpiadoras: `https://posho1990-cloud.github.io/ortega/limpiadoras/`
- Administrador: `https://posho1990-cloud.github.io/ortega/admin/`
- Reservar: `https://posho1990-cloud.github.io/ortega/reservar/`

## Probar en tu computadora

```
node scripts/build.mjs && node scripts/verify.mjs && node scripts/verify.mjs --backend
```

## Seguridad

Este repo es público: no contiene claves, PIN ni tokens. El código del backend está solo en el repo **privado** `ortega-backend`. `verify.mjs` bloquea la publicación si detecta algo con forma de secreto.
