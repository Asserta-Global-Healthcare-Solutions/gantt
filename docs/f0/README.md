# F0 — Entregables de definición y PoC

Estado: **AP-001 aprobado técnicamente** (2026-11-25; validación funcional P-01/P-02 pendiente). **AP-004 cerrado** (2026-11-25). **AP-002a cerrado** (2026-11-26; dirección **C · Asserta** oficial, P-29/RF-34 aprobada). **AP-005 en revisión** (rama `feat/AP-005-threat-model`). **AP-003** siguiente prioridad técnica (Plan Mode); **AP-002b** autorizado en paralelo sobre C. Ramas locales con commits autorizados (P-26), sin push ni merge.

Estos documentos son nuevos y **no sustituyen** el kit original (`README.md`, `AGENTS.md`, `docs/01..08`, `docs/adr/0000`). Las correcciones se proponen aquí y solo se aplicarán al kit tras su aprobación.

| Nº | Documento | Contenido |
|---|---|---|
| 1 | [AP-001-01-acta-decisiones.md](AP-001-01-acta-decisiones.md) | Decisiones adoptadas por el responsable técnico provisional |
| 2 | [AP-001-02-fe-erratas.md](AP-001-02-fe-erratas.md) | Errores, contradicciones y omisiones del kit v1.0 |
| 3 | [AP-001-03-propuesta-v1.1.md](AP-001-03-propuesta-v1.1.md) | Cambios propuestos por documento, con impacto |
| 4 | [AP-001-04-trazabilidad.md](AP-001-04-trazabilidad.md) | Hallazgo → decisión → RF/RNF → ADR → ticket → aceptación → prueba |
| 5 | [AP-001-05-decisiones-pendientes.md](AP-001-05-decisiones-pendientes.md) | Decisiones abiertas y responsable de validarlas |
| 6 | [AP-001-06-backlog-f0.md](AP-001-06-backlog-f0.md) | Backlog F0 actualizado y deltas sobre F1–F6 |
| 7 | [AP-001-07-plan-ap002a-ap004-ap005.md](AP-001-07-plan-ap002a-ap004-ap005.md) | Plan de ejecución de los siguientes tickets |
| AP-004 | [AP-004-contrato-motor.md](AP-004-contrato-motor.md) | Contrato normativo del motor v1.1 (aprobado) |
| AP-004 | [fixtures/engine/](fixtures/engine/) | 90 casos dorados con esquema; verificados por `poc/engine-oracle/` |
| AP-002a | [AP-002a-direccion-visual.md](AP-002a-direccion-visual.md) · [sistema de diseño C](AP-002a-sistema-diseno-c.md) · [galería](AP-002a-galeria.html) | **Cerrado (2026-11-26):** C · Asserta referencia visual oficial; tokens, componentes y reglas fijados; A y B conservados solo como evidencia histórica en `poc/ux-ap002a/` |

## Convenciones
- **H-xx**: hallazgo de auditoría (C = crítico, A = alto, M = medio, B = bajo). **D-xx**: decisión adoptada. **P-xx**: decisión pendiente. **E-xx**: errata. **CH-xx**: cambio v1.1.
- "Aprobado" solo significa aprobado por el responsable técnico provisional en el ámbito de ingeniería. Ninguna aprobación de dirección, seguridad, finanzas o protección de datos se da por obtenida.
- Todos los datos de ejemplo son sintéticos.
