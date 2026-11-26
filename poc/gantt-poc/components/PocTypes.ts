export type ZoomLevel = 'dia' | 'semana' | 'mes' | 'anio';
export type Density = 'estandar' | 'compacta';
export type Theme = 'light' | 'dark';

export interface PocTask {
  id: string;
  code: string;
  name: string;
  kind: 'group' | 'task' | 'milestone';
  parentId: string | null;
  level: 1 | 2 | 3;
  responsible: string;
  status: 'pendiente' | 'en_curso' | 'bloqueada' | 'completada' | null;
  scheduleMode: 'auto' | 'manual';
  class: 'GROUP' | 'AUTO' | 'MANUAL' | 'FACT_RUNNING' | 'FACT_DONE';
  durationDays: number;
  start: string;
  finish: string;
  startIdx: number;
  finishIdx: number;
  progress: number;
  totalFloat: number | null;
  critical: boolean;
  criticalReason: string | null;
  actualStart: string | null;
  actualFinish: string | null;
  baselineStart: string | null;
  baselineFinish: string | null;
}

export interface PocDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

export interface PocConflict {
  dependencyId: string;
  successorId: string;
  kind: 'MANUAL' | 'FACT';
  requiredIdx: number;
  actualIdx: number;
  deficitDays: number;
  requiredDate: string;
  actualDate: string;
}

export interface PocDataset {
  meta: {
    seed: number;
    generatedWith: string;
    today: string;
    project: { startDate: string; timezone: string };
    horizonStart: string;
    horizonEnd: string;
    taskCount: number;
    groupCount: number;
    leafTaskCount: number;
    milestoneCount: number;
    dependencyCount: number;
    dependencyTypes: Record<string, number>;
    conflictCount: number;
    criticalCount: number;
    warningCount: number;
    oracleComputeMs: number;
  };
  calendar: {
    weekdayMinutes: number[];
    exceptions: { date: string; minutes: number }[];
  };
  tasks: PocTask[];
  dependencies: PocDependency[];
  conflicts: PocConflict[];
  warnings: { code: string; taskId: string }[];
}

export interface SnapshotIntegrityResult {
  checkedCount: number;
  mutatedTasks: { id: string; expectedStart: string; actualStart: string; expectedFinish: string; actualFinish: string }[];
  intact: boolean;
}

export function isoToUtcDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function addDaysIso(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function checkSnapshotIntegrity(
  original: PocTask[],
  readBack: Map<string, { start: string; finish: string }>
): SnapshotIntegrityResult {
  const mutatedTasks: SnapshotIntegrityResult['mutatedTasks'] = [];
  for (const t of original) {
    const got = readBack.get(t.id);
    if (!got) continue;
    if (got.start !== t.start || got.finish !== t.finish) {
      mutatedTasks.push({
        id: t.id,
        expectedStart: t.start,
        actualStart: got.start,
        expectedFinish: t.finish,
        actualFinish: got.finish,
      });
    }
  }
  return { checkedCount: readBack.size, mutatedTasks, intact: mutatedTasks.length === 0 };
}
