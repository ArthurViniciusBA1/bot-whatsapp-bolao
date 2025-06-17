/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Message } from '@open-wa/wa-automate';
import { JID_DONO } from '../dadosBot';
export function RequerAdminUsuario(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const client = args[0] as Client;
    const message = args[1] as Message;
    const args_transformed = args.slice(2);

    if (JID_DONO && message.sender.id === JID_DONO) {
      return originalMethod.apply(this, [client, message, args_transformed[0]]);
    }

    if (message.isGroupMsg) {
      const anfitriao = message.chat.groupMetadata.participants.find(
        (participant) => (participant.id as any) === message.sender.id
      );
      if (!anfitriao?.isAdmin) {
        await client.reply(
          message.from,
          'Você precisa ser administrador do grupo para usar este comando.',
          message.id
        );
        return;
      }
    } else {
      await client.reply(
        message.from,
        'Este comando é para administradores de grupo e deve ser usado em um grupo.',
        message.id
      );
      return;
    }

    return originalMethod.apply(this, [client, message, args_transformed[0]]);
  };
  return descriptor;
}
