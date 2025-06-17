/**
 * JID (ex: "xxxxxxxxxxxx@c.us") do proprietário do bot, carregado do .env.
 * Usado para bypass de permissões.
 */
export const JID_DONO: string = process.env.NUMERO_DONO + '@c.us' || '';

/**
 * Chave da API para football-data.org, carregada do .env.
 * Usada no módulo de futebol.
 */
export const FOOTBALL_DATA_API_KEY: string =
  process.env.FOOTBALL_DATA_API_KEY || '';

/**
 * Nome do autor para os pacotes de figurinhas, carregado do .env.
 * Se não definido no .env, usa um valor padrão.
 */
export const nomeAutorFigurinhas: string =
  process.env.NOME_AUTOR_FIGURINHAS || 'Bot Stickers';

/**
 * Nome do pacote de figurinhas, carregado do .env.
 * Se não definido, é derivado do nomeAutorFigurinhas ou usa um padrão.
 */
export const nomePacoteDeFigurinhas: string =
  process.env.NOME_PACOTE_FIGURINHAS || `${nomeAutorFigurinhas}'s Pack`;

/**
 * Nome de exibição para o bot em algumas mensagens, carregado do .env.
 */
export const NOME_DE_EXIBICAO_BOT: string =
  process.env.NOME_DE_EXIBICAO || 'Meu Bot';

/**
 * Prefixo para os comandos do bot, carregado do .env.
 */
export const prefixo: string = process.env.PREFIX || '!';

export function validateEnviroments(): void {
  console.clear();
  console.log('Validando configurações e variáveis de ambiente...');

  if (!JID_DONO) {
    console.error(
      "CRÍTICO: A variável de ambiente 'JID_DONO' não está definida no ficheiro .env! Muitas funcionalidades de admin/bypass não funcionarão."
    );
  } else if (!/^\d+@c\.us$/.test(JID_DONO)) {
    console.warn(
      `AVISO: 'JID_DONO' (${JID_DONO}) não parece ser um JID de contato válido (ex: 1234567890@c.us).`
    );
  } else {
    console.log(`JID_DONO: Configurado (${JID_DONO.substring(0, 5)}...)`);
  }

  if (!FOOTBALL_DATA_API_KEY) {
    console.warn(
      "AVISO: 'FOOTBALL_DATA_API_KEY' não está definida no .env. Funcionalidades de futebol com football-data.org podem falhar."
    );
  } else {
    console.log('FOOTBALL_DATA_API_KEY: Configurada.');
  }

  if (!prefixo || prefixo.length === 0) {
    console.error(
      "Erro: O prefixo dos comandos ('PREFIX') não está definido ou é uma string vazia no .env! O bot usará o padrão."
    );
  } else {
    console.log(`PREFIX: Configurado como '${prefixo}'`);
  }
}
