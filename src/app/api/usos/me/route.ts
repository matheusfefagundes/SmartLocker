import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { buscarUsoAtivo } from "@/server/usoService";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada("ALUNO", async ({ user }) => {
  const usoAtivo = await buscarUsoAtivo(prisma, user.id);
  return NextResponse.json(usoAtivo);
});
