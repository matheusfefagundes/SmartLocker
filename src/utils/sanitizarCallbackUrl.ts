export function sanitizarCallbackUrl(valor: string | null): string {
  if (!valor) return "/";
  if (!valor.startsWith("/") || valor.startsWith("//")) return "/";
  return valor;
}
