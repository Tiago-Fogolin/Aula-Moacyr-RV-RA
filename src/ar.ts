import * as THREE from 'three';
import { ESCALA_NA_MESA } from './regimes/regime';

/**
 * Hit-test de AR: detecta superfícies reais e mostra um retículo onde você
 * aponta. Ao tocar a tela, o curral inteiro (vaca, tetas, balde) é posto naquele
 * ponto da mesa, em escala 1:8 — um nó só muda, a árvore leva o resto.
 * Só funciona dentro de uma sessão AR com a feature 'hit-test'.
 */
export function setupARHitTest(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  curral: THREE.Object3D,
  aoPosicionar: (posicao: THREE.Vector3) => void,
) {
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4f7cff }),
  );
  reticle.name = 'reticulo';
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  let hitTestSource: XRHitTestSource | null = null;
  let requested = false;

  const controller = renderer.xr.getController(0);
  controller.addEventListener('select', () => {
    if (!reticle.visible) return;
    curral.position.setFromMatrixPosition(reticle.matrix);
    curral.scale.setScalar(ESCALA_NA_MESA);
    curral.visible = true;
    aoPosicionar(curral.position.clone());
  });

  return {
    update(frame: XRFrame): void {
      const session = renderer.xr.getSession();
      if (!session) return;

      const referenceSpace = renderer.xr.getReferenceSpace();
      if (!referenceSpace) return;

      if (!requested) {
        requested = true;
        session.requestReferenceSpace('viewer').then((viewerSpace) => {
          session.requestHitTestSource?.({ space: viewerSpace })?.then(
            (source) => {
              hitTestSource = source;
            },
            () => {
              // hit-test não concedido: o curral fica na posição de reserva (main.ts).
              hitTestSource = null;
            },
          );
        });
        session.addEventListener('end', () => {
          requested = false;
          hitTestSource = null;
          reticle.visible = false;
        });
      }

      if (!hitTestSource) return;

      const results = frame.getHitTestResults(hitTestSource);
      if (results.length > 0) {
        const pose = results[0].getPose(referenceSpace);
        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        }
      } else {
        reticle.visible = false;
      }
    },
  };
}
