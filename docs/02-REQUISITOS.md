# Requisitos funcionales y no funcionales

Cada fila define la obligación y el criterio mínimo de aceptación; los detalles normativos están en el motor y modelo de datos. P0 piloto, P1 v1 completa.

| ID | Prioridad | Requisito | Criterio de aceptación |
|---|---|---|---|
| RF-01 | P0 | SSO OIDC Entra single tenant; usuarios habilitados y asignados | Usuario autorizado entra; tenant ajeno, no asignado, desactivado y sesión caducada no acceden; no hay contraseña local |
| RF-02 | P0 | Alta/actualización por tid+oid, sesión y baja/revocación | Cambio de UPN no duplica perfil; deshabilitar local invalida siguiente petición; política de revalidación probada |
| RF-03 | P0 | CRUD, archivo/restauración de proyectos, propietario, estado, calendario y miembros | Proyecto creado con UUID; archivado no editable; solo rol autorizado puede restaurar |
| RF-04 | P0 | CRUD tareas, jerarquía WBS y orden; tareas, grupos, hitos | Mover/reordenar conserva IDs; árbol sin ciclos; grupo derivado; hito cero; eliminación referenciada advertida y transaccional |
| RF-05 | P0 | Estado, prioridad, progreso, descripción, fechas, esfuerzo, responsable y plazo | Validación 0–100 y transiciones; progreso de grupo calculado; sin fechas inconsistentes |
| RF-06 | P0 | Gantt con timeline, zoom día/semana/mes/año, scroll, plegado, línea hoy | Vista y tabla alineadas; zoom no altera fechas; jerarquía y hitos visibles; teclado/formulario alternativo |
| RF-07 | P0 | Drag/resize, creación de vínculos y edición de fechas con preview | Preview indica cambios transitivos; cancelar no persiste; confirmación usa revisión; error revierte visualización |
| RF-08 | P0 | Dependencias FS/SS/FF/SF con adelanto/retraso laboral, múltiples predecesoras | Fixtures de los cuatro tipos; lag positivo/negativo; se aplica máximo de restricciones; ciclo rechazado |
| RF-09 | P0 | Calendario laboral semanal, festivos, excepciones, zona horaria | Fin de semana/festivo omitido; cambios DST sin alterar fechas civiles; calendario inválido rechazado |
| RF-10 | P0 | Replanificación determinista, constraints y conflictos | Mismos inputs/versión producen mismo plan; fechas fijas incompatibles dan explicación; transacción sin estado parcial |
| RF-11 | P0 | Tabla editable, filtros, búsqueda, orden y columnas | Editar progreso o fechas refleja mismo dato en Gantt; filtros no modifican plan ni revelan costes |
| RF-12 | P0 | Kanban por estado con drag y alternativa accesible | Mover tarjeta cambia solo estado/progreso según regla; al recargar mantiene datos |
| RF-13 | P0 | RBAC global, membresía por proyecto y permisos económicos/exportación | Matriz de casos positivos y negativos; IDOR en listas, detalle, mutación, descarga y SSE denegado |
| RF-14 | P0 | Auditoría de creación, cambio, archivo, permisos, importación y planificación | Actor, objeto, UTC, acción, correlación, revisión y diff sanitizado; rollback no deja evento de éxito |
| RF-15 | P1 | Ruta crítica y holgura CPM | Red conocida produce ruta/holguras esperadas; caminos múltiples; plan no factible no muestra falsa criticidad |
| RF-16 | P1 | Baselines múltiples inmutables y comparación | Guardar plan/versiones; edición posterior no altera baseline; tareas nuevas/eliminadas identificadas; delta laboral |
| RF-17 | P1 | Cartera y salud de proyectos, filtros y próximos hitos | Agregados respetan visibilidad; colores con motivos; datos se actualizan al confirmar cambio |
| RF-18 | P1 | Recursos humanos/virtuales, equipos, calendarios y ausencias | Capacidad diaria por recurso; sin duplicar identidad; ausencias reducen disponibilidad; permisos de capacidad independientes |
| RF-19 | P1 | Asignaciones con esfuerzo total o carga por día; vista carga multi-proyecto | Distribución determinista, suma exacta; carga > capacidad alerta; no reprograma sola; detalle privado redacted |
| RF-20 | P1 | Registro manual de horas, edición y aprobación simple | Minutos positivos; no doble envío; usuario solo propias; aprobador autorizado; horas aprobadas bloqueadas hasta reapertura auditada |
| RF-21 | P1 | Tarifas versionadas, presupuesto, costes fijos y desviación | Aprobación congela tarifa; decimal exacto; cambio tarifa no altera pasado; acceso financiero separado; falta tarifa marcado como incompleto |
| RF-22 | P0 | Exportación CSV básica autorizada | Datos permitidos, filtros efectivos, sin columnas restringidas, escape de fórmulas |
| RF-23 | P1 | Importación CSV/XLSX con mapeo, preview y confirmación | Validación filas, códigos externos, fechas, ciclos; lote inválido no escribe; confirmación idempotente y versión vigente |
| RF-24 | P1 | Exportación XLSX/PDF/PNG/JSON de plan y tablas | PDF paginado y legible, escala definida, imagen acotada; JSON versionado sin secretos; controles de permisos en generación/descarga |
| RF-25 | P1 | Comentarios y menciones; enlaces a documentación | Comentario persistido con autor/fecha; sanitización; solo menciones a usuarios con acceso; no fichero binario en v1 |
| RF-26 | P1 | Bandeja de notificaciones y preferencias | Asignación, mención, vencimiento, cambio relevante; deduplicación; marcar leído; sin fuga al revocar acceso |
| RF-27 | P1 | Plantillas versionadas de estructura, tareas, dependencias, esfuerzo y calendario | Instanciar remapea IDs, desplaza plan a fecha elegida, valida; no copia miembros, comentarios, horas, costes ni secretos |
| RF-28 | P1 | Teams: alertas salientes vía Workflows o adaptador aprobado | Configuración por proyecto/canal autorizados; envío de prueba; reintentos limitados y estado; contenido mínimo |
| RF-29 | P1 | Jira Cloud: vínculo/importación selectiva y sincronización externa solo lectura | Issue autorizado vinculado por cloudId+issueId; estado externo actualizado sin sobrescribir campos del plan; sin acceso muestra no disponible |
| RF-30 | P1 | Administración conectores, estado y reintentos | Credenciales cifradas, no visibles en logs; desconectar detiene jobs; errores rastreables; auditoría de cambios |
| RF-31 | P0 | Acceso personal a tareas, vencimientos, búsqueda y proyecto reciente | Solo proyectos accesibles; tarea asignada visible; filtro consistente |
| RF-32 | P0 | Gestión de usuarios/equipos/calendarios y configuración operativa | Alta/baja local y cambios autorizados; último admin no se elimina sin sustitución; auditoría |

## No funcionales (objetivos propuestos; validar F0)
| ID | Tema | Requisito y aceptación medible |
|---|---|---|
| RNF-01 | Seguridad | TLS, cookies HttpOnly/Secure/SameSite, CSRF, CSP, validación de tokens OIDC, protección XSS/SQLi/SSRF/IDOR; revisión de amenazas y pruebas negativas antes de piloto |
| RNF-02 | Privacidad | Minimización; sin datos clínicos; datos y backups en región aprobada (preferencia UE); retención de auditoría y borrado aprobados; revisión DPD/seguridad si aplica |
| RNF-03 | Rendimiento | Dataset de referencia: 50 proyectos, 10.000 tareas totales, 1.000 en proyecto, 2.000 vínculos, 50 recursos, 20 usuarios concurrentes; p95 lectura API <=500 ms, replanificación de proyecto <=2 s, primera vista Gantt <=3 s en entorno de referencia documentado; scroll objetivo >=45 fps; medir, no asumir |
| RNF-04 | Disponibilidad | Objetivo mensual 99,5% durante horario acordado, excluyendo mantenimiento pactado; sondas, alertas y runbook; validar con infraestructura |
| RNF-05 | Recuperación | RPO <=24 h y RTO <=4 h propuestos; backup cifrado diario y restauración de prueba trimestral; prueba previa a producción; evidencia de recuperación de datos y configuración |
| RNF-06 | Concurrencia | Revisión optimista de proyecto/entidad y transacciones; dos cambios simultáneos no pierden datos; respuesta 409 y reconciliación visible; reintentos idempotentes |
| RNF-07 | Accesibilidad | Objetivo WCAG 2.2 AA para flujos críticos; teclado, foco, contraste, etiquetas, lector de pantalla y alternativa no drag; auditoría automatizada y manual |
| RNF-08 | Compatibilidad | Edge/Chrome y Safari actuales en versiones aprobadas por IT, resoluciones 1280+ y lectura/formularios en móvil; probar matriz; castellano, fechas locales |
| RNF-09 | Observabilidad | Logs estructurados sin datos sensibles, correlationId, métricas latencia/error/cola, alertas de backup y conectores; diagnóstico de fallo simulado |
| RNF-10 | Mantenibilidad | Módulos aislados, API versionada, migraciones probadas, lint/typecheck/CI; cobertura de ramas del motor objetivo >=90%, tests de reglas críticas sin excepciones silenciosas |
| RNF-11 | Integridad | FK/check/unique, transacciones y auditoría; importaciones atómicas; dinero decimal y minutos enteros; no pérdida de datos; fixtures y restauración |
| RNF-12 | Cadena suministro | Lockfile, SBOM, SCA, secret scanning, dependencias y licencias aprobadas; sin vulnerabilidades altas/críticas abiertas salvo excepción de seguridad formal antes de release |
| RNF-13 | Operación ENS | Matriz de controles aplicables, evidencias de acceso, auditoría, cambios, restauración y gestión de incidentes; revisión según categorización real; no declarar cumplimiento automático |
| RNF-14 | Integraciones | Timeout, retry con jitter/Retry-After, dedupe, límites, cola de fallos, desconexión; fallo externo no bloquea guardado del proyecto; prueba de 429/401/5xx |
