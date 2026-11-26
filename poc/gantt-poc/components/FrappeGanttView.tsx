'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../node_modules/frappe-gantt/dist/frappe-gantt.css';
import { PocChrome } from './PocChrome';
import {
  addDaysIso, checkSnapshotIntegrity, dateToIso,
  type Density, type PocDataset, type SnapshotIntegrityResult, type Theme, type ZoomLevel,
} from './PocTypes';

const VIEW_MAP: Record<ZoomLevel, string> = {
  dia: 'Day',
  semana: 'Week',
  mes: 'Month',
  anio: 'Year',
};

export function FrappeGanttView() {
  const [dataset, setDataset] = useState<PocDataset | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>('mes');
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('estandar');
  const [showCritical, setShowCritical] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [integrity, setIntegrity] = useState<SnapshotIntegrityResult | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<any>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    fetch('/dataset-1000.json')
      .then((r) => r.json())
      .then((d: PocDataset) => setDataset(d))
      .catch((e) => setRenderError(String(e)));
  }, []);

  const conflictTargetIds = useMemo(() => {
    const s = new Set<string>();
    dataset?.conflicts.forEach((c) => s.add(c.successorId));
    return s;
  }, [dataset]);

  useEffect(() => {
    if (!dataset || !hostRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        // @ts-expect-error frappe-gantt@1.2.2 no incluye definiciones TypeScript (.d.ts)
        const mod: any = await import('frappe-gantt');
        const Gantt = mod.default;
        if (cancelled || !hostRef.current) return;

        hostRef.current.innerHTML = '';
        const predsByTask = new Map<string, string[]>();
        for (const dep of dataset.dependencies) {
          // Frappe solo acepta IDs separados por coma (solo FS sin lag ni tipo)
          const list = predsByTask.get(dep.successorId) ?? [];
          if (!list.includes(dep.predecessorId)) list.push(dep.predecessorId);
          predsByTask.set(dep.successorId, list);
        }

        const frappeTasks = dataset.tasks.map((t) => {
          // frappe-gantt@1.2.2 pasa custom_class directo a classList.add() sin dividir espacios (solo 1 token válido)
          const singleClass = conflictTargetIds.has(t.id)
            ? 'is-conflict'
            : t.critical
              ? 'is-critical'
              : `kind-${t.kind}`;
          return {
            id: t.id,
            name: `${t.code} ${t.name}`,
            start: t.start,
            end: t.finish,
            progress: t.progress,
            dependencies: (predsByTask.get(t.id) ?? []).join(', '),
            custom_class: singleClass,
          };
        });

        const instance = new Gantt(hostRef.current, frappeTasks, {
          view_mode: VIEW_MAP[zoom],
          bar_height: density === 'compacta' ? 14 : 20,
          padding: density === 'compacta' ? 12 : 16,
          language: 'es',
          readonly: false,
          on_date_change: (task: any, start: Date, end: Date) => {
            setPreviewNote(
              `Preview local (sin commit): ${task.id} → ${dateToIso(start)} .. ${dateToIso(end)} (Frappe modifica su objeto interno tras drag; restaurado desde snapshot)`
            );
          },
        });
        ganttRef.current = instance;

        // Comprobar integridad del snapshot tras parseo inicial en Frappe
        const readBack = new Map<string, { start: string; finish: string }>();
        for (const ft of instance.tasks ?? []) {
          const s = ft._start ? dateToIso(ft._start) : String(ft.start).slice(0, 10);
          // Frappe suma 1 día o ajusta _end en algunos modos; comprobamos exactamente qué guarda
          const e = ft._end ? dateToIso(ft._end) : String(ft.end).slice(0, 10);
          readBack.set(ft.id, { start: s, finish: e });
        }
        setIntegrity(checkSnapshotIntegrity(dataset.tasks, readBack));
        mountedRef.current = true;
      } catch (err) {
        setRenderError(String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dataset, conflictTargetIds, density]);

  useEffect(() => {
    if (ganttRef.current && mountedRef.current) {
      try {
        ganttRef.current.change_view_mode(VIEW_MAP[zoom]);
      } catch (e) {
        setRenderError(String(e));
      }
    }
  }, [zoom]);

  const handleKeyboardNudge = useCallback(() => {
    if (!dataset) return;
    const sample = dataset.tasks.find((t) => t.kind === 'task' && t.class === 'AUTO');
    if (!sample) return;
    setPreviewNote(
      `Preview teclado (+1d sin mutar snapshot): ${sample.code} ${sample.start} → ${addDaysIso(sample.start, 1)}`
    );
  }, [dataset]);

  useEffect(() => {
    (window as any).__POC_HOOKS__ = {
      name: 'frappe',
      isReady: () => mountedRef.current && Boolean(hostRef.current?.querySelector('svg .bar-wrapper')),
      setZoom: (z: ZoomLevel) => setZoom(z),
      setTheme: (t: Theme) => setTheme(t),
      setDensity: (d: Density) => setDensity(d),
      getScrollContainer: () => hostRef.current?.querySelector('.gantt-container') ?? hostRef.current,
      simulateDragPreview: (idx = 0) => {
        if (!dataset) return;
        const target = dataset.tasks.filter((t) => t.kind === 'task')[idx % 50];
        if (!target) return;
        setPreviewNote(`Preview drag #${idx}: ${target.id} +1d (${target.start} → ${addDaysIso(target.start, 1)})`);
      },
      getDiagnostics: () => {
        const svg = hostRef.current?.querySelector('svg');
        const bars = svg?.querySelectorAll('.bar-wrapper').length ?? 0;
        const arrows = svg?.querySelectorAll('.arrow path, .arrows path').length ?? 0;
        const conflictArrows = svg?.querySelectorAll('.arrow.is-conflict, path.is-conflict').length ?? 0;
        const wbsTree = hostRef.current?.querySelectorAll('[role="treeitem"], .wbs-caret').length ?? 0;
        return {
          renderedBars: bars,
          renderedLinks: arrows,
          renderedConflictLinks: conflictArrows,
          supportsWbsCollapse: wbsTree > 0,
          supportsFourDepTypes: false,
          supportsBaselineOverlay: false,
          integrity,
          renderError,
        };
      },
    };
  }, [dataset, integrity, renderError]);

  return (
    <PocChrome
      current="frappe"
      title="AP-003 · Frappe Gantt (Gate preliminar)"
      pkgLabel="frappe-gantt@1.2.2 · MIT"
      dataset={dataset}
      zoom={zoom}
      onZoom={setZoom}
      theme={theme}
      onTheme={setTheme}
      density={density}
      onDensity={setDensity}
      showCritical={showCritical}
      onToggleCritical={() => setShowCritical((v) => !v)}
      showBaseline={showBaseline}
      onToggleBaseline={() => setShowBaseline((v) => !v)}
      showConflicts={showConflicts}
      onToggleConflicts={() => setShowConflicts((v) => !v)}
      onKeyboardNudge={handleKeyboardNudge}
      integrity={integrity}
      previewNote={previewNote}
    >
      <style>{`
        .frappe-host { height: 100%; width: 100%; overflow: auto; background: var(--bg); }
        .frappe-host .gantt-container { height: 100% !important; background: var(--bg); color: var(--text); }
        .frappe-host svg.gantt .grid-background { fill: var(--bg); }
        .frappe-host svg.gantt .grid-row { fill: var(--bg); }
        .frappe-host svg.gantt .grid-row:nth-child(even) { fill: var(--surface); }
        .frappe-host svg.gantt .row-line { stroke: var(--row-line); }
        .frappe-host svg.gantt .bar { fill: var(--bar); }
        .frappe-host svg.gantt .bar-progress { fill: var(--bar-progress); }
        .frappe-host svg.gantt .bar-label { fill: var(--text); font-size: 11px; }
        .frappe-host.show-crit svg.gantt .bar-wrapper.is-critical .bar { fill: var(--crit-bar); }
        .frappe-host.show-crit svg.gantt .bar-wrapper.is-critical .bar-progress { fill: var(--crit-progress); }
        .frappe-host.show-conf svg.gantt .bar-wrapper.is-conflict .bar { stroke: var(--signal); stroke-width: 1.5; stroke-dasharray: 3 3; }
        .frappe-host svg.gantt .arrow { stroke: var(--link); }
      `}</style>
      {renderError && <div role="alert" style={{ padding: 16, color: 'var(--signal-text)' }}>{renderError}</div>}
      <div
        ref={hostRef}
        className={`frappe-host${showCritical ? ' show-crit' : ''}${showConflicts ? ' show-conf' : ''}`}
        aria-label="Cronograma Frappe Gantt"
      />
    </PocChrome>
  );
}
