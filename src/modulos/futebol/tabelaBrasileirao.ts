import axios from 'axios';
import { JSDOM } from 'jsdom';
import UserAgent from 'user-agents';

const URL_TABELA_A =
  'https://p1.trrsf.com/api/musa-soccer/ms-standings-light?idChampionship=1436&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR';
const URL_TABELA_B =
  'https://p1.trrsf.com/api/musa-soccer/ms-standings-light?idChampionship=1438&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR';

export interface TimeTabela {
  nome: string;
  escudo: string;
  posicao: string;
  pontos: string;
  jogos: string;
  vitorias: string;
  empates: string;
  derrotas: string;
  gols_pro: string;
  gols_contra: string;
  saldo_gols: string;
  aproveitamento: string;
}

export async function obterTabelaBrasileiraoA() {
  try {
    const tabelaTimes = await obterDadosTabela(URL_TABELA_A);
    return tabelaTimes;
  } catch (err) {
    throw err;
  }
}
export async function obterTabelaBrasileiraoB() {
  try {
    const tabelaTimes = await obterDadosTabela(URL_TABELA_B);
    return tabelaTimes;
  } catch (err) {
    throw err;
  }
}

async function obterDadosTabela(url: string) {
  try {
    const { document } = await obterPagina(url);
    const times: TimeTabela[] = [];
    const $times = document.querySelectorAll('table > tbody > tr');

    $times.forEach(($time) => {
      times.push({
        nome:
          $time.querySelector('.team-name > a')?.getAttribute('title') || '',
        escudo:
          $time.querySelector('.shield > a > img')?.getAttribute('src') || '',
        posicao: $time.querySelector('.position')?.innerHTML || '',
        pontos: $time.querySelector('.points')?.innerHTML || '',
        jogos: $time.querySelector('td[title="Jogos"]')?.innerHTML || '',
        vitorias: $time.querySelector('td[title="Vitórias"]')?.innerHTML || '',
        empates: $time.querySelector('td[title="Empates"]')?.innerHTML || '',
        derrotas: $time.querySelector('td[title="Derrotas"]')?.innerHTML || '',
        gols_pro: $time.querySelector('td[title="Gols Pró"]')?.innerHTML || '',
        gols_contra:
          $time.querySelector('td[title="Gols Contra"]')?.innerHTML || '',
        saldo_gols:
          $time.querySelector('td[title="Saldo de Gols"]')?.innerHTML || '',
        aproveitamento:
          $time.querySelector('td[title="Aproveitamento"]')?.innerHTML + '%',
      });
    });

    return times;
  } catch (err) {
    throw err;
  }
}

async function obterPagina(url: string) {
  try {
    const userAgent = new UserAgent();
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': userAgent.toString() },
    });
    const { window } = new JSDOM(data);
    return window;
  } catch (err) {
    throw err;
  }
}
