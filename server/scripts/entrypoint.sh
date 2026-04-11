#!/bin/sh
set -e
echo "Waiting for PostgreSQL..."
i=0
while [ "$i" -lt 60 ]; do
  if node -e "
    const { Client } = require('pg');
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    c.connect()
      .then(() => c.end())
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  "; then
    break
  fi
  i=$((i + 1))
  sleep 2
done
npm run migrate:up
npm run seed
exec node src/app.js
