import { Client, ContactId, GroupChatId, Message } from '@open-wa/wa-automate';

export function RequerAdminBot(
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
    const botNumber = await client.getHostNumber();
    const botId = `${botNumber}@c.us`;
    const groupAdmins = await client.getGroupAdmins(
      message.chatId as GroupChatId
    );

    if (!groupAdmins.includes(botId as ContactId)) {
      await client.reply(
        message.chatId,
        '❌ O bot precisa ser admin do grupo para executar este comando.',
        message.id
      );
      return;
    }

    return metodoOriginal.apply(this, [client, message, ...args]);
  };
}
