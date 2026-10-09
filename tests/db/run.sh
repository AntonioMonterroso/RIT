#!/usr/bin/env bash
# Uso: PGHOST=... PGPORT=... PGUSER=postgres tests/db/run.sh
# Crea una base temporal, aplica el esquema y corre las pruebas de aislamiento.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DB="rit_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$DIR/stub_supabase.sql"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$DIR/../../supabase/migrations/0001_init.sql"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$DIR/aislamiento.sql" 2>&1 | grep -E "NOTICE|ERROR|FALLO" | sed 's/^psql:[^ ]* //'
echo "RLS: todas las pruebas pasaron"
