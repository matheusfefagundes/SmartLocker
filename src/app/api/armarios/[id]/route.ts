import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { updateArmarioSchema } from "@/schemas/armario";
import { atualizarArmario, excluirArmario } from "@/server/armarioService";

export const PATCH = comRotaAutenticada(
  "ADMIN",
  async (
    { user, ip, userAgent },
    request: Request,
    { params }: { params: { id: string } }
  ) => {
    const body = await request.json();
    const parsed = updateArmarioSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    try {
      const armario = await atualizarArmario(params.id, parsed.data, {
        operadorId: user.id,
        ip,
        userAgent,
        unidadeIdDoOperador: user.unidadeId,
      });
      return NextResponse.json(armario);
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, {
        P2002: {
          status: 409,
          mensagem: "Já existe um armário com esse número neste bloco",
        },
      });
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);

export const DELETE = comRotaAutenticada(
  "ADMIN",
  async (
    { user, ip, userAgent },
    _request: Request,
    { params }: { params: { id: string } }
  ) => {
    try {
      await excluirArmario(params.id, {
        operadorId: user.id,
        ip,
        userAgent,
        unidadeIdDoOperador: user.unidadeId,
      });
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
