#!/bin/sh
set -e

echo "🔄 Pushing Prisma schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "🌱 Running database seed..."
# npx prisma db seed || echo "⚠️ Seed skipped (may already exist)"

echo "🏗️ Building API..."
npm run build

echo "🚀 Starting API server..."
exec npm start
# exec npm run dev
