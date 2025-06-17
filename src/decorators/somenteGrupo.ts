/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Message } from '@open-wa/wa-automate';

export function SomenteGrupo(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const metodoOriginal = descriptor.value;

  descriptor.value = async function (
    client: Client,
    message: Message,
    ...args: any[]
  ) {
    if (!message.isGroupMsg) {
      await client.reply(
        message.chatId,
        '❌ Este comando só pode ser usado em grupos.',
        message.id
      );
      return;
    }

    return metodoOriginal.apply(this, [client, message, ...args]);
  };
}
