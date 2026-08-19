export interface Estabilidade {
  readonly quadros: number;
  readonly quadrosSemPose: number;
  /** Maior sequência de quadros sem pose. */
  readonly maiorLacuna: number;
  /** Quadros em que a sessão estava fora de foco. */
  readonly quadrosOcultos: number;
}

/** Acumula pose e visibilidade durante a janela observada. */
export class ContadorDeEstabilidade {
  private quadros: number = 0;
  private quadrosSemPose: number = 0;
  private quadrosOcultos: number = 0;
  private maiorLacuna: number = 0;
  private lacunaCorrente: number = 0;

  public registrar(temPose: boolean, visivel: boolean): void {
    this.quadros += 1;

    if (!visivel) {
      this.quadrosOcultos += 1;
      this.lacunaCorrente = 0;
      return;
    }

    if (temPose) {
      this.lacunaCorrente = 0;
      return;
    }

    this.quadrosSemPose += 1;
    this.lacunaCorrente += 1;
    if (this.lacunaCorrente > this.maiorLacuna) {
      this.maiorLacuna = this.lacunaCorrente;
    }
  }

  public resultado(): Estabilidade {
    return {
      quadros: this.quadros,
      quadrosSemPose: this.quadrosSemPose,
      maiorLacuna: this.maiorLacuna,
      quadrosOcultos: this.quadrosOcultos,
    };
  }
}

/** Gera um diagnóstico simples a partir da contagem observada. */
export function diagnosticar(estabilidade: Estabilidade): string {
  if (estabilidade.quadros === 0) {
    return 'Nenhum quadro foi entregue — a sessão não chegou a produzir imagem.';
  }
  if (estabilidade.quadrosSemPose === 0) {
    return 'A pose veio em todos os quadros observados. A janela de observação é curta, e ausência de falha aqui não é promessa de estabilidade em uso prolongado.';
  }
  const proporcao: number = Math.round(
    (estabilidade.quadrosSemPose / estabilidade.quadros) * 100,
  );
  return (
    `A pose faltou em ${proporcao}% dos quadros, com lacuna máxima de ` +
    `${estabilidade.maiorLacuna} quadros seguidos. As causas prováveis são superfície ` +
    'sem textura, iluminação pobre ou movimento brusco — e daqui não se distingue qual delas.'
  );
}