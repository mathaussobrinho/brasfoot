# Build stage
FROM node:18-alpine AS deps

WORKDIR /app

# Copia package.json do frontend
COPY frontend/package*.json ./
RUN npm install --production=false

# Copia backend/lib e prisma para dentro do app (estrutura relativa)
COPY backend/lib ./backend/lib
COPY backend/prisma ./backend/prisma

# Gera Prisma Client
RUN npx prisma generate --schema=./backend/prisma/schema.production.prisma

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copia dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend ./backend

# Copia arquivos de configuração
COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./
COPY frontend/next.config.js ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.js ./

# Copia código do frontend
COPY frontend/app ./app
COPY frontend/components ./components
COPY frontend/public ./public

# Build da aplicação
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://brasfoot_user:brasfoot_pass@postgres:5432/brasfoot?schema=public
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instala OpenSSL necessário para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários do build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/backend ./backend

# Ajusta permissões
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
