# Sistema de diseño · RIT Guatemala

Fuente de verdad: `app/globals.css` (tokens) y `components/ui.tsx` (componentes).
Regla: **las pantallas no usan colores sueltos** (`slate-*`, `#hex`); usan los tokens semánticos.

## 1. Auditoría (antes → después)

| Aspecto | Antes | Ahora |
| --- | --- | --- |
| Estructura | Un componente de 375 líneas con 5 pestañas | Armazón con barra lateral y 14 pantallas, cada una con una sola responsabilidad |
| Guía al usuario | Ninguna | Inicio con ruta de 8 pasos, siguiente paso recomendado y avance calculado |
| Contenido | 1 frase estándar por capítulo | 55+ cláusulas adaptadas al giro y al horario; borrador de ~57 artículos |
| Color | Clases `slate-*` repetidas (≈50 usos) | Tokens semánticos; el tema completo cambió desde un solo archivo (`globals.css`) |
| Componentes | Botones y campos escritos a mano en cada pantalla | `Boton`, `Tarjeta`, `Insignia`, `Aviso`, `Progreso`, `Anillo`, `Texto`, `Seleccion`, `AreaTexto`, `Interruptor`, `Pagina`, `Vacio` |
| Responsive | Solo escritorio | Menú deslizable en móvil, hoja adaptable, sin desborde horizontal (probado a 390 px) |

Pendiente: variante clara, pruebas con lector de pantalla reales, contraste verificado por herramienta.

## 2. Tema «Nebulosa» (oscuro, cristal y neón)

Una sola identidad: fondo azul-negro con aurora cian/violeta y rejilla tenue, paneles de **cristal** (translúcidos con desenfoque), acentos con **brillo** y tipografía técnica para datos.

| Grupo | Tokens |
| --- | --- |
| Texto y superficies | `ink` (texto), `muted` (7.4:1 sobre el fondo), `line` (bordes translúcidos), `canvas`, `surface` (cristal), `solid` |
| Acento | `brand-600` cian vivo · `brand-700/800` cian claro para texto y enlaces · `brand-50/100` velos translúcidos · `violeta` |
| Estados | `ok`, `warn`, `danger`, `info`, cada uno con `-bg` y `-line` translúcidos |
| Forma | radio 18 px; `shadow-card`, `shadow-pop`, `brillo` |
| Tipografía | Geist (interfaz) y Geist Mono (etiquetas, cifras e indicadores, en mayúsculas con espaciado). La hoja del reglamento usa Times New Roman 12 pt sobre **papel blanco** para verse como saldrá en Word |

Clases del tema (capa `components`, para que las utilidades de Tailwind puedan sobrescribirlas): `.vidrio`, `.vidrio-fuerte`, `.borde-neon`, `.degradado-texto`, `.degradado-boton`, `.etiqueta-mono`, `.brillo`, `.aparece`, `.pulso`.

Reglas:
- Las pantallas usan tokens, nunca `slate-*` ni `#hex`.
- Todo CSS propio que pueda chocar con utilidades va en una capa (`@layer`); fuera de capas siempre gana al utilitario.
- Contraste: texto normal ≥ 4.5:1. `muted` sobre `canvas` = 7.4:1.
- Solo hay tema oscuro (`color-scheme: dark`). Pendiente: variante clara.

## 3. Componentes

### Boton
| Propiedad | Valores | Predeterminado |
| --- | --- | --- |
| `variante` | `primario` · `secundario` · `fantasma` · `peligro` | `primario` |
| `pequeno` | booleano (altura 32 px; normal 40 px) | `false` |

Estados: reposo, hover, foco visible (anillo de marca), deshabilitado (50 %, sin cursor de acción).
Usar `primario` para **una** acción principal por pantalla; `peligro` solo para acciones destructivas, siempre con confirmación.

### Tarjeta
`titulo`, `descripcion`, `acciones`, `relleno` (false para listas a sangre). Agrupa un tema; no anidar tarjetas.

### Insignia
Tonos: `neutro`, `marca`, `ok`, `warn`, `danger`, `info`. Estado o cantidad corta; nunca frases.

### Aviso
Tonos igual que Insignia. `danger` usa `role="alert"`; los demás `role="status"`. Usar `warn` para obligaciones y riesgos, `danger` solo para errores o límites legales excedidos.

### Progreso
`valor` (0-100) y `etiqueta` obligatoria (nombre accesible). Rol `progressbar` con `aria-valuenow`.

### Campos: Texto, Seleccion, AreaTexto, Interruptor
Etiqueta visible siempre (no usar solo `placeholder`), `ayuda` opcional, `error` opcional. El `id` y `aria-describedby` se generan solos.

### Pagina
Encabezado (`titulo`, `descripcion`, `acciones`) y cuerpo con separación vertical. Ancho máximo `max-w-5xl` por defecto.

### Vacio
Estado sin datos: un título y, opcionalmente, qué hacer.

## 4. Patrones

- **Armazón (`Shell`)**: barra lateral **flotante** de cristal con grupos *Proceso* y *Recursos*; en el editor se reduce a íconos; en móvil es un menú deslizable oculto (`invisible`) mientras está cerrado. Barra superior flotante con el buscador.
- **Buscador de comandos (`Paleta`, Ctrl/⌘+K)**: salta a cualquier pantalla, cláusula o acción. Se monta de nuevo en cada apertura para que no se pierdan las primeras letras.
- **Centro de mando (Inicio)**: anillo de progreso, siguiente misión, cuatro indicadores y la ruta como línea de nodos que se encienden al completarse.
- **Asistente (Diagnóstico)**: formulario en secciones + panel lateral fijo con evaluación en vivo y recomendaciones.
- **Editor con ayuda (Redacción)**: capítulos · hoja · panel (Guía, Revisión, Cláusulas). Los datos pendientes `[COMPLETAR: …]` se resaltan en amarillo.
- **Confirmación en línea** para acciones que reemplazan contenido (regenerar, borrar): aviso + botón peligro + cancelar, sin diálogos del navegador.

## 5. Accesibilidad

- Foco visible global (`:focus-visible`).
- Todo control tiene nombre accesible; los íconos son decorativos (`aria-hidden`).
- Estado transmitido con texto además del color (insignias y «Cumple / falta» para lectores de pantalla).
- `prefers-reduced-motion` desactiva transiciones.
- Navegación principal con `aria-label` y `aria-current="page"`.

## 6. Cómo agregar una pantalla

1. Crear el componente en `components/vistas/` usando `<Pagina>` y los componentes de `ui.tsx`.
2. Crear `app/(app)/<ruta>/page.tsx` con el título (`metadata`).
3. Agregarla a `PROCESO` o `RECURSOS` en `components/Shell.tsx` y su ícono en `components/Iconos.tsx`.
4. Si es un paso del proceso, sumarlo en `lib/progreso.ts` con su regla de avance y probarlo.

## 7. Demostración de un solo archivo

`npm run demo` genera `RIT-demo.html` (≈1.3 MB, fuentes incluidas, sin servidor). Sustituye el enrutador de Next por uno basado en `#` (`demo/shims`) y guarda los datos en el navegador. La misma prueba de punta a punta corre contra ese archivo: `MODO=hash BASE_URL=file:///…/RIT-demo.html node tests/e2e/editor.mjs`.
