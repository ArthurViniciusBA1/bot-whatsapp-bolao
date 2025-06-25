import { BaseCommand } from '@/abstracts';
import { prefixo } from '@/dadosBot';
import {
  adicionarUsuario,
  removerUsuario,
  estaNaLista,
} from '@/utils/naoMarcarUsuarios';
import { Client, Message } from '@open-wa/wa-automate';

export class ComandoNaoMeMarque extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'naomemarque';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Utilidades';

  /**
   * @constructor
   * @description Cria uma instância do NaoMeMarqueTodos.
   */
  constructor() {
    super();
    this.guia = `Use ${prefixo}${ComandoNaoMeMarque.nome} para não ser marcado nas mensagens do bot (usar novamente para reativar). OBS: esse comando serve para todos os grupos que o bot está inserido.`;
    this.descricao = `Use ${prefixo}${ComandoNaoMeMarque.nome} para não ser marcado nas mensagens do bot.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para não ser marcado pelo bot em todas as ações de marcação do usuário.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos passados para o comando (usados para uma mensagem opcional).
   * @returns {Promise<void>}
   */
  async executar(
    client: Client,
    message: Message,
    _args: string[]
  ): Promise<void> {
    try {
      const usuario = message.sender.id;
      const nomeUsuario =
        message.sender.pushname || message.sender.name || 'Usuário';

      const jaEstaNaLista = await estaNaLista(usuario);
      let mensagemResposta: string;

      if (!jaEstaNaLista) {
        await adicionarUsuario(usuario);
        mensagemResposta = `✅ *${nomeUsuario}*, você foi adicionado à lista de usuários que não serão marcados pelo bot.\n\nAgora você não receberá mais marcações em nenhum grupo onde o bot está presente.`;
      } else {
        await removerUsuario(usuario);
        mensagemResposta = `🔄 *${nomeUsuario}*, você foi removido da lista de usuários que não são marcados.\n\nAgora você voltará a receber marcações normalmente em todos os grupos.`;
      }

      mensagemResposta += `\n\n💡 Use o comando novamente para alternar esta configuração.`;
      await this.responder(client, message, mensagemResposta);
    } catch (error) {
      console.error('Erro ao executar comando naomemarque:', error);
      const mensagemErro =
        '❌ Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.';
      await this.responder(client, message, mensagemErro);
    }
  }
}
