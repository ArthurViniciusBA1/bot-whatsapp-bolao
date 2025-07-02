import * as baileys from "@whiskeysockets/baileys";
import { BaseCommand } from '@/abstracts/BaseCommand';
import { obterTabelaBrasileiraoA } from '@/modulos/futebol';

/**
 * @class TabelaCommand
 * @classdesc Comando para exibir a tabela atual do Brasileirão Série A.
 * @extends BaseCommand
 */
export class TabelaCommand extends BaseCommand {
  /**
   * @static
   * @property {string}
   */
  static nome = 'tabela';
  /**
   * @static
   * @property {string} categoria
   */
  static categoria = 'Brasileirão';

  /**
   * @constructor
   * @description Cria uma instância do TabelaCommand.
   */
  constructor() {
    super();
    this.descricao = 'Exibe a tabela atual do Brasileirão Série A';
  }

  /**
   * @async
   * @method executar
   * @description Executa o comando para buscar e formatar a tabela do Brasileirão.
   * @param {WASocket} client - Instância do cliente WA.
   * @param {WAMessage} message - Objeto da mensagem original.
   * @returns {Promise<void>}
   */
  async executar(client: baileys.WASocket, message: baileys.WAMessage): Promise<void> {
    const times = await obterTabelaBrasileiraoA();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const texto = this.formatarTabela(times as any);
    await this.responder(client, message, texto);
  }

  /**
   * @private
   * @method formatarTabela
   * @description Formata os dados da tabela para exibição.
   * @param {Array<Object>} times - Array de objetos, cada um representando um time com posição, nome, pontos e saldo de gols.
   * @returns {string} - A tabela formatada como string.
   */
  private formatarTabela(
    times: {
      posicao: number;
      nome: string;
      pontos: number;
      saldo_gols: string;
    }[]
  ): string {
    const header = '🏆 *Classificação - Série A 2024*\n\n';
    const linhas = times.map((time) => {
      const pos = String(time.posicao).padStart(2, ' ');
      let nomeTime = time.nome;
      if (nomeTime === 'Atlético-MG') nomeTime = `*${nomeTime}*`;
      if (nomeTime === 'Vasco da Gama') nomeTime = `Vasco`;
      const nomeFormatado = nomeTime + ' '.repeat(14 - nomeTime.length);
      const pts = String(time.pontos).padStart(2, ' ');
      const saldo = time.saldo_gols.padStart(3, ' ');
      return `${pos}- ${nomeFormatado} ${pts} pts  ⚽: ${saldo}`;
    });

    linhas.splice(16, 0, '\n*-----------------------------*\n');

    return header + linhas.join('\n');
  }
}
