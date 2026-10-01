#!/bin/sh
set -e

# No migrations folder: sync the schema. Fails (rather than dropping data) on destructive changes.
node_modules/.bin/prisma db push --skip-generate
exec node_modules/.bin/next start
