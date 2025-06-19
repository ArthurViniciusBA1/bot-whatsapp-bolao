import { Client, Message } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo } from '@/decorators';
import { obterRankingGrupo, contarPalpitesUsuario } from '@/modulos';
import { prefixo } from '@/dadosBot';

/**
 * @class ComandoPerfil
 * @classdesc Comando para mostrar o perfil e as estatísticas de um usuário no bolão.
 * @extends BaseCommand
 */
export class ComandoPerfil extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'perfil';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão';

  /**
   * @constructor
   * @description Cria uma instância do ComandoPerfil.
   */
  constructor() {
    super();
    this.descricao = 'Mostra seu perfil e estatísticas no bolão do grupo.';
    this.guia = `Use ${prefixo}${ComandoPerfil.nome} para ver sua pontuação, ranking, total de palpites e taxa de acerto.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para exibir o perfil do usuário.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  async executar(client: Client, message: Message): Promise<void> {
    const idGrupo = message.chatId;
    const idUsuario = message.sender.id;
    const nomeUsuario = message.sender.pushname || idUsuario.split('@')[0];

    try {
      const rankingCompleto = await obterRankingGrupo(idGrupo);
      const totalDePalpites = await contarPalpitesUsuario(idGrupo, idUsuario);

      const usuarioNoRanking = rankingCompleto.find(
        (u) => u.idUsuario === idUsuario
      );
      const posicao =
        rankingCompleto.findIndex((u) => u.idUsuario === idUsuario) + 1;

      const pontos = usuarioNoRanking ? usuarioNoRanking.pontosTotais : 0;

      const taxaDeAcerto =
        totalDePalpites > 0
          ? ((pontos / totalDePalpites) * 100).toFixed(2)
          : '0.00';

      let resposta = `👤 *Perfil do Bolão de ${nomeUsuario}* 👤\n\n`;
      resposta += `🏆 *Pontos:* ${pontos}\n`;
      resposta += `📈 *Ranking:* ${
        posicao > 0
          ? `${posicao}º de ${rankingCompleto.length}`
          : 'Não ranqueado'
      }\n`;
      resposta += `🎯 *Total de Palpites:* ${totalDePalpites}\n`;
      resposta += `📊 *Taxa de Acerto:* ${taxaDeAcerto}%\n`;

      await this.responderMarcando(client, message, resposta);
    } catch (error) {
      console.error(`Erro no comando ${prefixo}${ComandoPerfil.nome}:`, error);
      await this.responderMarcando(
        client,
        message,
        '❌ Ops! Ocorreu um erro ao buscar seu perfil. Tente novamente mais tarde.'
      );
    }
  }
}
