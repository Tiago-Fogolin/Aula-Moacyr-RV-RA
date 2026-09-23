import * as THREE from 'three';

export const DENSIDADE_MAXIMA: number = 2;

export interface Palco {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  /** Confere o tamanho do canvas a cada quadro — não depende do evento `resize`. */
  ajustar(): void;
  desenhar(cena: THREE.Scene): void;
}

/** Monta o renderer e a câmera, enquadrando o curral por padrão. */
export function montarPalco(container: HTMLElement): Palco {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DENSIDADE_MAXIMA));
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
  camera.position.set(2.2, 1.9, 3.2);

  let larguraAnterior = -1;
  let alturaAnterior = -1;

  function ajustar(): void {
    const largura = container.clientWidth;
    const altura = container.clientHeight;
    if (largura === larguraAnterior && altura === alturaAnterior) {
      return;
    }
    larguraAnterior = largura;
    alturaAnterior = altura;
    renderer.setSize(largura, altura);
    camera.aspect = largura / Math.max(1, altura);
    camera.updateProjectionMatrix();
  }

  function desenhar(cena: THREE.Scene): void {
    renderer.render(cena, camera);
  }

  ajustar();

  return { renderer, camera, ajustar, desenhar };
}
