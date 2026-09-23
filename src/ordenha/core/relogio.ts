/** Teto de salto: evita que voltar de uma aba suspensa vire um `delta` gigante. */
export const TETO_DE_SALTO_PADRAO: number = 0.1; // segundos

export interface Amostra {
  /** Tempo desde o quadro anterior, já com o teto aplicado (segundos). */
  readonly delta: number;
  /** Tempo total decorrido desde o início, somando os `delta` já cortados (segundos). */
  readonly decorrido: number;
  /** Intervalo real observado, sem corte — só para diagnóstico. */
  readonly intervaloReal: number;
  /** Quanto tempo foi descartado pelo teto de salto neste quadro (segundos). */
  readonly saltoDescartado: number;
}

/** Relógio do laço de renderização: converte `performance.now()` em `Amostra`s. */
export class Relogio {
  private ultimoInstanteMs: number | undefined = undefined;
  private decorrido: number = 0;

  constructor(private readonly tetoDeSalto: number = TETO_DE_SALTO_PADRAO) {}

  /** Processa um instante em milissegundos (de `XRFrame`/`setAnimationLoop`). */
  avancar(instanteMs: number): Amostra {
    if (this.ultimoInstanteMs === undefined) {
      this.ultimoInstanteMs = instanteMs;
      return { delta: 0, decorrido: this.decorrido, intervaloReal: 0, saltoDescartado: 0 };
    }

    const intervaloReal = Math.max(0, (instanteMs - this.ultimoInstanteMs) / 1000);
    this.ultimoInstanteMs = instanteMs;

    const delta = Math.min(intervaloReal, this.tetoDeSalto);
    this.decorrido += delta;

    return {
      delta,
      decorrido: this.decorrido,
      intervaloReal,
      saltoDescartado: intervaloReal - delta,
    };
  }
}
