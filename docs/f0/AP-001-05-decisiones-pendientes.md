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
| P-05 | Categorización ENS real del sistema y alcance de los controles | Diseñar para categoría MEDIA sin declarar cumplimiento (Anexo II RD 311/2022 cotejado en AP-005 03) | Responsable de seguridad | Base categoría: AP-006; cotejo refuerzos R1..R5 y DdA: AP-053 / piloto |
| P-06 | Exclusión clínica, conservación diferenciada, residencia de datos (UE) y EIPD | Excluir datos clínicos e identificadores de pacientes; conservación diferenciada en AP-005 01 (`P-35`) | DPD + Seguridad | Exclusión clínica: AP-006; plazos definitivos: AP-012 / piloto |
| P-07 | RPO/RTO definitivos | Alineados provisionalmente a RPO ≤4 h y RTO ≤8 h (`P-36`, AP-005 04) | IT + Seguridad | AP-058, AP-053 (no bloquea F0/F1) |
| P-13 | ¿`portfolio.read` de Dirección incluye proyectos restringidos? | Sí, solo agregados y mediante concesión explícita; el contenido requiere `project.read` | Dirección + Seguridad | AP-011b, AP-034 |
| P-15 | Break-glass: aprobadores, duración máxima, revisión periódica | Owner del proyecto o responsable de seguridad; 8 h por defecto, 72 h como máximo; revisión mensual; sin vía sin aprobador | Responsable de seguridad | AP-011b |
| P-20 | Gates propios del piloto AP-057/AP-058 y reclasificación de AP-051/052/053/055 a P1 (CH-14) | Aprobar | Responsable técnico (+ Seguridad para el alcance de AP-057) | Backlog F1+ |

## 4. Infraestructura e integraciones

| P | Decisión | Propuesta técnica | Responsable propuesto | Bloquea |
|---|---|---|---|---|
| P-08 | Hosting (Docker corporativo o gestionado UE), presupuesto, proxy y soporte de SSE | Decidir en ADR-001/010 con IT | IT + Dirección (presupuesto) | AP-006, AP-058 |
| P-09 | Tenant Entra, registro de la app por entorno, assignment required, política de invitados | Single tenant, assignment required, sin invitados | IT | AP-009 |
| ~~P-18~~ | **Resuelta 2026-11-26:** repositorio corporativo confirmado en `https://github.com/Asserta-Global-Healthcare-Solutions/gantt` | — | IT + Responsable técnico | — |
| P-21 | Jira Cloud confirmado; identidad de la conexión; quién declara la audiencia compatible | Propietario de Jira + owner del proyecto; `linkOnly` por defecto | IT / Propietario de Jira | AP-048 (no bloquea F0–F4) |
| P-22 | Teams: autenticación restringida al tenant (PoC Service Principal: disparador Teams vs HTTP Power Automate), prohibición de `Anyone` sin aceptación expresa de riesgo, cuenta de servicio con co-owners y canales aprobados | Modo autenticado en tenant; prohibir `Anyone` por defecto (AP-005 02 §6) | IT + Seguridad | AP-046, AP-047 (no bloquea F0–F4) |

## 5. Ingeniería (responsable técnico)

| P | Decisión | Propuesta técnica | Bloquea |
|---|---|---|---|
| ~~P-14~~ | **Resuelta 2026-11-25:** convención A (el hito en frontera se muestra en el día laborable siguiente, p. ej. lunes). Producto puede revisarla en AP-002b | — | — |
| P-17 | Prioridad de RF-33 / AP-056 | P1, con la pestaña de tarea en P0 si se quiere en el piloto | Backlog |
| P-19 | Render PDF/PNG local (navegador headless aislado) | Evaluar en ADR-009 | AP-045 |
| ~~P-24~~ | **Resuelta 2026-11-25:** aceptada (`remainingDurationDays` + `remainingAsOf`) | — | — |
| P-25 | Recursos gráficos corporativos de Asserta (logo, color, tipografía). **Los entrega Comunicación/Marketing**, no ingeniería | Identidad provisional en tokens hasta recibirlos | AP-002b (final) |
| ~~P-29~~ | **Resuelta 2026-11-26:** aprobada y ampliada **RF-34** (modelo versionado `user_preference` + `user_view_preference`: globales, por proyecto/vista, columnas/orden, zoom de proyecto, restablecimiento y adaptación no destructiva entre viewports; ticket independiente `AP-015b`, [CH-16](AP-001-03-propuesta-v1.1.md#ch-16)) | — | — |
| P-30 | Verificación del prototipo y del producto en Safari y Firefox (versiones aprobadas por IT) | Antes del gate F0 sobre C; en AP-052 sobre el producto | Gate F0 (visual), AP-052 |
| P-31 | Prueba con lector de pantalla real (NVDA y VoiceOver) del Gantt y flujos críticos de C | Antes de cerrar AP-002b/F0; en AP-052 sobre el producto | Gate F0 (accesibilidad), AP-052 |
| P-32 | Sesión opaca revocable en PostgreSQL: máximo absoluto **8 h** e inactividad **30 min** (AP-005 02 §5) | Aprobar objetivos provisionales (Seguridad + IT) | AP-009 (no bloquea F0) |
| P-33 | Detección de bajas/deshabilitación en Entra ID (**≤ 15 min**) y consentimiento de administrador para permiso Graph **`User.Read.All` (Application)** (AP-005 02 §4) | Aprobar objetivos provisionales (Seguridad + IT) | AP-009 (no bloquea F0) |
| P-34 | Encadenado de hashes diarios de auditoría de seguridad y exportación a repositorio protegido (AP-005 02 §7) | Aprobar como refuerzo v1 (Seguridad + IT) | AP-012 refuerzo (no bloquea F0) |
| P-35 | Conservación diferenciada por categoría (`DA-01..19`, incluido `DA-18` RF-34 y separación `DA-10` vs `RF-33`), anonimización tras baja (`R-14`) y borrado auditado por entrada accidental sensible (`R-08`) | Validar con normativa interna (DPD + Seguridad) | AP-057 / piloto (no bloquea F0/F1) |
| P-36 | Continuidad: **RPO ≤ 4 h**, **RTO ≤ 8 h**, PITR de PostgreSQL cuando sea viable y pruebas trimestrales con evidencias (AP-005 04) | Decidir con hosting (IT + Seguridad) | AP-058, AP-053 (no bloquea F0/F1) |
| P-37 | Política ante indisponibilidad de Microsoft Graph en revalidación: fail-open acotado con ventana de gracia + alerta vs fail-closed estricto (AP-005 02 §4) | Opción A (fail-open acotado + alerta, manteniendo baja local inmediata) (Seguridad + IT) | AP-009 (no bloquea F0) |
| P-38 | Selección del renderizador Gantt a partir de [AP-003](AP-003-poc-gantt.md) para `ADR-002` | Opción primaria recomendada: **Render propio virtualizado** (9,10/10); respaldo: DHTMLX Community 10.1.0 MIT (7,03/10) | **AP-006 (`ADR-002`) y Gate F0** |
| ~~P-26~~ | **Resuelta 2026-11-25:** commits locales autorizados en las ramas de ticket; push y merge siguen sin autorizar | — | — |
