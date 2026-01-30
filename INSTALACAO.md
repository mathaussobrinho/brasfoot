# 📦 Guia de Instalação - Brashero

## Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu-secret-jwt-super-secreto-aqui-mude-em-producao"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**⚠️ IMPORTANTE**: Mude o `JWT_SECRET` para uma string aleatória e segura em produção!

### 3. Configurar Banco de Dados

```bash
# Gerar o cliente Prisma
npm run db:generate

# Criar/push do schema para o banco
npm run db:push
```

Isso criará um arquivo `dev.db` (SQLite) na raiz do projeto.

### 4. Iniciar o Servidor

```bash
npm run dev
```

O servidor estará disponível em [http://localhost:3000](http://localhost:3000)

### 5. (Opcional) Gerar Artes Temporárias

Para gerar as imagens SVG temporárias dos jogadores:

```bash
node scripts/gerar-imagens-temporarias.js
```

## 🎮 Primeiro Uso

1. Acesse [http://localhost:3000](http://localhost:3000)
2. Clique em "Criar Conta"
3. Preencha os dados:
   - Nome
   - Sobrenome
   - Login (único)
   - Email (único)
   - Senha (mínimo 6 caracteres)
4. Faça login
5. Vá para o Gacha e comece a coletar jogadores!

## 🔧 Comandos Úteis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Cria build de produção
- `npm run start`: Inicia servidor de produção
- `npm run db:studio`: Abre o Prisma Studio (interface visual do banco)

## 🐛 Problemas Comuns

### Erro: "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### Erro: "Database not found"
```bash
npm run db:push
```

### Erro ao fazer login/registro
Verifique se o arquivo `.env` existe e está configurado corretamente.

## 📝 Notas

- O banco de dados SQLite é criado automaticamente na primeira execução
- As senhas são hasheadas com bcrypt
- Os tiros são resetados automaticamente todos os dias às 12:00
- O sistema está pronto para desenvolvimento, mas precisa de ajustes para produção
