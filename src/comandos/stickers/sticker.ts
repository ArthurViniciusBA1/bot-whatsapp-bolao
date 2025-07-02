import * as baileys from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { BaseCommand } from '@/abstracts';
import { nomeAutorFigurinhas, nomePacoteDeFigurinhas, prefixo } from '@/dadosBot';

export class StickerCommand extends BaseCommand {
  static nome = 's';
  static categoria = 'Utilidades';

  constructor() {
    super();
    this.descricao = 'Cria uma figurinha a partir de imagem, vídeo ou gif.';
    this.guia = `
  📌 *Comando de Figurinhas — ${prefixo}${StickerCommand.nome}*

Crie figurinhas a partir de imagens, vídeos ou GIFs com opções personalizadas:

🖼️ *Imagem*
• *${prefixo}${StickerCommand.nome}* → Figurinha padrão
• *${prefixo}${StickerCommand.nome} r* → Figurinha *redonda*

🎞️ *Vídeo ou GIF (até 10 segundos)*
• *${prefixo}${StickerCommand.nome}* → Sticker animado

💬 *Dica:* Use o comando na legenda da mídia ou responda a uma mídia enviada anteriormente.
`;
  }

  async executar(sock: baileys.WASocket, message: baileys.WAMessage, args: string[]): Promise<void> {
    const jid = message.key.remoteJid!;
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const type = Object.keys(message.message!)[0];
    const quotedType = quoted ? Object.keys(quoted)[0] : null;

    const isMedia = type === 'imageMessage' || type === 'videoMessage';
    const isQuotedMedia = quotedType === 'imageMessage' || quotedType === 'videoMessage';

    if (!isMedia && !isQuotedMedia) {
      await this.responderMarcando(sock, message, '[❗] Envie ou marque uma mídia válida (imagem ou vídeo).');
      return;
    }

    const arg = args[0]?.toLowerCase();
    const stickerMetadata: any = {
      pack: nomePacoteDeFigurinhas,
      author: nomeAutorFigurinhas,
      quality: 50,
      type: StickerTypes.FULL,
    };

    if (arg === 'r') {
        stickerMetadata.type = StickerTypes.CIRCLE;
    }

    try {
        await this.reagir(sock, message, '🎨');

        const messageToDownload = isQuotedMedia ? quoted! : message.message!;
        const mediaType = isQuotedMedia ? quotedType! : type;
        const stream = await baileys.downloadContentFromMessage(messageToDownload[mediaType], mediaType.replace('Message', '') as any);

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const sticker = new Sticker(buffer, stickerMetadata);
        await sock.sendMessage(jid, await sticker.toMessage(), { quoted: message });

    } catch (err) {
        console.error("Erro ao criar sticker:", err);
        await this.responderMarcando(sock, message, '[❗] Erro ao processar a mídia. Tente novamente.');
        await this.reagir(sock, message, '❌');
    }
  }
}