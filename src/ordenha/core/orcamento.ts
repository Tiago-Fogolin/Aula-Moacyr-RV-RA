export const TETO_DESKTOP_MS: number = 16.7; // 60 fps
export const TETO_VISOR_MS: number = 11.1; // 90 fps

const TAMANHO_DA_JANELA: number = 120;

export interface LeituraDoOrcamento {
  readonly tetoMs: number;
  readonly quadrosMedidos: number;
  readonly custoMedioMs: number;
  readonly intervaloMedioMs: number;
  readonly piorIntervaloMs: number;
  readonly quadrosAcimaDoTeto: number;
  readonly chamadasDeDesenho: number;
  readonly triangulos: number;
}

/** Monitora custo e intervalo de quadro numa janela circular de tamanho fixo. */
export class Orcamento {
  private readonly custosMs: number[] = [];
  private readonly intervalosMs: number[] = [];
  private posicao: number = 0;
  private cheio: boolean = false;

  constructor(public tetoMs: number = TETO_DESKTOP_MS) {}

  registrar(custoMs: number, intervaloMs: number): void {
    this.custosMs[this.posicao] = custoMs;
    this.intervalosMs[this.posicao] = intervaloMs;
    this.posicao += 1;
    if (this.posicao >= TAMANHO_DA_JANELA) {
      this.posicao = 0;
      this.cheio = true;
    }
  }

  ler(info: { chamadasDeDesenho: number; triangulos: number }): LeituraDoOrcamento {
    const quantidade = this.cheio ? TAMANHO_DA_JANELA : this.posicao;
    if (quantidade === 0) {
      return {
        tetoMs: this.tetoMs,
        quadrosMedidos: 0,
        custoMedioMs: 0,
        intervaloMedioMs: 0,
        piorIntervaloMs: 0,
        quadrosAcimaDoTeto: 0,
        chamadasDeDesenho: info.chamadasDeDesenho,
        triangulos: info.triangulos,
      };
    }

    let somaCusto = 0;
    let somaIntervalo = 0;
    let piorIntervalo = 0;
    let acimaDoTeto = 0;
    for (let i = 0; i < quantidade; i++) {
      somaCusto += this.custosMs[i];
      somaIntervalo += this.intervalosMs[i];
      piorIntervalo = Math.max(piorIntervalo, this.intervalosMs[i]);
      if (this.custosMs[i] > this.tetoMs) acimaDoTeto += 1;
    }

    return {
      tetoMs: this.tetoMs,
      quadrosMedidos: quantidade,
      custoMedioMs: somaCusto / quantidade,
      intervaloMedioMs: somaIntervalo / quantidade,
      piorIntervaloMs: piorIntervalo,
      quadrosAcimaDoTeto: acimaDoTeto,
      chamadasDeDesenho: info.chamadasDeDesenho,
      triangulos: info.triangulos,
    };
  }
}

/** Formata a leitura como linhas de texto prontas para o painel diegético. */
export function linhasDoOrcamento(leitura: LeituraDoOrcamento): string[] {
  if (leitura.quadrosMedidos === 0) {
    return ['Orçamento: aquecendo...'];
  }
  return [
    `Custo médio: ${leitura.custoMedioMs.toFixed(1)} ms (teto ${leitura.tetoMs.toFixed(1)} ms)`,
    `Intervalo médio: ${leitura.intervaloMedioMs.toFixed(1)} ms · pior: ${leitura.piorIntervaloMs.toFixed(1)} ms`,
    `${leitura.quadrosAcimaDoTeto}/${leitura.quadrosMedidos} quadros acima do teto`,
    `${leitura.chamadasDeDesenho} chamadas de desenho · ${leitura.triangulos} triângulos`,
  ];
}
