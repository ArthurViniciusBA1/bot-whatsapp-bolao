import { Client, Message } from '@open-wa/wa-automate';
import { ComandoCarregado } from '@/abstracts';
import { prefixo } from 'dadosBot';

export const escuta = (client: Client, comandos: ComandoCarregado[]) => {
  client.onMessage(async (message: Message) => {
    const { body, caption } = message;
    const text = caption || body || '';

    if (!text.startsWith(prefixo)) return;

    const commandParts = text.slice(prefixo.length).trim().split(/\s+/);
    const comandoNome = commandParts.shift()?.toLowerCase();

    if (!comandoNome) return;

    const comandoEncontrado = comandos.find((cmd) => cmd.nome === comandoNome);
    const args = commandParts;

    if (comandoNome === 'ajuda') {
      await comandoAjuda(client, message, comandos);
      return;
    }

    if (comandoEncontrado) {
      try {
        await comandoEncontrado.instancia.executar(client, message, args);
      } catch (err) {
        console.error(
          `Erro ao executar comando '${comandoEncontrado.nome}':`,
          err
        );
        await client.reply(
          message.chatId,
          `❌ Ops! Ocorreu um erro ao tentar executar o comando ${comandoEncontrado.nome}.`,
          message.id
        );
      }
    } else {
      await client.sendText(
        message.from,
        `❌ Comando não encontrado! Use ${prefixo}ajuda para ver os comandos disponíveis.`
      );
    }
  });
};

async function comandoAjuda(
  client: Client,
  message: Message,
  comandos: ComandoCarregado[]
) {
  const partes = (message.body || '').trim().split(' ');
  const argumento = partes[1]?.toLowerCase();

  if (argumento) {
    const comando = comandos.find((c) => c.nome.toLowerCase() === argumento);
    if (comando) {
      const resposta = comando.guia
        ? comando.guia
        : `ℹ️ O comando *${prefixo}${comando.nome}* não possui um guia detalhado.`;
      return client.sendText(message.from, resposta);
    } else {
      return client.sendText(
        message.from,
        `❌ Comando *${argumento}* não encontrado. Use ${prefixo}ajuda para ver os comandos disponíveis.`
      );
    }
  }

  let resposta = '📜 *Comandos disponíveis:*\n';

  const agrupadoPorCategoria = new Map<string, ComandoCarregado[]>();

  for (const comando of comandos) {
    const categoria = comando.categoria || 'Outros';
    if (!agrupadoPorCategoria.has(categoria)) {
      agrupadoPorCategoria.set(categoria, []);
    }
    agrupadoPorCategoria.get(categoria)!.push(comando);
  }

  for (const [
    categoria,
    comandosDaCategoria,
  ] of agrupadoPorCategoria.entries()) {
    resposta += `\n🔹 *${categoria.toUpperCase()}*\n`;
    for (const comando of comandosDaCategoria) {
      resposta += `*${prefixo}${comando.nome}* – ${comando.descricao}\n`;
    }
  }

  await client.sendText(message.from, resposta.trim());
}
