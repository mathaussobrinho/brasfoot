# Brashero - Jogo de Futebol Estilo Brasfoot

Jogo de futebol gerenciador estilo Brasfoot com sistema de gacha, leilões e partidas em tempo real.

## 📁 Estrutura do Projeto

Este projeto está organizado em uma estrutura de monorepo:

```
brasfoot/
├── frontend/          # Aplicação Next.js (Frontend + API Routes)
│   ├── app/          # Páginas e rotas de API
│   ├── components/   # Componentes React
│   └── public/       # Arquivos estáticos
├── backend/          # Lógica de negócio e banco de dados
│   ├── lib/          # Bibliotecas e funções de negócio
│   └── prisma/       # Schema e migrations do Prisma
└── package.json      # Configuração do monorepo
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/mathaussobrinho/brashero.git
cd brashero
```

2. Instale as dependências:
```bash
npm run install:all
```

3. Configure o banco de dados:
```bash
npm run db:generate
npm run db:push
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run db:generate` - Gera o cliente Prisma
- `npm run db:push` - Aplica mudanças no schema ao banco
- `npm run db:studio` - Abre o Prisma Studio

## 🎮 Funcionalidades

- ✅ Sistema de Gacha (5 tiros diários, reset às 12:00)
- ✅ Passe de Temporada (10 tiros diários por 30 dias)
- ✅ Sistema de Leilões
- ✅ Vendas Diretas de Jogadores
- ✅ Criação e Gerenciamento de Clube
- ✅ Escalação de Time com Formações
- ✅ Partidas em Tempo Real (Bot e Ranqueado)
- ✅ Sistema de Técnico com Overall
- ✅ Jogadores Reais com Raridades

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: SQLite
- **Autenticação**: JWT
- **Validação**: Zod

## 📝 Licença

Este projeto é privado.
