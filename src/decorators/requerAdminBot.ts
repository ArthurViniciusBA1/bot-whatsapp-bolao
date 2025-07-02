import * as baileys from "@whiskeysockets/baileys";

export function RequerAdminBot(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const metodoOriginal = descriptor.value;

  descriptor.value = async function (sock: baileys.WASocket, message: baileys.WAMessage, ...args: any[]) {
    const jid = message.key.remoteJid;
    if (!jid || !jid.endsWith('@g.us')) return;

    const botId = sock.authState.creds.me?.id;
    if (!botId) return; // Não deveria acontecer se o bot está conectado

    const groupMeta = await sock.groupMetadata(jid);
    const botParticipant = groupMeta.participants.find(p => p.id === botId);

    if (botParticipant?.admin !== 'admin' && botParticipant?.admin !== 'superadmin') {
      await sock.sendMessage(jid, { text: '❌ O bot precisa ser admin do grupo para executar este comando.' }, { quoted: message });
      return;
    }

    return metodoOriginal.apply(this, [sock, message, ...args]);
  };
}