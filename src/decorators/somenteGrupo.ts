import * as baileys from "@whiskeysockets/baileys";

export function SomenteGrupo(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const metodoOriginal = descriptor.value;

  descriptor.value = async function (sock: baileys.WASocket, message: baileys.WAMessage, ...args: any[]) {
    const jid = message.key.remoteJid;
    if (!jid || !jid.endsWith('@g.us')) {
      await sock.sendMessage(jid!, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: message });
      return;
    }

    return metodoOriginal.apply(this, [sock, message, ...args]);
  };
}