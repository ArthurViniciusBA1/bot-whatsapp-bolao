import { Client, Message } from '@open-wa/wa-automate';
import { BaseCommand } from '@/abstracts'; // Ajuste o caminho
import { SomenteGrupo, RequerAdminUsuario } from '@/decorators'; // Ajuste o caminho
import {
  JogoBolao,
  adicionarJogoBolao,
  registrarOuAtualizarPalpite,
} from '@/modulos'; // Ajuste o caminho
import { NOME_DE_EXIBICAO_BOT, prefixo } from '@/dadosBot'; // Ajuste o caminho

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { gerarGolsAleatoriosComPeso, removerEmojis } from 'utils/utils'; // Ajuste o caminho
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
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'addjogo';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão Admin';

  /**
   * @constructor
   * @description Cria uma instância do ComandoAdicionarJogoBolao.
   */
  constructor() {
    super();
    this.descricao =
      'ADMIN: Adiciona manualmente um novo jogo ao bolão do grupo.';
    this.guia =
      `Uso: ${prefixo}${ComandoAdicionarJogoBolao.nome} "<Campeonato>" "<Time Casa>" "<Time Fora>" <Data DD-MM-YYYY> <Hora HH:MM> [Minutos Limite Antes]\n\n` +
      `*Exemplo:* ${prefixo}${ComandoAdicionarJogoBolao.nome} "Brasileirão A" "Atletico-MG" "Cruzeiro" 09-02-2025 16:00 30\n` +
      'Se `[Minutos Limite Antes]` não for informado, o limite será o horário do jogo.';
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para adicionar um jogo ao bolão.
   * @param {Client} client - Instância do cliente WA.
   * @param {Message} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos do comando.
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  @RequerAdminUsuario
  async executar(
    client: Client,
    message: Message,
    args: string[]
  ): Promise<void> {
    const idGrupo = message.chatId;

    if (
      !args ||
      args.length === 0 ||
      (args.length === 1 && args[0].trim() === '')
    ) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato incorreto. Nenhum argumento fornecido.\n${this.guia}`
      );
      return;
    }
    const comandoCompleto = message.body
      .substring(
        message.body.toLowerCase().indexOf(ComandoAdicionarJogoBolao.nome) +
          ComandoAdicionarJogoBolao.nome.length
      )
      .trim();
    const regexArgs = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
    const argumentosParseados = comandoCompleto.match(regexArgs);
    if (!argumentosParseados) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato incorreto. Argumentos não puderam ser lidos.\n${this.guia}`
      );
      return;
    }
    if (argumentosParseados.length < 5 || argumentosParseados.length > 6) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato incorreto ou número inválido de argumentos (${argumentosParseados.length} fornecidos). São esperados de 5 a 6. Use aspas para nomes com espaços.\n${this.guia}`
      );
      return;
    }
    const limparAspas = (str: string) => str.replace(/^["']|["']$/g, '');
    const nomeCampeonato = limparAspas(argumentosParseados[0]);
    const timeCasa = limparAspas(argumentosParseados[1]);
    const timeFora = limparAspas(argumentosParseados[2]);
    const dataJogoStr = limparAspas(argumentosParseados[3]);
    const horaJogoStr = limparAspas(argumentosParseados[4]);
    const minutosLimiteAntesStr = argumentosParseados[5];
    if (
      !nomeCampeonato ||
      !timeCasa ||
      !timeFora ||
      !dataJogoStr ||
      !horaJogoStr
    ) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Todos os campos obrigatórios (Campeonato, Time Casa, Time Fora, Data, Hora) devem ser preenchidos.\n${this.guia}`
      );
      return;
    }
    const dataHoraJogoEntrada = `${dataJogoStr} ${horaJogoStr}`;
    const dataJogoObjLocal = dayjs(
      dataHoraJogoEntrada,
      'DD-MM-YYYY HH:mm',
      true
    );
    if (!dataJogoObjLocal.isValid()) {
      await this.responderMarcando(
        client,
        message,
        `❌ Data ou hora do jogo inválida: "${dataHoraJogoEntrada}".\nCertifique-se de usar o formato DD-MM-AAAA para data (ex: 30-05-2025) e HH:MM para hora (ex: 16:00).`
      );
      return;
    }
    const dataJogoObjComFuso = dayjs.tz(
      dataJogoObjLocal.toDate(),
      FUSO_HORARIO_ENTRADA_ADMIN
    );
    if (!dataJogoObjComFuso.isValid()) {
      await this.responderMarcando(
        client,
        message,
        `❌ Erro interno ao processar o fuso horário da data do jogo.`
      );
      return;
    }
    const agoraNoFusoEntrada = dayjs().tz(FUSO_HORARIO_ENTRADA_ADMIN);
    if (dataJogoObjComFuso.isSameOrBefore(agoraNoFusoEntrada)) {
      await this.responderMarcando(
        client,
        message,
        `❌ A data e hora do jogo (${dataJogoObjComFuso.format('DD/MM/YYYY HH:mm')}) devem ser no futuro.`
      );
      return;
    }
    let minutosLimiteAntes = 0;
    if (minutosLimiteAntesStr) {
      minutosLimiteAntes = parseInt(limparAspas(minutosLimiteAntesStr), 10);
      if (isNaN(minutosLimiteAntes) || minutosLimiteAntes < 0) {
        await this.responderMarcando(
          client,
          message,
          `❌ Minutos para o limite de palpite inválido. Deve ser um número não negativo.`
        );
        return;
      }
    }
    const dataLimitePalpiteObjComFuso = dataJogoObjComFuso.subtract(
      minutosLimiteAntes,
      'minute'
    );
    const dadosNovoJogo: Omit<
      JogoBolao,
      'idJogo' | 'idGrupo' | 'status' | 'placarCasa' | 'placarFora'
    > = {
      idJogoApi: null,
      campeonato: nomeCampeonato,
      timeCasa: timeCasa,
      timeFora: timeFora,
      dataJogo: dataJogoObjComFuso.toISOString() as unknown as Date,
      dataLimitePalpite:
        dataLimitePalpiteObjComFuso.toISOString() as unknown as Date,
    };

    try {
      const jogoAdicionado = await adicionarJogoBolao(idGrupo, dadosNovoJogo);

      if (
        !jogoAdicionado ||
        !jogoAdicionado.timeCasa ||
        !jogoAdicionado.timeFora
      ) {
        console.error(
          '[ERRO INTERNO] Jogo adicionado retornado sem nome de times ou nulo:',
          jogoAdicionado
        );
        await this.responderMarcando(
          client,
          message,
          '⚠️ Jogo adicionado, mas houve um problema ao obter os detalhes para a mensagem de confirmação.'
        );
        return;
      }

      const dataJogoExibicao = dayjs(jogoAdicionado.dataJogo)
        .tz(FUSO_HORARIO_ENTRADA_ADMIN)
        .format('DD/MM/YYYY [às] HH:mm');
      const dataLimiteExibicao = dayjs(jogoAdicionado.dataLimitePalpite)
        .tz(FUSO_HORARIO_ENTRADA_ADMIN)
        .format('DD/MM/YYYY [às] HH:mm');

      const mensagemSucessoAdmin =
        `✅ Jogo adicionado ao bolão do grupo!\n\n\n` +
        `*ID JOGO:* ${jogoAdicionado.idJogo}\n` +
        `🏆 *${jogoAdicionado.campeonato}*\n` +
        `${jogoAdicionado.timeCasa} vs ${jogoAdicionado.timeFora}\n` +
        `🗓️ ${dataJogoExibicao}\n` +
        `🔒 *Limite Palpites:* ${dataLimiteExibicao} (Horário de Brasília)\n\n\n` +
        `Os usuários podem palpitar usando: ${prefixo}${ComandoPalpitarJogo.nome} ${jogoAdicionado.idJogo} <Casa>x<Fora>`;
      await this.responderMarcando(client, message, mensagemSucessoAdmin);

      const botJid = client.getHostNumber() + '@c.us';
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
        console.log(
          `Palpite automático do bot para o jogo ID ${jogoAdicionado.idJogo} (${golsBotCasa}x${golsBotFora}) registrado.`
        );
      } catch (errorPalpiteBot) {
        console.error(
          `Erro ao registrar palpite automático do bot para o jogo ID ${jogoAdicionado.idJogo}:`,
          errorPalpiteBot
        );
      }

      let msgPalpiteBot = '';
      if (golsBotCasa === golsBotFora) {
        msgPalpiteBot = `Meu palpite é: Empate por ${golsBotCasa}x${golsBotFora}! 👋`;
      } else {
        let golsTimeVencedor, golsTimePerdedor, timeVencedorNome;
        if (golsBotCasa > golsBotFora) {
          golsTimeVencedor = golsBotCasa;
          golsTimePerdedor = golsBotFora;
          timeVencedorNome = jogoAdicionado.timeCasa;
        } else {
          golsTimeVencedor = golsBotFora;
          golsTimePerdedor = golsBotCasa;
          timeVencedorNome = jogoAdicionado.timeFora;
        }
        msgPalpiteBot = `Meu palpite é ${golsTimeVencedor}x${golsTimePerdedor} para ${removerEmojis(timeVencedorNome)}! 👋`;
      }
      await client.sendText(idGrupo, msgPalpiteBot);
    } catch (error) {
      console.error(
        `Erro ao adicionar jogo ao bolão do grupo ${idGrupo}:`,
        error
      );
      await this.responderMarcando(
        client,
        message,
        '❌ Ocorreu um erro ao tentar adicionar o jogo ao bolão.'
      );
    }
  }
}
