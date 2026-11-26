'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PocChrome } from './PocChrome';
import {
  addDaysIso, checkSnapshotIntegrity, isoToUtcDay,
  type Density, type PocDataset, type PocTask, type SnapshotIntegrityResult, type Theme, type ZoomLevel,
} from './PocTypes';

const PX_PER_DAY: Record<ZoomLevel, number> = {
  dia: 26,
  semana: 9,
  mes: 3.4,
  anio: 1.15,
};

const OVERSCAN = 10;

export function CustomGanttView() {
  const [dataset, setDataset] = useState<PocDataset | null>(null);
  const [zoom, setZoom] = useState<ZoomLevel>('mes');
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('estandar');
  const [showCritical, setShowCritical] = useState(true);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewShift, setPreviewShift] = useState<{ taskId: string; deltaDays: number } | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(720);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    fetch('/dataset-1000.json')
      .then((r) => r.json())
      .then((d: PocDataset) => {
        setDataset(d);
        setSelectedId(d.tasks.find((t) => t.kind === 'task')?.id ?? null);
        readyRef.current = true;
      });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight || 720));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // El render propio consume el snapshot del motor de forma estrictamente inmutable
  const integrity = useMemo<SnapshotIntegrityResult | null>(() => {
    if (!dataset) return null;
    const readBack = new Map<string, { start: string; finish: string }>();
    for (const t of dataset.tasks) readBack.set(t.id, { start: t.start, finish: t.finish });
    return checkSnapshotIntegrity(dataset.tasks, readBack);
  }, [dataset]);

  const rowH = density === 'compacta' ? 28 : 36;
  const barH = density === 'compacta' ? 12 : 20;
  const pxDay = PX_PER_DAY[zoom];

  const { visibleTasks, indexById, horizonStartDay, totalDays, todayX, conflictLinkSet, conflictTargetSet, criticalSet } =
    useMemo(() => {
      if (!dataset) {
        return {
          visibleTasks: [] as PocTask[],
          indexById: new Map<string, number>(),
          horizonStartDay: 0,
          totalDays: 1,
          todayX: 0,
          conflictLinkSet: new Set<string>(),
          conflictTargetSet: new Set<string>(),
          criticalSet: new Set<string>(),
        };
      }
      const parentMap = new Map(dataset.tasks.map((t) => [t.id, t.parentId]));
      const vis: PocTask[] = [];
      for (const t of dataset.tasks) {
        let p = t.parentId;
        let hidden = false;
        while (p) {
          if (collapsed.has(p)) {
            hidden = true;
            break;
          }
          p = parentMap.get(p) ?? null;
        }
        if (!hidden) vis.push(t);
      }
      const idxMap = new Map<string, number>();
      vis.forEach((t, i) => idxMap.set(t.id, i));
      const hStart = isoToUtcDay(dataset.meta.horizonStart) - 7;
      const hEnd = isoToUtcDay(dataset.meta.horizonEnd) + 21;
      const tDay = isoToUtcDay(dataset.meta.today);
      return {
        visibleTasks: vis,
        indexById: idxMap,
        horizonStartDay: hStart,
        totalDays: Math.max(30, hEnd - hStart),
        todayX: (tDay - hStart) * pxDay,
        conflictLinkSet: new Set(dataset.conflicts.map((c) => c.dependencyId)),
        conflictTargetSet: new Set(dataset.conflicts.map((c) => c.successorId)),
        criticalSet: new Set(dataset.tasks.filter((t) => t.critical).map((t) => t.id)),
      };
    }, [dataset, collapsed, pxDay]);

  const laneW = Math.ceil(totalDays * pxDay);
  const totalH = visibleTasks.length * rowH;
  const startRow = Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN);
  const endRow = Math.min(visibleTasks.length, Math.ceil((scrollTop + viewportH) / rowH) + OVERSCAN);
  const slice = visibleTasks.slice(startRow, endRow);

  // Calcular solo los vínculos relevantes para la ventana virtualizada (+ buffer)
  const visibleLinks = useMemo(() => {
    if (!dataset) return [];
    const out: {
      id: string;
      d: string;
      isConflict: boolean;
      isCritical: boolean;
      type: string;
    }[] = [];

    for (const dep of dataset.dependencies) {
      const aRow = indexById.get(dep.predecessorId);
      const bRow = indexById.get(dep.successorId);
      if (aRow === undefined || bRow === undefined) continue;
      // Culling vertical: incluir si cualquiera de los extremos o el segmento cruza el viewport
      const minR = Math.min(aRow, bRow);
      const maxR = Math.max(aRow, bRow);
      if (maxR < startRow - 2 || minR > endRow + 2) continue;

      const a = visibleTasks[aRow];
      const b = visibleTasks[bRow];
      const aStartX = (isoToUtcDay(a.start) - horizonStartDay) * pxDay;
      const aEndX = (isoToUtcDay(a.finish) - horizonStartDay + (a.kind === 'milestone' ? 0 : 1)) * pxDay;
      const bStartX = (isoToUtcDay(b.start) - horizonStartDay) * pxDay;
      const bEndX = (isoToUtcDay(b.finish) - horizonStartDay + (b.kind === 'milestone' ? 0 : 1)) * pxDay;

      const x1 = dep.type === 'SS' || dep.type === 'SF' ? aStartX : aEndX;
      const x2 = dep.type === 'FF' || dep.type === 'SF' ? bEndX : bStartX;
      const y1 = aRow * rowH + rowH / 2;
      const y2 = bRow * rowH + rowH / 2;
      const midX = x2 >= x1 + 8 ? x1 + 8 : x1 + 8;
      const path =
        x2 >= x1 + 10
          ? `M${x1} ${y1} H${midX} V${y2} H${x2}`
          : `M${x1} ${y1} H${x1 + 8} V${y1 + (y2 > y1 ? rowH / 2 : -rowH / 2)} H${x2 - 8} V${y2} H${x2}`;

      out.push({
        id: dep.id,
        d: path,
        isConflict: conflictLinkSet.has(dep.id),
        isCritical: criticalSet.has(dep.predecessorId) && criticalSet.has(dep.successorId),
        type: dep.type,
      });
    }
    return out;
  }, [dataset, indexById, visibleTasks, startRow, endRow, horizonStartDay, pxDay, rowH, conflictLinkSet, criticalSet]);

  const monthTicks = useMemo(() => {
    if (!dataset) return [];
    const ticks: { label: string; x: number; w: number }[] = [];
    const cur = new Date(`${dataset.meta.horizonStart.slice(0, 7)}-01T00:00:00Z`);
    const end = new Date(`${dataset.meta.horizonEnd}T00:00:00Z`);
    const fmt = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    while (cur <= end) {
      const iso = cur.toISOString().slice(0, 10);
      const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
      const x = (isoToUtcDay(iso) - horizonStartDay) * pxDay;
      const w = (isoToUtcDay(next.toISOString().slice(0, 10)) - isoToUtcDay(iso)) * pxDay;
      ticks.push({ label: fmt.format(cur), x, w });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return ticks;
  }, [dataset, horizonStartDay, pxDay]);

  const toggleGroup = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleKeyboardNudge = useCallback(() => {
    if (!dataset) return;
    const target = dataset.tasks.find((t) => t.id === selectedId && t.kind === 'task') ?? dataset.tasks.find((t) => t.kind === 'task');
    if (!target) return;
    const delta = (previewShift?.taskId === target.id ? previewShift.deltaDays : 0) + 1;
    setPreviewShift({ taskId: target.id, deltaDays: delta });
    setPreviewNote(
      `Preview local (+${delta}d sin mutar snapshot): ${target.code} ${target.start} → ${addDaysIso(target.start, delta)} (pendiente /plan/preview)`
    );
  }, [dataset, selectedId, previewShift]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, t: PocTask, idx: number) => {
      if (e.key === 'ArrowDown' && idx + 1 < visibleTasks.length) {
        e.preventDefault();
        setSelectedId(visibleTasks[idx + 1].id);
      } else if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        setSelectedId(visibleTasks[idx - 1].id);
      } else if (e.key === 'ArrowLeft' && t.kind === 'group' && !collapsed.has(t.id)) {
        e.preventDefault();
        toggleGroup(t.id);
      } else if (e.key === 'ArrowRight' && t.kind === 'group' && collapsed.has(t.id)) {
        e.preventDefault();
        toggleGroup(t.id);
      } else if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && t.kind === 'task') {
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        setPreviewShift({ taskId: t.id, deltaDays: step });
        setPreviewNote(`Preview teclado (${step > 0 ? '+1d' : '-1d'}): ${t.code} (snapshot intacto)`);
      }
    },
    [visibleTasks, collapsed, toggleGroup]
  );

  useEffect(() => {
    (window as any).__POC_HOOKS__ = {
      name: 'custom',
      isReady: () => readyRef.current && Boolean(scrollRef.current?.querySelector('[data-task-row]')),
      setZoom: (z: ZoomLevel) => setZoom(z),
      setTheme: (t: Theme) => setTheme(t),
      setDensity: (d: Density) => setDensity(d),
      getScrollContainer: () => scrollRef.current,
      simulateDragPreview: (idx = 0) => {
        if (!dataset) return;
        const target = dataset.tasks.filter((t) => t.kind === 'task')[idx % 50];
        if (!target) return;
        setPreviewShift({ taskId: target.id, deltaDays: (idx % 3) + 1 });
        setPreviewNote(`Preview drag #${idx}: ${target.id} +${(idx % 3) + 1}d (snapshot inmutable)`);
      },
      getDiagnostics: () => {
        const root = scrollRef.current;
        const domRows = root?.querySelectorAll('[data-task-row]').length ?? 0;
        const domLinks = root?.querySelectorAll('svg path[data-dep]').length ?? 0;
        const domConflictLinks = root?.querySelectorAll('svg path.lk-conf').length ?? 0;
        return {
          renderedDomRowsVirtualized: domRows,
          totalVisibleTasks: visibleTasks.length,
          renderedLinksInViewport: domLinks,
          renderedConflictLinksInViewport: domConflictLinks,
          totalDatasetLinks: dataset?.dependencies.length ?? 0,
          totalDatasetConflicts: dataset?.conflicts.length ?? 0,
          supportsWbsCollapse: true,
          supportsFourDepTypes: true,
          supportsPerLinkConflictStylingInMit: true,
          supportsBaselineOverlay: true,
          integrity,
        };
      },
    };
  }, [dataset, visibleTasks.length, integrity]);

  return (
    <PocChrome
      current="custom"
      title="AP-003 · Render propio virtualizado (Spike · C · Asserta)"
      pkgLabel="React 19.3.1 + SVG virtualizado · 0 deps externas"
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
        .cg-scroll { height: 100%; width: 100%; overflow: auto; position: relative; overscroll-behavior: contain; }
        .cg-head { position: sticky; top: 0; z-index: 6; display: flex; width: max-content; background: var(--bg); border-bottom: 1px solid var(--line); height: 48px; }
        .cg-gridhead { position: sticky; left: 0; z-index: 7; width: 390px; flex: none; display: grid; grid-template-columns: 56px 1fr 44px 52px; align-items: end; padding-bottom: 6px; background: var(--bg); border-right: 1px solid var(--line); }
        .cg-hc { padding: 0 8px; font: 500 11px/1 var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-3); }
        .cg-ruler { position: relative; height: 48px; flex: none; background: var(--bg); }
        .cg-tick { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--row-line); padding: 6px 4px; font: 500 11px/1 var(--font-mono); color: var(--text-3); white-space: nowrap; overflow: hidden; }
        .cg-body { position: relative; display: flex; width: max-content; }
        .cg-grid { position: sticky; left: 0; z-index: 4; width: 390px; flex: none; background: var(--bg); border-right: 1px solid var(--line); }
        .cg-row { position: absolute; left: 0; right: 0; display: grid; grid-template-columns: 56px 1fr 44px 52px; align-items: center; border-bottom: 1px solid var(--row-line); font-size: 13px; background: var(--bg); }
        .cg-row.lvl-1 { border-bottom: 3px double var(--line-strong); font-weight: 600; }
        .cg-row.is-sel { background: var(--sel); }
        .cg-cell { padding: 0 8px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .cg-code { font: 500 11.5px/1 var(--font-mono); color: var(--text-3); }
        .cg-caret { border: 0; background: transparent; color: var(--text-2); cursor: pointer; padding: 0 4px; font-family: var(--font-mono); }
        .cg-lane { position: relative; flex: none; }
        .cg-today { position: absolute; top: 0; bottom: 0; width: 0; border-left: 1.5px solid var(--today); z-index: 2; pointer-events: none; }
        .cg-svg { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
        .cg-svg .lk { fill: none; stroke: var(--link); stroke-width: 1; }
        .cg-svg .lk-crit { stroke: var(--crit-link); stroke-width: 1.2; }
        .cg-svg .lk-conf { stroke: var(--signal); stroke-dasharray: 3 3; stroke-width: 1.5; }
        .cg-item { position: absolute; left: 0; right: 0; z-index: 3; pointer-events: none; }
        .cg-bar { position: absolute; border-radius: 2px; background: var(--bar); pointer-events: auto; cursor: grab; overflow: hidden; }
        .cg-bar.is-crit { background: var(--crit-bar); }
        .cg-bar.is-manual { background-image: repeating-linear-gradient(135deg, transparent 0 4px, var(--manual-hatch) 4px 5px); box-shadow: inset 0 0 0 1px var(--manual-line); }
        .cg-bar.is-done { background: transparent; box-shadow: inset 0 0 0 1px var(--st-completada); }
        .cg-bar.is-conf { outline: 1.5px dashed var(--signal); outline-offset: 1px; }
        .cg-bar.is-preview { outline: 1.5px dashed var(--brand); outline-offset: 2px; }
        .cg-prog { position: absolute; inset: 0 auto 0 0; background: var(--bar-progress); opacity: 0.85; }
        .cg-bar.is-crit .cg-prog { background: var(--crit-progress); }
        .cg-group { position: absolute; height: 5px; background: var(--group-bar); border-radius: 1px; }
        .cg-ms { position: absolute; width: 11px; height: 11px; transform: rotate(45deg); background: var(--ms-fill); border: 1.5px solid var(--ms-line); pointer-events: auto; }
        .cg-ms.is-crit { background: var(--crit-bar); border-color: var(--crit-progress); }
        .cg-base { position: absolute; height: 3px; border-radius: 2px; background: var(--baseline); }
        .cg-actual { position: absolute; left: 0; bottom: 0; height: 2px; background: var(--actual); }
      `}</style>
      <div
        ref={scrollRef}
        className="cg-scroll"
        role="region"
        aria-label="Cronograma render propio virtualizado"
        tabIndex={0}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div role="treegrid" aria-label="Planificación WBS">
        <div className="cg-head">
          <div className="cg-gridhead" role="row">
            <span className="cg-hc" role="columnheader">Cód.</span>
            <span className="cg-hc" role="columnheader">Tarea (WBS)</span>
            <span className="cg-hc" role="columnheader">Resp.</span>
            <span className="cg-hc" role="columnheader">Holg.</span>
          </div>
          <div className="cg-ruler" style={{ width: laneW }} aria-hidden="true">
            {monthTicks.map((t, i) => (
              <div key={i} className="cg-tick" style={{ left: t.x, width: t.w }}>
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <div className="cg-body" style={{ height: totalH }}>
          <div className="cg-grid" style={{ height: totalH }}>
            {slice.map((t, offset) => {
              const rowIdx = startRow + offset;
              const top = rowIdx * rowH;
              const isSel = t.id === selectedId;
              const stColor = t.status ? `var(--st-${t.status})` : 'transparent';
              return (
                <div
                  key={t.id}
                  data-task-row={t.id}
                  role="row"
                  aria-level={t.level}
                  aria-selected={isSel}
                  tabIndex={isSel ? 0 : -1}
                  className={`cg-row lvl-${t.level}${isSel ? ' is-sel' : ''}`}
                  style={{ top, height: rowH }}
                  onClick={() => setSelectedId(t.id)}
                  onKeyDown={(e) => handleKeyDown(e, t, rowIdx)}
                >
                  <span
                    className="cg-cell cg-code"
                    role="gridcell"
                    style={{ boxShadow: t.kind !== 'group' ? `inset 3px 0 0 ${stColor}` : undefined }}
                  >
                    {t.code}
                  </span>
                  <span
                    className="cg-cell"
                    role="gridcell"
                    style={{ paddingLeft: 6 + (t.level - 1) * 14 }}
                  >
                    {t.kind === 'group' && (
                      <button
                        type="button"
                        className="cg-caret"
                        aria-label={collapsed.has(t.id) ? `Expandir ${t.name}` : `Contraer ${t.name}`}
                        aria-expanded={!collapsed.has(t.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(t.id);
                        }}
                      >
                        {collapsed.has(t.id) ? '▸' : '▾'}
                      </button>
                    )}
                    {t.name}
                  </span>
                  <span className="cg-cell cg-code" role="gridcell">{t.responsible}</span>
                  <span
                    className="cg-cell cg-code"
                    role="gridcell"
                    style={{
                      color:
                        t.totalFloat !== null && t.totalFloat < 0
                          ? 'var(--signal-text)'
                          : t.totalFloat === 0
                            ? 'var(--crit-ink)'
                            : 'var(--text-3)',
                    }}
                  >
                    {t.totalFloat === null ? '—' : `${t.totalFloat}d`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="cg-lane" style={{ width: laneW, height: totalH }}>
            <div className="cg-today" style={{ left: todayX }} />

            <svg className="cg-svg" width={laneW} height={totalH} aria-hidden="true">
              {visibleLinks.map((l) => {
                const cls =
                  showConflicts && l.isConflict
                    ? 'lk lk-conf'
                    : showCritical && l.isCritical
                      ? 'lk lk-crit'
                      : 'lk';
                return <path key={l.id} data-dep={l.id} data-type={l.type} className={cls} d={l.d} />;
              })}
            </svg>

            {slice.map((t, offset) => {
              const rowIdx = startRow + offset;
              const top = rowIdx * rowH;
              const shiftPx = previewShift?.taskId === t.id ? previewShift.deltaDays * pxDay : 0;
              const x = (isoToUtcDay(t.start) - horizonStartDay) * pxDay + shiftPx;
              const w = Math.max(4, (isoToUtcDay(t.finish) - isoToUtcDay(t.start) + 1) * pxDay);
              const baseX = t.baselineStart ? (isoToUtcDay(t.baselineStart) - horizonStartDay) * pxDay : null;
              const baseW =
                t.baselineStart && t.baselineFinish
                  ? Math.max(4, (isoToUtcDay(t.baselineFinish) - isoToUtcDay(t.baselineStart) + 1) * pxDay)
                  : 0;
              const isConf = conflictTargetSet.has(t.id);

              return (
                <div key={t.id} className="cg-item" style={{ top, height: rowH }}>
                  {t.kind === 'group' ? (
                    <div className="cg-group" style={{ left: x, width: w, top: (rowH - 5) / 2 }} />
                  ) : t.kind === 'milestone' ? (
                    <div
                      className={`cg-ms${showCritical && t.critical ? ' is-crit' : ''}`}
                      style={{ left: x - 5, top: (rowH - 11) / 2 }}
                      title={`${t.code} ${t.name} (${t.start})`}
                    />
                  ) : (
                    <div
                      className={[
                        'cg-bar',
                        showCritical && t.critical && t.class !== 'FACT_DONE' ? 'is-crit' : '',
                        t.class === 'MANUAL' ? 'is-manual' : '',
                        t.class === 'FACT_DONE' ? 'is-done' : '',
                        showConflicts && isConf ? 'is-conf' : '',
                        previewShift?.taskId === t.id ? 'is-preview' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ left: x, width: w, top: (rowH - barH) / 2, height: barH }}
                      title={`${t.code} ${t.name} · ${t.start} → ${t.finish}`}
                      onClick={() => {
                        setSelectedId(t.id);
                        setPreviewShift({ taskId: t.id, deltaDays: 1 });
                        setPreviewNote(`Preview clic/drag (+1d sin commit): ${t.code} (${t.start} → ${addDaysIso(t.start, 1)})`);
                      }}
                    >
                      {t.progress > 0 && t.class !== 'FACT_DONE' && (
                        <div className="cg-prog" style={{ width: `${t.progress}%` }} />
                      )}
                      {t.actualStart && <div className="cg-actual" style={{ width: '100%' }} />}
                    </div>
                  )}
                  {showBaseline && baseX !== null && t.kind !== 'group' && (
                    <div className="cg-base" style={{ left: baseX, width: baseW, bottom: 2 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </PocChrome>
  );
}
