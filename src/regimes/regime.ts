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
  /** Escala do curral neste regime (1 = vaca de 2,40 m; Seção 4 do especificacao.md). */
  readonly escalaDaCena: number;
  /** Papel deste regime na comparação. */
  readonly papel: string;
}

/** Vaca de 30 cm sobre a mesa, contra 2,40 m em escala real: 0,30 / 2,40. */
export const ESCALA_NA_MESA: number = 0.125;

export const REGIMES: readonly Regime[] = [
  {
    id: 'inline',
    nome: 'Na tela (janela)',
    tratamentoDoMundo: 'exibe',
    espacoDeReferencia: 'viewer',
    rastreia: 'nada do corpo; a câmera orbita a vaca pelo mouse e o clique ordenha',
    registroContra: 'a origem da própria cena: o chão do curral em y = 0, sob a vaca',
    composicaoEsperada: 'opaque',
    escalaDaCena: 1,
    papel:
      'É o caso base e o destino de quem não tem headset: encher o balde precisa ' +
      'ser possível aqui, só com clique.',
  },
  {
    id: 'immersive-vr',
    nome: 'No visor (VR)',
    tratamentoDoMundo: 'substitui',
    espacoDeReferencia: 'local-floor',
    rastreia: 'a pose da cabeça e a dos dois controles, com seis graus de liberdade',
    registroContra:
      'o chão do quarto de quem joga: as patas da vaca pisam no chão real e o úbere ' +
      'fica a 0,78 m de altura, o que obriga a agachar',
    composicaoEsperada: 'opaque',
    escalaDaCena: 1,
    papel:
      'É onde agachar e o alcance do braço passam a existir — nenhum dos dois tem ' +
      'equivalente na janela do desktop.',
  },
  {
    id: 'immersive-ar',
    nome: 'Pela câmera (AR)',
    tratamentoDoMundo: 'preserva',
    espacoDeReferencia: 'local-floor',
    rastreia:
      'a pose do aparelho e as superfícies reais que ele encontra (hit-test)',
    registroContra:
      'o tampo de uma mesa real, escolhido pelo toque: o curral nasce ali, em escala ' +
      '1:8 (vaca de 30 cm), e fica preso à mesa enquanto a pessoa anda em volta',
    composicaoEsperada: 'alpha-blend',
    escalaDaCena: ESCALA_NA_MESA,
    papel:
      'É o único regime em que errar o registro é visível a olho nu: a vaca ' +
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
