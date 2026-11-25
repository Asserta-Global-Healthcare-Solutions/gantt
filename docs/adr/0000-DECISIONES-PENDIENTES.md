# Registro de decisiones pendientes (F0)

Estados: propuesta / aprobada / rechazada / sustituida. Crear ADR individual con contexto, opciones, decisión, justificación, consecuencias, pruebas, responsable y fecha. Todas las entradas siguientes son propuestas, no aprobaciones.

| ADR | Decisión | Propuesta / alternativa | Responsable propuesto |
|---|---|---|---|
| ADR-001 | Stack y hosting | Next.js monolito modular, PostgreSQL, worker; Docker corporativo vs alojamiento gestionado UE | IT/arquitectura |
| ADR-002 | Renderizador Gantt | SVAR MIT vs DHTMLX v10+ Community vs licencia comercial/render propio; PoC | Arquitectura/UX |
| ADR-003 | Motor temporal | Días laborales enteros, fronteras, cuatro dependencias, calendarios versionados, manual/auto y CPM generalizado | Producto/arquitectura |
| ADR-004 | Identidad y acceso | Entra single tenant, assignment required, sesión/revalidación, no invitados, RBAC de proyecto/finanzas | IT/seguridad |
| ADR-005 | Recursos y costes | Capacidad diaria, ausencia, distribución por capacidad, tarifa congelada, aprobación y excepción coste incompleto | Dirección/finanzas |
| ADR-006 | Integración Teams | Workflows y canal aprobado, co-owners, licencias, payload mínimo, egress | IT |
| ADR-007 | Jira | Cloud confirmado, OAuth 3LO, identidad, scopes, audiencia, lectura y polling; enlace solo si no equivalencia permisos | IT/propietario Jira |
| ADR-008 | Datos, privacidad y ENS | Clasificación, retención/purga, backups, RTO/RPO, residencia, control de costes y auditoría | Seguridad/DPD/IT |
| ADR-009 | UX y exportación | Mockups, accesibilidad, librerías export local, límites import/export, formatos | Producto/UX |
| ADR-010 | Rendimiento y operación | Dataset y SLO, capacidad, monitorización, staging/prod, concurrencia, rollout | IT/QA |

Bloqueantes: designar sponsor/propietario, confirmar tenant/licencias y configuración real, decidir infraestructura/host y presupuesto, audiencia de proyectos y costes, Jira Cloud y canales Teams, política de datos, ratificar semántica calendario/CPM. No aprobar automáticamente por haber redactado el kit.
