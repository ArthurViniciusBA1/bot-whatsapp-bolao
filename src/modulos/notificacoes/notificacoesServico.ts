import * as baileys from '@whiskeysockets/baileys';
import { JogoBolaoModel } from '../bolao/bolaoModelos';
import { obterPalpitesPorJogoEGrupo } from '../bolao/bolaoServico';
import { filtrarUsuariosParaMarcar } from '@/utils/utils';
import dayjs from 'dayjs';

const MINUTOS_ANTES_PARA_LEMBRETE = 10;

/**
 * Busca jogos cujo prazo para palpites está prestes a expirar e para os quais
 * uma notificação ainda não foi enviada.
 * @returns Uma lista de jogos que precisam de notificação.
 */
async function obterJogosParaLembrete() {
  const agora = dayjs();
  const limiteSuperior = agora.add(MINUTOS_ANTES_PARA_LEMBRETE, 'minute');

  try {
    const jogos = await JogoBolaoModel.find({
      status: 'AGENDADO',
      notificacaoEnviada: { $ne: true },
      dataLimitePalpite: {
        $gte: agora.toDate(),
        $lte: limiteSuperior.toDate(),
      },
    });
    return jogos;
  } catch (error) {
    console.error('Erro ao buscar jogos para lembrete:', error);
    return [];
  }
}

/**
 * Envia lembretes para os grupos sobre os jogos que estão perto de encerrar os palpites,
 * mencionando apenas os usuários que ainda não palpitaram.
 * @param sock A instância do socket do Baileys.
 */
export async function enviarLembretesDePrazo(sock: baileys.WASocket) {
  const jogosParaLembrar = await obterJogosParaLembrete();
  const botId = sock.authState.creds.me?.id;

  for (const jogo of jogosParaLembrar) {
    try {
      const groupMeta = await sock.groupMetadata(jogo.idGrupo);
      const todosOsMembrosIds = groupMeta.participants.map((p) => p.id);

      const palpitesDoJogo = await obterPalpitesPorJogoEGrupo(jogo.idJogo, jogo.idGrupo);
      const idsDeQuemPalpitou = new Set(palpitesDoJogo.map((p) => p.idUsuario));

      const usuariosQueNaoPalpitaram = todosOsMembrosIds.filter(
        (id) => !idsDeQuemPalpitou.has(id) && id !== botId
      );

      const usuariosParaMarcar = await filtrarUsuariosParaMarcar(usuariosQueNaoPalpitaram);

      if (usuariosParaMarcar.length > 0) {
        const dataLimitePalpite = dayjs(jogo.dataLimitePalpite).tz('America/Sao_Paulo').format('HH:mm');
        
        // No baileys, as menções são feitas no próprio texto e em um array à parte
        const mencoesTexto = usuariosParaMarcar.map((id) => `@${id.split('@')[0]}`).join(' ');

        const mensagem =
          `⏳ *Bora palpitar!* ⏳\n\n` +
          `O prazo para o jogo *${jogo.timeCasa} vs ${jogo.timeFora}* termina às *${dataLimitePalpite}* e você ainda não palpitou!\n\n` +
          `Corre pra mandar seu palpite: \`!palpitar ${jogo.idJogo} <Casa>x<Fora>\`\n\n` +
          `Faltando: ${mencoesTexto}`;

        await sock.sendMessage(jogo.idGrupo, {
            text: mensagem,
            mentions: usuariosParaMarcar // Array com os JIDs a serem mencionados
        });

        console.log(`Lembrete com menções enviado para o jogo ${jogo.idJogo} no grupo ${jogo.idGrupo}.`);
      } else {
        console.log(`Todos palpitaram no jogo ${jogo.idJogo} ou desativaram marcações. Nenhum lembrete enviado.`);
      }

      // Marcar o jogo como notificado para não enviar novamente
      jogo.notificacaoEnviada = true;
      await jogo.save();

    } catch (error) {
      console.error(`Erro ao enviar lembrete para o jogo ${jogo.idJogo}:`, error);
      // Mesmo em caso de erro, marca como notificado para evitar spam em caso de falha persistente
      jogo.notificacaoEnviada = true;
      await jogo.save();
    }
  }
}