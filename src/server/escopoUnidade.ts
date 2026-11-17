/**
 * DT-08: isolamento por filial. Quem tem unidadeId na sessão (aluno ou admin
 * de filial) só enxerga dados da própria unidade; admin sem unidade é global.
 */
export function filtroDaUnidade(unidadeIdDaSessao?: string | null) {
  return unidadeIdDaSessao ? { unidadeId: unidadeIdDaSessao } : {};
}

/**
 * Admin de filial não pode consultar outra filial pelo parâmetro da URL;
 * admin global pode filtrar por qualquer uma.
 */
export function resolverUnidadeConsultada(
  unidadeIdDaSessao: string | null | undefined,
  unidadeIdPedida: string | null | undefined
) {
  return unidadeIdDaSessao ?? unidadeIdPedida ?? null;
}
