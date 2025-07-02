FROM oven/bun:1-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

RUN apk add --no-cache git ffmpeg

# Copia os arquivos de definição de pacotes
COPY package.json bun.lock* ./

# Instala as dependências de produção
RUN bun install --production

# Copia o restante do código da aplicação
COPY . .

# Executa o build da aplicação (transpila o TypeScript)
RUN bun run build

# O comando para iniciar o bot quando o container for executado
CMD ["bun", "run", "start"]