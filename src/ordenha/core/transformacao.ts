import * as THREE from 'three';

/** Resultado de compor rotação e translação em ordens diferentes. */
export interface ComparacaoDeOrdem {
  readonly rotacionarDepoisTransladar: THREE.Vector3;
  readonly transladarDepoisRotacionar: THREE.Vector3;
  readonly distanciaEntreResultados: number;
}

/**
 * Compõe uma rotação (em torno do eixo Y — o gesto de "afastar" uma teta) e uma
 * translação (o empurrão lateral) nas duas ordens possíveis, partindo do mesmo
 * ponto local. As ordens só coincidem quando o ângulo é zero ou o deslocamento é
 * paralelo ao eixo de rotação; aqui nenhum dos dois vale, então a distância entre
 * os resultados mede o preço de escolher a ordem errada na cena.
 */
export function compararOrdem(
  pontoLocal: THREE.Vector3,
  deslocamento: THREE.Vector3,
  anguloEmRadianos: number,
): ComparacaoDeOrdem {
  const rotacao = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    anguloEmRadianos,
  );

  // R * p + T
  const rotacionarDepoisTransladar = pontoLocal
    .clone()
    .applyQuaternion(rotacao)
    .add(deslocamento);

  // R * (p + T)
  const transladarDepoisRotacionar = pontoLocal
    .clone()
    .add(deslocamento)
    .applyQuaternion(rotacao);

  return {
    rotacionarDepoisTransladar,
    transladarDepoisRotacionar,
    distanciaEntreResultados: rotacionarDepoisTransladar.distanceTo(
      transladarDepoisRotacionar,
    ),
  };
}

/** Formata um vetor em metros com três casas decimais. */
export function emMetros(vetor: THREE.Vector3): string {
  return `(${vetor.x.toFixed(3)}, ${vetor.y.toFixed(3)}, ${vetor.z.toFixed(3)}) m`;
}
