#!/bin/sh
set -e

echo "🔄 Pushing Prisma schema to database..."
npx prisma db push --skip-generate --accept-data-loss

echo "🌱 Running database seed..."
npx prisma db seed || echo "⚠️ Seed skipped (may already exist)"

echo "🚀 Starting API server..."
exec npm run dev
