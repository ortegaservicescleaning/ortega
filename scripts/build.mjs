// Genera la PWA (dist/) desde una sola fuente: frontend/ + backend-version.json.
// Uso: node scripts/build.mjs        (sin dependencias; Node 18+)
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FE = path.join(RAIZ, "frontend");
const DIST = path.join(RAIZ, "dist");

const leer = (f) => fs.readFileSync(path.join(FE, f), "utf8");
const json = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const llenar = (t, d) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (!(k in d)) throw new Error("Falta el valor {{" + k + "}}");
  return d[k];
});
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const config = json(path.join(FE, "config.json"));
const apps = json(path.join(FE, "apps.json"));
const back = fs.existsSync(path.join(RAIZ, "backend-version.json")) ? json(path.join(RAIZ, "backend-version.json")) : {};
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.portal)) throw new Error("config.json: portal no es una URL /exec válida");

const sha = (process.env.GITHUB_SHA || "local").slice(0, 7);
const backV = back.version ? String(back.version) : "0";
const version = `App ${back.descripcion || "v" + backV} · build ${sha}`;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const shell = leer("shell.html"), sw = leer("sw.js");
const comunes = ["logo-navy.png", "logo-blanco.png", "favicon-64.png"];

for (const a of apps) {
  const d = path.join(DIST, a.carpeta);
  fs.mkdirSync(path.join(d, "iconos"), { recursive: true });
  const iconos = [...comunes, ...["180", "192", "512", "maskable-512"].map((n) => `${a.icono}-${n}.png`)];
  for (const i of iconos) fs.copyFileSync(path.join(FE, "iconos", i), path.join(d, "iconos", i));
  for (const f of ["app.css", "app.js", "offline.html"]) fs.copyFileSync(path.join(FE, f), path.join(d, f));

  fs.writeFileSync(path.join(d, "config.js"),
    `/* Generado por scripts/build.mjs — no editar aquí: cambia frontend/config.json */\n` +
    `window.OSC_CONFIG = ${JSON.stringify({ PORTAL: config.portal, RUTA: a.ruta, VERSION: version }, null, 2)};\n`);

  fs.writeFileSync(path.join(d, "manifest.webmanifest"), JSON.stringify({
    name: a.nombre, short_name: a.corto, description: a.descripcion,
    id: "./", start_url: "./", scope: "./", display: "standalone", orientation: "any",   // "any": en iPad, tabletas y computadora la app gira y se puede agrandar
    background_color: a.fondo, theme_color: a.tema, lang: "es",
    icons: [
      { src: `iconos/${a.icono}-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `iconos/${a.icono}-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `iconos/${a.icono}-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, null, 2));

  fs.writeFileSync(path.join(d, "index.html"), llenar(shell, {
    nombre: esc(a.nombre), descripcion: esc(a.descripcion), tema: a.tema, corto: esc(a.corto), icono: a.icono,
    modo: a.modo, clase: a.clase, etiqueta: esc(a.etiqueta), version: esc(version), build: sha,
  }));

  const archivos = ["./", "./index.html", "./offline.html", `./app.css?v=${sha}`, `./app.js?v=${sha}`, `./config.js?v=${sha}`, "./manifest.webmanifest",
    ...iconos.filter((i) => !i.includes("maskable")).map((i) => "./iconos/" + i)];
  fs.writeFileSync(path.join(d, "sw.js"), llenar(sw, {
    version, cache: `osc-${a.carpeta}-b${backV}-${sha}`, prefijo: `osc-${a.carpeta}-`, archivos: JSON.stringify(archivos),
  }));
}

const tarjetas = apps.map((a) =>
  `    <a class="opcion" href="${a.carpeta}/"><img src="${a.carpeta}/iconos/${a.icono}-192.png" alt=""><span>${esc(a.tarjeta)}<small>${esc(a.detalle)}</small></span></a>`).join("\n");
fs.writeFileSync(path.join(DIST, "index.html"), llenar(leer("landing.html"), { tarjetas, version: esc(version) }));
fs.writeFileSync(path.join(DIST, ".nojekyll"), "");
fs.writeFileSync(path.join(DIST, "version.json"), JSON.stringify({ version, backend: back, build: sha, generado: new Date().toISOString() }, null, 2));

console.log(`PWA generada en dist/ · ${version} · apps: ${apps.map((a) => a.carpeta).join(", ")}`);
