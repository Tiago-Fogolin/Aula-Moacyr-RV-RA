export type Severidade = 'nota' | 'alerta' | 'falha';

export interface Entrada {
  readonly severidade: Severidade;
  readonly texto: string;
}

export class Diario {
  private readonly entradas: Entrada[] = [];
  private destino: HTMLElement | undefined = undefined;

  public fixarDestino(destino: HTMLElement): void {
    this.destino = destino;
    this.redesenhar();
  }

  public nota(texto: string): void {
    this.registrar({ severidade: 'nota', texto });
  }

  public alerta(texto: string): void {
    this.registrar({ severidade: 'alerta', texto });
  }

  public falha(texto: string): void {
    this.registrar({ severidade: 'falha', texto });
  }

  private registrar(entrada: Entrada): void {
    this.entradas.push(entrada);
    console.info(`[bancada:${entrada.severidade}] ${entrada.texto}`);
    this.redesenhar();
  }

  private redesenhar(): void {
    const destino: HTMLElement | undefined = this.destino;
    if (destino === undefined) {
      return;
    }
    destino.replaceChildren();
    for (const entrada of this.entradas) {
      const linha: HTMLParagraphElement = document.createElement('p');
      linha.className = `diario diario-${entrada.severidade}`;
      linha.textContent = entrada.texto;
      destino.appendChild(linha);
    }
  }
}

export function explicarFalha(erro: unknown): string {
  if (erro instanceof DOMException && erro.name === 'NotSupportedError') {
    return 'O aparelho recusou a sessão neste modo. Ele não a sustenta, e o pedido foi respondido.';
  }
  if (erro instanceof DOMException && erro.name === 'SecurityError') {
    return 'O navegador recusou o pedido por falta de gesto de quem usa ou por contexto inseguro. O botão precisa ser tocado, e a página precisa estar em conexão cifrada.';
  }
  if (erro instanceof DOMException && erro.name === 'InvalidStateError') {
    return 'Já existe uma sessão aberta neste navegador. Encerre a anterior antes de sondar de novo.';
  }
  if (erro instanceof Error) {
    return `A sondagem parou: ${erro.message}`;
  }
  return 'A sondagem parou por um motivo que o navegador não descreveu.';
}
