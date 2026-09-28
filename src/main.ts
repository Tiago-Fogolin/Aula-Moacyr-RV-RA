import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { conferirComposicao, sondar, type ResultadoDaSonda } from './devices/probe';
import { Capacidades } from './devices/capacidades';
import { levantarRelatorio } from './regimes/verification';
import { Diario, explicarFalha } from './relatorio/diary';
import { montarEstruturaDaCena, montarRelatorio, montarSonda } from './relatorio/report';

import { montarCena, type CenaDaOrdenha } from './ordenha/core/cena';
import { montarPalco } from './ordenha/core/palco';
import { Relogio } from './ordenha/core/relogio';
import { Orcamento, TETO_DESKTOP_MS, TETO_VISOR_MS, linhasDoOrcamento } from './ordenha/core/orcamento';
import { montarLaco } from './ordenha/core/laco';
import {
  conferirCasosDeFronteira,
  descreverArvore,
  posicaoDeMundo,
  reparentar,
  type Reparentagem,
} from './ordenha/core/hierarquia';
import { compararOrdem, emMetros } from './ordenha/core/transformacao';
import { montarPainel } from './ordenha/ui/painel';
import { ORDENHA, pecasAusentes } from './ordenha/dominio/dominio';
import { ESCALA_NA_MESA } from './regimes/regime';

function exigirElemento(id: string): HTMLElement {
  const elemento: HTMLElement | null = document.getElementById(id);
  if (elemento === null) {
    throw new Error(`A página não tem o elemento #${id}.`);
  }
  return elemento;
}

const container: HTMLElement = exigirElemento('app');
const raizRelatorio: HTMLElement = exigirElemento('relatorio');
const raizEstrutura: HTMLElement = exigirElemento('estrutura');
const raizDiario: HTMLElement = exigirElemento('diario');
const botaoDeslocarVaca: HTMLElement = exigirElemento('deslocar-vaca');
const botaoPegarBalde: HTMLElement = exigirElemento('pegar-balde');
const raizSonda: HTMLElement = exigirElemento('sonda-saida');
const botaoSondar: HTMLElement = exigirElemento('sondar');

const diario: Diario = new Diario();
diario.fixarDestino(raizDiario);

if (!window.isSecureContext) {
  diario.alerta(
    'Esta página não está em contexto seguro. A API XR não é exposta aqui, e o botão vai ' +
      'responder como se o aparelho não tivesse suporte — o que seria mentira sobre o aparelho.',
  );
}

// --- Módulo 03: grafo de cena e laço de renderização ---
const cena: CenaDaOrdenha = montarCena();
const palco = montarPalco(container);
const relogio: Relogio = new Relogio();
const orcamento: Orcamento = new Orcamento(TETO_DESKTOP_MS);
const laco = montarLaco(palco, cena.raiz, relogio, orcamento);

// A câmera entra na árvore: na janela, ela é a "mão" que carrega o balde.
palco.camera.name = 'camera';
cena.raiz.add(palco.camera);

const orbit = new OrbitControls(palco.camera, palco.renderer.domElement);
orbit.target.set(0, 1.0, 0);
orbit.update();

const painel = montarPainel();
cena.suporteDoPainel.add(painel.no);

// --- Módulo 02: sonda de capacidades e relatório dos regimes, no domínio da ordenha ---
/** O que o aparelho declarou — o resto do ambiente consulta aqui, em vez de presumir. */
const capacidades: Capacidades = new Capacidades();

void levantarRelatorio().then((linhas) => {
  capacidades.registrarRegimes(linhas);
  montarRelatorio(raizRelatorio, ORDENHA, pecasAusentes(ORDENHA, cena.pecas), linhas);
  if (capacidades.suporte('immersive-vr') === 'nao' && capacidades.suporte('immersive-ar') === 'nao') {
    diario.nota('Este aparelho só sustenta o regime de tela: VR e AR foram respondidos como ausentes.');
  }
  diario.nota('Consulta de regimes sem sessão concluída. A sonda completa espera um toque no botão.');
});

async function executarSonda(): Promise<void> {
  diario.nota('Sondando. Se um visor pedir permissão, aceite: sem ela a sessão não abre.');
  try {
    const resultado: ResultadoDaSonda = await sondar();
    capacidades.registrarSonda(resultado);
    const confronto: string | undefined =
      resultado.emSessao === undefined ? undefined : conferirComposicao(resultado.emSessao);
    montarSonda(raizSonda, resultado, confronto);
    diario.nota('Sondagem concluída e sessão encerrada.');
  } catch (erro: unknown) {
    diario.falha(explicarFalha(erro));
  }
}
botaoSondar.addEventListener('click', () => void executarSonda());

/**
 * Compara compor rotação (o gesto de "afastar" uma teta) e translação nas duas
 * ordens possíveis — a distância entre os resultados mostra por que a cena precisa
 * fixar uma ordem só.
 */
function frasesSobreOrdemDeComposicao(): string {
  const comparacao = compararOrdem(
    new THREE.Vector3(0, 0, 0.12),
    new THREE.Vector3(0.08, 0, 0),
    Math.PI / 6,
  );
  return (
    `Rotacionar e depois transladar uma teta dá ${emMetros(comparacao.rotacionarDepoisTransladar)}; ` +
    `transladar e depois rotacionar dá ${emMetros(comparacao.transladarDepoisRotacionar)}. ` +
    `A ordem muda o resultado em ${comparacao.distanciaEntreResultados.toFixed(3)} m — por isso a ` +
    'cena sempre aplica rotação e depois posição de repouso, nessa ordem fixa.'
  );
}

const casosDeFronteira: string[] = conferirCasosDeFronteira().map(
  (caso) =>
    `${caso.caso}: desvio ${caso.desvioM.toExponential(1)} m` +
    (caso.observacao.length > 0 ? ` — ${caso.observacao}` : ''),
);

function atualizarEstrutura(): void {
  const arvore: string[] = descreverArvore(cena.raiz);
  const frases: string[] = [
    ...ORDENHA.pecas.map((peca) => `${peca.nome}: ${peca.justificativaDeParentesco}`),
    frasesSobreOrdemDeComposicao(),
  ];
  montarEstruturaDaCena(raizEstrutura, arvore, frases, casosDeFronteira);
}
atualizarEstrutura();

function descreverReparentagem(nome: string, r: Reparentagem): string {
  return (
    `"${nome}" trocou de pai: ${r.paiAnterior} → ${r.novoPai}. ` +
    `Mundo antes ${emMetros(r.mundoAntes)}, depois ${emMetros(r.mundoDepois)} ` +
    `(desvio ${r.desvio.toExponential(1)} m). ` +
    `Local antes ${emMetros(r.localAntes)}, depois ${emMetros(r.localDepois)}.` +
    (r.escalaNaoUniforme ? ' Atenção: novo pai com escala não uniforme.' : '')
  );
}

function registrarReparentagem(nome: string, r: Reparentagem): void {
  diario.nota(descreverReparentagem(nome, r));
  atualizarEstrutura();
}

// --- Ordenhar: acertar uma teta sobe o nível do cilindro de leite ---
const AVANCO_POR_ACERTO: number = 1 / 12; // 12 acertos enchem o balde
const VELOCIDADE_DE_ENCHIMENTO: number = 2; // fração do balde por segundo, ao animar
let progresso: number = 0;
let progressoAnunciado: boolean = false;

function ordenhar(teta: THREE.Object3D): void {
  if (progresso >= 1) return;
  progresso = Math.min(1, progresso + AVANCO_POR_ACERTO);
  diario.nota(`Teta "${teta.name}" ordenhada. Balde em ${(progresso * 100).toFixed(0)}%.`);
}

const tetas: THREE.Mesh[] = Array.from(cena.tetas.values());
const raycaster = new THREE.Raycaster();
const ponteiro = new THREE.Vector2();

palco.renderer.domElement.addEventListener('pointerdown', (evento: PointerEvent) => {
  const retangulo = palco.renderer.domElement.getBoundingClientRect();
  ponteiro.x = ((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1;
  ponteiro.y = -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1;

  raycaster.setFromCamera(ponteiro, palco.camera);
  const acertos = raycaster.intersectObjects(tetas, false);
  if (acertos.length > 0) {
    ordenhar(acertos[0].object);
  }
});

// --- Parentesco: deslocar a vaca leva as tetas junto, sem somar coordenada ---
const DESLOCAMENTO_DA_VACA_M: number = 0.6;
const VELOCIDADE_DA_VACA_M_S: number = 0.5;
let alvoDaVacaZ: number = 0;
let vacaEmMovimento: boolean = false;
const tetaDeReferencia: THREE.Mesh = tetas[0];
let tetaMundoAntes: THREE.Vector3 = new THREE.Vector3();
let tetaLocalAntes: THREE.Vector3 = new THREE.Vector3();

botaoDeslocarVaca.addEventListener('click', () => {
  if (vacaEmMovimento) return;
  alvoDaVacaZ = alvoDaVacaZ === 0 ? DESLOCAMENTO_DA_VACA_M : 0;
  tetaMundoAntes = posicaoDeMundo(tetaDeReferencia);
  tetaLocalAntes = tetaDeReferencia.position.clone();
  vacaEmMovimento = true;
});

function avancarVaca(delta: number): void {
  if (!vacaEmMovimento) return;
  const diferenca: number = alvoDaVacaZ - cena.vaca.position.z;
  const passo: number = VELOCIDADE_DA_VACA_M_S * delta;
  if (Math.abs(diferenca) > passo) {
    cena.vaca.position.z += Math.sign(diferenca) * passo;
    return;
  }
  cena.vaca.position.z = alvoDaVacaZ;

  vacaEmMovimento = false;
  diario.nota(
    `A vaca andou até z = ${alvoDaVacaZ.toFixed(2)} m. "${tetaDeReferencia.name}": ` +
      `mundo ${emMetros(tetaMundoAntes)} → ${emMetros(posicaoDeMundo(tetaDeReferencia))}; ` +
      `local ${emMetros(tetaLocalAntes)} → ${emMetros(tetaDeReferencia.position)} (inalterada — ` +
      'ninguém mexeu na teta, só no pai).',
  );
}

// --- Troca de pai: pegar o balde (curral → mão/câmera) e soltar (→ curral) ---
let baldeNaMao: boolean = false;
botaoPegarBalde.addEventListener('click', () => {
  const novoPai: THREE.Object3D = baldeNaMao ? cena.curral : palco.camera;
  registrarReparentagem('balde', reparentar(cena.balde, novoPai));
  baldeNaMao = !baldeNaMao;
  botaoPegarBalde.textContent = baldeNaMao
    ? 'Soltar o balde no curral (troca de pai → curral)'
    : 'Pegar o balde (troca de pai → câmera)';
});

// --- Regimes: o que muda na cena ao entrar em cada sessão ---
/** No visor, a vaca nasce 0,8 m à frente, com o úbere na direção de quem joga. */
const POSICAO_NO_VISOR = new THREE.Vector3(0.2, 0, -0.8);
/** Recursos que a sessão AR pede — todos opcionais, para a sessão abrir e dizer o que deu. */
const RECURSOS_DO_AR: readonly string[] = ['hit-test', 'local-floor', 'bounded-floor', 'dom-overlay'];
/** Sem hit-test: curral 0,6 m à frente, na altura típica de uma mesa (0,75 m). */
const RESERVA_SEM_MESA = new THREE.Vector3(0, 0.75, -0.6);

function curralNaReserva(): void {
  cena.curral.position.copy(RESERVA_SEM_MESA);
  if (capacidades.recurso('local-floor') !== 'concedido') {
    // Sem chão, a origem é a altura da cabeça: 0,45 m abaixo dela, em vez de 0,75 m acima do chão.
    cena.curral.position.y = -0.45;
  }
  cena.curral.scale.setScalar(ESCALA_NA_MESA);
  cena.curral.visible = true;
}
const fundoDaJanela = cena.raiz.background;
const chao: THREE.Object3D | undefined = cena.curral.getObjectByName('chao');

palco.renderer.xr.addEventListener('sessionstart', () => {
  const sessao = palco.renderer.xr.getSession();
  const ehAr: boolean = sessao !== null && sessao.environmentBlendMode !== 'opaque';
  if (ehAr && sessao !== null) {
    // Pela câmera: o mundo real fica; fundo e chão sintéticos sairiam por cima dele.
    cena.raiz.background = null;
    if (chao !== undefined) chao.visible = false;
    orcamento.tetoMs = TETO_DESKTOP_MS;
    capacidades.registrarSessao(sessao, RECURSOS_DO_AR);

    // Cada estado do hit-test pede uma resposta diferente do ambiente.
    switch (capacidades.recurso('hit-test')) {
      case 'concedido':
        cena.curral.visible = false; // só aparece quando tocar numa mesa
        diario.nota('Sessão AR aberta, hit-test concedido. Aponte para uma mesa e toque para pôr o curral em escala 1:8.');
        break;
      case 'nao-concedido':
        curralNaReserva();
        diario.alerta(
          'Sessão AR aberta SEM hit-test: o aparelho não o concedeu. O curral foi posto 0,6 m à ' +
            'frente, sem registro contra a mesa — ele não fica preso a superfície nenhuma.',
        );
        break;
      case 'indeterminado':
      case 'nao-consultado':
        curralNaReserva();
        diario.alerta(
          'Sessão AR aberta, e o navegador não informou se o hit-test veio. O curral foi posto ' +
            '0,6 m à frente; se o retículo aparecer, um toque o leva para a mesa.',
        );
        break;
    }
  } else {
    cena.curral.position.copy(POSICAO_NO_VISOR);
    orcamento.tetoMs = TETO_VISOR_MS;
    diario.nota(`Sessão VR aberta. Teto do quadro passa a ${TETO_VISOR_MS} ms (90 Hz).`);
  }
});

palco.renderer.xr.addEventListener('sessionend', () => {
  cena.raiz.background = fundoDaJanela;
  if (chao !== undefined) chao.visible = true;
  cena.curral.visible = true;
  cena.curral.position.set(0, 0, 0);
  cena.curral.scale.setScalar(1);
  orcamento.tetoMs = TETO_DESKTOP_MS;
  diario.nota('Sessão encerrada; de volta à janela.');
});

/**
 * Os dois botões do three.js se centralizam sozinhos na página (e refazem o `left`
 * quando o isSessionSupported responde), então um cobre o outro. Cada um vai numa
 * metade da largura: centralizado dentro dela, e não da página.
 */
function metadeDaTela(lado: 'esquerda' | 'direita', botao: HTMLElement): HTMLElement {
  const metade: HTMLDivElement = document.createElement('div');
  metade.style.cssText =
    `position: fixed; bottom: 0; height: 0; width: 50%; z-index: 999; ` +
    (lado === 'esquerda' ? 'left: 0;' : 'left: 50%;');
  metade.appendChild(botao);
  return metade;
}

document.body.appendChild(metadeDaTela('esquerda', VRButton.createButton(palco.renderer)));
document.body.appendChild(
  metadeDaTela(
    'direita',
    ARButton.createButton(palco.renderer, {
      optionalFeatures: [...RECURSOS_DO_AR],
      domOverlay: { root: document.body },
    }),
  ),
);

const controllers = setupControllers(palco.renderer, cena.raiz, {
  pegaveis: [cena.balde],
  tocaveis: tetas,
  aoTocar: ordenhar,
  aoReparentar: (r) => registrarReparentagem('balde', r),
});
const arHitTest = setupARHitTest(palco.renderer, cena.raiz, cena.curral, (posicao) =>
  diario.nota(`Curral posto sobre a mesa em ${emMetros(posicao)}, escala 1:8.`),
);

// --- Laço de renderização ---
laco.aoPasso((amostra, frame) => {
  const alvoDeEscala: number = Math.max(0.001, progresso);
  const diferenca: number = alvoDeEscala - cena.cilindroDeLeite.scale.y;
  const passo: number = VELOCIDADE_DE_ENCHIMENTO * amostra.delta;
  cena.cilindroDeLeite.scale.y += Math.sign(diferenca) * Math.min(passo, Math.abs(diferenca));

  if (progresso >= 1 && !progressoAnunciado) {
    progressoAnunciado = true;
    diario.nota('Balde cheio! O cilindro de leite atingiu 100% do volume.');
  }

  avancarVaca(amostra.delta);

  painel.encarar(palco.camera.position);
  const leitura = orcamento.ler({
    chamadasDeDesenho: palco.renderer.info.render.calls,
    triangulos: palco.renderer.info.render.triangles,
  });
  painel.atualizar(
    'Ordenha — orçamento',
    [...linhasDoOrcamento(leitura), `Balde: ${(progresso * 100).toFixed(0)}%`],
    amostra.delta,
  );

  controllers.update();
  if (frame !== undefined) {
    arHitTest.update(frame);
  }
});
laco.iniciar();
