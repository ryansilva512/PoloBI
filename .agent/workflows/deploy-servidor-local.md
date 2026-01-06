---
description: Como fazer deploy do projeto em um servidor Linux usando IP (sem domínio)
---

# Deploy do Polo BI em Servidor (Sem Domínio)

Este guia mostra como colocar o projeto em um servidor acessível via IP.

---

## Pré-requisitos no Servidor

1. **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
2. **Node.js**: versão 18 ou superior
3. **npm**: instalado junto com o Node.js
4. **PM2**: gerenciador de processos para manter a aplicação rodando

---

## Passo 1: Preparar o Servidor

### 1.1 Conectar ao servidor via SSH

```bash
ssh usuario@IP_DO_SERVIDOR
```

### 1.2 Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Node.js 20 LTS

```bash
# Instala NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recarregar o terminal
source ~/.bashrc

# Instalar Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalação
node -v
npm -v
```

### 1.4 Instalar PM2 Globalmente

```bash
npm install -g pm2
```

---

## Passo 2: Transferir o Projeto para o Servidor

### Opção A: Via Git (Recomendado)

```bash
# No servidor, clone o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

### Opção B: Via SCP (Cópia manual)

```bash
# No seu computador local (Windows PowerShell)
scp -r "C:\Users\Ryan Silva\Documents\Projetos de Sites\Site Help Desk\Expert-UXBI-Help\Expert-UXBI-Help" usuario@IP_DO_SERVIDOR:~/polo-bi
```

### Opção C: Via FileZilla/SFTP

1. Conecte ao servidor usando FileZilla
2. Copie a pasta do projeto para `/home/usuario/polo-bi`

---

## Passo 3: Configurar o Projeto no Servidor

### 3.1 Acessar a pasta do projeto

```bash
cd ~/polo-bi  # ou o nome da pasta onde está o projeto
```

### 3.2 Instalar dependências

```bash
npm install
```

### 3.3 Criar arquivo .env

```bash
nano .env
```

Adicione o seguinte conteúdo:

```env
# API Key para Milvus (OBRIGATÓRIO)
MILVUS_API_KEY=sua_chave_api_aqui

# Ambiente
NODE_ENV=production

# Porta do servidor
PORT=5000
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.4 Fazer o Build da aplicação

```bash
npm run build
```

---

## Passo 4: Iniciar a Aplicação com PM2

### 4.1 Iniciar o servidor

```bash
pm2 start npm --name "polo-bi" -- run start
```

### 4.2 Verificar se está rodando

```bash
pm2 status
pm2 logs polo-bi
```

### 4.3 Configurar para iniciar automaticamente ao reiniciar o servidor

```bash
pm2 startup
pm2 save
```

---

## Passo 5: Configurar o Firewall

### 5.1 Liberar a porta 5000 (ou a porta que você configurou)

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 5000/tcp
sudo ufw reload
sudo ufw status
```

Se estiver usando outro firewall ou AWS/GCP/Azure, libere a porta no painel do provedor de cloud.

---

## Passo 6: Acessar a Aplicação

Agora você pode acessar a aplicação pelo navegador usando:

```
http://IP_DO_SERVIDOR:5000
```

Exemplo: `http://192.168.1.100:5000`

---

## Comandos Úteis do PM2

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Ver status de todos os processos |
| `pm2 logs polo-bi` | Ver logs em tempo real |
| `pm2 restart polo-bi` | Reiniciar a aplicação |
| `pm2 stop polo-bi` | Parar a aplicação |
| `pm2 delete polo-bi` | Remover do PM2 |
| `pm2 monit` | Monitor interativo |

---

## (Opcional) Usar a Porta 80 sem root

Se quiser acessar pelo IP diretamente sem `:5000`, use o Nginx como proxy reverso:

### 1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 2. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/polo-bi
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name _;  # Aceita qualquer IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Ativar a configuração

```bash
sudo ln -s /etc/nginx/sites-available/polo-bi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove config padrão
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

### 4. Liberar porta 80

```bash
sudo ufw allow 80/tcp
sudo ufw reload
```

Agora acessar apenas por: `http://IP_DO_SERVIDOR`

---

## Troubleshooting

### Aplicação não inicia

```bash
# Ver logs detalhados
pm2 logs polo-bi --lines 100

# Verificar se a porta está em uso
sudo lsof -i :5000
```

### Erro de conexão recusada

- Verifique se o firewall está liberando a porta
- Confirme que a aplicação está rodando: `pm2 status`
- Teste localmente no servidor: `curl http://localhost:5000`

### Erro de permissão

```bash
# Dar permissões à pasta
sudo chown -R $USER:$USER ~/polo-bi
```

---

## Atualizar a Aplicação

1. Parar a aplicação: `pm2 stop polo-bi`
2. Atualizar os arquivos (git pull ou nova cópia)
3. Instalar dependências: `npm install`
4. Fazer build: `npm run build`
5. Reiniciar: `pm2 restart polo-bi`
