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

Pendiente: pruebas con lector de pantalla reales.

## 2. Temas «Porcelana» y «Pizarra»

Misma estructura y mismos tokens en dos paletas, con un interruptor en la cabecera. Se recuerda la elección (`localStorage`, clave `rit:tema`) y un script previo al pintado evita el parpadeo. Por defecto: **Porcelana**.

| | Porcelana (claro, por defecto) | Pizarra (oscuro) |
| --- | --- | --- |
| Carácter | Papel azulado, pasteles suaves (celeste, lavanda, rosa) y tinta azul marino | Azul pizarra apagado con acentos periwinkle y lavanda |
| Fondo | `#f3f5fa` con aurora pastel y rejilla tenue | `#0e131f` con aurora azul-violeta muy suave |
| Texto | `ink` 13:1 · `muted` 5.6:1 | `ink` 15:1 · `muted` 7.7:1 |
| Acento | `brand-700` `#33508f` (texto) · `brand-600` `#5877c0` (íconos) | `brand-700` `#b9c9f3` · `brand-600` `#8aa4e6` |
| Botón principal | Degradado `#4a67b0 → #6a5fb5`, texto blanco (5.4:1) | Degradado `#8aa4e6 → #a99be0`, texto oscuro (7.5:1) |
| Estados | Fondos pastel (`#e4f3ea`, `#fbf0d8`, `#fae7e7`, `#e5eefa`) con texto ≥ 5.2:1 | Fondos translúcidos con texto pastel ≥ 6.5:1 |

| Grupo | Tokens |
| --- | --- |
| Texto y superficies | `ink`, `muted`, `line`, `canvas`, `surface` (cristal), `solid`, `surface-fuerte` |
| Capas de apoyo | `campo` (fondo de inputs), `velo` / `velo-2` (hover y tintes), `hondo` (paneles interiores), `scrim` |
| Acento | `brand-50/100` (velos), `brand-600/700/800/900`, `violeta` |
| Estados | `ok`, `warn`, `danger`, `info` con `-bg` y `-line` |
| Degradados y brillo | `btn-a/b/ink`, `grad-a/b/c`, `txt-a/b/c`, `borde-a/b`, `glow`, `glow-ok`, `aurora-1/2/3`, `rejilla` |
| Forma | radio 18 px; `shadow-card`, `shadow-pop`, `brillo` |
| Tipografía | Geist (interfaz) y Geist Mono (etiquetas y cifras, en mayúsculas con espaciado). La hoja del reglamento usa Times New Roman 12 pt sobre **papel blanco** en ambos temas |

Clases del tema (capa `components`, para que las utilidades de Tailwind puedan sobrescribirlas): `.vidrio`, `.vidrio-fuerte`, `.borde-neon`, `.degradado-texto`, `.degradado-boton`, `.etiqueta-mono`, `.brillo`, `.aparece`, `.pulso`.

Reglas:
- Las pantallas usan tokens, nunca `slate-*`, `#hex` ni `bg-black/…` / `bg-white/…` (no funcionan en ambos temas).
- Todo CSS propio que pueda chocar con utilidades va en una capa (`@layer`); fuera de capas siempre gana al utilitario.
- **El contraste se mide, no se supone**: `tests/contraste.test.ts` lee los tokens de `globals.css` y exige ≥ 4.5:1 en texto, enlaces, botones y estados, y ≥ 3:1 en el acento de íconos, en los dos temas. Si cambia un color y la prueba falla, el color no sirve.
- Pasteles para superficies y tintes; tonos medios para lo que se lee o se pulsa.

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
