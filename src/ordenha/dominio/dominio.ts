/** Peças que existem na cena de ordenha. */
export type PecaId =
  | 'vaca'
  | 'teta-frente-esquerda'
  | 'teta-frente-direita'
  | 'teta-tras-esquerda'
  | 'teta-tras-direita'
  | 'balde'
  | 'cilindro-de-leite';

export interface Peca {
  readonly id: PecaId;
  readonly nome: string;
  /** Por que esta peça é filha do pai que tem na árvore, e não de outro. */
  readonly justificativaDeParentesco: string;
}

export interface TarefaDoAmbiente {
  readonly enunciado: string;
  readonly estadoFinal: string;
}

export interface Dominio {
  readonly nome: string;
  readonly descricao: string;
  readonly tarefa: TarefaDoAmbiente;
  readonly pecas: readonly Peca[];
}

/**
 * Domínio da cena própria do grupo (docs/especificacao.md). 7 objetos-base:
 * vaca, 4 tetas, balde, cilindro de leite — batendo com a Seção 10 (orçamento).
 */
export const ORDENHA: Dominio = {
  nome: 'Ordenha',
  descricao:
    'Um jogo rítmico em realidade mista onde o jogador ordenha uma vaca em escala ' +
    'real, acertando as tetas ativas no tempo certo para encher o balde de leite.',
  tarefa: {
    enunciado: 'Preencher 100% do volume do cilindro de leite dentro do balde.',
    estadoFinal:
      'O cilindro de leite atinge escala Y máxima, e o tempo total gasto fica ' +
      'registrado.',
  },
  pecas: [
    {
      id: 'vaca',
      nome: 'Vaca',
      justificativaDeParentesco:
        'Raiz do grupo de peças da vaca: as tetas dependem da pose dela.',
    },
    {
      id: 'teta-frente-esquerda',
      nome: 'Teta frente-esquerda',
      justificativaDeParentesco:
        'Filha da vaca: se a vaca for reposicionada, a teta tem que ir junto sem ' +
        'linha de código adicional.',
    },
    {
      id: 'teta-frente-direita',
      nome: 'Teta frente-direita',
      justificativaDeParentesco: 'Mesma razão da teta frente-esquerda.',
    },
    {
      id: 'teta-tras-esquerda',
      nome: 'Teta trás-esquerda',
      justificativaDeParentesco: 'Mesma razão da teta frente-esquerda.',
    },
    {
      id: 'teta-tras-direita',
      nome: 'Teta trás-direita',
      justificativaDeParentesco: 'Mesma razão da teta frente-esquerda.',
    },
    {
      id: 'balde',
      nome: 'Balde',
      justificativaDeParentesco:
        'Filho do curral, não da vaca: é pego e carregado pela mão (troca de pai ' +
        'para a mão e volta), e não acompanha a vaca se ela for deslocada.',
    },
    {
      id: 'cilindro-de-leite',
      nome: 'Cilindro de leite',
      justificativaDeParentesco:
        'Filho do balde: preenche e se desloca junto quando o balde for carregado.',
    },
  ],
};

/**
 * Peças que o domínio promete e que a cena montada não contém — o passo 7 só se
 * confere contra o passo 2. Lista vazia quer dizer que a árvore tem tudo.
 */
export function pecasAusentes(
  dominio: Dominio,
  presentes: ReadonlyMap<PecaId, unknown>,
): Peca[] {
  return dominio.pecas.filter((peca) => !presentes.has(peca.id));
}
