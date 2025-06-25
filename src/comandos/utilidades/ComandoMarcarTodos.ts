import { Client, Message, ContactId } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts';
import { RequerAdminUsuario, SomenteGrupo } from '@/decorators';
import { prefixo } from '@/dadosBot';
import { filtrarUsuariosParaMarcar } from '@/utils/utils';

/**
 * @class ComandoMarcarTodos
 * @classdesc Comando para mencionar todos os membros de um grupo.
 * @extends BaseCommand
 */
export class ComandoMarcarTodos extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'mt';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Utilidades';

  /**
   * @constructor
   * @description Cria uma instância do ComandoMarcarTodos.
   */
  constructor() {
    super();
    this.descricao = 'Menciona todos os membros do grupo.';
    this.guia = `Use ${prefixo}${ComandoMarcarTodos.nome} para mencionar todos os membros do grupo. Cuidado ao usar em grupos grandes!`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para mencionar todos os membros do grupo.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos passados para o comando (usados para uma mensagem opcional).
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  @RequerAdminUsuario
  async executar(
    client: Client,
    message: Message,
    args: string[]
  ): Promise<void> {
    const chatId = message.chatId;

    try {
      const groupMetadata = message.chat.groupMetadata;
      if (!groupMetadata || !groupMetadata.participants) {
        await this.responder(
          client,
          message,
          '❌ Não foi possível obter os membros do grupo.'
        );
        return;
      }

      const participants = groupMetadata.participants;
      const todosJids: string[] = [];

      // Coleta todos os JIDs dos participantes
      participants.forEach((participant) => {
        const jid =
          typeof participant.id === 'string'
            ? participant.id
            : participant.id._serialized;
        if (jid) {
          todosJids.push(jid);
        }
      });

      // Filtra usuários que não devem ser marcados
      const jidsParaMencionar = await filtrarUsuariosParaMarcar(todosJids);
      
      if (jidsParaMencionar.length === 0) {
        await this.responder(
          client,
          message,
          '🤔 Nenhum membro encontrado para mencionar (todos os membros podem ter desativado as marcações).'
        );
        return;
      }

      // Constrói o texto da mensagem com as menções
      let textoMensagem = '';
      const jidsContactId: ContactId[] = [];

      jidsParaMencionar.forEach((jid) => {
        textoMensagem += `@${jid} `;
        jidsContactId.push(jid as ContactId);
      });

      const mensagemOpcional = args.join(' ');
      if (mensagemOpcional) {
        textoMensagem = `${mensagemOpcional}\n\n${textoMensagem}`;
      } else {
        textoMensagem = `📢 Chamando todos! ${textoMensagem}`;
      }

      // Adiciona informação sobre usuários filtrados
      const usuariosFiltrados = todosJids.length - jidsParaMencionar.length;
      if (usuariosFiltrados > 0) {
        textoMensagem += `\n\nℹ️ ${usuariosFiltrados} usuário(s) não foram marcados pois desativaram as marcações.`;
      }

      await client.sendTextWithMentions(
        chatId,
        textoMensagem.trim(),
        false,
        jidsContactId
      );
    } catch (error) {
      console.error(`Erro no comando ${ComandoMarcarTodos.nome}:`, error);
      await this.responderMarcando(
        client,
        message,
        '❌ Ops! Ocorreu um erro ao tentar mencionar todos os membros.'
      );
    }
  }
}
