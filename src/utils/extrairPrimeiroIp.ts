export function extrairPrimeiroIp(cabecalhoXForwardedFor: string | null | undefined): string {
  return cabecalhoXForwardedFor?.split(",")[0]?.trim() || "desconhecido";
}
