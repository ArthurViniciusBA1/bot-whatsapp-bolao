import { Client, Message } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo } from '@/decorators';
import { obterRankingGrupo, UsuarioRanking } from '@/modulos';
import { prefixo } from '@/dadosBot';

/**
 * @class ComandoRankingBolao
 * @classdesc Comando para mostrar a classificação atual de todos os participantes do bolão no grupo.
 * @extends BaseCommand
 */
export class ComandoRankingBolao extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'rankingbolao';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão';

  /**
   * @constructor
   * @description Cria uma instância do ComandoRankingBolao.
   */
  constructor() {
    super();
    this.descricao =
      'Mostra a classificação atual de TODOS os participantes do bolão no grupo.';
    this.guia = `Use !${ComandoRankingBolao.nome} para ver quem está na liderança e sua pontuação, incluindo todos os participantes.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para exibir o ranking completo do bolão do grupo.
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

    try {
      const ranking: UsuarioRanking[] = await obterRankingGrupo(idGrupo);

      if (!ranking || ranking.length === 0) {
        await this.responderMarcando(
          client,
          message,
          '📊 O ranking deste grupo ainda está vazio. Adicione jogos e palpites para começar!'
        );
        return;
      }

      let resposta = `🏆 *Ranking do Bolão do Grupo* 🏆\n\n`;

      ranking.forEach((usuario, index) => {
        let posicaoDisplay = '';
        if (index === 0) posicaoDisplay = '🥇';
        else if (index === 1) posicaoDisplay = '🥈';
        else if (index === 2) posicaoDisplay = '🥉';
        else posicaoDisplay = `${index + 1}.`;

        if (index > 0) {
          resposta += `\n`;
        }
        resposta += `${posicaoDisplay} ${usuario.nomeUsuarioDisplay} - ${usuario.pontosTotais} ponto(s)`;
        if (index < ranking.length - 1) {
          resposta += `\n`;
        }
      });

      if (resposta.trim() === `🏆 *Ranking do Bolão do Grupo* 🏆`) {
        resposta += `\nNinguém pontuou ainda! 🤷‍♂️`;
      }

      await this.responder(client, message, resposta.trim());
    } catch (error) {
      console.error(
        `Erro no comando ${prefixo}${ComandoRankingBolao.nome}:`,
        error
      );
      await this.responderMarcando(
        client,
        message,
        '❌ Ops! Ocorreu um erro ao buscar o ranking do bolão. Tente novamente mais tarde.'
      );
    }
  }
}
