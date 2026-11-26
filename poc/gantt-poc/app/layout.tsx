import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AP-003 · PoC comparativa Gantt — Asserta Projects',
  description: 'Evaluación comparativa de Frappe, SVAR, DHTMLX Community y render propio sobre Next.js 16 y React 19',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light" data-density="estandar">
      <body>{children}</body>
    </html>
  );
}
