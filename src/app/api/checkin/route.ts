import { NextResponse } from "next/server";

import { handleApiError, requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkInSchema } from "@/schemas/checkin";

export async function POST(request: Request) {
  try {
    const user = await requireUser("ALUNO");

    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { armarioId } = parsed.data;

    const uso = await prisma.$transaction(async (tx) => {
      const usoAtivo = await tx.usoArmario.findFirst({
        where: { userId: user.id, checkOut: null },
      });
      if (usoAtivo) {
        throw new Error("ALUNO_JA_POSSUI_ARMARIO");
      }

      // Update condicional atômico: só "vence" quem encontrar o armário
      // ainda LIVRE, protegendo contra check-in concorrente no mesmo armário.
      const atualizado = await tx.armario.updateMany({
        where: { id: armarioId, status: "LIVRE" },
        data: { status: "OCUPADO" },
      });
      if (atualizado.count === 0) {
        throw new Error("ARMARIO_INDISPONIVEL");
      }

      return tx.usoArmario.create({
        data: { userId: user.id, armarioId },
        include: { armario: true },
      });
    });

    return NextResponse.json(uso, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ALUNO_JA_POSSUI_ARMARIO") {
      return NextResponse.json(
        { error: "Você já possui um armário em uso. Faça o check-out antes de pegar outro." },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === "ARMARIO_INDISPONIVEL") {
      return NextResponse.json(
        { error: "Este armário não está mais disponível" },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}
