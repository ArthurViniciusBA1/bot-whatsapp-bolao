import emojiRegexFactory from 'emoji-regex';
import { listarUsuarios as listarUsuariosNaoMarcar } from '@/utils/naoMarcarUsuarios';

/**
 * Remove emojis de uma string usando a biblioteca emoji-regex.
 * @param texto O texto do qual remover os emojis.
 * @returns O texto sem emojis.
 */
export function removerEmojis(texto: string): string {
  if (!texto) {
    return '';
  }
  const regex = emojiRegexFactory();
  return texto.replace(regex, '');
}

/**
 * Gera um número aleatório de gols para um time, com peso para placares menores.
 * A chance de marcar um gol adicional diminui progressivamente.
 * @param maxGols O número máximo de gols que um time pode marcar (padrão é 8).
 * @returns O número de gols gerado (0 até maxGols).
 */
export function gerarGolsAleatoriosComPeso(maxGols: number = 8): number {
  let gols = 0;
  const chancesDeMarcarProximoGol: number[] = [
    0.65, // Chance de marcar o 1º gol
    0.55, // Chance de marcar o 2º gol
    0.45, // Chance de marcar o 3º gol
    0.35, // Chance de marcar o 4º gol
    0.18, // Chance de marcar o 5º gol
    0.11, // Chance de marcar o 6º gol
    0.05, // Chance de marcar o 7º gol
    0.02, // Chance de marcar o 8º gol
  ];

  for (let i = 0; i < maxGols; i++) {
    const chanceAtual =
      chancesDeMarcarProximoGol[i] !== undefined
        ? chancesDeMarcarProximoGol[i]
        : 0.01;
    if (Math.random() < chanceAtual) {
      gols++;
    } else {
      break;
    }
  }
  return gols;
}

/**
 * Filtra uma lista de usuários removendo aqueles que não devem ser marcados
 * baseado nas configurações salvas no JSON local.
 * @param usuarios - Array de IDs de usuários para filtrar
 * @returns Promise<string[]> - Array de usuários que devem ser marcados
 */
export async function filtrarUsuariosParaMarcar(
  usuarios: string[]
): Promise<string[]> {
  try {
    if (!usuarios || usuarios.length === 0) {
      return [];
    }

    // Obtém todos os usuários que não devem ser marcados do JSON local
    const usuariosNaoMarcar = await listarUsuariosNaoMarcar();

    // Filtra a lista removendo os usuários que não devem ser marcados
    const usuariosParaMarcar = usuarios.filter(
      (usuario) => !usuariosNaoMarcar.includes(usuario)
    );

    return usuariosParaMarcar;
  } catch (error) {
    console.error('Erro ao filtrar usuários para marcar:', error);
    // Em caso de erro, retorna a lista original (marca todos)
    return usuarios;
  }
}

/**
 * Verifica se um usuário específico deve ser marcado
 * @param idUsuario - ID do usuário para verificar
 * @returns Promise<boolean> - true se deve ser marcado, false se não deve
 */
export async function deveMarcarUsuario(idUsuario: string): Promise<boolean> {
  try {
    const usuariosNaoMarcar = await listarUsuariosNaoMarcar();
    return !usuariosNaoMarcar.includes(idUsuario);
  } catch (error) {
    console.error('Erro ao verificar se deve marcar usuário:', error);
    // Em caso de erro, marca o usuário por padrão
    return true;
  }
}
