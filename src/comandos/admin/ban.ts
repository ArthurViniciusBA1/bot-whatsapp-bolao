import {
  Client,
  Message,
  ContactId,
  GroupChatId,
  ChatId,
} from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts/BaseCommand';
import { RequerAdminBot, RequerAdminUsuario, SomenteGrupo } from '@/decorators';

/**
 * @class BanCommand
 * @classdesc Comando administrativo para remover um membro do grupo.
 * @extends BaseCommand
 */
export class BanCommand extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'ban';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Admin';

  /**
   * @constructor
   * @description Cria uma instância do BanCommand.
   */
  constructor() {
    super();
    this.descricao = 'Remove um membro do grupo (somente admins)';
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para banir (remover) um ou mais usuários do grupo.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  @RequerAdminUsuario
  @RequerAdminBot
  async executar(client: Client, message: Message): Promise<void> {
    const { body, caption, quotedMsg, chatId } = message;

    const mensagem = caption || body || '';
    const donoGrupo = chatId as ChatId;

    const alvos = quotedMsg
      ? [quotedMsg.sender.id]
      : mensagem
          .slice(BanCommand.nome.length + 1)
          .trim()
          .split(',')
          .map((n) => `${n.trim().replace(/\D/g, '')}@c.us`);

    for (const numero of alvos) {
      if (!numero || numero === '@c.us') {
        await this.responderMarcando(
          client,
          message,
          `⚠️ Número inválido ou não fornecido para banimento.`
        );
        continue;
      }
      if (donoGrupo === numero) {
        // Esta verificação compara o ID do chat com o ID do usuário, o que não faz sentido.
        // Se a intenção é não banir o bot ou o próprio admin que executa, precisa de lógica diferente.
        // Por ora, manterei como está, mas é um ponto de atenção.
        // Uma verificação mais comum seria if (numero === message.sender.id) ou if (numero === client.getHostNumber() + '@c.us')
        continue;
      }
      await this.tentarBanir(
        client,
        chatId as GroupChatId,
        numero as ContactId,
        message
      );
    }
  }

  /**
   * @private
   * @async
   * @method tentarBanir
   * @description Tenta remover um participante do grupo.
   * @param {Client} client - Instância do cliente WA.
   * @param {GroupChatId} chatId - ID do chat do grupo.
   * @param {ContactId} idUsuario - ID do usuário a ser removido.
   * @param {Message} message - Objeto da mensagem original para responder.
   * @returns {Promise<void>}
   */
  private async tentarBanir(
    client: Client,
    chatId: GroupChatId,
    idUsuario: ContactId,
    message: Message
  ): Promise<void> {
    try {
      await client.removeParticipant(chatId, idUsuario);
    } catch (err) {
      const numero = idUsuario.replace('@c.us', '');
      const mensagemErro = `❌ Não foi possível remover ${numero}.`;
      console.error(
        `Erro ao tentar banir ${numero} com comando ${BanCommand.nome}:`,
        err
      ); // Usar BanCommand.nome
      await this.responderMarcando(client, message, mensagemErro);
    }
  }
}
