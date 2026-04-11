#!/bin/sh
set -e
echo "Waiting for database (DATABASE_URL)..."
i=0
while [ "$i" -lt 60 ]; do
  if node scripts/wait-for-db.js; then
    break
  fi
  i=$((i + 1))
  sleep 2
done
npm run migrate:up
npm run seed
exec node src/app.js
