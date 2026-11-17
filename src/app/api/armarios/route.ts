import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { mapearErroPrisma } from "@/lib/mapearErroPrisma";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import {
  createArmarioSchema,
  statusArmarioSchema,
  tamanhoSchema,
} from "@/schemas/armario";
import { criarArmario, listarArmarios } from "@/server/armarioService";

export const dynamic = "force-dynamic";

const ARMARIO_DUPLICADO = {
  P2002: {
    status: 409,
    mensagem: "Já existe um armário com esse número neste bloco",
  },
};

export const GET = comRotaAutenticada(
  undefined,
  async ({ user }, request: Request) => {
    const { searchParams } = new URL(request.url);
    const tamanho = tamanhoSchema.safeParse(searchParams.get("tamanho"));
    const status = statusArmarioSchema.safeParse(searchParams.get("status"));

    const armarios = await listarArmarios(
      {
        bloco: searchParams.get("bloco"),
        unidadeId: searchParams.get("unidadeId"),
        tamanho: tamanho.success ? tamanho.data : undefined,
        status: status.success ? status.data : undefined,
      },
      user.unidadeId
    );

    return NextResponse.json(armarios);
  }
);

export const POST = comRotaAutenticada(
  "ADMIN",
  async ({ user, ip, userAgent }, request: Request) => {
    const body = await request.json();
    const parsed = createArmarioSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    try {
      const armario = await criarArmario(parsed.data, {
        operadorId: user.id,
        ip,
        userAgent,
        unidadeIdDoOperador: user.unidadeId,
      });
      return NextResponse.json(armario, { status: 201 });
    } catch (error) {
      const respostaPrisma = mapearErroPrisma(error, ARMARIO_DUPLICADO);
      if (respostaPrisma) return respostaPrisma;
      throw error;
    }
  }
);
