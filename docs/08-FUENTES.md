# Referencias y límites

Consultadas el 25/11/2026. Referencias funcionales/técnicas públicas; no sustituyen validación de licencias o tenant real.

- GanttPRO, funciones: https://ganttpro.com/es/ganttpro-features/ — referencia de alcance, no copia de producto.
- SVAR React Gantt, instalación/licencias: https://docs.svar.dev/react/gantt/getting-started/installation/ — MIT open source, PRO comercial; verificar paquete exacto.
- DHTMLX Gantt, documentación: https://docs.dhtmlx.com/gantt/ — Community v10+ MIT, versiones antiguas GPL; wrapper React comercial: https://docs.dhtmlx.com/gantt/integrations/react/overview/ ; repositorio: https://github.com/DHTMLX/gantt .
- Microsoft identity platform, auth code/OIDC/PKCE: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow ; tokens: https://learn.microsoft.com/en-us/entra/identity-platform/security-tokens ; tenant: https://learn.microsoft.com/entra/architecture/authenticate-applications-and-users .
- Teams Workflows: https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook — conectores Office 365 retirados en mayo 2026; Workflows, co-owners, Adaptive Cards y limitaciones. Verificar licencia/trigger en tenant.
- Jira Cloud OAuth 2.0 3LO: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/ ; webhooks: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-webhooks/ — v1 propone polling, no webhook obligatorio. Confirmar edición Cloud y scopes efectivos.

No se han verificado políticas internas, infraestructura, disponibilidad de licencias, datos del tenant ni proyectos Jira: acceso interno no autorizado en revisión anterior. Las cifras de SLO, tamaño, fases, stack, modelo de permisos, convenciones de planificación y alcance detallado de integración son propuestas técnicas, no hechos sobre Asserta ni configuraciones ejecutadas. No se ha implementado o probado código de aplicación; únicamente validación estructural del backlog y documentación. F0 es condición de aprobación.
