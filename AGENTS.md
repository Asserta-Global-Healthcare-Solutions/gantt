# AGENTS.md — Asserta Projects

## Misión y autoridad
Implementar la webapp según PRD, requisitos, arquitectura, contrato motor y ADR aprobados. Fuente de verdad: decisiones aprobadas y RF/RNF; si se contradicen, detener ese ticket y elevar pregunta al responsable, no inventar. Las propuestas pendientes no autorizan código de producto; F0 primero. Ningún agente autoriza merge, producción, cambios de alcance, permisos o compras por sí mismo.

## Flujo obligatorio por ticket (Plan Mode)
1. Leer README, AGENTS, RF/RNF y ADR que correspondan al ticket AP-xxx; cargar solo los archivos necesarios. Comprobar git status, rama, dependencias y tests previos. No asumir que commits de otros agentes son tuyos.
2. Entregar plan antes de editar: objetivo, requisitos, archivos previstos, invariantes, riesgos, alternativas, pruebas, fuera de alcance y preguntas. Esperar aprobación humana explícita de ese plan. No ejecutar cambios destructivos ni modificar código durante Plan Mode.
3. Implementar diff mínimo en rama `feat/AP-xxx-slug` o `fix/AP-xxx-slug`; evitar refactor general, cambios de stack, versiones o lockfile ajenos. Si aparece necesidad de ampliar alcance, detener y pedir aprobación. No revertir cambios ajenos ni usar force-push.
4. Ejecutar pruebas focalizadas, lint/typecheck, integración si toca DB, E2E si cambia UX, pruebas negativas si toca autorización. Reportar comandos reales, exit codes, tests pasados/fallidos/no ejecutados. Nunca inventar evidencia o cobertura.
5. Revisar diff contra criterios; auditor independiente verifica seguridad, dominio y regresión. PR humano con descripción, IDs RF/RNF, pruebas, migración/rollback, capturas si UI y riesgos residuales. No merge/deploy sin aprobación.
6. Actualizar docs, ADR si aprobado, trazabilidad y backlog; cerrar ticket solo cuando criterios verificados. Mantener datos y logs sintéticos.

## Reglas no negociables
- Motor scheduling puro y determinista; backend autoridad. No duplicar fórmulas en React ni derivar por conveniencia desde fechas UTC. No usar float para dinero; no inventar tarifas; no perder esfuerzo o historial. Evitar dependencias circulares y fechas incoherentes.
- Autorización server-side en toda consulta, mutación, export, SSE y job. Deny-by-default, scope y permisos de campos; no usar email como identidad ni roles solo UI. Secretos fuera del repo, logs, mensajes y fixtures; no compartir tokens o datos sensibles con modelos. Nunca desactivar validación por arreglar test.
- No introducir datos clínicos, pacientes, motivos médicos, información de terceros o reales sin autorización. No enviar planes a servicios externos no aprobados. No ampliar Graph/Jira scopes sin ADR y consentimiento de IT.
- Cambios de plan, auditoría/outbox en transacción. Conflictos de revisión visibles, import atomic, snapshots inmutables, reintentos idempotentes. No ignorar errores ni fallos de integraciones.
- No añadir paquetes sin comprobar versión/licencia, necesidad y riesgos; no usar características PRO sin licencia. No cambiar dependencias por defecto en cada ticket. No implementar IA, SaaS, portal externo o escritura Jira en v1.
- UI propia, accesible; no copiar assets; mantener comportamiento consistente entre vistas. No declarar ENS cumplido por tener controles.

## Roles de agentes
- PM/enrutador: divide tickets, comprueba precedencias y gates; no modifica código ni aprueba merge.
- Diseñador: UX, estados, accesibilidad, tokens visuales; entrega mocks y revisa capturas.
- Arquitecto/senior: contratos, invariantes y ADR; implementa tareas complejas con plan aprobado.
- Programador: cambios pequeños y tests; no toma decisiones de arquitectura unilateralmente.
- Auditor principal: revisión de dominio, seguridad, permisos y casos límite; no corrige silenciosamente fuera de alcance.
- Auditor secundario: revisión independiente de regresiones, tests y evidencia; sin autoaprobación del autor.
- Investigador: contrasta documentación oficial, licencias y compatibilidad; cita fuentes y fechas, no inventa APIs.

## Comandos objetivo (a crear en AP-007, no existentes aún)
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`, `pnpm db:migrate`, `pnpm test:performance`. Usar comandos reales que defina repo; reportar si todavía no existen. GitHub Actions requiere checks y revisión humana.

## Plantilla de entrega por agente
```
Ticket / RF / RNF:
Plan aprobado:
Archivos y cambio mínimo:
Invariantes verificadas:
Comandos + resultados:
Evidencia (tests, capturas, logs sanitizados):
Limitaciones y riesgos:
Decisiones pendientes / ADR:
Siguiente paso (sin ejecutar fuera de alcance):
```

## Prompt de arranque para agente PM/arquitecto
Lee el kit completo y AGENTS.md. Ejecuta exclusivamente la planificación de F0. Produce una propuesta de subtareas para AP-001 a AP-006, matriz de decisiones, casos dorados del motor, plan de PoC comparativa y criterios de salida. Identifica contradicciones o requisitos que necesiten ratificación. No crees código de producto, no modifiques configuración real de Entra/Teams/Jira y no abras PR sin aprobación. Solicita revisión humana del plan. Tras aprobación de F0, prepara AP-007 en Plan Mode; no avances a F1 de forma automática.
