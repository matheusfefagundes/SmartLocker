import { NextResponse } from "next/server";

import { comRotaAutenticada } from "@/lib/apiAuth";
import { validarOuResponder400 } from "@/lib/validarOuResponder400";
import { atualizarUsuarioAdminSchema } from "@/schemas/auth";
import {
  atualizarUsuarioPorAdmin,
  listarUsuarios,
} from "@/server/usuarioService";
import { lerPaginacao } from "@/utils/lerPaginacao";

export const dynamic = "force-dynamic";

export const GET = comRotaAutenticada(
  "ADMIN",
  async ({ user }, request: Request) => {
    const { searchParams } = new URL(request.url);
    const resultado = await listarUsuarios(
      {
        busca: searchParams.get("busca")?.trim() || undefined,
        unidadeId: searchParams.get("unidadeId"),
        ...lerPaginacao(searchParams, 10),
      },
      user.unidadeId
    );
    return NextResponse.json(resultado);
  }
);

export const PATCH = comRotaAutenticada(
  "ADMIN",
  async ({ user, ip, userAgent }, request: Request) => {
    const body = await request.json();
    const parsed = atualizarUsuarioAdminSchema.safeParse(body);
    if (!parsed.success) return validarOuResponder400(parsed.error);

    const atualizado = await atualizarUsuarioPorAdmin(parsed.data, {
      operadorId: user.id,
      ip,
      userAgent,
      unidadeIdDoOperador: user.unidadeId,
    });
    return NextResponse.json(atualizado);
  }
);
