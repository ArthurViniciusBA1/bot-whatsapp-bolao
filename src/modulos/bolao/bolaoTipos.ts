/**
 * Representa um jogo de futebol que está disponível para palpites no bolão,
 * específico para um grupo.
 */
export interface JogoBolao {
  /** ID único gerado pela base de dados para este jogo no bolão. */
  idJogo: number;
  /** ID do chat do grupo do WhatsApp ao qual este jogo do bolão pertence. */
  idGrupo: string;
  /** ID opcional do jogo na API de futebol externa (ex: api-futebol.com.br). */
  idJogoApi?: string | number;
  /** Nome do campeonato (ex: "Brasileirão Série A 2025"). */
  campeonato: string;
  /** Nome do time da casa. */
  timeCasa: string;
  /** Nome do time visitante. */
  timeFora: string;
  /** Data e hora de início da partida, no formato string ISO 8601 (ex: "2025-07-21T19:00:00Z"). */
  dataJogo: Date;
  /** Data e hora limite para que os usuários possam registrar ou alterar seus palpites, formato ISO 8601. */
  dataLimitePalpite: Date;
  /** Status atual do jogo no contexto do bolão. */
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
  /** Número de gols marcados pelo time da casa. Null ou undefined se o jogo ainda não foi finalizado. */
  placarCasa?: number | null;
  /** Número de gols marcados pelo time visitante. Null ou undefined se o jogo ainda não foi finalizado. */
  placarFora?: number | null;
}

/**
 * Representa o palpite de um usuário para um jogo específico, dentro de um determinado grupo.
 */
export interface Palpite {
  /** ID único do palpite, gerado pela base de dados (opcional no momento da criação). */
  idPalpite?: number;
  /** ID do chat do grupo do WhatsApp onde este palpite foi feito. */
  idGrupo: string;
  /** ID do usuário do WhatsApp que fez o palpite. */
  idUsuario: string;
  /** Nome do usuário do WhatsApp (opcional, para exibição). */
  nomeUsuario?: string;
  /** ID do JogoBolao ao qual este palpite se refere. */
  idJogo: number;
  /** Palpite de gols para o time da casa. */
  palpiteCasa: number;
  /** Palpite de gols para o time visitante. */
  palpiteFora: number;
  /** Data e hora em que o palpite foi registrado, formato ISO 8601. */
  dataPalpite: Date;
}

/**
 * Representa a pontuação e classificação de um usuário em um grupo específico do bolão.
 */
export interface UsuarioRanking {
  /** ID único da entrada no ranking, gerado pela base de dados (opcional no momento da criação). */
  idRanking?: number;
  /** ID do chat do grupo do WhatsApp ao qual este ranking se refere. */
  idGrupo: string;
  /** ID do usuário do WhatsApp. */
  idUsuario: string;
  /** Nome do usuário para exibição no ranking. */
  nomeUsuarioDisplay: string;
  /** Número total de palpites com placar exato. Cada acerto vale 1 ponto. */
  pontosTotais: number;
}
