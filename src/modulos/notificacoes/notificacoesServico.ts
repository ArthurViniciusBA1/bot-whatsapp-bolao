import { ChatId, Client, ContactId, GroupChatId } from '@open-wa/wa-automate';
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
 * @param client A instância do cliente do WhatsApp.
 */
export async function enviarLembretesDePrazo(client: Client) {
  const jogosParaLembrar = await obterJogosParaLembrete();

  for (const jogo of jogosParaLembrar) {
    try {
      const todosOsMembros = await client.getGroupMembers(
        jogo.idGrupo as GroupChatId
      );
      const todosOsMembrosIds = todosOsMembros.map((membro) => membro.id);
      const palpitesDoJogo = await obterPalpitesPorJogoEGrupo(
        jogo.idJogo,
        jogo.idGrupo
      );
      const idsDeQuemPalpitou = new Set(palpitesDoJogo.map((p) => p.idUsuario));
      const botId = (await client.getHostNumber()) + '@c.us';
      const usuariosQueNaoPalpitaram = todosOsMembrosIds.filter(
        (id) => !idsDeQuemPalpitou.has(id) && id !== botId
      );

      const usuariosParaMarcar = await filtrarUsuariosParaMarcar(
        usuariosQueNaoPalpitaram
      );

      if (usuariosParaMarcar.length > 0) {
        const dataLimitePalpite = dayjs(jogo.dataLimitePalpite).format('HH:mm');
        let mencoes = '';
        usuariosParaMarcar.forEach((id) => {
          mencoes += `@${id.split('@')[0]} `;
        });

        const mensagem =
          `⏳ *Bora palpitar!* ⏳\n\n` +
          `O prazo para o jogo *${jogo.timeCasa} vs ${jogo.timeFora}* termina às *${dataLimitePalpite}* e você ainda não palpitou!\n\n` +
          `Corre pra mandar seu palpite: \`!palpitar ${jogo.idJogo} <Casa>x<Fora>\`\n\n` +
          `Faltando: ${mencoes}`;

        await client.sendTextWithMentions(
          jogo.idGrupo as ChatId,
          mensagem,
          false,
          usuariosParaMarcar as ContactId[]
        );

        console.log(
          `Lembrete com menções enviado para o jogo ${jogo.idJogo} no grupo ${jogo.idGrupo}.`
        );
      } else {
        console.log(
          `Todos palpitaram no jogo ${jogo.idJogo} ou desativaram marcações. Nenhum lembrete enviado.`
        );
      }

      jogo.notificacaoEnviada = true;
      await jogo.save();
    } catch (error) {
      console.error(
        `Erro ao enviar lembrete para o jogo ${jogo.idJogo}:`,
        error
      );
      jogo.notificacaoEnviada = true;
      await jogo.save();
    }
  }
}
