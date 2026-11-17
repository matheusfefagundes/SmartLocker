import type { ValorMonetario } from "@/types/armario";

const FORMATADOR_REAL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function paraNumero(valor: ValorMonetario | null | undefined): number {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
}

export function formatarMoeda(valor: ValorMonetario | null | undefined) {
  return FORMATADOR_REAL.format(paraNumero(valor));
}
