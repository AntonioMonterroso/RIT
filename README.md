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
| Cuentas, guardado en Supabase, calendario, biblioteca, Stripe | Pendiente |

Hoy el borrador se guarda en el navegador (`lib/almacen.ts`); se cambiará por Supabase al conectar cuentas.

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
