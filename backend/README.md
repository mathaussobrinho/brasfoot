# Brashero Backend

Lógica de negócio e banco de dados do projeto.

## Estrutura

- `lib/` - Bibliotecas e funções de negócio
  - `auth.ts` - Autenticação e JWT
  - `gacha.ts` - Sistema de gacha
  - `clube.ts` - Gerenciamento de clubes
  - `partidas-detalhadas.ts` - Simulação de partidas
  - `leilao.ts` - Sistema de leilões
  - `vendas.ts` - Sistema de vendas
  - E mais...
- `prisma/` - Schema e configuração do Prisma

## Scripts

- `npm run db:generate` - Gera o cliente Prisma
- `npm run db:push` - Aplica mudanças no schema
- `npm run db:studio` - Abre Prisma Studio

## Banco de Dados

O projeto usa SQLite com Prisma ORM. O arquivo do banco está em `prisma/dev.db`.
