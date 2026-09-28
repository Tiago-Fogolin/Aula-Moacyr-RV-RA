/**
 * Estado de um recurso opcional depois de a sessão abrir.
 * - `concedido`: veio em `enabledFeatures`.
 * - `nao-concedido`: a sessão respondeu e ele não veio. Pode ser ausente (o
 *   aparelho não tem) ou negado (tem e recusou): a especificação do WebXR esconde
 *   de propósito qual dos dois, para a página não conseguir identificar o aparelho
 *   pelas recusas. A distinção ausente × negado que a API permite fazer é a da
 *   sessão inteira — ver `EstadoDaSessao` em probe.ts.
 * - `indeterminado`: o navegador não implementa `enabledFeatures`; nada é presumido.
 */
export type EstadoDeRecurso = 'concedido' | 'nao-concedido' | 'indeterminado';

export interface RecursoOpcional {
  readonly nome: string;
  readonly paraQueServe: string;
}

/**
 * Os recursos que a ordenha consulta. Cada um está aqui porque alguma peça da
 * cena depende dele (Seções 5, 9 e 11 do especificacao.md) — o motivo vai junto
 * do nome para que nenhum entre só porque o nome soava interessante.
 */
export const RECURSOS_CONSULTADOS: readonly RecursoOpcional[] = [
  {
    nome: 'local-floor',
    paraQueServe:
      'origem no chão real: é o que põe o úbere a 0,78 m do chão no visor e obriga a agachar',
  },
  {
    nome: 'bounded-floor',
    paraQueServe:
      'limites da área livre: é o que permitiria escurecer a vaca quando quem joga sai do alcance',
  },
  {
    nome: 'unbounded',
    paraQueServe:
      'espaço sem fronteira; a vaca é fixa e não pede percurso longo — consultado só para registro',
  },
  {
    nome: 'hit-test',
    paraQueServe:
      'raio contra as superfícies reais: é como o curral encontra o tampo da mesa em AR',
  },
  {
    nome: 'anchors',
    paraQueServe:
      'prender o curral à mesa e deixar o aparelho corrigi-lo — é o que impede a vaca de deslizar',
  },
  {
    nome: 'plane-detection',
    paraQueServe:
      'os planos reconhecidos: é o que diria onde a mesa acaba, para a vaca não ficar na borda',
  },
  {
    nome: 'hand-tracking',
    paraQueServe:
      'pose das mãos sem controle: é a base de afastar as tetas da frente com as costas da mão',
  },
];

export function estadoDoRecurso(
  nome: string,
  concedidos: readonly string[] | undefined,
): EstadoDeRecurso {
  if (concedidos === undefined) {
    return 'indeterminado';
  }
  return concedidos.includes(nome) ? 'concedido' : 'nao-concedido';
}