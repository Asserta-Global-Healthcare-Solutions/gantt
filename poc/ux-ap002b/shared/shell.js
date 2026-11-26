// AP-002b · Shell común (Dirección C · Asserta): índice lateral 01..12, pestañas de proyecto a..f,
// selector de rol simulado en pie, tema claro/oscuro, 7 estados de interfaz y barra de recorridos.
import { initTooltips } from '../../ux-ap002a/shared/tooltip.js';
import { initTheme, stateFromQuery, el, icon, avatar } from '../../ux-ap002a/shared/util.js';
import { ROLES, TOURS } from './data-ext.js';

const ROLE_KEY = 'ap002b-role';
const THEME_KEY = 'ap002b-theme';
const PREF_KEY = 'ap002b-prefs';

export const DEFAULT_PREFS = {
  schemaVersion: 1,
  density: 'estandar',
  defaultZoom: 'dia',
  nav: 'abierta',
  panel: 'dock',
  panelWidthPx: 340,
  nameW: 220,
  projectZoom: { PPV2: 'dia' },
  tableColumns: {
    visible: ['code', 'name', 'status', 'resp', 'start', 'finish', 'float', 'prog', 'effort', 'costEst', 'costReal'],
    order: ['code', 'name', 'status', 'resp', 'start', 'finish', 'float', 'prog', 'effort', 'costEst', 'costReal'],
  },
  notifications: { mentions: true, plan: true, assignments: true, due: true, teamsDigest: false },
};

export function getPrefs() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') ?? {}; } catch { /* sin almacenamiento */ }
  const merged = {
    ...DEFAULT_PREFS,
    ...saved,
    projectZoom: { ...DEFAULT_PREFS.projectZoom, ...(saved.projectZoom ?? {}) },
    tableColumns: { ...DEFAULT_PREFS.tableColumns, ...(saved.tableColumns ?? {}) },
    notifications: { ...DEFAULT_PREFS.notifications, ...(saved.notifications ?? {}) },
  };
  const q = new URLSearchParams(location.search);
  const viewOnly = {
    density: q.get('densidad') || merged.density,
    zoom: q.get('zoom') || merged.projectZoom.PPV2 || merged.defaultZoom,
    nav: q.get('nav') || merged.nav,
    panel: q.get('panel') || merged.panel,
  };
  const save = (patch) => {
    Object.assign(merged, patch);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(merged)); } catch { /* sin almacenamiento */ }
  };
  const reset = () => {
    try { localStorage.removeItem(PREF_KEY); } catch { /* sin almacenamiento */ }
  };
  return { data: merged, viewOnly, save, reset };
}

export function getRole() {
  const q = new URLSearchParams(location.search).get('rol');
  if (q && ROLES[q]) return ROLES[q];
  let saved = 'pm';
  try { saved = localStorage.getItem(ROLE_KEY) || 'pm'; } catch { /* sin almacenamiento */ }
  return ROLES[saved] ?? ROLES.pm;
}

export function setRole(roleId) {
  if (!ROLES[roleId]) return;
  try { localStorage.setItem(ROLE_KEY, roleId); } catch { /* sin almacenamiento */ }
  const url = new URL(location.href);
  url.searchParams.delete('rol');
  location.href = url.toString();
}

export function extendedStateBlock(kind, context = {}) {
  const map = {
    cargando: {
      title: context.cargandoTitle ?? 'Cargando vista…',
      body: context.cargandoBody ?? 'Obteniendo datos desde el servidor (revisión 41 · contexto verificado).',
      icon: 'loader',
      actions: [],
    },
    vacio: {
      title: context.vacioTitle ?? 'Todavía no hay elementos aquí',
      body: context.vacioBody ?? 'Crea el primer registro o ajusta los filtros activos. Ninguna configuración previa se ha perdido.',
      icon: 'plus',
      actions: [{ label: context.vacioCta ?? 'Crear elemento', primary: true, href: context.vacioHref ?? 'proyectos.html' }],
    },
    error: {
      title: context.errorTitle ?? 'No se ha podido completar la consulta',
      body: context.errorBody ?? 'El servidor no respondió a tiempo (ref. cor-7f3a-91c2). Tus borradores no confirmados permanecen en esta pestaña.',
      icon: 'rotate-cw',
      actions: [{ label: 'Reintentar', primary: true, onClick: () => location.replace(location.pathname) }, { label: 'Volver a Inicio', href: 'inicio.html' }],
    },
    sinpermiso: {
      title: context.sinpermisoTitle ?? 'Sin permiso para consultar esta vista',
      body: context.sinpermisoBody ?? 'El servidor aplica denegación por defecto (ADR-003). Tu perfil actual no dispone de la capability necesaria y no se han enviado cifras ni contenidos restringidos al cliente.',
      icon: 'lock',
      actions: context.sinpermisoActions ?? [
        { label: 'Solicitar acceso excepcional', primary: true, href: 'ajustes-proyecto.html?p=AUDA#breakglass' },
        { label: 'Volver a Inicio', href: 'inicio.html' },
      ],
    },
    sesion: {
      title: 'Tu sesión ha caducado o ha sido invalidada',
      body: 'Es necesario volver a autenticarse mediante Microsoft Entra ID (OIDC). Por seguridad no se mantienen tokens en el navegador.',
      icon: 'key-round',
      actions: [{ label: 'Iniciar sesión con Entra ID', primary: true, onClick: () => location.replace(location.pathname) }],
    },
    conflicto: {
      title: 'Conflicto de revisión (HTTP 409)',
      body: 'Otro miembro confirmó la revisión 42 mientras editabas sobre la revisión 41. Recarga el plan actualizado para revisar el diff antes de aplicar tu cambio.',
      icon: 'triangle-alert',
      actions: [{ label: 'Recargar revisión 42', primary: true, onClick: () => location.replace(location.pathname) }, { label: 'Ver historial RF-33', href: 'tarea.html?task=2.1#historial' }],
    },
    pendiente: {
      title: context.pendienteTitle ?? 'Pendiente de aprobación o proceso en segundo plano',
      body: context.pendienteBody ?? 'La solicitud ha quedado registrada con trazabilidad y está a la espera de confirmación por una persona aprobadora distinta a la solicitante.',
      icon: 'clock',
      actions: [{ label: 'Ver notificaciones', primary: true, href: 'notificaciones.html' }, { label: 'Volver a Inicio', href: 'inicio.html' }],
    },
  };
  const cfg = map[kind];
  if (!cfg) return null;
  return el('section', { class: `state state-${kind}`, role: kind === 'error' || kind === 'conflicto' ? 'alert' : 'status' },
    icon(cfg.icon),
    el('h2', {}, cfg.title),
    el('p', {}, cfg.body),
    cfg.actions.length ? el('div', { class: 'state-actions' }, ...cfg.actions.map((a) =>
      a.href
        ? el('a', { class: `btn${a.primary ? ' btn-primary' : ''}`, href: a.href }, a.label)
        : el('button', { class: `btn${a.primary ? ' btn-primary' : ''}`, type: 'button', onclick: a.onClick }, a.label)
    )) : null
  );
}

export function initToast() {
  let box = document.querySelector('#toast');
  if (!box) {
    box = el('div', { class: 'toast', id: 'toast', role: 'status', 'aria-live': 'polite', hidden: true });
    document.body.append(box);
  }
  let timer;
  return (msg) => {
    box.textContent = msg;
    box.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { box.hidden = true; }, 3000);
  };
}

function tourBanner() {
  const q = new URLSearchParams(location.search);
  const tid = Number(q.get('tour'));
  if (!tid) return null;
  const tour = TOURS.find((t) => t.id === tid);
  if (!tour) return null;
  const stepIdx = Math.max(0, Math.min(tour.steps.length - 1, Number(q.get('step') || 1) - 1));
  const cur = tour.steps[stepIdx];
  const next = tour.steps[stepIdx + 1];
  const prev = tour.steps[stepIdx - 1];
  const linkWithTour = (step, idx) => {
    const sep = step.url.includes('?') ? '&' : '?';
    const [base, hash] = step.url.split('#');
    return `${base}${sep}tour=${tid}&step=${idx + 1}${hash ? `#${hash}` : ''}`;
  };
  return el('div', { class: 'tour-bar', role: 'region', 'aria-label': `Recorrido guiado ${tour.id}` },
    el('span', { class: 't-tag' }, `Recorrido ${tour.id}/7 · Paso ${stepIdx + 1}/${tour.steps.length} · ${tour.title}`),
    el('span', { class: 't-desc' }, cur.note),
    el('span', { class: 'sp' }),
    prev ? el('a', { class: 'btn', href: linkWithTour(prev, stepIdx - 1) }, icon('arrow-left'), 'Anterior') : null,
    next
      ? el('a', { class: 'btn btn-primary', href: linkWithTour(next, stepIdx + 1) }, `Siguiente: ${next.label}`, icon('arrow-right'))
      : el('a', { class: 'btn btn-primary', href: 'index.html' }, icon('check'), 'Fin del recorrido · Volver al mapa'),
    el('a', { class: 'btn btn-ghost', href: location.pathname, 'aria-label': 'Salir del recorrido' }, icon('x'))
  );
}

/**
 * Monta el shell C · Asserta en la página actual.
 * @param {object} opts { navKey, projectTab, onRoleChange }
 */
export function mountShell(opts = {}) {
  initTooltips();
  const role = getRole();
  const prefs = getPrefs();
  document.documentElement.dataset.density = prefs.viewOnly.density;

  const navItems = [
    { key: 'inicio', n: '01', t: 'Inicio', href: 'inicio.html', c: '9' },
    { key: 'proyectos', n: '02', t: 'Proyectos', href: 'proyectos.html', c: '4', sub: [
      { key: 'ppv2', code: 'PPV2', t: 'Portal de proveedores v2', href: 'gantt.html' },
      { key: 'merp', code: 'MERP', t: 'Migración del ERP a la nube', href: 'proyectos.html?p=MERP' },
      { key: 'ilab', code: 'ILAB', t: 'Interfaz con laboratorio externo', href: 'proyectos.html?p=ILAB' },
      { key: 'auda', code: 'AUDA', t: 'Auditoría interna de accesos', href: 'ajustes-proyecto.html?p=AUDA', restricted: true },
    ] },
    { key: 'cartera', n: '03', t: 'Cartera', href: 'cartera.html', c: '4' },
    { key: 'recursos', n: '04', t: 'Recursos', href: 'recursos.html', c: '7' },
    { key: 'horas', n: '05', t: 'Horas', href: 'horas.html', c: '34h' },
    { key: 'costes', n: '06', t: 'Costes', href: 'costes.html', c: role.caps.financialRead ? '€' : '—', lock: !role.caps.financialRead },
    { key: 'plantillas', n: '07', t: 'Plantillas', href: 'plantillas.html', c: '4' },
    { key: 'notificaciones', n: '08', t: 'Notificaciones', href: 'notificaciones.html', c: '2' },
    { key: 'import-export', n: '09', t: 'Import / Export', href: 'import-export.html', c: 'CSV' },
    { sep: true },
    { key: 'admin', n: '10', t: 'Administración', href: 'admin.html', c: 'IT' },
    { key: 'auditoria', n: '11', t: 'Auditoría', href: 'auditoria.html', c: 'SEC' },
    { key: 'integraciones', n: '12', t: 'Integraciones', href: 'integraciones.html', c: '2' },
  ];

  const isProjectView = ['gantt', 'tabla', 'kanban', 'tarea', 'ajustes-proyecto'].includes(opts.navKey);
  const toc = el('div', { class: 'toc' });
  for (const item of navItems) {
    if (item.sep) { toc.append(el('div', { class: 'toc-sep', role: 'separator' })); continue; }
    const active = opts.navKey === item.key;
    const open = item.key === 'proyectos' && (active || isProjectView);
    const link = el('a', {
      href: item.href,
      class: open && !active ? 'open' : '',
      'aria-current': active ? 'page' : null,
    },
      el('span', { class: 'n' }, item.n),
      el('span', { class: 't' }, item.t),
      el('span', { class: 'lead' }),
      item.lock ? icon('lock', 'Requiere permiso financiero') : el('span', { class: 'c' }, item.c)
    );
    toc.append(link);
    if (item.sub) {
      const sub = el('div', { class: 'sub' }, ...item.sub.map((s) => el('a', {
        href: s.href,
        'aria-current': isProjectView && s.key === (opts.projectCode?.toLowerCase() ?? 'ppv2') ? 'page' : null,
      },
        el('span', { class: 'g-code' }, s.code),
        el('span', { class: 't' }, s.t),
        s.restricted ? el('span', { class: 'i i-lock lock', role: 'img', 'aria-label': 'Restringido' }) : null
      )));
      toc.append(sub);
    }
  }

  const roleSelect = el('select', { id: 'sim-role', 'aria-label': 'Rol simulado en el prototipo' },
    ...Object.values(ROLES).map((r) => el('option', { value: r.id, selected: r.id === role.id }, r.label))
  );
  roleSelect.addEventListener('change', () => setRole(roleSelect.value));

  const nav = el('nav', { class: 'index', id: 'nav', 'aria-label': 'Índice principal' },
    el('a', { class: 'wordmark', href: 'index.html' }, el('b', {}, 'Asserta'), el('span', {}, 'Projects · provisional')),
    el('a', { class: 'toc-map', href: 'index.html', 'aria-current': opts.navKey === 'mapa' ? 'page' : null }, icon('compass'), 'Mapa (17) y 7 recorridos'),
    toc,
    el('div', { class: 'foot-wrap' },
      el('div', { class: 'role-sim' },
        el('label', { for: 'sim-role' }, 'Rol simulado'),
        roleSelect
      ),
      el('div', { class: 'foot' },
        el('span', { class: 'av', title: role.name, role: 'img', 'aria-label': role.name }, role.initials),
        el('span', { class: 'who' }, role.name, el('small', {}, role.title)),
        el('span', { class: 'sp' }),
        el('button', { class: 'btn btn-ghost', type: 'button', 'data-theme-toggle': '', 'aria-label': 'Cambiar tema claro u oscuro' }, icon('moon'))
      )
    )
  );

  const skip = el('a', { class: 'skip-link', href: '#main-content' }, 'Saltar al contenido principal');
  const existingNav = document.querySelector('#nav');
  if (existingNav) existingNav.replaceWith(nav);
  else document.body.prepend(nav);
  document.body.prepend(skip);

  initTheme(THEME_KEY, 'light');

  // Toggle navegación plegable y cajón móvil
  const mq = matchMedia('(max-width: 760px)');
  if (prefs.viewOnly.nav === 'plegada' && !mq.matches) document.body.classList.add('nav-plegada');

  const bindNavToggle = (btn) => {
    if (!btn) return;
    const sync = () => btn.setAttribute('aria-expanded', String(mq.matches ? document.body.classList.contains('nav-abierta-movil') : !document.body.classList.contains('nav-plegada')));
    btn.addEventListener('click', () => {
      if (mq.matches) document.body.classList.toggle('nav-abierta-movil');
      else {
        document.body.classList.toggle('nav-plegada');
        prefs.save({ nav: document.body.classList.contains('nav-plegada') ? 'plegada' : 'abierta' });
      }
      sync();
      opts.onNavToggle?.();
    });
    mq.addEventListener('change', () => {
      if (!mq.matches) document.body.classList.remove('nav-abierta-movil');
      sync();
    });
    sync();
    document.addEventListener('keydown', (e) => {
      if (e.key === '[' && !e.target.closest('input, select, textarea, dialog, [role="separator"]') && !e.ctrlKey && !e.metaKey && !e.altKey) btn.click();
    });
  };

  // Insertar barra de recorrido si ?tour=N está activo
  const tb = tourBanner();
  const main = document.querySelector('main');
  if (main) {
    main.id = 'main-content';
    if (tb) main.prepend(tb);
  }

  return { role, prefs, bindNavToggle, toast: initToast(), estado: stateFromQuery() };
}

export function projectTabs(activeTab, projectCode = 'PPV2') {
  const tabs = [
    { k: 'gantt', n: 'a', label: 'Gantt', href: 'gantt.html' },
    { k: 'tabla', n: 'b', label: 'Tabla', href: 'tabla.html' },
    { k: 'kanban', n: 'c', label: 'Kanban', href: 'kanban.html' },
    { k: 'tarea', n: 'd', label: 'Tarea', href: 'tarea.html?task=2.1' },
    { k: 'costes', n: 'e', label: 'Costes', href: 'costes.html' },
    { k: 'ajustes', n: 'f', label: 'Ajustes', href: projectCode === 'AUDA' ? 'ajustes-proyecto.html?p=AUDA' : 'ajustes-proyecto.html' },
  ];
  return el('nav', { class: 'tabs', 'aria-label': `Vistas del proyecto ${projectCode}` },
    ...tabs.map((t) => el('a', { href: t.href, 'aria-current': activeTab === t.k ? 'page' : null },
      el('span', { class: 'n' }, t.n), t.label))
  );
}

export function makeNavButton() {
  return el('button', {
    class: 'icon-btn', type: 'button', id: 'nav-btn', 'aria-controls': 'nav', 'aria-expanded': 'true',
    'data-tip': 'Mostrar u ocultar la navegación ( [ )',
  }, icon('panel-left'), el('span', { class: 'sr-only' }, 'Navegación'));
}

export function makeMasthead({ kickerParts, tabs, title, dateline, reads }) {
  const navBtn = makeNavButton();
  const kicker = el('div', { class: 'kicker' },
    navBtn,
    ...kickerParts,
    el('span', { class: 'sp' }),
    tabs ?? null,
    el('span', { class: 'proto-flag' }, 'Prototipo · datos ficticios')
  );
  const titlebar = el('div', { class: 'titlebar' },
    el('div', {}, el('h1', {}, title), dateline ? el('p', { class: 'dateline' }, ...dateline) : null),
    reads ? el('dl', { class: 'reads', 'aria-label': 'Lecturas principales' }, ...reads) : null
  );
  return { header: el('header', { class: 'masthead' }, kicker, titlebar), navBtn };
}

export function readItem(k, v, u = '', cls = '', tip = null) {
  return el('div', { class: `read ${cls}`, tabindex: tip ? '0' : null, 'data-tip': tip },
    el('dt', {}, k),
    el('dd', {}, v, u ? el('small', {}, u) : null)
  );
}

export function statusBadge(status) {
  const labels = { pendiente: 'Pendiente', en_curso: 'En curso', bloqueada: 'Bloqueada', completada: 'Completada' };
  const ic = { pendiente: 'circle-dashed', en_curso: 'circle-dot', bloqueada: 'triangle-alert', completada: 'circle-check' };
  return el('span', { class: 'badge badge-st', 'data-status': status }, icon(ic[status] ?? 'circle-dashed'), labels[status] ?? status);
}
