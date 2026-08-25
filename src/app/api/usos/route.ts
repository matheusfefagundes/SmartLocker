import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada("ADMIN", async (_contexto, request: Request) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const armarioId = searchParams.get("armarioId");
  const ativo = searchParams.get("ativo");

  const where: Prisma.UsoArmarioWhereInput = {};
  if (userId) where.userId = userId;
  if (armarioId) where.armarioId = armarioId;
  if (ativo === "true") where.checkOut = null;
  if (ativo === "false") where.checkOut = { not: null };

  const usos = await prisma.usoArmario.findMany({
    where,
    include: {
      user: { select: { id: true, nome: true, matricula: true } },
      armario: { select: { id: true, numero: true, bloco: true, tamanho: true } },
    },
    orderBy: { checkIn: "desc" },
    take: 200,
  });

  return NextResponse.json(usos);
});
