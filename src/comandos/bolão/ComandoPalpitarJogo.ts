import * as baileys from "@whiskeysockets/baileys";
import { BaseCommand } from '@/abstracts';
import { SomenteGrupo } from '@/decorators';
import { registrarOuAtualizarPalpite } from '@/modulos';
import { prefixo } from '@/dadosBot';
import { ComandoVerJogosBolao } from './ComandoVerJogosBolao';

/**
 * @class ComandoPalpitarJogo
 * @classdesc Comando para registrar ou atualizar o palpite do usuário para um jogo do bolão do grupo.
 * @extends BaseCommand
 */
export class ComandoPalpitarJogo extends BaseCommand {
  /**
   * @static
   * @property {string} nome - O nome do comando.
   */
  static nome = 'palpitar';
  /**
   * @static
   * @property {string} categoria - A categoria do comando.
   */
  static categoria = 'Bolão';

  /**
   * @constructor
   * @description Cria uma instância do ComandoPalpitarJogo.
   */
  constructor() {
    super();
    this.descricao =
      'Registra ou atualiza seu palpite para um jogo do bolão do grupo.';
    this.guia = `Para palpitar, use:\n"${prefixo}${ComandoPalpitarJogo.nome} <ID do Jogo> <Gols Casa>x<Gols Fora>"\n\n*Exemplo:* "${prefixo}${ComandoPalpitarJogo.nome} 1 2x1"\n(Para o jogo com ID 1 no bolão deste grupo, você palpita 2 gols para o time da casa e 1 gol para o time visitante).\n\nUse '${prefixo}${ComandoVerJogosBolao.nome}' para ver os IDs dos jogos abertos.`;
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para registrar um palpite.
   * @param {WASocket} client - Instância do cliente WA.
   * @param {WAMessage} message - Objeto da mensagem original.
   * @param {string[]} args - Argumentos: [idJogo, placar (ex: "2x1")].
   * @returns {Promise<void>}
   */
  @SomenteGrupo
  async executar(
    client: baileys.WASocket,
    message: baileys.WAMessage,
    args: string[]
  ): Promise<void> {
    const idGrupo = this.getChatJid(message);
    const idUsuario = this.getSenderJid(message);
    const nomeUsuario = this.getSenderName(message);
    const texto = this.getTextFromMessage(message);

    if (args.length < 2) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato incorreto!\n${this.guia}`
      );
      return;
    }

    const idJogoStr = args[0];
    const placarStr = args[1].toLowerCase();

    const idJogo = parseInt(idJogoStr, 10);
    if (isNaN(idJogo) || idJogo <= 0) {
      await this.responderMarcando(
        client,
        message,
        `❌ O ID do jogo deve ser um número válido e positivo.\nUse ${prefixo}${ComandoVerJogosBolao.nome} para ver os IDs corretos.`
      );
      return;
    }

    const placarParts = placarStr.split('x');
    if (placarParts.length !== 2) {
      await this.responderMarcando(
        client,
        message,
        `⚠️ Formato do placar incorreto! Use <Gols Casa>x<Gols Fora>, por exemplo: \`2x1\`.\n\n${this.guia}`
      );
      return;
    }

    const palpiteCasa = parseInt(placarParts[0], 10);
    const palpiteFora = parseInt(placarParts[1], 10);

    if (
      isNaN(palpiteCasa) ||
      palpiteCasa < 0 ||
      isNaN(palpiteFora) ||
      palpiteFora < 0
    ) {
      await this.responderMarcando(
        client,
        message,
        '❌ Os gols devem ser números válidos e não negativos (0, 1, 2, etc.).'
      );
      return;
    }

    const maxGols = 20;
    if (palpiteCasa > maxGols || palpiteFora > maxGols) {
      await this.responderMarcando(
        client,
        message,
        `❌ Uau, que goleada! Mas, por favor, insira um número de gols mais realista (máximo ${maxGols} por time).`
      );
      return;
    }

    try {
      const resultado = await registrarOuAtualizarPalpite({
        idGrupo,
        idUsuario,
        nomeUsuario,
        idJogo,
        palpiteCasa,
        palpiteFora,
      });
      await this.reagir(client, message, '✅');
      await this.responderMarcando(client, message, resultado.mensagem);
    } catch (error) {
      console.error('Erro ao executar comando palpitarjogo:', error);
      await this.responderMarcando(
        client,
        message,
        '❌ Ops! Ocorreu um erro inesperado ao tentar registrar seu palpite. Tente novamente mais tarde.'
      );
      await this.reagir(client, message, '❌');
    }
  }
}
