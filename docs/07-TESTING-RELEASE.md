# Estrategia de testing, fases y release

## 1. Plan de fases
Ventana orientativa 12–16 semanas para un piloto y primera versión si hay capacidad sostenida, reutilización y decisiones rápidas; no es compromiso ni estimación por horas. El alcance completo puede requerir más tiempo; dimensionar tras PoC, y no comprimir seguridad/CPM. F0 1–2 semanas, F1 2, F2 3–4, F3 2, F4 2–3, F5 2–3, F6 1–2; solapes solo con interfaces y dependencias cerradas. Piloto core tras F2/F3 según gate; v1 solo al cerrar F6. Fases no equivalen a prioridad P0/P1.

| Fase | Gate de salida | Evidencia |
|---|---|---|
| F0 | Sponsor aprueba PRD, UX, contrato motor, PoC, ADR, amenaza y supuestos | Acta, mockups, benchmarks, licencias, casos dorados y riesgos |
| F1 | Identidad, persistencia, permisos, auditoría y CRUD operativos | CI, pruebas de tenant y RBAC, migraciones |
| F2 | Gantt/tabla/Kanban, motor, calendarios y export básico coherentes; CPM/baseline v1 | Fixtures, pruebas de propiedad, E2E, rendimiento inicial |
| F3 | Colaboración/cartera y piloto core aprobado | UAT, notificaciones, plantillas, pruebas de acceso |
| F4 | Capacidad, horas, costes conciliados con fixtures de negocio | Ejemplos revisados, tests decimal/ausencia/privacidad |
| F5 | Import/export e integraciones funcionales en sandbox | Reconciliación, pruebas fallos/reintentos, PDFs visuales, scopes |
| F6 | Todos los requisitos trazados; seguridad, restore, UAT y operación aprobados | Informe QA, acta, release notes, runbooks, backups, evidencias |

## 2. Capas de pruebas
- Unitarias (Vitest): puro motor calendario/grafo, CPM, rollup, distribución, dinero, validación, autorización. ≥90% ramas objetivo motor; cubrir 100% de reglas y casos dorados identificados, no perseguir porcentaje artificial.
- Property-based (fast-check o equivalente): DAG aleatorios acotados; ningún vínculo incumplido, determinismo, no fechas no laborables, idempotencia del cálculo, ciclos rechazados; comparar CPM con oráculo enumerativo DAG pequeños; sumas de distribución exactas y holgura no negativa.
- Integración PostgreSQL real (contenedor efímero): FK, constraints, migración desde versión anterior, transacción rollback, auditoría/outbox, concurrencia, permisos por fila/campo, import idempotente, dedupe jobs, tarifa congelada.
- Contratos API/OpenAPI: validación schemas y errores, paginación, revisión, idempotencia, autorizaciones. Mocks de APIs externas con respuestas grabadas sintéticas sin tokens.
- E2E Playwright: navegador real, datos sintéticos, login simulado solo test; staging con Entra real autorizado; crear proyecto, Gantt drag/resize, dependencias, replanificar, tabla/Kanban, baseline, recursos, horas, costes, import/export, comentarios, plantillas, permisos y revocación. No depender exclusivamente de selectores visuales frágiles; usar roles y test IDs justificados.
- Visual: capturas de Gantt con jerarquía, zoom, errores, baseline, PDF páginas, tamaños 1280/1440/1920; diffs revisados; tablas legibles y no recortes. Accesibilidad axe + navegación teclado y lector de pantalla manual.
- Seguridad: amenazas STRIDE (identidad, tampering, disclosure, DoS, elevación), OWASP ASVS como lista de verificación adaptada, tests de IDOR, CSRF, XSS, SQLi, SSRF, ZIP bomb, CSV injection, límites, headers, token y redirect. Pruebas dinámicas únicamente en staging autorizado; revisar dependencias/secretos y SBOM.
- Carga: script reproducible k6 o equivalente con dataset RNF-03, entorno y hardware registrados; concurrentes lectura, preview/commit, import y worker; medir p50/p95/p99, errores, memoria y tiempos; perfiles UI de 1000 filas; simular jobs sin bloquear web.
- Resiliencia: caída worker durante envío, DB temporal, 429 con Retry-After, timeout, revocación OAuth, import corrupto, sesión expirada; confirmar recuperación, DLQ, auditoría y ausencia de pérdida silenciosa.

## 3. Matriz mínima de aceptación
| Test | Requisitos | Dado / cuando / entonces |
|---|---|---|
| AT-01 | RF-01,02,13 | Tenant ajeno/no asignado intenta login: denegación; miembro activo accede solo a su proyecto; baja local bloquea siguiente petición |
| AT-02 | RF-03,04,05 | Proyecto con 3 niveles, hoja/hito; editar y mover conserva IDs y resumen; archivar bloquea cambios |
| AT-03 | RF-06,07,08,09,10 | A termina antes de festivo y B FS; resize A, preview muestra desplazamiento, cancelar no modifica, confirmar respeta festivo |
| AT-04 | RF-08,10 | Agregar ciclo o restricción fija incompatible: 422, ningún cambio ni evento de éxito |
| AT-05 | RF-11,12,31 | Cambiar estado en Kanban: tabla/inicio/Gantt reflejan mismo dato; fechas intactas |
| AT-06 | RNF-06,RF-14 | Dos gestores editan rev 42: primero éxito, segundo 409; evento único y diff correcto |
| AT-07 | RF-15,16 | Red A-B-H y A-C-H: holgura C=2; congelar baseline, retrasar B: snapshot original y delta visibles |
| AT-08 | RF-17,18,19 | Asignar 6h+4h a recurso 8h: carga 10h y alerta; proyecto privado no revela nombre al resource manager |
| AT-09 | RF-20,21 | 90 min a 40 EUR/h = 60 EUR; aprobar y cambiar tarifa: coste histórico sigue 60; sin tarifa, estado incompleto |
| AT-10 | RF-22,23,24 | Import con ciclo/fecha inválida: errores fila y cero escrituras; corregir y confirmar; export legible y sin fórmula ni coste restringido |
| AT-11 | RF-25,26 | Mención autorizada produce una notificación lógica; acceso revocado no revela cuerpo en bandeja |
| AT-12 | RF-27 | Instanciar plantilla dos veces crea IDs distintos y vínculos internos sin datos de usuarios/horas |
| AT-13 | RF-28,30,RNF-14 | Canal aprobado, envío prueba; 429/timeout activa reintento y fallo visible; guardado de tarea sigue correcto |
| AT-14 | RF-29,30,RNF-14 | Vincular issue autorizado, cambiar estado Jira: metadata refresca; plan intacto; revocar acceso limpia caché |
| AT-15 | RF-13,RNF-01,02 | Usuario adivina ID/export/job de otro proyecto, SSE y cartera: no obtiene contenido ni coste |
| AT-16 | RNF-03,07,08 | Dataset referencia; latencia y fluidez medidas, teclado opera Gantt sin drag, navegadores aprobados |
| AT-17 | RNF-04,05,09,13 | Backup, restore en entorno aislado, verificación de conteos y relaciones; RTO/RPO medidos y alertas probadas |
| AT-18 | RNF-10,11,12 | PR pasa CI y SCA; migración y rollback ensayados; trazabilidad RF-ticket-test y dependencias aprobadas |

Cada ticket tendrá tests específicos y enlaces a evidencia en PR. AT son escenarios de aceptación transversal, no sustituyen la cobertura unitaria. UAT con cuentas y permisos separados, datos aprobados; responsable de negocio firma resultados, no agente.

## 4. Release y operación
Versionar SemVer, migraciones expand-contract, release candidate preprod y smoke. Go/no-go: todos P0/P1 de v1 aceptados, 0 bloqueantes, 0 vulnerabilidades críticas/altas sin tratamiento aprobado, restore y rollback probados, capacidad operativa, documentación y propietario. Cualquier excepción de seguridad debe quedar documentada y aprobada por autoridad competente, sin ocultar riesgo. Producción solo tras aprobación. Post-release revisar errores, latencia, jobs, acceso y alertas; rollback o mitigación según runbook. No usar datos reales para tests sin autorización. Matriz de evidencias ENS según categoría y controles aplicables; auditoría de permisos, acceso, cambios, restauración trimestral y respuesta a incidentes. No declarar certificación por implementación.
