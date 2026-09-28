import { REGIMES, type Regime, type RegimeId } from '../regimes/regime';
import { levantarRelatorio, type LinhaDoRelatorio } from '../regimes/verification';
import {RECURSOS_CONSULTADOS, estadoDoRecurso, type EstadoDeRecurso } from './resources';
import {
  ContadorDeEstabilidade,
  diagnosticar,
  type Estabilidade,
} from './stability';
import {
  classificarAparelho,
  grausDeLiberdade,
  type ClasseDeAparelho,
  type GrausDeLiberdade,
} from './tiers';

export type ModoSondavel = 'immersive-vr' | 'immersive-ar';

const ESPACOS_TENTADOS: readonly XRReferenceSpaceType[] = [
  'bounded-floor',
  'local-floor',
  'unbounded',
  'local',
  'viewer',
];

const QUADROS_OBSERVADOS: number = 90;

export interface RecursoSondado {
  readonly nome: string;
  readonly paraQueServe: string;
  readonly estado: EstadoDeRecurso;
}

export interface FonteDeEntradaSondada {
  readonly lado: string;
  readonly mira: string;
  readonly temPoseDePunho: boolean;
  readonly temMao: boolean;
  readonly perfis: readonly string[];
}

export interface SondaSemSessao {
  readonly temApiXr: boolean;
  readonly contextoSeguro: boolean;
  readonly regimes: readonly LinhaDoRelatorio[];
  readonly modosSuportados: readonly string[];
}

export interface SondaEmSessao {
  readonly modo: ModoSondavel;
  readonly recursos: readonly RecursoSondado[];
  readonly espacosConcedidos: readonly string[];
  readonly composicaoObservada: XREnvironmentBlendMode;
  /**
   * `screen-space`: a interação acontece na tela do aparelho (celular em AR);
   * `world-space`: acontece no espaço, com controles ou mãos (visor). É a resposta
   * do aparelho que separa celular de visor — os dois suportam VR e AR no Chrome.
   */
  readonly modoDeInteracao: XRInteractionMode | 'nao-informado';
  readonly fontesDeEntrada: readonly FonteDeEntradaSondada[];
  readonly graus: GrausDeLiberdade;
  readonly estabilidade: Estabilidade;
  readonly diagnostico: string;
}

/**
 * O que aconteceu ao tentar abrir a sessão imersiva — é aqui que ausente e negado
 * se separam de verdade:
 * - `ausente`: o aparelho não declara modo imersivo (`isSessionSupported` = não);
 * - `negado`: o aparelho declara o modo e mesmo assim recusou a sessão (pessoa
 *   recusou a permissão, ou faltou gesto de quem usa);
 * - `aberta`: a sessão abriu e foi sondada;
 * - `sem-api`: nem a pergunta pôde ser feita.
 */
export type EstadoDaSessao = 'aberta' | 'ausente' | 'negado' | 'sem-api';

export interface ResultadoDaSonda {
  readonly sessao: EstadoDaSessao;
  readonly semSessao: SondaSemSessao;
  readonly emSessao: SondaEmSessao | undefined;
  readonly motivoSemSessao: string | undefined;
  readonly classe: ClasseDeAparelho;
}

function contextoSeguro(): boolean {
  return window.isSecureContext;
}

export async function sondarSemSessao(): Promise<SondaSemSessao> {
  const regimes: LinhaDoRelatorio[] = await levantarRelatorio();
  const suportados: string[] = regimes
    .filter((linha) => linha.suporte === 'sim')
    .map((linha) => linha.regime.id);

  return {
    temApiXr: navigator.xr !== undefined,
    contextoSeguro: contextoSeguro(),
    regimes,
    modosSuportados: suportados,
  };
}

async function espacosConcedidos(sessao: XRSession): Promise<string[]> {
  const obtidos: string[] = [];
  for (const tipo of ESPACOS_TENTADOS) {
    try {
      await sessao.requestReferenceSpace(tipo);
      obtidos.push(tipo);
    } catch {
      // O aparelho não oferece este espaço.
    }
  }
  return obtidos;
}

function lerFontesDeEntrada(sessao: XRSession): FonteDeEntradaSondada[] {
  const fontes: FonteDeEntradaSondada[] = [];
  for (const fonte of sessao.inputSources) {
    fontes.push({
      lado: fonte.handedness,
      mira: fonte.targetRayMode,
      temPoseDePunho: fonte.gripSpace !== undefined,
      temMao: fonte.hand !== undefined,
      perfis: [...fonte.profiles],
    });
  }
  return fontes;
}

function camadaMinima(sessao: XRSession): void {
  const tela: HTMLCanvasElement = document.createElement('canvas');
  const gl: WebGL2RenderingContext | null = tela.getContext('webgl2', {
    xrCompatible: true,
  });
  if (gl === null) {
    throw new Error('Este navegador não entregou contexto WebGL 2 compatível com XR.');
  }
  sessao.updateRenderState({ baseLayer: new XRWebGLLayer(sessao, gl) });
}

function observarQuadros(
  sessao: XRSession,
  referencia: XRReferenceSpace,
): Promise<Estabilidade> {
  return new Promise<Estabilidade>((resolver) => {
    const contador: ContadorDeEstabilidade = new ContadorDeEstabilidade();
    let restantes: number = QUADROS_OBSERVADOS;

    const passo: XRFrameRequestCallback = (_tempo: number, quadro: XRFrame): void => {
      const pose: XRViewerPose | undefined = quadro.getViewerPose(referencia);
      contador.registrar(pose !== undefined, sessao.visibilityState === 'visible');
      restantes -= 1;
      if (restantes > 0) {
        sessao.requestAnimationFrame(passo);
        return;
      }
      resolver(contador.resultado());
    };

    sessao.requestAnimationFrame(passo);
  });
}

/** Só a recusa do `requestSession` — erro depois de a sessão abrir não é "negado". */
export class SessaoRecusada extends Error {
  constructor(
    readonly modo: ModoSondavel,
    readonly causa: unknown,
  ) {
    super(`O aparelho recusou a sessão ${modo}.`);
    this.name = 'SessaoRecusada';
  }
}

export async function sondarEmSessao(modo: ModoSondavel): Promise<SondaEmSessao> {
  const xr: XRSystem | undefined = navigator.xr;
  if (xr === undefined) {
    throw new Error('Não há API XR neste navegador.');
  }

  let sessao: XRSession;
  try {
    sessao = await xr.requestSession(modo, {
      optionalFeatures: RECURSOS_CONSULTADOS.map((recurso) => recurso.nome),
    });
  } catch (erro: unknown) {
    throw new SessaoRecusada(modo, erro);
  }

  try {
    camadaMinima(sessao);
    const concedidos: readonly string[] | undefined = sessao.enabledFeatures;
    const espacos: string[] = await espacosConcedidos(sessao);
    const referencia: XRReferenceSpace = await sessao.requestReferenceSpace(
      espacos.includes('local-floor') ? 'local-floor' : 'viewer',
    );
    const estabilidade: Estabilidade = await observarQuadros(sessao, referencia);
    const fontes: FonteDeEntradaSondada[] = lerFontesDeEntrada(sessao);

    return {
      modo,
      recursos: RECURSOS_CONSULTADOS.map((recurso) => ({
        nome: recurso.nome,
        paraQueServe: recurso.paraQueServe,
        estado: estadoDoRecurso(recurso.nome, concedidos),
      })),
      espacosConcedidos: espacos,
      composicaoObservada: sessao.environmentBlendMode,
      modoDeInteracao: sessao.interactionMode ?? 'nao-informado',
      fontesDeEntrada: fontes,
      graus: grausDeLiberdade({
        concedidos: espacos,
        modo,
        comPoseDePunho: fontes.some((fonte) => fonte.temPoseDePunho),
      }),
      estabilidade,
      diagnostico: diagnosticar(estabilidade),
    };
  } finally {
    await sessao.end();
  }
}

export function modoPreferido(
  modosSuportados: readonly string[],
): ModoSondavel | undefined {
  const ordem: readonly ModoSondavel[] = ['immersive-ar', 'immersive-vr'];
  return ordem.find((modo) => modosSuportados.includes(modo));
}

export async function sondar(): Promise<ResultadoDaSonda> {
  const semSessao: SondaSemSessao = await sondarSemSessao();
  const modo: ModoSondavel | undefined = modoPreferido(semSessao.modosSuportados);

  if (modo === undefined) {
    return {
      sessao: semSessao.temApiXr ? 'ausente' : 'sem-api',
      semSessao,
      emSessao: undefined,
      motivoSemSessao: semSessao.temApiXr
        ? 'Este aparelho não declara sessão imersiva alguma, e metade da sonda não tem onde acontecer. É informação sobre o aparelho, não defeito do código.'
        : 'Sem API XR neste navegador. Se a página não está em contexto seguro, a causa é a URL, e não o aparelho.',
      classe: classificarAparelho(
        semSessao.modosSuportados,
        'indeterminado',
        semSessao.temApiXr,
      ),
    };
  }

  let emSessao: SondaEmSessao;
  try {
    emSessao = await sondarEmSessao(modo);
  } catch (erro: unknown) {
    if (!(erro instanceof SessaoRecusada)) {
      throw erro;
    }
    const nome: string = erro.causa instanceof DOMException ? erro.causa.name : 'erro';
    return {
      sessao: 'negado',
      semSessao,
      emSessao: undefined,
      motivoSemSessao:
        `O aparelho declara ${modo} e recusou a sessão (${nome}). Isso é negado, não ausente: ` +
        'o recurso existe, e a recusa veio da permissão ou da falta de gesto de quem usa. ' +
        'Tocar de novo no botão e aceitar o pedido resolve; trocar de aparelho, não.',
      classe: classificarAparelho(semSessao.modosSuportados, 'indeterminado', semSessao.temApiXr),
    };
  }
  return {
    sessao: 'aberta',
    semSessao,
    emSessao,
    motivoSemSessao: undefined,
    classe: classificarAparelho(
      semSessao.modosSuportados,
      emSessao.graus,
      semSessao.temApiXr,
      emSessao.modoDeInteracao,
    ),
  };
}

export function conferirComposicao(emSessao: SondaEmSessao): string {
  const id: RegimeId = emSessao.modo;
  const regime: Regime | undefined = REGIMES.find((candidato) => candidato.id === id);
  if (regime === undefined) {
    return 'O regime sondado não consta da declaração de regimes.';
  }
  if (regime.composicaoEsperada === emSessao.composicaoObservada) {
    return `A composição declarada (${regime.composicaoEsperada}) foi confirmada pela sessão.`;
  }
  return (
    `Declaramos composição ${regime.composicaoEsperada} e a sessão informou ` +
    `${emSessao.composicaoObservada}. A declaração estava errada, e quem tem razão é o aparelho.`
  );
}