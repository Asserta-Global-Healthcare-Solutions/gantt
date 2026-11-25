# AP-001 · Decisiones pendientes y responsables de validación

Ninguna de estas decisiones está aprobada. Los «responsables propuestos» son roles, no personas designadas: la designación es en sí misma la decisión P-01/P-02. «Bloquea» indica el primer ticket o gate que no puede cerrarse sin la decisión.

## 1. Gobierno y negocio

| P | Decisión | Propuesta técnica (si existe) | Responsable propuesto | Bloquea |
|---|---|---|---|---|
| P-01 | Designar sponsor | — | Dirección de Asserta | Gate F0 |
| P-02 | Designar responsable funcional o de producto (validación funcional del PRD v1.1) | — | Dirección de Asserta | Cierre de AP-001 (validación funcional) |
| P-03 | Usuarios reales, concurrencia y tamaño máximo de proyecto; confirmar el dataset RNF-03 | Mantener el dataset de referencia de RNF-03 como objetivo | Producto + IT | AP-003 (umbral), AP-052 |
| P-04 | Calendarios laborales por equipo y sede: festivos nacionales, autonómicos y locales; jornada intensiva | Un calendario por sede, con versiones | Operaciones / RRHH | AP-004 (fixtures reales sintetizados), AP-017 |
| P-16 | ¿El piloto incluye CPM y líneas base (P1)? | No; se implementan en F2 pero no son criterio del piloto | Producto | AP-035 |
| P-23 | Kanban o cambio de estado que registra hechos con impacto: confirmar con diálogo de impacto | Sí (CH-03) | Producto | AP-025 |
| P-27 | Revocar la membresía de un responsable: reasignar o dejar sin responsable | Reasignación obligatoria o «sin responsable» explícito y auditado | Producto | AP-013 |
| P-28 | Qué puede editar un colaborador (estado, progreso, horas) | Estado y progreso sí; fechas y dependencias no | Producto | AP-011a, AP-014 |

## 2. Finanzas y recursos

| P | Decisión | Propuesta técnica | Responsable propuesto | Bloquea |
|---|---|---|---|---|
| P-10 | Tarifa de coste o de venta; por recurso o por rol | v1: solo tarifa de **coste** por recurso; la facturación queda fuera de alcance | Finanzas | AP-040 |
| P-11 | Horas aprobadas sin tarifa: excepción «coste incompleto» o bloqueo | Excepción autorizada y visible | Finanzas | AP-040 |
| P-12 | Modo de asignación v1 | Solo esfuerzo total; carga diaria fija en P2 | Responsable de recursos + Producto | AP-037 |

## 3. Seguridad, privacidad y ENS

| P | Decisión | Propuesta técnica | Responsable propuesto | Bloquea |
|---|---|---|---|---|
| P-05 | Categorización ENS real del sistema y alcance de los controles | Diseñar para categoría media sin declarar cumplimiento | Responsable de seguridad | AP-005 (aprobación) |
| P-06 | Retención de auditoría e historial, purga, residencia de datos (UE) y necesidad de evaluación de impacto | Proponer en AP-005 | DPD + Seguridad | AP-005, AP-012, AP-056 |
| P-07 | RPO/RTO definitivos | RPO ≤24 h y RTO ≤4 h (v1.0) | IT + Seguridad | AP-058, AP-053 |
| P-13 | ¿`portfolio.read` de Dirección incluye proyectos restringidos? | Sí, solo agregados y mediante concesión explícita; el contenido requiere `project.read` | Dirección + Seguridad | AP-011b, AP-034 |
| P-15 | Break-glass: aprobadores, duración máxima, revisión periódica | Owner del proyecto o responsable de seguridad; 8 h por defecto, 72 h como máximo; revisión mensual; sin vía sin aprobador | Responsable de seguridad | AP-011b |
| P-20 | Gates propios del piloto AP-057/AP-058 y reclasificación de AP-051/052/053/055 a P1 (CH-14) | Aprobar | Responsable técnico (+ Seguridad para el alcance de AP-057) | Backlog F1+ |

## 4. Infraestructura e integraciones

| P | Decisión | Propuesta técnica | Responsable propuesto | Bloquea |
|---|---|---|---|---|
| P-08 | Hosting (Docker corporativo o gestionado UE), presupuesto, proxy y soporte de SSE | Decidir en ADR-001/010 con IT | IT + Dirección (presupuesto) | AP-006, AP-058 |
| P-09 | Tenant Entra, registro de la app por entorno, assignment required, política de invitados | Single tenant, assignment required, sin invitados | IT | AP-009 |
| P-18 | Nombre, ubicación y remoto del repositorio corporativo | `asserta-projects` (v1.0) | IT + Responsable técnico | AP-007 |
| P-21 | Jira Cloud confirmado; identidad de la conexión; quién declara la audiencia compatible | Propietario de Jira + owner del proyecto; `linkOnly` por defecto | IT / Propietario de Jira | AP-048 |
| P-22 | Teams: licencias de Workflows o Power Automate, identidad propietaria del flujo, canales aprobados | Flujo propiedad de una cuenta de servicio con co-owners | IT | AP-047 |

## 5. Ingeniería (responsable técnico)

| P | Decisión | Propuesta técnica | Bloquea |
|---|---|---|---|
| P-14 | Convención visual del hito en frontera (lunes frente a fin del viernes) | Mostrar las dos variantes en el prototipo AP-002a y decidir con Producto | AP-002b, AP-022 |
| P-17 | Prioridad de RF-33 / AP-056 | P1, con la pestaña de tarea en P0 si se quiere en el piloto | Backlog |
| P-19 | Render PDF/PNG local (navegador headless aislado) | Evaluar en ADR-009 | AP-045 |
| P-24 | Semántica del trabajo restante (`remainingDurationDays` + `remainingAsOf`) | Aprobar con el contrato AP-004 | AP-004 |
| P-25 | Recursos gráficos corporativos de Asserta (logo, color, tipografía). **Los entrega Comunicación/Marketing**, no ingeniería | Identidad provisional en tokens hasta recibirlos | AP-002b (final) |
| ~~P-26~~ | **Resuelta 2026-11-25:** commits locales autorizados en las ramas de ticket; push y merge siguen sin autorizar | — | — |
