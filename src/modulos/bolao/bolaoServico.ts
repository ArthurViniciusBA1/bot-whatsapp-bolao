import { removerEmojis } from 'utils/utils';
import { JogoBolao, Palpite, UsuarioRanking } from './bolaoTipos';
import {
  JogoBolaoModel,
  PalpiteModel,
  UsuarioRankingModel,
  CounterModel,
  JogoBolaoDocument,
} from './bolaoModelos';

/**
 * Obtém o próximo número de uma sequência.
 * @param sequenceName O nome da sequência (ex: 'jogoId').
 * @returns O próximo número da sequência.
 */
async function getNextSequence(sequenceName: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * Adiciona um novo jogo ao bolão com um ID numérico.
 * @param idGrupo O ID do grupo.
 * @param dadosNovoJogo Os dados do novo jogo.
 * @returns O jogo que foi salvo na base de dados.
 */
export async function adicionarJogoBolao(
  idGrupo: string,
  dadosNovoJogo: Omit<
    JogoBolao,
    'idJogo' | 'idGrupo' | 'status' | 'placarCasa' | 'placarFora'
  >
): Promise<JogoBolao> {
  const proximoIdJogo = await getNextSequence('jogoId');

  const novoJogo = new JogoBolaoModel({
    idJogo: proximoIdJogo,
    idGrupo,
    ...dadosNovoJogo,
  });

  const jogoSalvo = await novoJogo.save();
  return jogoSalvo.toObject();
}

/**
 * Registra ou atualiza o palpite de um utilizador para um jogo.
 * @param dadosPalpite Os dados do palpite.
 * @returns Um objeto com o status da operação e uma mensagem.
 */
export async function registrarOuAtualizarPalpite(
  dadosPalpite: Omit<Palpite, 'idPalpite' | 'dataPalpite'>
): Promise<{ sucesso: boolean; mensagem: string }> {
  const jogo = await JogoBolaoModel.findOne({
    idJogo: dadosPalpite.idJogo,
    idGrupo: dadosPalpite.idGrupo,
    status: 'AGENDADO',
  });

  if (!jogo) {
    return {
      sucesso: false,
      mensagem:
        '❌ Jogo não encontrado ou não está mais agendado para palpites.',
    };
  }

  if (new Date() > new Date(jogo.dataLimitePalpite)) {
    return {
      sucesso: false,
      mensagem: '⏰ Palpites para este jogo foram encerrados.',
    };
  }

  const nomeUsuarioFinal =
    dadosPalpite.nomeUsuario || dadosPalpite.idUsuario.split('@')[0];

  await PalpiteModel.findOneAndUpdate(
    {
      idGrupo: dadosPalpite.idGrupo,
      idUsuario: dadosPalpite.idUsuario,
      idJogo: dadosPalpite.idJogo,
    },
    { ...dadosPalpite, nomeUsuario: nomeUsuarioFinal, dataPalpite: new Date() },
    { upsert: true, new: true }
  );

  const detalhesJogo = `🎯 *Você palpitou em:* \n${removerEmojis(
    jogo.timeCasa
  )} ${dadosPalpite.palpiteCasa} x ${dadosPalpite.palpiteFora} ${removerEmojis(
    jogo.timeFora
  )}\n`;
  return {
    sucesso: true,
    mensagem: `${detalhesJogo}\n\n _Para editar o palpite utilize o mesmo comando._`,
  };
}

/**
 * Atualiza o resultado de um jogo e processa todos os palpites relacionados.
 * @param idJogo O ID numérico do jogo.
 * @param placarCasaReal Gols do time da casa.
 * @param placarForaReal Gols do time visitante.
 * @returns Um objeto com o status da operação, uma mensagem e a lista de acertadores.
 */
export async function atualizarResultadoJogoESimultaneamenteProcessarPalpites(
  idJogo: number,
  placarCasaReal: number,
  placarForaReal: number
): Promise<{ sucesso: boolean; mensagem: string; acertadores?: any[] }> {
  const jogo = await JogoBolaoModel.findOne({ idJogo });

  if (!jogo) {
    return {
      sucesso: false,
      mensagem: `❌ Jogo com ID ${idJogo} não encontrado.`,
    };
  }

  if (jogo.status === 'FINALIZADO') {
    return {
      sucesso: false,
      mensagem: `⚠️ Jogo ${jogo.timeCasa} vs ${jogo.timeFora} já foi finalizado.`,
    };
  }

  const palpites = await PalpiteModel.find({
    idJogo: jogo.idJogo,
    idGrupo: jogo.idGrupo,
  });

  const acertadores: { idUsuario: string; nomeUsuario?: string }[] = [];

  for (const palpite of palpites) {
    if (
      palpite.palpiteCasa === placarCasaReal &&
      palpite.palpiteFora === placarForaReal
    ) {
      acertadores.push({
        idUsuario: palpite.idUsuario,
        nomeUsuario: palpite.nomeUsuario,
      });
      await UsuarioRankingModel.findOneAndUpdate(
        { idGrupo: palpite.idGrupo, idUsuario: palpite.idUsuario },
        {
          $inc: { pontosTotais: 1 },
          $set: {
            nomeUsuarioDisplay:
              palpite.nomeUsuario || palpite.idUsuario.split('@')[0],
          },
        },
        { upsert: true }
      );
    }
  }

  jogo.placarCasa = placarCasaReal;
  jogo.placarFora = placarForaReal;
  jogo.status = 'FINALIZADO';
  await jogo.save();

  return {
    sucesso: true,
    mensagem: `✅ Resultado do jogo ${jogo.timeCasa} ${placarCasaReal} x ${placarForaReal} ${jogo.timeFora} atualizado!`,
    acertadores: acertadores,
  };
}

/**
 * Obtém um jogo específico pelo seu ID numérico e ID do grupo.
 * @param idJogo O ID numérico do jogo.
 * @param idGrupo O ID do grupo.
 * @returns O objeto do jogo ou nulo se não for encontrado.
 */
export async function obterJogoPorIdEGrupo(
  idJogo: number,
  idGrupo: string
): Promise<JogoBolao | null> {
  return JogoBolaoModel.findOne({ idJogo, idGrupo });
}

/**
 * Obtém todos os palpites para um jogo específico em um grupo.
 * @param idJogo O ID numérico do jogo.
 * @param idGrupo O ID do grupo.
 * @returns Uma lista de palpites.
 */
export async function obterPalpitesPorJogoEGrupo(
  idJogo: number,
  idGrupo: string
): Promise<Palpite[]> {
  return PalpiteModel.find({ idJogo, idGrupo }).sort({ nomeUsuario: 'asc' });
}

/**
 * Obtém todos os jogos que estão abertos para palpites em um grupo.
 * @param idGrupo O ID do grupo.
 * @returns Uma lista de jogos abertos.
 */
export async function obterJogosAbertosParaPalpite(
  idGrupo: string
): Promise<JogoBolao[]> {
  const agora = new Date();
  return JogoBolaoModel.find({
    idGrupo,
    status: 'AGENDADO',
    dataLimitePalpite: { $gt: agora },
  }).sort({ dataJogo: 'asc' });
}

/**
 * Obtém os palpites de um utilizador para jogos que ainda não aconteceram.
 * @param idGrupo O ID do grupo.
 * @param idUsuario O ID do utilizador.
 * @returns Uma lista de palpites com os dados do jogo.
 */
export async function obterMeusPalpites(
  idGrupo: string,
  idUsuario: string
): Promise<any[]> {
  const palpites = await PalpiteModel.find({ idGrupo, idUsuario }); // <-- LINHA CORRIGIDA

  // O resto da função, que já faz a junção manual corretamente, continua igual.
  const idJogos = palpites.map((p) => p.idJogo);
  const jogos = await JogoBolaoModel.find({ idJogo: { $in: idJogos } });
  const mapaJogos = new Map(jogos.map((j) => [j.idJogo, j]));

  const resultado = palpites
    .map((p) => {
      const jogoCorrespondente = mapaJogos.get(p.idJogo);
      if (jogoCorrespondente && jogoCorrespondente.status === 'AGENDADO') {
        return { ...p.toObject(), jogo: jogoCorrespondente.toObject() };
      }
      return null;
    })
    .filter((p) => p !== null);

  return resultado;
}

/**
 * Obtém o ranking completo de um grupo.
 * @param idGrupo O ID do grupo.
 * @returns Uma lista de utilizadores no ranking, ordenados por pontos.
 */
export async function obterRankingGrupo(
  idGrupo: string
): Promise<UsuarioRanking[]> {
  return UsuarioRankingModel.find({ idGrupo }).sort({
    pontosTotais: -1,
    nomeUsuarioDisplay: 'asc',
  });
}

/**
 * Obtém jogos que já passaram da data/hora mas ainda estão como 'AGENDADO'.
 * @param idGrupo O ID do grupo.
 * @returns Uma lista de jogos pendentes de resultado.
 */
export async function obterJogosPendentesDeResultado(
  idGrupo: string
): Promise<JogoBolao[]> {
  const agora = new Date();
  return JogoBolaoModel.find({
    idGrupo,
    status: 'AGENDADO',
    dataJogo: { $lt: agora },
  }).sort({ dataJogo: 'asc' });
}
