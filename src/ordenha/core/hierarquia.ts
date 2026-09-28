import * as THREE from 'three';

/** Folga para considerar a escala de mundo de um nó uniforme (1 parte em 10⁶). */
const TOLERANCIA_DE_ESCALA: number = 1e-6;

/** Posição de mundo do objeto, com as matrizes já atualizadas. */
export function posicaoDeMundo(objeto: THREE.Object3D): THREE.Vector3 {
  objeto.updateWorldMatrix(true, false);
  return new THREE.Vector3().setFromMatrixPosition(objeto.matrixWorld);
}

/** O que aconteceu numa troca de pai, em números — para conferir, não olhar. */
export interface Reparentagem {
  readonly paiAnterior: string;
  readonly novoPai: string;
  readonly mundoAntes: THREE.Vector3;
  readonly mundoDepois: THREE.Vector3;
  readonly localAntes: THREE.Vector3;
  readonly localDepois: THREE.Vector3;
  /** Distância em metros entre a posição de mundo antes e depois. */
  readonly desvio: number;
  /**
   * O novo pai tem escala de mundo diferente por eixo. A posição continua
   * preservada, mas rotação sob escala não uniforme vira cisalhamento, que a
   * decomposição em posição/rotação/escala não representa — a orientação do filho
   * sai aproximada.
   */
  readonly escalaNaoUniforme: boolean;
}

function rotulo(objeto: THREE.Object3D | null): string {
  if (objeto === null) return '(sem pai)';
  return objeto.name.length > 0 ? objeto.name : `(${objeto.type})`;
}

function ehDescendente(candidato: THREE.Object3D, ancestral: THREE.Object3D): boolean {
  for (let no: THREE.Object3D | null = candidato; no !== null; no = no.parent) {
    if (no === ancestral) return true;
  }
  return false;
}

function temEscalaNaoUniforme(no: THREE.Object3D): boolean {
  no.updateWorldMatrix(true, false);
  const escala = new THREE.Vector3().setFromMatrixScale(no.matrixWorld);
  return (
    Math.abs(escala.x - escala.y) > TOLERANCIA_DE_ESCALA * Math.abs(escala.x) ||
    Math.abs(escala.x - escala.z) > TOLERANCIA_DE_ESCALA * Math.abs(escala.x)
  );
}

/**
 * Troca o pai de `objeto` para `novoPai` preservando a posição de mundo, numa
 * operação só. A conta é M_local_novo = (M_mundo_novoPai)⁻¹ · M_mundo_objeto —
 * `Object3D.attach` a faz por baixo. Nenhuma coordenada é ajustada à mão.
 *
 * Casos de fronteira:
 * - novo pai igual ao objeto, ou descendente dele: recusado (formaria um ciclo, e
 *   o percurso da árvore nunca terminaria);
 * - novo pai igual ao pai atual: a conta roda do mesmo jeito e o desvio é zero;
 * - novo pai com escala não uniforme: a posição é preservada, e o retorno avisa que
 *   a orientação pode sair aproximada (ver `escalaNaoUniforme`).
 */
export function reparentar(objeto: THREE.Object3D, novoPai: THREE.Object3D): Reparentagem {
  if (ehDescendente(novoPai, objeto)) {
    throw new Error(
      `Não dá para pôr "${rotulo(objeto)}" dentro de "${rotulo(novoPai)}": ` +
        'o novo pai é o próprio objeto ou um descendente dele, e isso formaria um ciclo.',
    );
  }

  const paiAnterior = rotulo(objeto.parent);
  const localAntes = objeto.position.clone();
  const mundoAntes = posicaoDeMundo(objeto);

  novoPai.attach(objeto);   // M_local = (M_mundo_novoPai)⁻¹ · M_mundo_objeto

  const mundoDepois = posicaoDeMundo(objeto);
  return {
    paiAnterior,
    novoPai: rotulo(novoPai),
    mundoAntes,
    mundoDepois,
    localAntes,
    localDepois: objeto.position.clone(),
    desvio: mundoAntes.distanceTo(mundoDepois),
    escalaNaoUniforme: temEscalaNaoUniforme(novoPai),
  };
}

/** Percurso recursivo da árvore, indentado por profundidade. */
export function descreverArvore(raiz: THREE.Object3D, profundidade: number = 0): string[] {
  const linhas: string[] = [`${'  '.repeat(profundidade)}${rotulo(raiz)}`];
  for (const filho of raiz.children) {
    linhas.push(...descreverArvore(filho, profundidade + 1));
  }
  return linhas;
}

/** Resultado de um caso de fronteira conferido por `conferirCasosDeFronteira`. */
export interface CasoConferido {
  readonly caso: string;
  readonly desvioM: number;
  readonly observacao: string;
}

/**
 * Roda `reparentar` sobre uma árvore descartável, fora da cena, nos casos em que a
 * composição costuma errar pouco e só acusar quando a cena cresce. Cada caso
 * devolve o desvio de posição de mundo em metros.
 */
export function conferirCasosDeFronteira(): CasoConferido[] {
  const casos: CasoConferido[] = [];

  // 1. Pai girado e transladado (curral virado 90° e deslocado).
  {
    const raiz = new THREE.Object3D();
    const origem = new THREE.Object3D();
    origem.position.set(1, 0, -2);
    origem.rotation.y = Math.PI / 2;
    const destino = new THREE.Object3D();
    destino.position.set(-0.5, 0.8, 0.3);
    destino.rotation.set(0.3, -1.1, 0.2);
    const objeto = new THREE.Object3D();
    objeto.position.set(0.2, 0.4, 0.1);
    raiz.add(origem, destino);
    origem.add(objeto);
    const r = reparentar(objeto, destino);
    casos.push({ caso: 'pai girado e transladado', desvioM: r.desvio, observacao: '' });
  }

  // 2. Escala uniforme 1:8, a do curral sobre a mesa em AR.
  {
    const raiz = new THREE.Object3D();
    const mesa = new THREE.Object3D();
    mesa.scale.setScalar(0.125);
    mesa.position.set(0.3, 0.75, -0.4);
    const objeto = new THREE.Object3D();
    objeto.position.set(0.3, 0.9, -0.4);
    raiz.add(mesa, objeto);
    const r = reparentar(objeto, mesa);
    casos.push({
      caso: 'novo pai em escala 1:8 (AR)',
      desvioM: r.desvio,
      observacao: `local passou a ${r.localDepois.y.toFixed(3)} m em y (8× o deslocamento de mundo)`,
    });
  }

  // 3. Cadeia de cinco níveis, cada um girado — o erro de composição se acumula por nível.
  {
    const raiz = new THREE.Object3D();
    let fundo: THREE.Object3D = raiz;
    for (let nivel = 0; nivel < 5; nivel++) {
      const no = new THREE.Object3D();
      no.position.set(0.1 * nivel, 0.2, -0.1);
      no.rotation.set(0.2 * nivel, 0.5, -0.3);
      fundo.add(no);
      fundo = no;
    }
    const objeto = new THREE.Object3D();
    objeto.position.set(0.05, 0.05, 0.05);
    fundo.add(objeto);
    const r = reparentar(objeto, raiz);
    casos.push({ caso: 'subir 5 níveis de uma vez', desvioM: r.desvio, observacao: '' });
  }

  // 4. Ida e volta 1000 vezes entre dois pais girados: arredondamento acumulado.
  {
    const raiz = new THREE.Object3D();
    const a = new THREE.Object3D();
    a.position.set(1.3, 0.2, 0.7);
    a.rotation.set(0.4, 1.2, -0.6);
    const b = new THREE.Object3D();
    b.position.set(-0.8, 1.1, -0.2);
    b.rotation.set(-0.9, 0.3, 0.8);
    raiz.add(a, b);
    const objeto = new THREE.Object3D();
    objeto.position.set(0.25, -0.1, 0.4);
    a.add(objeto);
    const inicio = posicaoDeMundo(objeto);
    for (let i = 0; i < 1000; i++) {
      reparentar(objeto, i % 2 === 0 ? b : a);
    }
    casos.push({
      caso: '1000 trocas de pai seguidas',
      desvioM: inicio.distanceTo(posicaoDeMundo(objeto)),
      observacao: 'erro acumulado, não de uma troca só',
    });
  }

  // 5. Novo pai com escala não uniforme (como o cilindro de leite, escalado só em Y).
  {
    const raiz = new THREE.Object3D();
    const cilindro = new THREE.Object3D();
    cilindro.scale.set(1, 0.4, 1);
    cilindro.rotation.z = 0.3;
    const objeto = new THREE.Object3D();
    objeto.position.set(0.1, 0.3, 0);
    objeto.rotation.y = 0.7;
    raiz.add(cilindro, objeto);
    const r = reparentar(objeto, cilindro);
    casos.push({
      caso: 'novo pai com escala não uniforme',
      desvioM: r.desvio,
      observacao: r.escalaNaoUniforme
        ? 'posição preservada; orientação aproximada (cisalhamento) — sinalizado'
        : 'não sinalizado',
    });
  }

  // 6. Tentar pôr um objeto dentro do próprio filho: tem de ser recusado.
  {
    const pai = new THREE.Object3D();
    const filho = new THREE.Object3D();
    pai.add(filho);
    let recusado = false;
    try {
      reparentar(pai, filho);
    } catch {
      recusado = true;
    }
    casos.push({
      caso: 'objeto dentro do próprio filho',
      desvioM: 0,
      observacao: recusado ? 'recusado (formaria ciclo)' : 'ACEITO — erro',
    });
  }

  return casos;
}
