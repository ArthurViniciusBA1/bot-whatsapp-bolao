import * as sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR_NAME = 'dadosBolao';
const DB_FILE_NAME = 'bolao.sqlite';
const DB_DIR_PATH = path.join(__dirname, DB_DIR_NAME);
const DB_FILE_PATH = path.join(DB_DIR_PATH, DB_FILE_NAME);

/**
 * Garante que o diretório especificado para armazenar a base de dados exista.
 * Se não existir, ele será criado recursivamente.
 */
function garantirDiretorioDaBaseDeDados(): void {
  if (!fs.existsSync(DB_DIR_PATH)) {
    console.log(`Criando diretório para base de dados em: ${DB_DIR_PATH}`);
    fs.mkdirSync(DB_DIR_PATH, { recursive: true });
  }
}

garantirDiretorioDaBaseDeDados();

/**
 * Cria e exporta a instância da base de dados SQLite.
 * A base de dados é um ficheiro chamado 'bolao.sqlite' dentro da pasta 'dadosBolao'.
 */
const db = new sqlite3.Database(DB_FILE_PATH, (err) => {
  if (err) {
    console.error(
      'Erro Crítico: Não foi possível abrir ou criar a base de dados do bolão.',
      err.message
    );
  } else {
    console.log(
      `Conectado com sucesso à base de dados SQLite: ${DB_FILE_PATH}`
    );
    inicializarEstruturaDaBaseDeDados();
  }
});

/**
 * Responsável por criar as tabelas da base de dados se elas ainda não existirem,
 * utilizando camelCase para os nomes das colunas.
 */
function inicializarEstruturaDaBaseDeDados(): void {
  const sqlCriarTabelaJogos = `
    CREATE TABLE IF NOT EXISTS jogosBolao (
      idJogo INTEGER PRIMARY KEY AUTOINCREMENT,
      idGrupo TEXT NOT NULL,
      idJogoApi TEXT,
      campeonato TEXT NOT NULL,
      timeCasa TEXT NOT NULL,
      timeFora TEXT NOT NULL,
      dataJogo TEXT NOT NULL,
      dataLimitePalpite TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AGENDADO' CHECK(status IN ('AGENDADO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO')),
      placarCasa INTEGER,
      placarFora INTEGER
    );
  `;

  const sqlCriarTabelaPalpites = `
    CREATE TABLE IF NOT EXISTS palpites (
      idPalpite INTEGER PRIMARY KEY AUTOINCREMENT,
      idGrupo TEXT NOT NULL,
      idUsuario TEXT NOT NULL,
      nomeUsuario TEXT,
      idJogo INTEGER NOT NULL,
      palpiteCasa INTEGER NOT NULL,
      palpiteFora INTEGER NOT NULL,
      dataPalpite TEXT NOT NULL,
      FOREIGN KEY (idJogo) REFERENCES jogosBolao(idJogo) ON DELETE CASCADE,
      UNIQUE (idGrupo, idUsuario, idJogo)
    );
  `;

  const sqlCriarTabelaRanking = `
    CREATE TABLE IF NOT EXISTS rankingBolao (
      idRanking INTEGER PRIMARY KEY AUTOINCREMENT,
      idGrupo TEXT NOT NULL,
      idUsuario TEXT NOT NULL,
      nomeUsuarioDisplay TEXT NOT NULL,
      pontosTotais INTEGER NOT NULL DEFAULT 0,
      UNIQUE (idGrupo, idUsuario)
    );
  `;

  db.serialize(() => {
    db.run(sqlCriarTabelaJogos, (err) => {
      if (err)
        return console.error(
          'Erro ao criar/verificar tabela jogosBolao:',
          err.message
        );
    });
    db.run(sqlCriarTabelaPalpites, (err) => {
      if (err)
        return console.error(
          'Erro ao criar/verificar tabela palpites:',
          err.message
        );
    });
    db.run(sqlCriarTabelaRanking, (err) => {
      if (err)
        return console.error(
          'Erro ao criar/verificar tabela rankingBolao:',
          err.message
        );
    });
  });
}

export default db;
