import { NextResponse } from "next/server";

import { handleApiError, requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser("ALUNO");

    const usoAtivo = await prisma.usoArmario.findFirst({
      where: { userId: user.id, checkOut: null },
      include: { armario: true },
    });

    return NextResponse.json(usoAtivo);
  } catch (error) {
    return handleApiError(error);
  }
}
