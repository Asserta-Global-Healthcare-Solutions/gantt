# AP-001 · Acta de decisiones adoptadas

| Campo | Valor |
|---|---|
| Fecha | 2026-11-25 |
| Ámbito | Auditoría inicial del kit v1.0 y arranque de F0 |
| Aprueba | Responsable técnico provisional (decisiones de ingeniería) |
| Validación funcional | Responsables de Asserta: **pendiente** (ver [P-xx](AP-001-05-decisiones-pendientes.md)) |
| No aprobado en este acta | Dirección, seguridad, finanzas, protección de datos, infraestructura |

## 1. Gobierno
- **D-01.** El responsable técnico provisional aprueba las decisiones de ingeniería. La validación funcional definitiva corresponde a los responsables de Asserta, que no se han designado todavía (P-01, P-02).
- **D-02.** Ningún agente registra aprobaciones de dirección, seguridad, finanzas o DPD. Las que faltan figuran como pendientes.

## 2. Autorizaciones de trabajo
- **D-03. Autorizado:**
  - documentación nueva en `docs/f0/` y fe de erratas;
  - ramas por ticket;
  - dependencias solo para las PoC aprobadas, aisladas en `poc/`;
  - prototipos visuales locales en HTML, CSS y JS;
  - datos sintéticos;
  - pruebas y benchmarks locales.
- **D-04. No autorizado:**
  - push o merge sin aprobación;
  - cambios en infraestructura corporativa;
  - credenciales reales;
  - envío de información corporativa a servicios externos (incluidos Figma y los artefactos publicados);
  - código de producción antes del gate F0;
  - avanzar a F1 automáticamente.
- **D-05.** Los commits no están autorizados expresamente en este acta. Los entregables quedan sin commit en la rama del ticket hasta que se autoricen.

## 3. Hallazgos críticos
| ID | Decisión | Detalle normativo |
|---|---|---|
| D-06 (H-C1) | Responsable principal `responsibleUserId` por tarea, independiente de los recursos asignados | El modelo distingue responsable principal, colaboradores, recursos asignados, esfuerzo estimado, esfuerzo planificado y esfuerzo real ([CH-05](AP-001-03-propuesta-v1.1.md#ch-05)) |
| D-07 (H-C2) | Autorización deny-by-default con alcance explícito: organización, equipo/departamento y proyecto | Dirección accede a toda la cartera solo por concesión explícita. Los administradores técnicos no obtienen contenido de proyectos por administrar. Se prohíben las autoasignaciones ([CH-08](AP-001-03-propuesta-v1.1.md#ch-08)) |
| D-08 (H-C3) | Política de conflictos de planificación | Ver §3.1 |

### 3.1 Política de conflictos (D-08)
1. Las tareas automáticas se recalculan respetando dependencias y calendarios.
2. Las tareas manuales conservan sus fechas aunque exista conflicto. El conflicto se registra y se muestra.
3. Las dependencias circulares siempre se rechazan.
4. La replanificación automática nunca modifica las fechas reales de inicio y fin.
5. Las tareas completadas conservan su información histórica.
6. Las tareas en curso pueden replanificar el trabajo restante sin alterar los hechos registrados.
7. Antes de confirmar cambios relevantes se muestra el impacto sobre las dependientes.
8. Las propiedades y los casos de prueba del motor se adaptan: no se exige que se cumplan todas las dependencias cuando el conflicto está autorizado por una tarea manual o por hechos registrados ([CH-02](AP-001-03-propuesta-v1.1.md#ch-02), [CH-03](AP-001-03-propuesta-v1.1.md#ch-03)).

## 4. Hallazgos altos
| ID | Decisión |
|---|---|
| D-09 (H-A1) | El mismo paquete de planificación se usa en el frontend y en el backend. El cliente solo previsualiza; el backend valida, recalcula y confirma con autoridad |
| D-10 (H-A2) | AP-002 se divide en AP-002a (dirección visual) y AP-002b (resto de pantallas, tras aprobar una dirección) |
| D-11 (H-A3) | Overlays de ruta crítica y líneas base evaluados con render personalizado, sin módulos comerciales |
| D-12 (H-A4) | Crear asignaciones no sobrescribe el esfuerzo estimado. Estimado, planificado y real se guardan por separado, cada uno con una sola fuente de verdad |
| D-13 (H-A5) | Sin borradores persistentes de planificación en la v1. Siempre hay preview antes de confirmar |
| D-14 (H-A6) | Versiones de calendario inmutables. Cualquier cambio que afecte a un proyecto recalcula y muestra el impacto antes de confirmar |
| D-15 (H-A7) | Evaluar `openid-client`, MSAL Node y otras alternativas maduras; decidir en ADR-004. Sin autenticación propia innecesariamente compleja |
| D-16 (H-A8) | Se impide la autoasignación de permisos sobre proyectos restringidos. Acceso excepcional mediante un procedimiento trazable y autorizado por un tercero |
| D-17 (H-A9) | Jira es de solo lectura. No se copia información de una incidencia si sus permisos no son compatibles con los destinatarios del proyecto |
| D-18 (H-A10) | Estimaciones revisadas tras F0; la calidad, la seguridad y la mantenibilidad no se recortan por un plazo |

## 5. Otros
- **D-19.** Los hallazgos medios y bajos se resuelven con propuestas documentadas ([03](AP-001-03-propuesta-v1.1.md)). Las decisiones económicas y de infraestructura quedan pendientes de sus responsables.
- **D-20.** Se incorpora una vista de historial de modificaciones por tarea y por proyecto, filtrada por permisos (nuevo RF-33, ticket AP-056).
- **D-21. PoC Gantt autorizada** sobre SVAR React Gantt, DHTMLX Gantt Community, Frappe Gantt (evaluación preliminar) y un spike acotado de render propio.
  - Mismos datos y mismos criterios para todos.
  - Se priorizan las licencias libres para uso empresarial.
  - Licencias y funciones se comprueban sobre la **versión exacta instalada**, no sobre la documentación comercial.
  - Ninguna selección es definitiva antes de presentar resultados.
- **D-22. AP-002a:** dos propuestas visuales realmente diferenciadas (Dashboard de inicio y Gantt), en claro y oscuro.
  - Prototipos navegables de alta fidelidad, con datos ficticios.
  - Identidad provisional sustituible mediante tokens.
  - Solo herramientas locales.
  - No se hacen más pantallas hasta aprobar una dirección.
- **D-23.** Revisión v1.1 propuesta con trazabilidad completa. La documentación original no se sobrescribe hasta su aprobación.
- **D-24.** Orden de ejecución: AP-001 primero y revisión antes de continuar.

## 6. Hallazgo incorporado durante AP-001
- **H-A11** (nuevo, detectado al validar `backlog.csv`): ocho dependencias van de tickets P0 a tickets P1. Como consecuencia, **el piloto no tiene un gate propio de seguridad ni de backup y restauración**: AP-051 y AP-053 dependen de funciones de F4/F5. Propuesta en [CH-14](AP-001-03-propuesta-v1.1.md#ch-14). Hace falta aprobarla (P-20).
