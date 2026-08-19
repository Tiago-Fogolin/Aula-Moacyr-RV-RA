export type EstadoDeRecurso = 'concedido' | 'negado' | 'indeterminado';

export interface RecursoOpcional {
  readonly nome: string;
  readonly paraQueServe: string;
}

export const RECURSOS_CONSULTADOS: readonly RecursoOpcional[] = [
  {
    nome: 'local-floor',
    paraQueServe:
      'origem no chão do espaço físico — é o que faz a bancada nascer na altura certa',
  },
  {
    nome: 'bounded-floor',
    paraQueServe:
      'origem no chão mais os limites da área livre que o aparelho conhece',
  },
  {
    nome: 'unbounded',
    paraQueServe: 'espaço sem fronteira declarada, para percursos longos',
  },
  {
    nome: 'hit-test',
    paraQueServe:
      'lançar um raio contra as superfícies reais que o aparelho encontrou',
  },
  {
    nome: 'anchors',
    paraQueServe:
      'prender um objeto virtual a um ponto do mapa e deixar o aparelho corrigi-lo',
  },
  {
    nome: 'plane-detection',
    paraQueServe: 'receber os planos que o aparelho reconheceu no ambiente',
  },
  {
    nome: 'hand-tracking',
    paraQueServe:
      'pose das mãos sem controle — fora do núcleo do percurso, e consultado só para registro',
  },
];

export function estadoDoRecurso(
  nome: string,
  concedidos: readonly string[] | undefined,
): EstadoDeRecurso {
  if (concedidos === undefined) {
    return 'indeterminado';
  }
  return concedidos.includes(nome) ? 'concedido' : 'negado';
}