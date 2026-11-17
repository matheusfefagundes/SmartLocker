import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { renovarPinDoUsoAtivo } from "@/server/usoService";

export const POST = comRotaAutenticada("ALUNO", async ({ user }) => {
  const resultado = await renovarPinDoUsoAtivo(prisma, user.id);
  return NextResponse.json(resultado);
});
