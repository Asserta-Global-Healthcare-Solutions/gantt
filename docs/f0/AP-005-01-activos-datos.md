# AP-005 · 01 Inventario de activos, clasificación y conservación

Estado: **propuesta técnica para revisión.** La clasificación de activos, la política de conservación y la categorización ENS quedan **PENDIENTES** de aprobación por Seguridad y DPD (`P-05`, `P-06`). Nada de este documento declara cumplimiento ni certificación ENS.

## 1. Criterios y exclusiones
- **Dimensiones ENS (RD 311/2022):** Confidencialidad (C), Integridad (I), Disponibilidad (D), Autenticidad (A) y Trazabilidad (T). Niveles propuestos: B (bajo), M (medio), A (alto).
- **Categoría de diseño provisional:** MEDIA (objetivo dado por el solicitante). La categorización formal corresponde a Seguridad (`P-05`).
- **Exclusión explícita de datos clínicos y de pacientes (PRD §4):** el alcance ordinario del producto **excluye** datos clínicos, diagnósticos, historias sanitarias, motivos médicos de ausencia e información identificativa de pacientes. Cualquier dato de esa naturaleza se considera **entrada no permitida** y se gestiona mediante controles preventivos y procedimiento de incidente (§6 y `R-08`).

## 2. Activos de información

| ID | Activo | Contenido | Propietario propuesto | C | I | D | A | T | Notas |
|---|---|---|---|---|---|---|---|---|---|
| DA-01 | Identidades y perfiles | `tid`, `oid`, nombre, UPN, estado local, equipo | IT | M | M | M | M | M | UPN y email son atributos, nunca identidad primaria |
| DA-02 | Permisos y accesos | Grants con alcance, membresías, solicitudes break-glass | Seguridad + owners | M | **A** | M | M | **A** | Su alteración implica escalada de privilegios |
| DA-03 | Plan de proyecto e historial funcional | Tareas, WBS, fechas, dependencias, calendarios, revisiones, historial funcional (`RF-33`) | Jefe de proyecto | M | **A** | M | M | M | Fuente de verdad del plan; historial funcional filtrado por permisos |
| DA-04 | Líneas base | Instantáneas inmutables del plan | Jefe de proyecto | M | **A** | B | M | M | Inmutables y sin costes privados |
| DA-05 | Proyectos restringidos | Plan, historial y comentarios con `visibility=restricted` | Owner del proyecto | **A** | A | M | M | A | Sin acceso implícito para `platform.admin` |
| DA-06 | Datos económicos | Tarifas, costes, presupuestos, gastos | Finanzas | **A** | **A** | M | M | **A** | Acceso exclusivo con `financial.read/write` (§5) |
| DA-07 | Horas | Entradas de tiempo, aprobaciones, reaperturas | Responsable de recursos | M | A | M | M | A | No es fichaje laboral ni vigilancia individual |
| DA-08 | Capacidad y ausencias | Capacidad diaria, minutos ausentes, `reasonCode` cerrado | Responsable de recursos | M | M | M | B | M | **Sin campo libre de motivo médico** (prohibido registrar datos de salud) |
| DA-09 | Comentarios y menciones | Texto libre de colaboración | Autor + owner del proyecto | M | M | B | M | M | Superficie de riesgo de introducción accidental de datos sensibles (§6, `R-08`) |
| DA-10 | Auditoría de seguridad | Eventos append-only de seguridad, acceso, administración, economía y exportaciones | Seguridad | M | **A** | M | A | **A** | Separada del historial funcional (`RF-33`); acceso `audit.read`; sin secretos ni texto libre innecesario |
| DA-11 | Credenciales de integración | Referencia al refresh token de Jira, secreto/URL de Teams, credenciales OAuth de worker | IT | **A** | A | M | A | A | Solo en gestor de secretos corporativo, cifradas y rotables |
| DA-12 | Metadatos de Jira | Clave, estado, resumen (`audienceMode=metadata`) | Propietario de Jira | M | M | B | M | M | Solo con compatibilidad de audiencia declarada (`D-17`) |
| DA-13 | Exportaciones | Ficheros temporales CSV/XLSX/PDF/PNG/JSON | Solicitante | Según contenido | M | B | M | A | TTL máximo 24 h; descarga revalidada |
| DA-14 | Staging de importación | Ficheros subidos y filas validadas antes de commit | Solicitante | M | M | B | B | M | TTL máximo 24 h; sin ejecución de fórmulas ni macros |
| DA-15 | Notificaciones | Bandeja in-app y tarjetas de Teams | Destinatario | M | M | B | B | M | Payload mínimo, sin costes ni texto sensible |
| DA-16 | Sesiones e idempotencia | Hash criptográfico de sesión opaca, claves de idempotencia | IT | **A** | A | M | A | M | Sesión opaca revocable en PostgreSQL (nunca JWT autocontenido) |
| DA-17 | Copias de seguridad | Respaldos cifrados de PostgreSQL y WAL | IT | Máx. de lo que contienen | A | **A** | M | M | Cifradas, credenciales separadas, copia fuera del primario en UE |
| DA-18 | Preferencias de usuario y vista (`RF-34`) | `user_preference` (globales) y `user_view_preference` (por proyecto/vista: columnas, orden, densidad, reset), modelo versionado (`schemaVersion`), sin KV arbitrario | Usuario / IT | M | M | B | M | B | Aislamiento estricto al propio `userId`; ni `platform.admin` accede a preferencias ajenas; esquema tipado cerrado |
| DA-19 | Registros técnicos | Logs estructurados JSON con `correlationId` | IT | M | M | M | B | M | Sanitizados (sin secretos, tokens, cookies ni datos personales innecesarios) |

## 3. Activos de servicio y componentes

| ID | Componente | Función | Frontera |
|---|---|---|---|
| SV-01 | Navegador del usuario | Interfaz y vista previa local (`D-09`) | No confiable |
| SV-02 | Aplicación Next.js (BFF + API `/api/v1`) | Autenticación, sesiones, autorización, validación Zod, orquestación | Zona de aplicación |
| SV-03 | Motor de planificación (servidor) | Cálculo puro y determinista con autoridad (`AP-004`) | Zona de aplicación |
| SV-04 | PostgreSQL | Persistencia, constraints, sesiones, preferencias, auditoría y outbox | Zona de datos (no pública) |
| SV-05 | Worker | Jobs, outbox, revalidación de identidad, exportaciones, integraciones | Zona de aplicación con egress controlado |
| SV-06 | Almacén de objetos privado | Artefactos temporales de exportación e importación (TTL 24 h) | Zona de datos |
| SV-07 | Gestor de secretos corporativo | Claves, credenciales OAuth/Jira/Teams | Externo gestionado por IT |
| SV-08 | Microsoft Entra ID / Graph | Identidad OIDC y revalidación de estado de cuenta | Externo de confianza (tenant corporativo) |
| SV-09 | Teams Workflows / Power Automate | Notificaciones salientes | Externo (Microsoft 365) |
| SV-10 | Jira Cloud | Lectura de incidencias (solo lectura) | Externo (Atlassian) |
| SV-11 | Copias de seguridad | Respaldo cifrado fuera del servidor primario (UE) | Ubicación separada (`P-08`) |
| SV-12 | CI/CD (GitHub Actions) | Build, pruebas, SCA, secret scanning, SBOM, despliegue | Cadena de suministro |

## 4. Política diferenciada de conservación propuesta (`P-06`, `P-35`)

> **Estado: PENDIENTE DE APROBACIÓN DEL DPD (y Finanzas para datos económicos).** Ningún plazo se considera definitivo ni habilita purgas automáticas irreversibles sin aprobación formal.

| Categoría de dato | Activos | Plazo propuesto | Fundamento | Mecanismo previsto |
|---|---|---|---|---|
| Plan y líneas base | `DA-03`, `DA-04`, `DA-05` | Vida del proyecto + **5 años** tras archivado | Trazabilidad contractual, técnica y de cartera | Archivo de solo lectura; purga autorizada y registrada en auditoría |
| Auditoría de seguridad | `DA-10` | **5 años** mínimo (o superior si lo fija política ENS/Seguridad) | Evidencia de seguridad, incidentes y trazabilidad (`op.exp.8`) | Append-only; purga solo con cuenta BD separada y aprobación de Seguridad |
| Historial funcional (`RF-33`) | `DA-03` | Vida del proyecto + **5 años** tras archivado (alineado al plan) | Trazabilidad funcional del proyecto para usuarios con `project.read` | Archivado con el proyecto; campos económicos filtrados por permiso |
| Datos económicos y horas | `DA-06`, `DA-07` | Según normativa fiscal/contable que fije **Finanzas** (pendiente; referencia habitual 6–10 años) | Obligaciones mercantiles/contables fuera del criterio puramente técnico | Bloqueo tras aprobación; reapertura con motivo y auditoría |
| Logs técnicos | `DA-19` | **90 días** en caliente; hasta **1 año** archivado | Diagnóstico operativo y respuesta a incidentes | Rotación automática; sanitizados sin secretos ni texto libre |
| Artefactos temporales (exportación y staging) | `DA-13`, `DA-14` | **24 horas** máximo | Minimización de datos | TTL + tarea de borrado verificada y monitorizada |
| Preferencias de interfaz (`RF-34`) | `DA-18` | Mientras el usuario esté activo; borrado al resetear, al archivar/purgar el proyecto o **≤ 30 días** tras baja definitiva del usuario | Minimización; dato puramente de experiencia de usuario | Eliminación en cascada o job de limpieza tras baja; sin impacto en auditoría |
| Comentarios y menciones | `DA-09` | Vida del proyecto (purga/redacción anticipada ante incidente de datos sensibles) | Contexto operativo frente a minimización | Borrado lógico trazado + procedimiento de sanitización (§6) |
| Sesiones y claves de idempotencia | `DA-16` | Sesión activa máx. **8 h**; registros de sesión revocada **30 días**; claves de idempotencia **24–72 h** | Seguridad de sesión e idempotencia | Limpieza programada en BD |
| Metadatos de Jira | `DA-12` | Mientras exista vínculo y compatibilidad de audiencia (`D-17`) | Minimización y respeto de permisos de origen | Purga inmediata al perder acceso o revocar compatibilidad |
| Copias de seguridad | `DA-17` | Diarias **35 días**; mensuales **12 meses** (WAL según ventana PITR) | Continuidad (`RPO ≤ 4 h`) y recuperación histórica | Cifradas; purga verificada trimestralmente (`AP-058`) |
| Bajas de usuarios | `DA-01`, `DA-18` | Desactivación inmediata de acceso; borrado de `DA-18` en ≤ 30 días; conservación de `(tid, oid)` / identificador mínimo en `DA-10` por integridad de auditoría; **anonimización del perfil visible tras 2 años** (propuesta) | Equilibrio entre trazabilidad ENS y minimización RGPD | Pendiente de dictamen formal del DPD (`P-06`, `P-35`, `R-14`) |

## 5. Protección de datos económicos (`DA-06`)
1. **Separación de permisos:** `financial.read` y `financial.write` son capabilities independientes con alcance; ningún rol de proyecto las recibe por defecto (`D-07`).
2. **Filtrado por campo en servidor:** API, exportación, SSE, historial funcional (`RF-33`), plantillas y notificaciones omiten campos económicos sin permiso. El navegador nunca recibe datos económicos para ocultarlos en cliente.
3. **Aislamiento en instantáneas y plantillas:** líneas base y plantillas no copian costes ni tarifas privadas (`RF-27`).
4. **Integridad:** tipos `DECIMAL` (nunca `float`); tarifa congelada al aprobar horas; reapertura con motivo y auditoría; tarifas versionadas sin solapamiento (*exclusion constraint*).
5. **Auditoría reforzada:** cada escritura económica y cada lectura masiva (exportación con costes) genera evento en `DA-10` con actor, alcance y número de filas.
6. **Exportación:** columnas económicas solo con `financial.read` **y** `project.export`, con neutralización de fórmulas CSV/XLSX (`ST-09`, `ST-10`, `ST-17`).

## 6. Exclusión de datos clínicos y gestión de introducción accidental (`R-08`)
1. **Exclusión de diseño:** no existen entidades ni campos para datos clínicos, pacientes, diagnósticos ni motivos médicos. Las ausencias (`DA-08`) usan exclusivamente un catálogo cerrado (`reasonCode` no sanitario, p. ej. vacaciones, formación, permiso no especificado) sin campo de texto libre.
2. **Prevención en interfaz:** avisos visibles en formularios con texto libre (comentarios, descripciones, importación CSV/XLSX) recordando la prohibición de introducir datos de salud, pacientes o terceros no autorizados, complementados con formación a usuarios antes del piloto.
3. **Sin falsa promesa de DLP automático en v1:** no se promete detección automática infalible de PII/datos clínicos en v1; este riesgo residual se documenta explícitamente (`R-08`) para evaluación del DPD.
4. **Procedimiento auditado de borrado/sanitización ante incidente:** si un usuario introduce accidentalmente datos clínicos o sensibles no permitidos:
   - Se notifica a Seguridad y DPD conforme al procedimiento corporativo de incidentes.
   - Tras autorización registrada de Seguridad/DPD, un procedimiento privilegiado y controlado sustituye el contenido afectado (comentario, nombre o campo libre) por un marcador explícito de redacción (p. ej. `[CONTENIDO RETIRADO POR INCIDENTE DE PRIVACIDAD]`) y purga artefactos temporales (`DA-13`/`DA-14`) asociados, preservando la integridad estructural del plan y la traza en `DA-10` (quién autorizó, cuándo, qué registro se saneó, **sin copiar el contenido retirado en la auditoría**).
   - Se documenta la expiración natural de la copia anterior en los backups (`DA-17`) según la política de retención aprobada por el DPD (`P-06`, `P-35`).
