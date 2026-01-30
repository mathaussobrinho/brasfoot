# Brashero Frontend

Aplicação Next.js contendo o frontend e as rotas de API.

## Estrutura

- `app/` - Páginas e rotas de API do Next.js
- `components/` - Componentes React reutilizáveis
- `public/` - Arquivos estáticos

## Scripts

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Linter

## Imports

Os imports das bibliotecas do backend devem usar caminhos relativos:
```typescript
import { prisma } from '../../../../backend/lib/prisma'
```
