// AP-002b · Datos sintéticos consistentes para las 17 pantallas.
// Reutiliza DEMO de AP-002a (plan PPV2 rev. 41 calculado con el oráculo AP-004).
import { DEMO } from '../../ux-ap002a/shared/demo.js';
export { DEMO };

export const ROLES = {
  pm: {
    id: 'pm',
    userId: 'LF',
    name: 'Lucía Ferrer',
    initials: 'LF',
    title: 'Jefa de proyecto',
    label: 'Jefa de proyecto (con financial.read)',
    caps: { projectRead: true, projectWrite: true, financialRead: true, approveTime: true, adminView: true, auditView: true, isItAdmin: false },
  },
  miembro: {
    id: 'miembro',
    userId: 'JO',
    name: 'Javier Ortega',
    initials: 'JO',
    title: 'Miembro · Desarrollo',
    label: 'Miembro (sin financial.read)',
    caps: { projectRead: true, projectWrite: false, financialRead: false, approveTime: false, adminView: false, auditView: false, isItAdmin: false },
  },
  admin: {
    id: 'admin',
    userId: 'CN',
    name: 'Carlos Navarro',
    initials: 'CN',
    title: 'Admin IT (sin contenido)',
    label: 'Admin IT (sin contenido de proyectos)',
    caps: { projectRead: false, projectWrite: false, financialRead: false, approveTime: false, adminView: true, auditView: true, isItAdmin: true },
  },
};

export const PEOPLE_EXT = {
  ...DEMO.people,
  CN: { name: 'Carlos Navarro', role: 'Administrador IT', team: 'Plataforma IT', email: 'c.navarro@asserta.internal', oid: 'oid-9f1a-402c', status: 'activo', sessions: 1, rateEur: null },
  'QA-V': { name: 'Perfil QA externo (virtual)', role: 'Recurso virtual', team: 'Calidad', email: null, oid: null, status: 'virtual', sessions: 0, rateEur: null, virtual: true },
};

// Tarifas congeladas (v2 vigente 2026-10-01). OV y QA-V sin tarifa a propósito (P-11: nunca 0 € ficticio).
export const RATES = {
  LF: { version: 'v2 · 01 oct 2026', eurHour: 78.00, team: 'PMO y Producto' },
  MP: { version: 'v2 · 01 oct 2026', eurHour: 84.50, team: 'Arquitectura' },
  NE: { version: 'v2 · 01 oct 2026', eurHour: 72.00, team: 'PMO y Producto' },
  JO: { version: 'v2 · 01 oct 2026', eurHour: 68.00, team: 'Ingeniería' },
  AR: { version: 'v2 · 01 oct 2026', eurHour: 66.00, team: 'Calidad' },
  OV: { version: null, eurHour: null, team: 'Soporte' },
  'QA-V': { version: null, eurHour: null, team: 'Calidad' },
};

export const PROJECTS = [
  {
    code: 'PPV2',
    name: 'Portal de proveedores v2',
    client: 'Operaciones y Compras',
    team: 'Ingeniería y Producto',
    owner: 'LF',
    status: 'activo',
    visibility: 'standard',
    restricted: false,
    progress: 17,
    health: 'amber',
    reason: 'Fin previsto +7 d laborables sobre la línea base · 1 conflicto de planificación (3.3)',
    startDate: '2026-11-02',
    finishDate: '2027-02-01',
    baselineFinish: '2027-01-21',
    next: { name: 'Diseño aprobado', date: '2026-12-04' },
    calendar: 'Corporativo España L–V · v2 (2026-2027)',
    budgetEur: 68500.00,
    actualEur: 15154.50,
    estimatedEur: 60578.00,
    incompleteCost: true,
    revision: 41,
    hasFullPlan: true,
  },
  {
    code: 'MERP',
    name: 'Migración del ERP a la nube',
    client: 'Finanzas y Operaciones',
    team: 'Arquitectura',
    owner: 'JO',
    status: 'en_riesgo',
    visibility: 'standard',
    restricted: false,
    progress: 48,
    health: 'red',
    reason: 'Hito «Corte de datos» vencido el 20 nov · dependencia externa sin cierre',
    startDate: '2026-09-14',
    finishDate: '2027-01-29',
    baselineFinish: '2027-01-15',
    next: { name: 'Corte de datos', date: '2026-11-20', overdue: true },
    calendar: 'Corporativo España L–V · v2 (2026-2027)',
    budgetEur: 112000.00,
    actualEur: 61440.00,
    estimatedEur: 118900.00,
    incompleteCost: false,
    revision: 28,
    hasFullPlan: false,
  },
  {
    code: 'ILAB',
    name: 'Interfaz con laboratorio externo',
    client: 'Calidad y Cumplimiento',
    team: 'Ingeniería y Producto',
    owner: 'MP',
    status: 'activo',
    visibility: 'standard',
    restricted: false,
    progress: 62,
    health: 'amber',
    reason: 'Fin previsto 3 días laborables después de la línea base inicial',
    startDate: '2026-10-05',
    finishDate: '2026-12-18',
    baselineFinish: '2026-12-15',
    next: { name: 'Validación de mensajes', date: '2026-12-02' },
    calendar: 'Corporativo España L–V · v2 (2026-2027)',
    budgetEur: 42000.00,
    actualEur: 27310.00,
    estimatedEur: 40850.00,
    incompleteCost: false,
    revision: 19,
    hasFullPlan: false,
  },
  {
    code: 'AUDA',
    name: 'Auditoría interna de accesos',
    client: 'Seguridad e IT',
    team: 'Seguridad',
    owner: 'LF',
    status: 'activo',
    visibility: 'restricted',
    restricted: true,
    progress: 20,
    health: 'green',
    reason: 'En plazo · sin conflictos ni hitos vencidos',
    startDate: '2026-11-16',
    finishDate: '2027-01-15',
    baselineFinish: '2027-01-15',
    next: { name: 'Informe preliminar', date: '2026-12-15' },
    calendar: 'Corporativo España L–V · v2 (2026-2027)',
    budgetEur: 19500.00,
    actualEur: 3120.00,
    estimatedEur: 18400.00,
    incompleteCost: false,
    revision: 7,
    hasFullPlan: false,
  },
  {
    code: 'MIG1',
    name: 'Consolidación directorio interno',
    client: 'Seguridad e IT',
    team: 'Plataforma IT',
    owner: 'MP',
    status: 'archivado',
    visibility: 'standard',
    restricted: false,
    progress: 100,
    health: 'green',
    reason: 'Cerrado y archivado el 15 oct 2026 · snapshot final inmutable',
    startDate: '2026-06-01',
    finishDate: '2026-10-15',
    baselineFinish: '2026-10-16',
    next: { name: 'Cierre documental', date: '2026-10-15' },
    calendar: 'Corporativo España L–V · v1 (2026)',
    budgetEur: 24000.00,
    actualEur: 22890.00,
    estimatedEur: 22890.00,
    incompleteCost: false,
    revision: 64,
    hasFullPlan: false,
  },
];

// Datos extendidos por tarea de PPV2 (horas reales, Jira, comentarios, tarifas)
export const TASK_EXT = {
  '1.1': { actualHours: 34, plannedHours: 32, jira: 'PROV-101', jiraStatus: 'Done', priority: 'Alta' },
  '1.2': { actualHours: 31, plannedHours: 32, jira: 'PROV-104', jiraStatus: 'Done', priority: 'Alta' },
  '1.3': { actualHours: 0, plannedHours: 0, jira: null, priority: 'Crítica' },
  '2.1': {
    actualHours: 46,
    plannedHours: 64,
    jira: 'PROV-118',
    jiraStatus: 'In Progress',
    priority: 'Crítica',
    comments: [
      { id: 'c1', at: '2026-11-25T09:15:00Z', actor: 'MP', body: 'Actualizo trabajo restante a 4 días tras validar el contrato de webhooks con @JO. Sin bloqueo técnico.' },
      { id: 'c2', at: '2026-11-24T16:40:00Z', actor: 'LF', body: 'Revisado el desplazamiento con @NE; mantenemos la ventana de revisión de seguridad 2.3 al cierre.' },
    ],
  },
  '2.2': {
    actualHours: 32,
    plannedHours: 80,
    jira: 'PROV-122',
    jiraStatus: 'In Progress',
    priority: 'Alta',
    comments: [
      { id: 'c3', at: '2026-11-25T08:41:00Z', actor: 'NE', body: '@LF ¿Revisamos el contraste del modo oscuro antes del viernes? Adjunto referencia en el repositorio interno.' },
    ],
  },
  '2.3': { actualHours: 0, plannedHours: 24, jira: 'PROV-129', jiraStatus: 'To Do', priority: 'Alta' },
  '2.4': { actualHours: 0, plannedHours: 0, jira: null, priority: 'Crítica' },
  '3.1.1': { actualHours: 0, plannedHours: 80, jira: 'PROV-135', jiraStatus: 'To Do', priority: 'Media' },
  '3.1.2': { actualHours: 0, plannedHours: 64, jira: 'PROV-136', jiraStatus: 'To Do', priority: 'Alta' },
  '3.2.1': {
    actualHours: 0,
    plannedHours: 96,
    jira: 'PROV-140',
    jiraStatus: 'To Do',
    priority: 'Crítica',
    comments: [
      { id: 'c4', at: '2026-11-25T08:41:00Z', actor: 'NE', body: '@LF pendiente de confirmar tokens definitivos cuando Marketing entregue la guía (P-25).' },
    ],
  },
  '3.2.2': { actualHours: 0, plannedHours: 72, jira: 'PROV-142', jiraStatus: 'To Do', priority: 'Crítica' },
  '3.2.3': { actualHours: 0, plannedHours: 32, jira: 'PROV-145', jiraStatus: 'To Do', priority: 'Media' },
  '3.3': {
    actualHours: 0,
    plannedHours: 24,
    jira: 'PROV-150',
    jiraStatus: 'To Do',
    priority: 'Media',
    comments: [
      { id: 'c5', at: '2026-11-20T11:42:00Z', actor: 'LF', body: 'Fecha manual fijada el 21 dic para reservar sala de formación de soporte. Conflicto d13 reconocido.' },
    ],
  },
  '4.1': { actualHours: 0, plannedHours: 64, jira: 'PROV-161', jiraStatus: 'To Do', priority: 'Crítica' },
  '4.2': { actualHours: 0, plannedHours: 48, jira: 'PROV-164', jiraStatus: 'To Do', priority: 'Crítica' },
  '4.3': { actualHours: 0, plannedHours: 16, jira: null, priority: 'Media' },
  '5.1': { actualHours: 0, plannedHours: 0, jira: 'PROV-170', jiraStatus: 'To Do', priority: 'Crítica' },
  '5.2': { actualHours: 0, plannedHours: 80, jira: 'PROV-172', jiraStatus: 'To Do', priority: 'Alta' },
};

// Historial extendido RF-33 (incluye entradas con financial:true para probar ocultación sin financial.read)
export const HISTORY_EXT = {
  '2.1': [
    ...DEMO.history['2.1'],
    { at: '2026-11-18T12:10:00Z', actor: 'LF', what: 'Tarifa congelada (coste real)', from: '82,00 €/h (v1)', to: '84,50 €/h (v2)', rev: 36, financial: true },
  ],
  '2.2': [
    { at: '2026-11-24T10:20:00Z', actor: 'NE', what: 'Progreso', from: '25 %', to: '40 %', rev: 40 },
    { at: '2026-11-16T09:00:00Z', actor: 'NE', what: 'Estado', from: 'Pendiente', to: 'En curso · inicio real 16 nov', rev: 34 },
    { at: '2026-11-02T09:30:00Z', actor: 'LF', what: 'Coste estimado inicial', to: '5.760,00 € (80 h · 72,00 €/h)', rev: 8, financial: true },
  ],
  '3.3': [
    ...DEMO.history['3.3'],
    { at: '2026-11-20T11:45:00Z', actor: 'LF', what: 'Estado económico', to: 'Coste incompleto (OV sin tarifa vigente)', rev: 39, financial: true },
  ],
};

// Heatmap de recursos: 10 días laborables (S48 y S49: 23 nov – 04 dic 2026)
export const HEATMAP_DAYS = [
  { iso: '2026-11-23', lbl: '23', dow: 'L', wk: 'S48', off: false },
  { iso: '2026-11-24', lbl: '24', dow: 'M', wk: 'S48', off: false },
  { iso: '2026-11-25', lbl: '25', dow: 'X', wk: 'S48', off: false, today: true },
  { iso: '2026-11-26', lbl: '26', dow: 'J', wk: 'S48', off: false },
  { iso: '2026-11-27', lbl: '27', dow: 'V', wk: 'S48', off: false },
  { iso: '2026-11-30', lbl: '30', dow: 'L', wk: 'S49', off: false },
  { iso: '2026-12-01', lbl: '01', dow: 'M', wk: 'S49', off: false },
  { iso: '2026-12-02', lbl: '02', dow: 'X', wk: 'S49', off: false },
  { iso: '2026-12-03', lbl: '03', dow: 'J', wk: 'S49', off: false },
  { iso: '2026-12-04', lbl: '04', dow: 'V', wk: 'S49', off: false },
];

export const RESOURCE_ROWS = [
  {
    id: 'LF', team: 'PMO y Producto', capDay: 8,
    days: [
      { h: 7, items: ['PPV2 · 2.2 (3 h)', 'MERP · 4.2 (2 h)', 'AUDA · 1.2 (2 h)'], restricted: true },
      { h: 8, items: ['PPV2 · 2.2 (4 h)', 'MERP · 4.2 (4 h)'] },
      { h: 7.5, items: ['PPV2 · 2.2 (3,5 h)', 'ILAB · 2.3 (2 h)', 'AUDA · 1.2 (2 h)'], restricted: true },
      { h: 8, items: ['PPV2 · 2.2 (4 h)', 'ILAB · 2.3 (4 h)'] },
      { h: 6, items: ['PPV2 · 2.2 (4 h)', 'AUDA · 1.2 (2 h)'], restricted: true },
      { h: 7, items: ['PPV2 · 2.4 prep (4 h)', 'AUDA · 1.2 (3 h)'], restricted: true },
      { h: 8, items: ['PPV2 · seguimiento (5 h)', 'AUDA · 1.2 (3 h)'], restricted: true },
      { h: 7, items: ['ILAB · 2.3 (3 h)', 'PPV2 · comité (4 h)'] },
      { h: 8, items: ['PPV2 · 2.4 (4 h)', 'AUDA · 1.2 (4 h)'], restricted: true },
      { h: 6, items: ['PPV2 · Hito 2.4 (6 h)'] },
    ],
  },
  {
    id: 'MP', team: 'Arquitectura', capDay: 8,
    days: [
      { h: 8, items: ['PPV2 · 2.1 (6 h)', 'ILAB · 2.1 (2 h)'] },
      { h: 9.5, items: ['PPV2 · 2.1 (6 h)', 'ILAB · 2.1 (3,5 h)'] },
      { h: 9.5, items: ['PPV2 · 2.1 (6 h)', 'ILAB · 2.2 (3,5 h)'] },
      { h: 8, items: ['PPV2 · 2.1 (6 h)', 'ILAB · 2.2 (2 h)'] },
      { h: 8, items: ['PPV2 · 2.1 (6 h)', 'ILAB · 2.2 (2 h)'] },
      { h: 8, items: ['PPV2 · 2.1 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.3 colab. (4 h)', 'ILAB · 2.4 (4 h)'] },
      { h: 7, items: ['PPV2 · 2.3 colab. (4 h)', 'ILAB · Hito (3 h)'] },
      { h: 6, items: ['PPV2 · 2.3 colab. (6 h)'] },
      { h: 5, items: ['PPV2 · arranque 3.1 (5 h)'] },
    ],
  },
  {
    id: 'NE', team: 'PMO y Producto', capDay: 8,
    days: [
      { h: 8, items: ['PPV2 · 2.2 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.2 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.2 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.2 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.2 (8 h)'] },
      { abs: 'VAC', h: 0, items: ['Ausencia registrada · código VAC (sin motivo)'] },
      { abs: 'VAC', h: 0, items: ['Ausencia registrada · código VAC (sin motivo)'] },
      { h: 6, items: ['PPV2 · revisión prototipo (6 h)'] },
      { h: 7, items: ['PPV2 · entrega diseño (7 h)'] },
      { h: 8, items: ['PPV2 · 3.2.1 (8 h)'] },
    ],
  },
  {
    id: 'JO', team: 'Ingeniería', capDay: 8,
    days: [
      { h: 8, items: ['PPV2 · 2.1 colab. (3 h)', 'MERP · 4.1 (5 h)'] },
      { h: 10, items: ['PPV2 · 2.1 colab. (4 h)', 'MERP · 4.1 (6 h)'] },
      { h: 10, items: ['PPV2 · 2.1 colab. (4 h)', 'MERP · 4.2 (6 h)'] },
      { h: 9, items: ['PPV2 · 2.1 colab. (3 h)', 'MERP · 4.2 (6 h)'] },
      { h: 8, items: ['MERP · 4.2 (8 h)'] },
      { h: 8, items: ['MERP · 4.3 (8 h)'] },
      { h: 7, items: ['MERP · 4.3 (7 h)'] },
      { h: 8, items: ['MERP · 4.3 (8 h)'] },
      { h: 6, items: ['PPV2 · prep 3.1.1 (6 h)'] },
      { h: 8, items: ['PPV2 · 3.1.1 (8 h)'] },
    ],
  },
  {
    id: 'AR', team: 'Calidad', capDay: 8,
    days: [
      { h: 6, items: ['ILAB · plan QA (6 h)'] },
      { h: 6, items: ['ILAB · plan QA (6 h)'] },
      { abs: 'AUS', h: 0, items: ['Ausencia registrada · código AUS (sin motivo médico)'] },
      { h: 7, items: ['ILAB · pruebas (7 h)'] },
      { h: 7, items: ['ILAB · pruebas (7 h)'] },
      { h: 4, items: ['ILAB · cierre QA (4 h)'] },
      { h: 8, items: ['PPV2 · 2.3 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.3 (8 h)'] },
      { h: 8, items: ['PPV2 · 2.3 (8 h)'] },
      { h: 5, items: ['PPV2 · validación 2.4 (5 h)'] },
    ],
  },
  {
    id: 'OV', team: 'Soporte', capDay: 8,
    days: [
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 5, items: ['PPV2 · guion 3.3 (3 h)', 'Soporte N2 (2 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 5, items: ['PPV2 · guion 3.3 (3 h)', 'Soporte N2 (2 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
      { h: 4, items: ['Soporte N2 operativo (4 h)'] },
    ],
  },
  {
    id: 'QA-V', team: 'Calidad', capDay: 8, virtual: true,
    days: [
      { h: 0, items: [] }, { h: 0, items: [] }, { h: 0, items: [] }, { h: 0, items: [] }, { h: 0, items: [] },
      { h: 4, items: ['PPV2 · reserva pruebas carga (4 h)'] },
      { h: 4, items: ['PPV2 · reserva pruebas carga (4 h)'] },
      { h: 6, items: ['PPV2 · reserva pruebas carga (6 h)'] },
      { h: 6, items: ['PPV2 · reserva pruebas carga (6 h)'] },
      { h: 6, items: ['PPV2 · reserva pruebas carga (6 h)'] },
    ],
  },
];

// Hojas semanales de horas (Semana 48: 23–27 nov 2026)
export const TIMESHEET_LF = {
  week: 'S48 · 23 – 29 nov 2026',
  status: 'borrador',
  reopenReason: null,
  rows: [
    { id: 'ts1', project: 'PPV2', task: '2.2 Diseño de interfaz', billable: true, mins: [180, 240, 210, 240, 180] },
    { id: 'ts2', project: 'MERP', task: '4.2 Validar extracción de pedidos históricos', billable: true, mins: [120, 240, 0, 120, 0] },
    { id: 'ts3', project: 'ILAB', task: '2.3 Revisar mapeo de mensajes', billable: false, mins: [0, 0, 120, 120, 60] },
    { id: 'ts4', project: 'AUDA', task: '1.2 Inventario de roles por aplicación', billable: false, mins: [120, 0, 120, 0, 120], restricted: true },
  ],
};

export const TIMESHEET_QUEUE = [
  { id: 'q1', person: 'MP', week: 'S47 · 16–22 nov', totalMins: 2400, projects: 'PPV2, ILAB', status: 'aprobada', rateFrozen: '84,50 €/h (v2)', reopenReason: null },
  { id: 'q2', person: 'NE', week: 'S48 · 23–29 nov', totalMins: 2280, projects: 'PPV2', status: 'enviada', rateFrozen: '72,00 €/h (v2)', reopenReason: null },
  { id: 'q3', person: 'JO', week: 'S48 · 23–29 nov', totalMins: 2520, projects: 'PPV2, MERP', status: 'enviada', rateFrozen: '68,00 €/h (v2)', reopenReason: null },
  { id: 'q4', person: 'AR', week: 'S47 · 16–22 nov', totalMins: 1920, projects: 'ILAB', status: 'reabierta', rateFrozen: '66,00 €/h (v2)', reopenReason: 'Imputación del miércoles registrada en ILAB · 2.1 en lugar de 2.3.' },
];

// Costes fijos PPV2
export const FIXED_COSTS_PPV2 = [
  { id: 'fc1', concept: 'Entorno preproducción portal (licencia temporal 3 meses)', date: '2026-11-05', estimatedEur: 3200.00, actualEur: 3200.00, status: 'aprobado' },
  { id: 'fc2', concept: 'Auditoría externa OWASP previa a Go-live', date: '2027-01-11', estimatedEur: 4800.00, actualEur: 0.00, status: 'previsto' },
  { id: 'fc3', concept: 'Certificado EV y dominio proveedores', date: '2026-11-18', estimatedEur: 450.00, actualEur: 492.00, status: 'aprobado' },
];

// Plantillas versionadas
export const TEMPLATES = [
  {
    id: 'TPL-WEB-3',
    name: 'Implantación de portal corporativo',
    version: 'v3.2',
    updated: '2026-10-15',
    owner: 'LF',
    calendar: 'Corporativo España L–V · v2',
    tasksCount: 25,
    depsCount: 19,
    durationDays: 55,
    description: 'Estructura completa de 5 fases (Descubrimiento, Diseño, Construcción, Validación y Puesta en marcha) con hitos de aprobación y dependencias FS/SS/FF/SF.',
    wbs: [
      { code: '1', name: 'Descubrimiento', kind: 'group', dur: '8 d' },
      { code: '1.1', name: 'Entrevistas con áreas usuarias', kind: 'task', dur: '4 d' },
      { code: '1.2', name: 'Inventario de integraciones', kind: 'task', dur: '4 d', dep: '1.1 SS+3' },
      { code: '1.3', name: 'Alcance aprobado', kind: 'milestone', dur: '0 d', dep: '1.2 FS' },
      { code: '2', name: 'Diseño', kind: 'group', dur: '15 d' },
      { code: '2.1', name: 'Arquitectura técnica', kind: 'task', dur: '8 d', dep: '1.3 FS' },
      { code: '2.2', name: 'Diseño de interfaz y accesibilidad', kind: 'task', dur: '10 d', dep: '2.1 SS+1' },
      { code: '2.3', name: 'Revisión de seguridad', kind: 'task', dur: '3 d', dep: '2.1 FS' },
      { code: '2.4', name: 'Diseño aprobado', kind: 'milestone', dur: '0 d', dep: '2.2 FS, 2.3 FS' },
    ],
  },
  {
    id: 'TPL-INT-2',
    name: 'Integración con sistema externo (API / mensajería)',
    version: 'v2.0',
    updated: '2026-09-28',
    owner: 'MP',
    calendar: 'Corporativo España L–V · v2',
    tasksCount: 14,
    depsCount: 11,
    durationDays: 32,
    description: 'Especificación de contrato, pruebas en entorno espejo, validación de errores y plan de contingencia sin copia de credenciales.',
    wbs: [
      { code: '1', name: 'Especificación y contrato', kind: 'group', dur: '6 d' },
      { code: '1.1', name: 'Mapeo de mensajes y códigos', kind: 'task', dur: '4 d' },
      { code: '1.2', name: 'Firma de contrato de interfaz', kind: 'milestone', dur: '0 d', dep: '1.1 FS' },
      { code: '2', name: 'Implementación y pruebas', kind: 'group', dur: '18 d' },
      { code: '2.1', name: 'Conector y reintentos idempotentes', kind: 'task', dur: '10 d', dep: '1.2 FS' },
      { code: '2.2', name: 'Pruebas de carga y fallos', kind: 'task', dur: '6 d', dep: '2.1 FS' },
    ],
  },
  {
    id: 'TPL-AUD-1',
    name: 'Auditoría interna y cumplimiento (restringido)',
    version: 'v1.4',
    updated: '2026-11-04',
    owner: 'LF',
    calendar: 'Corporativo España L–V · v2',
    tasksCount: 10,
    depsCount: 8,
    durationDays: 25,
    description: 'Plantilla con visibilidad restringida sugerida por defecto. Recogida de evidencias, revisión de controles e informe preliminar.',
    wbs: [
      { code: '1', name: 'Preparación y alcance', kind: 'group', dur: '5 d' },
      { code: '1.1', name: 'Inventario de activos y roles', kind: 'task', dur: '5 d' },
      { code: '2', name: 'Trabajo de campo e informe', kind: 'group', dur: '15 d' },
      { code: '2.1', name: 'Verificación de evidencias', kind: 'task', dur: '10 d', dep: '1.1 FS' },
      { code: '2.2', name: 'Informe preliminar', kind: 'milestone', dur: '0 d', dep: '2.1 FS' },
    ],
  },
  {
    id: 'TPL-MIG-2',
    name: 'Migración de plataforma y corte controlado',
    version: 'v2.1',
    updated: '2026-08-19',
    owner: 'JO',
    calendar: 'Corporativo España L–V · v2',
    tasksCount: 18,
    depsCount: 16,
    durationDays: 45,
    description: 'Incluye ensayo de migración, ventana de corte, validación de integridad y soporte reforzado post-corte.',
    wbs: [
      { code: '1', name: 'Preparación y ensayo', kind: 'group', dur: '15 d' },
      { code: '1.1', name: 'Extracción de prueba y reconciliación', kind: 'task', dur: '8 d' },
      { code: '1.2', name: 'Ensayo general aprobado', kind: 'milestone', dur: '0 d', dep: '1.1 FS' },
      { code: '2', name: 'Corte y estabilización', kind: 'group', dur: '12 d' },
      { code: '2.1', name: 'Ventana de corte', kind: 'task', dur: '2 d', dep: '1.2 FS' },
    ],
  },
];

// Notificaciones ampliadas
export const NOTIFICATIONS_EXT = [
  { id: 'n1', at: '2026-11-25T08:41:00Z', kind: 'mencion', actor: 'NE', project: 'PPV2', task: '3.2.1', href: 'tarea.html?task=3.2.1#comentarios', text: 'te mencionó en 3.2.1 Maquetación de pantallas', quote: '¿Revisamos el contraste del modo oscuro antes del viernes?', unread: true },
  { id: 'n2', at: '2026-11-25T07:58:00Z', kind: 'plan', actor: 'MP', project: 'PPV2', task: '2.1', href: 'gantt.html?task=2.1', text: 'actualizó el trabajo restante de 2.1 (r41): desplaza 9 tareas', quote: null, unread: true },
  { id: 'n3', at: '2026-11-24T15:20:00Z', kind: 'asignacion', actor: 'JO', project: 'ILAB', task: null, href: 'proyectos.html?p=ILAB', text: 'te añadió como colaboradora en ILAB · 2.3 Revisar mapeo de mensajes', quote: null, unread: false },
  { id: 'n4', at: '2026-11-23T09:02:00Z', kind: 'vencimiento', actor: null, project: 'MERP', task: null, href: 'cartera.html', text: 'MERP · 4.2 Validar extracción de pedidos históricos vence el 24 nov', quote: null, unread: false },
  { id: 'n5', at: '2026-11-20T11:41:00Z', kind: 'plan', actor: 'LF', project: 'PPV2', task: '3.3', href: 'gantt.html?task=3.3', text: 'reconoció el conflicto d13 (FS desde 3.2.2) en 3.3 Formación al equipo de soporte', quote: null, unread: false },
  { id: 'n6', at: '2026-11-19T17:10:00Z', kind: 'asignacion', actor: 'NE', project: 'PPV2', task: '2.2', href: 'horas.html', text: 'envió su hoja de horas S48 para aprobación (38 h)', quote: null, unread: false },
];

// Registro de auditoría de seguridad (append-only, separado del historial funcional RF-33)
export const SECURITY_AUDIT = [
  { id: 'aud-904', ts: '2026-11-25T09:12:04Z', corr: 'cor-7f3a-91c2', actor: 'MP', oid: 'oid-2b71-88a4', action: 'plan.commit', project: 'PPV2', result: 'ALLOW', diff: 'revision: 40 → 41 · task:2.1 remainingDays: 6 → 4 (sin cuerpos ni secretos)' },
  { id: 'aud-903', ts: '2026-11-25T08:50:19Z', corr: 'cor-4d19-20e1', actor: 'JO', oid: 'oid-6e04-11d9', action: 'financial.read', project: 'PPV2', result: 'DENY', diff: 'capability requerida: financial.read · 403 emitido sin cifras' },
  { id: 'aud-902', ts: '2026-11-25T08:14:52Z', corr: 'cor-9a80-66b3', actor: 'CN', oid: 'oid-9f1a-402c', action: 'project.read', project: 'AUDA', result: 'DENY', diff: 'platform.admin no concede project.read · acceso denegado por defecto' },
  { id: 'aud-901', ts: '2026-11-24T17:02:11Z', corr: 'cor-3c55-08f7', actor: 'CN', oid: 'oid-9f1a-402c', action: 'session.revoke_all', project: '—', result: 'ALLOW', diff: 'target: oid-5a11-77c0 · motivo: rotación de dispositivo · 2 sesiones invalidadas' },
  { id: 'aud-900', ts: '2026-11-24T14:33:40Z', corr: 'cor-8b22-41a0', actor: 'LF', oid: 'oid-1a01-99e2', action: 'breakglass.approve', project: 'AUDA', result: 'ALLOW', diff: 'solicitante: oid-2b71-88a4 (distinto de aprobadora) · caduca: 2026-11-26T14:33Z' },
  { id: 'aud-899', ts: '2026-11-23T11:18:05Z', corr: 'cor-1e44-55d2', actor: 'CN', oid: 'oid-9f1a-402c', action: 'grant.self_assign', project: 'PPV2', result: 'DENY', diff: 'autoasignación bloqueada (ADR-003): actor == destinatario' },
  { id: 'aud-898', ts: '2026-11-22T18:00:02Z', corr: 'cor-5f09-12c8', actor: 'SISTEMA', oid: 'job-jira-sync', action: 'integration.jira.sync', project: 'PPV2', result: 'ALLOW', diff: 'modo: linkOnly · 14 claves verificadas · 0 escrituras en Jira' },
];

// Grants administrativos con alcance
export const ADMIN_GRANTS = [
  { id: 'g1', user: 'LF', scopeType: 'project', scopeRef: 'PPV2', role: 'Propietaria + financial.read', grantedBy: 'CN', at: '2026-10-25' },
  { id: 'g2', user: 'LF', scopeType: 'project', scopeRef: 'AUDA (restringido)', role: 'Propietaria', grantedBy: 'CN', at: '2026-11-14' },
  { id: 'g3', user: 'MP', scopeType: 'team', scopeRef: 'Arquitectura', role: 'Gestor de recursos', grantedBy: 'CN', at: '2026-09-01' },
  { id: 'g4', user: 'JO', scopeType: 'project', scopeRef: 'PPV2', role: 'Colaborador (sin financial.read)', grantedBy: 'LF', at: '2026-10-28' },
  { id: 'g5', user: 'CN', scopeType: 'org', scopeRef: 'Organización Asserta', role: 'platform.admin + audit.read (sin project.read)', grantedBy: 'Comité IT', at: '2026-08-10' },
];

// Los 7 recorridos interactivos guiados
export const TOURS = [
  {
    id: 1,
    title: 'Creación de proyecto',
    goal: 'Elegir una plantilla versionada, revisar que no copia miembros/horas/costes, instanciar o crear un proyecto y revisar su calendario y visibilidad.',
    steps: [
      { label: 'Plantillas', url: 'plantillas.html', note: 'Inspecciona TPL-WEB-3 y pulsa «Instanciar plantilla».' },
      { label: 'Listado de proyectos', url: 'proyectos.html', note: 'Prueba el asistente «Crear proyecto» y los filtros por visibilidad/estado.' },
      { label: 'Ajustes del proyecto', url: 'ajustes-proyecto.html', note: 'Verifica calendario versionado, miembros y visibilidad.' },
    ],
  },
  {
    id: 2,
    title: 'Planificación y reprogramación',
    goal: 'Arrastrar o desplazar una tarea en el Gantt con vista previa, confirmar el diálogo de impacto, ajustar columnas en Tabla e importar datos con validación.',
    steps: [
      { label: 'Gantt', url: 'gantt.html', note: 'Desplaza una tarea automática (o Alt+→ sobre 4.2) para ver preview, impacto y conflicto.' },
      { label: 'Tabla de tareas', url: 'tabla.html', note: 'Configura columnas visibles/orden (RF-34) y edita un valor inline.' },
      { label: 'Import / Export', url: 'import-export.html', note: 'Recorre el asistente CSV/XLSX con detección de ciclo y vínculo a grupo.' },
    ],
  },
  {
    id: 3,
    title: 'Ejecución de tareas',
    goal: 'Revisar la agenda en Inicio, mover una tarjeta en Kanban con impacto en sucesoras, consultar comentarios/historial en Detalle y gestionar notificaciones.',
    steps: [
      { label: 'Inicio', url: 'inicio.html', note: 'Revisa tus 9 tareas abiertas, hitos y avisos de conflicto.' },
      { label: 'Kanban', url: 'kanban.html', note: 'Mueve «2.3 Revisión de seguridad» a En curso o Completada para comprobar el diálogo de impacto.' },
      { label: 'Detalle de tarea', url: 'tarea.html?task=2.1', note: 'Recorre las 4 pestañas: Detalle, Comentarios (@NE), Horas e Historial RF-33.' },
      { label: 'Notificaciones', url: 'notificaciones.html', note: 'Filtra avisos, marca como leída y revisa preferencias RF-34.' },
    ],
  },
  {
    id: 4,
    title: 'Gestión de recursos',
    goal: 'Detectar sobrecargas (> 8 h/día) sin reprogramar fechas, revisar ausencias sin motivo médico y comprobar la redacción de proyectos restringidos.',
    steps: [
      { label: 'Cartera', url: 'cartera.html', note: 'Consulta la salud explicada con símbolo+color y el aviso de proyecto restringido (AUDA).' },
      { label: 'Recursos y capacidad', url: 'recursos.html', note: 'Inspecciona la sobrecarga de JO/MP, el recurso virtual QA-V y la redacción de AUDA.' },
    ],
  },
  {
    id: 5,
    title: 'Registro de horas',
    goal: 'Imputar minutos positivos en la hoja semanal, enviarla, aprobar o reabrir con motivo explícito y verificar que no es fichaje laboral.',
    steps: [
      { label: 'Registro de horas', url: 'horas.html', note: 'Edita minutos en la hoja de LF, envíala y prueba aprobar/reabrir en la cola de gestión.' },
      { label: 'Detalle · Horas', url: 'tarea.html?task=2.1#horas', note: 'Comprueba las entradas vinculadas a la tarea 2.1.' },
    ],
  },
  {
    id: 6,
    title: 'Seguimiento económico',
    goal: 'Revisar tarifas congeladas, desviación presupuestaria, el indicador «Coste incompleto (sin tarifa)» y la ocultación estricta al cambiar de rol.',
    steps: [
      { label: 'Costes y presupuestos', url: 'costes.html', note: 'Comprueba EUR (2 decimales), «Coste incompleto» en 3.3/5.2 y cambia el rol en el pie a Miembro o Admin IT.' },
      { label: 'Tabla (columnas económicas)', url: 'tabla.html', note: 'Comprueba que las columnas económicas desaparecen sin financial.read.' },
      { label: 'Detalle · Historial RF-33', url: 'tarea.html?task=2.1#historial', note: 'Comprueba la ocultación de diffs económicos según permiso.' },
    ],
  },
  {
    id: 7,
    title: 'Administración y permisos',
    goal: 'Gestionar usuarios Entra ID, revocar sesiones, aplicar grants sin autoasignación, auditar eventos append-only y configurar Teams/Jira.',
    steps: [
      { label: 'Administración', url: 'admin.html', note: 'Prueba «Invalidar todas las sesiones» y la regla de no autoasignación en grants.' },
      { label: 'Auditoría de seguridad', url: 'auditoria.html', note: 'Filtra eventos append-only por resultado DENY/ALLOW y correlationId.' },
      { label: 'Integraciones', url: 'integraciones.html', note: 'Revisa Teams Workflows (tenant vs Anyone) y Jira solo lectura (linkOnly vs metadata).' },
      { label: 'Ajustes · Break-glass', url: 'ajustes-proyecto.html?p=AUDA', note: 'Revisa la solicitud de acceso excepcional con aprobador distinto y caducidad.' },
    ],
  },
];

export const SCREENS = [
  { id: '01', file: 'inicio.html', name: 'Inicio', group: 'Espacio personal', desc: 'Mi trabajo, agenda por fecha de fin, hitos, avisos de conflicto y acceso directo a proyectos.' },
  { id: '02', file: 'proyectos.html', name: 'Listado de proyectos', group: 'Proyectos', desc: 'Búsqueda, filtros por estado/cliente/equipo/archivados, proyectos PPV2/MERP/ILAB/AUDA y flujo «Crear proyecto».' },
  { id: '03', file: 'gantt.html', name: 'Gantt', group: 'Proyecto PPV2 (a)', desc: 'Referencia oficial C · Asserta integrada: vista previa, diálogo de impacto, densidad, panel adaptable, pantalla completa y RF-34.' },
  { id: '04', file: 'tabla.html', name: 'Tabla de tareas', group: 'Proyecto PPV2 (b)', desc: 'Mismo plan rev. 41, edición inline, selector/orden de columnas (RF-34), filtros no destructivos y columnas económicas condicionadas.' },
  { id: '05', file: 'kanban.html', name: 'Kanban', group: 'Proyecto PPV2 (c)', desc: 'Columnas Pendiente/En curso/Bloqueada/Completada, movimiento accesible por botones/drag e impacto cuando afecta a sucesoras.' },
  { id: '06', file: 'tarea.html?task=2.1', name: 'Detalle de tarea', group: 'Proyecto PPV2 (d)', desc: 'Vista completa con 4 pestañas: Detalle, Comentarios (@NE, aviso R-08), Horas e Historial RF-33 con ocultación económica.' },
  { id: '07', file: 'cartera.html', name: 'Cartera de proyectos', group: 'Dirección', desc: 'Resumen ejecutivo, indicadores de salud con símbolo+color y motivo explícito (no IA), próximos hitos y aviso AUDA.' },
  { id: '08', file: 'recursos.html', name: 'Recursos y capacidad', group: 'Dirección', desc: 'Heatmap diario/semanal, sobrecarga > 8 h/día sin reprogramar, ausencias con código mínimo y proyectos restringidos redactados.' },
  { id: '09', file: 'horas.html', name: 'Registro de horas', group: 'Seguimiento', desc: 'Hoja semanal LF, flujo Borrador → Enviada → Aprobada → Reabierta (con motivo), cola de aprobación y aviso no fichaje.' },
  { id: '10', file: 'costes.html', name: 'Costes y presupuestos', group: 'Proyecto PPV2 (e)', desc: 'Tarifas congeladas, costes fijos, desviación en EUR, indicador «Coste incompleto (sin tarifa)» y bloqueo sin financial.read.' },
  { id: '11', file: 'plantillas.html', name: 'Plantillas', group: 'Estandarización', desc: 'Catálogo versionado con estructura WBS y flujo «Instanciar plantilla» con fecha de inicio, remapeo y exclusión de datos sensibles.' },
  { id: '12', file: 'notificaciones.html', name: 'Notificaciones y preferencias', group: 'Espacio personal', desc: 'Bandeja leída/no leída con filtros, enlaces directos y panel completo de Preferencias de usuario (RF-34) + restablecer.' },
  { id: '13', file: 'import-export.html', name: 'Importación y exportación', group: 'Intercambio', desc: 'Asistente CSV/XLSX (mapeo, validación de ciclo/grupo, preview atómico) y exportación con neutralización de fórmulas y permisos.' },
  { id: '14', file: 'ajustes-proyecto.html', name: 'Configuración de proyectos', group: 'Proyecto PPV2 (f)', desc: 'Calendario versionado inmutable con preview de impacto, miembros, líneas base, visibilidad, break-glass y presupuesto.' },
  { id: '15', file: 'admin.html', name: 'Administración', group: 'Gobierno IT', desc: 'Usuarios Entra ID (tid+oid), invalidar sesiones, equipos, calendarios corporativos y grants con alcance sin autoasignación.' },
  { id: '16', file: 'auditoria.html', name: 'Auditoría de seguridad', group: 'Gobierno IT', desc: 'Registro append-only separado de RF-33 con filtros por actor/acción/resultado/correlationId y diffs sanitizados.' },
  { id: '17', file: 'integraciones.html', name: 'Integraciones Teams y Jira', group: 'Gobierno IT', desc: 'Teams Workflows (tenant vs aviso Anyone, cola/DLQ) y Jira Cloud solo lectura (OAuth 3LO, linkOnly por defecto vs metadata).' },
];

export const fmtEur = (n) => {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

export const fmtHours = (mins) => {
  const h = mins / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1).replace('.', ',')} h`;
};
