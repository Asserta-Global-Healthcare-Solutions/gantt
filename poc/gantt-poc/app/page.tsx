import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: '40px 20px' }}>
      <p style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        AP-003 · PoC comparativa Gantt · Next.js 16.4.6 + React 19.3.1 · Dirección C · Asserta
      </p>
      <h1 style={{ fontSize: 30, margin: '8px 0 12px', letterSpacing: '-0.03em' }}>Evaluación de 4 alternativas con 1.000 tareas y 2.000 vínculos</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>
        Mismo dataset sintético validado por el oráculo AP-004, mismo horizonte temporal, build de producción y tema C · Asserta (claro y oscuro).
      </p>
      <nav aria-label="Alternativas evaluadas" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { href: '/frappe', name: '01 · Frappe Gantt', desc: 'frappe-gantt@1.2.2 (MIT) — Gate preliminar' },
          { href: '/svar', name: '02 · SVAR React Gantt', desc: '@svar-ui/react-gantt@2.8.3 (MIT) — Sin PRO' },
          { href: '/dhtmlx', name: '03 · DHTMLX Community', desc: 'dhtmlx-gantt@10.1.0 (MIT) — Integración JS sin PRO' },
          { href: '/custom', name: '04 · Render propio (Spike)', desc: 'React 19 + virtualización + SVG sobre tokens C' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: 16,
              border: '1px solid var(--line-strong)',
              borderRadius: 4,
              background: 'var(--surface)',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 6 }}>{item.name}</strong>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{item.desc}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
