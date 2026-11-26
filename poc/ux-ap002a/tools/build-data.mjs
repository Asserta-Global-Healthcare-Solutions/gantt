// Genera shared/demo.js con datos FICTICIOS. Fechas, conflictos y holguras los calcula el oráculo de AP-004.
import { writeFileSync } from 'node:fs';
import { schedule } from '../../engine-oracle/src/schedule.mjs';

const TODAY = '2026-11-25';
const people = {
  LF: { name: 'Lucía Ferrer', role: 'Jefa de proyecto' },
  MP: { name: 'Marc Puig', role: 'Arquitecto' },
  NE: { name: 'Nerea Etxeberria', role: 'Diseño de producto' },
  JO: { name: 'Javier Ortega', role: 'Desarrollo' },
  AR: { name: 'Aitana Ruiz', role: 'Calidad' },
  OV: { name: 'Óscar Vidal', role: 'Soporte' },
};
const calendar = { weekdayMinutes: [480, 480, 480, 480, 480, 0, 0],
  exceptions: ['2026-12-08', '2026-12-25', '2027-01-01', '2027-01-06'].map((date) => ({ date, minutes: 0 })) };
const project = { startDate: '2026-11-02', timezone: 'Europe/Madrid' };

// code, name, kind, parent, extra
const T = [
  ['1', 'Descubrimiento', 'group'],
  ['1.1', 'Entrevistas con áreas usuarias', 'task', '1', { durationDays: 4, status: 'completada', actualStart: '2026-11-02', actualFinish: '2026-11-06', r: 'LF', c: ['NE'], effort: 1920 }],
  ['1.2', 'Inventario de integraciones', 'task', '1', { durationDays: 4, status: 'completada', actualStart: '2026-11-05', actualFinish: '2026-11-10', r: 'MP', effort: 1920 }],
  ['1.3', 'Alcance aprobado', 'milestone', '1', { status: 'completada', actualStart: '2026-11-12', actualFinish: '2026-11-12', r: 'LF' }],
  ['2', 'Diseño', 'group'],
  ['2.1', 'Arquitectura de integración', 'task', '2', { durationDays: 8, status: 'en_curso', actualStart: '2026-11-13', remainingDurationDays: 4, remainingAsOf: TODAY, progress: 55, r: 'MP', c: ['JO'], effort: 3840 }],
  ['2.2', 'Diseño de interfaz', 'task', '2', { durationDays: 10, status: 'en_curso', actualStart: '2026-11-16', progress: 40, r: 'NE', c: ['LF'], effort: 4800 }],
  ['2.3', 'Revisión de seguridad del diseño', 'task', '2', { durationDays: 3, r: 'AR', c: ['MP'], effort: 1440 }],
  ['2.4', 'Diseño aprobado', 'milestone', '2', { r: 'LF' }],
  ['3', 'Construcción', 'group'],
  ['3.1', 'Servicios de catálogo', 'group', '3'],
  ['3.1.1', 'API de catálogo', 'task', '3.1', { durationDays: 10, r: 'JO', effort: 4800 }],
  ['3.1.2', 'Sincronización con el ERP', 'task', '3.1', { durationDays: 8, r: 'MP', c: ['JO'], effort: 3840 }],
  ['3.2', 'Portal web', 'group', '3'],
  ['3.2.1', 'Maquetación de pantallas', 'task', '3.2', { durationDays: 12, r: 'NE', c: ['JO'], effort: 5760 }],
  ['3.2.2', 'Gestión de pedidos', 'task', '3.2', { durationDays: 9, r: 'JO', effort: 4320 }],
  ['3.2.3', 'Accesibilidad y textos', 'task', '3.2', { durationDays: 4, r: 'NE', c: ['AR'], effort: 1920 }],
  ['3.3', 'Formación al equipo de soporte', 'task', '3', { durationDays: 3, scheduleMode: 'manual', fixedStart: '2026-12-21', r: 'OV', c: ['LF'], effort: 1440 }],
  ['4', 'Validación', 'group'],
  ['4.1', 'Pruebas integradas', 'task', '4', { durationDays: 8, r: 'AR', c: ['JO', 'MP'], effort: 3840 }],
  ['4.2', 'Pruebas de aceptación con usuarios', 'task', '4', { durationDays: 6, r: 'LF', c: ['AR'], effort: 2880 }],
  ['4.3', 'Comunicación a proveedores', 'task', '4', { durationDays: 2, r: 'LF', effort: 960 }],
  ['5', 'Puesta en marcha', 'group'],
  ['5.1', 'Go-live', 'milestone', '5', { r: 'LF', deadline: '2027-02-05' }],
  ['5.2', 'Soporte reforzado', 'task', '5', { durationDays: 10, r: 'OV', effort: 4800 }],
];
const D = [
  ['1.1', '1.2', 'SS', 3], ['1.2', '1.3', 'FS', 0], ['1.3', '2.1', 'FS', 0], ['2.1', '2.2', 'SS', 1],
  ['2.1', '2.3', 'FS', 0], ['2.2', '2.4', 'FS', 0], ['2.3', '2.4', 'FS', 0],
  ['2.4', '3.1.1', 'FS', 0], ['3.1.1', '3.1.2', 'SS', 3], ['2.4', '3.2.1', 'FS', 0], ['3.2.1', '3.2.2', 'SS', 5],
  ['3.2.2', '3.2.3', 'FF', 0], ['3.2.2', '3.3', 'FS', 0], ['3.1.2', '4.1', 'FS', 0], ['3.2.2', '4.1', 'FS', 0],
  ['4.1', '4.2', 'FS', 0], ['4.2', '5.1', 'FS', 0], ['5.1', '4.3', 'SF', 0], ['5.1', '5.2', 'FS', 0],
];

const toInput = (rows, variant) => ({
  project, calendar, today: TODAY,
  tasks: rows.map(([id, , kind, parentId, x = {}]) => {
    const t = { id, kind, parentId: parentId ?? null };
    for (const k of ['durationDays', 'status', 'actualStart', 'actualFinish', 'remainingDurationDays', 'remainingAsOf', 'progress', 'scheduleMode', 'fixedStart', 'deadline']) if (x[k] != null) t[k] = x[k];
    if (x.effort) t.estimatedEffortMinutes = x.effort;
    return variant ? variant(t) : t;
  }),
  dependencies: D.map(([a, b, type, lagDays], i) => ({ id: `d${String(i + 1).padStart(2, '0')}`, predecessorId: a, successorId: b, type, lagDays })),
});

const input = toInput(T);
const plan = schedule(input);
if (plan.outcome !== 'ok') throw new Error(JSON.stringify(plan.errors));

// Línea base congelada el 2026-10-30: todo pendiente y automático, con las duraciones originales.
const ORIGINAL = { '1.1': 4, '2.1': 6, '2.2': 9, '3.2.1': 10 };
const base = schedule(toInput(T, (t) => {
  const { status, actualStart, actualFinish, remainingDurationDays, remainingAsOf, progress, scheduleMode, fixedStart, ...rest } = t;
  if (ORIGINAL[t.id]) rest.durationDays = ORIGINAL[t.id];
  return rest;
}));
if (base.outcome !== 'ok') throw new Error(JSON.stringify(base.errors));

const meta = Object.fromEntries(T.map(([id, name, kind, parent, x = {}]) => [id, { id, name, kind, parent: parent ?? null, responsible: x.r ?? null, collaborators: x.c ?? [], effort: x.effort ?? null, status: x.status ?? (kind === 'group' ? null : 'pendiente') }]));

const history = {
  '2.1': [
    { at: '2026-11-25T09:12:00Z', actor: 'MP', what: 'Trabajo restante', from: '6 días', to: '4 días', rev: 41 },
    { at: '2026-11-13T08:30:00Z', actor: 'MP', what: 'Estado', from: 'Pendiente', to: 'En curso · inicio real 13 nov', rev: 33 },
    { at: '2026-11-04T16:05:00Z', actor: 'LF', what: 'Duración', from: '6 días', to: '8 días', rev: 18, impact: '4 tareas desplazadas' },
    { at: '2026-10-28T10:00:00Z', actor: 'LF', what: 'Creó la tarea', rev: 3 },
  ],
  '3.3': [
    { at: '2026-11-20T11:40:00Z', actor: 'LF', what: 'Conflicto reconocido', to: 'd13 · FS desde 3.2.2', rev: 39 },
    { at: '2026-11-20T11:38:00Z', actor: 'LF', what: 'Modo', from: 'Automático', to: 'Manual · 21 dic', rev: 39 },
    { at: '2026-10-28T10:04:00Z', actor: 'LF', what: 'Creó la tarea', rev: 3 },
  ],
};

const otherProjects = [
  { code: 'MERP', name: 'Migración del ERP a la nube', progress: 48, health: 'red', reason: 'Hito «Corte de datos» vencido el 20 nov', owner: 'JO', restricted: false, next: { name: 'Corte de datos', date: '2026-11-20' } },
  { code: 'ILAB', name: 'Interfaz con laboratorio externo', progress: 62, health: 'amber', reason: 'Fin previsto 3 días después de la línea base', owner: 'MP', restricted: false, next: { name: 'Validación de mensajes', date: '2026-12-02' } },
  { code: 'AUDA', name: 'Auditoría interna de accesos', progress: 20, health: 'green', reason: 'Sin alertas', owner: 'LF', restricted: true, next: { name: 'Informe preliminar', date: '2026-12-15' } },
];
const otherTasks = [
  { code: 'MERP · 4.2', name: 'Validar extracción de pedidos históricos', project: 'MERP', finish: '2026-11-24', status: 'en_curso', progress: 70, relation: 'responsable' },
  { code: 'ILAB · 2.3', name: 'Revisar mapeo de mensajes', project: 'ILAB', finish: '2026-11-27', status: 'pendiente', progress: 0, relation: 'colaborador' },
  { code: 'AUDA · 1.2', name: 'Inventario de roles por aplicación', project: 'AUDA', finish: '2026-12-04', status: 'pendiente', progress: 0, relation: 'responsable' },
];
const notifications = [
  { at: '2026-11-25T08:41:00Z', kind: 'mencion', actor: 'NE', text: 'te mencionó en 3.2.1 Maquetación de pantallas', quote: '¿Revisamos el contraste del modo oscuro antes del viernes?', unread: true },
  { at: '2026-11-25T07:58:00Z', kind: 'plan', actor: 'MP', text: 'actualizó el trabajo restante de 2.1: desplaza 9 tareas', unread: true },
  { at: '2026-11-24T15:20:00Z', kind: 'asignacion', actor: 'JO', text: 'te añadió como colaboradora en ILAB · 2.3', unread: false },
  { at: '2026-11-23T09:02:00Z', kind: 'vencimiento', actor: null, text: 'MERP · 4.2 vence hoy', unread: false },
];

const DEMO = {
  generatedWith: 'poc/engine-oracle (AP-004) — oráculo desechable, no es el motor de producto',
  today: TODAY, me: 'LF', people, project: { ...project, code: 'PPV2', name: 'Portal de proveedores v2', revision: 41, restricted: false, owner: 'LF' },
  calendar, input, plan, baseline: { label: 'Línea base inicial', frozenAt: '2026-10-30', tasks: base.tasks, finishIdx: base.projectFinishIdx },
  meta, order: T.map(([id]) => id), history, otherProjects, otherTasks, notifications,
};
writeFileSync(new URL('../shared/demo.js', import.meta.url), `// GENERADO por tools/build-data.mjs — datos ficticios.\nexport const DEMO = ${JSON.stringify(DEMO, null, 1)};\n`);
console.log('tareas', T.length, '· conflictos', plan.conflicts.map((c) => `${c.dependencyId}→${c.successorId} −${c.deficitDays}d`).join(', ') || 'ninguno',
  '· fin', plan.tasks['5.1'].start, '(base', base.tasks['5.1'].start + ')', '· críticas', Object.entries(plan.tasks).filter(([, v]) => v.critical).map(([k]) => k).join(' '),
  '· avisos', plan.warnings.map((w) => `${w.code}:${w.taskId}`).join(' '));
