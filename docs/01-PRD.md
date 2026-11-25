# PRD — Asserta Projects

Versión 1.0 | Responsable funcional: pendiente de designación | Sponsor: pendiente | Fecha 2026-11-25

## 1. Problema y visión
Centralizar la planificación temporal, ejecución, asignación de personas, horas y costes en una webapp corporativa, evitando planes desconectados y duplicidad con herramientas de incidencias. Gantt será la vista principal; las demás vistas operarán sobre las mismas entidades. Se pretende una alternativa interna inspirada en GanttPRO, no una copia visual ni una promesa de paridad total. Jira conserva su función de seguimiento de incidencias/desarrollo.

## 2. Resultados esperados
- Crear y mantener planes de proyecto con dependencias y calendarios coherentes.
- Identificar retrasos, ruta crítica, desviaciones respecto al plan original y cuellos de botella.
- Visibilizar la capacidad transversal de los equipos y costes a quienes estén autorizados.
- Reducir la actualización duplicada mediante enlaces y sincronización acotada de Jira.
- Facilitar informes a dirección y entregables exportables sin divulgar datos sensibles.

Indicadores propuestos para piloto (medir base antes de fijar objetivos definitivos): 100% de proyectos piloto con propietario y calendario; 100% de cambios de planificación auditables; >=90% de tareas planificadas con responsable cuando requieran esfuerzo; 0 dependencias circulares persistidas; >=80% de usuarios piloto capaces de crear un plan básico sin asistencia; medir tiempo de crear/replanificar un proyecto y tasa de errores de importación. No convertir métricas en vigilancia individual.

## 3. Personas y permisos
| Persona | Necesidad | Límites |
|---|---|---|
| Administrador IT | Identidades, configuración, soporte, conectores, operación | No adquiere automáticamente acceso a contenido o costes de todos los proyectos |
| Dirección | Cartera, riesgos, costes aprobados | Acceso explícito a cartera y campos económicos |
| Jefe de proyecto | Planificar, asignar, aprobar baselines y gestionar miembros | Solo proyectos autorizados; no asigna privilegios globales |
| Miembro | Consultar plan, actualizar sus tareas, comentar y registrar horas | No altera dependencias, presupuesto ni permisos sin concesión |
| Lector | Consultar plan autorizado | Sin modificaciones; exportación según permiso específico |
| Responsable de recursos | Capacidad y asignación transversal | No ve contenido de proyectos privados sin acceso; datos mínimos de ocupación |

## 4. Alcance cerrado de v1
P0 piloto: Entra ID; proyectos/tareas/WBS; Gantt; motor determinista; calendarios; tabla/Kanban; RBAC; auditoría; gestión básica de responsables; exportación mínima CSV. P1 v1: ruta crítica, líneas base, cartera, capacidad, horas y costes, importación/exportación completa, comentarios y notificaciones, plantillas, Teams y Jira. P1 no es opcional para la aceptación de v1.

No incluido: IA generativa, app móvil nativa, acceso de clientes externos, multitenancy comercial, facturación/ERP, nómina, fichaje laboral reglamentario, portal público, sincronización bidireccional de Jira, optimización automática de recursos, dependencias entre proyectos, editor de fórmulas, MPP nativo y calendario como vista independiente. No almacenar datos clínicos, identificadores de pacientes ni documentación sanitaria; la app gestiona proyectos, no asistencia clínica. No replicar datos de SharePoint salvo enlaces autorizados. Los estados y prioridades iniciales son comunes; campos personalizados tipados y personalización avanzada quedan fuera salvo aprobación.

## 5. Navegación y UX
- `/`: Mis tareas, próximos vencimientos, notificaciones y acceso a proyectos recientes.
- `/projects`: búsqueda y filtros por estado, cliente (etiqueta), equipo, responsable y archivados.
- `/projects/:id/gantt`: panel izquierdo WBS editable y timeline derecho sincronizado; barra superior con zoom, filtros, hoy, ruta crítica, baseline, exportar, deshacer de cambios simples no publicados (si se aprueba en PoC); panel lateral de detalle. Drag/resize con previsualización y confirmación cuando afecte a otras tareas; teclado y alternativa por formulario.
- `/projects/:id/table`: columnas nombre, estado, responsable, inicio/fin, duración, esfuerzo, progreso, prioridad y plazo; campos económicos solo si se autorizan; orden/filtro y edición inline validada. Filtrar nunca cambia el plan.
- `/projects/:id/board`: Kanban por estados, tarjetas con responsables, fechas y progreso; movimiento cambia estado, no reprograma fechas.
- `/projects/:id/settings`: calendario, miembros, integraciones, baselines, plantilla, configuración de presupuesto.
- `/portfolio`: resumen y tabla de proyectos, hitos y fechas; indicadores de salud con explicación, no IA.
- `/resources`: capacidad semanal/diaria, filtros por equipo, carga y sobreasignación; sin exponer nombres de proyectos privados.
- `/timesheets`: registro de horas propias, estado, filtros semanales; informes por proyecto para gestor.
- `/notifications`: bandeja leída/no leída y preferencias.
- `/admin`: usuarios, equipos, calendarios, roles, conectores, auditoría operativa.

Estados de interfaz obligatorios: carga, vacío, error recuperable, sin permisos, sesión caducada, conflicto de edición y trabajo pendiente de sincronizar. Desktop-first; lectura y edición mediante formularios en móvil. Diseño propio, coherente, accesible; sin copiar activos de GanttPRO. Mockups F0: login, inicio, listado, Gantt con 3 niveles WBS, detalle, tabla, Kanban, cartera, recursos, horas, ajustes y errores.

## 6. Flujos de negocio
1. Alta: usuario autorizado inicia sesión con Entra; se crea/actualiza perfil por identidad inmutable; acceso a proyectos solo por membresía. Usuario no autorizado recibe denegación.
2. Creación: jefe crea proyecto vacío o plantilla, fija calendario, responsable, fechas y miembros; añade tareas y hitos; establece dependencias y publica planificación.
3. Replanificación: cambia duración o inicio, obtiene preview de impacto y advertencias; confirma contra revisión vigente; motor recalcula en transacción; audita y notifica. Si conflicto, recargar/revisar, nunca sobrescribir en silencio.
4. Ejecución: miembro actualiza progreso/estado y registra esfuerzo real; comenta/menciona; las vistas se actualizan. El estado no modifica automáticamente fecha planificada. Cierre requiere revisar tareas abiertas y registrar motivo de excepción.
5. Control: gestor congela baseline; compara variaciones; dirección ve cartera, riesgos y costes autorizados. Rebaseline explícito conserva anteriores.
6. Recursos: gestor asigna personas/recursos virtuales y horas; detecta sobrecarga por día; se permite excepción visible con justificación, sin mover fechas automáticamente.
7. Importación: carga CSV/XLSX, asigna columnas, valida filas, preview, confirma; importación atómica; errores por fila; exportación respeta filtros y permisos.
8. Integración: vincular tareas a incidencias Jira autorizadas; visualizar estado externo con última sincronización; notificaciones Teams por eventos seleccionados, con enlace a app y sin información confidencial.

## 7. Reglas funcionales de producto
Estados de proyecto: borrador, activo, en pausa, completado, archivado. Tarea: pendiente, en curso, bloqueada, completada; reabrir explícitamente. Prioridades baja/normal/alta/urgente. Hito: duración cero, sin horas/asignación de esfuerzo. Progreso de hojas 0–100 entero; completar fija 100, reabrir solicita progreso <100; bloqueada no equivale a retraso. Resumen WBS deriva fechas/progreso de hojas; progreso ponderado por esfuerzo estimado cuando todos tienen estimación positiva, si no por duración laboral; hitos excluidos; si solo hay hitos, completados/total. No mezclar pesos dentro del mismo resumen. Progreso cartera por proyecto con la misma regla, no promedio arbitrario de tareas.

Salud (regla propuesta): rojo si hito/plazo vencido no completado o tarea crítica incompleta vencida; ámbar si fin previsto supera baseline o hay una sobrecarga o tarea bloqueada; verde si no hay alertas; gris sin plan válido o proyecto inactivo. Mostrar motivos y fecha de cálculo. Plazo es dato independiente del fin planificado. Progreso real no altera automáticamente fechas planificadas. Archivar conserva registros y hace el proyecto de solo lectura; restaurar exige permiso y auditoría.

## 8. Aceptación de producto
Piloto: F0–F3 core (ver gates); conjunto de proyectos ficticios y luego proyectos reales aprobados sin información sanitaria; UAT por jefe, miembro, dirección y administrador. V1: F0–F6 aprobadas, todos RF/RNF aplicables trazados a pruebas, integraciones en sandbox y tenant real autorizadas, sin defectos bloqueantes ni vulnerabilidades altas/críticas sin resolución; backup restaurado, manuales y propietario de operación. La aceptación funcional no implica certificación ENS.

## 9. Riesgos y decisiones pendientes
El motor de calendario/CPM, el rendimiento del Gantt y las licencias son riesgos prioritarios. Confirmar usuarios concurrentes, tamaño máximo de proyectos, propietarios de datos, retención, tratamiento de costes, calendario de cada equipo, integración Jira (Cloud asumido), canales y licencia de Workflows, dominio/hosting y presupuesto. No desplegar a producción sin estas decisiones y revisión de seguridad. Las reglas operativas incluidas son propuestas a ratificar en F0.
