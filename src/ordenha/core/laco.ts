import * as THREE from 'three';
import type { Amostra, Relogio } from './relogio';
import type { Orcamento } from './orcamento';
import type { Palco } from './palco';

export type PassoDoQuadro = (amostra: Amostra, frame: XRFrame | undefined) => void;

export interface Laco {
  aoPasso(passo: PassoDoQuadro): void;
  iniciar(): void;
  parar(): void;
}

/**
 * Laço de renderização sobre `renderer.setAnimationLoop` (funciona também em
 * sessão XR, ao contrário de `requestAnimationFrame` puro). Cada quadro: ajusta o
 * palco, avança o relógio, roda os passos registrados, desenha, e registra o
 * custo no orçamento.
 */
export function montarLaco(
  palco: Palco,
  cena: THREE.Scene,
  relogio: Relogio,
  orcamento: Orcamento,
): Laco {
  const passos: PassoDoQuadro[] = [];

  function quadro(instanteMs: number, frame: XRFrame | undefined): void {
    const inicioMs = performance.now();

    palco.ajustar();
    const amostra = relogio.avancar(instanteMs);
    for (const passo of passos) {
      passo(amostra, frame);
    }
    palco.desenhar(cena);

    const custoMs = performance.now() - inicioMs;
    orcamento.registrar(custoMs, amostra.intervaloReal * 1000);
  }

  return {
    aoPasso(passo: PassoDoQuadro): void {
      passos.push(passo);
    },
    iniciar(): void {
      palco.renderer.setAnimationLoop((instanteMs: number, frame?: XRFrame) =>
        quadro(instanteMs, frame),
      );
    },
    parar(): void {
      palco.renderer.setAnimationLoop(null);
    },
  };
}
