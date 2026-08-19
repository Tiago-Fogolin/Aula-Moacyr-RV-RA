import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRScene } from './scene';
import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { conferirComposicao, sondar } from './devices/probe';
import { montarSonda } from './bench/reports/report';

// --- Renderer ---
const container = document.getElementById('app') as HTMLDivElement;

const painelSonda: HTMLDivElement = document.createElement('div');
painelSonda.id = 'sonda';
document.body.appendChild(painelSonda);

const saidaSonda: HTMLDivElement = document.createElement('div');
painelSonda.appendChild(saidaSonda);

const botaoSonda: HTMLButtonElement = document.createElement('button');
botaoSonda.type = 'button';
botaoSonda.textContent = 'Sondar aparelho';
botaoSonda.addEventListener('click', async () => {
  botaoSonda.disabled = true;
  botaoSonda.textContent = 'Sondando...';

  try {
    const resultado = await sondar();
    const confronto =
      resultado.emSessao === undefined
        ? undefined
        : conferirComposicao(resultado.emSessao);
    montarSonda(saidaSonda, resultado, confronto);
  } catch (erro: unknown) {
    saidaSonda.replaceChildren();
    const mensagem: HTMLParagraphElement = document.createElement('p');
    mensagem.textContent =
      erro instanceof Error ? `Não foi possível sondar: ${erro.message}` : 'Não foi possível sondar o aparelho.';
    saidaSonda.appendChild(mensagem);
  } finally {
    botaoSonda.disabled = false;
    botaoSonda.textContent = 'Sondar aparelho';
  }
});
painelSonda.appendChild(botaoSonda);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // habilita o loop WebXR
container.appendChild(renderer.domElement);

// --- Cena ---
const xr = new XRScene();

// Órbita com o mouse no desktop (fora do modo imersivo)
const orbit = new OrbitControls(xr.camera, renderer.domElement);
orbit.target.set(0, 1.2, -1);
orbit.update();

// --- Controllers XR ---
const controllers = setupControllers(renderer, xr.scene, xr.interactive);

// --- AR hit-test ---
const arHitTest = setupARHitTest(renderer, xr.scene);

// --- Botões VR e AR ---
document.body.appendChild(VRButton.createButton(renderer));
document.body.appendChild(
  ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['local-floor', 'bounded-floor', 'dom-overlay'],
    domOverlay: { root: document.body },
  }),
);

// --- Loop de animação (use setAnimationLoop, NÃO requestAnimationFrame) ---
const clock = new THREE.Clock();

renderer.setAnimationLoop((_timestamp, frame) => {
  const delta = clock.getDelta();
  xr.update(delta);
  controllers.update();
  if (frame) arHitTest.update(frame);
  renderer.render(xr.scene, xr.camera);
});

// --- Responsividade ---
window.addEventListener('resize', () => {
  xr.camera.aspect = window.innerWidth / window.innerHeight;
  xr.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
