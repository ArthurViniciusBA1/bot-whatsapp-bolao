import * as baileys from "@whiskeysockets/baileys";
import { JID_DONO } from '../dadosBot';

export function RequerAdminUsuario(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (sock: baileys.WASocket, message: baileys.WAMessage, ...args: any[]) {
    const jid = message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;

    if (!jid || !jid.endsWith('@g.us')) {
        await sock.sendMessage(jid!, { text: 'Este comando é para administradores e deve ser usado em um grupo.'}, { quoted: message });
        return;
    }
    
    if (JID_DONO && senderId === JID_DONO) {
        return originalMethod.apply(this, [sock, message, ...args]);
    }
    
    const groupMeta = await sock.groupMetadata(jid);
    const participant = groupMeta.participants.find(p => p.id === senderId);

    if (participant?.admin !== 'admin' && participant?.admin !== 'superadmin') {
      await sock.sendMessage(jid, { text: '❌ Você precisa ser administrador do grupo para usar este comando.' }, { quoted: message });
      return;
    }

    return originalMethod.apply(this, [sock, message, ...args]);
  };
  return descriptor;
}