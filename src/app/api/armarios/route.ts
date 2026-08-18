import { Prisma, StatusArmario, Tamanho } from "@prisma/client";
import { NextResponse } from "next/server";

import { handleApiError, requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createArmarioSchema } from "@/schemas/armario";

export async function GET(request: Request) {
  try {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const bloco = searchParams.get("bloco");
    const tamanho = searchParams.get("tamanho");
    const status = searchParams.get("status");

    const where: Prisma.ArmarioWhereInput = {};
    if (bloco) where.bloco = bloco;
    if (tamanho) where.tamanho = tamanho as Tamanho;
    if (status) where.status = status as StatusArmario;

    const armarios = await prisma.armario.findMany({
      where,
      orderBy: [{ bloco: "asc" }, { numero: "asc" }],
    });

    return NextResponse.json(armarios);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser("ADMIN");

    const body = await request.json();
    const parsed = createArmarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const armario = await prisma.armario.create({ data: parsed.data });
    return NextResponse.json(armario, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um armário com esse número neste bloco" },
        { status: 409 }
      );
    }
    return handleApiError(error);
  }
}
