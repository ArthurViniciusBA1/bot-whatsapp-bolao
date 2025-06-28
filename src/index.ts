import dotenv from 'dotenv';
dotenv.config();

import { create, Client } from '@open-wa/wa-automate';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

import { escuta } from '@/processamentoMensagens';
import fs from 'fs';
import path from 'path';
import { BaseCommand, ComandoCarregado } from '@/abstracts';
import { validateEnviroments } from '@/dadosBot';
import { connectToDatabase } from './database';
import { enviarLembretesDePrazo } from './modulos/notificacoes/notificacoesServico';

const initConfigs = {
  sessionId: 'Arthur_Bot',
  multiDevice: true,
  authTimeout: 60,
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  logConsole: false,
  popup: true,
  qrTimeout: 0,
};

create(initConfigs).then(iniciarBot);

async function iniciarBot(client: Client) {
  await connectToDatabase();
  validateEnviroments();
  logsDeIncializacao();

  const comandosCarregados = await carregarComandos();

  escuta(client, comandosCarregados);

  const MINUTOS = 5 * 60 * 1000;
  setInterval(() => {
    enviarLembretesDePrazo(client);
  }, MINUTOS);

  client.autoReject('O bot não aceita ligações ❌');

  client.onStateChanged((estado) => {
    if (estado === 'CONFLICT' || estado === 'UNLAUNCHED') {
      client.forceRefocus();
    }
  });
}

function logsDeIncializacao() {
  const os = require('os');
  const dataDeInicio = dayjs().tz('America/Sao_Paulo').format('DD/MM');
  const horaDeInicio = dayjs().tz('America/Sao_Paulo').format('HH:mm:ss');

  const memoriaTotal = (os.totalmem() / 1024000000).toFixed(2);
  const memoriaUsada = ((os.totalmem() - os.freemem()) / 1024000000).toFixed(2);
  const processador = os.cpus()[0].model;

  console.log(`
  CPU: ${processador}
  Memória: ${memoriaUsada}GB de ${memoriaTotal}GB
  INICIANDO BOT - ${dataDeInicio} ${horaDeInicio}
  `);
}

/**
 * @async
 * @function carregarComandos
 * @description Carrega dinamicamente todos os comandos de subdiretórios.
 * Os comandos devem herdar de BaseCommand e ter propriedades estáticas 'nome' e 'categoria',
 * e propriedades de instância 'descricao' e 'guia' (opcional) definidas no construtor.
 * @returns {Promise<ComandoCarregado[]>} Uma lista de objetos representando os comandos carregados.
 */
export async function carregarComandos(): Promise<ComandoCarregado[]> {
  const comandosCarregados: ComandoCarregado[] = [];
  const pastaComandos = path.join(__dirname, 'comandos');

  if (!fs.existsSync(pastaComandos)) {
    console.error(
      `[Erro Carregamento] Diretório de comandos não encontrado: ${pastaComandos}`
    );
    return [];
  }

  const categorias = fs
    .readdirSync(pastaComandos, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory());

  for (const categoriaDir of categorias) {
    const categoriaPath = path.join(pastaComandos, categoriaDir.name);
    const arquivos = fs
      .readdirSync(categoriaPath)
      .filter(
        (file) =>
          (file.endsWith('.ts') || file.endsWith('.js')) &&
          !file.endsWith('.map')
      );

    for (const arquivo of arquivos) {
      const caminhoAbsoluto = path.join(categoriaPath, arquivo);
      try {
        const comandoModulo = await import(caminhoAbsoluto);

        for (const nomeExportacao in comandoModulo) {
          const exportacao = comandoModulo[nomeExportacao];

          if (
            typeof exportacao === 'function' &&
            exportacao.prototype &&
            (Object.getPrototypeOf(exportacao.prototype) ===
              BaseCommand.prototype ||
              exportacao.prototype instanceof BaseCommand)
          ) {
            const ClasseComando = exportacao as {
              new (): BaseCommand;
              prototype: BaseCommand;
              nome: string;
              categoria: string;
            };

            if (ClasseComando === BaseCommand) {
              continue;
            }

            if (typeof ClasseComando.nome !== 'string' || !ClasseComando.nome) {
              console.warn(
                `[Aviso Carregamento] Classe '${ClasseComando.name}' em ${caminhoAbsoluto} (exportação: ${nomeExportacao}) não possui propriedade estática 'nome' válida.`
              );
              continue;
            }
            if (
              typeof ClasseComando.categoria !== 'string' ||
              !ClasseComando.categoria
            ) {
              console.warn(
                `[Aviso Carregamento] Comando '${ClasseComando.nome}' em ${caminhoAbsoluto} não possui propriedade estática 'categoria' válida.`
              );
              continue;
            }

            let instancia: BaseCommand;
            try {
              instancia = new ClasseComando();
            } catch (e) {
              console.error(
                `[Erro Instanciação] Falha ao criar instância de '${ClasseComando.name}' (provavelmente abstrata) de ${caminhoAbsoluto}. Verifique se esta classe é CONCRETA. Erro: ${e.message}`
              );
              continue;
            }

            if (
              typeof instancia.descricao !== 'string' ||
              !instancia.descricao
            ) {
              console.warn(
                `[Aviso Carregamento] Comando '${ClasseComando.nome}' em ${caminhoAbsoluto} não possui propriedade 'descricao' válida na instância.`
              );
              continue;
            }
            if (
              instancia.guia !== undefined &&
              typeof instancia.guia !== 'string'
            ) {
              console.warn(
                `[Aviso Carregamento] Comando '${ClasseComando.nome}' em ${caminhoAbsoluto} possui 'guia' mas não é uma string.`
              );
            }

            comandosCarregados.push({
              nome: ClasseComando.nome,
              categoria: ClasseComando.categoria,
              descricao: instancia.descricao,
              guia: instancia.guia,
              instancia: instancia,
            });
          }
        }
      } catch (error) {
        console.error(
          `[Erro Carregamento] Erro ao carregar ou processar comando de ${caminhoAbsoluto}:`,
          error
        );
      }
    }
  }
  console.log(
    `[Info Carregamento] Total de ${comandosCarregados.length} comandos carregados.`
  );
  return comandosCarregados;
}
