import mongoose, { Schema, Document } from 'mongoose';
import { JogoBolao, Palpite, UsuarioRanking } from './bolaoTipos';

// --- Schema e Modelo para o Contador de ID Sequencial ---
// Este modelo é usado para gerar um ID numérico único para cada jogo.
interface ICounter extends Document {
  _id: string; // Nome da sequência, ex: 'jogoId'
  seq: number; // O último valor da sequência
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel = mongoose.model<ICounter>('Counter', counterSchema);

// --- Tipos de Documento do Mongoose ---
// Estendem as tuas interfaces para incluir as propriedades do Mongoose.
export type JogoBolaoDocument = JogoBolao & Document;
export type PalpiteDocument = Palpite & Document;
export type UsuarioRankingDocument = UsuarioRanking & Document;

// --- Schema para os Jogos do Bolão ---
const jogoBolaoSchema = new Schema<JogoBolaoDocument>({
  idJogo: { type: Number, required: true, unique: true, index: true },
  idGrupo: { type: String, required: true, index: true },
  idJogoApi: { type: String },
  campeonato: { type: String, required: true },
  timeCasa: { type: String, required: true },
  timeFora: { type: String, required: true },
  dataJogo: { type: Date, required: true },
  dataLimitePalpite: { type: Date, required: true },
  status: { type: String, required: true, default: 'AGENDADO' },
  placarCasa: { type: Number },
  placarFora: { type: Number },
});

// --- Schema para os Palpites dos Utilizadores ---
const palpiteSchema = new Schema<PalpiteDocument>({
  idGrupo: { type: String, required: true },
  idUsuario: { type: String, required: true },
  nomeUsuario: { type: String },
  idJogo: { type: Number, required: true, index: true },
  palpiteCasa: { type: Number, required: true },
  palpiteFora: { type: Number, required: true },
  dataPalpite: { type: Date, required: true },
});

// Cria um índice único para garantir que um utilizador só pode ter um palpite por jogo em cada grupo.
palpiteSchema.index({ idGrupo: 1, idUsuario: 1, idJogo: 1 }, { unique: true });

// --- Schema para o Ranking do Bolão ---
const usuarioRankingSchema = new Schema<UsuarioRankingDocument>({
  idGrupo: { type: String, required: true },
  idUsuario: { type: String, required: true },
  nomeUsuarioDisplay: { type: String, required: true },
  pontosTotais: { type: Number, required: true, default: 0 },
});

// Cria um índice único para garantir uma entrada por utilizador em cada grupo.
usuarioRankingSchema.index({ idGrupo: 1, idUsuario: 1 }, { unique: true });

// --- Exportação dos Modelos ---
// Os modelos são as interfaces que o teu código usará para interagir com a base de dados.
export const JogoBolaoModel = mongoose.model<JogoBolaoDocument>(
  'JogoBolao',
  jogoBolaoSchema
);
export const PalpiteModel = mongoose.model<PalpiteDocument>(
  'Palpite',
  palpiteSchema
);
export const UsuarioRankingModel = mongoose.model<UsuarioRankingDocument>(
  'UsuarioRanking',
  usuarioRankingSchema
);
