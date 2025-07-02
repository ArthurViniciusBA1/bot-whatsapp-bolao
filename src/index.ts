import dotenv from 'dotenv';
dotenv.config();

import * as baileys from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { escuta } from '@/processamentoMensagens';
import { carregarComandos } from '@/utils/loaderComandos';
import { connectToDatabase } from './database';
import { validateEnviroments } from '@/dadosBot';
import { enviarLembretesDePrazo } from './modulos/notificacoes/notificacoesServico';

const logger = pino({ level: 'silent' });

async function startBot() {
  await connectToDatabase();
  validateEnviroments();

  const comandosCarregados = await carregarComandos();
  console.log(`[Info Carregamento] Total de ${comandosCarregados.length} comandos carregados.`);

  // Usamos as funções a partir do objeto 'baileys'
  const { state, saveCreds } = await baileys.useMultiFileAuthState('baileys_auth_info');
  const { version, isLatest } = await baileys.fetchLatestBaileysVersion();
  console.log(`Usando WhatsApp v${version.join('.')}, é a mais recente: ${isLatest}`);

  // --- E AQUI ---
  // Acessamos a função principal como 'baileys.default'
  const sock = baileys.default({
    version,
    auth: {
      creds: state.creds,
      keys: baileys.makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Para conectar, escaneie o QR Code abaixo:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      // Usamos DisconnectReason a partir do objeto 'baileys'
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== baileys.DisconnectReason.loggedOut;
      console.log('Conexão fechada. Motivo:', lastDisconnect?.error, '. Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Conexão aberta e bot online!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (upsert) => {
    escuta(sock, upsert, comandosCarregados);
  });

  const MINUTOS = 1 * 60 * 1000;
  setInterval(() => {
    console.log('Verificando lembretes de jogos...');
    enviarLembretesDePrazo(sock);
  }, MINUTOS);
}

startBot();