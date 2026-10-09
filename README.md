# RIT Guatemala

Sistema web para redactar, auditar y presentar el **Reglamento Interior de Trabajo (RIT)** de una
empresa guatemalteca. Un despacho organizador administra la biblioteca legal y los recordatorios
sin acceso al contenido de ninguna empresa.

## Estado

| Pieza | Estado |
| --- | --- |
| Constructor tipo Word (hoja carta, cinta de formato, tablas, saltos de página) | Hecho (`/editor`) |
| Exportación a `.docx` real | Hecho |
| Auditoría IGT (16 criterios, puntaje y semáforo) | Hecho |
| Fechas legales (feriados de Guatemala, 15 días de publicidad) | Hecho, con pruebas |
| Memorial (.docx) y publicidad/vigencia (Art. 59) | Hecho |
| Esquema de base de datos con RLS | Hecho y probado en Postgres 16 local (`npm run test:db`); falta probarlo en un proyecto Supabase real |
| Biblioteca legal, calendario con recordatorios propios y panel del organizador | Hecho y probado en modo local (navegador) |
| Cuentas y guardado en Supabase | Escrito; probado con dobles y Postgres local, **no contra un proyecto Supabase real** |
| Cobro con Stripe | Pendiente |

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

Los textos estándar de `content/` provienen del kit EGE y **deben ser revisados por un abogado**
antes de ofrecer el sistema comercialmente. El sistema entrega plantillas y cálculos; no es asesoría legal.
