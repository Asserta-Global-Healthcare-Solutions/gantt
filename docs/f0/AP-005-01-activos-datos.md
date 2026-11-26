# AP-005 · 01 Inventario de activos, clasificación y conservación

Estado: **propuesta técnica para revisión.** La clasificación, la conservación y la categorización ENS las aprueban Seguridad y DPD (P-05, P-06). Nada de este documento declara cumplimiento del ENS.

## 1. Criterios
- **Dimensiones ENS:** Confidencialidad (C), Integridad (I), Disponibilidad (D), Autenticidad (A) y Trazabilidad (T). Niveles propuestos: B (bajo), M (medio), A (alto).
- **Categoría de diseño:** MEDIA. Es el objetivo dado por el solicitante; la categorización real la hace Seguridad (P-05).
- **Exclusiones (PRD §4):** no hay datos clínicos ni de pacientes ni documentación sanitaria. Todo lo que pueda contenerlos se trata como **entrada no permitida** (ver R-08).

## 2. Activos de información

| ID | Activo | Contenido | Propietario propuesto | C | I | D | A | T | Notas |
|---|---|---|---|---|---|---|---|---|---|
| DA-01 | Identidades y perfiles | `tid`, `oid`, nombre, UPN, estado local, equipo | IT | M | M | M | M | M | UPN y email son atributos, no identidad |
| DA-02 | Permisos | Grants, membresías, solicitudes break-glass | Seguridad + owners | M | **A** | M | M | **A** | Su alteración es escalada de privilegios |
| DA-03 | Plan de proyecto | Tareas, WBS, fechas, dependencias, calendarios, revisiones | Jefe de proyecto | M | **A** | M | M | M | La integridad es crítica: es la fuente de verdad |
| DA-04 | Líneas base | Instantáneas inmutables | Jefe de proyecto | M | **A** | B | M | M | Inmutables y sin costes privados |
| DA-05 | Proyectos restringidos | Plan y comentarios con `visibility=restricted` | Owner del proyecto | **A** | A | M | M | A | Sin acceso implícito para administradores |
| DA-06 | Datos económicos | Tarifas, costes, presupuestos, gastos | Finanzas | **A** | **A** | M | M | **A** | Acceso solo con `financial.read/write` (§5) |
| DA-07 | Horas | Entradas, aprobaciones, reaperturas | Responsable de recursos | M | A | M | M | A | No es fichaje laboral; no se usan para vigilancia individual |
| DA-08 | Capacidad y ausencias | Capacidad diaria, minutos ausentes, `reasonCode` mínimo | Responsable de recursos | M | M | M | B | M | **Nunca el motivo de una ausencia** (podría ser un dato de salud) |
| DA-09 | Comentarios y menciones | Texto libre | Autor + owner del proyecto | M | M | B | M | M | Riesgo de que se introduzcan datos sensibles (R-08) |
| DA-10 | Auditoría | Eventos append-only con diff sanitizado | Seguridad | M | **A** | M | A | **A** | Sin tokens, cookies ni cuerpo de comentarios |
| DA-11 | Credenciales de integración | Referencia al refresh token de Jira, URL del flujo de Teams | IT | **A** | A | M | A | A | Solo en el gestor de secretos, cifradas |
| DA-12 | Metadatos de Jira | Clave, estado, resumen (`audienceMode=metadata`) | Propietario de Jira | M | M | B | M | M | Solo con audiencia compatible (D-17) |
| DA-13 | Exportaciones | CSV/XLSX/PDF/PNG/JSON temporales | Solicitante | Según contenido | M | B | M | A | TTL de 24 h, descarga revalidada |
| DA-14 | Staging de importación | Ficheros y filas validadas | Solicitante | M | M | B | B | M | Expira; no se ejecutan fórmulas |
| DA-15 | Notificaciones | Bandeja in-app y mensajes de Teams | Destinatario | M | M | B | B | M | Contenido mínimo y sin costes |
| DA-16 | Sesiones e idempotencia | Hash de sesión, claves de idempotencia | IT | **A** | A | M | A | M | ID de sesión opaco guardado como hash |
| DA-17 | Copias de seguridad | Base de datos y configuración | IT | Máx. de lo que contienen | A | **A** | M | M | Cifradas; restauración ensayada |
| DA-18 | Registros técnicos | Logs JSON con `correlationId` | IT | M | M | M | B | M | Sanitizados (sin secretos ni texto libre) |

## 3. Activos de servicio y componentes

| ID | Componente | Función | Frontera |
|---|---|---|---|
| SV-01 | Navegador del usuario | Interfaz y vista previa local (D-09) | No confiable |
| SV-02 | Aplicación Next.js (BFF + API `/api/v1`) | Autenticación, autorización, validación, orquestación | Zona de aplicación |
| SV-03 | Motor de planificación (servidor) | Cálculo con autoridad (AP-004) | Zona de aplicación (código puro) |
| SV-04 | PostgreSQL | Persistencia, constraints, auditoría y outbox | Zona de datos (no pública) |
| SV-05 | Worker | Jobs, outbox, exportaciones, integraciones | Zona de aplicación con salida controlada |
| SV-06 | Almacén de objetos privado | Artefactos de exportación e importación | Zona de datos |
| SV-07 | Gestor de secretos corporativo | Claves, credenciales de integración | Externo gestionado por IT |
| SV-08 | Microsoft Entra ID | Identidad (OIDC) | Externo de confianza (tenant corporativo) |
| SV-09 | Teams Workflows | Notificaciones salientes | Externo (Microsoft 365) |
| SV-10 | Jira Cloud | Lectura de incidencias | Externo (Atlassian) |
| SV-11 | Copias de seguridad | Respaldo cifrado | Ubicación separada (P-08) |
| SV-12 | CI/CD (GitHub Actions) | Build, pruebas, SCA, SBOM, despliegue | Cadena de suministro |

## 4. Política de conservación propuesta (P-06)
| Dato | Propuesta | Motivo | Mecanismo |
|---|---|---|---|
| Plan, líneas base, historial de proyecto | Vida del proyecto + 5 años tras archivarlo | Referencia contractual y técnica (propuesta, a validar) | Archivo de solo lectura; purga autorizada y trazada |
| Auditoría (DA-10) | 5 años como mínimo | Trazabilidad y evidencias | Append-only; purga solo con una cuenta de BD separada y aprobación de Seguridad |
| Horas y costes | Según política de Finanzas (pendiente) | Obligaciones contables, fuera del alcance técnico | Bloqueo tras aprobación; reapertura auditada |
| Comentarios | Vida del proyecto | Contexto del plan | Borrado lógico con autor y fecha; contenido purgable |
| Exportaciones y staging | 24 h | Minimización | TTL y borrado programado y verificado |
| Logs técnicos | 90 días en caliente; 1 año archivado | Diagnóstico y respuesta a incidentes | Rotación; sin datos personales innecesarios |
| Sesiones | 8 h como máximo; registros revocados 30 días | Seguridad de sesión | Limpieza programada |
| Copias de seguridad | Diarias 35 días, mensuales 12 meses | RPO y restauración histórica | Cifradas y probadas cada trimestre |
| Metadatos de Jira | Mientras dure la vinculación y la audiencia sea compatible | Minimización (D-17) | Purga inmediata si se pierde el acceso |
| Usuarios dados de baja | Se conserva la identidad mínima para la auditoría y se anonimiza el perfil visible tras 2 años | Trazabilidad frente a minimización | Pendiente de DPD |

## 5. Protección de datos económicos (DA-06)
1. **Separación de permisos.** `financial.read` y `financial.write` son capabilities distintas, con alcance. Ningún rol de proyecto las incluye por defecto; Dirección y Finanzas las reciben por concesión explícita (D-07).
2. **Filtrado por campo en el servidor.** API, exportación, SSE, historial (RF-33), plantillas y notificaciones omiten los campos económicos sin permiso. La interfaz no recibe esos datos para luego ocultarlos.
3. **Aislamiento en instantáneas.** Las líneas base y las plantillas no copian costes privados (04 §5, RF-27).
4. **Integridad.** Valores `DECIMAL` y nunca `float`; tarifa congelada al aprobar; reapertura con motivo y auditoría; tarifas versionadas sin solapamiento (exclusion constraint).
5. **Auditoría reforzada.** Cada lectura masiva (exportación con costes) y cada escritura económica genera un evento con actor, alcance y número de filas.
6. **Exportación.** Las columnas económicas solo salen con `financial.read` **y** `project.export`; las fórmulas se neutralizan.
7. **Pruebas.** ST-09 y ST-10 (documento 05).
