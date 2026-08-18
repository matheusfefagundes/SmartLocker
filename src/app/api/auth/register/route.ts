import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/schemas/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { nome, email, matricula, senha } = parsed.data;
  const passwordHash = await bcrypt.hash(senha, 10);

  try {
    const user = await prisma.user.create({
      data: { nome, email, matricula, passwordHash, role: "ALUNO" },
    });

    return NextResponse.json(
      { id: user.id, nome: user.nome, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "E-mail ou matrícula já cadastrados" },
        { status: 409 }
      );
    }
    throw error;
  }
}
