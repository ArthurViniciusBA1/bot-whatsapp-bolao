import { Client, Message, MessageId } from '@open-wa/wa-automate';
import { BaseCommand } from '../../abstracts/BaseCommand';

/**
 * @class PingCommand
 * @classdesc Comando para verificar se o bot está online, respondendo com "Pong!".
 * @extends BaseCommand
 */
export class PingCommand extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'ping';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Utilidades';

  /**
   * @constructor
   * @description Cria uma instância do PingCommand.
   */
  constructor() {
    super();
    this.descricao = 'Responde com Pong!';
    this.guia =
      'Comando para verificar se o bot está online, respondendo com "Pong!".';
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando ping, respondendo "Pong!" para o usuário.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @returns {Promise<void>}
   */
  async executar(client: Client, message: Message): Promise<void> {
    const id = await this.responderMarcando(client, message, 'Pong!');
    await this.reagir(client, id as MessageId, '👍');
  }
}
