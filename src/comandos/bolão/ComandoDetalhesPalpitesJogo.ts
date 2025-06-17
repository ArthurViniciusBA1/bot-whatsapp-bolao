import { Client, Message } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts'; // Ajuste o caminho
import { SomenteGrupo, RequerAdminUsuario } from '@/decorators'; // Ajuste o caminho
import { obterJogoPorIdEGrupo, obterPalpitesPorJogoEGrupo } from '@/modulos'; // Ajuste o caminho
import { removerEmojis } from '@/utils/utils'; // Ajuste o caminho
import { prefixo } from '@/dadosBot'; // Ajuste o caminho

/**
 * @class ComandoDetalhesPalpitesJogo
 * @classdesc Comando administrativo para listar todos os palpites de um jogo específico do bolão e resumir as apostas.
 * @extends BaseCommand
 */
export class ComandoDetalhesPalpitesJogo extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'detalhespalpites';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão Admin';

  /**
   * @constructor
   * @description Cria uma instância do ComandoDetalhesPalpitesJogo.
   */
  constructor() {
    super();
    this.descricao =
      'ADMIN: Lista todos os palpites de um jogo específico do bolão e resume as apostas.';
    this.guia =
      `Uso: \`${prefixo}${ComandoDetalhesPalpitesJogo.nome} <ID_Jogo_Bolao>\`\n\n` +
      `*Exemplo:* \`${prefixo}${ComandoDetalhesPalpitesJogo.nome} 1\`\n` +
      '(Para ver os detalhes dos palpites do jogo com ID 1 no bolão deste grupo).\n\n' +
      `Use \`${prefixo}bolaojogos\` para ver os IDs dos jogos.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para listar os detalhes dos palpites de um jogo.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos esperados: [idJogoBolao].
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  @RequerAdminUsuario
  async executar(
    client: Client,
    message: Message,
    args: string[]
  ): Promise<void> {
    const idGrupo = message.chatId;

    if (args.length < 1) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato incorreto! Forneça o ID do Jogo do Bolão.\n${this.guia}`
      );
      return;
    }

    const idJogoBolaoStr = args[0];
    const idJogoBolao = parseInt(idJogoBolaoStr, 10);

    if (isNaN(idJogoBolao) || idJogoBolao <= 0) {
      await this.responderMarcando(
        client,
        message,
        '❌ O ID do Jogo do Bolão deve ser um número válido e positivo.'
      );
      return;
    }

    try {
      const jogo = await obterJogoPorIdEGrupo(idJogoBolao, idGrupo);
      if (!jogo) {
        await this.responderMarcando(
          client,
          message,
          `❌ Jogo com ID ${idJogoBolao} não encontrado neste grupo.`
        );
        return;
      }

      const palpites = await obterPalpitesPorJogoEGrupo(idJogoBolao, idGrupo);

      if (!palpites || palpites.length === 0) {
        await this.responderMarcando(
          client,
          message,
          `ℹ️ Nenhum palpite encontrado para o jogo: ${jogo.timeCasa} vs ${jogo.timeFora} (ID: ${idJogoBolao}).`
        );
        return;
      }

      let resposta = `📊 *Palpites para o Jogo: ${jogo.timeCasa} vs ${jogo.timeFora} (ID: ${idJogoBolao})*\n\n`;

      let vitoriasCasa = 0;
      let vitoriasFora = 0;
      let empates = 0;

      const casaSEmoji = removerEmojis(jogo.timeCasa);
      const foraSEmoji = removerEmojis(jogo.timeFora);

      palpites.forEach((palpite) => {
        const nomeDisplay =
          palpite.nomeUsuario || palpite.idUsuario.split('@')[0];

        if (palpite.palpiteCasa === palpite.palpiteFora) {
          resposta += `${nomeDisplay}: Empate por ${palpite.palpiteCasa}x${palpite.palpiteFora}\n`;
          empates++;
        } else if (palpite.palpiteCasa > palpite.palpiteFora) {
          resposta += `${nomeDisplay}: ${palpite.palpiteCasa}x${palpite.palpiteFora} para ${casaSEmoji}\n`;
          vitoriasCasa++;
        } else if (palpite.palpiteCasa < palpite.palpiteFora) {
          resposta += `${nomeDisplay}: ${palpite.palpiteFora}x${palpite.palpiteCasa} para ${foraSEmoji}\n`;
          vitoriasFora++;
        }
      });

      if (palpites.length > 0) {
        resposta += '\n';
      }

      resposta += `------------------------------------\n`;
      resposta += `*Resumo dos Palpites para este Jogo:*\n`;
      resposta += `🏠 Palpites em ${jogo.timeCasa}: ${vitoriasCasa}\n`;
      resposta += `✈️ Palpites em ${jogo.timeFora}: ${vitoriasFora}\n`;
      resposta += `🤝 Palpites em Empate: ${empates}\n`;
      resposta += `👥 Total de Palpites: ${palpites.length}`;

      await this.responder(client, message, resposta.trim());
    } catch (error) {
      console.error(
        `Erro no comando ${ComandoDetalhesPalpitesJogo.nome}:`,
        error
      );
      await this.responderMarcando(
        client,
        message,
        '❌ Ops! Ocorreu um erro interno ao buscar os detalhes dos palpites.'
      );
    }
  }
}
