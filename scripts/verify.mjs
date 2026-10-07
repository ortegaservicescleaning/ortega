// Verificaciones automáticas de la PWA.
//   node scripts/verify.mjs                → revisa dist/ (archivos, enlaces, manifiestos, service workers)
//   node scripts/verify.mjs --backend      → revisa que el backend de Apps Script responda en las 3 rutas y se pueda abrir dentro de la app
//   node scripts/verify.mjs --sitio <URL>  → revisa el sitio publicado (misma versión que dist/, archivos accesibles)
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIST = path.join(RAIZ, "dist");
const apps = JSON.parse(fs.readFileSync(path.join(RAIZ, "frontend/apps.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(RAIZ, "frontend/config.json"), "utf8"));
const errores = [];
const mal = (m) => { errores.push(m); console.log("✗ " + m); };
const bien = (m) => console.log("✓ " + m);
const arg = process.argv.slice(2);

function revisarDist() {
  if (!fs.existsSync(DIST)) return mal("No existe dist/. Ejecuta primero: node scripts/build.mjs");
  const refs = (html) => [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1].split("?")[0]).filter((r) => !r.startsWith("javascript"));
  const raiz = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  for (const r of refs(raiz)) if (!fs.existsSync(path.join(DIST, r.endsWith("/") ? r + "index.html" : r))) mal(`index.html → falta ${r}`);
  for (const a of apps) {
    const d = path.join(DIST, a.carpeta);
    const html = fs.readFileSync(path.join(d, "index.html"), "utf8");
    for (const r of refs(html)) if (!fs.existsSync(path.join(d, r))) mal(`${a.carpeta}/index.html → falta ${r}`);
    let man;
    try { man = JSON.parse(fs.readFileSync(path.join(d, "manifest.webmanifest"), "utf8")); } catch (e) { mal(`${a.carpeta}: manifiesto inválido`); continue; }
    if (man.display !== "standalone" || man.start_url !== "./" || man.scope !== "./") mal(`${a.carpeta}: manifiesto sin modo app`);
    for (const i of man.icons) if (!fs.existsSync(path.join(d, i.src))) mal(`${a.carpeta}: falta ícono ${i.src}`);
    if (!man.icons.some((i) => i.sizes === "512x512") || !man.icons.some((i) => i.purpose === "maskable")) mal(`${a.carpeta}: faltan íconos 512/maskable`);
    const sw = fs.readFileSync(path.join(d, "sw.js"), "utf8");
    if (/\{\{\w+\}\}/.test(sw + html)) mal(`${a.carpeta}: quedó una plantilla sin llenar`);
    const lista = JSON.parse(sw.match(/var ARCHIVOS = (\[.*?\]);/s)[1]);
    for (const f of lista.map((x) => x.split("?")[0])) if (!fs.existsSync(path.join(d, f === "./" ? "index.html" : f))) mal(`${a.carpeta}: el service worker guarda ${f} y no existe`);
    const cfg = fs.readFileSync(path.join(d, "config.js"), "utf8");
    if (!cfg.includes(config.portal) || !cfg.includes(`"RUTA": "${a.ruta}"`)) mal(`${a.carpeta}: config.js no apunta al backend o a la ruta correcta`);
    if (/CLAVE|SYNC_KEY|TOKEN|SECRET|PASSWORD/i.test(cfg + html + sw)) mal(`${a.carpeta}: parece contener un secreto`);
    bien(`${a.carpeta}: archivos, manifiesto, íconos y service worker`);
  }
}

async function revisarBackend() {
  for (const a of apps) {
    const url = `${config.portal}?${a.ruta}`;
    try {
      const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (OSC verificación)" } });
      const t = await r.text();
      const titulo = (t.match(/<title>([^<]*)/) || [])[1] || "";
      const xfo = (r.headers.get("x-frame-options") || "").toUpperCase();
      if (r.status !== 200) mal(`backend ?${a.ruta}: respondió ${r.status}`);
      else if (!titulo.includes(a.tituloEsperado)) mal(`backend ?${a.ruta}: título inesperado «${titulo}» (¿la implementación cambió o pide iniciar sesión de Google?)`);
      else if (xfo === "DENY" || xfo === "SAMEORIGIN") mal(`backend ?${a.ruta}: no deja abrirse dentro de la app (X-Frame-Options ${xfo}). En doGet hace falta setXFrameOptionsMode(ALLOWALL)`);
      else bien(`backend ?${a.ruta}: 200 · «${titulo}» · se puede abrir dentro de la app`);
    } catch (e) { mal(`backend ?${a.ruta}: sin respuesta (${e.message})`); }
  }
}

async function revisarSitio(base) {
  base = base.replace(/\/?$/, "/");
  const local = JSON.parse(fs.readFileSync(path.join(DIST, "version.json"), "utf8")).version;
  for (let intento = 1; intento <= 10; intento++) {
    const r = await fetch(base + "version.json?t=" + Date.now()).catch(() => null);
    const v = r && r.ok ? (await r.json()).version : null;
    if (v === local) break;
    if (intento === 10) return mal(`sitio: publicado «${v}», esperado «${local}»`);
    await new Promise((s) => setTimeout(s, 15000));
  }
  bien(`sitio: versión publicada ${local}`);
  for (const a of apps) for (const f of ["", "manifest.webmanifest", "sw.js", "config.js", `iconos/${a.icono}-512.png`]) {
    const r = await fetch(`${base}${a.carpeta}/${f}`).catch(() => null);
    if (!r || r.status !== 200) mal(`sitio: ${a.carpeta}/${f} no responde`);
  }
  bien("sitio: las 3 apps responden");
}

if (arg.includes("--backend")) await revisarBackend();
else if (arg.includes("--sitio")) await revisarSitio(arg[arg.indexOf("--sitio") + 1]);
else revisarDist();

if (errores.length) { console.log(`\n${errores.length} problema(s).`); process.exit(1); }
console.log("\nTodo bien.");
