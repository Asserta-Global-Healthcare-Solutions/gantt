// PROTOTIPO AP-002a. Datos del Dashboard de inicio derivados del plan ficticio (iguales en ambas direcciones).
import { toEpochDay } from './util.js';

export function inicioData(DEMO) {
  const { me, meta, plan, baseline, today, project } = DEMO;
  const tNow = toEpochDay(today), sunday = tNow + (6 - ((new Date(tNow * 86400000).getUTCDay() + 6) % 7));
  const conflictTask = new Set(plan.conflicts.map((c) => c.successorId));
  const mine = Object.values(meta)
    .filter((m) => m.kind !== 'group' && m.status !== 'completada' && (m.responsible === me || m.collaborators.includes(me)))
    .map((m) => ({ code: `${project.code} · ${m.id}`, id: m.id, name: m.name, project: project.code, finish: plan.tasks[m.id].finish, status: m.status,
      progress: plan.tasks[m.id].progress ?? 0, relation: m.responsible === me ? 'responsable' : 'colaborador', milestone: m.kind === 'milestone',
      critical: plan.tasks[m.id].critical, float: plan.tasks[m.id].totalFloat, conflict: conflictTask.has(m.id) }))
    .concat(DEMO.otherTasks.map((t) => ({ ...t, milestone: false, critical: false, float: null, conflict: false })))
    .sort((a, b) => a.finish.localeCompare(b.finish));
  const bucket = (t) => { const e = toEpochDay(t.finish); return e < tNow ? 'vencidas' : e <= sunday ? 'semana' : e <= sunday + 14 ? 'proximas' : 'despues'; };
  const groups = { vencidas: [], semana: [], proximas: [], despues: [] };
  for (const t of mine) groups[bucket(t)].push(t);

  const slip = plan.tasks['5.1'].startIdx - baseline.tasks['5.1'].startIdx;
  const ppv2 = { code: project.code, name: project.name, owner: project.owner, restricted: false,
    progress: Math.round(Object.values(meta).filter((m) => m.kind === 'task').reduce((s, m) => s + (plan.tasks[m.id].progress ?? 0) * m.effort, 0) / Object.values(meta).filter((m) => m.kind === 'task').reduce((s, m) => s + m.effort, 0)),
    health: plan.conflicts.length || slip > 0 ? 'amber' : 'green',
    reason: [slip > 0 ? `Fin previsto +${slip} d laborables sobre la línea base` : null, plan.conflicts.length ? `${plan.conflicts.length} conflicto de planificación` : null].filter(Boolean).join(' · '),
    next: { name: meta['2.4'].name, date: plan.tasks['2.4'].start }, gantt: true };
  const projects = [ppv2, ...DEMO.otherProjects];

  const milestones = [
    ...Object.values(meta).filter((m) => m.kind === 'milestone' && m.status !== 'completada').map((m) => ({ project: project.code, name: m.name, date: plan.tasks[m.id].start, critical: plan.tasks[m.id].critical })),
    ...DEMO.otherProjects.map((p) => ({ project: p.code, name: p.next.name, date: p.next.date, critical: false, overdue: p.next.date < today, restricted: p.restricted })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const conflicts = plan.conflicts.map((c) => {
    const dep = DEMO.input.dependencies.find((d) => d.id === c.dependencyId);
    return { ...c, name: meta[c.successorId].name, pred: dep.predecessorId, predName: meta[dep.predecessorId].name, type: dep.type };
  });
  const counts = { open: mine.length, overdue: groups.vencidas.length, conflicts: conflicts.length,
    milestones14: milestones.filter((m) => toEpochDay(m.date) >= tNow && toEpochDay(m.date) <= tNow + 14).length,
    unread: DEMO.notifications.filter((n) => n.unread).length };
  return { mine, groups, projects, milestones, conflicts, counts, slip };
}
