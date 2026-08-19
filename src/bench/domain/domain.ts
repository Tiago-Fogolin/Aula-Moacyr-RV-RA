/** Peças que podem ser manipuladas na bancada. */
export type PecaId =
  | 'corpo'
  | 'eixo'
  | 'engrenagem-grande'
  | 'engrenagem-pequena'
  | 'tampa';

/** Encaixes disponíveis no suporte. */
export type SocketId =
  | 'base-do-suporte'
  | 'furo-do-eixo'
  | 'dente-maior'
  | 'dente-menor'
  | 'topo';

/** Uma peça e os encaixes compatíveis com ela. */
export interface Peca {
  readonly id: PecaId;
  readonly nome: string;
  readonly sockets: readonly SocketId[];
}

/** Tarefa da cena e condição que indica sua conclusão. */
export interface TarefaDoAmbiente {
  readonly enunciado: string;
  readonly estadoFinal: string;
}

export interface Dominio {
  readonly nome: string;
  readonly descricao: string;
  readonly tarefa: TarefaDoAmbiente;
  readonly pecas: readonly Peca[];
  readonly sockets: readonly SocketId[];
}

export const BANCADA: Dominio = {
  nome: 'Bancada',
  descricao:
    'Uma oficina de montagem: sobre uma bancada de trabalho estão as peças de um ' +
    'mecanismo e um suporte com encaixes, e quem usa o ambiente monta o mecanismo ' +
    'peça por peça.',
  tarefa: {
    enunciado:
      'Montar o mecanismo encaixando cada peça no suporte, na ordem em que uma ' +
      'depende da outra.',
    estadoFinal:
      'As cinco peças estão encaixadas nos sockets compatíveis, na ordem válida, ' +
      'e o mecanismo montado gira.',
  },
  pecas: [
    { id: 'corpo', nome: 'Corpo', sockets: ['base-do-suporte'] },
    { id: 'eixo', nome: 'Eixo', sockets: ['furo-do-eixo'] },
    { id: 'engrenagem-grande', nome: 'Engrenagem grande', sockets: ['dente-maior'] },
    { id: 'engrenagem-pequena', nome: 'Engrenagem pequena', sockets: ['dente-menor'] },
    { id: 'tampa', nome: 'Tampa', sockets: ['topo'] },
  ],
  sockets: ['base-do-suporte', 'furo-do-eixo', 'dente-maior', 'dente-menor', 'topo'],
};

/** Retorna encaixes inexistentes ou que ficaram sem peça. */
export function inconsistenciasDoDominio(dominio: Dominio): string[] {
  const declarados: ReadonlySet<SocketId> = new Set(dominio.sockets);
  const usados: Set<SocketId> = new Set();
  const problemas: string[] = [];

  for (const peca of dominio.pecas) {
    if (peca.sockets.length === 0) {
      problemas.push(`A peça "${peca.nome}" não encaixa em socket nenhum.`);
    }
    for (const socket of peca.sockets) {
      if (!declarados.has(socket)) {
        problemas.push(
          `A peça "${peca.nome}" cita o socket "${socket}", que o suporte não declara.`,
        );
      }
      usados.add(socket);
    }
  }

  for (const socket of dominio.sockets) {
    if (!usados.has(socket)) {
      problemas.push(`O socket "${socket}" não recebe peça alguma.`);
    }
  }

  return problemas;
}
