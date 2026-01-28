#!/bin/sh
set -e

if [ "${PRISMA_DB_PUSH:-0}" = "1" ]; then
  echo "🔄 Pushing Prisma schema to database (PRISMA_DB_PUSH=1)..."
  npx prisma db push --skip-generate --accept-data-loss
else
  echo "⏭️ Skipping Prisma db push (set PRISMA_DB_PUSH=1 to enable)"
fi

echo "🌱 Running database seed..."
# npx prisma db seed || echo "⚠️ Seed skipped (may already exist)"

echo "🏗️ Building API..."
npm run build

echo "🚀 Starting API server..."
exec npm start
# exec npm run dev
