import * as baileys from "@whiskeysockets/baileys";
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
   * @param {WASocket} client - Instância do cliente WA.
   * @param {WAMessage} message - Objeto da mensagem original.
   * @returns {Promise<void>}
   */
  async executar(client: baileys.WASocket, message: baileys.WAMessage): Promise<void> {
    const id = await this.responderMarcando(client, message, 'Tô pertubando');
    await this.reagir(client, message, '👍');
  }
}
