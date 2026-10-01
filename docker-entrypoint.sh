#!/bin/sh
set -e

# A freshly mounted volume is root-owned: hand it to `node`, then drop privileges.
if [ "$(id -u)" = "0" ]; then
  db_dir=$(dirname "${DATABASE_URL#file:}")
  mkdir -p "$db_dir" && chown node:node "$db_dir"
  exec setpriv --reuid=node --regid=node --init-groups "$0" "$@"
fi

# No migrations folder: sync the schema. Fails (rather than dropping data) on destructive changes.
node_modules/.bin/prisma db push --skip-generate
exec node_modules/.bin/next start
