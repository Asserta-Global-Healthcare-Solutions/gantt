# AP-005 · 03 Matriz preliminar de controles ENS (categoría media) y ASVS

> **No es una declaración de cumplimiento.** La matriz recoge cómo el diseño *contribuye* a cada medida y qué queda fuera de la aplicación (organización, infraestructura, IT).
>
> - La categorización real, la Declaración de Aplicabilidad y la evaluación corresponden a Seguridad (P-05).
> - **Fuente:** RD 311/2022, Anexo II (BOE-A-2022-7191, texto consolidado, consultado el 26-11-2026). Los códigos coinciden con el índice del Anexo II. Los títulos y la aplicabilidad exacta a categoría MEDIA **se han verificado solo en parte** (constan org.1–4, op.pl.1–3 y op.pl.5) y deben cotejarse con el PDF oficial antes de aprobar.
> - **ASVS:** OWASP ASVS 5.0.0 (estable, publicado el 30-05-2025).

**Columna «Aportación de la aplicación»:**
- **D** = diseñado en la app (se verificará con pruebas);
- **P** = parcial (la app aporta evidencias o mecanismos, pero la medida es organizativa o de infraestructura);
- **E** = externa (IT, Seguridad u organización).

| Medida | Título | Aport. | Cómo contribuye el diseño / quién la cubre | Evidencia prevista | Ticket |
|---|---|---|---|---|---|
| org.1–org.4 | Política, normativa, procedimientos, proceso de autorización | E | Política corporativa; la app aporta este threat model y el procedimiento break-glass | Políticas aprobadas | — |
| op.pl.1 | Análisis de riesgos | P | Este documento y el registro de riesgos (05) | Análisis aprobado por Seguridad | AP-005, AP-051 |
| op.pl.2 | Arquitectura de seguridad | P | Zonas, límites de confianza, flujos (02) | Diagrama aprobado | AP-006 |
| op.pl.3 | Adquisición de nuevos componentes | P | Política de dependencias (versión, licencia, antigüedad ≥ 2 semanas, SCA) | Registro de dependencias y ADR | AP-007 |
| op.pl.4 | Dimensionamiento / gestión de la capacidad | P | Dataset RNF-03, pruebas de carga | Informe AP-052 | AP-052 |
| op.pl.5 | Componentes certificados | E | Según la infraestructura elegida (P-08) | — | AP-006 |
| op.acc.1 | Identificación | D | Identidad `(tid, oid)` única, sin cuentas compartidas | Pruebas ST-02 | AP-009, AP-010 |
| op.acc.2 | Requisitos de acceso | D | Deny-by-default; grants con alcance (CH-08) | Matriz de pruebas | AP-011a |
| op.acc.3 | Segregación de funciones y tareas | D | `platform.admin` ≠ contenido; sin autoasignación; aprobador distinto para break-glass y horas | ST-04, ST-05, ST-08 | AP-011b |
| op.acc.4 | Proceso de gestión de derechos de acceso | P | Altas y bajas auditadas, revisión periódica de grants y break-glass; el proceso lo define Seguridad | Informe de revisión | AP-010, AP-011b |
| op.acc.5 | Autenticación (usuarios externos) | E | No hay usuarios externos en v1 (PRD §4) | — | — |
| op.acc.6 | Autenticación (usuarios de la organización) | P | SSO Entra OIDC + PKCE; MFA y acceso condicional los gestiona IT | ST-02, ST-03; configuración de Entra | AP-009 |
| op.exp.1 | Inventario de activos | P | Inventario de 01 + SBOM | Inventario mantenido | AP-005, AP-007 |
| op.exp.2/3 | Configuración de seguridad y su gestión | P | Configuración como código, cabeceras de seguridad, sin valores por defecto inseguros | Revisión de configuración | AP-053 |
| op.exp.4 | Mantenimiento y actualizaciones | P | SCA en CI; política de parches de dependencias | Informes de SCA | AP-007, AP-051 |
| op.exp.5 | Gestión de cambios | D | PR con revisión humana, CI, migraciones expand-contract, revisión del plan auditada | Historial de PR y CI | AP-007, AP-055 |
| op.exp.6 | Protección frente a código dañino | P | Importación sin macros ni ejecución de fórmulas; el escaneo de ficheros, si procede, lo define IT | ST-14 | AP-042 |
| op.exp.7 | Gestión de incidentes | P | Runbooks, alertas, `correlationId` | Runbook y simulacro | AP-055 |
| op.exp.8 | Registro de la actividad | D | Auditoría append-only (02 §7) | ST-13 | AP-012 |
| op.exp.9 | Registro de la gestión de incidentes | E | Herramienta corporativa de incidentes | — | — |
| op.exp.10 | Protección de claves criptográficas | P | Gestor de secretos; rotación; nada en el repositorio ni en los logs (secret scanning) | Escaneo en CI | AP-007, AP-046 |
| op.ext.1/2 | Contratación, SLA, gestión diaria | E | Contratos con proveedores (hosting, Microsoft, Atlassian) | — | — |
| op.ext.3 | Protección de la cadena de suministro | P | Lockfile, SBOM, SCA, acciones fijadas por SHA, licencias aprobadas | SBOM e informes | AP-007 |
| op.ext.4 | Interconexión de sistemas | D | Teams y Jira con allowlist, scopes mínimos, datos mínimos (02 §6) | ST-15, ST-16 | AP-046–049 |
| op.nub.1 | Protección de servicios en la nube | E/P | Si el hosting es nube (P-08): configuración y residencia en la UE | — | AP-053 |
| op.cont.1–4 | Continuidad | P | RPO y RTO propuestos, restauración ensayada (04) | Acta de restauración | AP-058, AP-053 |
| op.mon.1 | Detección de intrusión | E | IDS/WAF de infraestructura | — | — |
| op.mon.2 | Sistema de métricas | P | Métricas de latencia, error, cola y autenticación | Panel AP-050 | AP-050 |
| op.mon.3 | Vigilancia | P | Alertas de fallos de login, 5xx, DLQ, backups, `preview_mismatch` | Alertas probadas | AP-050 |
| mp.com.1 | Perímetro seguro | E | Red de infraestructura; BD no pública | — | AP-053 |
| mp.com.2/3 | Confidencialidad, integridad y autenticidad en las comunicaciones | D/P | TLS 1.2+, HSTS; webhooks y OAuth solo por HTTPS | Escaneo TLS | AP-053 |
| mp.com.4 | Separación de flujos en la red | E | Segmentación de infraestructura | — | — |
| mp.sw.1 | Desarrollo de aplicaciones | D | SDLC: Plan Mode, revisión, pruebas negativas, threat model, ASVS | Este paquete y la suite ST | Todos |
| mp.sw.2 | Aceptación y puesta en servicio | P | Gates F0–F6, UAT, pruebas de seguridad previas al piloto (AP-057) | Actas de gate | AP-057, AP-055 |
| mp.info.1 | Datos personales | P | Minimización, sin datos de salud, sin motivo de ausencia; el tratamiento lo valida el DPD | Revisión del DPD (P-06) | AP-005 |
| mp.info.2 | Calificación de la información | P | Clasificación propuesta (01) | Aprobación de Seguridad | AP-005 |
| mp.info.3/4 | Firma electrónica, sellos de tiempo | E | No aplica a la v1 (a confirmar) | — | — |
| mp.info.5 | Limpieza de documentos | D | Exportaciones sin metadatos ni secretos; neutralización de fórmulas | ST-17 | AP-026, AP-044 |
| mp.info.6 | Copias de seguridad | P | Backup cifrado y restauración probada (04) | Acta de restauración | AP-058 |
| mp.s.2 | Protección de servicios y aplicaciones web | D | ASVS 5.0 (abajo), CSP, cabeceras, protección CSRF y XSS | ST-01..17, DAST en staging | AP-051, AP-057 |
| mp.s.3 | Protección de la navegación web | E | Política corporativa de navegación | — | — |
| mp.s.4 | Protección frente a denegación de servicio | P | Rate limit, límites de tamaño, paginación; protección DDoS en infraestructura | ST-18 | AP-053 |

## Correspondencia con OWASP ASVS 5.0 (nivel objetivo propuesto: L2)
| Capítulo ASVS 5.0 (orientativo) | Contribución del diseño |
|---|---|
| Codificación y saneamiento | Escape en la salida, comentarios en texto plano o Markdown saneado, neutralización CSV/XLSX |
| Validación y lógica de negocio | Zod en el servidor, validación del motor (AP-004 §8), revisión e idempotencia |
| Seguridad web en el frontend | CSP, cabeceras, cookies `__Host-`, SameSite, sin datos sensibles en el almacenamiento local |
| Seguridad de API y servicios web | `/api/v1` único, OpenAPI, 401/403/404/409/422/429 coherentes |
| Gestión de ficheros | Límites, parser seguro, sin ejecución, almacén privado, TTL |
| Autenticación, sesiones, OAuth/OIDC | §4 y §5 de [02](AP-005-02-modelo-amenazas.md) |
| Autorización | Deny-by-default, alcance, fila y campo, EP-01..10 |
| Tokens autocontenidos | No se usan como sesión; validación completa del ID token |
| Comunicaciones seguras y configuración | TLS, secretos, configuración como código |
| Protección de datos | Clasificación, económicos (01 §5), minimización |
| Registro y gestión de errores | Auditoría y logs sanitizados con `correlationId` |

*Los nombres de capítulo se cotejarán con el índice de ASVS 5.0.0 al redactar AP-051; aquí solo se indica el área.*
