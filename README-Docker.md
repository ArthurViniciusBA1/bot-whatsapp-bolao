# 🐳 Docker - Bot do WhatsApp

Este documento contém instruções para executar o bot do WhatsApp usando Docker.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Acesso ao MongoDB (local ou na nuvem)

## 🚀 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Bot
NUMERO_DONO=seu_numero_aqui
PREFIX=!
NOME_DE_EXIBICAO=Seu Bot
NOME_AUTOR_FIGURINHAS=Seu Bot Stickers
NOME_PACOTE_FIGURINHAS=SeuBot

# Configuração do MongoDB
MONGO_URI=sua_uri_mongodb_aqui

# Configurações do Ambiente
NODE_ENV=production
```

### 2. Construir e Executar

```bash
# Construir a imagem
docker-compose build

# Executar o bot
docker-compose up -d

# Ver logs
docker-compose logs -f bot
```

## 📁 Estrutura de Volumes

O Docker Compose cria os seguintes volumes:

- `bot-session-data`: Armazena dados de sessão do bot
- `bot-logs`: Armazena logs do aplicativo

## 🔧 Comandos Úteis

```bash
# Parar o bot
docker-compose down

# Reiniciar o bot
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f bot

# Acessar o container
docker-compose exec bot sh

# Reconstruir após mudanças no código
docker-compose build --no-cache
docker-compose up -d
```

## 🐛 Solução de Problemas

### Problema: Bot não conecta ao WhatsApp
- Verifique se o número do dono está correto
- Certifique-se de que o MongoDB está acessível
- Verifique os logs: `docker-compose logs bot`

### Problema: Erro de permissão
- O container roda como usuário não-root por segurança
- Verifique se os volumes têm permissões corretas

### Problema: Chromium não funciona
- O Dockerfile já inclui o Chromium necessário
- Verifique se as variáveis de ambiente do Puppeteer estão corretas

## 🔒 Segurança

- O bot roda como usuário não-root
- Volumes são isolados
- Recursos são limitados (1GB RAM, 0.5 CPU)

## 📊 Monitoramento

Para monitorar o uso de recursos:

```bash
# Ver uso de recursos
docker stats novo-bot

# Ver informações do container
docker inspect novo-bot
```

## 🔄 Atualizações

Para atualizar o bot:

```bash
# Parar o bot
docker-compose down

# Fazer pull das mudanças (se usando git)
git pull

# Reconstruir e executar
docker-compose build --no-cache
docker-compose up -d
```

## 📝 Notas Importantes

1. **Primeira execução**: Na primeira vez que executar, você precisará escanear o QR code do WhatsApp
2. **Persistência**: Os dados de sessão são mantidos no volume `bot-session-data`
3. **Logs**: Os logs são salvos no volume `bot-logs`
4. **Recursos**: O bot está limitado a 1GB de RAM e 0.5 CPU para evitar sobrecarga

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs bot`
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Certifique-se de que o MongoDB está acessível
4. Verifique se o número do dono está correto 