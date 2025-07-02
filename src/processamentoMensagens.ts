import type * as baileys from '@whiskeysockets/baileys';
import { ComandoCarregado } from '@/abstracts';
import { prefixo } from 'dadosBot';

/**
 * Extrai o texto de um objeto de mensagem, independentemente do tipo (texto, imagem com legenda, etc.).
 * @param msg O objeto da mensagem do Baileys.
 * @returns A string do texto ou null se não houver.
 */
const getTextFromMessage = (msg: baileys.WAMessage): string | null => {
  if (msg.message?.conversation) {
    return msg.message.conversation;
  }
  if (msg.message?.extendedTextMessage?.text) {
    return msg.message.extendedTextMessage.text;
  }
  if (msg.message?.imageMessage?.caption) {
    return msg.message.imageMessage.caption;
  }
  if (msg.message?.videoMessage?.caption) {
    return msg.message.videoMessage.caption;
  }
  return null;
};

/**
 * Função principal que escuta e processa todas as mensagens recebidas.
 * @param sock O socket do Baileys.
 * @param upsert O evento de mensagem do Baileys.
 * @param comandos A lista de comandos carregados.
 */
export const escuta = async (
  sock: baileys.WASocket,
  upsert: { messages: baileys.WAMessage[]; type: any },
  comandos: ComandoCarregado[]
) => {
  for (const msg of upsert.messages) {
    if (!msg.message || msg.key.fromMe) {
      continue;
    }

    const text = getTextFromMessage(msg);
    if (text === null || !text.startsWith(prefixo)) {
      continue;
    }

    const commandParts = text.slice(prefixo.length).trim().split(/\s+/);
    const comandoNome = commandParts.shift()?.toLowerCase();
    const args = commandParts;
    const jid = msg.key.remoteJid!;

    if (!comandoNome) return;

    // Trata o comando !ajuda separadamente
    if (comandoNome === 'ajuda') {
      await comandoAjuda(sock, msg, comandos);
      continue; // Pula para a próxima mensagem
    }

    const comandoEncontrado = comandos.find((cmd) => cmd.nome.toLowerCase() === comandoNome);
    if (comandoEncontrado) {
      try {
        await comandoEncontrado.instancia.executar(sock, msg, args);
      } catch (err) {
        console.error(`Erro ao executar comando '${comandoEncontrado.nome}':`, err);
        await sock.sendMessage(jid, { text: `❌ Ops! Ocorreu um erro ao executar o comando ${comandoEncontrado.nome}.` }, { quoted: msg });
      }
    } else {
      await sock.sendMessage(jid, { text: `❌ Comando não encontrado! Use ${prefixo}ajuda para ver os comandos disponíveis.` }, { quoted: msg });
    }
  }
};

/**
 * Lida com a lógica do comando !ajuda.
 * @param sock O socket do Baileys.
 * @param message A mensagem original que chamou o comando.
 * @param comandos A lista de todos os comandos disponíveis.
 */
async function comandoAjuda(
  sock: baileys.WASocket,
  message: baileys.WAMessage,
  comandos: ComandoCarregado[]
) {
  const jid = message.key.remoteJid!;
  const text = getTextFromMessage(message) || '';
  const partes = text.trim().split(' ');
  const argumento = partes[1]?.toLowerCase();

  // Se o usuário pediu ajuda para um comando específico (ex: !ajuda s)
  if (argumento) {
    const comando = comandos.find((c) => c.nome.toLowerCase() === argumento);
    if (comando) {
      const resposta = comando.guia
        ? comando.guia
        : `ℹ️ O comando *${prefixo}${comando.nome}* não possui um guia detalhado, mas sua função é: ${comando.descricao}`;
      await sock.sendMessage(jid, { text: resposta }, { quoted: message });
    } else {
      await sock.sendMessage(jid, { text: `❌ Comando *${argumento}* não encontrado. Use ${prefixo}ajuda para ver a lista completa.` }, { quoted: message });
    }
    return;
  }

  // Se o usuário pediu a lista geral de ajuda
  let resposta = '📜 *Comandos disponíveis:*\n\n';
  resposta += `Para ver detalhes de um comando, use ${prefixo}ajuda <nome_do_comando>\n\n`;

  const agrupadoPorCategoria = new Map<string, ComandoCarregado[]>();

  for (const comando of comandos) {
    const categoria = comando.categoria || 'Outros';
    if (!agrupadoPorCategoria.has(categoria)) {
      agrupadoPorCategoria.set(categoria, []);
    }
    agrupadoPorCategoria.get(categoria)!.push(comando);
  }

  // Ordena as categorias para uma exibição consistente
  const categoriasOrdenadas = Array.from(agrupadoPorCategoria.keys()).sort();

  for (const categoria of categoriasOrdenadas) {
    const comandosDaCategoria = agrupadoPorCategoria.get(categoria)!;
    resposta += `🔹 *${categoria.toUpperCase()}*\n`;
    for (const comando of comandosDaCategoria) {
      resposta += `  *${prefixo}${comando.nome}* – ${comando.descricao}\n`;
    }
    resposta += '\n';
  }

  await sock.sendMessage(jid, { text: resposta.trim() });
}