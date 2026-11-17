import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { registerSchema } from "@/schemas/auth";
import { verificarLimiteDeTaxa } from "@/server/limiteDeTaxaService";
import { extrairPrimeiroIp } from "@/utils/extrairPrimeiroIp";

export async function POST(request: Request) {
  const ip = extrairPrimeiroIp(request.headers.get("x-forwarded-for"));
  const podeTentar = await verificarLimiteDeTaxa(`registro:${ip}`, 3, 600);
  if (!podeTentar) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return validarOuResponder400(parsed.error);

  const { nome, email, matricula, senha, unidadeId } = parsed.data;
  const passwordHash = await bcrypt.hash(senha, 10);

  try {
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        matricula,
        passwordHash,
        role: "ALUNO",
        unidadeId: unidadeId ?? null,
      },
    });

    return NextResponse.json(
      { id: user.id, nome: user.nome, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    const respostaPrisma = mapearErroPrisma(error, {
      P2002: { status: 409, mensagem: "E-mail ou matrícula já cadastrados" },
      P2003: { status: 400, mensagem: "Unidade informada não existe" },
    });
    if (respostaPrisma) return respostaPrisma;
    throw error;
  }
}
