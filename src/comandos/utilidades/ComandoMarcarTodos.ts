import * as baileys from "@whiskeysockets/baileys";
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
    this.guia = `Use ${prefixo}${ComandoMarcarTodos.nome} <mensagem opcional> para mencionar todos os membros do grupo. Cuidado ao usar em grupos grandes!`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para mencionar todos os membros do grupo.
   * @param {WASocket} sock - Instância do socket Baileys.
   * @param {WAMessage} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos passados para o comando (usados para uma mensagem opcional).
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  @RequerAdminUsuario
  async executar(
    sock: baileys.WASocket,
    message: baileys.WAMessage,
    args: string[]
  ): Promise<void> {
    const chatId = message.key.remoteJid!;

    try {
      // Busca os metadados do grupo
      const groupMetadata = await sock.groupMetadata(chatId);
      const participants = groupMetadata.participants;
      
      // Mapeia para obter uma lista de JIDs completos
      const todosJids = participants.map(p => p.id);

      // Filtra usuários que não devem ser marcados
      const jidsParaMencionar = await filtrarUsuariosParaMarcar(todosJids);
      
      if (jidsParaMencionar.length === 0) {
        await this.responder(
          sock,
          message,
          '🤔 Nenhum membro encontrado para mencionar (todos podem ter desativado as marcações).'
        );
        return;
      }
      
      // ***** AQUI ESTÁ A CORREÇÃO *****
      // Cria o texto de menção usando apenas a parte numérica do JID
      const mencoesTexto = jidsParaMencionar.map(jid => `@${jid.split('@')[0]}`).join(' ');

      const mensagemOpcional = args.join(' ');
      let textoFinal = '';

      if (mensagemOpcional) {
        textoFinal = `${mensagemOpcional}\n\n${mencoesTexto}`;
      } else {
        textoFinal = `📢 Chamando todos!\n\n${mencoesTexto}`;
      }

      // Adiciona informação sobre usuários filtrados
      const usuariosFiltrados = todosJids.length - jidsParaMencionar.length;
      if (usuariosFiltrados > 0) {
        textoFinal += `\n\n_ℹ️ ${usuariosFiltrados} usuário(s) não foram marcados pois desativaram as marcações._`;
      }

      // Envia a mensagem com o texto corrigido e o array de JIDs completos para o Baileys
      await sock.sendMessage(
        chatId,
        { 
          text: textoFinal.trim(), 
          mentions: jidsParaMencionar // Array de JIDs completos
        }
      );

    } catch (error) {
      console.error(`Erro no comando ${ComandoMarcarTodos.nome}:`, error);
      await this.responderMarcando(
        sock,
        message,
        '❌ Ops! Ocorreu um erro ao tentar mencionar todos os membros.'
      );
    }
  }
}