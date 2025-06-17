import { Client, Message, ContactId } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo } from '@/decorators';
import {
  obterJogosAbertosParaPalpite,
  obterJogosPendentesDeResultado,
  JogoBolao,
} from '@/modulos';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

const FUSO_HORARIO_EXIBICAO = 'America/Sao_Paulo';

/**
 * @class ComandoVerJogosBolao
 * @classdesc Comando para mostrar a lista de jogos do bolão: abertos para palpites e, para admins, pendentes de resultado.
 * @extends BaseCommand
 */
export class ComandoVerJogosBolao extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'boloes';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão';

  /**
   * @constructor
   * @description Cria uma instância do ComandoVerJogosBolao.
   */
  constructor() {
    super();
    this.descricao =
      'Mostra a lista de jogos do bolão: abertos para palpites e, para admins, pendentes de resultado.';
    this.guia = `Use "!${ComandoVerJogosBolao.nome}" para ver todas as partidas disponíveis para palpitar neste grupo e seus respectivos IDs. Admins também verão jogos que precisam de atualização de resultado.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para listar os jogos do bolão.
   * Administradores verão uma seção adicional com jogos pendentes de resultado.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @param {string[]} [_args] - Argumentos passados (não utilizados neste comando).
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  async executar(
    client: Client,
    message: Message,
    _args?: string[]
  ): Promise<void> {
    const idGrupo = message.chatId;
    let isAdmin = false;

    if (message.chat.groupMetadata && message.chat.groupMetadata.participants) {
      const senderParticipant = message.chat.groupMetadata.participants.find(
        (p) => {
          const participantId = (
            typeof p.id === 'string' ? p.id : p.id._serialized
          ) as ContactId;
          return participantId === message.sender.id;
        }
      );
      isAdmin = senderParticipant?.isAdmin || false;
    }

    let resposta = '';

    try {
      if (isAdmin) {
        const jogosPendentes = await obterJogosPendentesDeResultado(idGrupo);
        if (jogosPendentes && jogosPendentes.length > 0) {
          resposta += `⚠️ *Jogos Aguardando Resultado (Admin):*\n_(Horários de Brasília)_\n\n`;
          jogosPendentes.forEach((jogo) => {
            const dataJogoFormatada = dayjs(jogo.dataJogo)
              .tz(FUSO_HORARIO_EXIBICAO)
              .format('DD/MM [às] HH:mm');
            resposta += `------------------------------------\n`;
            resposta += `*ID do Jogo:* \`${jogo.idJogo}\`\n`;
            resposta += `*${jogo.timeCasa} vs ${jogo.timeFora}*\n`;
            if (jogo.campeonato) {
              resposta += `🏆 *${jogo.campeonato}*\n`;
            }
            resposta += `🗓️ ${dataJogoFormatada}\n`;
            resposta += `✍️ *Ação:* para finalizar use:\n \`!bolaoresultado ${jogo.idJogo} <Casa>x<Fora>\`\n`;
          });
          resposta += `------------------------------------\n\n`;
        }
      }

      const jogosAbertos: JogoBolao[] =
        await obterJogosAbertosParaPalpite(idGrupo);

      if (jogosAbertos && jogosAbertos.length > 0) {
        resposta += `🏆 *Jogos Abertos para Palpite no Bolão do Grupo* 🏆\n_(Horários de Brasília)_\n\n`;
        jogosAbertos.forEach((jogo) => {
          const dataLimitePalpite = dayjs(jogo.dataLimitePalpite)
            .tz(FUSO_HORARIO_EXIBICAO)
            .format('DD/MM [às] HH:mm');
          const dataJogoFormatada = dayjs(jogo.dataJogo)
            .tz(FUSO_HORARIO_EXIBICAO)
            .format('DD/MM [às] HH:mm');

          resposta += `------------------------------------\n`;
          resposta += `*ID do Jogo:* \`${jogo.idJogo}\`\n`;
          resposta += `⚽ ${jogo.timeCasa} vs ${jogo.timeFora}\n`;
          if (jogo.campeonato) {
            resposta += `🏆 ${jogo.campeonato}\n`;
          }
          resposta += `🗓️ ${dataJogoFormatada}\n`;
          resposta += `🔒 *Palpites até:* ${dataLimitePalpite}\n`;
          resposta += `💬 *Como palpitar:*\n \`!palpitar ${jogo.idJogo} <Casa>x<Fora>\`\n`;
        });
        resposta += `------------------------------------\n`;
      }

      if (resposta.trim() === '') {
        if (isAdmin) {
          resposta =
            '👍 Nenhum jogo pendente de resultado e nenhum jogo aberto para palpites no momento.';
        } else {
          resposta =
            '😔 Nenhum jogo aberto para palpites neste grupo no momento. Peça a um admin para adicionar jogos!';
        }
      }

      await this.responder(client, message, resposta.trim());
    } catch (error) {
      console.error(`Erro no comando ${ComandoVerJogosBolao.nome}:`, error);
      await this.responder(
        client,
        message,
        '❌ Ops! Ocorreu um erro ao buscar os jogos do bolão. Tente novamente mais tarde.'
      );
    }
  }
}
