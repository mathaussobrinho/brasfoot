# Como Publicar no GitHub

## Passos para criar o repositório privado

1. Acesse https://github.com/new
2. Preencha:
   - **Repository name**: `brashero`
   - **Description**: "Jogo de futebol estilo Brasfoot com sistema de gacha, leilões e partidas em tempo real"
   - **Visibility**: ✅ Private
   - **NÃO** marque "Initialize this repository with a README"
3. Clique em "Create repository"

## Após criar o repositório

Execute os seguintes comandos:

```bash
# Remove o remote atual (se necessário)
git remote remove origin

# Adiciona o novo remote
git remote add origin https://github.com/mathaussobrinho/brashero.git

# Renomeia a branch para main (se necessário)
git branch -M main

# Faz o push
git push -u origin main
```

## Estrutura do Projeto

O projeto está organizado em:
- `frontend/` - Aplicação Next.js
- `backend/` - Lógica de negócio e Prisma

## Notas

- O banco de dados (`dev.db`) está no `.gitignore` e não será commitado
- Certifique-se de que o `.env` também está no `.gitignore`
