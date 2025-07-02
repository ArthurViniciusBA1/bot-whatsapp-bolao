import * as baileys from '@whiskeysockets/baileys';

export abstract class BaseCommand {
  static nome: string;
  static categoria: string;

  descricao: string;
  guia?: string;

  constructor() {}

  protected async responder(sock: baileys.WASocket, message: baileys.WAMessage, texto: string) {
    const jid = message.key.remoteJid!;
    return sock.sendMessage(jid, { text: texto });
  }

  protected async responderMarcando(sock: baileys.WASocket, message: baileys.WAMessage, texto: string) {
    const jid = message.key.remoteJid!;
    return sock.sendMessage(jid, { text: texto }, { quoted: message });
  }

  protected async reagir(sock: baileys.WASocket, message: baileys.WAMessage, emoji: string) {
    const jid = message.key.remoteJid!;
    return sock.sendMessage(jid, {
      react: {
        text: emoji,
        key: message.key,
      },
    });
  }

  // A assinatura do executar muda para refletir os novos parâmetros
  abstract executar(
    sock: baileys.WASocket,
    message: baileys.WAMessage,
    args?: string[]
  ): Promise<void>;

  // Métodos utilitários para blindar acesso ao Baileys
  protected getTextFromMessage(message: baileys.WAMessage): string | null {
    if (message.message?.conversation) return message.message.conversation;
    if (message.message?.extendedTextMessage?.text) return message.message.extendedTextMessage.text;
    if (message.message?.imageMessage?.caption) return message.message.imageMessage.caption;
    if (message.message?.videoMessage?.caption) return message.message.videoMessage.caption;
    return null;
  }

  protected getSenderJid(message: baileys.WAMessage): string {
    return message.key.participant || message.key.remoteJid!;
  }

  protected getSenderName(message: baileys.WAMessage): string {
    return (message.pushName as string) || this.getSenderJid(message).split('@')[0];
  }

  protected getChatJid(message: baileys.WAMessage): string {
    return message.key.remoteJid!;
  }

  protected getQuotedMessage(message: baileys.WAMessage): any {
    return message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  }
}

export interface ComandoCarregado {
  nome: string;
  categoria: string;
  descricao: string;
  guia?: string;
  instancia: BaseCommand;
  classeComando?: typeof BaseCommand;
}