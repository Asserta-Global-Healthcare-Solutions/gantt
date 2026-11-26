// PROTOTIPO AP-002a. Utilidades compartidas por las dos direcciones.
import { toEpochDay, fromEpochDay, makeCalendar } from '../../engine-oracle/src/calendar.mjs';
export { toEpochDay, fromEpochDay, makeCalendar };

const fmt = (opts) => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...opts });
const dShort = fmt({ day: 'numeric', month: 'short' });
const dLong = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const dWeek = fmt({ weekday: 'narrow' });
const dMonth = fmt({ month: 'long', year: 'numeric' });
const dTime = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' });
const asDate = (iso) => new Date(`${iso}T00:00:00Z`);

export const fmtShort = (iso) => (iso ? dShort.format(asDate(iso)).replace('.', '') : '—');
export const fmtLong = (iso) => dLong.format(asDate(iso));
export const fmtWeekday = (iso) => dWeek.format(asDate(iso));
export const fmtMonth = (iso) => dMonth.format(asDate(iso));
export const fmtStamp = (ts) => `${fmtShort(ts.slice(0, 10))} · ${dTime.format(new Date(ts))}`;
export function isoWeek(iso) {
  const d = asDate(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // jueves de esa semana
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - jan4) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

export const STATUS = { pendiente: 'Pendiente', en_curso: 'En curso', bloqueada: 'Bloqueada', completada: 'Completada' };
export const CLASS = { AUTO: 'Automática', MANUAL: 'Manual', FACT_RUNNING: 'En curso (hechos)', FACT_DONE: 'Completada (hechos)', GROUP: 'Grupo' };
export const TYPE = { FS: 'Fin → inicio', SS: 'Inicio → inicio', FF: 'Fin → fin', SF: 'Inicio → fin' };
export const signed = (n) => (n == null ? '—' : n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
export const days = (n) => `${n} ${Math.abs(n) === 1 ? 'día' : 'días'}`;

export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : String(c));
  return n;
}
export const icon = (name, label) => el('span', { class: `i i-${name}`, 'aria-hidden': label ? null : 'true', role: label ? 'img' : null, 'aria-label': label });
export const avatar = (people, id, size = '') => id ? el('span', { class: `av ${size}`, title: people[id]?.name, 'aria-label': people[id]?.name, role: 'img' }, id) : el('span', { class: 'av av-none', 'aria-label': 'Sin responsable', role: 'img' }, '·');

/** Tema claro/oscuro con preferencia por visitante (almacenamiento opcional). */
export function initTheme(key, fallback) {
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem(key); } catch { /* sin almacenamiento */ }
  root.dataset.theme = saved || fallback;
  for (const b of document.querySelectorAll('[data-theme-toggle]')) {
    const sync = () => { b.setAttribute('aria-pressed', String(root.dataset.theme === 'dark')); b.title = root.dataset.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'; };
    sync();
    b.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, root.dataset.theme); } catch { /* sin almacenamiento */ }
      for (const x of document.querySelectorAll('[data-theme-toggle]')) x.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
      sync();
    });
  }
  const q = new URLSearchParams(location.search).get('theme');
  if (q) root.dataset.theme = q;
}

/** Estados de interfaz obligatorios (PRD §5) para revisar en el prototipo: ?estado=vacio|error|sinpermiso|cargando */
export function stateFromQuery() { return new URLSearchParams(location.search).get('estado'); }
export function stateBlock(kind) {
  const S = {
    vacio: ['Este proyecto aún no tiene tareas', 'Crea la primera tarea o parte de una plantilla. El calendario y los miembros ya están configurados.', 'Crear tarea', 'plus'],
    error: ['No se ha podido cargar el plan', 'El servidor no respondió (ref. 7f3a-91c2). Tus cambios no confirmados siguen en este navegador.', 'Reintentar', 'rotate-cw'],
    sinpermiso: ['No tienes acceso a este proyecto', 'Es un proyecto restringido. Puedes solicitar un acceso excepcional: lo aprueba su propietaria y caduca automáticamente.', 'Solicitar acceso', 'lock'],
    cargando: ['Cargando el plan…', 'Revisión 41 · 25 tareas', null, 'loader'],
  }[kind];
  if (!S) return null;
  return el('section', { class: `state state-${kind}`, role: kind === 'error' ? 'alert' : 'status' },
    icon(S[3]), el('h2', { text: S[0] }), el('p', { text: S[1] }), S[2] ? el('button', { class: 'btn btn-primary', type: 'button' }, S[2]) : null);
}
