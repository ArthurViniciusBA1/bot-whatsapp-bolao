import { Client, Message } from '@open-wa/wa-automate';
import { decryptMedia } from '@open-wa/wa-decrypt';
import { BaseCommand } from '@/abstracts/BaseCommand';
import {
  nomeAutorFigurinhas,
  nomePacoteDeFigurinhas,
  prefixo,
} from '@/dadosBot';

/**
 * @class StickerCommand
 * @classdesc Comando para criar figurinhas a partir de imagens, vídeos ou GIFs.
 * @extends BaseCommand
 */
export class StickerCommand extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 's';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Utilidades'; // Mantido como 'Utilidades' conforme o original, mas pode ser 'Stickers'

  /**
   * @constructor
   * @description Cria uma instância do StickerCommand.
   */
  constructor() {
    super();
    this.descricao = 'Cria uma figurinha a partir de imagem, vídeo ou gif.';
    this.guia = `
  📌 *Comando de Figurinhas — ${prefixo}${StickerCommand.nome}*

Crie figurinhas a partir de imagens, vídeos ou GIFs com opções personalizadas:

🖼️ *Imagem*
• *${prefixo}${StickerCommand.nome}* → Figurinha padrão  
• *!s r* → Figurinha *redonda* • *!s s* → Figurinha *sem manter escala*

🎞️ *Vídeo ou GIF (até 10 segundos)*
• *!s* → Sticker animado *recortado (crop)* • *!s s* → Sem crop, *mantém vídeo original* 💬 *Dica:* Use o comando na legenda da mídia ou responda a uma mídia enviada anteriormente.
`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para criar uma figurinha.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @returns {Promise<void>}
   */
  async executar(client: Client, message: Message): Promise<void> {
    const { isMedia, quotedMsg, caption, body, id, chatId } = message;

    const isSticker = quotedMsg?.type === 'sticker';
    const isValidMedia = isMedia || quotedMsg?.isMedia || isSticker;
    if (!isValidMedia) {
      this.responderMarcando(
        client,
        message,
        '[❗] Envie ou marque uma mídia válida (imagem, vídeo ou figurinha).'
      );
      return;
    }
    const text = caption || body;
    const arg = text.split(' ')[1];
    const stickerMetadata = {
      author: nomeAutorFigurinhas,
      pack: nomePacoteDeFigurinhas,
      keepScale: true,
      circle: false,
    };

    if (arg === 'r') {
      stickerMetadata.circle = true;
      stickerMetadata.keepScale = true;
    } else if (arg === 's') {
      stickerMetadata.keepScale = false;
    } else if (['rs', 'sr'].includes(arg)) {
      stickerMetadata.circle = true;
      stickerMetadata.keepScale = false;
    }

    const alvo = isMedia ? message : quotedMsg!;
    const mediaData = await decryptMedia(alvo);

    const base64 = `data:${alvo.mimetype};base64,${mediaData.toString(
      'base64'
    )}`;

    try {
      if (alvo.type === 'image' || isSticker) {
        await client.sendImageAsStickerAsReply(
          chatId,
          base64,
          id,
          stickerMetadata
        );
      } else if (alvo.type === 'video') {
        if (+alvo.duration > 10) {
          this.responderMarcando(
            client,
            message,
            '[❗] Envie um vídeo/gif com no máximo 10 segundos.'
          );
          return;
        }

        const config = {
          endTime: '00:00:20.0',
          crop: !arg?.includes('s'),
          fps: 15,
          square: 240,
        };

        await client.sendMp4AsSticker(chatId, base64, config, stickerMetadata);
      } else {
        this.responderMarcando(
          client,
          message,
          '[❗] Tipo de mídia não suportado.'
        );
        return;
      }
    } catch (err) {
      console.error(err);
      this.responderMarcando(
        client,
        message,
        '[❗] Erro ao processar imagem. Tente novamente mais tarde.'
      );
      return;
    }
  }
}
