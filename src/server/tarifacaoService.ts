import { Prisma, type PrismaClient, type Tamanho } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/erros";
import { prisma } from "@/lib/prisma";
import type { WebhookPagamentoPixInput } from "@/schemas/operacoes";
import { LIMITE_HORAS_ABANDONO } from "@/utils/date";

/** RN1: a franquia gratuita e o limite de abandono são a mesma regra de 3 horas. */
export const FRANQUIA_GRATUITA_HORAS = LIMITE_HORAS_ABANDONO;

export const TARIFA_HORA_ADICIONAL_POR_TAMANHO: Record<Tamanho, number> = {
  P: 5,
  M: 8,
  G: 12,
};

export interface ResultadoCalculoTarifa {
  horasTotais: number;
  horasExcedentes: number;
  valorCobrado: number;
  statusPagamento: "ISENTO" | "PENDENTE";
  pixTxId: string | null;
  pixCopiaECola: string | null;
}

/**
 * MNT-22: Calcula a franquia gratuita (3h) e horas adicionais por porte do armário.
 */
export function calcularTarifaPorTempoDeUso(
  checkIn: Date,
  checkOut: Date,
  tamanho: Tamanho
): ResultadoCalculoTarifa {
  const duracaoMs = Math.max(0, checkOut.getTime() - checkIn.getTime());
  const horasTotais = duracaoMs / (1000 * 60 * 60);

  if (horasTotais <= FRANQUIA_GRATUITA_HORAS) {
    return {
      horasTotais: Number(horasTotais.toFixed(2)),
      horasExcedentes: 0,
      valorCobrado: 0,
      statusPagamento: "ISENTO",
      pixTxId: null,
      pixCopiaECola: null,
    };
  }

  const horasExcedentes = Math.ceil(horasTotais - FRANQUIA_GRATUITA_HORAS);
  const valorHora = TARIFA_HORA_ADICIONAL_POR_TAMANHO[tamanho];
  const valorCobrado = Number((horasExcedentes * valorHora).toFixed(2));
  const pixTxId = `PIX-SL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const pixCopiaECola = `00020126580014BR.GOV.BCB.PIX0119smartlocker@pix.com520400005303986540${valorCobrado.toFixed(2)}5802BR5911SMARTLOCKER6009JOINVILLE62070503***6304ABCD`;

  return {
    horasTotais: Number(horasTotais.toFixed(2)),
    horasExcedentes,
    valorCobrado,
    statusPagamento: "PENDENTE",
    pixTxId,
    pixCopiaECola,
  };
}

export async function processarWebhookPagamentoPix(
  dados: WebhookPagamentoPixInput,
  cliente: PrismaClient = prisma
) {
  const uso = await cliente.usoArmario.findFirst({
    where: { pixTxId: dados.pixTxId },
    select: { id: true, valorCobrado: true, statusPagamento: true },
  });

  if (!uso) {
    throw new ErroRegraDeNegocio(
      "COBRANCA_NAO_ENCONTRADA",
      "Registro de cobrança PIX não localizado",
      404
    );
  }

  if (uso.statusPagamento === "PAGO") {
    return { usoId: uso.id, statusPagamento: uso.statusPagamento, duplicado: true };
  }

  if (dados.status !== "APROVADO") {
    return { usoId: uso.id, statusPagamento: uso.statusPagamento, duplicado: false };
  }

  const valorPago = new Prisma.Decimal(dados.valorPago);
  if (valorPago.lessThan(uso.valorCobrado)) {
    throw new ErroRegraDeNegocio(
      "VALOR_PAGO_INSUFICIENTE",
      "O valor pago é menor que o valor cobrado",
      422
    );
  }

  const atualizado = await cliente.usoArmario.update({
    where: { id: uso.id },
    data: { statusPagamento: "PAGO", valorPago, pagoEm: new Date() },
    select: { id: true, statusPagamento: true },
  });

  return { usoId: atualizado.id, statusPagamento: atualizado.statusPagamento, duplicado: false };
}
