#!/bin/bash

# Script de deploy para o servidor
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy do Brasfoot..."

# Configurações
SERVER="root@72.61.36.102"
PROJECT_DIR="/root/brasfoot"
CONTAINER_FRONTEND="brasfoot-frontend"

# Cria diretório no servidor se não existir
echo "📁 Criando diretório no servidor..."
ssh $SERVER "mkdir -p $PROJECT_DIR"

# Sincroniza arquivos (excluindo node_modules, .next, etc)
echo "📦 Sincronizando arquivos..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.db' \
  --exclude '*.db-journal' \
  --exclude '.env.local' \
  --exclude 'dist' \
  --exclude 'build' \
  ./ $SERVER:$PROJECT_DIR/

# Conecta ao servidor e executa comandos
echo "🐳 Construindo e iniciando containers..."
ssh $SERVER << 'ENDSSH'
cd /root/brasfoot

# Cria banco de dados se não existir
echo "🗄️ Verificando banco de dados..."
docker exec postgres psql -U funipro_user -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='brasfoot'" | grep -q 1 || \
docker exec postgres psql -U funipro_user -d postgres -c "CREATE DATABASE brasfoot;"

docker exec postgres psql -U funipro_user -d postgres -tc "SELECT 1 FROM pg_user WHERE usename='brasfoot_user'" | grep -q 1 || \
docker exec postgres psql -U funipro_user -d postgres -c "CREATE USER brasfoot_user WITH PASSWORD 'brasfoot_pass';"

docker exec postgres psql -U funipro_user -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE brasfoot TO brasfoot_user;"
docker exec postgres psql -U funipro_user -d brasfoot -c "GRANT ALL PRIVILEGES ON SCHEMA public TO brasfoot_user;"

# Para containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Constrói e inicia containers
echo "🔨 Construindo imagens..."
docker-compose build --no-cache

echo "🚀 Iniciando containers..."
docker-compose up -d

# Aguarda containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Executa migrations do Prisma
echo "📊 Executando migrations..."
sleep 10
docker exec brasfoot-frontend sh -c "cd /app && DATABASE_URL=postgresql://brasfoot_user:brasfoot_pass@postgres:5432/brasfoot?schema=public npx prisma migrate deploy --schema=./backend/prisma/schema.production.prisma" 2>&1 || \
docker exec brasfoot-frontend sh -c "cd /app && DATABASE_URL=postgresql://brasfoot_user:brasfoot_pass@postgres:5432/brasfoot?schema=public npx prisma db push --schema=./backend/prisma/schema.production.prisma --accept-data-loss" 2>&1 || \
echo "⚠️ Aviso: Não foi possível executar migrations. Execute manualmente se necessário."

echo "✅ Deploy concluído!"
echo "📊 Status dos containers:"
docker-compose ps

ENDSSH

echo "✅ Deploy finalizado com sucesso!"
