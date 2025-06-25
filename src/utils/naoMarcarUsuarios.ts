import { promises as fs } from 'fs';
import path from 'path';

const FILE_PATH = path.resolve(__dirname, '../database/naoMarcarUsuarios.json');

async function lerLista(): Promise<string[]> {
  try {
    const data = await fs.readFile(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(FILE_PATH, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

async function salvarLista(lista: string[]): Promise<void> {
  await fs.writeFile(FILE_PATH, JSON.stringify(lista, null, 2), 'utf-8');
}

export async function adicionarUsuario(id: string): Promise<void> {
  const lista = await lerLista();
  if (!lista.includes(id)) {
    lista.push(id);
    await salvarLista(lista);
  }
}

export async function removerUsuario(id: string): Promise<void> {
  const lista = await lerLista();
  const novaLista = lista.filter((item) => item !== id);
  await salvarLista(novaLista);
}

export async function estaNaLista(id: string): Promise<boolean> {
  const lista = await lerLista();
  return lista.includes(id);
}

export async function listarUsuarios(): Promise<string[]> {
  return lerLista();
}
