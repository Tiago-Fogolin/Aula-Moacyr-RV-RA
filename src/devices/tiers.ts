export type GrausDeLiberdade = 'tres' | 'seis' | 'indeterminado';

export type ClasseDeAparelho =
  | 'sem-api'
  | 'somente-janela'
  | 'visor-sem-posicao'
  | 'visor-com-posicao'
  | 'aparelho-de-mao-com-camera';

export interface LeituraDeEspacos {
  readonly concedidos: readonly string[];
  readonly modo: 'immersive-vr' | 'immersive-ar';
  readonly comPoseDePunho: boolean;
}

export function grausDeLiberdade(leitura: LeituraDeEspacos): GrausDeLiberdade {
  const temChao: boolean =
    leitura.concedidos.includes('local-floor') ||
    leitura.concedidos.includes('bounded-floor') ||
    leitura.concedidos.includes('unbounded');
  if (temChao) {
    return 'seis';
  }
  if (leitura.concedidos.length === 1 && leitura.concedidos[0] === 'viewer') {
    return 'tres';
  }
  return 'indeterminado';
}

export function classificarAparelho(
  modosSuportados: readonly string[],
  graus: GrausDeLiberdade,
  temApiXr: boolean,
): ClasseDeAparelho {
  if (!temApiXr) {
    return 'sem-api';
  }
  const suportaVr: boolean = modosSuportados.includes('immersive-vr');
  const suportaAr: boolean = modosSuportados.includes('immersive-ar');

  if (!suportaVr && !suportaAr) {
    return 'somente-janela';
  }
  if (suportaAr && !suportaVr) {
    return 'aparelho-de-mao-com-camera';
  }
  return graus === 'tres' ? 'visor-sem-posicao' : 'visor-com-posicao';
}

export function descreverClasse(classe: ClasseDeAparelho): string {
  switch (classe) {
    case 'sem-api':
      return 'Navegador sem a API XR, ou página fora de contexto seguro.';
    case 'somente-janela':
      return 'Aparelho que só sustenta o regime de janela — é o caso do desktop do laboratório.';
    case 'visor-sem-posicao':
      return 'Visor que acompanha a rotação da cabeça e não acompanha o deslocamento.';
    case 'visor-com-posicao':
      return 'Visor que acompanha rotação e deslocamento, com o chão do ambiente como referência.';
    case 'aparelho-de-mao-com-camera':
      return 'Aparelho de mão que compõe o virtual sobre a imagem da própria câmera.';
  }
}