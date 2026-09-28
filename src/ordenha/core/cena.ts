import * as THREE from 'three';
import type { PecaId } from '../dominio/dominio';

/** Escala real (1:1) — Seção 4 do especificacao.md. */
export const COMPRIMENTO_DA_VACA_M: number = 2.4;
export const ALTURA_DA_VACA_M: number = 1.5;
export const ALTURA_DO_BALDE_M: number = 0.4;

/** Peças com geometria simples (a vaca é composta, ver construirVaca()). */
type PecaSimples = Exclude<PecaId, 'vaca'>;

const TETAS_IDS: readonly PecaSimples[] = [
  'teta-frente-esquerda',
  'teta-frente-direita',
  'teta-tras-esquerda',
  'teta-tras-direita',
];

export interface CenaDaOrdenha {
  readonly raiz: THREE.Scene;
  readonly curral: THREE.Group;
  readonly vaca: THREE.Object3D;
  readonly tetas: ReadonlyMap<PecaId, THREE.Mesh>;
  readonly balde: THREE.Mesh;
  readonly cilindroDeLeite: THREE.Mesh;
  readonly suporteDoPainel: THREE.Object3D;
  readonly pecas: ReadonlyMap<PecaId, THREE.Object3D>;
}

/** Material fosco padrão (roughness 0.7, metalness 0.1), reaproveitável. */
export function materialFosco(cor: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.7, metalness: 0.1 });
}

/**
 * Geometria crua por peça — o Módulo 03 proíbe ativo importado (modelagem e ativos
 * externos são dos módulos seguintes), então cada peça nasce como primitiva em
 * código, na escala em metros da Seção 4. A vaca é a exceção: é composta por várias
 * primitivas (ver construirVaca()), não uma só.
 */
export function formaDaPeca(id: PecaSimples): THREE.BufferGeometry {
  switch (id) {
    case 'teta-frente-esquerda':
    case 'teta-frente-direita':
    case 'teta-tras-esquerda':
    case 'teta-tras-direita':
      return new THREE.CylinderGeometry(0.025, 0.035, 0.22, 12);
    case 'balde':
      return new THREE.CylinderGeometry(0.22, 0.18, ALTURA_DO_BALDE_M, 24);
    case 'cilindro-de-leite': {
      const geometria = new THREE.CylinderGeometry(0.14, 0.14, 1, 20);
      // Pivô na base, não no centro: escalar em Y cresce a partir do fundo do balde.
      geometria.translate(0, 0.5, 0);
      return geometria;
    }
  }
}

/** Posição de repouso de cada peça, relativa ao pai declarado em montarCena(). */
export function repousoDoPeca(id: PecaSimples): THREE.Vector3 {
  switch (id) {
    // Tetas: filhas da vaca, penduradas sob a barriga, entre as patas traseiras
    // (X negativo = lado do rabo — ver construirVaca()).
    // As patas traseiras ocupam x entre -0.63 e -0.47 (centro -0.55, raio da
    // cápsula do corpo ~0.35). As quatro tetas ficam à frente disso (x > -0.47),
    // senão a pata de trás entra na frente delas na visão da câmera.
    case 'teta-frente-esquerda':
      return new THREE.Vector3(-0.1, 0.78, -0.14);
    case 'teta-frente-direita':
      return new THREE.Vector3(-0.1, 0.78, 0.14);
    case 'teta-tras-esquerda':
      return new THREE.Vector3(-0.28, 0.78, -0.14);
    case 'teta-tras-direita':
      return new THREE.Vector3(-0.28, 0.78, 0.14);
    // Balde: filho do curral, embaixo do úbere — alinhado em X com as tetas.
    case 'balde':
      return new THREE.Vector3(-0.2, ALTURA_DO_BALDE_M / 2, 0);
    case 'cilindro-de-leite':
      return new THREE.Vector3(0, 0.02, 0);
  }
}

function malha(
  geometria: THREE.BufferGeometry,
  material: THREE.Material,
  posicao: [number, number, number],
  nome?: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometria, material);
  mesh.position.set(...posicao);
  if (nome !== undefined) mesh.name = nome;
  return mesh;
}

/**
 * Vaca de baixo polígono, montada com primitivas (corpo, cabeça, focinho,
 * orelhas, patas, rabo, manchas) até a Seção 12 do especificacao.md trazer um
 * asset importado de verdade. Nasce em pé, com a base das patas em y=0; eixo X
 * aponta do rabo (negativo) pro focinho (positivo).
 */
function construirVaca(): THREE.Group {
  const grupo = new THREE.Group();
  grupo.name = 'vaca';

  const pelagem = materialFosco(0x6b4a34);
  const pelagemClara = materialFosco(0xf2ead9);
  const rosa = materialFosco(0xd9a5a5);
  const escuro = materialFosco(0x2b1f18);

  // Corpo: cápsula deitada (eixo Y da geometria rotacionado 90° em torno de Z
  // fica alinhado com X).
  const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 4, 12), pelagem);
  corpo.rotation.z = Math.PI / 2;
  corpo.position.set(0, 1.15, 0);
  corpo.name = 'corpo-da-vaca';
  grupo.add(corpo);

  // Patas: dianteiras em x=+0.55, traseiras em x=-0.55. Em z=±0.22 a barriga da
  // cápsula (raio 0.35) já não está mais em y=0.8: está em
  // 1.15 - sqrt(0.35² - 0.22²) ≈ 0.878. A pata precisa alcançar até lá (e um
  // pouco além, pra garantir que a ponta fique dentro do corpo, sem folga).
  for (const x of [0.55, -0.55]) {
    for (const z of [0.22, -0.22]) {
      const pata = malha(
        new THREE.CylinderGeometry(0.06, 0.08, 0.95, 10),
        pelagem,
        [x, 0.475, z],
        'pata',
      );
      grupo.add(pata);
    }
  }

  // Cabeça, focinho e orelhas, na ponta dianteira do corpo.
  const cabeca = malha(new THREE.BoxGeometry(0.4, 0.38, 0.42), pelagem, [1.1, 1.1, 0], 'cabeca');
  grupo.add(cabeca);

  const focinho = malha(new THREE.BoxGeometry(0.14, 0.14, 0.34), rosa, [1.37, 0.98, 0], 'focinho');
  grupo.add(focinho);

  for (const z of [0.22, -0.22]) {
    const orelha = malha(new THREE.BoxGeometry(0.14, 0.05, 0.06), pelagem, [1.0, 1.3, z], 'orelha');
    orelha.rotation.y = z > 0 ? -0.4 : 0.4;
    grupo.add(orelha);
  }

  // Rabo: haste + borla escura na ponta. O topo da haste precisa entrar na
  // metade traseira arredondada do corpo (centrada em x=-0.55, raio 0.35), não
  // só chegar perto — por isso o centro fica dentro do raio da cápsula.
  const haste = malha(new THREE.CylinderGeometry(0.02, 0.03, 0.5, 8), pelagem, [-0.85, 0.85, 0], 'rabo');
  haste.rotation.x = 0.25;
  grupo.add(haste);
  const borla = malha(new THREE.SphereGeometry(0.06, 8, 8), escuro, [-0.85, 0.54, -0.08], 'rabo');
  grupo.add(borla);

  // Manchas: só cosmética, aproximadas sobre a superfície da cápsula do corpo.
  const manchas: Array<[number, number, number, number]> = [
    [0.3, 1.35, 0.24, 0.22],
    [-0.3, 0.98, -0.28, 0.2],
    [0.0, 1.46, -0.14, 0.18],
  ];
  for (const [x, y, z, tamanho] of manchas) {
    const mancha = malha(new THREE.SphereGeometry(tamanho, 8, 8), pelagemClara, [x, y, z], 'mancha');
    mancha.scale.set(1, 0.35, 1);
    grupo.add(mancha);
  }

  return grupo;
}

function chao(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a4d2e, roughness: 1 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.name = 'chao';
  return mesh;
}

/** Monta a hierarquia completa da cena de ordenha. */
export function montarCena(): CenaDaOrdenha {
  const raiz = new THREE.Scene();
  raiz.background = new THREE.Color(0x87b6d6);
  raiz.name = 'sala';

  const luzAmbiente = new THREE.HemisphereLight(0xffffff, 0x444422, 1.0);
  luzAmbiente.name = 'luz-ambiente';
  raiz.add(luzAmbiente);

  const luzDirecional = new THREE.DirectionalLight(0xffffff, 1.5);
  luzDirecional.position.set(2, 4, 2);
  luzDirecional.name = 'luz-direcional';
  raiz.add(luzDirecional);

  const curral = new THREE.Group();
  curral.name = 'curral';
  raiz.add(curral);
  curral.add(chao());

  const pecas = new Map<PecaId, THREE.Object3D>();

  const vaca = construirVaca();
  curral.add(vaca);
  pecas.set('vaca', vaca);

  const tetas = new Map<PecaId, THREE.Mesh>();
  for (const id of TETAS_IDS) {
    const teta = new THREE.Mesh(formaDaPeca(id), materialFosco(0xd9a5a5));
    teta.name = id;
    teta.position.copy(repousoDoPeca(id));
    vaca.add(teta);
    tetas.set(id, teta);
    pecas.set(id, teta);
  }

  const balde = new THREE.Mesh(formaDaPeca('balde'), materialFosco(0xb0b0b0));
  balde.name = 'balde';
  balde.position.copy(repousoDoPeca('balde'));
  curral.add(balde);
  pecas.set('balde', balde);

  const cilindroDeLeite = new THREE.Mesh(
    formaDaPeca('cilindro-de-leite'),
    new THREE.MeshStandardMaterial({ color: 0xf5f2e9, roughness: 0.3 }),
  );
  cilindroDeLeite.name = 'cilindro-de-leite';
  cilindroDeLeite.position.copy(repousoDoPeca('cilindro-de-leite'));
  cilindroDeLeite.scale.y = 0.001; // balde nasce vazio
  balde.add(cilindroDeLeite);
  pecas.set('cilindro-de-leite', cilindroDeLeite);

  const suporteDoPainel = new THREE.Object3D();
  suporteDoPainel.name = 'suporte-do-painel';
  suporteDoPainel.position.set(1.6, 1.4, -0.6);
  curral.add(suporteDoPainel);

  return { raiz, curral, vaca, tetas, balde, cilindroDeLeite, suporteDoPainel, pecas };
}
