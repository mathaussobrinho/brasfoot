#!/bin/bash
set -e

cd /root/brasfoot

echo "🗄️ Verificando banco de dados..."
docker exec postgres psql -U funipro_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='brasfoot'" | grep -q 1 || \
docker exec postgres psql -U funipro_user -d postgres -c "CREATE DATABASE brasfoot;"

docker exec postgres psql -U funipro_user -d postgres -tc "SELECT 1 FROM pg_user WHERE usename='brasfoot_user'" | grep -q 1 || \
docker exec postgres psql -U funipro_user -d postgres -c "CREATE USER brasfoot_user WITH PASSWORD 'brasfoot_pass';"

docker exec postgres psql -U funipro_user -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE brasfoot TO brasfoot_user;"
docker exec postgres psql -U funipro_user -d brasfoot -c "GRANT ALL PRIVILEGES ON SCHEMA public TO brasfoot_user;"

echo "🛑 Parando containers existentes..."
docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true

echo "🔨 Construindo imagens..."
docker compose build --no-cache || docker-compose build --no-cache

echo "🚀 Iniciando containers..."
docker compose up -d || docker-compose up -d

echo "⏳ Aguardando containers iniciarem..."
sleep 15

echo "📊 Executando migrations..."
docker exec brasfoot-frontend sh -c "cd /app && DATABASE_URL=postgresql://brasfoot_user:brasfoot_pass@postgres:5432/brasfoot?schema=public npx prisma migrate deploy --schema=./backend/prisma/schema.production.prisma" 2>&1 || \
docker exec brasfoot-frontend sh -c "cd /app && DATABASE_URL=postgresql://brasfoot_user:brasfoot_pass@postgres:5432/brasfoot?schema=public npx prisma db push --schema=./backend/prisma/schema.production.prisma --accept-data-loss" 2>&1 || \
echo "⚠️ Aviso: Não foi possível executar migrations."

echo "✅ Deploy concluído!"
docker ps | grep brasfoot
