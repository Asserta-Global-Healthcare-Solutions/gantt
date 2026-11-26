'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gantt, Willow, WillowDark, type IApi, type ILink, type ITask } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { PocChrome } from './PocChrome';
import {
  addDaysIso, checkSnapshotIntegrity, dateToIso, isoToLocalDate,
  type Density, type PocDataset, type SnapshotIntegrityResult, type Theme, type ZoomLevel,
} from './PocTypes';

const LINK_TYPE_MAP = {
  FS: 'e2s',
  SS: 's2s',
  FF: 'e2e',
  SF: 's2e',
} as const;

function getScales(zoom: ZoomLevel) {
  if (zoom === 'dia') {
    return [
      { unit: 'month', step: 1, format: '%F %Y' },
      { unit: 'day', step: 1, format: '%d' },
    ];
  }
  if (zoom === 'semana') {
    return [
      { unit: 'month', step: 1, format: '%F %Y' },
      { unit: 'week', step: 1, format: 'S%W' },
    ];
  }
  if (zoom === 'mes') {
    return [
      { unit: 'year', step: 1, format: '%Y' },
      { unit: 'month', step: 1, format: '%M' },
    ];
  }
  return [
    { unit: 'year', step: 1, format: '%Y' },
    { unit: 'quarter', step: 1, format: 'T%q' },
  ];
}

export function SvarGanttView() {
  const [dataset, setDataset] = useState<PocDataset | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>('mes');
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('estandar');
  const [showCritical, setShowCritical] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [integrity, setIntegrity] = useState<SnapshotIntegrityResult | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);

  const apiRef = useRef<IApi | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/dataset-1000.json')
      .then((r) => r.json())
      .then((d: PocDataset) => setDataset(d));
  }, []);

  const conflictLinkSet = useMemo(() => new Set(dataset?.conflicts.map((c) => c.dependencyId) ?? []), [dataset]);
  const conflictTargetSet = useMemo(() => new Set(dataset?.conflicts.map((c) => c.successorId) ?? []), [dataset]);

  const svarTasks = useMemo<ITask[]>(() => {
    if (!dataset) return [];
    return dataset.tasks.map((t) => ({
      id: t.id,
      parent: t.parentId ?? 0,
      text: `${t.code} ${t.name}`,
      start: isoToLocalDate(t.start),
      // Omitir `duration` (en días laborables) porque SVAR sobrescribe `end` usando días naturales si se pasa `duration`.
      // SVAR usa fin exclusivo para barras de varios días; hito start === end.
      end: t.kind === 'milestone' ? isoToLocalDate(t.start) : isoToLocalDate(addDaysIso(t.finish, 1)),
      progress: t.progress,
      type: t.kind === 'group' ? 'summary' : t.kind === 'milestone' ? 'milestone' : 'task',
      open: true,
      base_start: t.baselineStart ? isoToLocalDate(t.baselineStart) : undefined,
      base_end: t.baselineFinish ? isoToLocalDate(addDaysIso(t.baselineFinish, 1)) : undefined,
      // Metadatos propios para taskTemplate (sin módulos PRO)
      _code: t.code,
      _critical: t.critical,
      _conflict: conflictTargetSet.has(t.id),
      _class: t.class,
      _float: t.totalFloat,
      _resp: t.responsible,
      _actualStart: t.actualStart,
      _actualFinish: t.actualFinish,
      _origStart: t.start,
      _origFinish: t.finish,
    }));
  }, [dataset, conflictTargetSet]);

  const svarLinks = useMemo<ILink[]>(() => {
    if (!dataset) return [];
    return dataset.dependencies.map((d) => ({
      id: d.id,
      source: d.predecessorId,
      target: d.successorId,
      type: LINK_TYPE_MAP[d.type],
    }));
  }, [dataset]);

  const columns = useMemo(
    () => [
      { id: 'text', header: 'Tarea (WBS)', width: 250, flexgrow: 1 },
      { id: '_resp', header: 'Resp.', width: 54, align: 'center' as const },
      { id: '_float', header: 'Holg.', width: 56, align: 'right' as const },
    ],
    []
  );

  const handleInit = useCallback(
    (api: IApi) => {
      apiRef.current = api;
      // Interceptar mutaciones interactivas: preview local sin alterar el snapshot autoritativo del motor
      api.intercept('update-task', (ev: any) => {
        if (ev?.inProgress) {
          setPreviewNote(`Preview drag SVAR (en curso, sin commit): ${ev.id}`);
          return true;
        }
        setPreviewNote(`Operación interceptada para /plan/preview (motor autoritativo): ${ev?.id} — snapshot restaurado`);
        return false;
      });
      api.intercept('drag-task', (ev: any) => {
        setPreviewNote(`Preview drag SVAR: ${ev?.id} (no persiste sin commit)`);
        return true;
      });

      // Comprobar si SVAR mutó fechas del snapshot del motor al cargar (p. ej. summaries o duration)
      setTimeout(() => {
        if (!dataset) return;
        const st: any = api.getState();
        const rawTasks: any[] = st?.tasks?.toArray ? st.tasks.toArray() : Array.isArray(st?.tasks) ? st.tasks : [];
        const readBack = new Map<string, { start: string; finish: string }>();
        for (const rt of rawTasks) {
          if (!rt?.start) continue;
          const sIso = dateToIso(new Date(rt.start));
          const endDate = rt.end ? new Date(rt.end) : new Date(rt.start);
          const fIso = rt.type === 'milestone' ? sIso : addDaysIso(dateToIso(endDate), -1);
          readBack.set(String(rt.id), { start: sIso, finish: fIso });
        }
        setIntegrity(checkSnapshotIntegrity(dataset.tasks, readBack));
      }, 150);
    },
    [dataset]
  );

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
      name: 'svar',
      isReady: () => Boolean(apiRef.current && wrapRef.current?.querySelector('.wx-gantt')),
      setZoom: (z: ZoomLevel) => setZoom(z),
      setTheme: (t: Theme) => setTheme(t),
      setDensity: (d: Density) => setDensity(d),
      getScrollContainer: () =>
        wrapRef.current?.querySelector('.wx-chart') ??
        wrapRef.current?.querySelector('.wx-gantt') ??
        wrapRef.current,
      simulateDragPreview: (idx = 0) => {
        if (!dataset) return;
        const target = dataset.tasks.filter((t) => t.kind === 'task')[idx % 50];
        if (!target) return;
        setPreviewNote(`Preview drag #${idx}: ${target.id} +1d (${target.start} → ${addDaysIso(target.start, 1)})`);
      },
      getDiagnostics: () => {
        const root = wrapRef.current;
        const bars = root?.querySelectorAll('.wx-bar').length ?? 0;
        const links = root?.querySelectorAll('.wx-links svg path, .wx-link, svg path.wx-line').length ?? 0;
        const baselines = root?.querySelectorAll('.wx-baseline').length ?? 0;
        // SVAR MIT no soporta clases CSS individuales por enlace para marcar conflictos en el SVG
        const conflictLinks = root?.querySelectorAll('.wx-line.is-conflict, path.lk-conf').length ?? 0;
        return {
          renderedBars: bars,
          renderedLinks: links,
          renderedBaselineNodes: baselines,
          renderedConflictLinks: conflictLinks,
          totalExpectedConflicts: conflictLinkSet.size,
          supportsWbsCollapse: true,
          supportsFourDepTypes: true,
          supportsPerLinkConflictStylingInMit: false,
          integrity,
        };
      },
    };
  }, [dataset, integrity, conflictLinkSet]);

  const ThemeWrap = theme === 'dark' ? WillowDark : Willow;
  const scales = useMemo(() => getScales(zoom), [zoom]);
  const cellWidth = zoom === 'dia' ? 32 : zoom === 'semana' ? 74 : zoom === 'mes' ? 92 : 120;

  return (
    <PocChrome
      current="svar"
      title="AP-003 · SVAR React Gantt (MIT sin PRO)"
      pkgLabel="@svar-ui/react-gantt@2.8.3 · MIT"
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
        .svar-host { height: 100%; width: 100%; }
        .svar-host .wx-willow-theme, .svar-host .wx-willow-dark-theme {
          height: 100%;
          --wx-background: var(--bg);
          --wx-background-alt: var(--surface);
          --wx-color-font: var(--text);
          --wx-color-secondary-font: var(--text-2);
          --wx-gantt-border: 1px solid var(--line);
          --wx-gantt-bar-color: var(--bar);
          --wx-gantt-bar-font-color: var(--bar-text);
          --wx-gantt-progress-color: var(--bar-progress);
          --wx-gantt-summary-color: var(--group-bar);
          --wx-gantt-milestone-color: var(--ms-line);
          --wx-gantt-link-color: var(--link);
          --wx-gantt-baseline-color: var(--baseline);
          --wx-gantt-critical-color: var(--crit-bar);
          --wx-gantt-critical-progress-color: var(--crit-progress);
          --wx-color-primary: var(--brand);
        }
        .svar-bar-inner {
          display: flex; align-items: center; gap: 5px; height: 100%; width: 100%; padding: 0 6px;
          overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11.5px;
        }
        .svar-bar-crit { background: var(--crit-bar); color: var(--crit-text); }
        .svar-bar-manual { background-image: repeating-linear-gradient(135deg, transparent 0 4px, var(--manual-hatch) 4px 5px); box-shadow: inset 0 0 0 1px var(--manual-line); }
        .svar-bar-conf { outline: 1.5px dashed var(--signal); outline-offset: -1px; }
        .svar-conf-dot { color: var(--signal-text); font-weight: 700; }
      `}</style>
      <div ref={wrapRef} className="svar-host" aria-label="Cronograma SVAR React Gantt">
        {dataset && (
          <ThemeWrap fonts={false}>
            <Gantt
              tasks={svarTasks}
              links={svarLinks}
              scales={scales}
              columns={columns}
              cellHeight={density === 'compacta' ? 28 : 36}
              cellWidth={cellWidth}
              baselines={showBaseline}
              autoScale={false}
              init={handleInit}
              taskTemplate={({ data }: any) => {
                const cls = [
                  'svar-bar-inner',
                  showCritical && data._critical ? 'svar-bar-crit' : '',
                  data._class === 'MANUAL' ? 'svar-bar-manual' : '',
                  showConflicts && data._conflict ? 'svar-bar-conf' : '',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div className={cls} title={`${data.text} (holgura: ${data._float ?? '—'})`}>
                    {showConflicts && data._conflict && <span className="svar-conf-dot" aria-label="Conflicto">!</span>}
                    <span>{data._code}</span>
                  </div>
                );
              }}
            />
          </ThemeWrap>
        )}
      </div>
    </PocChrome>
  );
}
