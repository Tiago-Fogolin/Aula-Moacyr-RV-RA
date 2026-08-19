export type RegimeId = 'inline' | 'immersive-vr' | 'immersive-ar';

export type TratamentoDoMundo =
  | 'substitui'   // o ambiente sintético toma o lugar do ambiente real
  | 'preserva'    // o ambiente real permanece visível e recebe o sintético sobre si
  | 'exibe';      // o ambiente sintético é mostrado por uma janela, sem tocar o real

/** Valores de composição retornados por uma sessão XR. */
export type ModoDeComposicao = 'opaque' | 'additive' | 'alpha-blend';

export interface Regime {
  readonly id: RegimeId;
  readonly nome: string;
  readonly tratamentoDoMundo: TratamentoDoMundo;
  /** Espaço de referência esperado. */
  readonly espacoDeReferencia: 'viewer' | 'local' | 'local-floor' | 'unbounded';
  /** Capacidades de rastreamento esperadas. */
  readonly rastreia: string;
  /** Referência usada para posicionar a cena. */
  readonly registroContra: string;
  readonly composicaoEsperada: ModoDeComposicao;
  /** Papel deste regime na comparação. */
  readonly papel: string;
}

export const REGIMES: readonly Regime[] = [
  {
    id: 'inline',
    nome: 'Realidade virtual não imersiva',
    tratamentoDoMundo: 'exibe',
    espacoDeReferencia: 'viewer',
    rastreia: 'nada do corpo; a câmera obedece ao mouse',
    registroContra: 'a origem arbitrária da própria cena, fixada por quem a modelou',
    composicaoEsperada: 'opaque',
    papel:
      'É o caso base e o destino de quem não tem headset: a bancada inteira precisa ' +
      'ser montável aqui.',
  },
  {
    id: 'immersive-vr',
    nome: 'Realidade virtual imersiva',
    tratamentoDoMundo: 'substitui',
    espacoDeReferencia: 'local-floor',
    rastreia: 'a pose da cabeça e a das duas mãos, com seis graus de liberdade',
    registroContra:
      'o chão do espaço físico onde a pessoa está, o que faz a bancada nascer na ' +
      'altura certa em vez de flutuar',
    composicaoEsperada: 'opaque',
    papel:
      'É onde escala corporal e alcance de braço passam a existir — e nenhum dos ' +
      'dois tem equivalente na janela do desktop.',
  },
  {
    id: 'immersive-ar',
    nome: 'Realidade aumentada',
    tratamentoDoMundo: 'preserva',
    espacoDeReferencia: 'local-floor',
    rastreia:
      'a pose da cabeça, a das mãos e as superfícies que o aparelho encontra no ' +
      'ambiente',
    registroContra:
      'uma superfície real escolhida no ambiente, à qual a bancada permanece presa ' +
      'enquanto a pessoa caminha em volta',
    composicaoEsperada: 'alpha-blend',
    papel:
      'É o único regime em que errar o registro é visível a olho nu: a bancada ' +
      'desliza sobre a mesa, e ninguém precisa de instrumento para notar.',
  },
];

export function regimePorId(id: RegimeId): Regime {
  const encontrado: Regime | undefined = REGIMES.find((regime) => regime.id === id);
  if (encontrado === undefined) {
    // Mantém o erro explícito se o tipo e a lista ficarem fora de sincronia.
    throw new Error(`Regime não declarado: ${id}`);
  }
  return encontrado;
}
