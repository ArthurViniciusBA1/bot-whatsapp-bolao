import * as baileys from "@whiskeysockets/baileys";
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo } from '@/decorators';
import { obterMeusPalpites, Palpite, JogoBolao } from '@/modulos';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { removerEmojis } from 'utils/utils';
import { prefixo } from '@/dadosBot';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

/**
 * @class ComandoMeusPalpites
 * @classdesc Comando para mostrar os palpites do usuário para os jogos atuais do bolão do grupo.
 * @extends BaseCommand
 */
export class ComandoMeusPalpites extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'meuspalpites';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão';

  /**
   * @constructor
   * @description Cria uma instância do ComandoMeusPalpites.
   */
  constructor() {
    super();
    this.descricao =
      'Mostra os seus palpites para os jogos atuais do bolão do grupo.';
    this.guia = `Use _${prefixo}${ComandoMeusPalpites.nome}_ para ver os palpites que você já registrou para os jogos que ainda não aconteceram.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para listar os palpites do usuário para jogos agendados.
   * @param {WASocket} client - Instância do cliente WA.
   * @param {WAMessage} message - Objeto da mensagem original.
   * @param {string[]} [_args] - Argumentos passados (não utilizados neste comando).
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  async executar(
    client: baileys.WASocket,
    message: baileys.WAMessage,
    _args?: string[]
  ): Promise<void> {
    const idGrupo = this.getChatJid(message);
    const idUsuario = this.getSenderJid(message);

    try {
      const meusPalpitesComJogo = await obterMeusPalpites(idGrupo, idUsuario);

      if (!meusPalpitesComJogo || meusPalpitesComJogo.length === 0) {
        await this.responderMarcando(
          client,
          message,
          '🤔 Você ainda não fez palpites para os jogos atuais do bolão deste grupo, ou os jogos para os quais você palpitou já ocorreram.'
        );
        return;
      }

      let resposta = `📋 *Seus Palpites (Jogos Agendados):*\n`;
      meusPalpitesComJogo.forEach((item) => {
        const palpite = item as Omit<Palpite, 'idPalpite'> & {
          idPalpite?: number;
        };
        const jogo = item.jogo as Partial<JogoBolao>;

        resposta += `------------------------------------\n`;
        if (jogo.campeonato) {
          resposta += `🏅 *Campeonato:* ${jogo.campeonato}\n`;
        }
        const timeCasaNome = removerEmojis(jogo.timeCasa) || 'Time Casa?';
        const timeForaNome = removerEmojis(jogo.timeFora) || 'Time Fora?';
        resposta += `🎯 *Seu Palpite:* \n ${timeCasaNome} ${palpite.palpiteCasa} x ${palpite.palpiteFora} ${timeForaNome} \n`;
      });
      resposta += `------------------------------------\n`;

      await this.responderMarcando(client, message, resposta.trim());
    } catch (error) {
      console.error(
        `Erro no comando ${prefixo}${ComandoMeusPalpites.nome}:`,
        error
      );
      await this.responderMarcando(
        client,
        message,
        '❌ Ops! Ocorreu um erro ao buscar seus palpites. Tente novamente mais tarde.'
      );
    }
  }
}
