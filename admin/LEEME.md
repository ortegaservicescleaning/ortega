# Ortega · Administrador (app instalable)

App independiente. Abre el portal en `/exec?admin=1` a pantalla completa, con ícono propio, pantalla de carga (claro y oscuro) y aviso sin internet.
No cambia el portal ni los datos.

## Publicar gratis en GitHub Pages
1. En https://github.com → **New repository** → nombre sugerido: `ortega-admin` → **Public** → Create.
2. **Add file → Upload files** → arrastra **todo el contenido** de esta carpeta (no la carpeta) → Commit.
3. **Settings → Pages** → «Deploy from a branch» → `main` / `(root)` → Save.
4. En 1–2 minutos: `https://TU-USUARIO.github.io/ortega-admin/`

## Instalar
- **iPhone:** Safari → Compartir → **Agregar a pantalla de inicio**.
- **Android:** Chrome → menú ⋮ → **Instalar app**.

## Notas
- La URL del portal está en `config.js` (línea PORTAL). No cambies la línea RUTA.
- Si cambias íconos o diseño, súbelos de nuevo y cambia `osc-admin-v1` a `v2` en `sw.js`.
- Necesita internet: el portal vive en Google.
