import fs from 'fs';
import path from 'path';
import { BaseCommand, ComandoCarregado } from '@/abstracts';

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
  const pastaComandos = path.join(__dirname, '../comandos'); // Ajuste o caminho para sair de 'utils'

  if (!fs.existsSync(pastaComandos)) {
    console.error(`[Erro Carregamento] Diretório de comandos não encontrado: ${pastaComandos}`);
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
            (Object.getPrototypeOf(exportacao.prototype) === BaseCommand.prototype ||
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
              console.warn(`[Aviso Carregamento] Classe '${ClasseComando.name}' em ${caminhoAbsoluto} (exportação: ${nomeExportacao}) não possui propriedade estática 'nome' válida.`);
              continue;
            }
            if (typeof ClasseComando.categoria !== 'string' || !ClasseComando.categoria) {
              console.warn(`[Aviso Carregamento] Comando '${ClasseComando.nome}' em ${caminhoAbsoluto} não possui propriedade estática 'categoria' válida.`);
              continue;
            }

            let instancia: BaseCommand;
            try {
              instancia = new ClasseComando();
            } catch (e: any) {
              console.error(`[Erro Instanciação] Falha ao criar instância de '${ClasseComando.name}' de ${caminhoAbsoluto}. Erro: ${e.message}`);
              continue;
            }

            if (typeof instancia.descricao !== 'string' || !instancia.descricao) {
              console.warn(`[Aviso Carregamento] Comando '${ClasseComando.nome}' em ${caminhoAbsoluto} não possui propriedade 'descricao' válida.`);
              continue;
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
        console.error(`[Erro Carregamento] Erro ao carregar comando de ${caminhoAbsoluto}:`, error);
      }
    }
  }
  return comandosCarregados;
}