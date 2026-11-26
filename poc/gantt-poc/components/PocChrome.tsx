'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import type { Density, PocDataset, SnapshotIntegrityResult, Theme, ZoomLevel } from './PocTypes';

interface PocChromeProps {
  current: 'frappe' | 'svar' | 'dhtmlx' | 'custom';
  title: string;
  pkgLabel: string;
  dataset: PocDataset | null;
  zoom: ZoomLevel;
  onZoom: (z: ZoomLevel) => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
  density: Density;
  onDensity: (d: Density) => void;
  showCritical: boolean;
  onToggleCritical: () => void;
  showBaseline: boolean;
  onToggleBaseline: () => void;
  showConflicts: boolean;
  onToggleConflicts: () => void;
  onKeyboardNudge: () => void;
  integrity: SnapshotIntegrityResult | null;
  previewNote: string | null;
  children: React.ReactNode;
}

export function PocChrome(props: PocChromeProps) {
  const {
    current, title, pkgLabel, dataset, zoom, onZoom, theme, onTheme,
    density, onDensity, showCritical, onToggleCritical, showBaseline,
    onToggleBaseline, showConflicts, onToggleConflicts, onKeyboardNudge,
    integrity, previewNote, children,
  } = props;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
  }, [theme, density]);

  return (
    <div className="poc-shell">
      <header className="poc-head">
        <h1>{title}</h1>
        <span className="tag-pill">{pkgLabel}</span>
        {integrity && (
          <span
            data-testid="snapshot-integrity"
            className={`tag-pill ${integrity.intact ? 'tag-ok' : 'tag-err'}`}
          >
            {integrity.intact
              ? `Snapshot intacto (${integrity.checkedCount} tareas)`
              : `MUTACIÓN DETECTADA (${integrity.mutatedTasks.length} tareas)`}
          </span>
        )}
        <nav aria-label="Alternativas PoC">
          <Link href="/frappe" aria-current={current === 'frappe' ? 'page' : undefined}>Frappe</Link>
          <Link href="/svar" aria-current={current === 'svar' ? 'page' : undefined}>SVAR</Link>
          <Link href="/dhtmlx" aria-current={current === 'dhtmlx' ? 'page' : undefined}>DHTMLX</Link>
          <Link href="/custom" aria-current={current === 'custom' ? 'page' : undefined}>Propio</Link>
        </nav>
      </header>

      <div className="poc-toolbar" role="toolbar" aria-label="Controles de evaluación Gantt">
        <div className="poc-seg" role="group" aria-label="Escala temporal">
          {(['dia', 'semana', 'mes', 'anio'] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              type="button"
              data-zoom={z}
              aria-pressed={zoom === z}
              onClick={() => onZoom(z)}
            >
              {z === 'dia' ? 'Día' : z === 'semana' ? 'Semana' : z === 'mes' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>

        <button type="button" className="poc-btn" data-toggle="critical" aria-pressed={showCritical} onClick={onToggleCritical}>
          Ruta crítica
        </button>
        <button type="button" className="poc-btn" data-toggle="baseline" aria-pressed={showBaseline} onClick={onToggleBaseline}>
          Línea base
        </button>
        <button type="button" className="poc-btn" data-toggle="conflicts" aria-pressed={showConflicts} onClick={onToggleConflicts}>
          Conflictos ({dataset?.meta.conflictCount ?? 0})
        </button>
        <button type="button" className="poc-btn" data-action="nudge" onClick={onKeyboardNudge}>
          Alt+→ Preview (+1d)
        </button>

        <div className="poc-seg" role="group" aria-label="Densidad">
          <button type="button" data-density="estandar" aria-pressed={density === 'estandar'} onClick={() => onDensity('estandar')}>
            36px
          </button>
          <button type="button" data-density="compacta" aria-pressed={density === 'compacta'} onClick={() => onDensity('compacta')}>
            28px
          </button>
        </div>

        <button
          type="button"
          className="poc-btn"
          data-theme-toggle
          aria-pressed={theme === 'dark'}
          onClick={() => onTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? 'Oscuro' : 'Claro'}
        </button>

        <span className="poc-status" data-testid="dataset-summary">
          {dataset
            ? `${dataset.meta.taskCount} tareas · ${dataset.meta.dependencyCount} vínculos · ${dataset.meta.criticalCount} críticas · ${dataset.meta.conflictCount} conflictos`
            : 'Cargando dataset…'}
        </span>
      </div>

      <main className="poc-stage" id="poc-stage">
        {children}
        {previewNote && (
          <div className="poc-preview-bar" role="status" data-testid="preview-bar">
            {previewNote}
          </div>
        )}
      </main>
    </div>
  );
}
