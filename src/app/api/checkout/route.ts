import { NextResponse } from "next/server";

import { handleApiError, requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser("ALUNO");

    const uso = await prisma.$transaction(async (tx) => {
      const usoAtivo = await tx.usoArmario.findFirst({
        where: { userId: user.id, checkOut: null },
      });
      if (!usoAtivo) {
        throw new Error("SEM_ARMARIO_ATIVO");
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

    return NextResponse.json(uso);
  } catch (error) {
    if (error instanceof Error && error.message === "SEM_ARMARIO_ATIVO") {
      return NextResponse.json(
        { error: "Você não possui nenhum armário em uso" },
        { status: 404 }
      );
    }
    return handleApiError(error);
  }
}
