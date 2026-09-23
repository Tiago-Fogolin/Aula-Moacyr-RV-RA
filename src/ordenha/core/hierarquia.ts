import * as THREE from 'three';

/** Posição de mundo do objeto, com as matrizes já atualizadas. */
export function posicaoDeMundo(objeto: THREE.Object3D): THREE.Vector3 {
  objeto.updateWorldMatrix(true, false);
  return new THREE.Vector3().setFromMatrixPosition(objeto.matrixWorld);
}

/**
 * Troca o pai de `objeto` para `novoPai` preservando a posição de mundo
 * (`Object3D.attach` já resolve M_local = M_novoPai⁻¹ · M_mundo por baixo). Retorna
 * o desvio residual em metros entre a posição de mundo antes e depois — deve ficar
 * perto de zero; se não ficar, é erro de arredondamento de ponto flutuante, não um
 * reposicionamento de verdade.
 */
export function reparentar(objeto: THREE.Object3D, novoPai: THREE.Object3D): number {
  const antes = posicaoDeMundo(objeto);
  novoPai.attach(objeto);
  const depois = posicaoDeMundo(objeto);
  return antes.distanceTo(depois);
}

/** Percurso recursivo da árvore, indentado por profundidade. */
export function descreverArvore(raiz: THREE.Object3D, profundidade: number = 0): string[] {
  const rotulo = raiz.name.length > 0 ? raiz.name : `(${raiz.type})`;
  const linhas: string[] = [`${'  '.repeat(profundidade)}${rotulo}`];
  for (const filho of raiz.children) {
    linhas.push(...descreverArvore(filho, profundidade + 1));
  }
  return linhas;
}
