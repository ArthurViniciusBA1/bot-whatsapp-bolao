import { Client, Message, ContactId } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo, RequerAdminUsuario } from '@/decorators';
import { atualizarResultadoJogoESimultaneamenteProcessarPalpites } from '@/modulos';
import { prefixo } from '@/dadosBot';
import { ComandoVerJogosBolao } from './ComandoVerJogosBolao';

/**
 * @class ComandoAtualizarResultadoBolao
 * @classdesc Comando administrativo para atualizar o resultado de um jogo do bolão e processar os palpites.
 * @extends BaseCommand
 */
export class ComandoAtualizarResultadoBolao extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'bolaoresultado';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão Admin';

  /**
   * @constructor
   * @description Cria uma instância do ComandoAtualizarResultadoBolao.
   */
  constructor() {
    super();
    this.descricao =
      'ADMIN: Atualiza o resultado de um jogo do bolão e processa os palpites.';
    this.guia =
      `Uso: _${prefixo}${ComandoAtualizarResultadoBolao.nome} <ID_Jogo_Bolao> <Gols_Casa>x<Gols_Fora>_\n\n` +
      `*Exemplo:* _${prefixo}${ComandoAtualizarResultadoBolao.nome} 1 3x0_\n` +
      '(Para o jogo com ID 1 no bolão deste grupo, o resultado foi 3x0).\n\n' +
      `Use _${prefixo}${ComandoVerJogosBolao.nome}_ para ver os IDs dos jogos abertos.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para atualizar o resultado de um jogo do bolão, processar os palpites
   * e mencionar os usuários que acertaram o placar ou informar se ninguém acertou.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos esperados: [idJogoBolao, placarNoFormato "CasaxFora"].
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  @RequerAdminUsuario
  async executar(
    client: Client,
    message: Message,
    args: string[]
  ): Promise<void> {
    if (args.length < 2) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato incorreto!\n${this.guia}`
      );
      return;
    }

    const idJogoBolaoStr = args[0];
    const placarRealStr = args[1].toLowerCase();

    const idJogoBolao = parseInt(idJogoBolaoStr, 10);
    if (isNaN(idJogoBolao) || idJogoBolao <= 0) {
      await this.responderMarcando(
        client,
        message,
        `❌ O ID do Jogo do Bolão (da nossa base de dados) deve ser um número válido e positivo. Use \`${prefixo}${ComandoVerJogosBolao.nome}\` para listar os jogos e seus IDs.`
      );
      return;
    }

    const placarParts = placarRealStr.split('x');
    if (placarParts.length !== 2) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato do placar incorreto! Use <Gols Casa>x<Gols Fora>, por exemplo: \`3x0\`.\n\n${this.guia}`
      );
      return;
    }

    const placarCasaReal = parseInt(placarParts[0], 10);
    const placarForaReal = parseInt(placarParts[1], 10);

    if (
      isNaN(placarCasaReal) ||
      placarCasaReal < 0 ||
      isNaN(placarForaReal) ||
      placarForaReal < 0
    ) {
      await this.responderMarcando(
        client,
        message,
        '❌ Os gols do resultado devem ser números válidos e não negativos (0, 1, 2, etc.).'
      );
      return;
    }

    try {
      const resultadoServico =
        await atualizarResultadoJogoESimultaneamenteProcessarPalpites(
          idJogoBolao,
          placarCasaReal,
          placarForaReal
        );

      await this.responderMarcando(client, message, resultadoServico.mensagem);

      if (resultadoServico.sucesso) {
        if (
          resultadoServico.acertadores &&
          resultadoServico.acertadores.length > 0
        ) {
          let textoParaMencao =
            '\n🎉 Parabéns aos craques que acertaram o placar:\n\n';
          const jidsParaMencionar: ContactId[] = [];

          resultadoServico.acertadores.forEach((acertador) => {
            textoParaMencao += `@${acertador.idUsuario} \n`;
            jidsParaMencionar.push(acertador.idUsuario as ContactId);
          });
          textoParaMencao = textoParaMencao.trim() + ' 🎯';

          await client.sendTextWithMentions(
            message.chatId,
            textoParaMencao,
            false,
            jidsParaMencionar
          );
        } else {
          await client.sendText(
            message.chatId,
            '🤷‍♂️ Ninguém acertou o placar desta vez! Vocês não sabem nada de bola 😂'
          );
        }
      }
    } catch (error) {
      console.error(
        `Erro ao executar comando ${ComandoAtualizarResultadoBolao.nome}:`,
        error
      ); // Usar nome estático
      if (
        error &&
        typeof error === 'object' &&
        'mensagem' in error &&
        typeof error.mensagem === 'string'
      ) {
        await this.responderMarcando(client, message, error.mensagem);
      } else {
        await this.responderMarcando(
          client,
          message,
          '❌ Ops! Ocorreu um erro interno inesperado ao tentar atualizar o resultado do jogo.'
        );
      }
    }
  }
}
