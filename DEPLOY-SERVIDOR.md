# Deploy no servidor (relatorio.fun)

Servidor: `ssh root@72.61.36.102`

## Variáveis de ambiente obrigatórias em produção

- **JWT_SECRET**: Obrigatório em produção. Se não for definido (ou for o valor padrão de desenvolvimento), o app lança erro ao processar login/token. No servidor, defina antes de subir o container, por exemplo:
  - Crie um arquivo `.env` na pasta do projeto (ex.: `/root/brasfoot/.env`) com: `JWT_SECRET=sua-string-secreta-longa-aqui`
  - Ou exporte no shell: `export JWT_SECRET=$(openssl rand -base64 32)` antes de `docker compose up -d`
- O `docker-compose.yml` usa `JWT_SECRET=${JWT_SECRET}`; sem essa variável no ambiente, o container pode falhar ao validar tokens.

## Por que dá 404?

O erro **HTTP 404** em https://relatorio.fun/ geralmente significa:

1. **Proxy reverso (Nginx/Caddy) não está encaminhando** o domínio `relatorio.fun` para o container do app (porta **3012**), ou
2. **Container do Brasfoot não está rodando** no servidor, ou
3. **Nginx** está configurado para outro site e não tem um `server` para `relatorio.fun`.

O app Next.js fica no container **brasfoot-frontend**, expondo a porta **3012** no host (mapeada da 3000 do container). A porta 3012 é usada para não conflitar com outros serviços (ex.: barbersys na 3002).

---

## 1. Conferir no servidor (via SSH)

Conecte e rode:

```bash
ssh root@72.61.36.102
```

### Container rodando?

```bash
docker ps | grep brasfoot
```

- Se **não** aparecer `brasfoot-frontend`, suba o projeto:

```bash
cd /root/brasfoot
docker compose up -d
# ou
docker-compose up -d
```

### Porta 3012 respondendo?

```bash
curl -I http://127.0.0.1:3012
```

- Se responder **200** (ou 307/302), o app está ok e o problema é só o proxy/HTTPS.

---

## 2. Configurar Nginx para relatorio.fun

Se no servidor você usa **Nginx** como proxy reverso, crie (ou edite) um bloco para `relatorio.fun` fazendo proxy para a porta **3012**.

Exemplo de arquivo: `/etc/nginx/sites-available/relatorio.fun` (ou dentro de `conf.d/`):

```nginx
server {
    listen 80;
    server_name relatorio.fun www.relatorio.fun;

    location / {
        proxy_pass http://127.0.0.1:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Se usar **HTTPS** (recomendado), use o Certbot ou outro método para gerar certificado e ter um bloco `listen 443 ssl;` com `ssl_certificate` e `ssl_certificate_key`. Exemplo mínimo com SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name relatorio.fun www.relatorio.fun;

    ssl_certificate     /etc/letsencrypt/live/relatorio.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relatorio.fun/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3012;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar e recarregar:

```bash
# Se usar sites-available/sites-enabled:
sudo ln -sf /etc/nginx/sites-available/relatorio.fun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Resumo do que fazer

| O que verificar | Comando / ação |
|-----------------|----------------|
| Container no ar | `docker ps \| grep brasfoot` → se vazio, `cd /root/brasfoot && docker compose up -d` |
| App na porta 3012 | `curl -I http://127.0.0.1:3012` → deve retornar HTTP 200/307/302 |
| Nginx para relatorio.fun | Configurar `server_name relatorio.fun` e `proxy_pass http://127.0.0.1:3012` |
| HTTPS | Certbot (ou outro) para relatorio.fun e bloco `listen 443 ssl` |

Depois disso, https://relatorio.fun/ deve abrir o app em vez de 404.
