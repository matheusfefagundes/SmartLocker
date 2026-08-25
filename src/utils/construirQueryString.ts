export function construirQueryString(filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor) params.set(chave, valor);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
