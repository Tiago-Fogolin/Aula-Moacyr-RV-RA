import * as THREE from 'three';

export const LARGURA_M: number = 0.5;
export const ALTURA_M: number = 0.3;

const LARGURA_PX: number = 500;
const ALTURA_PX: number = 300;
/** Evita redesenhar a textura a cada quadro — só a cada 0.25s. */
const INTERVALO_DE_REDESENHO: number = 0.25;
const CORPO_PX: number = 20;
const ENTRELINHA_PX: number = 28;
const MARGEM_PX: number = 18;
/** Decisão de projeto: abaixo disso, o texto vira ilegível a olho. */
const LIMIAR_DE_LEITURA_MINUTOS: number = 20;

export interface Legibilidade {
  readonly distanciaM: number;
  readonly alturaAparenteMinutos: number;
  readonly legivel: boolean;
}

export interface Painel {
  readonly no: THREE.Mesh;
  atualizar(titulo: string, linhas: readonly string[], delta: number): void;
  /** Gira o painel em torno do eixo vertical para ficar de frente pra câmera. */
  encarar(posicaoDaCamera: THREE.Vector3): void;
  legibilidade(posicaoDaCamera: THREE.Vector3): Legibilidade;
}

function quebrar(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual.length === 0 ? palavra : `${atual} ${palavra}`;
    if (ctx.measureText(tentativa).width > larguraMax && atual.length > 0) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual.length > 0) {
    linhas.push(atual);
  }
  return linhas;
}

function desenhar(
  ctx: CanvasRenderingContext2D,
  titulo: string,
  linhas: readonly string[],
): void {
  ctx.fillStyle = '#101820';
  ctx.fillRect(0, 0, LARGURA_PX, ALTURA_PX);

  ctx.fillStyle = '#eef6ff';
  ctx.font = `bold ${CORPO_PX + 4}px system-ui, sans-serif`;
  ctx.fillText(titulo, MARGEM_PX, MARGEM_PX + CORPO_PX);

  ctx.font = `${CORPO_PX}px system-ui, sans-serif`;
  ctx.fillStyle = '#cfe3f7';
  const larguraUtil = LARGURA_PX - MARGEM_PX * 2;
  let y = MARGEM_PX + CORPO_PX + ENTRELINHA_PX;
  for (const linha of linhas) {
    for (const parte of quebrar(ctx, linha, larguraUtil)) {
      if (y > ALTURA_PX - MARGEM_PX) {
        return;
      }
      ctx.fillText(parte, MARGEM_PX, y);
      y += ENTRELINHA_PX;
    }
  }
}

/** Painel diegético: uma textura em canvas pintada sobre um plano na própria cena. */
export function montarPainel(): Painel {
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA_PX;
  canvas.height = ALTURA_PX;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error('Não foi possível obter contexto 2D para o painel diegético.');
  }

  const textura = new THREE.CanvasTexture(canvas);
  const malha = new THREE.Mesh(
    new THREE.PlaneGeometry(LARGURA_M, ALTURA_M),
    new THREE.MeshBasicMaterial({ map: textura }),
  );
  malha.name = 'painel';

  let tempoDesdeRedesenho = Infinity;

  return {
    no: malha,
    atualizar(titulo, linhas, delta): void {
      tempoDesdeRedesenho += delta;
      if (tempoDesdeRedesenho < INTERVALO_DE_REDESENHO) {
        return;
      }
      tempoDesdeRedesenho = 0;
      desenhar(ctx, titulo, linhas);
      textura.needsUpdate = true;
    },
    encarar(posicaoDaCamera): void {
      const mundo = new THREE.Vector3();
      malha.getWorldPosition(mundo);
      const alvo = posicaoDaCamera.clone();
      alvo.y = mundo.y;
      malha.lookAt(alvo);
    },
    legibilidade(posicaoDaCamera): Legibilidade {
      const mundo = new THREE.Vector3();
      malha.getWorldPosition(mundo);
      const distanciaM = mundo.distanceTo(posicaoDaCamera);
      const alturaAparenteRad = 2 * Math.atan(ALTURA_M / 2 / Math.max(distanciaM, 0.001));
      const alturaAparenteMinutos = ((alturaAparenteRad * 180) / Math.PI) * 60;
      return {
        distanciaM,
        alturaAparenteMinutos,
        legivel: alturaAparenteMinutos >= LIMIAR_DE_LEITURA_MINUTOS,
      };
    },
  };
}
