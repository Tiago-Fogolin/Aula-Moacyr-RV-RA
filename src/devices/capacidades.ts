import type { RegimeId } from '../regimes/regime';
import type { LinhaDoRelatorio, Suporte } from '../regimes/verification';
import type { EstadoDaSessao, ResultadoDaSonda } from './probe';
import { estadoDoRecurso, type EstadoDeRecurso } from './resources';

/** Recurso que ninguém perguntou ainda — diferente de perguntado e não concedido. */
export type EstadoConsultado = EstadoDeRecurso | 'nao-consultado';

/**
 * O que o aparelho declarou, guardado num lugar só para o resto do ambiente
 * consultar em vez de presumir. Alimentado por três fontes, da mais fraca à mais
 * forte: `isSessionSupported` (sem sessão), a sonda (sessão de teste) e a sessão
 * de verdade, quando ela abre — esta última sobrescreve as anteriores, porque é a
 * resposta do aparelho para o pedido que o ambiente de fato fez.
 */
export class Capacidades {
  private readonly regimes = new Map<RegimeId, Suporte>();
  private readonly recursos = new Map<string, EstadoDeRecurso>();
  private estadoDaSessao: EstadoDaSessao | undefined = undefined;

  registrarRegimes(linhas: readonly LinhaDoRelatorio[]): void {
    for (const linha of linhas) {
      this.regimes.set(linha.regime.id, linha.suporte);
    }
  }

  registrarSonda(resultado: ResultadoDaSonda): void {
    this.estadoDaSessao = resultado.sessao;
    for (const recurso of resultado.emSessao?.recursos ?? []) {
      this.recursos.set(recurso.nome, recurso.estado);
    }
  }

  /** Lê `enabledFeatures` da sessão que o ambiente abriu de verdade. */
  registrarSessao(sessao: XRSession, pedidos: readonly string[]): void {
    this.estadoDaSessao = 'aberta';
    for (const nome of pedidos) {
      this.recursos.set(nome, estadoDoRecurso(nome, sessao.enabledFeatures));
    }
  }

  suporte(regime: RegimeId): Suporte {
    return this.regimes.get(regime) ?? 'desconhecido';
  }

  recurso(nome: string): EstadoConsultado {
    return this.recursos.get(nome) ?? 'nao-consultado';
  }

  sessao(): EstadoDaSessao | undefined {
    return this.estadoDaSessao;
  }
}
