import { Client, Message, MessageId } from '@open-wa/wa-automate';

export abstract class BaseCommand {
  static nome: string;
  static categoria: string;

  descricao: string;
  guia?: string;

  constructor() {}

  protected async responder(client: Client, message: Message, texto: string) {
    const resp = await client.sendTextWithMentions(message.chatId, texto);
    return resp;
  }

  protected async responderMarcando(
    client: Client,
    message: Message,
    texto: string
  ) {
    const resp = await client.sendReplyWithMentions(
      message.chatId,
      texto,
      message.id
    );
    return resp;
  }

  protected async reagir(client: Client, MessageId: MessageId, emoji: string) {
    await client.react(MessageId, emoji);
  }

  abstract executar(
    client: Client,
    message: Message,
    args?: string[]
  ): Promise<void>;
}

export interface ComandoCarregado {
  nome: string;
  categoria: string;
  descricao: string;
  guia?: string;
  instancia: BaseCommand;
  classeComando?: typeof BaseCommand;
}
