const TAMANHO_MAXIMO_PAGINA = 100;

export function lerPaginacao(
  searchParams: URLSearchParams,
  tamanhoPadrao: number
) {
  const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);
  const tamanhoPagina = Math.min(
    TAMANHO_MAXIMO_PAGINA,
    Math.max(1, Number(searchParams.get("tamanhoPagina")) || tamanhoPadrao)
  );
  return { pagina, tamanhoPagina };
}
