# Sistema de diseño · RIT Guatemala

Fuente de verdad: `app/globals.css` (tokens) y `components/ui.tsx` (componentes).
Regla: **las pantallas no usan colores sueltos** (`slate-*`, `#hex`); usan los tokens semánticos.

## 1. Auditoría (antes → después)

| Aspecto | Antes | Ahora |
| --- | --- | --- |
| Estructura | Un componente de 375 líneas con 5 pestañas | Armazón con barra lateral y 14 pantallas, cada una con una sola responsabilidad |
| Guía al usuario | Ninguna | Inicio con ruta de 8 pasos, siguiente paso recomendado y avance calculado |
| Contenido | 1 frase estándar por capítulo | 55+ cláusulas adaptadas al giro y al horario; borrador de ~57 artículos |
| Color | Clases `slate-*` repetidas (≈50 usos) | Tokens semánticos (marca, ok, advertencia, peligro, info) |
| Componentes | Botones y campos escritos a mano en cada pantalla | `Boton`, `Tarjeta`, `Insignia`, `Aviso`, `Progreso`, `Texto`, `Seleccion`, `AreaTexto`, `Interruptor`, `Pagina`, `Vacio` |
| Responsive | Solo escritorio | Menú deslizable en móvil, hoja adaptable, sin desborde horizontal (probado a 390 px) |

Pendiente: modo oscuro (`color-scheme: light` fijo), pruebas con lector de pantalla reales, contraste verificado por herramienta.

## 2. Tokens

| Grupo | Tokens |
| --- | --- |
| Texto y superficies | `ink`, `muted`, `line`, `canvas`, `surface` |
| Marca | `brand-50`, `100`, `600`, `700` (principal), `800`, `900` |
| Estados | `ok`, `warn`, `danger`, `info`, cada uno con `-bg` y `-line` |
| Forma | radio de tarjeta 10 px; `shadow-card`, `shadow-pop` |
| Tipografía | Geist (interfaz); Times New Roman 12 pt solo en la hoja del reglamento, para que se vea como saldrá en Word |

Uso en Tailwind: `bg-brand-700`, `text-muted`, `border-line`, `bg-warn-bg`.

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

- **Armazón (`Shell`)**: barra lateral con grupos *Proceso* y *Recursos*; en el editor se reduce a íconos; en móvil es un menú deslizable que queda oculto (`invisible`) mientras está cerrado.
- **Ruta guiada (Inicio)**: lista numerada con barra de avance por paso y estado calculado, no marcado a mano.
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
