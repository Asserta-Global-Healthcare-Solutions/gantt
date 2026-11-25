// ORÁCULO DESECHABLE (AP-004). Distribución de esfuerzo, coste y comparación de línea base.
import { makeCalendar, toEpochDay, fromEpochDay } from './calendar.mjs';

/** Reparto por mayor resto: días laborables del proyecto en [taskStart, taskFinish] con capacidad > 0 del recurso. */
export function distribute({ project, calendar, resource, taskStart, taskFinish, totalMinutes }) {
  const pcal = makeCalendar(calendar, project.startDate);
  const rcal = makeCalendar({ weekdayMinutes: resource.weekdayMinutes, exceptions: [] }, project.startDate);
  const absence = new Map((resource.absences ?? []).map((a) => [toEpochDay(a.date), a.minutes]));
  const days = [];
  for (let n = toEpochDay(taskStart); n <= toEpochDay(taskFinish); n++) {
    if (!pcal.isWorking(n)) continue;
    const cap = Math.max(0, rcal.minutes(n) - (absence.get(n) ?? 0));
    if (cap > 0) days.push({ n, cap });
  }
  const C = days.reduce((s, d) => s + d.cap, 0);
  if (C === 0) return { distributed: false, allocations: [], retainedMinutes: totalMinutes, warnings: ['UNDISTRIBUTED'] };
  const rows = days.map((d) => ({ ...d, base: Math.floor((totalMinutes * d.cap) / C), rem: (totalMinutes * d.cap) % C }));
  let R = totalMinutes - rows.reduce((s, r) => s + r.base, 0);
  [...rows].sort((a, b) => b.rem - a.rem || a.n - b.n).slice(0, R).forEach((r) => r.base++);
  return { distributed: true, allocations: rows.map((r) => ({ date: fromEpochDay(r.n), minutes: r.base })), warnings: [] };
}

/** Coste por entrada: round_half_up(minutes × rate / 60, 2) en aritmética entera exacta. */
const toUnits = (s, dec) => { const [i, f = ''] = s.split('.'); return BigInt(i + f.padEnd(dec, '0').slice(0, dec)); };
const fmtCents = (c) => `${c / 100n}.${String(c % 100n).padStart(2, '0')}`;
export function costEntries({ entries }) {
  let total = 0n, missing = 0;
  const out = entries.map((e) => {
    if (e.rate == null) { missing++; return { cost: null, status: 'INCOMPLETE' }; }
    const num = BigInt(e.minutes) * toUnits(e.rate, 4); // unidades de 1e-4 € × minutos
    const den = 60n * 100n;                              // → céntimos
    const cents = (2n * num + den) / (2n * den);
    total += cents;
    return { cost: fmtCents(cents), status: 'OK' };
  });
  return { entries: out, total: fmtCents(total), complete: missing === 0, missingCount: missing };
}

/** Comparación de línea base por id; deltas en días laborables del calendario actual. */
export function compareBaseline({ project, calendar, baseline, current }) {
  const cal = makeCalendar(calendar, project.startDate);
  const idx = (d) => cal.B(d);
  const bMap = new Map(baseline.tasks.map((t) => [t.id, t])), cMap = new Map(current.tasks.map((t) => [t.id, t]));
  const added = current.tasks.filter((t) => !bMap.has(t.id)).map((t) => t.id).sort();
  const removed = baseline.tasks.filter((t) => !cMap.has(t.id)).map((t) => t.id).sort();
  const changed = [], unchanged = [];
  for (const b of baseline.tasks) {
    const c = cMap.get(b.id);
    if (!c) continue;
    const delta = { startDelta: idx(c.start) - idx(b.start), finishDelta: idx(c.finish) - idx(b.finish),
      durationDelta: c.durationDays - b.durationDays, effortDelta: (c.estimatedEffortMinutes ?? 0) - (b.estimatedEffortMinutes ?? 0) };
    if (Object.values(delta).every((v) => v === 0)) unchanged.push(b.id);
    else changed.push({ id: b.id, ...delta });
  }
  changed.sort((x, y) => x.id.localeCompare(y.id));
  const warnings = baseline.calendarVersion !== current.calendarVersion ? ['CALENDAR_CHANGED'] : [];
  return { added, removed, changed, unchanged: unchanged.sort(), warnings };
}
