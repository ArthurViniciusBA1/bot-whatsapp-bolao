// import * as baileys from "@whiskeysockets/baileys";
// import { BaseCommand } from '@/abstracts';
// import { SomenteGrupo, RequerAdminUsuario, RequerAdminBot } from '@/decorators';

import { BaseCommand } from "@/abstracts";
import * as baileys from "@whiskeysockets/baileys";

// /**
//  * @class AddCommand
//  * @classdesc Comando administrativo para adicionar um usuário ao grupo ou enviar convite, se necessário.
//  * @extends BaseCommand
//  */
// export class AddCommand extends BaseCommand {
//   /**
//    * @static
//    * @property {string} nome - O nome do comando.
//    */
//   static nome = 'add';
//   /**
//    * @static
//    * @property {string} categoria - A categoria do comando.
//    */
//   static categoria = 'Admin';

//   /**
//    * @constructor
//    * @description Cria uma instância do AddCommand.
//    */
//   constructor() {
//     super();
//     this.descricao =
//       'Adiciona um usuário ao grupo ou envia convite, se necessário.';
//   }

//   /**
//    * @async
//    * @method executar
//    * @description Executa o comando para adicionar um ou mais usuários ao grupo.
//    * @param {WASocket} client - Instância do cliente WA.
//    * @param {WAMessage} message - Objeto da mensagem original.
//    * @returns {Promise<void>}
//    */
//   @SomenteGrupo
//   @RequerAdminUsuario
//   @RequerAdminBot
//   async executar(client: WASocket, message: WAMessage): Promise<void> {
//     const { chatId, quotedMsg, body } = message;

//     const numeros: string[] = [];

//     if (quotedMsg?.sender?.id) {
//       numeros.push(quotedMsg.sender.id.replace('@c.us', ''));
//     }

//     const extras = body
//       .slice(AddCommand.nome.length + 1)
//       .trim()
//       .split(',');
//     extras.forEach((num) => {
//       const limpo = num.replace(/\D/g, '');
//       if (limpo && !numeros.includes(limpo)) {
//         numeros.push(limpo);
//       }
//     });

//     if (numeros.length === 0) {
//       this.responderMarcando(
//         client,
//         message,
//         '⚠️ Nenhum número válido fornecido.'
//       );
//       return;
//     }

//     for (const numero of numeros) {
//       const idUsuario = `${numero}@c.us` as ContactId;

//       try {
//         const participantes = await client.getGroupMembers(
//           chatId as GroupChatId
//         );
//         const jaEstaNoGrupo = participantes.some((p) => p.id === idUsuario);

//         if (jaEstaNoGrupo) {
//           await this.responderMarcando(
//             client,
//             message,
//             `⚠️ O número ${numero} já está no grupo.`
//           );
//           continue;
//         }

//         await client.addParticipant(chatId as GroupChatId, idUsuario);

//         await this.responderMarcando(
//           client,
//           message,
//           `✅ ${numero} adicionado com sucesso.`
//         );
//       } catch (err) {
//         console.error(
//           `🔍 Erro ao adicionar participante com comando ${AddCommand.nome}:`,
//           err
//         );

//         const mensagemErro = `❌ O número ${numero} não pôde ser adicionado.`;
//         await this.responderMarcando(client, message, mensagemErro);
//       }
//     }
//   }
// }

// Em manutenção temporária deste comando.
export class AddCommand extends BaseCommand {
  static nome = 'add';
  static categoria = 'Admin';

  constructor() {
    super();
    this.descricao = 'Adiciona um membro ao grupo (somente admins)';
  }

  async executar(client: baileys.WASocket, message: baileys.WAMessage) {
    await this.responderMarcando(client, message, 'Em manutenção');
  }
}


