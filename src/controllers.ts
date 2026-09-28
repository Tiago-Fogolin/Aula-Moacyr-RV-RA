import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { reparentar, type Reparentagem } from './ordenha/core/hierarquia';

export interface OpcoesDosControles {
  /** Objetos que o gatilho prende à mão (troca de pai) enquanto está apertado. */
  readonly pegaveis: readonly THREE.Object3D[];
  /** Objetos que o gatilho aciona sem pegar (as tetas: ordenhar). */
  readonly tocaveis: readonly THREE.Object3D[];
  aoTocar(objeto: THREE.Object3D): void;
  aoReparentar(reparentagem: Reparentagem): void;
}

interface Pegada {
  readonly objeto: THREE.Object3D;
  /** Quem era o pai antes de a mão pegar — é para lá que o objeto volta ao soltar. */
  readonly paiDeOrigem: THREE.Object3D;
}

export function setupControllers(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  opcoes: OpcoesDosControles,
) {
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const modelFactory = new XRControllerModelFactory();
  const alvos: THREE.Object3D[] = [...opcoes.pegaveis, ...opcoes.tocaveis];

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const rayLine = new THREE.Line(
    rayGeometry,
    new THREE.LineBasicMaterial({ color: 0xffffff }),
  );
  rayLine.scale.z = 5;

  const controllers: THREE.XRTargetRaySpace[] = [];
  const pegadas = new Map<THREE.XRTargetRaySpace, Pegada>();
  const realcados: THREE.MeshStandardMaterial[] = [];

  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.name = `mao-${i}`;
    controller.add(rayLine.clone());
    scene.add(controller);

    controller.addEventListener('selectstart', () => onSelectStart(controller));
    controller.addEventListener('selectend', () => onSelectEnd(controller));
    controllers.push(controller);

    const grip = renderer.xr.getControllerGrip(i);
    grip.add(modelFactory.createControllerModel(grip));
    scene.add(grip);
  }

  function intersect(controller: THREE.XRTargetRaySpace): THREE.Intersection | null {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    const hits = raycaster.intersectObjects(alvos, false);
    return hits.length > 0 ? hits[0] : null;
  }

  function onSelectStart(controller: THREE.XRTargetRaySpace): void {
    const hit = intersect(controller);
    if (hit === null) return;
    const objeto = hit.object;

    if (opcoes.tocaveis.includes(objeto)) {
      opcoes.aoTocar(objeto);
      return;
    }
    if (objeto.parent === null) return;
    // Prende o objeto à mão: troca de pai, e não cópia de posição a cada quadro.
    const paiDeOrigem = objeto.parent;
    opcoes.aoReparentar(reparentar(objeto, controller));
    pegadas.set(controller, { objeto, paiDeOrigem });
  }

  function onSelectEnd(controller: THREE.XRTargetRaySpace): void {
    const pegada = pegadas.get(controller);
    if (pegada === undefined) return;
    // Devolve ao pai de origem (o curral), e não à raiz: a árvore não perde o galho.
    opcoes.aoReparentar(reparentar(pegada.objeto, pegada.paiDeOrigem));
    pegadas.delete(controller);
  }

  return {
    /** Realça o objeto sob a mira de cada controller. */
    update(): void {
      for (const material of realcados) material.emissive.setHex(0x000000);
      realcados.length = 0;

      for (const controller of controllers) {
        if (pegadas.has(controller)) continue;
        const hit = intersect(controller);
        const mesh = hit?.object as THREE.Mesh | undefined;
        const mat = mesh?.material as THREE.MeshStandardMaterial | undefined;
        if (mat && 'emissive' in mat) {
          mat.emissive.setHex(0x333333);
          realcados.push(mat);
        }
      }
    },
  };
}
