# AP-005 · 03 Matriz preliminar de controles ENS (categoría media) y OWASP ASVS 5.0.0

> **ADVERTENCIA — NO ES UNA DECLARACIÓN DE CUMPLIMIENTO NI CERTIFICACIÓN ENS.**
> Esta matriz describe cómo el diseño técnico *contribuye* a las medidas del Anexo II del ENS y delimita qué responsabilidades recaen en la aplicación, de forma compartida o exclusivamente en infraestructura/organización.
>
> - La categorización oficial del sistema, la Declaración de Aplicabilidad (DdA), la definición de medidas compensatorias y la auditoría de conformidad corresponden exclusivamente a **Seguridad** (`P-05`, **PENDIENTE**).
> - **Fuente ENS:** Real Decreto 311/2022, de 3 de mayo, por el que se regula el Esquema Nacional de Seguridad — Anexo II (**BOE-A-2022-7191**, catálogo de 73 medidas, consultado el 26-11-2026). Las denominaciones oficiales, dimensiones principales y aplicabilidad general para categoría MEDIA se han cotejado con el BOE; **la verificación definitiva de cada refuerzo concreto (`R1..R5`) por medida debe cerrarse por Seguridad sobre el PDF oficial del BOE y la guía CCN-STIC 804** (`R-13`).
> - **Fuente ASVS:** OWASP Application Security Verification Standard **5.0.0** (estable, publicado el 30-05-2025, 17 capítulos exactos `V1..V17`).

## 1. Leyenda de responsabilidades
- **D — Aplicación:** control implementado y verificable directamente en el software de Asserta Projects (pruebas automatizadas/manuales `ST-01..23`).
- **P — Compartida / Parcial:** la aplicación aporta mecanismos técnicos o evidencias, pero la medida exige además gobierno, operación, infraestructura o procedimientos de IT/Seguridad/DPD.
- **E — Infraestructura / Organización:** responsabilidad externa al código de la aplicación (IT, Seguridad, DPD, Dirección o proveedor cloud).

## 2. Matriz preliminar ENS — Anexo II (RD 311/2022, categoría objetivo MEDIA)

*Dimensiones: **C** Confidencialidad · **I** Integridad · **D** Disponibilidad · **A** Autenticidad · **T** Trazabilidad · **Todas** (medida transversal).*

| Medida | Denominación oficial (RD 311/2022) | Dim. | Aplicabilidad MEDIA / Refuerzos | Resp. | Contribución del diseño / cobertura externa | Evidencia prevista | Ticket |
|---|---|---|---|---|---|---|---|
| `org.1`–`org.4` | Política de seguridad; Normativa de seguridad; Procedimientos de seguridad; Proceso de autorización | Todas | Aplica (marco organizativo) | **E** | Gobierno corporativo; el proyecto entrega este threat model, matriz de riesgos y borrador de procedimiento break-glass | Políticas aprobadas y autorización formal | — |
| `op.pl.1` | Análisis de riesgos | Todas | Aplica en MEDIA (`+R1` a cotejar en BOE/804) | **P** | Este paquete `AP-005` y registro de riesgos `R-01..14` | Análisis aprobado por Seguridad (`P-05`) | `AP-005`, `AP-051` |
| `op.pl.2` | Arquitectura de seguridad | Todas | Aplica en MEDIA | **P** | Zonas, límites de confianza, DFD y separación de planos (`02`) | Arquitectura aprobada (`AP-006`) | `AP-006` |
| `op.pl.3` | Adquisición de nuevos componentes | Todas | Aplica en MEDIA | **P** | Política de dependencias (versión, licencia, SCA, bloqueo de paquetes no aprobados) | Registro de dependencias y ADR | `AP-007` |
| `op.pl.4` | Dimensionamiento / gestión de la capacidad | D | Aplica en MEDIA | **P** | Dataset de referencia `RNF-03`, límites de entrada y pruebas de carga | Informe de rendimiento `AP-052` | `AP-052` |
| `op.pl.5` | Componentes certificados | Todas | Aplica en MEDIA (cotejar alcance con CCN-STIC 804) | **E** | Selección de infraestructura/servicios certificados por IT (`P-08`) | Declaración de infraestructura | `AP-006`, `AP-053` |
| `op.acc.1` | Identificación | A, T | Aplica en MEDIA | **D** | Identidad única inmutable `(tid, oid)`, sin cuentas compartidas | `ST-02` | `AP-009`, `AP-010` |
| `op.acc.2` | Requisitos de acceso | C, I, A, T | Aplica en MEDIA | **D** | Deny-by-default server-side; grants con alcance y filtrado por fila/campo (`CH-08`) | `ST-01`, `ST-09`, `ST-23` | `AP-011a`, `AP-015b` |
| `op.acc.3` | Segregación de funciones y tareas | C, I, A, T | Aplica en MEDIA | **D** | `platform.admin` sin acceso a contenido ni preferencias ajenas; sin autoasignación; aprobador distinto en break-glass y horas | `ST-04`, `ST-05`, `ST-06`, `ST-08`, `ST-23` | `AP-011b` |
| `op.acc.4` | Proceso de gestión de derechos de acceso | C, I, A, T | Aplica en MEDIA (`+R1` revisión periódica a cotejar) | **P** | Altas, bajas (≤ 15 min objetivo), revocación total de sesiones y revisión periódica de grants/break-glass; proceso definido por Seguridad | Actas de revisión y auditoría `DA-10` | `AP-009`, `AP-010`, `AP-011b` |
| `op.acc.5` | Mecanismo de autenticación (usuarios externos) | C, I, A, T | N/A en v1 (sin usuarios externos, PRD §4) | **E** | Exclusión de usuarios externos e invitados (`P-09`) | Configuración Entra ID | — |
| `op.acc.6` | Mecanismo de autenticación (usuarios de la organización) | C, I, A, T | Aplica en MEDIA; **`R2` (doble factor / MFA)** obligatorio en accesos desde redes no controladas (Internet) y perfiles privilegiados (`R1` solo contraseña restringido a zona controlada) | **P** | SSO Entra ID OIDC + PKCE + sesiones opacas revocables (8 h / 30 min); MFA y acceso condicional gestionados por IT en Entra ID | `ST-02`, `ST-03` + configuración Entra ID | `AP-009` |
| `op.exp.1` | Inventario de activos | Todas | Aplica en MEDIA | **P** | Inventario `DA-01..19` / `SV-01..12` (`01`) + SBOM en CI | Inventario mantenido y SBOM | `AP-005`, `AP-007` |
| `op.exp.2` | Configuración de seguridad | Todas | Aplica en MEDIA | **P** | Configuración como código, cabeceras estrictas, cookies `__Host-`, sin valores inseguros | `ST-19` y revisión de despliegue | `AP-053`, `AP-057` |
| `op.exp.3` | Gestión de la configuración de seguridad | Todas | Aplica en MEDIA (refuerzos a cotejar en BOE/804) | **P** | Versionado en git, revisión humana de cambios de configuración y entornos separados | Historial de PR y CI | `AP-007`, `AP-053` |
| `op.exp.4` | Mantenimiento y actualizaciones de seguridad | Todas | Aplica en MEDIA | **P** | SCA en CI y política de parcheo de dependencias; parcheo de SO/BD por IT | Informes SCA y mantenimiento IT | `AP-007`, `AP-051` |
| `op.exp.5` | Gestión de cambios | Todas | **Obligatoria desde MEDIA** | **D** | Plan Mode, PR con revisión humana independiente, CI obligatoria, migraciones expand-contract | Historial de PR y actas de gate | `AP-007`, `AP-055` |
| `op.exp.6` | Protección frente a código dañino | Todas | Aplica en MEDIA | **P** | Importación sin ejecución de macros/fórmulas y límites de fichero; antimalware de infraestructura definido por IT | `ST-14` | `AP-042` |
| `op.exp.7` | Gestión de incidentes | Todas | Aplica en MEDIA | **P** | Runbooks, alertas operativas, `correlationId` y procedimiento de sanitización `R-08` | Runbook y simulacro | `AP-055` |
| `op.exp.8` | Registro de la actividad | **T** | Aplica en MEDIA con refuerzos de revisión, relojes, retención y protección de registros (cotejar detalle `R1..R5` en BOE/804; absorbe la antigua `op.exp.10` del RD 3/2010) | **D** | Auditoría de seguridad `DA-10` append-only (sin UPDATE/DELETE para la app), separada del historial funcional (`RF-33`), reloj UTC servidor y propuesta de hash encadenado (`P-34`) | `ST-13` | `AP-012` |
| `op.exp.9` | Registro de la gestión de incidentes | Todas | Aplica en MEDIA | **E** | Herramienta corporativa de tickets/incidentes de Seguridad/IT | Registros corporativos | — |
| `op.exp.10` | Protección de claves criptográficas | C, I, A | Aplica en MEDIA (reordenada desde antigua `op.exp.11` en RD 311/2022) | **P** | Secretos solo en gestor corporativo `SV-07`, rotación planificada, secret scanning en CI, prohibidos en repo y logs | `ST-20` + evidencia de gestor de secretos | `AP-007`, `AP-046` |
| `op.ext.1` | Contratación y acuerdos de nivel de servicio | Todas | **Aplica desde MEDIA** | **E** | Contratos y SLA con proveedores (hosting, Microsoft 365/Entra, Atlassian) | Contratos y SLA | — |
| `op.ext.2` | Gestión diaria | Todas | **Aplica desde MEDIA** | **E** | Seguimiento operativo de proveedores por IT | Actas de seguimiento | — |
| `op.ext.3` | Protección de la cadena de suministro | Todas | Exigible en **ALTA** en RD 311/2022 (`n.a.` por defecto en MEDIA salvo análisis de riesgos); **adoptada proactivamente** | **P** | Lockfile, SBOM, SCA, GitHub Actions fijadas por SHA y control de licencias | SBOM e informes SCA | `AP-007` |
| `op.ext.4` | Interconexión de sistemas | Todas | **Aplica en MEDIA (`+R1`)** | **D** | Teams (OAuth tenant-restricted, allowlist SSRF, payload mínimo) y Jira (solo lectura, `D-17`) | `ST-15`, `ST-16` | `AP-046`–`AP-049` |
| `op.nub.1` | Protección de servicios en la nube | Todas | **Aplica en MEDIA (`+R1`)** si se usa cloud | **E** / **P** | Conformidad cloud ENS y residencia en UE gestionadas por IT (`P-08`); la app aporta configuración mínima y segregación | Certificaciones/configuración proveedor | `AP-053` |
| `op.cont.1` | Análisis de impacto | **D** | **Aplica desde Disponibilidad MEDIA** | **P** | Objetivos provisionales RPO ≤ 4 h y RTO ≤ 8 h (`04`, `P-07`/`P-36`) a validar en BIA de IT/Seguridad | BIA aprobado | `AP-005` |
| `op.cont.2`–`op.cont.4` | Plan de continuidad; Pruebas periódicas; Medios alternativos | **D** | Exigibles obligatoriamente en **Disponibilidad ALTA** en RD 311/2022; se diseñan runbook y ensayos trimestrales como buena práctica y soporte a `mp.info.6` | **P** | Runbook de restauración (`04`), copia fuera del primario en UE y pruebas trimestrales | Acta de restauración `AP-058` | `AP-058`, `AP-053` |
| `op.mon.1` | Detección de intrusión | Todas | Aplica en MEDIA (refuerzos a cotejar) | **E** | WAF / IDS / monitorización perimetral de infraestructura | Evidencias de IT/SOC | `AP-053` |
| `op.mon.2` | Sistema de métricas | Todas | Aplica en MEDIA | **P** | Métricas de latencia, errores, colas, autenticación y `preview_mismatch` | Panel `AP-050` | `AP-050` |
| `op.mon.3` | Vigilancia | Todas | Aplica en MEDIA/ALTA (cotejar refuerzos en BOE/804) | **P** | Alertas de fallos de login, 5xx, indisponibilidad Graph, DLQ, fallos de backup y `preview_mismatch` | Alertas probadas | `AP-050` |
| `mp.com.1` | Perímetro seguro | Todas | Aplica en MEDIA | **E** | Segmentación y firewall de infraestructura; BD no expuesta a Internet | Diagrama de red IT | `AP-053` |
| `mp.com.2` | Protección de la confidencialidad | **C** | **Aplica en MEDIA (`+R1` criptografía autorizada CCN)** | **P** | TLS 1.2+, HSTS; tráfico a Entra/Graph/Teams/Jira solo por HTTPS; parámetros TLS gestionados en proxy/infraestructura | Escaneo TLS | `AP-053` |
| `mp.com.3` | Protección de la integridad y de la autenticidad | **I, A** | **Aplica en MEDIA (`+R1`/`+R2` a cotejar)** | **P** | TLS 1.2+, validación criptográfica JWKS/OAuth y rechazo de redirecciones | Escaneo TLS + `ST-02`, `ST-15` | `AP-009`, `AP-046`, `AP-053` |
| `mp.com.4` | Separación de flujos de información en la red | Todas | **Aplica en MEDIA** | **E** | Segmentación VLAN/subredes entre front, aplicación, BD y gestión | Diseño de red IT | `AP-053` |
| `mp.sw.1` | Desarrollo de aplicaciones | Todas | **Aplica en MEDIA** (separación de entornos y desarrollo seguro; refuerzos a cotejar) | **D** | SDLC con Plan Mode, entornos dev/preprod/prod sin datos reales en dev, threat model, ASVS 5.0 L2 y pruebas negativas | Paquete `AP-005` y suite `ST-01..23` | Todos |
| `mp.sw.2` | Aceptación y puesta en servicio | Todas | **Aplica en MEDIA (`+R1` pruebas previas en preprod)** | **P** | Gates F0–F6, UAT y pruebas de seguridad previas al piloto (`AP-057`) | Actas de gate y `AP-057` | `AP-055`, `AP-057` |
| `mp.info.1` | Datos personales | C, I, D, A, T | Aplica siempre que haya datos personales (RGPD/LOPDGDD) | **P** | Minimización, exclusión clínica, ausencia de motivo médico, conservación diferenciada y procedimiento `R-08`; validación formal del DPD | Dictamen DPD (`P-06`, `P-35`) | `AP-005` |
| `mp.info.2` | Calificación de la información | **C** | Aplica en MEDIA | **P** | Inventario y clasificación propuesta `DA-01..19` (`01`) | Aprobación Seguridad (`P-05`) | `AP-005` |
| `mp.info.3`–`mp.info.4` | Firma electrónica; Sellos de tiempo | I, A, T | Según necesidad de firma/sellado (N/A propuesto en v1; a confirmar por Seguridad) | **E** | Fuera de alcance funcional v1 | Confirmación en DdA | — |
| `mp.info.5` | Limpieza de documentos | **C** | Aplica en MEDIA | **D** | Exportaciones sin metadatos ocultos ni secretos; neutralización de fórmulas CSV/XLSX | `ST-17` | `AP-026`, `AP-044` |
| `mp.info.6` | Copias de seguridad | **D, I** | **Aplica en MEDIA (`+R1` pruebas regulares de copia y restauración; `R2` ubicación separada)** | **P** | Backup automático cifrado, credenciales separadas, copia fuera del primario en UE, PITR y ensayos trimestrales (`04`) | `ST-21` y acta `AP-058` | `AP-058` |
| `mp.s.2` | Protección de servicios y aplicaciones web | C, I, D | Aplica en MEDIA | **D** | Controles ASVS 5.0.0 L2 (§3), CSP estricta, cabeceras, CSRF, XSS, SSRF y validación server-side | `ST-01..23`, DAST en staging | `AP-051`, `AP-057` |
| `mp.s.3` | Protección de la navegación web | Todas | Aplica en MEDIA (puestos corporativos) | **E** | Política y proxy corporativo de navegación | Controles IT | — |
| `mp.s.4` | Protección frente a la denegación de servicio | **D** | **Aplica desde MEDIA** | **P** | Rate limit, paginación, límites de importación/grafo en app; mitigación DDoS volumétrica en infraestructura | `ST-18` + protección perimetral IT | `AP-052`, `AP-053` |

> **Nota de completitud del Anexo II:** las medidas físicas, de personal, de puestos/equipos, de soportes y de correo electrónico (`mp.if.*`, `mp.per.*`, `mp.eq.*`, `mp.si.*`, `mp.s.1`) son responsabilidad **E (Infraestructura / Organización)** y deben incluirse en la Declaración de Aplicabilidad global elaborada por Seguridad.

## 3. Correspondencia exacta con OWASP ASVS 5.0.0 (17 capítulos, nivel objetivo propuesto: L2)

*Referencia oficial verificada: OWASP ASVS 5.0.0 (publicada el 30-05-2025).*

| Cap. | Capítulo oficial ASVS 5.0.0 | Resp. | Contribución del diseño y verificación prevista |
|---|---|---|---|
| **V1** | Encoding and Sanitization | **D** | Escape contextual en salida React, comentarios en texto plano o Markdown saneado sin HTML crudo, neutralización de fórmulas CSV/XLSX (`=`, `+`, `-`, `@`) y resúmenes de Jira en texto plano (`ST-17`) |
| **V2** | Validation and Business Logic | **D** | Esquemas Zod estrictos en servidor (rechazo de campos desconocidos, incluido `schemaVersion` cerrado en `RF-34`), validación completa del motor (`AP-004 §8`), control de concurrencia por `revision` e idempotencia (`ST-10`, `ST-22`, `ST-23`) |
| **V3** | Web Frontend Security | **D** | CSP estricta sin `unsafe-inline` en scripts, `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, cookies `__Host-` + `SameSite=Lax` + CSRF, sin secretos ni datos económicos cacheados en `localStorage` (`ST-03`, `ST-19`) |
| **V4** | API and Web Service | **D** | API única `/api/v1` documentada en OpenAPI, códigos HTTP coherentes (`400/401/403/404/409/422/429`), paginación y límites de payload (`ST-01`, `ST-18`, `ST-23`) |
| **V5** | File Handling | **D** | Importación con límites estrictos (10 MB / 10.000 filas), verificación real de contenido (no solo MIME), sin macros ni fórmulas, protección contra ZIP bomb; almacén de objetos privado con TTL 24 h y descarga revalidada (`ST-07`, `ST-14`) |
| **V6** | Authentication | **P** | Delegación en Microsoft Entra ID (single-tenant, `appRoleAssignmentRequired`, MFA y acceso condicional en IT); validación completa de claims y detección de bajas `accountEnabled=false` (`ST-02`) |
| **V7** | Session Management | **D** | Sesiones opacas revocables en PostgreSQL (hash de 256 bits), máximo absoluto 8 h, inactividad 30 min, rotación en login/cambio de privilegios, revocación masiva de todas las sesiones del usuario y cierre `end_session` (`ST-03`, `ST-07`) |
| **V8** | Authorization | **D** | Deny-by-default server-side en API, export, SSE y jobs; grants con alcance (`CH-08`), filtrado económico por campo, aislamiento estricto de `DA-18` al propio `userId` (ni `platform.admin`) y defensas `EP-01..11` (`ST-01`, `ST-04..09`, `ST-11`, `ST-12`, `ST-23`) |
| **V9** | Self-Contained Tokens | **D** | Prohibido usar JWT autocontenidos como sesión web; validación criptográfica completa (JWKS, `iss`, `aud`, `exp`, `nbf`, `tid`, `nonce`) de los ID tokens de Entra ID y verificación de scopes en tokens de Jira (`ST-02`, `ST-16`) |
| **V10** | OAuth and OIDC | **D** / **P** | Authorization Code + PKCE en login Entra ID; Client Credentials / OAuth tenant-restricted para Teams (`P-22`) y Graph (`P-33`); OAuth 3LO solo lectura con rotación atómica de refresh tokens para Jira (`ST-02`, `ST-15`, `ST-16`) |
| **V11** | Cryptography | **P** | CSPRNG de 256 bits y SHA-256 para sesiones; TLS y cifrado en reposo de PostgreSQL/backups con algoritmos y claves gestionados por IT en `SV-07` (`ST-03`, `ST-20`) |
| **V12** | Secure Communication | **P** | HTTPS/TLS 1.2+ y HSTS en todos los flujos (`F1`–`F13`); egress restringido con allowlist, validación DNS/IP anti-SSRF y bloqueo de redirecciones (`ST-15`, `ST-19`) |
| **V13** | Configuration | **P** | Configuración como código, entornos separados sin datos reales en dev, secretos exclusivamente en `SV-07`, secret scanning y verificación de cabeceras en CI/staging (`ST-19`, `ST-20`) |
| **V14** | Data Protection | **P** | Clasificación `DA-01..19`, protección reforzada de datos económicos (`01 §5`), exclusión clínica, conservación diferenciada, sanitización ante incidentes (`01 §6`) y copias cifradas en UE (`ST-09`, `ST-10`, `ST-21`) |
| **V15** | Secure Coding and Architecture | **D** | Motor puro y determinista en servidor (`AP-004`), SQL parametrizado, separación de planos, política de dependencias (lockfile, SCA, SBOM, pin SHA en CI) y revisión independiente (`ST-20`, `ST-22`) |
| **V16** | Security Logging and Error Handling | **D** | Auditoría de seguridad `DA-10` append-only separada del historial funcional (`RF-33`), timestamps UTC de servidor, `correlationId`, logs sanitizados sin secretos ni stack traces expuestos al cliente (`ST-13`, `ST-20`) |
| **V17** | WebRTC | **N/A** | **No aplicable en v1:** Asserta Projects no implementa comunicaciones WebRTC, audio/vídeo en tiempo real ni canales P2P |
