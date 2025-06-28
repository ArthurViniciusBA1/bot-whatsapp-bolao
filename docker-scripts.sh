set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando. Inicie o Docker e tente novamente."
        exit 1
    fi
}

check_env() {
    if [ ! -f ".env" ]; then
        print_warning "Arquivo .env não encontrado!"
        print_message "Copiando env.example para .env..."
        cp env.example .env
        print_warning "Por favor, edite o arquivo .env com suas configurações antes de continuar."
        exit 1
    fi
}

build() {
    print_header "Construindo imagem Docker"
    check_docker
    docker-compose build --no-cache
    print_message "Imagem construída com sucesso!"
}

start() {
    print_header "Iniciando bot do WhatsApp"
    check_docker
    check_env
    docker-compose up -d
    print_message "Bot iniciado! Use 'logs' para ver os logs."
}

stop() {
    print_header "Parando bot do WhatsApp"
    check_docker
    docker-compose down
    print_message "Bot parado!"
}

restart() {
    print_header "Reiniciando bot do WhatsApp"
    check_docker
    docker-compose restart
    print_message "Bot reiniciado!"
}

logs() {
    print_header "Logs do bot"
    check_docker
    docker-compose logs -f bot
}

logs_tail() {
    print_header "Últimas 100 linhas dos logs"
    check_docker
    docker-compose logs --tail=100 bot
}

shell() {
    print_header "Acessando container"
    check_docker
    docker-compose exec bot sh
}

status() {
    print_header "Status do bot"
    check_docker
    docker-compose ps
    echo ""
    print_message "Uso de recursos:"
    docker stats --no-stream novo-bot
}

cleanup() {
    print_header "Limpando recursos Docker não utilizados"
    check_docker
    docker system prune -f
    print_message "Limpeza concluída!"
}

update() {
    print_header "Atualizando bot"
    check_docker
    stop
    build
    start
    print_message "Bot atualizado com sucesso!"
}

help() {
    print_header "Comandos disponíveis"
    echo "  build     - Construir a imagem Docker"
    echo "  start     - Iniciar o bot"
    echo "  stop      - Parar o bot"
    echo "  restart   - Reiniciar o bot"
    echo "  logs      - Ver logs em tempo real"
    echo "  logs-tail - Ver últimas 100 linhas dos logs"
    echo "  shell     - Acessar o container"
    echo "  status    - Ver status e uso de recursos"
    echo "  cleanup   - Limpar recursos Docker não utilizados"
    echo "  update    - Atualizar o bot (stop + build + start)"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo "Exemplo: ./docker-scripts.sh start"
}

if [ $# -eq 0 ]; then
    print_error "Nenhum comando fornecido!"
    help
    exit 1
fi

# Executar comando
case "$1" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    logs-tail)
        logs_tail
        ;;
    shell)
        shell
        ;;
    status)
        status
        ;;
    cleanup)
        cleanup
        ;;
    update)
        update
        ;;
    help)
        help
        ;;
    *)
        print_error "Comando desconhecido: $1"
        help
        exit 1
        ;;
esac 