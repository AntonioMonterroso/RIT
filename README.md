# RIT Guatemala

Sistema web para redactar, auditar y presentar el **Reglamento Interior de Trabajo (RIT)** de una
empresa guatemalteca. Un despacho organizador administra la biblioteca legal y los recordatorios
sin acceso al contenido de ninguna empresa.

## Qué hace

Guía a la empresa de punta a punta, en este orden (`/inicio` muestra el avance de cada paso):

1. **Diagnóstico**: giro, horario, turnos, teletrabajo, custodia de bienes… Clasifica la jornada (diurna, mixta, nocturna) y avisa si el horario excede el límite legal.
2. **Redacción**: genera un borrador de ~57 artículos adaptado al diagnóstico, en un editor tipo Word con guía legal por capítulo, revisión automática y biblioteca de 55+ cláusulas.
3. **Puestos**: anexo con responsabilidades y bienes en custodia, con sugerencias por giro.
4. **Auditoría IGT**: 16 criterios; los de contenido se verifican leyendo el texto.
5. **Memorial** a la IGT, **trámite** (presentado, previo, aprobado) y **publicidad y vigencia** (15 días).
6. **Formatos**: constancia de recibo, acta de divulgación, comunicado al personal y solicitud de reformas.
7. **Calendario** con plazos, recordatorios propios y avisos generales; **biblioteca legal**.
8. **Ajustes**: datos de la empresa y respaldo/restauración.

Todo se exporta a `.docx` real. Sistema de diseño: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Estado

| Pieza | Estado |
| --- | --- |
| Diagnóstico, generador de borrador, editor, puestos, auditoría, memorial, trámite, publicidad, formatos, calendario, biblioteca, ajustes | Hecho y probado de punta a punta en modo local (`tests/e2e`) |
| Panel del organizador (leyes y recordatorios generales) | Hecho, modo local |
| Esquema de base de datos con RLS, una sola migración | Probado en Postgres 16 local (`npm run test:db`); **no** en un proyecto Supabase real |
| Cuentas y guardado en Supabase | Escrito; probado con dobles y Postgres local, **no** contra Supabase real |
| Cobro con Stripe, correos de aviso | Pendiente |
| Revisión legal de los textos | **Pendiente (imprescindible antes de vender)** |

Sin variables de entorno el borrador se guarda en el navegador. Para activar cuentas:

1. Cree un proyecto en Supabase y ejecute la única migración, `supabase/migrations/0001_rit.sql`.
2. Copie `.env.example` a `.env.local` con la URL y la clave anónima.
3. El primer organizador se crea a mano (las cuentas nuevas son siempre de empresa):
   `insert into perfiles (user_id, rol) values ('<uuid del usuario>', 'organizador');`

Las empresas nuevas arrancan en estado `prueba` (pueden escribir); `morosa`, `cancelada` e `inactiva` solo leen.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # pruebas unitarias (fechas, auditoría, docx)
npm run build && npx next start -p 3100
node tests/e2e/editor.mjs   # prueba de punta a punta (requiere Chromium; ver CHROMIUM/BASE_URL)
PGHOST=... PGPORT=... PGUSER=postgres tests/db/run.sh   # pruebas de aislamiento por empresa
```

## Aviso legal

Los textos de `content/` provienen del kit EGE y de cláusulas redactadas a partir de los artículos que cita, y **deben ser revisados por un abogado**
antes de ofrecer el sistema comercialmente. El sistema entrega plantillas y cálculos; no es asesoría legal.
