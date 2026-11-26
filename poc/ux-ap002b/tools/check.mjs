// AP-002b · Verificación automatizada (Playwright + axe-core + capturas JPEG + galería navegable).
// Reutiliza playwright-core, axe-core, @fontsource-variable y lucide-static de poc/ux-ap002a/node_modules.
// Uso: node poc/ux-ap002b/tools/check.mjs
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve, extname, normalize, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const POC_ROOT = resolve(here, '../..'); // .wt/ap002b/poc
const REPO_WT = resolve(POC_ROOT, '..'); // .wt/ap002b
const OUT_SHOTS = resolve(REPO_WT, 'docs/f0/assets/ap-002b');
const OUT_GALLERY = resolve(REPO_WT, 'docs/f0/AP-002b-galeria.html');
const OUT_LOG = resolve(here, '../check-results.log');

// Localizar node_modules real de ux-ap002a (en worktree o en el repositorio principal)
const NODE_MODS_CANDIDATES = [
  resolve(POC_ROOT, 'ux-ap002a/node_modules'),
  resolve(REPO_WT, '../../poc/ux-ap002a/node_modules'),
  'c:/repositorios/gantt/gantt/poc/ux-ap002a/node_modules',
];
const NODE_MODS = NODE_MODS_CANDIDATES.find((p) => existsSync(join(p, 'playwright-core')));
if (!NODE_MODS) throw new Error(`No se encontró playwright-core en: ${NODE_MODS_CANDIDATES.join(', ')}`);

const { chromium } = await import(pathToFileURL(join(NODE_MODS, 'playwright-core/index.mjs')).href);
const axeSrc = readFileSync(join(NODE_MODS, 'axe-core/axe.min.js'), 'utf8');
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
if (!CHROME) throw new Error('No se encontró Chrome ni Edge local');

mkdirSync(OUT_SHOTS, { recursive: true });

const logLines = [];
const log = (msg = '') => { console.log(msg); logLines.push(msg); };

// Servidor estático local con mapeo transparente de /ux-ap002a/node_modules/
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};
const notFoundUrls = new Set();
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  let target = null;
  if (pathname.startsWith('/ux-ap002a/node_modules/') || pathname.startsWith('/node_modules/')) {
    const rel = pathname.startsWith('/ux-ap002a/node_modules/')
      ? pathname.slice('/ux-ap002a/node_modules/'.length)
      : pathname.slice('/node_modules/'.length);
    const p = normalize(join(NODE_MODS, rel));
    if (p.startsWith(normalize(NODE_MODS) + sep) && existsSync(p) && statSync(p).isFile()) target = p;
  } else {
    const p = normalize(join(POC_ROOT, pathname));
    if (p.startsWith(normalize(POC_ROOT) + sep) && existsSync(p) && statSync(p).isFile()) target = p;
  }
  if (!target) {
    notFoundUrls.add(pathname);
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' }).end(readFileSync(target));
});
await new Promise((r) => server.listen({ port: 0, host: '127.0.0.1', backlog: 512 }, r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}/ux-ap002b`;

log(`AP-002b · Verificación automatizada (Playwright + axe-core)`);
log(`Servidor local: ${BASE}`);
log(`Assets node_modules: ${NODE_MODS}`);
log(`Navegador: ${CHROME}\n`);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let failures = 0, visits = 0, shotCount = 0;
const fail = (msg) => { failures++; log(`   ✗ ${msg}`); };

async function openPage(relUrl, { theme = 'light', width = 1440 } = {}) {
  const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(8000);
  const errors = [];
  const failedReqs = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) failedReqs.push(`${r.status()} ${r.url()}`); });
  const [pathAndQ, hash] = relUrl.split('#');
  const fullUrl = `${BASE}/${pathAndQ}${pathAndQ.includes('?') ? '&' : '?'}theme=${theme}${hash ? `#${hash}` : ''}`;
  await page.goto(fullUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);
  return { page, errors, failedReqs };
}

async function auditPage(page, errors, failedReqs, name, takeShot = true) {
  visits++;
  if (takeShot) {
    await page.screenshot({ path: join(OUT_SHOTS, `${name}.jpg`), type: 'jpeg', quality: 82 });
    shotCount++;
  }
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }));
  const serious = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  const minor = res.violations.length - serious.length;
  log(`${name.padEnd(44)} JS:${errors.length}  HTTP4xx:${failedReqs.length}  axe(S/C):${serious.length}  axe(M/m):${minor}`);
  for (const v of res.violations) {
    log(`   · [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodos) · ${v.nodes[0]?.html?.slice(0, 140)}`);
  }
  for (const e of errors) log(`   ! ${e}`);
  for (const f of failedReqs) log(`   ! HTTP ${f}`);
  failures += errors.length + failedReqs.length + serious.length;
}

const SCREENS = [
  { slug: '00-mapa', url: 'index.html', title: '00 · Mapa y 7 recorridos' },
  { slug: '01-inicio', url: 'inicio.html', title: '01 · Inicio' },
  { slug: '02-proyectos', url: 'proyectos.html', title: '02 · Listado de proyectos' },
  { slug: '03-gantt', url: 'gantt.html', title: '03 · Gantt (PPV2)' },
  { slug: '04-tabla', url: 'tabla.html', title: '04 · Tabla de tareas (PPV2)' },
  { slug: '05-kanban', url: 'kanban.html', title: '05 · Kanban (PPV2)' },
  { slug: '06-tarea', url: 'tarea.html?task=2.1', title: '06 · Detalle de tarea (PPV2)' },
  { slug: '07-cartera', url: 'cartera.html', title: '07 · Cartera de proyectos' },
  { slug: '08-recursos', url: 'recursos.html', title: '08 · Recursos y capacidad' },
  { slug: '09-horas', url: 'horas.html', title: '09 · Registro de horas' },
  { slug: '10-costes', url: 'costes.html', title: '10 · Costes y presupuestos' },
  { slug: '11-plantillas', url: 'plantillas.html', title: '11 · Plantillas' },
  { slug: '12-notificaciones', url: 'notificaciones.html', title: '12 · Notificaciones y RF-34' },
  { slug: '13-import-export', url: 'import-export.html', title: '13 · Importación y exportación' },
  { slug: '14-ajustes-proyecto', url: 'ajustes-proyecto.html', title: '14 · Configuración de proyectos' },
  { slug: '15-admin', url: 'admin.html', title: '15 · Administración' },
  { slug: '16-auditoria', url: 'auditoria.html', title: '16 · Auditoría de seguridad' },
  { slug: '17-integraciones', url: 'integraciones.html', title: '17 · Integraciones Teams y Jira' },
];

log('=== 1. Auditoría de las 17 pantallas + mapa (claro y oscuro · 1440 px) ===');
for (const s of SCREENS) {
  for (const theme of ['light', 'dark']) {
    const { page, errors, failedReqs } = await openPage(s.url, { theme, width: 1440 });
    await auditPage(page, errors, failedReqs, `${s.slug}-${theme}-1440`, true);
    await page.close();
  }
}

log('\n=== 2. Pasada multiresolución (1280, 1920 y móvil 390 px) ===');
const VIEWPORT_CHECKS = [
  { url: 'gantt.html?task=2.1&panel=dock', width: 1280, name: 'vp-gantt-1280' },
  { url: 'gantt.html?task=2.1&panel=dock', width: 1920, name: 'vp-gantt-1920' },
  { url: 'gantt.html', width: 390, name: 'vp-gantt-movil-390' },
  { url: 'inicio.html', width: 390, name: 'vp-inicio-movil-390' },
  { url: 'tabla.html', width: 1280, name: 'vp-tabla-1280' },
  { url: 'kanban.html', width: 390, name: 'vp-kanban-movil-390' },
  { url: 'recursos.html', width: 1920, name: 'vp-recursos-1920' },
  { url: 'costes.html', width: 1280, name: 'vp-costes-1280' },
];
for (const vc of VIEWPORT_CHECKS) {
  const { page, errors, failedReqs } = await openPage(vc.url, { theme: 'light', width: vc.width });
  await auditPage(page, errors, failedReqs, vc.name, true);
  await page.close();
}

log('\n=== 3. Los 7 estados obligatorios de interfaz (?estado=...) ===');
const STATES = ['cargando', 'vacio', 'error', 'sinpermiso', 'sesion', 'conflicto', 'pendiente'];
for (const st of STATES) {
  const { page, errors, failedReqs } = await openPage(`tabla.html?estado=${st}`, { theme: 'light', width: 1440 });
  await auditPage(page, errors, failedReqs, `estado-${st}-1440`, true);
  await page.close();
}

log('\n=== 4. Comprobaciones RBAC y flujos interactivos ===');
async function checkFn(label, url, fn, shotName = null) {
  const { page, errors, failedReqs } = await openPage(url, { theme: 'light', width: 1440 });
  try {
    const ok = await fn(page);
    if (shotName) {
      await page.screenshot({ path: join(OUT_SHOTS, `${shotName}.jpg`), type: 'jpeg', quality: 82 });
      shotCount++;
    }
    log(`   ${ok ? '✓' : '✗'} ${label}`);
    if (!ok) failures++;
  } catch (e) {
    fail(`${label}: ${e.message.split('\n')[0]}`);
  }
  for (const e of errors) fail(`${label} · ${e}`);
  for (const f of failedReqs) fail(`${label} · HTTP ${f}`);
  await page.close();
}

await checkFn('Costes (rol Miembro): estado sinpermiso limpio sin exponer EUR ni cifras', 'costes.html?rol=miembro', async (p) => {
  const txt = await p.textContent('main');
  return /No tienes permiso/.test(txt) && !/68\.500|60\.578|15\.154|€/.test(txt);
}, 'rbac-costes-miembro');

await checkFn('Costes (rol Admin IT): estado sinpermiso sin exponer cifras', 'costes.html?rol=admin', async (p) => {
  const txt = await p.textContent('main');
  return /No tienes permiso/.test(txt) && !/68\.500|€/.test(txt);
});

await checkFn('Tabla (rol Miembro): columnas económicas omitidas del DOM', 'tabla.html?rol=miembro', async (p) => {
  const heads = await p.locator('table th').allTextContents();
  return !heads.includes('Coste est.') && !heads.includes('Coste real');
}, 'rbac-tabla-miembro');

await checkFn('Detalle tarea (rol Miembro): historial RF-33 oculta diffs económicos', 'tarea.html?task=2.1&rol=miembro#historial', async (p) => {
  const txt = await p.textContent('main');
  return /Campos económicos omitidos/.test(txt) && !/84,50/.test(txt);
});

await checkFn('Admin (rol Miembro): bloqueo sinpermiso', 'admin.html?rol=miembro', async (p) => {
  return /Acceso restringido a platform\.admin/.test(await p.textContent('main'));
});

await checkFn('Admin (rol Admin IT): autoasignación de grant bloqueada', 'admin.html?rol=admin', async (p) => {
  await p.selectOption('#gr-user', 'CN');
  await p.click('button[type="submit"]');
  await p.waitForTimeout(100);
  return /Autoasignación bloqueada/.test(await p.textContent('main'));
}, 'rbac-admin-autoasignacion');

await checkFn('Kanban: mover 2.3 a En curso abre diálogo de impacto CH-03', 'kanban.html', async (p) => {
  await p.click('button[aria-label="Mover 2.3 a En curso"]');
  await p.waitForSelector('dialog.impact[open]');
  return /Sucesoras evaluadas/.test(await p.textContent('dialog.impact'));
}, 'flujo-kanban-impacto');

await checkFn('Importación: paso 3 detecta ciclo y vínculo a grupo, y bloquea avance hasta corregir', 'import-export.html', async (p) => {
  await p.click('button:has-text("Validación por fila")');
  await p.waitForTimeout(100);
  const txt = await p.textContent('main');
  const blocked = await p.locator('button:has-text("Siguiente paso")').isDisabled();
  return /Ciclo de dependencias/.test(txt) && /Vínculo prohibido a grupo/.test(txt) && blocked;
}, 'flujo-import-validacion');

await checkFn('Gantt: Alt+→ sobre 4.2 abre diálogo de impacto con conflicto nuevo y confirmación bloqueada', 'gantt.html', async (p) => {
  await p.click('.g-row[data-id="4.2"]');
  await p.keyboard.press('Alt+ArrowRight');
  await p.waitForSelector('dialog.impact[open]');
  const confirm = p.locator('dialog.impact .btn-primary');
  const blocked = await confirm.isDisabled();
  await p.check('dialog.impact input[type="checkbox"]');
  const unblocked = !(await confirm.isDisabled());
  return blocked && unblocked;
}, 'flujo-gantt-conflicto');

await checkFn('Proyectos: diálogo «Crear proyecto» añade proyecto nuevo a la tabla', 'proyectos.html', async (p) => {
  await p.click('button:has-text("Crear proyecto")');
  await p.waitForSelector('dialog.modal[open]');
  await p.fill('#cp-code', 'TST9');
  await p.fill('#cp-name', 'Proyecto prueba AP-002b');
  await p.click('dialog.modal button[type="submit"]');
  await p.waitForTimeout(150);
  return /TST9/.test(await p.textContent('table'));
});

await checkFn('Horas: envío de hoja semanal cambia estado a Enviada', 'horas.html', async (p) => {
  await p.click('button:has-text("Enviar hoja para aprobación")');
  await p.waitForTimeout(150);
  return /Enviada/.test(await p.textContent('#toolbar'));
});

log('\n=== 5. Validación de los 7 recorridos guiados (todos los pasos, cero errores JS/404) ===');
const { TOURS } = await import(pathToFileURL(resolve(here, '../shared/data-ext.js')).href);
for (const tour of TOURS) {
  let okSteps = 0;
  for (let i = 0; i < tour.steps.length; i++) {
    const s = tour.steps[i];
    const [base, hash] = s.url.split('#');
    const url = `${base}${base.includes('?') ? '&' : '?'}tour=${tour.id}&step=${i + 1}${hash ? `#${hash}` : ''}`;
    const { page, errors, failedReqs } = await openPage(url, { theme: 'light', width: 1440 });
    const hasBanner = await page.locator('.tour-bar').isVisible();
    if (!hasBanner) fail(`Recorrido ${tour.id} paso ${i + 1} (${s.label}): falta .tour-bar`);
    else if (errors.length === 0 && failedReqs.length === 0) okSteps++;
    for (const e of errors) fail(`Recorrido ${tour.id} paso ${i + 1}: ${e}`);
    for (const f of failedReqs) fail(`Recorrido ${tour.id} paso ${i + 1}: HTTP ${f}`);
    await page.close();
  }
  log(`   ${okSteps === tour.steps.length ? '✓' : '✗'} Recorrido 0${tour.id} · ${tour.title} (${okSteps}/${tour.steps.length} pasos)`);
}

await browser.close();
server.close();

// Generar docs/f0/AP-002b-galeria.html (abrible con doble clic)
const galleryHtml = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AP-002b · Galería de las 17 pantallas y 7 recorridos — C · Asserta</title>
<style>
  :root { --bg: #f4f1ea; --surface: #faf8f3; --text: #141413; --text-2: #4d4a43; --line: #d9d4c7; --line-s: #c2bba9; --brand: #1f5c63; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg: #121211; --surface: #181816; --text: #ece8de; --text-2: #b9b4a7; --line: #2e2c27; --line-s: #3f3c35; --brand: #6fb6bc; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 3px double var(--line-s); padding: 14px 20px; display: flex; flex-wrap: wrap; gap: 10px 20px; align-items: end; }
  h1 { font-size: 20px; margin: 0; letter-spacing: -.02em; }
  header p { margin: 2px 0 0; color: var(--text-2); font-size: 13px; }
  .ctl { display: grid; gap: 3px; font: 500 11px/1 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--text-2); }
  select { font: 14px system-ui; padding: 5px 8px; border: 1px solid var(--line-s); border-radius: 3px; background: var(--surface); color: var(--text); min-height: 32px; }
  main { padding: 18px 20px 56px; display: grid; gap: 32px; max-width: 1600px; margin: 0 auto; }
  h2 { font-size: 17px; margin: 0 0 12px; border-bottom: 1px solid var(--text); padding-bottom: 6px; display: flex; justify-content: space-between; align-items: baseline; }
  h2 small { font: 500 11px/1 ui-monospace, monospace; color: var(--text-2); text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 18px; }
  figure { margin: 0; display: grid; gap: 6px; }
  figcaption { font: 500 12px/1.3 ui-monospace, monospace; color: var(--text-2); display: flex; justify-content: space-between; gap: 8px; }
  figcaption b { color: var(--text); font-family: system-ui; font-size: 14px; }
  a.shot { display: block; border: 1px solid var(--line); border-radius: 3px; overflow: hidden; background: var(--surface); }
  img { display: block; width: 100%; height: auto; }
  .tours { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
  .tour { border: 1px solid var(--line); border-radius: 3px; background: var(--surface); padding: 12px 14px; }
  .tour h3 { margin: 0 0 4px; font-size: 14px; color: var(--brand); }
  .tour p { margin: 0; font-size: 12.5px; color: var(--text-2); }
</style>
</head>
<body>
<header>
  <div>
    <h1>AP-002b · Galería completa — Sistema C · Asserta</h1>
    <p>17 pantallas obligatorias + mapa interactivo, 7 recorridos, claro/oscuro, multiresolución, 7 estados y RBAC. Haz clic en cualquier captura para abrirla a tamaño real.</p>
  </div>
  <label class="ctl">Tema pantallas
    <select id="theme">
      <option value="light" selected>Claro (defecto C)</option>
      <option value="dark">Oscuro</option>
      <option value="both">Claro y Oscuro juntos</option>
    </select>
  </label>
  <label class="ctl">Filtrar por recorrido
    <select id="tour">
      <option value="all" selected>Todas las pantallas (17 + mapa)</option>
      <option value="1">01 · Creación de proyecto</option>
      <option value="2">02 · Planificación y reprogramación</option>
      <option value="3">03 · Ejecución de tareas</option>
      <option value="4">04 · Gestión de recursos</option>
      <option value="5">05 · Registro de horas</option>
      <option value="6">06 · Seguimiento económico</option>
      <option value="7">07 · Administración y permisos</option>
    </select>
  </label>
</header>
<main>
  <section aria-labelledby="h-tours">
    <h2 id="h-tours">Los 7 recorridos interactivos <small>Verificados con Playwright</small></h2>
    <div class="tours" id="tours-list"></div>
  </section>
  <section aria-labelledby="h-screens">
    <h2 id="h-screens">Las 17 pantallas + Mapa <small id="screens-note">1440 px</small></h2>
    <div class="grid" id="screens-grid"></div>
  </section>
  <section aria-labelledby="h-flows">
    <h2 id="h-flows">RBAC y flujos interactivos clave <small>Permisos, impactos y validaciones</small></h2>
    <div class="grid" id="flows-grid"></div>
  </section>
  <section aria-labelledby="h-vp">
    <h2 id="h-vp">Multiresolución (1280, 1920 y móvil 390 px) <small>Espacio real y adaptación móvil</small></h2>
    <div class="grid" id="vp-grid"></div>
  </section>
  <section aria-labelledby="h-states">
    <h2 id="h-states">Los 7 estados obligatorios de interfaz <small>?estado=...</small></h2>
    <div class="grid" id="states-grid"></div>
  </section>
</main>
<script>
  const DIR = 'assets/ap-002b/';
  const SCREENS = ${JSON.stringify(SCREENS.map((s) => ({ slug: s.slug, title: s.title })))};
  const TOUR_SLUGS = {
    1: ['11-plantillas', '02-proyectos', '14-ajustes-proyecto'],
    2: ['03-gantt', '04-tabla', '13-import-export'],
    3: ['01-inicio', '05-kanban', '06-tarea', '12-notificaciones'],
    4: ['07-cartera', '08-recursos'],
    5: ['09-horas', '06-tarea'],
    6: ['10-costes', '04-tabla', '06-tarea'],
    7: ['15-admin', '16-auditoria', '17-integraciones', '14-ajustes-proyecto'],
  };
  const TOURS = ${JSON.stringify(TOURS.map((t) => ({ id: t.id, title: t.title, goal: t.goal, steps: t.steps.map((s) => s.label) })))};
  const FLOWS = [
    ['rbac-costes-miembro.jpg', 'Costes · Miembro sin financial.read', 'sinpermiso sin cifras EUR'],
    ['rbac-tabla-miembro.jpg', 'Tabla · Miembro sin financial.read', 'columnas económicas omitidas'],
    ['rbac-admin-autoasignacion.jpg', 'Admin IT · Autoasignación bloqueada', 'ADR-003 DENY'],
    ['flujo-gantt-conflicto.jpg', 'Gantt · Diálogo impacto + conflicto', 'confirmar bloqueado hasta ack'],
    ['flujo-kanban-impacto.jpg', 'Kanban · Mover con impacto sucesoras', 'CH-03 / P-23'],
    ['flujo-import-validacion.jpg', 'Importación · Errores ciclo y grupo', 'bloqueo atómico'],
  ];
  const VPS = [
    ['vp-gantt-1280.jpg', 'Gantt · 1280 px', 'panel auto-flotante'],
    ['vp-gantt-1920.jpg', 'Gantt · 1920 px', 'panel acoplado'],
    ['vp-gantt-movil-390.jpg', 'Gantt · móvil 390 px', 'lista por fases'],
    ['vp-inicio-movil-390.jpg', 'Inicio · móvil 390 px', 'cajón lateral'],
    ['vp-kanban-movil-390.jpg', 'Kanban · móvil 390 px', 'una columna'],
    ['vp-tabla-1280.jpg', 'Tabla · 1280 px', 'scroll horizontal controlado'],
    ['vp-recursos-1920.jpg', 'Recursos · 1920 px', 'heatmap completo'],
    ['vp-costes-1280.jpg', 'Costes · 1280 px', 'EUR + coste incompleto'],
  ];
  const STATES = ${JSON.stringify(STATES.map((st) => [`estado-${st}-1440.jpg`, `Estado: ${st}`, `?estado=${st}`]))};

  const fig = (file, title, note) => {
    const f = document.createElement('figure');
    f.innerHTML = \`<figcaption><b>\${title}</b><span>\${note}</span></figcaption><a class="shot" href="\${DIR}\${file}" target="_blank" rel="noopener"><img loading="lazy" alt="\${title} — \${note}" src="\${DIR}\${file}"></a>\`;
    return f;
  };
  document.querySelector('#tours-list').replaceChildren(...TOURS.map((t) => {
    const d = document.createElement('div'); d.className = 'tour';
    d.innerHTML = \`<h3>0\${t.id} · \${t.title}</h3><p>\${t.goal}</p><p style="margin-top:6px;font-family:ui-monospace,monospace;font-size:11.5px">\${t.steps.join(' → ')}</p>\`;
    return d;
  }));
  document.querySelector('#flows-grid').replaceChildren(...FLOWS.map(([f, t, n]) => fig(f, t, n)));
  document.querySelector('#vp-grid').replaceChildren(...VPS.map(([f, t, n]) => fig(f, t, n)));
  document.querySelector('#states-grid').replaceChildren(...STATES.map(([f, t, n]) => fig(f, t, n)));

  function draw() {
    const th = document.querySelector('#theme').value;
    const tour = document.querySelector('#tour').value;
    const list = tour === 'all' ? SCREENS : SCREENS.filter((s) => TOUR_SLUGS[tour].includes(s.slug));
    const cards = [];
    for (const s of list) {
      if (th === 'both' || th === 'light') cards.push(fig(\`\${s.slug}-light-1440.jpg\`, s.title, 'Claro · 1440 px'));
      if (th === 'both' || th === 'dark') cards.push(fig(\`\${s.slug}-dark-1440.jpg\`, s.title, 'Oscuro · 1440 px'));
    }
    document.querySelector('#screens-note').textContent = \`\${cards.length} capturas · 1440 px\`;
    document.querySelector('#screens-grid').replaceChildren(...cards);
  }
  document.querySelector('#theme').addEventListener('change', draw);
  document.querySelector('#tour').addEventListener('change', draw);
  draw();
</script>
</body>
</html>
`;
writeFileSync(OUT_GALLERY, galleryHtml, 'utf8');

log(`\n=== Resumen ===`);
log(`Cargas auditadas (axe-core + errores JS + HTTP): ${visits}`);
log(`Capturas JPEG guardadas en docs/f0/assets/ap-002b/: ${shotCount}`);
log(`Galería generada: docs/f0/AP-002b-galeria.html`);
if (notFoundUrls.size) log(`URLs 404 detectadas: ${[...notFoundUrls].join(', ')}`);
log(failures ? `FALLOS TOTALES: ${failures}` : 'OK: 0 errores JS, 0 HTTP 4xx, 0 violaciones axe serias/críticas y todos los flujos/recorridos verificados');

writeFileSync(OUT_LOG, `${logLines.join('\n')}\n`, 'utf8');
process.exit(failures ? 1 : 0);
