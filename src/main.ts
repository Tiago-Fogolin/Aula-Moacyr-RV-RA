import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { conferirComposicao, sondar, type ResultadoDaSonda } from './devices/probe';
import { BANCADA, inconsistenciasDoDominio } from './bench/domain/domain';
import { levantarRelatorio } from './bench/modes/verification';
import { Diario, explicarFalha } from './bench/reports/diary';
import { montarEstruturaDaCena, montarRelatorio, montarSonda } from './bench/reports/report';

import { montarCena, type CenaDaOrdenha } from './ordenha/core/cena';
import { montarPalco } from './ordenha/core/palco';
import { Relogio } from './ordenha/core/relogio';
import { Orcamento, linhasDoOrcamento } from './ordenha/core/orcamento';
import { montarLaco } from './ordenha/core/laco';
import { descreverArvore, reparentar } from './ordenha/core/hierarquia';
import { compararOrdem, emMetros } from './ordenha/core/transformacao';
import { montarPainel } from './ordenha/ui/painel';
import { ORDENHA } from './ordenha/dominio/dominio';

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
const botaoReparentarPainel: HTMLElement = exigirElemento('reparentar-painel');
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

// --- Módulo 02: sonda de capacidades, sobre o domínio de exercício "Bancada" ---
const problemasDoDominio: string[] = inconsistenciasDoDominio(BANCADA);
void levantarRelatorio().then((linhas) => {
  montarRelatorio(raizRelatorio, BANCADA, problemasDoDominio, linhas);
  diario.nota('Consulta de regimes sem sessão concluída. A sonda completa espera um toque no botão.');
});

async function executarSonda(): Promise<void> {
  diario.nota('Sondando. Se um visor pedir permissão, aceite: sem ela a sessão não abre.');
  try {
    const resultado: ResultadoDaSonda = await sondar();
    const confronto: string | undefined =
      resultado.emSessao === undefined ? undefined : conferirComposicao(resultado.emSessao);
    montarSonda(raizSonda, resultado, confronto);
    diario.nota('Sondagem concluída e sessão encerrada.');
  } catch (erro: unknown) {
    diario.falha(explicarFalha(erro));
  }
}
botaoSondar.addEventListener('click', () => void executarSonda());

// --- Módulo 03: grafo de cena e laço de renderização, domínio próprio (ordenha) ---
const cena: CenaDaOrdenha = montarCena();
const palco = montarPalco(container);
const relogio: Relogio = new Relogio();
const orcamento: Orcamento = new Orcamento();
const laco = montarLaco(palco, cena.raiz, relogio, orcamento);

const orbit = new OrbitControls(palco.camera, palco.renderer.domElement);
orbit.target.set(0, 1.0, 0);
orbit.update();

const painel = montarPainel();
cena.suporteDoPainel.add(painel.no);

document.body.appendChild(VRButton.createButton(palco.renderer));
document.body.appendChild(
  ARButton.createButton(palco.renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['local-floor', 'bounded-floor', 'dom-overlay'],
    domOverlay: { root: document.body },
  }),
);

const tetas: THREE.Mesh[] = Array.from(cena.tetas.values());
const controllers = setupControllers(palco.renderer, cena.raiz, [...tetas, cena.balde]);
const arHitTest = setupARHitTest(palco.renderer, cena.raiz);

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

function atualizarEstrutura(): void {
  const arvore: string[] = descreverArvore(cena.raiz);
  const frases: string[] = [
    ...ORDENHA.pecas.map((peca) => `${peca.nome}: ${peca.justificativaDeParentesco}`),
    frasesSobreOrdemDeComposicao(),
  ];
  montarEstruturaDaCena(raizEstrutura, arvore, frases);
}
atualizarEstrutura();

// --- Interação: clicar numa teta ordenha e sobe o nível do cilindro de leite ---
const AVANCO_POR_ACERTO: number = 1 / 12; // 12 acertos enchem o balde
const VELOCIDADE_DE_ENCHIMENTO: number = 2; // fração do balde por segundo, ao animar
let progresso: number = 0;
let progressoAnunciado: boolean = false;

const raycaster = new THREE.Raycaster();
const ponteiro = new THREE.Vector2();

palco.renderer.domElement.addEventListener('pointerdown', (evento: PointerEvent) => {
  const retangulo = palco.renderer.domElement.getBoundingClientRect();
  ponteiro.x = ((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1;
  ponteiro.y = -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1;

  raycaster.setFromCamera(ponteiro, palco.camera);
  const acertos = raycaster.intersectObjects(tetas, false);
  if (acertos.length === 0 || progresso >= 1) {
    return;
  }
  progresso = Math.min(1, progresso + AVANCO_POR_ACERTO);
  diario.nota(`Teta "${acertos[0].object.name}" ordenhada. Balde em ${(progresso * 100).toFixed(0)}%.`);
});

// --- Reparentagem: alterna o painel entre o suporte fixo e o balde ---
let painelNoBalde: boolean = false;
botaoReparentarPainel.addEventListener('click', () => {
  const novoPai: THREE.Object3D = painelNoBalde ? cena.suporteDoPainel : cena.balde;
  const desvio: number = reparentar(painel.no, novoPai);
  painelNoBalde = !painelNoBalde;
  botaoReparentarPainel.textContent = painelNoBalde
    ? 'Devolver o painel ao suporte fixo'
    : 'Mover o painel para o balde';
  diario.nota(
    `O painel passou a pertencer a "${novoPai.name}". Desvio residual de posição de mundo: ` +
      `${desvio.toExponential(1)} m.`,
  );
  atualizarEstrutura();
});

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
