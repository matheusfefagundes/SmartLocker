import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { prisma } from "@/lib/prisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { updateArmarioSchema } from "@/schemas/armario";

export const PATCH = comRotaAutenticada(
  "ADMIN",
  async (_contexto, request: Request, { params }: { params: { id: string } }) => {
    const body = await request.json();
    const parsed = updateArmarioSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    try {
      const armario = await prisma.armario.update({
        where: { id: params.id },
        data: { status: parsed.data.status },
      });
      return NextResponse.json(armario);
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2025: { status: 404, mensagem: "Armário não encontrado" },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);

export const DELETE = comRotaAutenticada(
  "ADMIN",
  async (_contexto, _request: Request, { params }: { params: { id: string } }) => {
    try {
      await prisma.armario.delete({ where: { id: params.id } });
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2025: { status: 404, mensagem: "Armário não encontrado" },
        P2003: {
          status: 409,
          mensagem: "Armário possui histórico de uso e não pode ser excluído",
        },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);
