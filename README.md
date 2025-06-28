# 🤖 Bot Ba1 WhatsApp

Bot de WhatsApp com suporte a comandos, bolão, figurinhas, ranking, integração com MongoDB e muito mais.

## 🚀 Como rodar com npm (tradicional)

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/novo-bot.git
   cd novo-bot
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.EXAMPLE .env
     ```
   - Edite o arquivo `.env` com suas informações (especialmente a `MONGO_URI`).

4. **Compile o TypeScript:**
   ```bash
   npm run build
   ```

5. **Execute o bot:**
   ```bash
   npm start
   ```

## 🐳 Como rodar com Docker

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/novo-bot.git
   cd novo-bot
   ```

2. **Configure as variáveis de ambiente:**
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.EXAMPLE .env
     ```
   - Edite o arquivo `.env` com suas informações (especialmente a `MONGO_URI`).

3. **Build e execução:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Ver logs:**
   ```bash
   docker-compose logs -f bot
   ```

## 🛠️ Comandos úteis

- **Parar o bot:**  
  `docker-compose down`
- **Reiniciar o bot:**  
  `docker-compose restart`
- **Acessar o container:**  
  `docker-compose exec bot sh`
- **Ver status:**  
  `docker-compose ps`

## 📦 Estrutura do projeto

```
novo-bot/
├── src/
│   ├── comandos/
│   ├── database/
│   ├── modulos/
│   └── index.ts
├── Dockerfile
├── docker-compose.yml
├── .env
├── package.json
└── README.md
```

## ⚙️ Variáveis de ambiente

Exemplo de `.env`:
```
NUMERO_DONO=5531997079666
PREFIX=!
NOME_DE_EXIBICAO=Bot Ba1
NOME_AUTOR_FIGURINHAS=Bot Ba1 Stickers
NOME_PACOTE_FIGURINHAS=Ba1
MONGO_URI=sua_uri_mongodb
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 📝 Notas

- Na primeira execução, será necessário escanear o QR Code do WhatsApp.
- Os dados de sessão e logs são persistidos em volumes Docker.
- O bot utiliza MongoDB para armazenar dados do bolão e ranking.

## 🐳 Dicas Docker

- Para reconstruir a imagem após alterações:
  ```bash
  docker-compose build --no-cache
  docker-compose up -d
  ```
- Para ver apenas as últimas linhas dos logs:
  ```bash
  docker-compose logs --tail=100 bot
  ```

## 🆘 Suporte

Se tiver dúvidas ou problemas, abra uma issue ou entre em contato. 