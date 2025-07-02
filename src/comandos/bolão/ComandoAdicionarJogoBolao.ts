import * as baileys from "@whiskeysockets/baileys";
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo, RequerAdminUsuario } from '@/decorators';
import {
  JogoBolao,
  adicionarJogoBolao,
  registrarOuAtualizarPalpite,
} from '@/modulos';
import { NOME_DE_EXIBICAO_BOT, prefixo } from '@/dadosBot';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { gerarGolsAleatoriosComPeso, removerEmojis } from '@/utils/utils';
import { ComandoPalpitarJogo } from './ComandoPalpitarJogo';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);

const FUSO_HORARIO_ENTRADA_ADMIN = 'America/Sao_Paulo';

/**
 * @class ComandoAdicionarJogoBolao
 * @classdesc Comando administrativo para adicionar manualmente um novo jogo ao bolão do grupo.
 * @extends BaseCommand
 */
export class ComandoAdicionarJogoBolao extends BaseCommand {
  static nome = 'addjogo';
  static categoria = 'Bolão Admin';

  constructor() {
    super();
    this.descricao = 'ADMIN: Adiciona manualmente um novo jogo ao bolão do grupo.';
    this.guia =
      `Uso: ${prefixo}${ComandoAdicionarJogoBolao.nome} "<Campeonato>" "<Time Casa>" "<Time Fora>" <Data DD-MM-YYYY> <Hora HH:MM> [Minutos Limite Antes]\n\n` +
      `*Exemplo:* ${prefixo}${ComandoAdicionarJogoBolao.nome} "Brasileirão A" "Atletico-MG" "Cruzeiro" 09-02-2025 16:00 30\n` +
      'Se `[Minutos Limite Antes]` não for informado, o limite será o horário do jogo.';
  }

  @SomenteGrupo
  @RequerAdminUsuario
  async executar(
    sock: baileys.WASocket,
    message: baileys.WAMessage,
    args: string[]
  ): Promise<void> {
    const idGrupo = message.key.remoteJid!;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

    if (args.length < 5) {
      await this.responderMarcando(
        sock,
        message,
        `⚠️ Formato incorreto! São esperados pelo menos 5 argumentos.\n${this.guia}`
      );
      return;
    }

    const [nomeCampeonato, timeCasa, timeFora, dataJogoStr, horaJogoStr, minutosLimiteAntesStr] = args;
    
    // Validações dos argumentos (iguais às que você já tinha)
    const dataHoraJogoEntrada = `${dataJogoStr} ${horaJogoStr}`;
    const dataJogoObjLocal = dayjs(dataHoraJogoEntrada, 'DD-MM-YYYY HH:mm', true);

    if (!dataJogoObjLocal.isValid()) {
      await this.responderMarcando(sock, message,`❌ Data ou hora do jogo inválida: "${dataHoraJogoEntrada}".\nUse o formato DD-MM-AAAA HH:MM.`);
      return;
    }
    
    const dataJogoObjComFuso = dayjs.tz(dataJogoObjLocal.toDate(), FUSO_HORARIO_ENTRADA_ADMIN);
    const agoraNoFusoEntrada = dayjs().tz(FUSO_HORARIO_ENTRADA_ADMIN);

    if (dataJogoObjComFuso.isSameOrBefore(agoraNoFusoEntrada)) {
      await this.responderMarcando(sock, message, `❌ A data e hora do jogo devem ser no futuro.`);
      return;
    }
    
    let minutosLimiteAntes = 0;
    if (minutosLimiteAntesStr) {
      minutosLimiteAntes = parseInt(minutosLimiteAntesStr, 10);
      if (isNaN(minutosLimiteAntes) || minutosLimiteAntes < 0) {
        await this.responderMarcando(sock, message, `❌ Minutos para o limite de palpite inválido.`);
        return;
      }
    }
    
    const dataLimitePalpiteObjComFuso = dataJogoObjComFuso.subtract(minutosLimiteAntes, 'minute');

    const dadosNovoJogo: Omit<JogoBolao, 'idJogo' | 'idGrupo' | 'status' | 'placarCasa' | 'placarFora'> = {
      campeonato: nomeCampeonato,
      timeCasa: timeCasa,
      timeFora: timeFora,
      dataJogo: dataJogoObjComFuso.toDate(),
      dataLimitePalpite: dataLimitePalpiteObjComFuso.toDate(),
    };

    try {
      const jogoAdicionado = await adicionarJogoBolao(idGrupo, dadosNovoJogo);

      const dataJogoExibicao = dayjs(jogoAdicionado.dataJogo).tz(FUSO_HORARIO_ENTRADA_ADMIN).format('DD/MM/YYYY [às] HH:mm');
      const dataLimiteExibicao = dayjs(jogoAdicionado.dataLimitePalpite).tz(FUSO_HORARIO_ENTRADA_ADMIN).format('DD/MM/YYYY [às] HH:mm');

      const mensagemSucessoAdmin =
        `✅ Jogo adicionado ao bolão do grupo!\n\n` +
        `*ID JOGO:* ${jogoAdicionado.idJogo}\n` +
        `🏆 *${jogoAdicionado.campeonato}*\n` +
        `${jogoAdicionado.timeCasa} vs ${jogoAdicionado.timeFora}\n` +
        `🗓️ ${dataJogoExibicao}\n` +
        `🔒 *Limite Palpites:* ${dataLimiteExibicao} (Horário de Brasília)\n\n` +
        `Os usuários podem palpitar usando: ${prefixo}${ComandoPalpitarJogo.nome} ${jogoAdicionado.idJogo} <Casa>x<Fora>`;
      await this.responderMarcando(sock, message, mensagemSucessoAdmin);

      // ***** AQUI ESTÁ A LÓGICA CORRIGIDA *****
      const botJid = sock.authState.creds.me?.id;

      if (!botJid) {
        console.error("Não foi possível obter o JID do bot para o palpite automático.");
        return;
      }
      
      const golsBotCasa = gerarGolsAleatoriosComPeso();
      const golsBotFora = gerarGolsAleatoriosComPeso();

      try {
        await registrarOuAtualizarPalpite({
          idGrupo,
          idUsuario: botJid,
          nomeUsuario: NOME_DE_EXIBICAO_BOT,
          idJogo: jogoAdicionado.idJogo,
          palpiteCasa: golsBotCasa,
          palpiteFora: golsBotFora,
        });
        console.log(`Palpite automático do bot para o jogo ID ${jogoAdicionado.idJogo} (${golsBotCasa}x${golsBotFora}) registrado.`);
      } catch (errorPalpiteBot) {
        console.error(`Erro ao registrar palpite automático do bot para o jogo ID ${jogoAdicionado.idJogo}:`, errorPalpiteBot);
      }

      let msgPalpiteBot = '';
      if (golsBotCasa === golsBotFora) {
        msgPalpiteBot = `Meu palpite é: Empate por ${golsBotCasa}x${golsBotFora}! 👋`;
      } else {
        const timeVencedorNome = golsBotCasa > golsBotFora ? jogoAdicionado.timeCasa : jogoAdicionado.timeFora;
        msgPalpiteBot = `Meu palpite é ${Math.max(golsBotCasa, golsBotFora)}x${Math.min(golsBotCasa, golsBotFora)} para ${removerEmojis(timeVencedorNome)}! 👋`;
      }
      await sock.sendMessage(idGrupo, { text: msgPalpiteBot });

    } catch (error) {
      console.error(`Erro ao adicionar jogo ao bolão do grupo ${idGrupo}:`, error);
      await this.responderMarcando(sock, message, '❌ Ocorreu um erro ao tentar adicionar o jogo ao bolão.');
    }
  }
}