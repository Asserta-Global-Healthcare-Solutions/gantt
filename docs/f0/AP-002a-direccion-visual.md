# AP-002a · Dirección visual

| Campo | Valor |
|---|---|
| Estado | **En revisión.** Dirección provisional C · Asserta (B + rasgos de A); **pendiente de aprobación visual humana** antes de cerrar AP-002a |
| Prototipo | `poc/ux-ap002a/` (desechable; datos ficticios): `a/`, `b/`, `c/` |
| Galería | [AP-002a-galeria.html](AP-002a-galeria.html): se abre con doble clic y compara A, B y C por vista, tema y ancho |
| Después | AP-002b espera a la aprobación de C |

## 1. Cómo verlo
```sh
cd poc/ux-ap002a && npm run serve      # http://127.0.0.1:4173/ux-ap002a/index.html
npm run check                          # capturas + axe + regresiones (Chrome local)
```

**Parámetros de URL de C** (no se guardan):
- `?theme=light|dark`
- `?densidad=estandar|compacta`
- `?panel=dock|float|closed`
- `?nav=plegada`
- `?vista=completa`
- `?zoom=dia|semana|mes`
- `?task=ID`
- `?estado=vacio|error|sinpermiso|cargando`

## 2. Historia de la decisión
1. **Primera ronda:** A · Instrumento y B · Cuaderno (la comparativa original está en el historial de git, commit `6ddb8b5`).
2. **Revisión del responsable técnico (2026-11-26):** combinación provisional «C · Asserta»: B como base estética y, de A, el modo compacto, las lecturas, los indicadores de holgura, la navegación plegable y el panel flotante cuando falta espacio. Claro por defecto y oscuro con la misma calidad.

## 3. C · Asserta: decisiones de diseño propuestas

| ID | Decisión | Implementación en el prototipo | ¿Amplía el alcance? |
|---|---|---|---|
| DD-C01 | Base estética de B (papel y tinta, Inter Tight + JetBrains Mono, numeración editorial, filetes) | `c.css` importa `b.css` y solo añade | No |
| DD-C02 | Dos densidades: estándar (36 px) y compacta (28 px) | `data-density`; altura de fila y etiquetas de barra dinámicas en `gantt.js` | No |
| DD-C03 | Franja de lecturas: fin previsto, Δ línea base, conflictos, ruta crítica, holgura mínima, revisión | Se adapta al **ancho de la cabecera** (container query): oculta lecturas secundarias por debajo de 1100 px de cabecera | No (datos ya previstos: RF-15, RF-16, D-08) |
| DD-C04 | Holgura en la tabla con medidor y explicación | Columna «Holgura»; tooltip con el motivo (negativa, crítica, margen) | No (RF-15) |
| DD-C05 | Navegación lateral totalmente plegable | Botón en la ruta y atajo `[`; en móvil, cajón superpuesto | No |
| DD-C06 | Panel de detalle acoplado, flotante o cerrado | Si acoplado dejaría **< 480 px de cronograma** (medido con ResizeObserver sobre el espacio real, no por breakpoint), se muestra flotante y lo explica. En flotante solo aparece con una tarea seleccionada. Ancho redimensionable (ratón y teclado) | No |
| DD-C07 | Tabla de tareas redimensionable | Separador accesible en la cabecera (arrastre o ← →), entre 140 y 420 px para la columna Tarea | No |
| DD-C08 | Planificación a pantalla completa | Oculta navegación, titular y fechas; mantiene lecturas y herramientas; usa la Fullscreen API si el navegador lo permite (atajo F) | No |
| DD-C09 | **Preferencias persistentes por usuario**: densidad, tema, zoom, distribución (navegación, panel, ancho de la tabla) | En el prototipo, `localStorage` (por navegador) | **Posible ampliación** (§4, P-29) |
| DD-C10 | Separación cromática: identidad ≠ estado ≠ error/conflicto ≠ advertencia ≠ ruta crítica | Tokens: identidad provisional verde petróleo `--brand`; crítica bermellón; conflicto y error carmín `--signal`; advertencia ocre `--warn`; estados con su propia marca en la tabla (`--st-*`). Nunca solo color: icono, trazo discontinuo, texto | No |
| DD-C11 | Tooltips en los indicadores técnicos | `shared/tooltip.js`: `role="tooltip"`, `aria-describedby`, ratón **y** teclado, Esc | No (RNF-07) |
| DD-C12 | Foco visible y teclado completo | Foco con el color de identidad; atajos 1/2/3, C, B, T, D, P, F, [, ?, Alt+←/→, Esc; leyenda y atajos en una ventana de ayuda | No (RNF-07) |
| DD-C13 | Pantallas pequeñas sin comprimir el escritorio | Por debajo de 760 px: lista de lectura por fases y ficha de tarea a pantalla completa; sin cronograma | No (PRD §5: lectura y formularios en móvil). Los formularios de edición son de AP-002b |
| DD-C14 | Identidad provisional sustituible | Solo `--brand` y la marca de texto «Asserta»; cambiar la marca = cambiar tokens (P-25) | No |

## 4. Elementos que podrían ampliar el alcance aprobado
| Elemento | Por qué | Opciones | Decisión |
|---|---|---|---|
| DD-C09 Preferencias **por usuario** (entre dispositivos) | Exige guardar preferencias en el servidor: tabla `user_preference`, endpoint `GET/PUT /me/preferences`, validación y migración. No hay RF ni ticket para ello | (a) Solo en el navegador (`localStorage`): sin cambio de alcance, pero no viaja entre dispositivos. (b) En servidor: nuevo RF-34 (P1) y una subtarea en AP-015, impacto pequeño | **P-29** (recomendación: b) |
| Fullscreen API | La API del navegador no es una ampliación funcional; el modo de la aplicación funciona sin ella | — | Sin cambio |
| Leyenda de colores | Componente de ayuda | — | Sin cambio |

No se ha detectado ninguna otra ampliación: el resto son decisiones de presentación sobre datos y funciones ya aprobados.

## 5. Capturas
Todas están en la [galería](AP-002a-galeria.html) (`assets/ap-002a/galeria/`, JPEG). Contenido de C:

| Pedido | Capturas |
|---|---|
| Inicio claro y oscuro | `c-inicio-{light,dark}-{1280,1440,1920}.jpg` |
| Gantt claro y oscuro | `c-gantt-{light,dark}-{1280,1440,1920}.jpg` |
| Gantt compacto | `c-gantt-compacta-1440.jpg`, `c-gantt-compacta-dark-1920.jpg` |
| Panel de detalle abierto | `c-gantt-panel-acoplado-1920.jpg`, `c-gantt-panel-auto-flotante-1280.jpg`, `c-gantt-historial-1440.jpg` |
| Pantalla completa | `c-gantt-pantalla-completa-1440.jpg` (compacta), `c-gantt-pantalla-completa-dark-1920.jpg` |
| Ruta crítica y línea base | `c-gantt-critica-linea-base-1440.jpg` (semana, panel cerrado) |
| Conflicto | `c-gantt-conflicto-1440.jpg`, `c-gantt-conflicto-dark-1440.jpg`, `c-gantt-impacto-1440.jpg` |
| Extra | Leyenda y atajos; móvil (lista, ficha, inicio); estados vacío, error y sin permiso |

A y B se han vuelto a capturar con el mismo script y la misma resolución, para comparar.

## 6. Comprobaciones
Ver el §8 para la ejecución final. Lo que **no** se ha comprobado se registra como pendiente:
- Safari y Firefox (P-30);
- lectores de pantalla reales: NVDA en Windows, VoiceOver en macOS (P-31);
- prueba con usuarios;
- rendimiento con 1.000 tareas (AP-003).

**Cero violaciones de axe no equivale a una validación completa de accesibilidad.** axe cubre una parte de los criterios WCAG; quedan pendientes la navegación con lector de pantalla, la comprensión de los anuncios, el zoom al 200–400 % y la reducción de movimiento.

## 7. Regresiones encontradas y corregidas durante C
| # | Problema | Corrección |
|---|---|---|
| U-09 | `data-status` (nuevo en las filas, para los colores de estado) colisionaba con el selector genérico `[data-status]` de los filtros de A: hacer clic en una fila activaba el filtro y perdía el foco | Selectores de A limitados a `button[...]` (B y C ya lo estaban) |
| U-10 | Con la navegación oculta (`display: none`), `main` caía en la columna de 0 px y medía 597 px | `main { grid-column: -2 / -1 }` |
| U-11 | El panel flotante tapaba el cronograma sin tarea seleccionada | En flotante solo se muestra con selección |
| U-12 | El cuerpo del panel, con scroll, no era accesible por teclado (axe grave) | `tabindex="0"` y `role="region"` con nombre (A, B, C) |
| U-13 | Al quitar `title` del medidor de holgura, A y B habrían perdido su tooltip | El tooltip accesible se carga en las tres direcciones |
| U-14 | Rechazos de conexión intermitentes del servidor de pruebas (cola de 5 de `python -m http.server`) | Servidor estático en Node con `backlog` de 512 dentro de `check.mjs` |
| U-15 | La cabecera y la barra de herramientas ocupaban unos 315 px a 1440 px (el Gantt no mandaba) | Pestañas en la ruta, «Hoy» como icono, controles de densidad y panel con icono, lecturas adaptadas al contenedor: unos 215 px |

## 8. Resultado de la ejecución final
`node tools/check.mjs --dirs a,b,c --widths 1280,1440,1920 --format jpeg` (2026-11-26, Chrome local sin interfaz, axe-core 4.14.0 con WCAG 2.0/2.1/2.2 A y AA). Salida completa en `poc/ux-ap002a/shots-final.log`.

| Comprobación | Resultado |
|---|---|
| Cargas auditadas (A, B, C × Inicio y Gantt × claro y oscuro × 1280/1440/1920, más conflicto, historial, impacto, estados, móvil y vistas propias de C) | **68**: 0 errores de JS o consola; **0 violaciones de axe de cualquier gravedad** |
| Regresiones funcionales comunes (9 por dirección): arrastre → vista previa → confirmar (revisión 42), cancelar sin persistir, redimensionar, Alt+→, conflicto nuevo que exige reconocimiento, filtro por persona, ruta crítica y línea base, 19 dependencias con 1 conflicto, historial | **27/27 superadas** (A, B y C) |
| Comportamiento propio de C: flotante automático a 1280 px, acoplado a 1920 px, reacoplado al ganar espacio, densidad 36/28 px, preferencias tras recargar, tabla +64 px por teclado, pantalla completa, tooltip por teclado, móvil 390 px (lista y ficha) | **9/9 superadas** |
| Resultado | `OK: sin errores JS, sin violaciones axe serias/críticas y sin regresiones`, exit 0 |

En ejecuciones anteriores a esta, las pruebas detectaron fallos reales, ya corregidos (§7, U-09 a U-15).

## 9. Decisión pedida
- [ ] Aprobar C · Asserta tal como está
- [ ] Aprobar C con cambios (indicar cuáles)
- [ ] Decidir P-29 (preferencias en el servidor o en el navegador)

## 10. Dependencias del prototipo
Sin cambios respecto a la primera ronda: 7 paquetes con versión exacta (OFL-1.1, ISC, Apache-2.0, MPL-2.0), instalados con `--ignore-scripts`, sin dependencias transitivas y sin CDN.
