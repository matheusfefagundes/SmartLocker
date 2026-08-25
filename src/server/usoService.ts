import type { Prisma, PrismaClient } from "@prisma/client";

import { ErroRegraDeNegocio } from "@/lib/apiAuth";

export function buscarUsoAtivo(
  cliente: PrismaClient | Prisma.TransactionClient,
  userId: string
) {
  return cliente.usoArmario.findFirst({
    where: { userId, checkOut: null },
    include: { armario: true },
  });
}

export async function realizarCheckIn(
  prisma: PrismaClient,
  userId: string,
  armarioId: string
) {
  return prisma.$transaction(async (tx) => {
    const usoAtivo = await buscarUsoAtivo(tx, userId);
    if (usoAtivo) {
      throw new ErroRegraDeNegocio(
        "ALUNO_JA_POSSUI_ARMARIO",
        "Você já possui um armário em uso. Faça o check-out antes de pegar outro.",
        409
      );
    }

    // Update condicional atômico: só "vence" quem encontrar o armário
    // ainda LIVRE, protegendo contra check-in concorrente no mesmo armário.
    const atualizado = await tx.armario.updateMany({
      where: { id: armarioId, status: "LIVRE" },
      data: { status: "OCUPADO" },
    });
    if (atualizado.count === 0) {
      throw new ErroRegraDeNegocio(
        "ARMARIO_INDISPONIVEL",
        "Este armário não está mais disponível",
        409
      );
    }

    return tx.usoArmario.create({
      data: { userId, armarioId },
      include: { armario: true },
    });
  });
}

export async function realizarCheckOut(prisma: PrismaClient, userId: string) {
  return prisma.$transaction(async (tx) => {
    const usoAtivo = await buscarUsoAtivo(tx, userId);
    if (!usoAtivo) {
      throw new ErroRegraDeNegocio(
        "SEM_ARMARIO_ATIVO",
        "Você não possui nenhum armário em uso",
        404
      );
    }

    await tx.armario.update({
      where: { id: usoAtivo.armarioId },
      data: { status: "LIVRE" },
    });

    return tx.usoArmario.update({
      where: { id: usoAtivo.id },
      data: { checkOut: new Date() },
      include: { armario: true },
    });
  });
}
